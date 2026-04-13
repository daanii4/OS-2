-- Runtime hotfix to align database with tenant-aware app code.
-- This is idempotent and safe to run multiple times.

-- 1) Enums needed by new models
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantPlan') THEN
    CREATE TYPE "TenantPlan" AS ENUM ('starter', 'growth', 'enterprise');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralStatus') THEN
    CREATE TYPE "ReferralStatus" AS ENUM ('open', 'in_progress', 'completed', 'closed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsentStatus') THEN
    CREATE TYPE "ConsentStatus" AS ENUM ('active', 'expired', 'revoked');
  END IF;
END $$;

-- 2) Add new SessionType values without removing legacy values yet
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'intake_assessment';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'behavioral_observation';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'classroom_support';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'emotional_regulation';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'group_behavior_support';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'peer_conflict_mediation';

-- 3) Core tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "subdomain" TEXT NOT NULL UNIQUE,
  "owner_email" TEXT NOT NULL,
  "plan" "TenantPlan" NOT NULL DEFAULT 'starter',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4) Add tenant_id nullable to existing tables
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "behavioral_incidents" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "success_plans" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;
ALTER TABLE "ai_analyses" ADD COLUMN IF NOT EXISTS "tenant_id" UUID;

ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "school_year" TEXT;

-- 5) Add constraints if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tenant_id_fkey'
  ) THEN
    ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_tenant_id_fkey'
  ) THEN
    ALTER TABLE "students"
      ADD CONSTRAINT "students_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'behavioral_incidents_tenant_id_fkey'
  ) THEN
    ALTER TABLE "behavioral_incidents"
      ADD CONSTRAINT "behavioral_incidents_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_tenant_id_fkey'
  ) THEN
    ALTER TABLE "sessions"
      ADD CONSTRAINT "sessions_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'success_plans_tenant_id_fkey'
  ) THEN
    ALTER TABLE "success_plans"
      ADD CONSTRAINT "success_plans_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_analyses_tenant_id_fkey'
  ) THEN
    ALTER TABLE "ai_analyses"
      ADD CONSTRAINT "ai_analyses_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 6) New form tables
CREATE TABLE IF NOT EXISTS "consent_records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "student_id" UUID NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "school_year" TEXT NOT NULL,
  "parent_guardian_name" TEXT NOT NULL,
  "consent_date" TIMESTAMP(3) NOT NULL,
  "district" TEXT NOT NULL,
  "school" TEXT NOT NULL,
  "behaviorist_name" TEXT NOT NULL,
  "status" "ConsentStatus" NOT NULL DEFAULT 'active',
  "signed_copy_url" TEXT,
  "created_by" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "student_id" UUID NOT NULL REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "referral_date" TIMESTAMP(3) NOT NULL,
  "referred_by" TEXT NOT NULL,
  "brief_description" TEXT,
  "intervention_types" "SessionType"[] NOT NULL,
  "status" "ReferralStatus" NOT NULL DEFAULT 'open',
  "assigned_to" UUID REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "linked_consent_id" UUID REFERENCES "consent_records"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "created_by" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7) Required indexes
CREATE INDEX IF NOT EXISTS "profiles_tenant_id_idx" ON "profiles"("tenant_id");
CREATE INDEX IF NOT EXISTS "students_tenant_id_idx" ON "students"("tenant_id");
CREATE INDEX IF NOT EXISTS "students_tenant_id_assigned_counselor_id_idx" ON "students"("tenant_id","assigned_counselor_id");
CREATE INDEX IF NOT EXISTS "behavioral_incidents_tenant_id_idx" ON "behavioral_incidents"("tenant_id");
CREATE INDEX IF NOT EXISTS "behavioral_incidents_tenant_id_student_id_idx" ON "behavioral_incidents"("tenant_id","student_id");
CREATE INDEX IF NOT EXISTS "sessions_tenant_id_idx" ON "sessions"("tenant_id");
CREATE INDEX IF NOT EXISTS "sessions_tenant_id_student_id_idx" ON "sessions"("tenant_id","student_id");
CREATE INDEX IF NOT EXISTS "success_plans_tenant_id_idx" ON "success_plans"("tenant_id");
CREATE INDEX IF NOT EXISTS "success_plans_tenant_id_student_id_idx" ON "success_plans"("tenant_id","student_id");
CREATE INDEX IF NOT EXISTS "ai_analyses_tenant_id_idx" ON "ai_analyses"("tenant_id");
CREATE INDEX IF NOT EXISTS "ai_analyses_tenant_id_student_id_idx" ON "ai_analyses"("tenant_id","student_id");
CREATE INDEX IF NOT EXISTS "referrals_tenant_id_idx" ON "referrals"("tenant_id");
CREATE INDEX IF NOT EXISTS "referrals_tenant_id_student_id_idx" ON "referrals"("tenant_id","student_id");
CREATE INDEX IF NOT EXISTS "consent_records_tenant_id_idx" ON "consent_records"("tenant_id");
CREATE INDEX IF NOT EXISTS "consent_records_tenant_id_student_id_idx" ON "consent_records"("tenant_id","student_id");

-- 8) Seed default tenant row if missing
INSERT INTO "tenants" ("name","slug","subdomain","owner_email","plan","active")
SELECT
  'Operation Scholars',
  'demarieya',
  'demarieya.scholars-os.vercel.app',
  'demarieya@operationscholars.com',
  'starter',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM "tenants" WHERE "slug" = 'demarieya'
);

-- 9) Backfill existing rows with default tenant
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'demarieya';

  UPDATE profiles SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE students SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE behavioral_incidents SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE sessions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE success_plans SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE ai_analyses SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;

  -- Enum value data migration
  UPDATE sessions SET session_type = 'check_in' WHERE session_type = 'follow_up';
  UPDATE sessions SET session_type = 'intake_assessment' WHERE session_type = 'initial_assessment';
  UPDATE sessions SET session_type = 'group_behavior_support' WHERE session_type = 'group';
END $$;
