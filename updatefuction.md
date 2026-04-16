# Operation Scholars OS — Engineering Brief

**UI Engagement Layer · Mental Health Notes · Caseload Export** QuasarNova LLC · April 2026 · For: Cursor (Agent 1)

---

## Scope

This brief covers all engineering-layer tasks from the UI Engagement + Features + Mental Notes spec. Design-layer tasks (CSS animation tokens, hover classes, motion styling, badge pulse CSS) are handled separately by the design engineer and are not in scope here.

Seven engineering deliverables, in implementation order:


| #   | Deliverable                                   | Risk                             |
| --- | --------------------------------------------- | -------------------------------- |
| 1   | Remove meetings module                        | Low — UI removal + route comment |
| 2   | Student card full-surface clickability        | Low — routing change             |
| 3   | Mobile search bar — client-side filter        | Low — no API change              |
| 4   | Toast notifications wired to API responses    | Low — install + wire             |
| 5   | Skeleton loaders on data-dependent containers | Low — loading states             |
| 6   | Scroll reveal hook                            | Low — IntersectionObserver       |
| 7   | AI plan of action — schema + prompt + storage | Medium — schema + AI             |
| 8   | Mental health notes — schema + auto-sync      | Medium — new table + trigger     |
| 9   | Caseload export — API route + CSV builder     | Medium — new route               |


---

## Deliverable 1 — Remove Meetings Module

The upcoming meetings feature is being pulled. Do not drop the database table yet — retain it with a comment. Remove all surface-level exposure.

**Remove from the codebase:**

- Dashboard widget or card showing upcoming meetings
- Student profile section for upcoming meetings
- Any nav item labeled "Meetings" or "Schedule"
- Any `GET /api/meetings` route handler
- Any `POST /api/meetings` route handler
- Any `PATCH /api/meetings/[id]` route handler

**Do not remove:**

- The `meetings` table from `schema.prisma` — add this comment above the model:

```prisma
// meetings table — UI removed per client request April 2026.
// Table retained for data safety. Drop in a separate migration
// after confirming De'marieya does not need this data.
model Meeting {
  // ... existing fields unchanged
}

```

**Acceptance:**

- No meetings UI visible anywhere in the app
- No nav item for meetings
- `schema.prisma` still contains the meetings model with the comment above
- `npx prisma validate` passes

---

## Deliverable 2 — Student Card Full-Surface Clickability

The entire student card is the navigation target. Remove any inner `<a>` or `<Link>` wrapping only the student name. The outer card element becomes the single `<Link>`.

**Change in** `components/StudentCard.tsx` **(or equivalent):**

```tsx
// BEFORE — name-only link (remove this pattern)
<div className="...card styles...">
  <Link href={`/students/${student.id}`}>{student.first_name} {student.last_name}</Link>
  <p>{student.school}</p>
</div>

// AFTER — entire card is the Link target
<Link
  href={`/students/${student.id}`}
  className="...card styles... block no-underline"
>
  <p>{student.first_name} {student.last_name}</p>
  <p>{student.school}</p>
</Link>

```

Rules:

- The `href` points to `/students/[id]`
- `className` includes `block` so the Link fills the container
- Remove `no-underline` workarounds that were compensating for the old inner link
- Any buttons inside the card (status change, quick actions) must call `e.stopPropagation()` to prevent triggering card navigation

**Acceptance:**

- Click anywhere on the card body navigates to `/students/[id]`
- Buttons inside the card do not trigger navigation

---

## Deliverable 3 — Mobile Search Bar

Client-side filter on the student list page. No server round-trip. Filters by student name and school as the user types.

**New file:** `components/StudentSearch.tsx`

```tsx
'use client'

import { useState } from 'react'

interface Props {
  onFilter: (query: string) => void
}

export function StudentSearch({ onFilter }: Props) {
  const [value, setValue] = useState('')

  const handleChange = (v: string) => {
    setValue(v)
    onFilter(v)
  }

  return (
    // md:hidden — only visible below 768px breakpoint
    <div className="relative md:hidden mb-4">
      <input
        type="search"
        placeholder="Search students..."
        value={value}
        onChange={e => handleChange(e.target.value)}
        // Styling handled by design engineer
      />
      {value && (
        <button onClick={() => handleChange('')} aria-label="Clear search">
          {/* X icon */}
        </button>
      )}
    </div>
  )
}

```

**In the student list page — filter logic:**

```tsx
'use client'

const [query, setQuery] = useState('')

const filtered = students.filter(s =>
  query === '' ||
  `${s.first_name} ${s.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
  s.school.toLowerCase().includes(query.toLowerCase())
)

// Render StudentSearch above the list
<StudentSearch onFilter={setQuery} />

// Map filtered, not students
{filtered.map((student, i) => (
  <StudentCard key={student.id} student={student} />
))}

```

**Acceptance:**

- On mobile (< 768px), search bar is visible above the student list
- Typing filters students by name and school in real time
- Clear button resets the list to all students
- On desktop (>= 768px), search bar is not visible — `md:hidden` confirmed

---

## Deliverable 4 — Toast Notifications

Install `sonner` and wire success/error/loading toasts to all existing and future API call sites.

**Install:**

```bash
npm install sonner

```

**Wire to** `app/layout.tsx`**:**

```tsx
import { Toaster } from 'sonner'

// Inside the root layout, before closing </body>:
<Toaster
  position="bottom-right"
  toastOptions={{
    style: {
      background: 'white',
      border: '1px solid #e2e8f0',
      color: '#0f172a',
      fontFamily: 'inherit',
    },
    success: { style: { borderLeft: '3px solid #0d6e6e' } },
    error: { style: { borderLeft: '3px solid #dc2626' } },
  }}
/>

```

**Wire to every existing client-side API call. Pattern:**

```tsx
import { toast } from 'sonner'

// On successful session log
toast.success('Session logged')

// On AI analysis triggered (fire-and-forget confirmation)
toast.success('AI briefing generating — check back shortly')

// On incident log
toast.success('Incident recorded')

// On student created
toast.success('Student added')

// On any API error
toast.error('Failed to save — please try again')

// While request is in flight (loading state)
const toastId = toast.loading('Saving...')
// After response:
toast.dismiss(toastId)
toast.success('Saved')

```

**Required toast call sites (audit all existing client components):**

- Session log form submit
- Incident log form submit
- Student create form submit
- Status change confirmation
- Any file upload
- Any form that calls a `POST` or `PATCH` route

**Acceptance:**

- Log a session → success toast appears bottom-right, dismisses after ~3s
- Trigger an API error (e.g. submit empty required field) → error toast appears
- No duplicate toasts from the same action
- Toaster renders in layout — visible across all pages

---

## Deliverable 5 — Skeleton Loaders

Every data-dependent container shows a skeleton while loading. No blank boxes. No full-page spinners. Skeletons match the shape of the content they replace.

**New file:** `components/skeletons/StudentCardSkeleton.tsx`

```tsx
export function StudentCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="skeleton h-4 w-2/5 mb-3" />
      <div className="skeleton h-3 w-3/5 mb-2" />
      <div className="skeleton h-3 w-1/4" />
    </div>
  )
}

```

The `skeleton` class is a CSS shimmer — implemented by the design engineer in `globals.css`. This component just uses it.

**Apply to all data-loading states:**

```tsx
// Student list — while fetching
if (isLoading) {
  return (
    <div className="grid ...">
      {Array.from({ length: 8 }).map((_, i) => (
        <StudentCardSkeleton key={i} />
      ))}
    </div>
  )
}

```

**Additional skeleton components to create:**


| Component            | Where Used           | Shape                         |
| -------------------- | -------------------- | ----------------------------- |
| `SessionRowSkeleton` | Session history list | Full-width row, 3 lines       |
| `ChartSkeleton`      | Chart containers     | Full-width rect, 200px height |
| `AIBriefingSkeleton` | AI analysis panel    | 4 lines of varying width      |
| `StatCardSkeleton`   | Dashboard stat cards | Square with 2 lines           |


Pattern for each: match the bounding box and approximate content shape. Use the `skeleton` CSS class on `<div>` elements.

**Acceptance:**

- Student list shows skeleton cards while data is loading
- Chart containers show skeleton while chart data is fetching
- AI briefing panel shows skeleton while analysis is pending
- No layout shift when real data replaces skeletons

---

## Deliverable 6 — Scroll Reveal Hook

Single reusable hook using IntersectionObserver. Fires once per element. Apply to chart containers, AI briefing panels, and session history lists.

**New file:** `hooks/useScrollReveal.ts`

```typescript
import { useEffect, useRef } from 'react'

export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.unobserve(el) // fires once only — never re-animates
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

```

**Usage (apply to any section that should animate on scroll):**

```tsx
// In student profile page
const chartRef = useScrollReveal()
const aiRef = useScrollReveal()
const sessionRef = useScrollReveal()

<div ref={chartRef} className="scroll-reveal">
  <IncidentChart />
</div>

<div ref={aiRef} className="scroll-reveal">
  <AIBriefingPanel />
</div>

```

The `scroll-reveal` and `revealed` CSS classes are implemented by the design engineer. This hook only adds/removes the class.

**Acceptance:**

- Chart container animates in when scrolled into view
- AI briefing panel animates in when scrolled into view
- Animation only fires once — scrolling back up and down does not re-trigger
- Hook returns a valid ref that attaches to the DOM element

---

## Deliverable 7 — AI Plan of Action

### 7a — Schema Change

Add `plan_of_action` field to `AiAnalysis` model:

```prisma
model AiAnalysis {
  // ... existing fields ...
  plan_of_action  Json?  // Structured next-session guide. See type definition below.
}

```

Run migration:

```bash
npx prisma migrate dev --name add_plan_of_action_to_ai_analyses

```

**TypeScript type for** `plan_of_action` **— add to** `types/ai.ts`**:**

```typescript
export type PlanOfAction = {
  milestone_week: number
  milestone_target: string
  focus_areas: string[]           // 2–3 specific behaviors to address
  opening_strategy: string        // How to open the next session
  techniques: Array<{
    name: string
    description: string
    source_url: string            // Must be from trusted domain list
  }>
  check_in_questions: string[]    // 2–3 personalized questions
  session_goal_suggestions: string[] // Pre-written goal strings counselor can use
  red_flags: string[] | null      // Warning signs specific to this student, or null
}

```

### 7b — Updated AI System Prompt

In `lib/ai/prompts.ts`, append to `ANALYSIS_SYSTEM_PROMPT`:

```typescript
export const PLAN_OF_ACTION_PROMPT_ADDITION = `

In addition to problem_analysis, next_session_guide, recommended_interventions,
escalation_flag, and escalation_reason, you must also generate a plan_of_action
object for the counselor's next session.

The plan_of_action must contain:
- milestone_week: integer — which week of the active success plan the next session falls in
- milestone_target: string — the target for that week, stated plainly
- focus_areas: exactly 2–3 specific behaviors the counselor should address
- opening_strategy: one sentence on how to open the session naturally
- techniques: 2–3 evidence-based techniques, each with name, 1-sentence description,
  and source_url from the trusted domain list (pbis.org, casel.org, samhsa.gov, etc.)
- check_in_questions: 2–3 specific questions personalized to this student's history —
  not generic counseling questions. Reference what has actually happened with this student.
- session_goal_suggestions: 2–3 pre-written goal strings the counselor can use as
  session goals (e.g. 'Student will identify one coping strategy for classroom conflict')
- red_flags: array of warning signs specific to this student's behavioral patterns,
  or null if none

The plan_of_action must be grounded in this student's specific history.
Do not produce generic advice. Reference what has been tried, what worked,
and what the student's next milestone target is.

If escalation_flag is true, set plan_of_action to null.
`

// Merge into ANALYSIS_SYSTEM_PROMPT — append before the closing backtick
export const ANALYSIS_SYSTEM_PROMPT = `
${EXISTING_PROMPT_CONTENT}
${PLAN_OF_ACTION_PROMPT_ADDITION}
`

```

Update the JSON output format instruction in the prompt to include `plan_of_action` in the response schema.

### 7c — Updated AI Response Validation

In `lib/ai/validation.ts`, update `AIAnalysisResponse` type and `validateAIResponse()`:

```typescript
export type AIAnalysisResponse = {
  problem_analysis: string
  next_session_guide: string
  recommended_interventions: Array<{
    intervention: string
    rationale: string
    source: { name: string; url: string }
  }>
  escalation_flag: boolean
  escalation_reason: string | null
  plan_of_action: PlanOfAction | null  // NEW — null when escalation_flag is true
}

export function validateAIResponse(response: AIAnalysisResponse): boolean {
  // Existing intervention source validation — unchanged
  if (!response.recommended_interventions?.length) return false
  const interventionsValid = response.recommended_interventions.every(item => {
    try {
      const url = new URL(item.source?.url ?? '')
      return TRUSTED_DOMAINS.some(domain =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      )
    } catch { return false }
  })
  if (!interventionsValid) return false

  // plan_of_action validation — required unless escalation_flag is true
  if (!response.escalation_flag) {
    if (!response.plan_of_action) return false
    const p = response.plan_of_action
    if (!p.milestone_week || !p.opening_strategy) return false
    if (!p.check_in_questions?.length || !p.session_goal_suggestions?.length) return false
    // Validate technique source URLs
    const techniquesValid = (p.techniques ?? []).every(t => {
      try {
        const url = new URL(t.source_url ?? '')
        return TRUSTED_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith(`.${d}`))
      } catch { return false }
    })
    if (!techniquesValid) return false
  }

  return true
}

```

### 7d — Store plan_of_action in DB

In `lib/ai/analyze.ts`, update the `prisma.aiAnalysis.create()` call:

```typescript
await prisma.aiAnalysis.create({
  data: {
    // ... existing fields ...
    plan_of_action: parsed.plan_of_action ?? null,  // ADD THIS
  }
})

```

### 7e — New API Route for Suggested Goals

When a counselor clicks a suggested goal from the plan of action, it should be addable to the session goals list.

```typescript
// This is UI-only — no new route needed.
// The session goals list already accepts dynamic additions client-side.
// The PlanOfAction component passes onAddGoal() as a prop.
// When clicked, the goal string is appended to the local session_goals state
// before the session form is submitted. It submits as part of the normal
// POST /api/students/[id]/sessions payload.

```

**Acceptance:**

- `plan_of_action` column exists in `ai_analyses` table — Supabase Table Editor confirms
- Log a session with a real summary. AI analysis record in DB contains non-null `plan_of_action`
- `plan_of_action` is null when `escalation_flag` is true
- `validateAIResponse()` rejects a response with no `plan_of_action` when escalation is false
- Suggested goal from plan of action appears in session goals when clicked

---

## Deliverable 8 — Mental Health Notes

### 8a — New Schema

Add to `prisma/schema.prisma`:

```prisma
model MentalHealthNote {
  id                   String        @id @default(uuid())
  tenant_id            String
  student_id           String
  session_id           String?       // Nullable — can exist without a full session record
  counselor_id         String
  report_month         String        // 'YYYY-MM' format — used to group for monthly export
  school               String        // Denormalized for fast export without joins
  date_seen            DateTime
  session_number       Int           // Auto-incremented per student per counselor
  presenting_problems  String[]      // Maps to referral form intervention types
  session_format       SessionFormat
  case_closed          Boolean       @default(false)
  notes                String?       @db.Text  // Brief district-facing notes
  created_at           DateTime      @default(now())

  // Relations
  tenant     Tenant    @relation(fields: [tenant_id], references: [id])
  student    Student   @relation(fields: [student_id], references: [id])
  session    Session?  @relation(fields: [session_id], references: [id])
  counselor  Profile   @relation(fields: [counselor_id], references: [id])

  @@index([tenant_id])
  @@index([tenant_id, report_month])
  @@index([tenant_id, student_id])
  @@map("mental_health_notes")
}

```

Run migration:

```bash
npx prisma migrate dev --name add_mental_health_notes

```

### 8b — Auto-Sync Utility

New file: `lib/mentalNotes.ts`

```typescript
import { format } from 'date-fns'
import { prisma } from './prisma'

export async function syncMentalHealthNote(
  sessionId: string,
  studentId: string,
  tenantId: string
) {
  // Fetch session + student in one query
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      session_date: true,
      counselor_id: true,
      session_format: true,
    }
  })

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      school: true,
      referrals: {
        orderBy: { created_at: 'asc' },
        take: 1,
        select: { intervention_types: true }
      }
    }
  })

  const reportMonth = format(session.session_date, 'yyyy-MM')

  // Count existing notes for this student to determine session_number
  const priorCount = await prisma.mentalHealthNote.count({
    where: { student_id: studentId, tenant_id: tenantId }
  })

  await prisma.mentalHealthNote.create({
    data: {
      tenant_id: tenantId,
      student_id: studentId,
      session_id: sessionId,
      counselor_id: session.counselor_id,
      report_month: reportMonth,
      school: student.school,
      date_seen: session.session_date,
      session_number: priorCount + 1,
      presenting_problems: student.referrals[0]?.intervention_types ?? [],
      session_format: session.session_format,
      case_closed: false,
      notes: null,  // Counselor fills in via PATCH after session
    }
  })
}

```

### 8c — Wire Into Session Save Route

In `app/api/students/[id]/sessions/route.ts`, after the session is created, call `syncMentalHealthNote` fire-and-forget:

```typescript
// After session create — fire-and-forget, same pattern as AI analysis
syncMentalHealthNote(session.id, studentId, tenant.id).catch(err => {
  console.error('[sessions/POST] Mental health note sync failed:', {
    sessionId: session.id,
    error: err instanceof Error ? err.message : 'Unknown'
  })
})

```

### 8d — PATCH Route for District Notes

```typescript
// app/api/mental-health-notes/[id]/route.ts

const PatchSchema = z.object({
  notes: z.string().max(500).optional(),
  case_closed: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Step 1: Auth
  // Step 2: Profile
  // Step 3: Tenant
  // Step 4: Verify the note belongs to this tenant
  const note = await prisma.mentalHealthNote.findUnique({
    where: { id: params.id },
    select: { id: true, tenant_id: true, counselor_id: true }
  })
  if (!note || note.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }
  // Counselors can only update their own notes
  if (profile.role === 'counselor' && note.counselor_id !== profile.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const updated = await prisma.mentalHealthNote.update({
    where: { id: params.id },
    data: parsed.data
  })

  return NextResponse.json({ data: updated })
}

```

### 8e — District Notes Field on Session Form

Add a "District Notes" input below the session summary field in the session log form. This value is submitted separately — it is NOT part of the session create payload. It fires a PATCH to `/api/mental-health-notes/[id]` after the session is created.

```typescript
// In session log form component — after session POST succeeds:
if (districtNotes && createdSession.mentalHealthNoteId) {
  await fetch(`/api/mental-health-notes/${createdSession.mentalHealthNoteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: districtNotes })
  })
}

```

To support this, the session create route should return the created mental health note ID in the response:

```typescript
// In session create route response:
return NextResponse.json({
  data: {
    session,
    mentalHealthNoteId: mentalHealthNote?.id ?? null
  }
}, { status: 201 })

```

**Acceptance:**

- `mental_health_notes` table exists with all fields and `tenant_id NOT NULL`
- Log a session → `mental_health_notes` record created automatically
- Session number increments correctly: 3 sessions for the same student → session_numbers 1, 2, 3
- District Notes input visible on session form, value saves to `mental_health_notes.notes`
- `PATCH /api/mental-health-notes/[id]` — counselor can update their own note
- `PATCH` as wrong counselor → 403

---

## Deliverable 9 — Caseload Export

### 9a — Install date-fns (if not present)

```bash
npm install date-fns

```

### 9b — CSV Builder

New file: `lib/exports/caseload.ts`

```typescript
import { format, parseISO } from 'date-fns'

type MentalHealthNoteWithStudent = {
  student: {
    first_name: string
    last_name: string
    grade: string
  }
  date_seen: Date
  session_number: number
  presenting_problems: string[]
  session_format: string
  case_closed: boolean
  notes: string | null
  school: string
}

export function buildCaseloadCSV(
  notes: MentalHealthNoteWithStudent[],
  month: string  // 'YYYY-MM'
): string {
  const displayMonth = format(parseISO(`${month}-01`), 'MMMM yyyy')
  const school = notes[0]?.school ?? ''

  const headerLines = [
    `Month Of: ${displayMonth}`,
    `School: ${school}`,
  ]

  const columnHeader = [
    'Student Name',
    'Grade',
    'Date Seen',
    'Session #',
    'Presenting Problem',
    'Indiv / Group',
    'Case Closed',
    'Notes',
  ].join(',')

  const rows = notes.map(n => {
    const gradeDisplay = n.student.grade.replace('G', '') // 'G7' → '7'
    return [
      `"${n.student.first_name} ${n.student.last_name}"`,
      gradeDisplay,
      format(new Date(n.date_seen), 'MM/dd'),
      n.session_number,
      `"${n.presenting_problems.join(', ')}"`,
      n.session_format === 'individual' ? 'Indiv' : 'Group',
      n.case_closed ? 'X' : '',
      `"${n.notes ?? ''}"`,
    ].join(',')
  })

  return [...headerLines, columnHeader, ...rows].join('\n')
}

```

### 9c — Export Route

New file: `app/api/exports/caseload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/permissions'
import { getTenantFromRequest } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { buildCaseloadCSV } from '@/lib/exports/caseload'
import { z } from 'zod'

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM format'),
  school: z.string().optional(),
  format: z.enum(['csv', 'json']).default('csv'),
})

export async function GET(req: NextRequest) {
  // Step 1: Auth
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Step 2: Profile
  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  // Step 3: Owner/assistant only
  if (profile.role === 'counselor') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  // Step 4: Tenant
  const tenant = await getTenantFromRequest()
  if (profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  // Step 5: Parse query params
  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    month: searchParams.get('month'),
    school: searchParams.get('school') ?? undefined,
    format: searchParams.get('format') ?? 'csv',
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', code: 'VALIDATION_ERROR', detail: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { month, school, format: exportFormat } = parsed.data

  // Step 6: Query mental health notes
  const notes = await prisma.mentalHealthNote.findMany({
    where: {
      tenant_id: tenant.id,
      report_month: month,
      ...(school ? { school } : {}),
    },
    include: {
      student: {
        select: { first_name: true, last_name: true, grade: true }
      }
    },
    orderBy: [
      { school: 'asc' },
      { student: { last_name: 'asc' } },
      { session_number: 'asc' },
    ]
  })

  if (exportFormat === 'json') {
    return NextResponse.json({ data: notes })
  }

  // CSV export
  const csv = buildCaseloadCSV(notes, month)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="caseload-${month}.csv"`,
    }
  })
}

```

### 9d — Export UI Component

New file: `components/CaseloadExport.tsx`

```tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Props {
  schools: string[]  // List of school names for the dropdown
}

export function CaseloadExport({ schools }: Props) {
  // Default to current month
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [school, setSchool] = useState('')

  const exportUrl = `/api/exports/caseload?month=${month}${school ? `&school=${encodeURIComponent(school)}` : ''}&format=csv`

  return (
    <div className="flex items-end gap-3 p-5 rounded-xl border border-slate-200 bg-white">
      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">
          Month
        </label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          // Input styling handled by design engineer
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1.5">
          School
        </label>
        <select value={school} onChange={e => setSchool(e.target.value)}>
          <option value="">All Schools</option>
          {schools.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Use <a download> — triggers browser file download directly */}
      <a href={exportUrl} download>
        Export Caseload
      </a>
    </div>
  )
}

```

**Wire into the owner dashboard:**

```tsx
// In the owner dashboard page — fetch distinct schools for the dropdown
const schools = await prisma.mentalHealthNote.findMany({
  where: { tenant_id: tenant.id },
  distinct: ['school'],
  select: { school: true },
  orderBy: { school: 'asc' }
})

// Pass to CaseloadExport
<CaseloadExport schools={schools.map(s => s.school)} />

```

**Acceptance:**

- `GET /api/exports/caseload?month=2025-03&format=csv` returns a CSV file
- CSV columns: Student Name, Grade, Date Seen, Session #, Presenting Problem, Indiv / Group, Case Closed, Notes — in that order
- CSV header lines: `Month Of: March 2025` and `School: [name]`
- Date Seen format is `MM/DD` (e.g. `03/15`)
- Grade displays as integer (`7`, not `G7`)
- Session format displays as `Indiv` or `Group`
- `Case Closed` is blank when false, `X` when true
- `GET /api/exports/caseload` as counselor role → 403
- Export UI visible on owner dashboard. Selecting month and school filters the download.
- Month picker defaults to current month

---

## Migration Order

Run in this sequence:

```bash
npx prisma migrate dev --name add_plan_of_action_to_ai_analyses
npx prisma migrate dev --name add_mental_health_notes
npx prisma generate

```

---

## Full Acceptance Gate

### Engineering Layer


| #   | Test                              | Pass Criteria                                                        |
| --- | --------------------------------- | -------------------------------------------------------------------- |
| 1   | Meetings removed from UI          | No meetings visible anywhere. Schema retained with comment.          |
| 2   | Full card clickability            | Click card body → navigates to student profile                       |
| 3   | Mobile search                     | Visible on mobile, hidden on desktop. Filters by name + school.      |
| 4   | Toasts wired                      | Session log → success toast. API error → error toast.                |
| 5   | Skeleton loaders                  | Student list shows skeletons on load. No blank boxes.                |
| 6   | Scroll reveal                     | Charts + AI panel animate in on scroll. Fires once only.             |
| 7   | plan_of_action in DB              | AI analysis record contains non-null `plan_of_action` JSON           |
| 8   | plan_of_action null on escalation | Escalation flag true → `plan_of_action` is null                      |
| 9   | Mental health notes auto-created  | Log session → `mental_health_notes` row created                      |
| 10  | Session number increments         | 3 sessions → session_numbers 1, 2, 3                                 |
| 11  | District notes save               | Notes field on session form → saves to `mental_health_notes.notes`   |
| 12  | CSV export correct format         | Columns match De'marieya's caseload sheet exactly                    |
| 13  | Export auth                       | Counselor → 403 on export route                                      |
| 14  | No PII in server logs             | Grep logs after session save — no student names or session summaries |


---

## End-of-Session Report Format

```
UI ENGAGEMENT + MENTAL NOTES + EXPORT — SESSION REPORT

SHIPPED:
- [list completed deliverables]

SCHEMA MIGRATIONS:
- add_plan_of_action_to_ai_analyses: PASS / FAIL
- add_mental_health_notes: PASS / FAIL

ACCEPTANCE GATE:
- Items 1–14: PASS / FAIL with detail on any failures

DESIGN ENGINEER HANDOFF ITEMS:
- globals.css motion tokens (CSS only — no engineering work)
- Skeleton shimmer CSS class
- scroll-reveal / revealed CSS classes
- StudentCard hover state classes
- TrendBadge pulse animation CSS
- Button micro-interaction classes
- Input focus ring classes
- NavItem active state classes

BLOCKERS:
- [anything needed before next session]

```

---

*QuasarNova LLC · Operation Scholars OS · Engineering Brief · April 2026*