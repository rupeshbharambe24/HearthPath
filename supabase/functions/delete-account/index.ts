import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

type DeleteAccountPayload = {
  confirmation?: string;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

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

    const payload = (await request.json().catch(() => ({}))) as DeleteAccountPayload;
    if ((payload.confirmation || '').trim().toLowerCase() !== 'delete') {
      return json(400, { success: false, error: 'Type "delete" to confirm account deletion.' });
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

    if (authError || !user) {
      return json(401, { success: false, error: 'Unable to verify the current user.' });
    }

    const bucket = 'profile-photos';

    const { data: storedFiles, error: listError } = await adminClient.storage
      .from(bucket)
      .list(user.id, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

    if (listError && !listError.message.toLowerCase().includes('not found')) {
      console.error('Error listing stored profile files:', listError);
      return json(500, { success: false, error: 'Unable to prepare storage cleanup.' });
    }

    const storagePaths =
      storedFiles?.filter((item) => item.name && item.name !== '.emptyFolderPlaceholder').map((item) => `${user.id}/${item.name}`) || [];

    if (storagePaths.length > 0) {
      const { error: removeStorageError } = await adminClient.storage.from(bucket).remove(storagePaths);
      if (removeStorageError) {
        console.error('Error removing stored profile files:', removeStorageError);
        return json(500, { success: false, error: 'Unable to remove stored profile files.' });
      }
    }

    const { error: blockedUsersError } = await adminClient
      .from('blocked_users')
      .delete()
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

    if (blockedUsersError) {
      console.error('Error removing block records:', blockedUsersError);
      return json(500, { success: false, error: 'Unable to remove blocked-user records.' });
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return json(500, { success: false, error: 'Unable to delete this account.' });
    }

    return json(200, { success: true });
  } catch (error) {
    console.error('Unexpected delete-account function error:', error);
    return json(500, { success: false, error: 'Unexpected server error while deleting the account.' });
  }
});
