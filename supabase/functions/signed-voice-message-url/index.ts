// supabase/functions/signed-voice-message-url/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

interface Body { message_id: string; }

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
  if (!body || typeof body.message_id !== 'string') return json(400, { error: 'Invalid request' });

  // RLS already enforces sender_id OR receiver_id matches caller.
  const { data: msg, error: msgErr } = await userClient
    .from('messages')
    .select('id, content, content_type, sender_id, receiver_id')
    .eq('id', body.message_id)
    .maybeSingle();
  if (msgErr) return json(500, { error: 'Could not load message' });
  if (!msg) return json(403, { error: 'Message not accessible' });
  if (msg.content_type !== 'voice' || !msg.content) return json(404, { error: 'Not a voice message' });

  const { data: signed, error: signErr } = await admin.storage
    .from('voice-messages')
    .createSignedUrl(msg.content, 60 * 5);
  if (signErr || !signed) return json(500, { error: 'Could not sign URL' });

  return json(200, {
    url: signed.signedUrl,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
});
