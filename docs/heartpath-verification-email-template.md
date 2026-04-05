# HeartPath Verification Email Template

HeartPath uses Supabase Auth for signup verification emails. The email body, subject, sender name, and template styling are **not controlled by the React website code**. They must be configured in the Supabase dashboard.

Use this for the `Confirm signup` template.

## Where To Configure It

In Supabase:

1. Open your project dashboard
2. Go to `Authentication`
3. Open `Email Templates`
4. Select `Confirm signup`
5. Replace the existing subject and HTML body

Official reference:
- Supabase Auth email templates: [Supabase docs](https://supabase.com/docs/guides/auth/auth-email-templates)

## Recommended Subject

`Verify your college email for HeartPath`

## Recommended Sender Name

`HeartPath`

## HTML Template

The production-ready HTML template is saved here:

- [heartpath-confirm-signup-email.html](D:/Projects/CollegeLoveLink/heart-surface-connect/docs/email-templates/heartpath-confirm-signup-email.html)

It uses the official Supabase template variable:

- `{{ .ConfirmationURL }}`

## Important Notes

- The current app already sets the verification redirect to:
  - `/onboarding`
- That means once the user confirms their email, they are routed back into HeartPath onboarding.
- If you want the email subject/body to look professional, you must update it in Supabase Dashboard. Code changes in the website alone will not change the inbox email.
- If you later want custom sender branding, configure your SMTP provider and sender identity in Supabase as well.
