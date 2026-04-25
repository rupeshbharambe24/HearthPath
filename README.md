# HeartPath

A trust-first college dating platform built on **verified identity, intentional pacing, and revocable consent at every layer**. HeartPath replaces swipe culture with a curated daily discovery feed and a six-stage progression model in which every intimacy unlock — a closer photo, a voice note, an exclusive bond — must be explicitly granted by both partners and can be revoked at any time.

> Status: Phase 1 (security & data integrity hardening) is in review on PR [#1](https://github.com/rupeshbharambe24/heart-surface-connect/pull/1). The README below describes the intended post-Phase-1 architecture; some triggers and edge functions referenced here only exist on the `phase1/security-hardening` branch until that PR lands.

---

## Why this exists

Mainstream dating apps optimize for matches per minute. That's the wrong metric for college students: it produces fake identities, pressure to escalate, and asymmetric vulnerability between partners. HeartPath is built around three opinionated constraints:

1. **Verified college access only.** Every user must prove they belong to a real college through an approved email domain or a manually reviewed student ID. Outside that gate, the app does nothing.
2. **Curated, intent-aware matching.** Discovery is a small daily set ranked by compatibility, not an endless feed. Users declare their intent (friendship, slow burn, serious, same campus) up front so partners are aligned on what they're exploring.
3. **Progressive consent.** Relationships move through six stages. Each stage transition is mutual. Each new permission (private photos, voice notes, AI-shared recap, exclusive mode) is a separate explicit grant the recipient holds and can revoke.

---

## The HeartPath — six stages

Every relationship is a row in `relationships` that progresses through:

| # | Stage | What it means | What unlocks |
|---|-------|---------------|--------------|
| 1 | Stranger | Default; minimal profile, low pressure | Level-1 photo, name, college |
| 2 | Acquaintance | First mutual stage; basic curiosity | Branch / hobbies become visible |
| 3 | Friend | Trust forming through consistency | `voice_notes`, `deeper_profile_details` permissions become grantable |
| 4 | Close Friend | Deeper bond; shared moments | `private_photo_gallery`, `shared_memory_vault` |
| 5 | Romantic Interest | Acknowledged emotional closeness | `full_face_photo`, `ai_shared_recap_access` |
| 6 | Exclusive | Mutual commitment; discovery locked | All permissions; `exclusive_locked_at` set |

Rules enforced at the database layer:

- Stage requests must originate from the caller; no forging from a partner's identity.
- Only the next stage may be requested. No skipping.
- The originator cannot resolve their own request — only the partner can accept, decline, or defer.
- Decline triggers a seven-day cooldown before another request is permitted.
- Permissions cannot be granted below their required stage even via a direct API call.
- Only the granter of a permission may revoke it; only the `revoked_at` field is mutable after grant.

---

## Permission unlocks

Permissions live in `relationship_permissions` and gate access to specific intimacy layers:

| Permission | Required stage | What it grants |
|---|---|---|
| `voice_notes` | 3 | Send and play voice messages in chat |
| `deeper_profile_details` | 3 | View extended profile fields |
| `private_photo_gallery` | 4 | View `level_3` photo set via signed URL |
| `shared_memory_vault` | 4 | Co-author shared journal entries |
| `full_face_photo` | 5 | View `level_4` (full-face) photo |
| `ai_shared_recap_access` | 5 | See AI-generated relationship recaps |

Cross-user photo viewing always goes through the `signed-photo-url` edge function, which re-checks `viewer_can_see_photo_level()` against the current relationship state and permission grants before issuing a five-minute signed URL. The `profile-photos` storage bucket is private; the only direct read path is the `profile_photos_self_read` policy, used by the user viewing their own gallery.

---

## Verification

A user account passes through `access_state`: `verification_pending → onboarding_required → active` (or `blocked`).

Three verification paths populate `verification_badges`:

| Type | Method | Mode |
|---|---|---|
| `email_verified` | Supabase email confirmation | Automatic |
| `student_verified` | College email domain match against `college_domains`, **or** manual ID upload reviewed by an admin | Automatic / manual |
| `photo_verified` | Reserved for future selfie + ID liveness | Future |
| `identity_verified` | Reserved | Future |

Student ID uploads are validated server-side by the `upload-verification-doc` edge function: MIME allowlist (JPEG, PNG, WebP, PDF), 5 MB cap, magic-byte sniffing, and a MIME-versus-content cross-check. Direct client writes to the `verification-documents` bucket are denied.

Admins review pending submissions through `/admin/verifications`. Admin role is stored in the `admin_users` table and checked via the `is_admin()` `SECURITY DEFINER` RPC; there is no client-side allowlist.

---

## Tech stack

**Frontend**
- React 18, Vite, TypeScript
- shadcn/ui (Radix primitives), Tailwind CSS, Framer Motion
- React Router v7, TanStack Query, React Hook Form + Zod
- Sonner for toasts, Vaul for mobile drawers

**Backend**
- Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- All non-public tables enable Row-Level Security
- Authoritative integrity rules live in DB triggers and `SECURITY DEFINER` functions

**Edge functions**
- `signed-photo-url` — issues short-lived signed URLs for cross-user photo reads after re-checking authorization
- `upload-verification-doc` — validates and stores student ID submissions
- `delete-account` — cascades a full user purge via the `purge_user(uuid)` RPC, then removes the auth user
- `review-student-verifications` — admin-only listing and decisioning of pending ID submissions

---

## Project structure

```
heart-surface-connect/
├── src/
│   ├── pages/                # Route components (Index, Onboarding, Dashboard, Explore, Chat, Interactive, MyProfile, Settings, AdminVerifications, NotFound)
│   ├── components/           # Layouts, profile cards, photo manager, chat UI, memory trail, etc.
│   ├── hooks/                # Data hooks: useUserData, useDashboardData, useExploreData, useMessages, useRelationshipSpaceData, useInteractiveData, useSignedPhoto, useIsAdmin
│   ├── contexts/             # AuthContext, ThemeContext
│   ├── lib/                  # heartpath.ts (stage rules), compatibility.ts, schemas.ts (Zod), admin.ts, access-state.ts, relationship-ai.ts
│   ├── integrations/supabase # Generated Database types + client
│   └── App.tsx               # Top-level routing + providers
├── supabase/
│   ├── migrations/           # Versioned schema. Files prefixed with a timestamp; run in order via `supabase db reset`
│   └── functions/            # Edge functions (Deno)
├── docs/                     # Runbooks (admin review, college domains, supabase recovery, anti-casual roadmap)
├── scripts/                  # supabase-create-project.mjs, supabase-restore-backup.mjs
└── public/
```

---

## Local development

### Prerequisites

- Node.js 18+ and npm (the lockfile is `package-lock.json`; `bun.lockb` is committed but npm is canonical)
- A Supabase project (free tier is fine) — managed locally via `supabase` CLI or hosted

### One-time setup

```bash
git clone https://github.com/rupeshbharambe24/heart-surface-connect.git
cd heart-surface-connect
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

If you don't have a Supabase project yet:

```bash
npm run supabase:create-project -- --name your-project --db-pass <password> --org <slug>
```

If you have a backup to restore:

```bash
npm run supabase:restore-backup -- path/to/backup.backup.gz
```

The detailed recovery workflow is in [docs/supabase-recovery.md](./docs/supabase-recovery.md).

### Running the app

```bash
npm run dev          # vite dev server on http://localhost:8080
npm run build        # production build
npm run build:dev    # build with sourcemaps
npm run preview      # serve the production build locally
npm run lint         # eslint
```

### Database setup

Migrations live in `supabase/migrations/` and apply in timestamp order. To apply against a fresh local Supabase:

```bash
supabase db reset
```

Each migration that introduces a security-critical rule ships with a `_verify.sql` companion containing manual probes wrapped in `BEGIN; ... ROLLBACK;` blocks. Replace the UUID placeholders with values from your local fixture and run with `psql -f`.

### Seeding college domains

Approved colleges are stored in `college_domains`. To add one:

```sql
INSERT INTO public.college_domains (domain, college_name, status)
VALUES ('students.example.edu', 'Example University', 'active');
```

The full runbook is in [docs/college-domain-allowlist.md](./docs/college-domain-allowlist.md).

### Seeding admins

Admin role is stored in the `admin_users` table. Seed your initial admin immediately after running the Phase 1 migrations or the legacy env-var allowlist will lose effect with no replacement:

```sql
INSERT INTO public.admin_users (user_id, notes)
SELECT id, 'Initial admin bootstrap'
FROM public.users
WHERE college_email = 'you@example.edu';
```

Full instructions: [docs/admin-verification-review-setup.md](./docs/admin-verification-review-setup.md).

### Deploying edge functions

```bash
supabase functions deploy signed-photo-url
supabase functions deploy upload-verification-doc
supabase functions deploy delete-account
supabase functions deploy review-student-verifications
```

---

## Routes

All protected routes require `access_state === 'active'`. Other states route to onboarding.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Index` | Landing + auth (signup, login, email verification states) |
| `/onboarding` | `Onboarding` | Six-step wizard: verify, basics, heartpath, boundaries, photo_review, complete |
| `/dashboard` | `Dashboard` | Verification status, profile completeness, suggested next steps |
| `/explore` | `Explore` | Curated daily discovery with compatibility scores |
| `/chat` | `Chat` | Inbox + per-relationship message thread |
| `/interactive` | `Interactive` | Shared relationship space: stage tracker, permissions panel, weekly check-ins, memory vault, AI summaries, relationship events log |
| `/profile` | `MyProfile` | Self profile editing, photo gallery management |
| `/settings` | `Settings` | Theme, blocked users, breakup / pause flows, account deletion |
| `/admin/verifications` | `AdminVerifications` | Restricted to `admin_users`; review pending student ID submissions |

The Interactive page is the heart of the post-match experience. It exposes:

- **Stage tracker** with current stage, request status, and any active cooldown
- **Permissions panel** showing every consent toggle, who granted it, when, and what it unlocks
- **Weekly check-ins** (1–5 rating + optional gratitude note)
- **Memory vault** with typed entries (`good_moment`, `milestone`, `hard_moment`, `repair`, `gratitude`, `promise`, `date`, `reflection`), moods, tags, and private/shared visibility
- **AI summaries** (currently template-based; LLM integration is on the Phase 2 roadmap) that generate monthly recaps and milestone summaries from check-ins and memories — explicitly framed as neutral summaries, not advice
- **Heart exchanges** for low-friction signals
- **Relationship events log** — an append-only audit trail of every interaction (request received, stage accepted, permission granted, memory saved, paused, archived)

---

## Documentation

| Doc | What it covers |
|---|---|
| [docs/heartpath-phase-1-implementation.md](./docs/heartpath-phase-1-implementation.md) | Phase 1 implementation tracker (verified access + curated discovery foundation) |
| [docs/heartpath-anti-casual-roadmap.md](./docs/heartpath-anti-casual-roadmap.md) | Product principles and ongoing roadmap |
| [docs/admin-verification-review-setup.md](./docs/admin-verification-review-setup.md) | Admin role seeding, edge function deployment, review flow |
| [docs/college-domain-allowlist.md](./docs/college-domain-allowlist.md) | How to add or disable college domains |
| [docs/student-id-verification-review.md](./docs/student-id-verification-review.md) | SQL runbook for the manual ID review path |
| [docs/heartpath-verification-email-template.md](./docs/heartpath-verification-email-template.md) | Email copy for verification flows |
| [docs/supabase-recovery.md](./docs/supabase-recovery.md) | Recreating or restoring a Supabase project |
| [docs/superpowers/plans/2026-04-25-phase1-security-hardening.md](./docs/superpowers/plans/2026-04-25-phase1-security-hardening.md) | Phase 1 security & data integrity plan (the work currently in PR #1) |

---

## Status and roadmap

**Phase 1 — Security and data integrity hardening** (in review)

12 task blocks closing the audit findings. RLS, triggers, and edge-function validation move authoritative checks into the database. Photos are private with stage-aware signed URLs. Admin role is server-side only. See PR [#1](https://github.com/rupeshbharambe24/heart-surface-connect/pull/1).

**Phase 2 — "Feature is real, not stub"** (planned)

- Notifications inbox (stage requests, hearts, permission grants, messages) with read receipts and online presence
- Real LLM-backed AI summaries replacing the current template generator, with explicit consent and a "what AI sees" panel
- Voice notes recording and playback (the permission already exists; the UI does not)
- Real photo verification (selfie + ID liveness via a third-party service or an admin-reviewed flow)
- In-app moderation dashboard wired to the existing `reports` and `moderation_actions` tables
- Memory attachments (audio, image, document)

**Phase 3 — UX maturity** (planned)

- Stage celebration animations, progress bar, and visible cooldown countdowns
- Discovery preferences editing in Settings (currently fixed at onboarding)
- Memory grouping and timeline views
- Weekly check-in reminders
- Soft-pause flow distinct from breakup, breakup reflection prompts, support resources
- Notification, privacy, and data-export settings
- PWA manifest and service worker for installable mobile experience
- Internationalization scaffold and accessibility pass

**Phase 4 — Differentiated product** (post-launch)

- Branch paths (friendship vs romantic) at stage 2 to align partner intent earlier
- Couple goals, anniversary tracker, shared calendar with campus event integration
- Voice/video calls (encrypted, gated by stage)
- Conflict-resolution prompts on `hard_moment`/`repair` entries
- Mentor / counselor referral integrations
- Test suite (unit + integration + e2e)

---

## Contributing

This repo is currently developed by a small team and goes through PR review for any non-trivial change. If you want to contribute:

1. Open an issue describing the change before writing code
2. Branch from `main` and follow the existing migration timestamp conventions when adding schema changes
3. Every `SECURITY DEFINER` function uses `SET search_path = ''` and schema-qualifies all references
4. Every migration adding a security-critical rule ships with a `_verify.sql` probe file
5. Run `npm run build` and `npm run lint` before pushing

---

## License

Currently unspecified. Treat as all-rights-reserved until a `LICENSE` file is added.
