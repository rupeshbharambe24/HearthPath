# HeartPath Admin Verification Review Setup

The in-app student verification review page is restricted to explicit admin emails.

## Frontend Admin Gate

Set this in your local or deployed frontend environment:

```env
VITE_HEARTPATH_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Only those emails will see:

- `/admin/verifications`
- the `Verification Review` link in the sidebar

## Edge Function Admin Gate

Set this in the Supabase Edge Function environment:

```env
HEARTPATH_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

The review function checks the signed-in user's email against this allowlist before returning any verification submissions.

## Function To Deploy

Deploy:

- `review-student-verifications`

This function is required for:

- loading student ID submissions
- opening signed document previews
- marking submissions as `reviewing`, `verified`, or `rejected`

## Important Reality

- the review page will render only for allowed admin emails
- the function must also be deployed, or the page will not be able to load submissions
- this is an internal review tool, not a public user feature
