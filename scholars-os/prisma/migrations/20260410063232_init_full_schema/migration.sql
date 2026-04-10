-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'assistant', 'counselor');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('active', 'graduated', 'transferred', 'inactive');

-- CreateEnum
CREATE TYPE "SessionFormat" AS ENUM ('individual', 'group');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('K', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('initial_assessment', 'follow_up', 'check_in', 'crisis', 'group');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('attended', 'no_show', 'rescheduled', 'cancelled');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('office_referral', 'suspension_iss', 'suspension_oss', 'teacher_referral', 'behavioral_incident', 'other');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('active', 'completed', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "SessionFrequency" AS ENUM ('daily', 'weekly', 'biweekly', 'as_needed');

-- CreateEnum
CREATE TYPE "AITrigger" AS ENUM ('new_session', 'new_incident', 'plan_creation', 'milestone_missed', 'counselor_request', 'regression_alert');

-- CreateEnum
CREATE TYPE "CounselorAction" AS ENUM ('reviewed', 'followed', 'modified', 'ignored', 'pending');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'counselor',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,
    "school" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "assigned_counselor_id" TEXT,
    "referral_source" TEXT NOT NULL,
    "presenting_problem" TEXT NOT NULL,
    "intake_date" TIMESTAMP(3) NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'active',
    "session_format" "SessionFormat" NOT NULL DEFAULT 'individual',
    "baseline_incident_count" INTEGER,
    "baseline_window_start" TIMESTAMP(3),
    "baseline_window_end" TIMESTAMP(3),
    "general_notes" TEXT,
    "escalation_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_incidents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "incident_type" "IncidentType" NOT NULL,
    "suspension_days" DOUBLE PRECISION,
    "severity" "Severity" NOT NULL,
    "description" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "logged_by" TEXT NOT NULL,
    "linked_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL,
    "session_type" "SessionType" NOT NULL DEFAULT 'follow_up',
    "session_format" "SessionFormat" NOT NULL DEFAULT 'individual',
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "attendance_status" "AttendanceStatus" NOT NULL,
    "session_summary" TEXT,
    "session_goals" JSONB,
    "goals_attempted" INTEGER,
    "goals_met" INTEGER,
    "goal_completion_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "success_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'active',
    "goal_statement" TEXT NOT NULL,
    "target_reduction_pct" DOUBLE PRECISION NOT NULL,
    "plan_duration_weeks" INTEGER NOT NULL,
    "focus_behaviors" TEXT[],
    "session_frequency" "SessionFrequency" NOT NULL,
    "milestones" JSONB,
    "ai_counselor_guide" TEXT,
    "plan_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "success_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "triggered_by" "AITrigger" NOT NULL,
    "problem_analysis" TEXT NOT NULL,
    "next_session_guide" TEXT NOT NULL,
    "recommended_interventions" JSONB NOT NULL,
    "escalation_flag" BOOLEAN NOT NULL DEFAULT false,
    "escalation_reason" TEXT,
    "counselor_action" "CounselorAction" NOT NULL DEFAULT 'pending',
    "counselor_notes" TEXT,
    "reviewed_by" TEXT,
    "linked_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_assigned_counselor_id_fkey" FOREIGN KEY ("assigned_counselor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_incidents" ADD CONSTRAINT "behavioral_incidents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_incidents" ADD CONSTRAINT "behavioral_incidents_logged_by_fkey" FOREIGN KEY ("logged_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_incidents" ADD CONSTRAINT "behavioral_incidents_linked_session_id_fkey" FOREIGN KEY ("linked_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_plans" ADD CONSTRAINT "success_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "success_plans" ADD CONSTRAINT "success_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_linked_session_id_fkey" FOREIGN KEY ("linked_session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
