// supabase/functions/upload-photo-verification/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED = {
  'image/jpeg': 'jpg' as const,
  'image/png': 'png' as const,
  'image/webp': 'webp' as const,
};
const MAX_BYTES = 5 * 1024 * 1024;

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

  const file = form.get('file');
  if (!(file instanceof File)) return json(400, { error: 'Missing file' });

  if (!(file.type in ALLOWED)) {
    return json(415, { error: `Unsupported type ${file.type}. Use JPG/PNG/WebP.` });
  }
  if (file.size > MAX_BYTES) return json(413, { error: 'File too large (max 5 MB)' });
  if (file.size === 0) return json(400, { error: 'Empty file' });

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  const matches =
    (isJpeg && file.type === 'image/jpeg') ||
    (isPng && file.type === 'image/png') ||
    (isWebp && file.type === 'image/webp');
  if (!matches) return json(415, { error: 'File contents do not match declared type' });

  const ext = ALLOWED[file.type as keyof typeof ALLOWED];
  const path = `${user.id}/selfie-${Date.now()}.${ext}`;

  const { error: upErr } = await admin.storage
    .from('photo-verifications')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error('photo-verification upload failed:', upErr);
    return json(500, { error: 'Upload failed' });
  }

  const { error: vErr } = await userClient
    .from('user_verifications')
    .upsert(
      {
        user_id: user.id,
        verification_type: 'photo_verified',
        status: 'pending',
        verified_at: null,
        metadata: { source: 'selfie', document_path: path, uploaded_at: new Date().toISOString() },
      },
      { onConflict: 'user_id,verification_type' }
    );
  if (vErr) {
    console.error('user_verifications upsert failed:', vErr);
    await admin.storage.from('photo-verifications').remove([path]).catch(() => {});
    return json(500, { error: 'Verification record update failed' });
  }

  return json(200, { path });
});
