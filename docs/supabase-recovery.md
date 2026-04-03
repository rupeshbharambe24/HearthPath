# Supabase Recovery

This repo was updated so the app can be pointed at a replacement Supabase project without editing source files.

## What changed

- [src/integrations/supabase/client.ts](../src/integrations/supabase/client.ts) now reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from environment variables.
- `npm run supabase:create-project` creates a new hosted Supabase project through the Management API and writes `.env.local` for the frontend when it can fetch a public API key.
- `npm run supabase:restore-backup` restores a downloaded backup file, including `.gz` backups, into the new project.

## Before you start

Install:

- Node.js
- The latest PostgreSQL client tools, including `psql`
- `pg_restore` as part of the PostgreSQL client tools if your backup is in custom dump format

Supabase's current restore guide for dashboard backups says:

- Use the Session pooler connection string by default
- Unzip the `.gz` file before restoring
- Run `psql -d [CONNECTION_STRING] -f /file/path`

Source:

- [Restore Dashboard backup](https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore)
- [Migrating within Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase)
- [Create a project with the Management API](https://supabase.com/docs/reference/api/create-a-project)

## 1. Create a new Supabase project

In PowerShell, set your Management API token and organization slug:

```powershell
$env:SUPABASE_ACCESS_TOKEN="your-personal-access-token"
$env:SUPABASE_ORG_SLUG="your-org-slug"
```

Create the project:

```powershell
npm run supabase:create-project -- --name heartpath-recovery --db-pass "choose-a-strong-db-password"
```

Optional flags:

- `--region ap-south-1`
- `--instance-size small`
- `--env-file .env.local`
- `--no-write-env`

If the script can fetch a public key, it writes `.env.local` with:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<public-key>
```

## 2. Get the database connection string

From the new project dashboard:

1. Open `Connect`
2. Copy the Session pooler connection string unless you explicitly want direct connection
3. Replace the password with the database password you set or reset

Then set it in your shell:

```powershell
$env:SUPABASE_DB_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

## 3. Restore the downloaded backup

If your backup is still compressed as `.gz`, you can pass it directly:

```powershell
npm run supabase:restore-backup -- "D:\path\to\backup_name.backup.gz"
```

The restore script will:

- unzip `.gz` backups into a temp file
- detect plain SQL vs custom `PGDMP` format
- use `psql` for plain SQL/dashboard-style backups
- use `pg_restore` for custom-format dumps

You can also override the connection string inline:

```powershell
npm run supabase:restore-backup -- --db-url "postgresql://..." "D:\path\to\backup_name.backup.gz"
```

## 4. Recreate non-database pieces

Supabase's docs call out several things that are not fully recreated by a database restore alone:

- Storage objects themselves
- Edge Functions
- Auth settings and API keys
- Realtime settings
- Database extensions and platform settings
- Read replicas

This repo already contains the schema migrations in [supabase/migrations](../supabase/migrations), but if you restore a full dashboard backup you generally should restore the backup instead of replaying migrations into the new hosted project.

## 5. Storage objects

Database restore brings back Storage metadata, but not the actual bucket files. If you also downloaded storage objects from the old project, follow Supabase's storage migration guidance from the same restore doc:

- [Restore Dashboard backup](https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore)

## Notes

- Supabase documents that `"object already exists"` style errors are expected during dashboard backup restores into a new hosted project because the dump is a full dump and the fresh project already contains schemas like `auth` and `storage`.
- Supabase also notes that older `psql` versions can fail against the Session pooler with GSSAPI negotiation errors, so use the latest PostgreSQL client tools.
