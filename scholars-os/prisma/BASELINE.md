# Baseline: existing database + Prisma Migrate (error P3005)

`P3005` means Postgres already has tables, but `_prisma_migrations` is missing or empty. Prisma will not run `migrate deploy` until the history is aligned.

## 1. Use the direct database URL for CLI

**Do not** use the Supabase **pooler** host for migrations.

- `DATABASE_URL` / `DIRECT_URL` must use **`db.<project>.supabase.co:5432`** (direct), not `aws-*-*.pooler.supabase.com`.

Load env from `scholars-os/.env` (or export vars in the shell), then run commands from **`scholars-os/`**.

## 2. If production already matches all shipped migrations

Mark every migration as **already applied** (no SQL runs), then future `migrate deploy` only applies new files:

```bash
cd scholars-os
npx prisma migrate resolve --applied 20260410063232_init_full_schema
npx prisma migrate resolve --applied 20260414120000_add_intake_files_meetings_status_log
npx prisma migrate resolve --applied 20260414220000_add_date_of_birth_to_students
npx prisma migrate resolve --applied 20260416120000_add_plan_of_action_to_ai_analyses
npx prisma migrate resolve --applied 20260416140000_add_mental_health_notes
npx prisma migrate resolve --applied 20260418120000_promote_danielemojevbe_to_owner
npx prisma migrate resolve --applied 20260418180000_add_onboarding_invitations_settings_fields
npx prisma migrate deploy
```

Or run:

```bash
npm run db:migrate:baseline-all-applied
npm run db:migrate:deploy
```

If a `resolve` step errors because that migration is already recorded, skip it and continue.

## 3. If production is only partially migrated

Resolve **only** migrations whose SQL is already reflected in the database (in chronological order), then run:

```bash
npx prisma migrate deploy
```

so Prisma applies the rest.

## 4. If you are unsure what matches

Use Supabase SQL editor or `prisma db pull` against a **copy** of prod to compare schema to `schema.prisma`, then choose step 2 or 3. Do not mark a migration as applied if its SQL was never applied.
