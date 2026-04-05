import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

type ReviewRequest =
  | {
      mode: 'list';
    }
  | {
      mode: 'update';
      targetUserId: string;
      status: 'reviewing' | 'verified' | 'rejected';
      notes?: string;
    };

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const getAdminEmails = () =>
  (Deno.env.get('HEARTPATH_ADMIN_EMAILS') || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed.' });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = request.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return json(500, { success: false, error: 'Missing Supabase environment configuration.' });
    }

    if (!authHeader) {
      return json(401, { success: false, error: 'Missing authorization header.' });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user?.email) {
      return json(401, { success: false, error: 'Unable to verify the current admin user.' });
    }

    const adminEmails = getAdminEmails();
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return json(403, { success: false, error: 'This account is not allowed to review student verifications.' });
    }

    const payload = (await request.json().catch(() => ({}))) as ReviewRequest;

    if (payload.mode === 'list') {
      const { data: verificationRows, error: verificationError } = await adminClient
        .from('user_verifications')
        .select('*')
        .eq('verification_type', 'student_verified')
        .in('status', ['pending', 'reviewing', 'rejected'])
        .order('created_at', { ascending: true });

      if (verificationError) {
        console.error('Error loading student verifications:', verificationError);
        return json(500, { success: false, error: 'Unable to load student verification submissions.' });
      }

      const idCardRows = (verificationRows || []).filter((row) => {
        const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : null;
        return metadata?.source === 'id_card';
      });

      const userIds = Array.from(new Set(idCardRows.map((row) => row.user_id)));
      const { data: userRows, error: userError } = await adminClient
        .from('users')
        .select('id, name, college_email, college_name, branch, year')
        .in('id', userIds);

      if (userError) {
        console.error('Error loading student verification users:', userError);
        return json(500, { success: false, error: 'Unable to load user details for verification review.' });
      }

      const usersById = new Map((userRows || []).map((row) => [row.id, row]));

      const submissions = await Promise.all(
        idCardRows.map(async (row) => {
          const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {};
          const documentPath = typeof metadata.document_path === 'string' ? metadata.document_path : null;

          let signedUrl: string | null = null;
          if (documentPath) {
            const { data } = await adminClient.storage
              .from('verification-documents')
              .createSignedUrl(documentPath, 60 * 60);
            signedUrl = data?.signedUrl || null;
          }

          return {
            verification: row,
            user: usersById.get(row.user_id) || null,
            documentPath,
            signedUrl,
          };
        })
      );

      return json(200, { success: true, submissions });
    }

    if (payload.mode === 'update') {
      if (!payload.targetUserId) {
        return json(400, { success: false, error: 'Missing target user id.' });
      }

      const now = new Date().toISOString();
      const { data: existing, error: existingError } = await adminClient
        .from('user_verifications')
        .select('*')
        .eq('user_id', payload.targetUserId)
        .eq('verification_type', 'student_verified')
        .maybeSingle();

      if (existingError || !existing) {
        console.error('Error loading verification for update:', existingError);
        return json(404, { success: false, error: 'Student verification record not found.' });
      }

      const metadata = existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {};

      const { error: updateError } = await adminClient
        .from('user_verifications')
        .update({
          status: payload.status,
          verified_at: payload.status === 'verified' ? now : null,
          metadata: {
            ...metadata,
            source: 'id_card',
            reviewed_at: now,
            reviewed_by: user.email,
            review_notes: payload.notes?.trim() || null,
            review_decision: payload.status,
          },
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating verification review:', updateError);
        return json(500, { success: false, error: 'Unable to update this verification record.' });
      }

      return json(200, { success: true });
    }

    return json(400, { success: false, error: 'Unsupported review request.' });
  } catch (error) {
    console.error('Unexpected review-student-verifications function error:', error);
    return json(500, { success: false, error: 'Unexpected server error while reviewing student verifications.' });
  }
});
