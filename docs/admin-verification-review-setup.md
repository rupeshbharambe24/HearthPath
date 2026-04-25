# HeartPath Admin Verification Review Setup

The in-app student verification review page is restricted to users granted the
admin role server-side. Admin role lookup runs through the
`public.is_admin()` `SECURITY DEFINER` RPC against the `public.admin_users`
table.

## On rollout — seed existing admins immediately

The Phase 1 migration (`20260425180000_admin_users.sql`) creates the
`admin_users` table empty. Anyone who was an admin via the legacy env-var
allowlist **loses access the moment the migration applies** until they are
inserted into the table. To avoid an outage:

1. **Before** running `supabase db push` for the Phase 1 migrations, list
   every email that was in the previous `HEARTPATH_ADMIN_EMAILS` env var.
2. Run the migration.
3. Immediately seed those users:
     ```sql
     INSERT INTO public.admin_users (user_id, notes)
     SELECT id, 'Phase 1 bootstrap'
     FROM public.users
     WHERE college_email = ANY(ARRAY['admin1@example.com','admin2@example.com']);
     ```
4. Confirm with `SELECT count(*) FROM public.admin_users;`.

## Granting admin access (Phase 1+)

Admin role is now stored in the `admin_users` table. To grant access:

1. Look up the user's id:
     SELECT id FROM public.users WHERE college_email = 'admin@example.com';
2. Insert into admin_users:
     INSERT INTO public.admin_users (user_id, notes)
       VALUES ('<that-uuid>', 'Initial admin bootstrap');
3. To revoke:
     DELETE FROM public.admin_users WHERE user_id = '<uuid>';

The legacy `HEARTPATH_ADMIN_EMAILS` and `VITE_HEARTPATH_ADMIN_EMAILS`
env vars are no longer consulted by the running app.

## Frontend Admin Gate

The frontend calls `supabase.rpc('is_admin')` (via the `useIsAdmin` React Query
hook in `src/hooks/useIsAdmin.ts`). Only users present in `admin_users` will
see:

- `/admin/verifications`
- the `Verifications` link in the sidebar

## Edge Function Admin Gate

The `review-student-verifications` edge function invokes `is_admin()` against
the user-scoped Supabase client (so `auth.uid()` resolves to the caller). Any
caller who is not present in `admin_users` receives a 403 before submissions
are loaded or updates are applied.

## Function To Deploy

Deploy:

- `review-student-verifications`

This function is required for:

- loading student ID submissions
- opening signed document previews
- marking submissions as `reviewing`, `verified`, or `rejected`

## Important Reality

- the review page will render only for users in `admin_users`
- the function must also be deployed, or the page will not be able to load submissions
- this is an internal review tool, not a public user feature
