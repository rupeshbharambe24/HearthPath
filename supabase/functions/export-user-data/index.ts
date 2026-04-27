import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

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
  const uid = user.id;

  // Pull every user-keyed table via admin client (RLS would also work but
  // admin avoids any cross-user join filters preventing complete picture).
  const tables = [
    { name: 'users', filter: (q: any) => q.eq('id', uid) },
    { name: 'relationships', filter: (q: any) => q.or(`user_a.eq.${uid},user_b.eq.${uid}`) },
    { name: 'relationship_permissions', filter: (q: any) => q.or(`granted_by.eq.${uid},granted_to.eq.${uid}`) },
    { name: 'memories', filter: (q: any) => q.eq('created_by', uid) },
    { name: 'weekly_checkins', filter: (q: any) => q.eq('user_id', uid) },
    { name: 'ai_summaries', filter: (q: any) => q.eq('generated_by', uid) },
    { name: 'discovery_actions', filter: (q: any) => q.eq('actor_user_id', uid) },
    { name: 'compatibility_snapshots', filter: (q: any) => q.eq('viewer_user_id', uid) },
    { name: 'messages', filter: (q: any) => q.or(`sender_id.eq.${uid},receiver_id.eq.${uid}`) },
    { name: 'notifications', filter: (q: any) => q.eq('recipient_user_id', uid) },
    { name: 'user_verifications', filter: (q: any) => q.eq('user_id', uid) },
    { name: 'reports', filter: (q: any) => q.eq('reporter_user_id', uid) },
    { name: 'blocked_users', filter: (q: any) => q.or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`) },
  ];

  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user_id: uid,
  };

  for (const t of tables) {
    try {
      const { data, error } = await t.filter(admin.from(t.name).select('*'));
      if (error) {
        console.warn(`export ${t.name} failed:`, error.message);
        out[t.name] = { error: error.message };
        continue;
      }
      out[t.name] = data ?? [];
    } catch (err) {
      console.warn(`export ${t.name} exception:`, err);
      out[t.name] = { error: String(err) };
    }
  }

  return new Response(JSON.stringify(out, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="heartpath-export-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
});
