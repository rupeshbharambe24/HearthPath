# HeartPath Phase 1 Implementation Plan

## Summary

Phase 1 makes HeartPath feel real, safe, and college-only without changing the existing relationship engine. The deliverable is a strict verified-access foundation built around approved college-domain signup, verified-email gating, a multi-step onboarding wizard, profile completeness, and visible trust badges.

This phase ends with one clear rule:

- users can create an account only with an approved college email
- users cannot fully use HeartPath until the email is confirmed and onboarding is completed
- once active, the rest of the current product works as before

## Implementation Phases

### Phase 1A: Data model and access-state foundation

- Extend `public.users` with:
  - `access_state`
  - `onboarding_step`
  - `onboarding_completed_at`
  - `profile_completeness`
  - `email_verified_at`
  - `student_verified_at`
  - `verification_badges`
  - `pronouns`
  - `languages`
  - `relationship_intent`
  - `preferred_chat_frequency`
  - `voice_notes_comfort`
  - `privacy_comfort`
  - `boundary_topics`
- Create `public.college_domains`
- Create `public.user_verifications`
- Add `public.check_college_email_domain(email text)`
- Add `public.sync_user_access_state()`
- Backfill current users and seed the allowlist from existing user email domains

Rules:

- `blocked` is only for users whose email domain is not approved
- `verification_pending` means the email exists but is not yet confirmed
- `onboarding_required` means email is confirmed and domain is approved, but onboarding is incomplete
- `active` means both verification and onboarding are complete

### Phase 1B: Signup and login gating

- Validate approved college domain before `supabase.auth.signUp`
- Block unsupported domains before account creation
- Keep Supabase email confirmation as the real verification mechanism
- Show a dedicated “check your college email” state after signup
- Add resend-confirmation support
- Sync access state on every session load and auth-state change
- Replace `needsOnboarding` with:
  - `accessState`
  - `onboardingStep`
  - `profileCompleteness`
  - `verificationBadges`
- Route protected pages based on `accessState`

### Phase 1C: Multi-step onboarding wizard

Replace the old single form with a resumable 5-step wizard:

1. `verify`
2. `basics`
3. `heartpath`
4. `boundaries`
5. `photo_review`

Behavior:

- each step saves independently
- the wizard resumes after refresh or logout
- users cannot skip required prior steps
- finishing step 5 activates the account
- the existing level-1 photo upload flow is reused

### Phase 1D: Profile trust badges and app gating UX

Visible badges in Phase 1:

- `Email Verified`
- `College Verified`

Future-ready but not surfaced yet:

- `Photo Verified`
- `Identity Verified`

UI changes:

- verification/status card on dashboard
- verification/status card on profile
- onboarding progress card while onboarding is incomplete
- blocked state for unsupported domains
- non-active users never mount discovery/chat/interactive pages

### Phase 1E: Seed data, docs, and reliability finish

- ensure `college_domains` has approved entries before enabling the new signup flow
- add a short runbook for adding domains
- update signup and onboarding copy so the college-only rule is explicit
- show retryable verification-sync errors instead of infinite loaders

## Public Interfaces and Contract Changes

Frontend auth state:

- `accessState`
- `onboardingStep`
- `profileCompleteness`
- `verificationBadges`

Backend contract additions:

- `users.access_state`
- `users.onboarding_step`
- `users.onboarding_completed_at`
- `users.profile_completeness`
- `users.email_verified_at`
- `users.student_verified_at`
- `users.pronouns`
- `users.languages`
- `users.relationship_intent`
- `users.preferred_chat_frequency`
- `users.voice_notes_comfort`
- `users.privacy_comfort`
- `users.boundary_topics`
- `college_domains`
- `user_verifications`
- `check_college_email_domain(email text)`
- `sync_user_access_state()`

Onboarding step ids:

- `verify`
- `basics`
- `heartpath`
- `boundaries`
- `photo_review`
- `complete`

## Test Plan

### Signup and verification

- approved college-domain emails can sign up
- unapproved domains are blocked before signup
- signup leads to a check-email confirmation state
- confirmed users move into onboarding
- unconfirmed users cannot reach active app routes

### Access-state routing

- `verification_pending` routes to onboarding
- `onboarding_required` resumes the saved onboarding step
- `active` users can access dashboard, explore, chat, interactive, settings, and profile
- `blocked` users see a stable blocked state

### Onboarding

- each step saves and survives refresh
- users cannot skip required earlier steps
- finishing photo review activates the account and lands on dashboard
- existing level-1 photo upload still works

### Profile and UX

- dashboard and profile show verification badges
- profile completeness updates as users progress
- current users are backfilled safely
- relationship, chat, and memory data remain intact

### Failure handling

- verification sync failures surface a retryable error
- domain lookup failure blocks signup clearly
- onboarding refresh does not create blank or infinite-loading states

## Assumptions

- Phase 1 excludes matching algorithms, behavior signals, moderation tooling, and new AI capabilities
- Supabase email confirmation remains the only live verification mechanism in this phase
- approved-domain enforcement is product-enforced through the allowlist and access-state sync
- manual review for unknown colleges is out of scope for Phase 1
- current users must be backfilled by migration logic so the live database remains usable
