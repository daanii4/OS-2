#!/usr/bin/env bash
# Mark all existing migrations as applied (for DBs that predate _prisma_migrations).
# Run from repo root: bash scholars-os/scripts/prisma-baseline-all-applied.sh
# Requires DIRECT_URL / DATABASE_URL pointing at direct db host :5432.

set -euo pipefail
cd "$(dirname "$0")/.."

MIGRATIONS=(
  20260410063232_init_full_schema
  20260414120000_add_intake_files_meetings_status_log
  20260414220000_add_date_of_birth_to_students
  20260416120000_add_plan_of_action_to_ai_analyses
  20260416140000_add_mental_health_notes
  20260418120000_promote_danielemojevbe_to_owner
  20260418180000_add_onboarding_invitations_settings_fields
)

for name in "${MIGRATIONS[@]}"; do
  echo "Resolving as applied: $name"
  npx prisma migrate resolve --applied "$name" || true
done

echo "Done. Run: npx prisma migrate deploy"
