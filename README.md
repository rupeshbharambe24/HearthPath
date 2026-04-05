# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/653c1c99-8002-458e-a5dd-5a0a53accc0e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/653c1c99-8002-458e-a5dd-5a0a53accc0e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/653c1c99-8002-458e-a5dd-5a0a53accc0e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Supabase recovery

This repo no longer hardcodes a single Supabase project. Configure the app with:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Create `.env.local` from `.env.example`, or use the included recovery scripts:

```sh
npm run supabase:create-project -- --name your-new-project --db-pass your-db-password --org your-org-slug
npm run supabase:restore-backup -- path/to/your-backup.backup.gz
```

The detailed recovery workflow is documented in [docs/supabase-recovery.md](./docs/supabase-recovery.md).

## HeartPath planning docs

- [Phase 1 implementation plan](./docs/heartpath-phase-1-implementation.md)
- [College domain allowlist runbook](./docs/college-domain-allowlist.md)
