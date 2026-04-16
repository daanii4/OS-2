-- CreateTable
CREATE TABLE "mental_health_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "session_id" TEXT,
    "counselor_id" TEXT NOT NULL,
    "report_month" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "date_seen" TIMESTAMP(3) NOT NULL,
    "session_number" INTEGER NOT NULL,
    "presenting_problems" TEXT[],
    "session_format" "SessionFormat" NOT NULL,
    "case_closed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mental_health_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mental_health_notes_session_id_key" ON "mental_health_notes"("session_id");

-- CreateIndex
CREATE INDEX "mental_health_notes_tenant_id_report_month_idx" ON "mental_health_notes"("tenant_id", "report_month");

-- CreateIndex
CREATE INDEX "mental_health_notes_student_id_idx" ON "mental_health_notes"("student_id");

-- AddForeignKey
ALTER TABLE "mental_health_notes" ADD CONSTRAINT "mental_health_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mental_health_notes" ADD CONSTRAINT "mental_health_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mental_health_notes" ADD CONSTRAINT "mental_health_notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mental_health_notes" ADD CONSTRAINT "mental_health_notes_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
