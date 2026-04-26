// supabase/functions/generate-ai-summary/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getLLMProvider } from '../_shared/llm/selector.ts';
import {
  buildMonthlyRecapPrompt,
  buildMilestoneSummaryPrompt,
  buildMemorySearchPrompt,
  type SummaryKind,
} from '../_shared/llm/prompts.ts';
import { LLMError } from '../_shared/llm/types.ts';

interface RequestBody {
  relationship_id: string;
  kind: SummaryKind;
  source_scope: 'private' | 'shared';
  /** Required when kind = 'memory_search'. */
  query?: string;
  /** When true, ignore the cache and force a fresh LLM call. */
  refresh?: boolean;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(500, { error: 'Missing Supabase env' });
  }

  const auth = request.headers.get('Authorization');
  if (!auth) return json(401, { error: 'Missing authorization' });

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json(401, { error: 'Auth failed' });

  const body = (await request.json().catch(() => null)) as RequestBody | null;
  if (!body || !body.relationship_id || !body.kind || !body.source_scope) {
    return json(400, { error: 'Invalid request body' });
  }
  if (!['monthly_recap', 'milestone_summary', 'memory_search'].includes(body.kind)) {
    return json(400, { error: 'Unsupported kind' });
  }
  if (!['private', 'shared'].includes(body.source_scope)) {
    return json(400, { error: 'Unsupported source_scope' });
  }
  if (body.kind === 'memory_search' && !body.query) {
    return json(400, { error: 'query is required for memory_search' });
  }

  // 1. Fetch the relationship row through the user client. RLS confirms
  //    the caller is a member; if not, this returns no rows.
  const { data: rel, error: relErr } = await userClient
    .from('relationships')
    .select('id, user_a, user_b, current_stage, lifecycle_state')
    .eq('id', body.relationship_id)
    .maybeSingle();
  if (relErr) return json(500, { error: 'Could not load relationship' });
  if (!rel) return json(403, { error: 'Not a member of this relationship' });
  if (['archived', 'cooldown'].includes(rel.lifecycle_state ?? '')) {
    return json(403, { error: 'Relationship not active' });
  }

  // 2. For shared scope: enforce ai_shared_recap_access permission both ways.
  if (body.source_scope === 'shared') {
    const { data: perms, error: permErr } = await userClient
      .from('relationship_permissions')
      .select('granted_to, revoked_at')
      .eq('relationship_id', rel.id)
      .eq('permission', 'ai_shared_recap_access')
      .is('revoked_at', null);
    if (permErr) return json(500, { error: 'Permission lookup failed' });
    const grantedToBoth = new Set((perms ?? []).map((p) => p.granted_to)).size;
    if (grantedToBoth < 2) {
      return json(403, {
        error: 'Shared AI access requires ai_shared_recap_access granted to both partners',
      });
    }
  }

  // 3. Server-side daily rate limit per generator.
  const { count: todays, error: rateErr } = await admin
    .from('ai_summaries')
    .select('*', { count: 'exact', head: true })
    .eq('generated_by', user.id)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (rateErr) return json(500, { error: 'Rate-limit lookup failed' });
  if ((todays ?? 0) >= 10) {
    return json(429, { error: 'Daily AI summary limit (10) reached' });
  }

  // 4. Fetch the data the LLM will see. Choice of source is kind-specific.
  const inputCollect = await collectSourceData(userClient, body, rel.id);
  if ('error' in inputCollect) return json(500, { error: inputCollect.error });
  const { memories, checkins } = inputCollect;

  // 5. Compute cache hash and check ai_summaries for an existing match.
  const inputHash = await computeInputHash(body, memories, checkins);
  if (!body.refresh) {
    const { data: cached } = await admin
      .from('ai_summaries')
      .select('*')
      .eq('relationship_id', rel.id)
      .eq('summary_kind', body.kind)
      .eq('source_scope', body.source_scope)
      .eq('metadata->>input_hash', inputHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      return json(200, { row: cached, cached: true });
    }
  }

  // 6. Build prompt and call the provider.
  const provider = getLLMProvider();
  let prompt: { system: string; user: string };
  switch (body.kind) {
    case 'monthly_recap': {
      const windowEnd = new Date();
      const windowStart = new Date(windowEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
      prompt = buildMonthlyRecapPrompt({
        memories,
        checkins,
        windowStart: windowStart.toISOString().slice(0, 10),
        windowEnd: windowEnd.toISOString().slice(0, 10),
      });
      break;
    }
    case 'milestone_summary':
      prompt = buildMilestoneSummaryPrompt({
        memories,
        currentStage: rel.current_stage ?? 1,
      });
      break;
    case 'memory_search':
      prompt = buildMemorySearchPrompt({ query: body.query!, memories });
      break;
  }

  let completion;
  try {
    completion = await provider.complete({
      system: prompt.system,
      user: prompt.user,
      temperature: 0.4,
      maxTokens: 600,
    });
  } catch (err) {
    if (err instanceof LLMError) {
      console.error('LLM call failed:', err.message, err.status);
      return json(502, { error: 'Summary generation failed' });
    }
    throw err;
  }

  // 7. Persist via admin client.
  const title =
    body.kind === 'monthly_recap'
      ? 'Monthly recap'
      : body.kind === 'milestone_summary'
      ? 'Milestone summary'
      : 'Memory search';

  const { data: row, error: insertErr } = await admin
    .from('ai_summaries')
    .insert({
      relationship_id: rel.id,
      generated_by: user.id,
      summary_kind: body.kind,
      source_scope: body.source_scope,
      visibility: body.source_scope, // shared → visible to both
      title,
      summary: completion.text,
      metadata: {
        input_hash: inputHash,
        provider: completion.provider,
        model: completion.model,
        input_tokens: completion.inputTokens,
        output_tokens: completion.outputTokens,
        finish_reason: completion.finishReason,
        memory_ids: memories.map((m) => m.id),
        checkin_count: checkins.length,
        query: body.kind === 'memory_search' ? body.query : null,
      },
    })
    .select('*')
    .single();

  if (insertErr || !row) {
    console.error('Insert ai_summary failed:', insertErr);
    return json(500, { error: 'Could not save summary' });
  }

  return json(200, { row, cached: false });
});

interface CollectedMemory {
  id: string;
  created_at: string;
  entry_type: string;
  mood: string | null;
  memo_text: string;
}

interface CollectedCheckin {
  week_start: string;
  rating: number;
  note: string | null;
  gratitude: string | null;
}

async function collectSourceData(
  client: ReturnType<typeof createClient>,
  body: RequestBody,
  relationshipId: string
): Promise<
  | { memories: CollectedMemory[]; checkins: CollectedCheckin[] }
  | { error: string }
> {
  const visibilityFilter = body.source_scope === 'shared' ? ['shared'] : ['private', 'shared'];

  if (body.kind === 'monthly_recap') {
    const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [memRes, ckRes] = await Promise.all([
      client
        .from('memories')
        .select('id, created_at, entry_type, mood, memo_text, visibility')
        .eq('relationship_id', relationshipId)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: false })
        .limit(60),
      client
        .from('weekly_checkins')
        .select('week_start, relationship_rating, relationship_note, gratitude_note, visibility')
        .eq('relationship_id', relationshipId)
        .gte('week_start', windowStart.slice(0, 10))
        .order('week_start', { ascending: false })
        .limit(8),
    ]);
    if (memRes.error) return { error: memRes.error.message };
    if (ckRes.error) return { error: ckRes.error.message };
    return {
      memories: (memRes.data ?? [])
        // deno-lint-ignore no-explicit-any
        .filter((m: any) => visibilityFilter.includes(m.visibility))
        // deno-lint-ignore no-explicit-any
        .map((m: any) => ({
          id: m.id,
          created_at: m.created_at,
          entry_type: m.entry_type,
          mood: m.mood,
          memo_text: m.memo_text ?? '',
        })),
      checkins: (ckRes.data ?? [])
        // deno-lint-ignore no-explicit-any
        .filter((c: any) => visibilityFilter.includes(c.visibility))
        // deno-lint-ignore no-explicit-any
        .map((c: any) => ({
          week_start: c.week_start,
          rating: c.relationship_rating,
          note: c.relationship_note,
          gratitude: c.gratitude_note,
        })),
    };
  }

  if (body.kind === 'milestone_summary') {
    const memRes = await client
      .from('memories')
      .select('id, created_at, entry_type, mood, memo_text, visibility')
      .eq('relationship_id', relationshipId)
      .eq('entry_type', 'milestone')
      .order('created_at', { ascending: true })
      .limit(40);
    if (memRes.error) return { error: memRes.error.message };
    return {
      memories: (memRes.data ?? [])
        // deno-lint-ignore no-explicit-any
        .filter((m: any) => visibilityFilter.includes(m.visibility))
        // deno-lint-ignore no-explicit-any
        .map((m: any) => ({
          id: m.id,
          created_at: m.created_at,
          entry_type: m.entry_type,
          mood: m.mood,
          memo_text: m.memo_text ?? '',
        })),
      checkins: [],
    };
  }

  // memory_search: keyword pre-filter (deterministic), then LLM ranks/explains.
  const q = (body.query ?? '').toLowerCase();
  const memRes = await client
    .from('memories')
    .select('id, created_at, entry_type, mood, memo_text, visibility')
    .eq('relationship_id', relationshipId)
    .order('created_at', { ascending: false })
    .limit(120);
  if (memRes.error) return { error: memRes.error.message };
  const candidates = (memRes.data ?? [])
    // deno-lint-ignore no-explicit-any
    .filter((m: any) => visibilityFilter.includes(m.visibility))
    // deno-lint-ignore no-explicit-any
    .filter((m: any) => {
      const blob = `${m.memo_text ?? ''} ${m.entry_type ?? ''} ${m.mood ?? ''}`.toLowerCase();
      return q.split(/\s+/).every((word) => !word || blob.includes(word));
    })
    .slice(0, 25);
  return {
    memories: candidates.map((m: CollectedMemory) => ({
      id: m.id,
      created_at: m.created_at,
      entry_type: m.entry_type,
      mood: m.mood,
      memo_text: m.memo_text ?? '',
    })),
    checkins: [],
  };
}

async function computeInputHash(
  body: RequestBody,
  memories: CollectedMemory[],
  checkins: CollectedCheckin[]
): Promise<string> {
  const memoryIds = memories.map((m) => m.id).sort();
  const checkinKeys = checkins
    .map((c) => `${c.week_start}:${c.rating}`)
    .sort();
  const seed = JSON.stringify({
    kind: body.kind,
    scope: body.source_scope,
    query: body.kind === 'memory_search' ? body.query : null,
    memory_ids: memoryIds,
    checkin_keys: checkinKeys,
  });
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
