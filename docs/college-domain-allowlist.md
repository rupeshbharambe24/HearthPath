# HeartPath College Domain Allowlist Runbook

Use this runbook to add approved college email domains for HeartPath signup.

## What the allowlist does

- signup is blocked unless the email domain exists in `public.college_domains`
- confirmed users are marked `student_verified` only when their domain is active
- access state is recomputed through `public.sync_user_access_state()`

## Add a new domain

Run SQL in Supabase:

```sql
insert into public.college_domains (domain, college_name, status)
values ('example.edu', 'Example University', 'active')
on conflict (domain) do update
set
  college_name = excluded.college_name,
  status = excluded.status;
```

## Disable a domain

```sql
update public.college_domains
set status = 'inactive'
where domain = 'example.edu';
```

## Re-sync affected users

Users will be re-synced on next authenticated session load. If needed, ask the user to sign out and sign back in.

## Recommendations

- add the official primary student email domain for each college
- keep domains lowercase
- use the institution’s user-facing college name for `college_name`
- avoid adding broad public mail domains
