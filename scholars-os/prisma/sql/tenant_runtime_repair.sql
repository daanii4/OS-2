-- Idempotent repair script for tenant runtime compatibility.

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

ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'intake_assessment';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'behavioral_observation';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'classroom_support';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'emotional_regulation';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'group_behavior_support';
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'peer_conflict_mediation';

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "subdomain" TEXT NOT NULL UNIQUE,
  "owner_email" TEXT NOT NULL,
  "plan" "TenantPlan" NOT NULL DEFAULT 'starter',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE "tenants" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "tenants" ALTER COLUMN "id" TYPE TEXT USING "id"::text;
    ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
  END IF;
END $$;

-- Ensure tenant_id columns exist and are TEXT
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='tenant_id') THEN ALTER TABLE "profiles" ADD COLUMN "tenant_id" TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='tenant_id') THEN ALTER TABLE "students" ADD COLUMN "tenant_id" TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='behavioral_incidents' AND column_name='tenant_id') THEN ALTER TABLE "behavioral_incidents" ADD COLUMN "tenant_id" TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='tenant_id') THEN ALTER TABLE "sessions" ADD COLUMN "tenant_id" TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='success_plans' AND column_name='tenant_id') THEN ALTER TABLE "success_plans" ADD COLUMN "tenant_id" TEXT; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_analyses' AND column_name='tenant_id') THEN ALTER TABLE "ai_analyses" ADD COLUMN "tenant_id" TEXT; END IF; END $$;

ALTER TABLE "profiles" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "students" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "behavioral_incidents" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "sessions" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "success_plans" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;
ALTER TABLE "ai_analyses" ALTER COLUMN "tenant_id" TYPE TEXT USING "tenant_id"::text;

-- Ensure school_year exists
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='school_year') THEN ALTER TABLE "students" ADD COLUMN "school_year" TEXT; END IF; END $$;

-- Rebuild tenant foreign keys
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_tenant_id_fkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_tenant_id_fkey";
ALTER TABLE "behavioral_incidents" DROP CONSTRAINT IF EXISTS "behavioral_incidents_tenant_id_fkey";
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_tenant_id_fkey";
ALTER TABLE "success_plans" DROP CONSTRAINT IF EXISTS "success_plans_tenant_id_fkey";
ALTER TABLE "ai_analyses" DROP CONSTRAINT IF EXISTS "ai_analyses_tenant_id_fkey";

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "behavioral_incidents" ADD CONSTRAINT "behavioral_incidents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "success_plans" ADD CONSTRAINT "success_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create form tables if missing
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

-- Default tenant seed + backfill
INSERT INTO "tenants" ("name","slug","subdomain","owner_email","plan","active")
SELECT 'Operation Scholars','demarieya','demarieya.scholars-os.vercel.app','demarieya@operationscholars.com','starter',true
WHERE NOT EXISTS (SELECT 1 FROM "tenants" WHERE "slug"='demarieya');

DO $$
DECLARE
  v_tenant_id TEXT;
BEGIN
  SELECT id INTO v_tenant_id FROM "tenants" WHERE slug = 'demarieya';
  UPDATE "profiles" SET "tenant_id" = v_tenant_id WHERE "tenant_id" IS NULL;
  UPDATE "students" SET "tenant_id" = v_tenant_id WHERE "tenant_id" IS NULL;
  UPDATE "behavioral_incidents" SET "tenant_id" = v_tenant_id WHERE "tenant_id" IS NULL;
  UPDATE "sessions" SET "tenant_id" = v_tenant_id WHERE "tenant_id" IS NULL;
  UPDATE "success_plans" SET "tenant_id" = v_tenant_id WHERE "tenant_id" IS NULL;
  UPDATE "ai_analyses" SET "tenant_id" = v_tenant_id WHERE "tenant_id" IS NULL;
END $$;

-- Align session enum data/default with new application enum values
UPDATE "sessions" SET "session_type" = 'check_in' WHERE "session_type"::text = 'follow_up';
UPDATE "sessions" SET "session_type" = 'intake_assessment' WHERE "session_type"::text = 'initial_assessment';
UPDATE "sessions" SET "session_type" = 'group_behavior_support' WHERE "session_type"::text = 'group';
ALTER TABLE "sessions" ALTER COLUMN "session_type" SET DEFAULT 'check_in';
