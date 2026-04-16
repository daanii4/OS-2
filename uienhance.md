# Operation Scholars OS — Cursor Build File

### UI Engagement Layer · Feature Updates · Mental Notes Export

**QuasarNova LLC · Agent 1 (Cursor) · April 2026**

> This file is the implementation directive for Cursor. It covers what to build, exactly how to build it, and the acceptance gate every item must pass before it is considered done. Design-layer decisions (visual polish, typography refinements, component depth) are flagged separately and owned by the Solutions UI/UX Designer — do not implement those without the designer's spec.

---

## Change Summary


| #   | Area                                  | Type           | Owner              |
| --- | ------------------------------------- | -------------- | ------------------ |
| 1   | Motion & Engagement System            | UI + Code      | Agent 1 + Designer |
| 2   | Student Card — Full Surface Clickable | Code           | Agent 1            |
| 3   | Mobile Search Bar — Student List      | Code           | Agent 1            |
| 4   | Remove Upcoming Meetings              | Code           | Agent 1            |
| 5   | Session AI Plan of Action             | AI + Data + UI | Agent 1            |
| 6   | Mental Health Notes Data Model        | Data + Code    | Agent 1            |
| 7   | Caseload Export (District Invoice)    | Code + UI      | Agent 1            |


---

## 1 — Motion & UI Engagement System

The platform must feel alive and responsive. Every interaction acknowledges the user. Motion communicates state changes — it never decorates. All durations and easings are defined once as tokens and referenced everywhere. No hardcoded values in component files.

> **Designer note (side):** The overall motion aesthetic targets Linear's dashboard feel with clinical warmth — fast, authoritative, not playful. The teal/amber brand palette anchors all motion states. Visual polish of individual component hover treatments (gradient fills, elevation curves, brand shadow color calibration) is the designer's call — implement the structural behavior first.

### 1.1 Motion Tokens — `globals.css`

Add to `:root` in `globals.css`. All animation durations and easings in every component file must reference these variables. Never hardcode `150ms` or `cubic-bezier(...)` directly in a component.

```css
/* globals.css — Motion token system */
:root {
  /* Durations */
  --duration-instant: 80ms;   /* state toggles, checkbox, toggle switches */
  --duration-fast:    150ms;  /* hover color/shadow changes */
  --duration-normal:  220ms;  /* card lifts, drawer opens, tab switches */
  --duration-slow:    350ms;  /* page transitions, modal enters */
  --duration-reveal:  500ms;  /* staggered list reveals on page load */

  /* Easings */
  --ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1.0); /* elements entering screen */
  --ease-in:     cubic-bezier(0.4, 0.0, 1.0, 1.0); /* elements leaving screen */
  --ease-both:   cubic-bezier(0.4, 0.0, 0.2, 1.0); /* elements moving on screen */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* bouncy — use sparingly: badges, new items */

  /* Shadows — elevation system */
  --shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.06);
  --shadow-primary: 0 4px 14px 0 rgb(92 107 70 / 0.18); /* olive-600 brand shadow for primary CTAs */
}

/* WCAG 2.3 — respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

```

### 1.2 Student Card — Full Surface Hover + Click

The entire card surface is the click target. Wrap in a Next.js `Link`. Remove any inner name-only `<a>` tag.

```tsx
// components/StudentCard.tsx
<Link
  href={`/students/${student.id}`}
  className={`
    group relative block rounded-xl border border-slate-200 bg-white
    p-5 no-underline
    shadow-[var(--shadow-sm)]
    transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]
    hover:border-teal-300
    hover:shadow-[var(--shadow-lg)]
    hover:-translate-y-0.5
    hover:bg-gradient-to-br hover:from-white hover:to-[#f3f7e8]
    active:translate-y-0 active:shadow-[var(--shadow-sm)]
    focus-visible:outline-none focus-visible:ring-2
    focus-visible:ring-teal-500 focus-visible:ring-offset-2
  `}
>
  {/* Left accent bar — animates width on hover */}
  <div className={`
    absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-teal-500
    transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]
    group-hover:w-1 group-hover:bg-teal-600
  `} />

  {/* Student name */}
  <p className='font-semibold text-slate-900 group-hover:text-teal-700
    transition-colors duration-[150ms]'>
    {student.first_name} {student.last_name}
  </p>

  {/* Trend badge + school — opacity on hover */}
  <div className={`
    mt-3 flex items-center gap-2
    opacity-80 group-hover:opacity-100
    transition-opacity duration-[150ms]
  `}>
    <TrendBadge trend={student.trend} />
    <span className='text-xs text-slate-500'>{student.school}</span>
  </div>

  {/* Arrow icon — slides in on hover */}
  <ChevronRight className={`
    absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400
    opacity-0 translate-x-[-4px]
    transition-all duration-[150ms] ease-[cubic-bezier(0.0,0,0.2,1)]
    group-hover:opacity-100 group-hover:translate-x-0
  `} />
</Link>

```

### 1.3 Trend Badge — Semantic Motion

The badge communicates incident direction. Regression badges get a slow pulse to signal urgency without alarm. Never pulse an improving or stable badge.

```css
/* globals.css */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
.badge-regression {
  animation: pulse-soft 2.5s ease-in-out infinite;
}

```

```tsx
// components/TrendBadge.tsx
const config = {
  improving:  { label: '↓ Improving',      bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', pulse: false },
  regressing: { label: '↑ Needs Attention', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     pulse: true  },
  stable:     { label: '→ Stable',          bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   pulse: false },
}

<span className={`
  inline-flex items-center gap-1 px-2 py-0.5 rounded-full
  text-xs font-medium border
  ${c.bg} ${c.text} ${c.border}
  ${c.pulse ? 'badge-regression' : ''}
`}>
  {c.label}
</span>

```

### 1.4 Staggered Page Load — Student List

Cards animate in sequentially on page load. 40ms stagger per card, capped at 8 cards (320ms max) so the delay never feels broken on long lists.

```css
/* globals.css */
@keyframes slide-up-fade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card-enter {
  animation: slide-up-fade var(--duration-reveal) var(--ease-out) both;
}

```

```tsx
// In the student list map:
{students.map((student, i) => (
  <StudentCard
    key={student.id}
    student={student}
    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
    className='card-enter'
  />
))}

```

### 1.5 Button Micro-Interactions

Primary buttons lift 1px on hover, show teal brand shadow, and scale to 0.98 on active. Width must not collapse during loading state.

```tsx
// Primary CTA — 'Log Session', 'Save', etc.
className='
  inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
  bg-teal-700 text-white text-sm font-semibold
  shadow-[var(--shadow-sm)]
  transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]
  hover:bg-teal-800 hover:shadow-[var(--shadow-primary)] hover:-translate-y-px
  active:translate-y-0 active:shadow-[var(--shadow-sm)] active:scale-[0.98]
  focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
'

// Loading state — spinner replaces label, width doesn't collapse
className='... min-w-[120px] justify-center'
{isPending ? <Spinner className='h-4 w-4 animate-spin' /> : 'Log Session'}

```

### 1.6 Form Input Focus States

Every input, textarea, and select transitions to a teal ring on focus. Pairs with the brand color consistently throughout the platform.

```tsx
// All text inputs and selects
className='
  w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5
  text-sm text-slate-900 placeholder:text-slate-400
  transition-all duration-[150ms]
  focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20
  focus:shadow-[0_0_0_3px_rgb(13_110_110_/_0.08)]
  hover:border-slate-300
'

// Session summary textarea
className='
  w-full min-h-[160px] rounded-xl border border-slate-200 bg-white
  px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400
  leading-relaxed resize-none
  transition-all duration-[150ms]
  focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20
  focus:shadow-[0_0_0_3px_rgb(13_110_110_/_0.08)]
'
placeholder='Write what happened in this session. The more detail you add, the better the AI can guide your next visit.'

```

### 1.7 Scroll Reveal — Section Entries

Charts, AI briefing panels, and session history lists animate in on scroll using Intersection Observer. Fires once per element — never replays.

```tsx
// hooks/useScrollReveal.ts
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
          observer.unobserve(el)
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

```css
/* globals.css */
.scroll-reveal {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity   var(--duration-slow) var(--ease-out),
    transform var(--duration-slow) var(--ease-out);
}
.scroll-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

```

```tsx
// Usage on any section:
const ref = useScrollReveal()
<div ref={ref} className='scroll-reveal'>
  <AIBriefingPanel />
</div>

```

### 1.8 Sidebar Nav — Active State Indicator

Active nav item gets a teal left-border indicator bar that animates in on mount. Inactive items have subtle hover background.

```tsx
// components/NavItem.tsx
<Link
  href={href}
  className={`
    relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
    transition-all duration-[150ms]
    ${isActive
      ? 'bg-teal-50 text-teal-800'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }
  `}
>
  {/* Active indicator bar */}
  {isActive && (
    <span className='
      absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-teal-600
      animate-[slide-up-fade_150ms_ease-out_both]
    ' />
  )}
  <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
  {label}
</Link>

```

### 1.9 Toast Notifications — System Feedback

Every save, AI trigger, error, and success gets a toast. No full-page spinners — toasts keep the user in context.

```bash
npm install sonner

```

```tsx
// app/layout.tsx
import { Toaster } from 'sonner'

<Toaster
  position='bottom-right'
  toastOptions={{
    style: {
      background: 'white',
      border: '1px solid #e2e8f0',
      color: '#0f172a',
      fontFamily: 'inherit',
    },
    success: { style: { borderLeft: '3px solid #5C6B46' } },
    error:   { style: { borderLeft: '3px solid #dc2626' } },
  }}
/>

```

```tsx
// Usage throughout the app:
import { toast } from 'sonner'
toast.success('Session logged')         // after POST /api/sessions
toast.success('AI briefing ready')      // when ai_analyses record lands
toast.error('Failed to save — try again') // on API error
toast.loading('Saving...')              // while request is in flight

```

### 1.10 Skeleton Loaders — No Blank Screens

Every data-dependent container shows a skeleton shimmer while loading. The skeleton must match the shape and dimensions of the content it replaces so the layout does not shift when data arrives.

```css
/* globals.css */
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    #f3f7e8 25%,   /* --olive-50 */
    #e4eccc 37%,   /* --olive-100 */
    #f3f7e8 63%    /* --olive-50 */
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}

```

```tsx
// StudentCard skeleton — matches card shape exactly
function StudentCardSkeleton() {
  return (
    <div className='rounded-xl border border-slate-200 bg-white p-5'>
      <div className='skeleton h-4 w-2/5 mb-3' />
      <div className='skeleton h-3 w-3/5 mb-2' />
      <div className='skeleton h-3 w-1/4' />
    </div>
  )
}

```

Show skeletons for: student list, student profile header, chart containers, AI briefing panel, session history list.

---

## 2 — Feature: Remove Upcoming Meetings

Strip the upcoming meetings feature entirely from the UI. Do not drop any database tables yet.

**Remove from UI:**

- Dashboard widget or card showing upcoming meetings
- Student profile section for upcoming meetings
- Any nav item for 'Meetings' or 'Schedule'
- Any calendar integration UI code

**Do not drop from database:** If a `meetings` or `scheduled_sessions` table exists, leave it. Add this comment inline on any retained code:

```
// meetings table — UI removed per client request April 2026, table retained for data safety

```

---

## 3 — Feature: Mobile Search Bar — Student List

On mobile (below 768px), render a search bar above the student card list. Filter client-side on name and school as the user types. No server round-trip.

```tsx
// components/StudentSearch.tsx
'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

export function StudentSearch({ onFilter }: { onFilter: (q: string) => void }) {
  const [value, setValue] = useState('')
  const handleChange = (v: string) => { setValue(v); onFilter(v) }

  return (
    // Only visible on mobile — desktop has sidebar search or is unneeded
    <div className='relative md:hidden mb-4'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none' />
      <input
        type='search'
        placeholder='Search students...'
        value={value}
        onChange={e => handleChange(e.target.value)}
        className='
          w-full rounded-xl border border-slate-200 bg-white
          pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400
          transition-all duration-[150ms]
          focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20
        '
      />
      {value && (
        <button onClick={() => handleChange('')}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'>
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}

```

```tsx
// In the student list page — filter logic
const [query, setQuery] = useState('')
const filtered = students.filter(s =>
  query === '' ||
  `${s.first_name} ${s.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
  s.school.toLowerCase().includes(query.toLowerCase())
)

```

---

## 4 — Feature: Session AI Plan of Action

When the AI generates a session analysis, it must now also produce a structured `plan_of_action` JSON object — a milestone-aware next-session guide separate from the general `next_session_guide`.

### 4.1 Schema — Add to `ai_analyses`

```prisma
// Prisma schema — add to ai_analyses model
plan_of_action Json?

// JSON structure:
// {
//   milestone_week:          number,
//   milestone_target:        string,
//   focus_areas:             string[],      // 2-3 specific behaviors
//   opening_strategy:        string,        // how to open the session
//   techniques:              [{ name: string, description: string, source_url: string }],
//   check_in_questions:      string[],      // 2-3 personalized questions
//   session_goal_suggestions: string[],    // pre-written goal options
//   red_flags:               string[] | null
// }

```

Run migration after schema update.

### 4.2 System Prompt Addition — `lib/ai/prompts.ts`

Append to the existing system prompt. This is additive — do not replace existing prompt content.

```ts
// Append to the existing system prompt — plan_of_action section
const PLAN_OF_ACTION_PROMPT = `
In addition to your problem_analysis and next_session_guide, you must generate a
plan_of_action JSON object for the counselor's next session. This is a structured,
actionable guide that aligns with the student's active success plan milestone.

The plan_of_action must contain:
- milestone_week: which week of the success plan the next session falls in (integer)
- milestone_target: the target for that week, stated plainly
- focus_areas: exactly 2-3 specific behaviors the counselor should address
- opening_strategy: one sentence on how to open the session naturally
- techniques: 2-3 evidence-based techniques, each with name, 1-sentence description,
  and source_url from the trusted domain list
- check_in_questions: 2-3 specific questions to ask this student (personalized to their
  history — not generic counseling questions)
- session_goal_suggestions: 2-3 pre-written goal strings the counselor can use as
  session goals (e.g. 'Student will identify one coping strategy for classroom conflict')
- red_flags: array of warning signs specific to this student's patterns, or null

The plan_of_action must be grounded in this student's specific history.
Do not produce generic advice. Reference what has been tried, what worked, and what
the student's next milestone target is.
`

```

### 4.3 Plan of Action UI Component

Render below the AI briefing section on the student profile. Always open by default when a new analysis has been generated.

```tsx
// components/PlanOfAction.tsx
// Receives plan_of_action JSON from the latest ai_analyses record
<section className='rounded-xl border border-olive-700 bg-[#2d3820] p-5'>
  <div className='flex items-center gap-2 mb-4'>
    <div className='h-2 w-2 rounded-full bg-[#D6A033] animate-pulse' />
    <h3 className='text-xs font-semibold text-[#D6A033] uppercase tracking-widest'>
      Plan of Action — Next Session
    </h3>
    <span className='text-xs text-[#e0b44e] bg-[rgba(214,160,51,0.15)] border border-[rgba(214,160,51,0.2)] px-2 py-0.5 rounded-full'>
      Week {plan.milestone_week}
    </span>
  </div>

  <p className='text-[9px] font-semibold text-white/30 uppercase tracking-[0.07em] mb-1'>This Week's Target</p>
  <p className='text-sm text-white/80 leading-relaxed mb-4'>{plan.milestone_target}</p>

  <p className='text-[9px] font-semibold text-white/30 uppercase tracking-[0.07em] mb-1'>How to Open</p>
  <p className='text-sm text-white/80 leading-relaxed mb-4'>{plan.opening_strategy}</p>

  <p className='text-[9px] font-semibold text-white/30 uppercase tracking-[0.07em] mb-2'>Questions to Ask</p>
  <ul className='space-y-1.5 mb-4'>
    {plan.check_in_questions.map((q, i) => (
      <li key={i} className='flex gap-2 text-sm text-white/70'>
        <span className='text-[#D6A033] font-bold shrink-0'>{i+1}.</span>{q}
      </li>
    ))}
  </ul>

  {/* Suggested session goals — clicking one adds it to session goals */}
  <p className='text-[9px] font-semibold text-white/30 uppercase tracking-[0.07em] mb-2'>Suggested Goals</p>
  <div className='flex flex-wrap gap-2 mb-4'>
    {plan.session_goal_suggestions.map((g, i) => (
      <button key={i} onClick={() => onAddGoal(g)}
        className='text-xs px-3 py-1.5 rounded-lg
          border border-[rgba(214,160,51,0.25)] bg-[rgba(255,255,255,0.05)]
          text-[#e0b44e] hover:bg-[rgba(214,160,51,0.12)] hover:border-[rgba(214,160,51,0.4)]
          transition-all duration-[150ms] active:scale-95'>
        + {g}
      </button>
    ))}
  </div>

  {/* Red flags — only if present */}
  {plan.red_flags && plan.red_flags.length > 0 && (
    <div className='mt-3 rounded-lg bg-[rgba(180,83,9,0.15)] border border-[rgba(180,83,9,0.3)] p-3'>
      <p className='text-xs font-semibold text-amber-400 mb-1.5'>⚠ Watch For</p>
      {plan.red_flags.map((f, i) => (
        <p key={i} className='text-xs text-amber-300/80'>• {f}</p>
      ))}
    </div>
  )}
</section>

```

---

## 5 — Data Model: Mental Health Notes

### 5.1 What This Mirrors

The `mental_health_notes` table maps exactly to De'marieya's **OPERATION SCHOLARS MENTAL HEALTH STUDENT CASELOADS** district sheet. Every row = one student's session for one month. This is the source of truth for the monthly caseload export sent to district offices.

The sheet columns and their data equivalents:


| Sheet Column       | Source                            | Format                                    |
| ------------------ | --------------------------------- | ----------------------------------------- |
| Month Of           | `report_month`                    | `'April 2025'` formatted from `'YYYY-MM'` |
| School             | `school`                          | String — denormalized                     |
| Student Name       | `students.first_name + last_name` | Full name                                 |
| Grade              | `students.grade`                  | Integer                                   |
| Date Seen          | `date_seen`                       | `MM/DD` (month/day only)                  |
| Session #          | `session_number`                  | Integer, auto-incremented per student     |
| Presenting Problem | `presenting_problems[]`           | Comma-joined string                       |
| Indiv / Group      | `session_format`                  | `'Indiv'` or `'Group'`                    |
| Case Closed        | `case_closed`                     | Blank if false, `'X'` if true             |
| Notes              | `notes`                           | Brief plain text                          |


### 5.2 Prisma Schema — `mental_health_notes`

```prisma
model MentalHealthNote {
  id                   String    @id @default(uuid())
  tenant_id            String    // NOT NULL — FK → tenants
  student_id           String    // FK → students
  session_id           String?   // FK → sessions — nullable
  counselor_id         String    // FK → users
  report_month         String    // 'YYYY-MM' — e.g. '2025-04'
  school               String    // denormalized for fast export
  date_seen            DateTime
  session_number       Int
  presenting_problems  String[]  // array of concern strings
  session_format       SessionFormat // 'individual' | 'group'
  case_closed          Boolean   @default(false)
  notes                String?
  created_at           DateTime  @default(now())

  student   Student  @relation(fields: [student_id], references: [id])
  session   Session? @relation(fields: [session_id], references: [id])
  counselor User     @relation(fields: [counselor_id], references: [id])

  @@index([tenant_id, report_month])
  @@index([student_id])
}

```

Run migration after adding the model.

### 5.3 Auto-Population on Session Save

When a counselor logs a session (`POST /api/students/[id]/sessions`), automatically create the corresponding `mental_health_notes` record. Counselors never fill in two forms.

```ts
// lib/mentalNotes.ts
export async function syncMentalHealthNote(
  session: Session,
  student: Student,
  tenantId: string
) {
  const reportMonth = format(session.session_date, 'yyyy-MM')

  const priorCount = await prisma.mentalHealthNote.count({
    where: { student_id: student.id, tenant_id: tenantId }
  })

  await prisma.mentalHealthNote.create({
    data: {
      tenant_id:            tenantId,
      student_id:           student.id,
      session_id:           session.id,
      counselor_id:         session.counselor_id,
      report_month:         reportMonth,
      school:               student.school,
      date_seen:            session.session_date,
      session_number:       priorCount + 1,
      presenting_problems:  student.referral?.intervention_types ?? [],
      session_format:       session.session_format,
      case_closed:          false,
      notes:                null, // counselor fills in optionally after session
    }
  })
}

// Counselor can update after the fact via:
// PATCH /api/mental-health-notes/[id] → { notes: string, case_closed?: boolean }

```

Call `syncMentalHealthNote()` inside the session save route handler, after the session record is created successfully.

### 5.4 District Notes Field — Session Form UI

Add a `District Notes` input below the main session summary field. Optional. Short — a comma-separated tag-style entry like the caseload sheet. Saves to `mental_health_notes.notes` via the PATCH route.

```tsx
// On session detail / log form — below the main session_summary field
<div className='mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100'>
  <label className='text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2'>
    District Notes (optional)
  </label>
  <p className='text-xs text-slate-400 mb-2'>
    Brief notes for the monthly caseload report — e.g. 'Rapport building, family dynamics'
  </p>
  <input
    type='text'
    placeholder="e.g. Rapport building, decision making, grades"
    className='w-full rounded-lg border border-slate-200 px-3 py-2
      text-sm placeholder:text-slate-400
      focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20
      transition-all duration-[150ms]'
  />
</div>

```

---

## 6 — Caseload Export (District Invoice Report)

### 6.1 Export Route

Owner and assistant only. 403 for counselors. Returns CSV or JSON. PDF support is Phase 2.

```ts
// GET /api/exports/caseload?month=2025-04&school=LincolnMS&format=pdf|csv
export async function GET(req: NextRequest) {
  // ... auth + tenant check ...
  if (session.user.role === 'counselor') return new NextResponse(null, { status: 403 })

  const { month, school, format } = parseParams(req)

  const notes = await prisma.mentalHealthNote.findMany({
    where: {
      tenant_id: tenant.id,
      report_month: month,
      ...(school ? { school } : {}),
    },
    include: { student: true },
    orderBy: [{ school: 'asc' }, { student: { last_name: 'asc' } }]
  })

  if (format === 'csv') return buildCSV(notes, month)
  if (format === 'pdf') return buildPDF(notes, month) // Phase 2 — Puppeteer

  return NextResponse.json({ data: notes })
}

```

### 6.2 CSV Builder — Ships in Phase 1

The CSV header must match De'marieya's existing sheet exactly. Districts are used to receiving this format — do not redesign it.

```ts
// lib/exports/caseload.ts
function buildCSV(notes: MentalHealthNoteWithStudent[], month: string) {
  const displayMonth = format(parseISO(month + '-01'), 'MMMM yyyy')

  const header = [
    'Student Name', 'Grade', 'Date Seen', 'Session #',
    'Presenting Problem', 'Indiv / Group', 'Case Closed', 'Notes'
  ].join(',')

  const rows = notes.map(n => [
    `${n.student.first_name} ${n.student.last_name}`,
    n.student.grade,
    format(n.date_seen, 'MM/dd'),
    n.session_number,
    `"${n.presenting_problems.join(', ')}"`,
    n.session_format === 'individual' ? 'Indiv' : 'Group',
    n.case_closed ? 'X' : '',
    `"${n.notes ?? ''}"`,
  ].join(','))

  const schoolLine = `School: ${notes[0]?.school ?? ''}`
  const monthLine  = `Month Of: ${displayMonth}`

  const csv = [monthLine, schoolLine, header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="caseload-${month}.csv"`,
    }
  })
}

```

### 6.3 Export UI — Owner Dashboard

Add to the owner dashboard. Month picker and school dropdown. Click triggers a direct `<a download>` to the CSV route.

```tsx
// components/CaseloadExport.tsx — owner/assistant only
<div className='flex items-end gap-3 p-5 rounded-xl border border-slate-200 bg-white'>
  <div>
    <label className='text-xs font-medium text-slate-500 block mb-1.5'>Month</label>
    <input type='month' value={month} onChange={e => setMonth(e.target.value)}
      className='rounded-lg border border-slate-200 px-3 py-2 text-sm
        focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20
        transition-all duration-[150ms]' />
  </div>
  <div>
    <label className='text-xs font-medium text-slate-500 block mb-1.5'>School</label>
    <select value={school} onChange={e => setSchool(e.target.value)}
      className='rounded-lg border border-slate-200 px-3 py-2 text-sm
        focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20
        transition-all duration-[150ms]'>
      <option value=''>All Schools</option>
      {schools.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
  <a
    href={`/api/exports/caseload?month=${month}&school=${school}&format=csv`}
    download
    className='inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
      bg-teal-700 text-white text-sm font-semibold
      hover:bg-teal-800 hover:shadow-[var(--shadow-primary)] hover:-translate-y-px
      active:scale-[0.98] transition-all duration-[150ms]'>
    <Download className='h-4 w-4' />
    Export Caseload
  </a>
</div>

```

---

## 7 — Acceptance Gates

Every item below must pass before this build is considered shipped.

### 7.1 Motion System


| #   | Test                   | Pass Criteria                                                                                        |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Student card hover     | Card lifts, border turns teal, arrow icon slides in, left bar thickens. All transitions under 220ms. |
| 2   | Student list page load | Cards stagger in with slide-up-fade. 40ms delay per card. No flash of blank content.                 |
| 3   | Regression badge       | 'Needs Attention' badge has soft pulse. Improving badge has no pulse.                                |
| 4   | Primary button hover   | Lifts 1px, teal shadow appears. Click: scales to 0.98.                                               |
| 5   | Input focus            | Teal ring on all form inputs when focused. No outline flash.                                         |
| 6   | Toast notifications    | Session save → toast bottom-right, dismisses after 3s. Error → red-border toast.                     |
| 7   | Skeleton loaders       | Student list shows skeleton cards while loading. Skeletons match card dimensions exactly.            |
| 8   | Scroll reveal          | Charts and AI panel animate in on scroll. Fires once only per element.                               |
| 9   | Reduced motion         | With `prefers-reduced-motion: reduce` set, all animations are instant. Zero motion.                  |


### 7.2 Features


| #   | Test                      | Pass Criteria                                                                                                                                                 |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Full card clickability    | Click anywhere on student card (not just name) → navigates to student profile.                                                                                |
| 2   | Mobile search             | On mobile, search bar visible above student list. Typing filters by name and school. X button clears.                                                         |
| 3   | Meetings removed          | No upcoming meetings section visible anywhere in the app. No nav item for meetings.                                                                           |
| 4   | Plan of action generated  | Log a session with a real summary. Within 5s, `plan_of_action` JSON exists in `ai_analyses` record. UI shows the plan of action panel on the student profile. |
| 5   | Suggested goals clickable | Clicking a suggested goal from the plan of action adds it to the session goals list.                                                                          |


### 7.3 Mental Notes + Export


| #   | Test                                 | Pass Criteria                                                                                                                                   |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `mental_health_notes` table          | Table present in Supabase with all fields from Section 5.2. `tenant_id` NOT NULL.                                                               |
| 2   | Auto-creation on session log         | Log a session. Verify `mental_health_notes` record created automatically with correct `student_id`, `report_month`, `session_number`, `school`. |
| 3   | Session number increments            | Log 3 sessions for same student. Verify `session_number` = 1, 2, 3 in order.                                                                    |
| 4   | District notes field                 | Session form shows 'District Notes' input below summary. Value saves to `mental_health_notes.notes`.                                            |
| 5   | CSV export generates                 | Owner selects month and school, clicks Export. CSV downloads.                                                                                   |
| 6   | CSV format matches sheet             | Open CSV: columns in correct order, month/school in header, Date Seen as MM/DD, session format as 'Indiv'/'Group', `case_closed` blank or 'X'.  |
| 7   | Export restricted to owner/assistant | Log in as counselor, hit `GET /api/exports/caseload` directly → 403.                                                                            |


---

---

## Designer Decisions — Locked ✓

All five pending design decisions have been resolved and applied to this build file. Cursor should implement exactly as specified above.


| Item                 | Decision                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card hover gradient  | `hover:from-white hover:to-[#f3f7e8]` — olive-50 tint. Brand-olive, not teal.                                                                         |
| Primary CTA shadow   | `--shadow-primary: 0 4px 14px 0 rgb(92 107 70 / 0.18)` — olive-600 at 18% opacity. Renamed from `--shadow-teal`. All button hover references updated. |
| Plan of Action panel | `bg-[#2d3820]` — olive-800. Gold pulse dot, white text tiers, amber red-flags block. Matches the AI briefing panel treatment exactly. No teal.        |
| Toast success border | `3px solid #5C6B46` — olive-600. Error remains `#dc2626`.                                                                                             |
| Skeleton shimmer     | `#f3f7e8` → `#e4eccc` → `#f3f7e8` — olive-50 to olive-100 wave. Invisible on the olive-tinted page background.                                        |


---

*Operation Scholars OS · Cursor Build File · QuasarNova LLC · April 2026* *Source: OS_UIEngagement_Features_MentalNotes_Spec.docx*