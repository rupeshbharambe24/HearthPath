import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

type Body = { targetUserId: string; level: 1 | 2 | 3 | 4 };

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !srk) return json(500, { error: 'Missing Supabase env' });

  const auth = request.headers.get('Authorization');
  if (!auth) return json(401, { error: 'Missing authorization' });

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, srk, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return json(401, { error: 'Auth failed' });

  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body || typeof body.targetUserId !== 'string' || ![1, 2, 3, 4].includes(body.level)) {
    return json(400, { error: 'Invalid request' });
  }

  const { data: allowed, error: rpcError } = await userClient.rpc('viewer_can_see_photo_level', {
    p_target: body.targetUserId,
    p_level: body.level,
  });
  if (rpcError) return json(500, { error: 'Authorization check failed' });
  if (!allowed) return json(403, { error: 'Not permitted' });

  const { data: targetRow, error: targetErr } = await admin
    .from('users')
    .select('photo_levels')
    .eq('id', body.targetUserId)
    .single();
  if (targetErr || !targetRow) return json(404, { error: 'Target not found' });

  const path = (targetRow.photo_levels as Record<string, unknown>)?.[`level_${body.level}`];
  if (typeof path !== 'string' || path.length === 0) return json(404, { error: 'Photo not set' });

  const { data: signed, error: signErr } = await admin.storage
    .from('profile-photos')
    .createSignedUrl(path, 60 * 5);
  if (signErr || !signed) return json(500, { error: 'Could not sign URL' });

  return json(200, { url: signed.signedUrl, expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() });
});
