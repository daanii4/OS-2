-- Performance indexes for dashboard, analytics, and caseload queries

-- students
CREATE INDEX "students_tenant_id_status_idx" ON "students"("tenant_id", "status");
CREATE INDEX "students_assigned_counselor_id_idx" ON "students"("assigned_counselor_id");

-- behavioral_incidents
CREATE INDEX "behavioral_incidents_student_id_incident_date_idx" ON "behavioral_incidents"("student_id", "incident_date");
CREATE INDEX "behavioral_incidents_tenant_id_incident_date_idx" ON "behavioral_incidents"("tenant_id", "incident_date");

-- sessions
CREATE INDEX "sessions_student_id_session_date_idx" ON "sessions"("student_id", "session_date");
CREATE INDEX "sessions_tenant_id_session_date_idx" ON "sessions"("tenant_id", "session_date");
CREATE INDEX "sessions_counselor_id_session_date_idx" ON "sessions"("counselor_id", "session_date");

-- mental_health_notes (caseload export filters)
CREATE INDEX "mental_health_notes_tenant_id_report_month_school_idx" ON "mental_health_notes"("tenant_id", "report_month", "school");
