-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- AlterTable
ALTER TABLE "students" ADD COLUMN "intake_files" JSONB;

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT,
    "counselor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "meeting_type" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_status_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "old_status" "StudentStatus" NOT NULL,
    "new_status" "StudentStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meetings_tenant_id_idx" ON "meetings"("tenant_id");

-- CreateIndex
CREATE INDEX "meetings_tenant_id_counselor_id_idx" ON "meetings"("tenant_id", "counselor_id");

-- CreateIndex
CREATE INDEX "meetings_tenant_id_meeting_date_idx" ON "meetings"("tenant_id", "meeting_date");

-- CreateIndex
CREATE INDEX "student_status_logs_tenant_id_student_id_idx" ON "student_status_logs"("tenant_id", "student_id");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_status_logs" ADD CONSTRAINT "student_status_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_status_logs" ADD CONSTRAINT "student_status_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_status_logs" ADD CONSTRAINT "student_status_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
