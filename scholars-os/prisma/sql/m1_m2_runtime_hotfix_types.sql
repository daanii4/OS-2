-- Fix type alignment for tenant migration hotfix.
-- Existing core IDs are TEXT in this database; enforce TEXT for tenant keys too.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "tenants" ALTER COLUMN "id" TYPE TEXT USING "id"::text;
    ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_tenant_id_fkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_tenant_id_fkey";
ALTER TABLE "behavioral_incidents" DROP CONSTRAINT IF EXISTS "behavioral_incidents_tenant_id_fkey";
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_tenant_id_fkey";
ALTER TABLE "success_plans" DROP CONSTRAINT IF EXISTS "success_plans_tenant_id_fkey";
ALTER TABLE "ai_analyses" DROP CONSTRAINT IF EXISTS "ai_analyses_tenant_id_fkey";

ALTER TABLE "profiles" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "students" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "behavioral_incidents" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "sessions" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "success_plans" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "ai_analyses" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "students"
  ADD CONSTRAINT "students_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "behavioral_incidents"
  ADD CONSTRAINT "behavioral_incidents_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "success_plans"
  ADD CONSTRAINT "success_plans_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_analyses"
  ADD CONSTRAINT "ai_analyses_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "consent_records" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenant_id" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "student_id" TEXT NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "school_year" TEXT NOT NULL,
  "parent_guardian_name" TEXT NOT NULL,
  "consent_date" TIMESTAMP(3) NOT NULL,
  "district" TEXT NOT NULL,
  "school" TEXT NOT NULL,
  "behaviorist_name" TEXT NOT NULL,
  "status" "ConsentStatus" NOT NULL DEFAULT 'active',
  "signed_copy_url" TEXT,
  "created_by" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenant_id" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "student_id" TEXT NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "referral_date" TIMESTAMP(3) NOT NULL,
  "referred_by" TEXT NOT NULL,
  "brief_description" TEXT,
  "intervention_types" "SessionType"[] NOT NULL,
  "status" "ReferralStatus" NOT NULL DEFAULT 'open',
  "assigned_to" TEXT REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "linked_consent_id" TEXT REFERENCES "consent_records"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "created_by" TEXT NOT NULL REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
