// supabase/functions/upload-memory-attachment/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED = {
  'image/jpeg': 'image' as const,
  'image/png': 'image' as const,
  'image/webp': 'image' as const,
  'audio/mpeg': 'audio' as const,
  'audio/wav': 'audio' as const,
  'audio/webm': 'audio' as const,
  'audio/ogg': 'audio' as const,
  'application/pdf': 'pdf' as const,
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

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

  const relationshipId = form.get('relationship_id');
  const file = form.get('file');
  if (typeof relationshipId !== 'string') return json(400, { error: 'Missing relationship_id' });
  if (!(file instanceof File)) return json(400, { error: 'Missing file' });

  // Caller must be a member of the relationship (RLS-confirmed).
  const { data: rel, error: relErr } = await userClient
    .from('relationships')
    .select('id, user_a, user_b, lifecycle_state')
    .eq('id', relationshipId)
    .maybeSingle();
  if (relErr) return json(500, { error: 'Could not verify relationship' });
  if (!rel) return json(403, { error: 'Not a member of this relationship' });
  if (['archived', 'cooldown'].includes(rel.lifecycle_state ?? '')) {
    return json(403, { error: 'Relationship not active' });
  }

  if (!(file.type in ALLOWED)) {
    return json(415, { error: `Unsupported type ${file.type}` });
  }
  if (file.size > MAX_BYTES) {
    return json(413, { error: 'File too large (max 10 MB)' });
  }
  if (file.size === 0) return json(400, { error: 'Empty file' });

  // Magic-byte sniff. Read 12 bytes for WebP's RIFF+WEBP check.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  // Audio formats are diverse; trust the declared MIME for audio after the allowlist
  // already filtered it. ID3 (mp3) starts with 49 44 33; Ogg with 4F 67 67 53;
  // webm/EBML with 1A 45 DF A3; raw mp3 may not have a magic header at all.
  const declaredKind = ALLOWED[file.type as keyof typeof ALLOWED];
  const passesSniff =
    declaredKind === 'audio'
      ? true
      : (isJpeg && file.type === 'image/jpeg') ||
        (isPng && file.type === 'image/png') ||
        (isWebp && file.type === 'image/webp') ||
        (isPdf && file.type === 'application/pdf');
  if (!passesSniff) {
    return json(415, { error: 'File contents do not match declared type' });
  }

  // Path: <relationship_id>/<userId>-<timestamp>.<ext>
  const ext =
    file.type === 'image/jpeg' ? 'jpg' :
    file.type === 'image/png' ? 'png' :
    file.type === 'image/webp' ? 'webp' :
    file.type === 'application/pdf' ? 'pdf' :
    file.type === 'audio/mpeg' ? 'mp3' :
    file.type === 'audio/wav' ? 'wav' :
    file.type === 'audio/ogg' ? 'ogg' :
    file.type === 'audio/webm' ? 'webm' :
    'bin';
  const path = `${relationshipId}/${user.id}-${Date.now()}.${ext}`;

  const { error: upErr } = await admin.storage
    .from('memory-attachments')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error('memory-attachment upload failed:', upErr);
    return json(500, { error: 'Upload failed' });
  }

  return json(200, { path, attachment_type: declaredKind });
});
