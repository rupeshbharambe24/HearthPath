// supabase/functions/review-photo-verifications/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

type ReviewRequest =
  | { mode: 'list' }
  | {
      mode: 'update';
      targetUserId: string;
      status: 'reviewing' | 'verified' | 'rejected';
      notes?: string;
    };

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anon || !srk) return json(500, { error: 'Missing Supabase env.' });

  const auth = request.headers.get('Authorization');
  if (!auth) return json(401, { error: 'Missing authorization header.' });

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, srk, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user?.email) return json(401, { error: 'Unable to verify the current user.' });

  const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
  if (adminErr || !isAdmin) return json(403, { error: 'Admin access required.' });

  const payload = (await request.json().catch(() => ({}))) as ReviewRequest;

  if (payload.mode === 'list') {
    const { data: rows, error: rowsErr } = await admin
      .from('user_verifications')
      .select('*')
      .eq('verification_type', 'photo_verified')
      .in('status', ['pending', 'reviewing', 'rejected'])
      .order('created_at', { ascending: true });
    if (rowsErr) return json(500, { error: 'Could not load submissions.' });

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: users } = await admin
      .from('users')
      .select('id, name, college_email, college_name, branch, year')
      .in('id', userIds);
    const usersById = new Map((users ?? []).map((u) => [u.id, u]));

    const submissions = await Promise.all(
      (rows ?? []).map(async (row) => {
        const meta = (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata))
          ? (row.metadata as Record<string, unknown>)
          : {};
        const selfiePath = typeof meta.document_path === 'string' ? meta.document_path : null;
        let selfieUrl: string | null = null;
        if (selfiePath) {
          const { data } = await admin.storage
            .from('photo-verifications')
            .createSignedUrl(selfiePath, 60 * 30);
          selfieUrl = data?.signedUrl || null;
        }

        const { data: idRow } = await admin
          .from('user_verifications')
          .select('metadata')
          .eq('user_id', row.user_id)
          .eq('verification_type', 'student_verified')
          .maybeSingle();
        const idMeta = (idRow?.metadata && typeof idRow.metadata === 'object' && !Array.isArray(idRow.metadata))
          ? (idRow.metadata as Record<string, unknown>)
          : {};
        const idPath = typeof idMeta.document_path === 'string' ? idMeta.document_path : null;
        let idCardUrl: string | null = null;
        if (idPath) {
          const { data } = await admin.storage
            .from('verification-documents')
            .createSignedUrl(idPath, 60 * 30);
          idCardUrl = data?.signedUrl || null;
        }

        return {
          verification: row,
          user: usersById.get(row.user_id) || null,
          selfieUrl,
          idCardUrl,
        };
      })
    );

    return json(200, { submissions });
  }

  if (payload.mode === 'update') {
    if (!payload.targetUserId) return json(400, { error: 'Missing target user id.' });

    const { data: existing, error: existingErr } = await admin
      .from('user_verifications')
      .select('*')
      .eq('user_id', payload.targetUserId)
      .eq('verification_type', 'photo_verified')
      .maybeSingle();
    if (existingErr || !existing) return json(404, { error: 'Photo verification not found.' });

    const now = new Date().toISOString();
    const meta = (existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata))
      ? (existing.metadata as Record<string, unknown>)
      : {};

    const { error: updErr } = await admin
      .from('user_verifications')
      .update({
        status: payload.status,
        verified_at: payload.status === 'verified' ? now : null,
        metadata: {
          ...meta,
          source: 'selfie',
          reviewed_at: now,
          reviewed_by: user.email,
          review_notes: payload.notes?.trim() || null,
          review_decision: payload.status,
        },
      })
      .eq('id', existing.id);
    if (updErr) return json(500, { error: 'Could not update verification.' });

    // Sync verification_badges.photo_verified.
    const { data: target } = await admin
      .from('users')
      .select('verification_badges')
      .eq('id', payload.targetUserId)
      .maybeSingle();
    const badges = (target?.verification_badges && typeof target.verification_badges === 'object' && !Array.isArray(target.verification_badges))
      ? (target.verification_badges as Record<string, unknown>)
      : {};
    const nextBadges = { ...badges, photo_verified: payload.status === 'verified' };
    const { error: badgeErr } = await admin
      .from('users')
      .update({ verification_badges: nextBadges })
      .eq('id', payload.targetUserId);
    if (badgeErr) console.warn('badge flip failed:', badgeErr);

    return json(200, { success: true });
  }

  return json(400, { error: 'Unsupported review request.' });
});
