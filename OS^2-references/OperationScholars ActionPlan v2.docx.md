**QUASARNOVA LLC  ·  CLIENT BUILD  ·  ENGINEERING ACTION PLAN**

CONFIDENTIAL  ·  APRIL 2026  ·  FOR: AGENT 1 (CURSOR)

**Operation Scholars OS**

*Student Behavioral Intelligence Platform  ·  Engineering Action Plan  ·  v2.0*

**REVISION NOTICE — v2.0**

This document supersedes v1.0. The 1–5 CASEL scoring rubric has been removed and replaced with an evidence-based behavioral incident tracking model. All data model, AI, and quantification sections have been rewritten accordingly.

# **1\. Client Brief**

| Field | Detail |
| :---- | :---- |
| Client | Operation Scholars |
| Owner | De'marieya Nelson |
| Role | Counseling contractor. Deploys counselors to school districts across the 209 area (Central Valley, CA). |
| Student population | \~200 active students. All students have established behavioral and mental health concerns — Operation Scholars is not assigned prevention students. Every student in the system is already presenting with problematic behavior. |
| Counseling model | Counselor receives a referral, conducts initial assessment, builds treatment approach, meets recurrently. Documents each meeting with a written session summary. |
| Current state | No CRM. Counselors use basic documents. Significant time lost re-entering student name, date, and context on every session log. |
| Engagement model | De'marieya and his assistant manage everything. Counselors see only their assigned students. |
| Scale target | 5+ counselors, 100+ students per counselor, by Year 3\. Every architectural decision must support this from day one. |

| *Critical constraint: This system will grow. What De'marieya runs himself with 10 students today, he will have 5 counselors running with 200 students in Year 3\. Design the data model, permissions, and AI layer to scale without a rewrite.* |
| :---- |

# **2\. North Star — What This System Must Do**

| Capability | Description |
| :---- | :---- |
| Incident-based progress tracking | Track every office referral, suspension, and behavioral incident per student over time. This is the primary progress metric. |
| Session documentation | Counselors log each meeting with a session summary. Student name, date, and context are auto-populated — counselors only write the narrative. |
| AI student intelligence | LLM reads the student's full history — incidents, session summaries, referral context — and maintains a living understanding of what the student is going through. |
| Meeting-by-meeting counselor guide | AI generates a guide for each upcoming session: what to address, what approach to take, based on everything known about this student. |
| Progress visualization | Charts and trend graphs showing incident frequency over time, session engagement, and behavioral improvement trajectory. Week/month/year toggle. |
| Progress reports | Exportable reports De'marieya brings to school districts as proof of impact — incident reduction rates, session frequency, comparative trend data. |
| Role-based access | Owner/Assistant see everything. Counselors see only their assigned students. Enforced at the API level. |

# **3\. Measurement Model — Evidential Behavioral Statistics**

## **3.1 Why the 1–5 Scoring System Was Removed**

The original CASEL 1–5 domain scores were subjective counselor ratings requiring scoring on 5 dimensions per session, adding form-filling burden to every meeting. More critically, they are difficult to present to a school district as proof of impact. 'The student went from 2.4 to 3.1 on Self-Management' is abstract and not how districts measure behavioral outcomes.

| *The new measurement model is evidence-based by definition. A referral is a referral. A suspension is a suspension. These are data points the school already tracks, and a reduction in their frequency is an objective, undeniable outcome that De'marieya can present to any district administrator.* |
| :---- |

## **3.2 Primary Behavioral Metrics**

| Metric | What It Measures | Direction of Progress |
| :---- | :---- | :---- |
| Office Referrals | Times a student was sent to the principal or VP's office for behavioral issues. | Decrease \= improvement |
| Suspensions (ISS/OSS) | Formal suspension events — in-school or out-of-school. Severity and days tracked. | Decrease \= improvement |
| Teacher Referrals | Formal referrals from classroom teachers to counseling or administration. | Decrease \= improvement |
| Behavioral Incidents | Broader category: fights, disruptions, policy violations, any documented incident. | Decrease \= improvement |
| Session Attendance | Whether the student attended their scheduled counseling session. | Higher attendance \= engagement |
| Goal Completion Rate | Per-session: % of behavioral goals the student met. Counselor marks each goal met/not met. | Higher % \= improvement |

## **3.3 Growth Measurement — Delta from Individual Baseline**

| Concept | Implementation |
| :---- | :---- |
| Baseline window | First 30 days in system (or first 4 sessions, whichever comes first). Incident counts during this window define the student's baseline rate. |
| Primary progress metric | Percent reduction from baseline. Example: 8 office referrals in baseline month, 3 last month \= 62.5% reduction. This is the headline number shown in every report. |
| Time period toggles | Week, month, and year views. Counselor and owner toggle between windows on any chart. |
| Plateau detection | Incident rate has not decreased in 3 consecutive tracking periods. System flags for plan review. AI generates intervention adjustment recommendation. |
| Regression alert | Incident rate increases 25%+ over prior period. System flags immediately. AI generates urgent review recommendations. |

# **4\. Core Data Model**

| *Everything in the system flows from this data model. Build this correctly and the rest is implementation. Change this later and it is a rewrite.* |
| :---- |

## **4.1 Users Table**

| Field | Type | Notes |
| :---- | :---- | :---- |
| id | UUID | Primary key |
| name | String | Full name |
| email | String | Login credential |
| password\_hash | String | bcrypt |
| role | Enum | 'owner' | 'assistant' | 'counselor' |
| active | Boolean | Soft delete |
| created\_at | Timestamp |  |

## **4.2 Students Table**

| Field | Type | Notes |
| :---- | :---- | :---- |
| id | UUID | Primary key |
| first\_name | String |  |
| last\_name | String |  |
| grade | Enum | 'K' through '12' |
| school | String | School name |
| district | String | School district |
| assigned\_counselor\_id | UUID | FK → users. NULL \= unassigned |
| referral\_source | String | Who referred this student to Operation Scholars |
| presenting\_problem | Text | Initial description of behavioral concern at intake |
| intake\_date | Date | Date of first counseling session |
| status | Enum | 'active' | 'graduated' | 'transferred' | 'inactive' |
| session\_format | Enum | 'individual' | 'group' |
| baseline\_incident\_count | Integer | Total incident count during baseline window. Set by owner/assistant. |
| baseline\_window\_start | Date | Start of baseline measurement window |
| baseline\_window\_end | Date | End of baseline measurement window |
| general\_notes | Text | Administrative background context. Not AI-analyzed. |
| created\_at | Timestamp |  |

## **4.3 Behavioral Incidents Table (Primary Progress Data)**

This table is the core of the measurement model. Every office referral, suspension, teacher referral, or behavioral incident is logged here.

| Field | Type | Notes |
| :---- | :---- | :---- |
| id | UUID | Primary key |
| student\_id | UUID | FK → students |
| incident\_date | Date | Date incident occurred (not logged date) |
| incident\_type | Enum | 'office\_referral' | 'suspension\_iss' | 'suspension\_oss' | 'teacher\_referral' | 'behavioral\_incident' | 'other' |
| suspension\_days | Float | Only for suspension types. Duration in days (0.5 \= half day). |
| severity | Enum | 'low' | 'medium' | 'high' |
| description | Text | What happened. Can be pulled from school records. |
| reported\_by | String | Teacher name, administrator, or other — who filed the original report |
| logged\_by | UUID | FK → users — counselor or owner who entered it |
| linked\_session\_id | UUID | FK → sessions. Optional — if incident was discussed in a session. |
| created\_at | Timestamp |  |

## **4.4 Sessions Table**

Every counseling interaction is logged here. The session summary is the primary AI input.

| Field | Type | Notes |
| :---- | :---- | :---- |
| id | UUID | Primary key |
| student\_id | UUID | FK → students |
| counselor\_id | UUID | FK → users |
| session\_date | Date | Pre-populated to today. Counselor can override. |
| session\_type | Enum | 'initial\_assessment' | 'follow\_up' | 'check\_in' | 'crisis' | 'group' |
| session\_format | Enum | 'individual' | 'group' |
| duration\_minutes | Integer |  |
| attendance\_status | Enum | 'attended' | 'no\_show' | 'rescheduled' | 'cancelled' |
| session\_summary | Text | Counselor's written narrative of what happened. PRIMARY AI INPUT. Required for attended sessions. |
| session\_goals | JSON Array | \[{goal: string, met: boolean}\] |
| goals\_attempted | Integer (computed) | Count of session\_goals entries |
| goals\_met | Integer (computed) | Count where met \=== true |
| goal\_completion\_rate | Float (computed) | goals\_met / goals\_attempted × 100 |
| ai\_analysis\_id | UUID | FK → ai\_analyses triggered by this session |
| created\_at | Timestamp |  |

## **4.5 Success Plans Table**

| Field | Type | Notes |
| :---- | :---- | :---- |
| id | UUID | Primary key |
| student\_id | UUID | FK → students |
| created\_by | UUID | FK → users |
| status | Enum | 'active' | 'completed' | 'paused' | 'archived' |
| goal\_statement | Text | Plain-language goal: 'Marcus will reduce office referrals to 0–1 per month and develop 2 coping strategies for frustration by \[date\].' |
| target\_reduction\_pct | Float | Target % reduction from baseline. E.g., 75 \= reduce incidents by 75%. |
| plan\_duration\_weeks | Integer |  |
| focus\_behaviors | String Array | Specific behavioral targets: \['reduce office referrals', 'improve classroom staying'\] |
| session\_frequency | Enum | 'daily' | 'weekly' | 'biweekly' | 'as\_needed' |
| milestones | JSON Array | Weekly milestone objects (see schema) |
| ai\_counselor\_guide | Text | AI-generated meeting-by-meeting counseling guide. Updated after each session. |
| plan\_notes | Text | Counselor narrative about plan intent |
| created\_at | Timestamp |  |
| updated\_at | Timestamp |  |

## **4.6 Milestone Schema (within success\_plans.milestones)**

| Field | Type | Notes |
| :---- | :---- | :---- |
| week\_number | Integer | Week 1, 2, 3... relative to plan start |
| target\_incident\_count | Integer | Maximum incidents allowed this week to be on track |
| target\_goal\_completion\_pct | Float | Target % of session goals met this week |
| specific\_goals | String Array | 1–3 behavioral goals for this week |
| counselor\_strategy | String | What approach/intervention the counselor will use |
| status | Enum | 'upcoming' | 'in\_progress' | 'met' | 'missed' | 'adjusted' |
| actual\_incident\_count | Integer | Actual incidents during this milestone week |
| actual\_goal\_completion\_pct | Float | Actual goal completion rate for sessions this week |
| notes | String | What happened, what worked, adjustments made |

## **4.7 AI Analyses Table**

| Field | Type | Notes |
| :---- | :---- | :---- |
| id | UUID | Primary key |
| student\_id | UUID | FK → students |
| triggered\_by | Enum | 'new\_session' | 'new\_incident' | 'plan\_creation' | 'milestone\_missed' | 'counselor\_request' | 'regression\_alert' |
| problem\_analysis | Text | AI's synthesized understanding of what this student is currently going through. |
| next\_session\_guide | Text | Meeting-by-meeting guide: what to address, what approach, specific techniques. |
| recommended\_interventions | JSON Array | \[{intervention, rationale, source: {name, url}}\] |
| escalation\_flag | Boolean | True if AI detects safety concern or situation requiring licensed clinician referral. |
| escalation\_reason | Text | Specific reason if escalation\_flag \= true. |
| counselor\_action | Enum | 'reviewed' | 'followed' | 'modified' | 'ignored' | 'pending' |
| counselor\_notes | Text | What the counselor did with the recommendation |
| created\_at | Timestamp |  |

# **5\. AI Analysis Layer**

## **5.1 Core Concept — Living Student Intelligence Profile**

The AI does not look at one session in isolation. It reads the student's complete history every time it runs — all incident records, all session summaries, all prior analyses — and maintains a living understanding of what this student is going through. Each new session summary updates this picture.

| *Think of it as a brilliant co-counselor who has read every note ever written about this student and remembers all of it. When the counselor sits down before a session, the AI briefs them: here is what we know, here is what is driving the behavior, here is what to try next.* |
| :---- |

## **5.2 AI Inputs Per Analysis**

| Input | Content |
| :---- | :---- |
| Student profile | Name, grade, school, presenting problem, intake date, individual or group format, referral source |
| Full incident history | Complete timeline of all office referrals, suspensions, teacher referrals, behavioral incidents — type, date, severity, description |
| Baseline \+ trend data | Baseline incident rate. Current period rate. % change. Whether trending better, worse, or flat. |
| All session summaries | Every counselor-written session narrative in chronological order. Richest input — AI reads what was actually said and done in every session. |
| Active plan | Goal statement, focus behaviors, weekly milestone targets, current milestone status |
| Prior AI analyses | Summary of prior AI insights and recommendations — new analysis builds on prior context |

## **5.3 AI Outputs**

| Output | Description |
| :---- | :---- |
| Problem analysis | Synthesized understanding of the student's current situation. Root causes behind behavioral patterns. What is actually driving the incidents. Plain language for the counselor. |
| Next session guide | Step-by-step guidance for the upcoming session. What topic to open with. What technique to use. What to watch for. How to respond if student shuts down or escalates. Specific and grounded in the student's history. |
| Recommended interventions | 1–3 specific behavioral interventions with source citations from trusted frameworks (PBIS, CASEL, CBT, SAMHSA). Rationale tied to the student's specific behavioral patterns. |
| Escalation flag | If session summaries or incidents contain safety concern, self-harm, abuse, or clinical signals — immediate flag. One recommendation only: escalate to Operation Scholars Admin. |

## **5.4 Trigger Conditions**

| Trigger | When It Fires |
| :---- | :---- |
| New session logged | Counselor submits a session summary. AI immediately analyzes full student data and generates updated counselor guide. |
| New incident logged | A new referral, suspension, or incident is entered. AI updates trend analysis and flags regression if threshold crossed. |
| Plan creation | New success plan built. AI generates initial counselor guide and suggested milestone structure based on baseline data. |
| Milestone missed | Student missed milestone target two consecutive periods. AI generates plan adjustment recommendation. |
| Regression alert | Incident rate increases 25%+ over prior period. AI flags urgently with revised approach. |
| Counselor request | Counselor clicks 'Ask AI' on student profile. Free-form question: 'This student shuts down when I bring up home — how do I approach this?' |

## **5.5 System Prompt Architecture**

| *The AI must cite its sources in every recommendation. Every output includes a sources array with framework name and URL. Non-negotiable. De'marieya must be able to walk into a district meeting and say: 'this recommendation comes from the PBIS Technical Assistance Center.'* |
| :---- |

| Prompt Component | Content |
| :---- | :---- |
| Role | You are a behavioral support intelligence system for Operation Scholars, a counseling contractor serving middle and high school students in California's Central Valley. You assist school counselors with evidence-based intervention recommendations. |
| Student context | You will receive: student grade, full incident history with dates/types, all session summaries in chronological order, baseline incident rate, current trend data, active success plan status, and prior AI analyses. |
| Framework anchors | All recommendations must be grounded in: PBIS (pbis.org), CASEL SEL framework (casel.org), MTSS, CBT for adolescents, or SAMHSA evidence-based practices. Cite specific framework and URL with every recommendation. |
| Tone | Recommendations written to a counselor, not a student. Professional, specific, actionable. Not clinical jargon. Sentence-level readability and NO i repeat NO em(—) dashes. |
| Scope | Behavioral and social-emotional interventions only. Do not diagnose. Do not recommend medication. Do not replace a licensed clinician. If safety concern detected, flag for escalation — that is the only recommendation. |
| Output format | Return JSON: { problem\_analysis: string, next\_session\_guide: string, recommended\_interventions: \[{intervention, rationale, source: {name, url}}\], escalation\_flag: boolean, escalation\_reason: string | null } |

# **6\. Quantification Model — Charts & Progress Visualization**

| *The headline metric for every student is their incident reduction from baseline. 'This student had 12 office referrals in their first month. They have had 2 in the most recent month — an 83% reduction since we began working with them.' This is what De'marieya leads with in every district meeting.* |
| :---- |

| Chart | What It Shows | When to Use |
| :---- | :---- | :---- |
| Incident Frequency Over Time | Line or bar chart. X \= time period (week/month/year toggle). Y \= incident count. Baseline period highlighted. Trend line shows direction. | Primary progress chart. In every progress report. |
| Incident Type Breakdown | Stacked bar. Shows composition by type (referrals vs. suspensions vs. incidents) over time. | Reveals whether behavior is improving uniformly or shifting between categories. |
| Goal Completion Rate Over Time | Bar chart. X \= session date. Y \= % of goals met. | Shows counseling engagement and effort separate from incident outcomes. |
| Suspension Days Trend | Bar chart. Total suspension days per month. Especially important for OSS. | School boards track suspension days. Include in every district report. |
| Incident Severity Trend | Stacked chart: high/medium/low severity over time. | Progress \= not just fewer incidents but lower severity. |
| Cohort Comparison (Owner/Assistant only) | Average incident reduction % across all students by school, district, or counselor. | De'marieya's population-level impact chart for district meetings. |

## **Time Period Toggles**

| View | Period | Best For |
| :---- | :---- | :---- |
| Week | Current week vs. prior week | Immediate feedback loop for counselors |
| Month | Current month vs. prior months (rolling 6\) | Standard progress check. Plan milestone tracking. |
| Year | Trailing 12 months, quarterly aggregated | District reporting. Sustained impact demonstration. |

# **7\. Session Logging — UX Design Requirement**

One of the biggest problems in the current workflow is counselor time waste: re-entering student name, date, school, and context before writing anything substantive. The session logging form must eliminate all of this.

## **7.1 Auto-Populated Fields**

| Field | How It's Populated |
| :---- | :---- |
| Student name | Counselor navigates to session log from the student's profile — student is pre-selected |
| Session date | Defaults to today. Counselor can change. |
| Counselor name | Pulled from authenticated session — never re-entered |
| School / district | Pulled from student record automatically |
| Session type | Defaults to 'follow\_up'. Dropdown if different. |
| Session format | Pulled from student record (individual/group). Editable. |

Result: The counselor opens a new session log and the only required input is the session summary text. Everything else is pre-populated.

## **7.2 What Counselor Actually Fills In**

| Field | Input Type | Required? |
| :---- | :---- | :---- |
| Session summary | Large free-text area. 'Write what happened in this session.' Primary AI input. | Yes (attended sessions) |
| Attendance status | Dropdown: attended / no-show / rescheduled / cancelled | Yes |
| Duration | Number input, minutes. Default: 30\. | Yes |
| Session goals | Dynamic list: add 1–5 goals, mark each met/not met | Optional |
| Link incidents | Multi-select: link any recent incidents to this session | Optional |

# **8\. Role & Permissions System**

| Permission | Owner | Assistant | Counselor |
| :---- | :---- | :---- | :---- |
| View all students | ✓ | ✓ | Assigned only |
| View student full profile \+ sessions | ✓ | ✓ | Assigned only |
| Create new student records | ✓ | ✓ | ✗ |
| Assign counselors to students | ✓ | ✓ | ✗ |
| Log sessions | ✓ | ✓ | Assigned only |
| Log behavioral incidents | ✓ | ✓ | Assigned only |
| Create/edit success plans | ✓ | ✓ | Assigned only |
| Generate AI analysis / Ask AI | ✓ | ✓ | Assigned only |
| Generate progress reports | ✓ | ✓ | Assigned only |
| View org-wide analytics | ✓ | ✓ | ✗ |
| Create/manage user accounts | ✓ | ✓ (limited) | ✗ |

| *Enforce permissions at the API level, not just the UI. A counselor querying /api/students receives only their assigned students from the database. UI restriction alone is insufficient.* |
| :---- |

# **9\. Technology Stack**

| Layer | Technology | Rationale |
| :---- | :---- | :---- |
| Framework | Next.js 14 (App Router) | Matches QuasarNova's existing stack. |
| Database | PostgreSQL \+ Prisma ORM | Relational model with complex joins. Matches existing QN infrastructure. |
| Auth | NextAuth.js with bcrypt | Role-based session management. Same pattern as Sniper OS. |
| Hosting | Vercel | QuasarNova standard deployment. |
| Charts | Recharts (React) | Lightweight, customizable, no additional license. |
| AI layer | Claude API (claude-sonnet-4-20250514) via /api/ai/analyze | Full student history as context. Problem analysis \+ counselor guide. |
| Web search for AI | Anthropic web\_search tool (trusted domain filter) | Restricts AI to approved behavioral framework sources only. |
| Styling | Tailwind CSS | Matches existing QN stack. |
| PDF generation | React-PDF or Puppeteer | Downloadable progress reports. |

# **10\. Build Phases**

| *Build rule: Do not start Phase 2 until Phase 1 is fully functional and De'marieya can log a real student session from start to finish.* |
| :---- |

## **Phase 1 — Core (Ship First)**

Goal: Log in, add a student, log incidents and sessions, see progress over time.

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| Auth \+ 3-role system | Login. Owner, assistant, counselor roles. | Owner sees all. Counselor sees only assigned. API enforces this. |
| Student profiles | Create/edit/view. Assign counselor. Set school/district/grade. Referral source. Presenting problem. Individual or group. | Full CRUD. Student detail shows all incidents, sessions, progress. |
| Incident logging | Log incident: type, date, severity, description, link to session. | Incident saves. Visible on student profile timeline. |
| Session logging | Pre-populated form. Counselor writes summary \+ marks goals. | Session saves. AI triggered. Session list visible on profile. |
| Baseline setting | Owner/assistant sets baseline incident count and window dates. | Baseline visible. Progress % computed. |
| Incident frequency chart | Bar/line chart with week/month/year toggle. | Renders. Baseline highlighted. Toggle works. |
| Goal completion chart | Bar chart: goal % per session over time. | Visible on student profile. |
| Dashboard | Owner/assistant: all students. Counselor: assigned only. Sort/filter. | Table with incident trend indicator. |

## **Phase 2 — AI Analysis Layer**

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| AI student analysis | /api/ai/analyze receives full student context. Returns problem analysis \+ next session guide \+ interventions \+ escalation flag. | Returns structured JSON. Stored in ai\_analyses. Visible on profile. |
| AI counselor guide | After each session, counselor sees 'AI Briefing for Next Session' on profile. | Specific to this student. Not generic. Cites at least 1 source. |
| Ask AI | Counselor asks free-form question from student profile. | AI responds with contextual answer \+ sources. Saved. |
| Escalation flag UI | If AI flags safety/clinical concern, prominent alert on student profile. | Alert cannot be dismissed without counselor acknowledging action taken. |
| Success plan builder | Create plan: goal statement, target % reduction, focus behaviors, session frequency, milestones. | Plan created. Milestones visible. AI generates initial guide. |
| Milestone tracker | Target incident count vs. actual per week. Met/missed/adjusted. | Updates as sessions logged. Missed 2x \= flag \+ AI recommendation. |

## **Phase 3 — Reporting \+ Analytics**

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| PDF progress report | Student report: baseline vs. current rate, % reduction, incident charts, session summary, plan status, AI growth narrative. | Downloads as PDF. All charts render. |
| Organization analytics | Owner/assistant: aggregate incident reduction by school/district/counselor. | Dashboard with date range filter. |
| Cohort trend chart | Average incident reduction across all active students over time. | Owner/assistant only. |
| Counselor performance view | Per-counselor: students assigned, avg incident reduction %, session frequency. | Table. Not visible to counselors. |

## **Phase 4 — Scale Features (Year 2–3)**

Caseload management dashboard sorted by urgency. Automated session reminders (14 days \+ regression flag). Weekly counselor digest email. Student-facing progress portal (optional). Multi-district export formats.

# **11\. Key Engineering Decisions**

## **Decision 1 — Student Data Privacy (FERPA)**

| Requirement | Implementation |
| :---- | :---- |
| No public URLs | All student records require authentication. No guest access. |
| Row-level access | Counselor filtering at Prisma query level. Any student endpoint not assigned \= 403\. |
| Session summary sensitivity | session\_summary never included in API response unless requester is assigned counselor, assistant, or owner. |
| No identifying data in logs | Never log student names or identifying details in Vercel runtime logs or any external monitoring. |

## **Decision 2 — Computed Fields Server-Side**

goals\_attempted, goals\_met, goal\_completion\_rate, and all incident aggregations are always computed server-side on save. Never compute client-side. Stored values ensure historical reports stay consistent even if formulas change.

## **Decision 3 — AI Source Citation Non-Negotiable**

The /api/ai/analyze route must validate that the response JSON includes at least one intervention with a source URL from the trusted domain list before saving. If AI returns no citable source on any intervention, reject and return error to client.

## **Decision 4 — Chart Data Server-Computed**

All chart data (incident frequency series, goal completion arrays, trend lines) is computed by API endpoints. Frontend renders from returned series. Never compute chart data client-side from raw arrays.

# **12\. Product Naming & Branding**

| Element | Spec |
| :---- | :---- |
| Product name | Operation Scholars OS |
| Short name in UI | Scholars OS |
| URL pattern | scholars.quasarnova.net |
| Color palette | Primary Brand Palette The brand relies on a tightly controlled triadic-leaning scheme, anchored by an earthy primary color and illuminated by a warm accent. • Earthy Olive Green (Approx. Hex: \#5C6B46) • The Role: This acts as the primary dominant color and the structural anchor of the brand. It is used heavily in the background geometry and the foundational elements of the logo (the hands/leaves). • UX Psychology: Green inherently communicates growth, safety, and harmony. By choosing a muted, darker olive tone rather than a bright primary green, the brand projects maturity, institutional trust, and stability—crucial for an organization partnering with schools to provide structured intervention. • Warm Goldenrod (Approx. Hex: \#D6A033) • The Role: This serves as the primary accent color. It guides the user's eye to key information and iconography, such as the central figure in the logo, the stars, the house graphic, and the divider line under the subtitle. • UX Psychology: Yellow/Gold represents youth, energy, enlightenment, and achievement (especially when tied to the star motifs). It provides a necessary visual pop against the heavier green, drawing attention to areas of "success" and "brighter futures." • Crisp White (Hex: \#FFFFFF) • The Role: White is used strictly for high-contrast typography, structural outlines (like the badge and dot grid), and the negative space within the logo. • UX Psychology: It provides breathing room and clarity. In UI design, utilizing pure white against dark, desaturated backgrounds is a classic technique to ensure maximum legibility and cognitive ease for the reader.  |
| Typography | Instrument Serif for headings. IBM Plex Mono for data/scores. Geist for UI body. |
| Logo concept | Shield or graduation cap icon \+ 'Operation Scholars' wordmark in Instrument Serif. |

# **13\. Phase 1 Launch Acceptance Criteria**

| *All of the following must be true before De'marieya uses this system with a real student.* |
| :---- |

| \# | Criterion |
| :---- | :---- |
| 1 | Owner can log in and create a student record with all required fields: referral source, presenting problem, individual or group format. |
| 2 | Owner can create a counselor account and assign the counselor to a student. |
| 3 | Counselor can log in and see only their assigned students. |
| 4 | Counselor cannot view, query, or access any student not assigned to them — verified by direct API test. |
| 5 | Counselor can log a behavioral incident: type, date, severity, description. |
| 6 | Counselor can log a session. Student name, date, school are pre-populated. Counselor writes summary and marks goals. |
| 7 | Incident frequency chart renders with week/month/year toggle. |
| 8 | Owner/assistant can set baseline incident count and window. Progress % is computed and displayed. |
| 9 | Owner dashboard shows all students with incident trend indicator. Counselor sees assigned only. |
| 10 | All student data accessible only to authenticated users with appropriate role. |

QuasarNova LLC  ·  Operation Scholars Build v2.0  ·  April 2026  ·  quasarnova.com