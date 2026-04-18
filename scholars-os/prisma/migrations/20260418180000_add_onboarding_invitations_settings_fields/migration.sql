-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- AlterTable tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "default_district" TEXT;

-- AlterTable profiles
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "must_reset_password" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "onboarding_complete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "onboarding_step" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "default_session_duration" INTEGER;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "default_session_format" "SessionFormat";
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "default_grade_filter_min" "Grade";
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "default_grade_filter_max" "Grade";

-- CreateTable invitations
CREATE TABLE IF NOT EXISTS "invitations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invited_by" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invitations_tenant_id_idx" ON "invitations"("tenant_id");
CREATE INDEX IF NOT EXISTS "invitations_email_tenant_id_idx" ON "invitations"("email", "tenant_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitations_tenant_id_fkey'
  ) THEN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitations_invited_by_fkey'
  ) THEN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey"
      FOREIGN KEY ("invited_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Existing accounts: do not force password reset or onboarding (new users get flags from auth trigger)
UPDATE "profiles"
SET
  "must_reset_password" = false,
  "onboarding_complete" = true,
  "onboarding_step" = 0
WHERE "must_reset_password" = true;
