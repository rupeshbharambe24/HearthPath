// Validates and stores student-id verification uploads for HeartPath.
//
// After Task 7 of the Phase 1 security hardening, the verification-documents
// bucket no longer accepts client-side INSERT/UPDATE/DELETE. The only path
// for adding a document is through this edge function, which enforces:
//   - MIME allowlist (image/jpeg, image/png, image/webp, application/pdf)
//   - <= 5 MB size cap
//   - Magic-byte sniff (defense in depth: clients can lie about MIME)
//   - Cross-check that the declared MIME matches the magic bytes
// On success the function uploads with the service role and upserts a
// pending user_verifications row, then returns the storage path so the
// client can update its UI / persist additional metadata if needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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
  if (!ALLOWED_MIMES.has(file.type)) {
    return json(415, { error: `Unsupported type ${file.type}. Use JPG/PNG/WebP/PDF.` });
  }
  if (file.size > MAX_BYTES) return json(413, { error: 'File too large (max 5 MB)' });
  if (file.size === 0) return json(400, { error: 'Empty file' });

  // Magic-byte sniff (defense in depth — clients can lie about MIME). Read 12
  // bytes so the WebP check can also verify the "WEBP" sub-chunk at offset 8;
  // RIFF alone matches WAV/AVI/etc. and is not specific enough.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && // "RIFF"
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50; // "WEBP"
  if (!(isJpeg || isPng || isPdf || isWebp)) {
    return json(415, { error: 'File contents do not match a supported image/PDF format' });
  }

  // Cross-check: declared MIME must agree with magic bytes.
  const matches =
    (isJpeg && file.type === 'image/jpeg') ||
    (isPng && file.type === 'image/png') ||
    (isPdf && file.type === 'application/pdf') ||
    (isWebp && file.type === 'image/webp');
  if (!matches) return json(415, { error: 'File MIME does not match its contents' });

  const ext = isPdf ? 'pdf' : isPng ? 'png' : isWebp ? 'webp' : 'jpg';
  const path = `${user.id}/student-id-${Date.now()}.${ext}`;

  const { error: upErr } = await admin.storage
    .from('verification-documents')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error('verification-doc upload failed:', upErr);
    return json(500, { error: 'Upload failed' });
  }

  // Mark verification as pending review. The client may follow up with a
  // richer upsert (same conflict key) that adds submitted_college_name /
  // notes / file_name — that's intentional and idempotent.
  const { error: vErr } = await admin
    .from('user_verifications')
    .upsert(
      {
        user_id: user.id,
        verification_type: 'student_verified',
        status: 'pending',
        verified_at: null,
        metadata: {
          source: 'id_card',
          document_path: path,
          uploaded_at: new Date().toISOString(),
        },
      },
      { onConflict: 'user_id,verification_type' }
    );
  if (vErr) {
    console.error('user_verifications upsert failed:', vErr);
    // Best-effort: leave the file uploaded (admin can still triage); but report error.
    return json(500, { error: 'Verification record update failed' });
  }

  return json(200, { path });
});
