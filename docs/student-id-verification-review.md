# HeartPath Student ID Verification Review

HeartPath now supports two student verification paths:

- approved email-domain verification
- manual college ID card verification

This document covers the manual review path for student ID submissions.

## What Users Submit

Users upload a college ID card into the private `verification-documents` storage bucket and create or update their `student_verified` record in `public.user_verifications`.

The relevant record lives in:

- `public.user_verifications`

Look for:

- `verification_type = 'student_verified'`
- `status = 'pending'`
- `metadata.source = 'id_card'`

## Review Decision States

Use these statuses:

- `pending`
- `reviewing`
- `verified`
- `rejected`

## Approve A Submission

```sql
update public.user_verifications
set
  status = 'verified',
  verified_at = now(),
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'reviewed_at', now(),
    'review_decision', 'approved',
    'review_notes', 'Verified against college ID card'
  )
where user_id = 'USER_ID_HERE'
  and verification_type = 'student_verified';
```

Then force the user profile to resync on next load:

```sql
update public.users
set updated_at = now()
where id = 'USER_ID_HERE';
```

## Reject A Submission

```sql
update public.user_verifications
set
  status = 'rejected',
  verified_at = null,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'reviewed_at', now(),
    'review_decision', 'rejected',
    'review_notes', 'Image unclear or college information could not be verified'
  )
where user_id = 'USER_ID_HERE'
  and verification_type = 'student_verified';
```

## Move A Submission Into Review

```sql
update public.user_verifications
set
  status = 'reviewing',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'review_started_at', now()
  )
where user_id = 'USER_ID_HERE'
  and verification_type = 'student_verified';
```

## Locate Pending ID Reviews

```sql
select
  uv.user_id,
  u.name,
  u.college_email,
  uv.status,
  uv.created_at,
  uv.metadata
from public.user_verifications uv
join public.users u on u.id = uv.user_id
where uv.verification_type = 'student_verified'
  and uv.status in ('pending', 'reviewing')
  and coalesce(uv.metadata->>'source', '') = 'id_card'
order by uv.created_at asc;
```

## Important Notes

- uploaded ID cards are private and should never be exposed to normal users
- after approval or rejection, the user can refresh onboarding and see the updated status
- there is currently no admin review UI in the app; this is a database-runbook workflow
- if you want real operations at scale, the next step should be an internal review dashboard
