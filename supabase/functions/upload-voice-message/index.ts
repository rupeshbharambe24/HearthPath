// supabase/functions/upload-voice-message/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const VOICE_NOTES_REQUIRED_STAGE = 3;

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

  let form: FormData | null = null;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: 'Expected multipart/form-data' });
  }

  const receiverId = form.get('receiver_id');
  const file = form.get('file');
  if (typeof receiverId !== 'string') return json(400, { error: 'Missing receiver_id' });
  if (!(file instanceof File)) return json(400, { error: 'Missing file' });

  // 1. Confirm an active relationship exists at stage >=3.
  const { data: rel, error: relErr } = await userClient
    .from('relationships')
    .select('id, user_a, user_b, current_stage, lifecycle_state')
    .or(`and(user_a.eq.${user.id},user_b.eq.${receiverId}),and(user_a.eq.${receiverId},user_b.eq.${user.id})`)
    .maybeSingle();
  if (relErr) return json(500, { error: 'Could not verify relationship' });
  if (!rel) return json(403, { error: 'No active relationship with receiver' });
  if (['archived', 'cooldown', 'paused', 'pending'].includes(rel.lifecycle_state ?? '')) {
    return json(403, { error: 'Relationship not in an active state' });
  }
  if ((rel.current_stage ?? 1) < VOICE_NOTES_REQUIRED_STAGE) {
    return json(403, { error: `Voice notes require stage ${VOICE_NOTES_REQUIRED_STAGE}` });
  }

  // 2. Confirm receiver has granted voice_notes permission to the sender.
  const { data: perm, error: permErr } = await userClient
    .from('relationship_permissions')
    .select('id')
    .eq('relationship_id', rel.id)
    .eq('permission', 'voice_notes')
    .eq('granted_by', receiverId)
    .eq('granted_to', user.id)
    .is('revoked_at', null)
    .maybeSingle();
  if (permErr) return json(500, { error: 'Permission lookup failed' });
  if (!perm) return json(403, { error: 'Receiver has not granted voice_notes permission' });

  // 3. Validate file shape.
  if (!ALLOWED.has(file.type)) {
    return json(415, { error: `Unsupported audio type ${file.type}` });
  }
  if (file.size > MAX_BYTES) {
    return json(413, { error: 'Voice note too large (max 5 MB)' });
  }
  if (file.size === 0) return json(400, { error: 'Empty file' });

  // 4. Upload via service role.
  const ext =
    file.type === 'audio/webm' ? 'webm' :
    file.type === 'audio/mp4' ? 'm4a' :
    file.type === 'audio/mpeg' ? 'mp3' :
    file.type === 'audio/wav' ? 'wav' :
    'ogg';
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await admin.storage
    .from('voice-messages')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error('voice-message upload failed:', upErr);
    return json(500, { error: 'Upload failed' });
  }

  // 5. Insert the message row via the user client so RLS gates the insert.
  const { data: row, error: insErr } = await userClient
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: path,
      content_type: 'voice',
    })
    .select('*')
    .single();

  if (insErr || !row) {
    // Best-effort: remove the orphan blob.
    await admin.storage.from('voice-messages').remove([path]).catch(() => {});
    console.error('voice-message message insert failed:', insErr);
    return json(500, { error: 'Could not record message' });
  }

  return json(200, { message: row });
});
