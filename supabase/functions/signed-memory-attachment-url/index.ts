// supabase/functions/signed-memory-attachment-url/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

interface Body {
  memory_id: string;
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

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || typeof body.memory_id !== 'string') {
    return json(400, { error: 'Invalid request body' });
  }

  // Read memory through the user client — RLS already enforces "member of
  // relationship AND (visibility=shared OR created_by=me)".
  const { data: mem, error: memErr } = await userClient
    .from('memories')
    .select('id, attachment_url, attachment_type, archived_at')
    .eq('id', body.memory_id)
    .maybeSingle();
  if (memErr) return json(500, { error: 'Could not load memory' });
  if (!mem) return json(403, { error: 'Memory not accessible' });
  if (mem.archived_at) return json(404, { error: 'Memory archived' });
  if (!mem.attachment_url) return json(404, { error: 'No attachment' });

  const { data: signed, error: signErr } = await admin.storage
    .from('memory-attachments')
    .createSignedUrl(mem.attachment_url, 60 * 5);
  if (signErr || !signed) return json(500, { error: 'Could not sign URL' });

  return json(200, {
    url: signed.signedUrl,
    attachment_type: mem.attachment_type,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
});
