/**
 * Operation Scholars OS — full test data seed (70 students, Tracy USD, 2024–2025).
 * Uses existing tenant + profiles only (no new Supabase Auth users).
 *
 * Prerequisites: tenant slug exists (default `demarieya`), at least one counselor profile
 * for that tenant, and an owner or assistant for referral `created_by`.
 *
 * Not idempotent: run against an empty DB or reset first.
 *
 * Run: npx prisma db seed
 */
import 'dotenv/config'

import {
  PrismaClient,
  type Grade,
  type IncidentType,
  type SessionType,
  SessionFormat,
  ReferralStatus,
  StudentStatus,
  type Severity,
  PlanStatus,
  SessionFrequency,
  type Profile,
  type Student,
} from '@prisma/client'

import { STUDENTS, STUDENT_COUNT, type SeedStudentRow } from './seed-students-data'

const prisma = new PrismaClient()

/** One entry per seeded student — used for plans, supplemental sessions, sample AI. */
type SeededStudentEntry = {
  student: Student
  tier: SeedStudentRow['tier']
  counselorProfile: Profile
  currentMonthIncidents: number
}

const TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? 'demarieya'

const SCHOOLS = [
  { name: 'Jefferson Middle School', type: 'middle' },
  { name: 'Williams Middle School', type: 'middle' },
  { name: 'Tracy High School', type: 'high' },
  { name: 'West High School', type: 'high' },
]

const DISTRICT = 'Tracy Unified School District'
const SCHOOL_YEAR = '2024-2025'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

/** Typical age on Sept 1, 2024 (CA-style) for seed realism — mid-April birthday. */
function approximateDateOfBirth(grade: Grade): Date {
  const ageOnSept2024: Record<Grade, number> = {
    K: 5,
    G1: 6,
    G2: 7,
    G3: 8,
    G4: 9,
    G5: 10,
    G6: 11,
    G7: 12,
    G8: 13,
    G9: 14,
    G10: 15,
    G11: 16,
    G12: 17,
  }
  const age = ageOnSept2024[grade]
  const birthYear = 2024 - age
  return new Date(birthYear, 3, 15)
}

function generateIncidentTimeline(
  tier: SeedStudentRow['tier'],
  baseline: number,
  currentMonthCount: number,
  intakeDate: Date,
  today: Date
): { month: Date; count: number }[] {
  const months: { month: Date; count: number }[] = []
  const cursor = new Date(intakeDate)
  cursor.setDate(1)

  let monthIndex = 0
  while (cursor <= today) {
    let count: number

    if (monthIndex === 0) {
      count = baseline
    } else {
      const progress = monthIndex / 6
      if (tier === 'A') {
        count = Math.max(
          currentMonthCount,
          Math.round(baseline - (baseline - currentMonthCount) * progress)
        )
      } else if (tier === 'B') {
        const base = Math.round(baseline - (baseline - currentMonthCount) * progress * 0.7)
        count = Math.max(currentMonthCount, base + randomInt(-1, 1))
      } else if (tier === 'C') {
        count = baseline - randomInt(0, 1)
      } else {
        if (monthIndex <= 2) {
          count = Math.max(1, baseline - randomInt(1, 2))
        } else {
          count = currentMonthCount + randomInt(-1, 2)
        }
      }
    }

    months.push({ month: new Date(cursor), count: Math.max(0, count) })
    cursor.setMonth(cursor.getMonth() + 1)
    monthIndex++
  }

  return months
}

const INCIDENT_TYPES: IncidentType[] = [
  'office_referral',
  'suspension_iss',
  'suspension_oss',
  'teacher_referral',
  'behavioral_incident',
]

const SESSION_SUMMARIES: Record<SeedStudentRow['tier'], string[]> = {
  A: [
    'Student arrived on time and engaged positively throughout the session. Reviewed coping strategies from last week — student demonstrated recall and reported using the breathing technique twice this week. Discussed trigger identification. Student identified cafeteria as high-risk environment and we developed a specific plan for that setting. Strong session.',
    'Significant progress today. Student self-reported using check-in strategy before responding to peer provocation and successfully avoided a conflict. Reinforced this win explicitly. Reviewed success plan goals — on track for milestone 3. Student expressed interest in peer mentoring role.',
    "Student came in focused. Completed a brief reflection on last month's incident data — visible recognition of the downward trend. Discussed what is working: structured transitions, morning check-in with Ms. Torres. Student identifies support network growing. Goal completion rate high.",
    'Follow-up after the incident last Tuesday. Student took full accountability without prompting. Analyzed the trigger chain and identified two points where a different choice was available. Developed a redirect plan for similar situations. Resilience is evident.',
  ],
  B: [
    'Productive session. Student engaged but required redirection twice. Made progress on emotional vocabulary — can now name frustration and disappointment as distinct states. Still working on using the language in the moment. One minor incident this week but student reported it proactively.',
    'Session today focused on the hallway incident from Monday. Student showed some defensiveness initially but opened up with time. Identified peer pressure as contributing factor. Discussed peer resistance strategies. Homework: practice one boundary-setting conversation before next session.',
    'Good energy today. Reviewed goal progress — 3 of 5 goals met this week, which is improvement. Student is inconsistent in unstructured settings but much better in classrooms with structured routines. Working on generalizing skills to PE and lunch periods.',
    'Student arrived with some frustration from morning class. We spent first 10 minutes on de-escalation before beginning the session agenda. Once regulated, had a strong conversation about long-term goals. Connection between behavior and future plans becoming clearer.',
  ],
  C: [
    "Session occurred but engagement was limited. Student seemed disconnected today. Reviewed current plan — limited progress on goals 2 and 3. Student acknowledges the plateau but has not identified clear obstacles. Will consult with De'marieya on adjusting intervention approach. Plan review may be needed.",
    'Difficult session. Student resistant to reflection activities. Completed check-in and brief goal review but student disengaged when discussing incident from last week. External factors (family situation, peer group) appear to be overwhelming current coping capacity. Flagging for review.',
    'Session completed. Student was present but surface-level engagement. Progress on emotional regulation goals remains flat over past 6 weeks. Tried new approach — narrative journaling. Student was receptive. Will assess impact in next session. Considering adding group component.',
    'Steady session — no breakthroughs but no regression either. Student is maintaining but not growing. Discussed obstacles to change. Student identified peer group as barrier they are unwilling to address right now. This is the core sticking point. Need supervisor consultation.',
  ],
  D: [
    'Intake assessment session. Student arrived defensive and minimizing. Spent majority of time building rapport and explaining the program. Completed presenting concerns review. Student identified three triggering situations. Relationship groundwork is the priority right now.',
    "Second session. Student slightly more open than intake. Completed baseline behavioral review with student's input. Significant home stressors present. Student acknowledged behavior has escalated but attributes it entirely to external causes. Will work on internal locus gently.",
    'Session following suspension. Student is frustrated with the school system. Validated feelings while maintaining focus on choices within student\'s control. Introduced the idea of a personal success plan. Student reluctant but agreed to return next week.',
    "Crisis follow-up session. Student was calmer than expected. Discussed the incident in detail — student showed some insight about escalation pattern. Immediate safety plan created. Supervisor notified. Family contact made by De'marieya. Next session in 3 days.",
  ],
}

const SESSION_TYPES_NON_INTAKE: SessionType[] = [
  'check_in',
  'emotional_regulation',
  'behavioral_observation',
  'classroom_support',
]

async function seedSuccessPlans(
  entries: SeededStudentEntry[],
  tenantId: string
): Promise<void> {
  console.log('\n🌱 Seeding success plans...')

  const focusBehaviors: Record<SeedStudentRow['tier'], string[]> = {
    A: [
      'Reduce office referrals to 0–1 per month',
      'Develop 2 coping strategies for frustration',
      'Complete full class periods without incident',
    ],
    B: [
      'Reduce office referrals by 60%',
      'Practice peer conflict resolution weekly',
      'Improve goal completion rate to 75%+',
    ],
    C: [
      'Stabilize incident rate',
      'Identify and address plateau barriers',
      'Re-engage with counseling goals',
    ],
    D: [
      'Establish counseling relationship',
      'Complete intake assessment goals',
      'Reduce incidents by 30% from current rate',
    ],
  }

  for (const { student, tier, counselorProfile, currentMonthIncidents } of entries) {
    const targetReduction =
      tier === 'A' ? 80 : tier === 'B' ? 60 : tier === 'C' ? 40 : 30

    const baseline = student.baseline_incident_count ?? 0

    const milestones = [1, 2, 3, 4].map(week => ({
      week_number: week,
      target_incident_count: Math.max(
        0,
        Math.round(baseline * (1 - (targetReduction / 100) * (week / 4)))
      ),
      target_goal_completion_pct: 50 + week * 10,
      specific_goals: focusBehaviors[tier].slice(0, 2),
      counselor_strategy: [
        'CBT-based trigger identification and coping plan development',
        'Structured de-escalation practice with role play',
        'Positive reinforcement schedule with weekly check-in',
        'Peer conflict mediation and social skills building',
      ][week - 1],
      status: week === 1 ? 'met' : week === 2 ? 'in_progress' : 'upcoming',
      actual_incident_count:
        week === 1 ? Math.max(0, baseline - 2) : null,
      actual_goal_completion_pct: week === 1 ? 55.0 : null,
      notes: week === 1 ? 'Initial milestone. Baseline established.' : null,
    }))

    const planCompleted =
      tier === 'A' && baseline - currentMonthIncidents > 8

    await prisma.successPlan.create({
      data: {
        tenant_id: tenantId,
        student_id: student.id,
        created_by: counselorProfile.id,
        status: planCompleted ? PlanStatus.completed : PlanStatus.active,
        goal_statement: `${student.first_name} will reduce office referrals by ${targetReduction}% from baseline and develop ${tier === 'A' ? '3' : '2'} evidence-based coping strategies by end of school year.`,
        target_reduction_pct: targetReduction,
        plan_duration_weeks: tier === 'D' ? 8 : 16,
        focus_behaviors: focusBehaviors[tier],
        session_frequency:
          tier === 'D'
            ? SessionFrequency.weekly
            : tier === 'C'
              ? SessionFrequency.weekly
              : SessionFrequency.biweekly,
        milestones,
        ai_counselor_guide: 'PENDING — AI guide will generate on first profile view.',
        plan_notes: `Success plan created at intake. Tier ${tier} trajectory. Baseline: ${baseline} incidents in first 30 days.`,
      },
    })
  }

  console.log(`✅ Success plans seeded: ${entries.length}`)
}

async function seedDetailedSessions(
  entries: SeededStudentEntry[],
  tenantId: string
): Promise<void> {
  console.log('\n🌱 Seeding supplemental session detail...')

  const eligibleStudents = entries.filter(
    e =>
      (e.tier === 'A' || e.tier === 'B') &&
      new Date(e.student.intake_date) < new Date('2024-11-01')
  )

  const detailedSummaries: Record<'A' | 'B', [string, string]> = {
    A: [
      "Student arrived early and initiated conversation about last week's peer conflict in PE. Demonstrated clear application of the STOP technique — stopped, thought, observed, proceeded — before responding. Peer conflict resolved without staff involvement. Reviewed success plan: 4 of 4 goals met this week. Discussed transition plan for reduced session frequency. Student confident and motivated.",
      'Final session before spring break. Conducted a full retrospective review with the student present — showed them their incident chart from September to now. Student visibly moved by the visual progress. Set 3 goals for the break period. Discussed what to do if a conflict arises without access to counselor. Student named 2 trusted adults at home. Strong close to a strong month.',
    ],
    B: [
      'Productive session with some regression to address. Student had two incidents this week, both in the lunchroom. Analyzed the pattern — hunger and unstructured time are consistent triggers. Proposed a structured lunch check-in with Ms. Torres. Student agreed. Goal completion rate this week was 60% — slightly below target but student showed good self-awareness about what got in the way.',
      'Session focused on upcoming CAASPP testing period — historically a high-incident window for this student. Developed a specific test-week plan: morning check-in, quiet space access, permission to request a break. Student engaged well. Reviewed coping card created in session 4. Student still carries it. Positive indicator of internalization.',
    ],
  }

  for (const { student, tier, counselorProfile } of eligibleStudents) {
    if (tier !== 'A' && tier !== 'B') continue

    const recentDates = [new Date('2025-03-01'), new Date('2025-03-08')]

    for (let i = 0; i < recentDates.length; i++) {
      const numGoals = 3
      const goalsMet = tier === 'A' ? 3 : 2

      await prisma.session.create({
        data: {
          tenant_id: tenantId,
          student_id: student.id,
          counselor_id: counselorProfile.id,
          session_date: recentDates[i]!,
          session_type: 'check_in',
          session_format: SessionFormat.individual,
          duration_minutes: 45,
          attendance_status: 'attended',
          session_summary: detailedSummaries[tier][i],
          session_goals: [
            { goal: 'Apply STOP technique when triggered', met: true },
            { goal: 'Complete full class period without referral', met: tier === 'A' },
            {
              goal: 'Report proactively to counselor if conflict arises',
              met: goalsMet === 3,
            },
          ],
          goals_attempted: numGoals,
          goals_met: goalsMet,
          goal_completion_rate: Math.round((goalsMet / numGoals) * 100 * 100) / 100,
        },
      })
    }
  }

  console.log(
    `✅ Supplemental sessions seeded for ${eligibleStudents.length} students`
  )
}

async function seedSampleAIAnalyses(entries: SeededStudentEntry[]): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.log(
      '\n⚠️  OPENAI_API_KEY not set — skipping sample AI analyses (set key to enable).'
    )
    return
  }

  console.log('\n🌱 Running AI analysis for 5 representative students...')
  console.log(
    '   (Full AI analysis will trigger automatically as sessions are logged in production)'
  )

  const sampleStudents = [
    entries.filter(e => e.tier === 'A')[0],
    entries.filter(e => e.tier === 'A')[1],
    entries.filter(e => e.tier === 'B')[0],
    entries.filter(e => e.tier === 'C')[0],
    entries.filter(e => e.tier === 'D')[0],
  ].filter(Boolean) as SeededStudentEntry[]

  const { triggerAIAnalysis } = await import('../lib/ai/analyze')

  for (const { student } of sampleStudents) {
    try {
      console.log(`   → Analyzing ${student.first_name} ${student.last_name}...`)
      await triggerAIAnalysis(student.id, 'plan_creation')
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (err) {
      console.error(
        `   ⚠️  AI analysis failed for ${student.first_name} ${student.last_name}:`,
        err
      )
      console.error(
        '   Skipping — student data is seeded, AI will retry on first profile view.'
      )
    }
  }

  console.log('✅ Sample AI analyses complete')
}

async function main() {
  console.log('Starting Operation Scholars OS seed...')

  let tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Operation Scholars',
        slug: TENANT_SLUG,
        subdomain: 'demarieya.scholars-os.vercel.app',
        owner_email: 'demarieya@operationscholars.com',
        plan: 'starter',
        active: true,
      },
    })
    console.log('Tenant created:', tenant.slug)
  } else {
    console.log('Tenant found:', tenant.slug)
  }

  const counselors = await prisma.profile.findMany({
    where: { tenant_id: tenant.id, role: 'counselor', active: true },
    orderBy: { created_at: 'asc' },
  })
  if (counselors.length === 0) {
    throw new Error(
      'No counselor profiles for this tenant. Create your test counselor(s) in Supabase Auth + profiles first; this seed does not add users.'
    )
  }

  const creatorProfile =
    (await prisma.profile.findFirst({
      where: { tenant_id: tenant.id, role: 'owner', active: true },
    })) ??
    (await prisma.profile.findFirst({
      where: { tenant_id: tenant.id, role: 'assistant', active: true },
    })) ??
    counselors[0]

  if (!creatorProfile) {
    throw new Error('Could not resolve a profile for referral created_by.')
  }

  console.log(
    `Using ${counselors.length} counselor(s); referrals created_by: ${creatorProfile.role} (${creatorProfile.email})`
  )

  const today = new Date('2025-03-15')
  let studentCount = 0
  const seededStudents: SeededStudentEntry[] = []

  for (const s of STUDENTS) {
    if (!SCHOOLS.some(sc => sc.name === s.school)) {
      throw new Error(`Unknown school for seed row: ${s.school}`)
    }

    const counselorProfile = counselors[s.counselorIndex % counselors.length]!
    const intakeDate = new Date(s.intakeDate)

    const student = await prisma.student.create({
      data: {
        tenant_id: tenant.id,
        first_name: s.firstName,
        last_name: s.lastName,
        date_of_birth: approximateDateOfBirth(s.grade),
        grade: s.grade,
        school: s.school,
        district: DISTRICT,
        school_year: SCHOOL_YEAR,
        assigned_counselor_id: counselorProfile.id,
        referral_source: s.referredBy,
        presenting_problem: s.presenting,
        intake_date: intakeDate,
        status: StudentStatus.active,
        session_format: randomItem([SessionFormat.individual, SessionFormat.group]),
        baseline_incident_count: s.baselineIncidents,
        baseline_window_start: intakeDate,
        baseline_window_end: addDays(intakeDate, 30),
        escalation_active: s.tier === 'D' && s.currentMonthIncidents >= 9,
      },
    })

    const referralStatus: ReferralStatus =
      s.tier === 'A' && s.currentMonthIncidents <= 2
        ? ReferralStatus.completed
        : s.tier === 'D'
          ? ReferralStatus.open
          : ReferralStatus.in_progress

    await prisma.referral.create({
      data: {
        tenant_id: tenant.id,
        student_id: student.id,
        referral_date: intakeDate,
        referred_by: s.referredBy,
        brief_description: s.presenting.substring(0, 200),
        intervention_types: s.interventions,
        status: referralStatus,
        assigned_to: counselorProfile.id,
        created_by: creatorProfile.id,
      },
    })

    const skipConsent = s.tier === 'D' && new Date(s.intakeDate) > new Date('2025-02-01')
    if (!skipConsent) {
      await prisma.consentRecord.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          school_year: SCHOOL_YEAR,
          parent_guardian_name: `Parent of ${s.firstName} ${s.lastName}`,
          consent_date: addDays(intakeDate, randomInt(1, 7)),
          district: DISTRICT,
          school: s.school,
          behaviorist_name: counselorProfile.name,
          status: 'active',
          created_by: counselorProfile.id,
        },
      })
    }

    const incidentTimeline = generateIncidentTimeline(
      s.tier,
      s.baselineIncidents,
      s.currentMonthIncidents,
      intakeDate,
      today
    )

    for (let mi = 0; mi < incidentTimeline.length; mi++) {
      const { month, count } = incidentTimeline[mi]!
      for (let i = 0; i < count; i++) {
        const incidentDate = addDays(month, randomInt(0, 27))
        const incidentType = randomItem(INCIDENT_TYPES)
        const isSuspension =
          incidentType === 'suspension_iss' || incidentType === 'suspension_oss'

        const severity: Severity =
          s.tier === 'A' && mi > 2
            ? 'low'
            : randomItem(['low', 'medium', 'medium', 'high'] as const)

        await prisma.behavioralIncident.create({
          data: {
            tenant_id: tenant.id,
            student_id: student.id,
            incident_date: incidentDate,
            incident_type: incidentType,
            suspension_days: isSuspension ? randomItem([0.5, 1, 1, 2, 3]) : null,
            severity,
            description: `Behavioral incident recorded on ${incidentDate.toLocaleDateString()}. ${s.presenting.substring(0, 80)}.`,
            reported_by: s.referredBy,
            logged_by: counselorProfile.id,
          },
        })
      }
    }

    const sessionDates: Date[] = []
    let sessionCursor = addDays(intakeDate, 7)
    while (sessionCursor <= today) {
      sessionDates.push(new Date(sessionCursor))
      sessionCursor = addDays(sessionCursor, randomInt(7, 14))
    }

    const summaries = SESSION_SUMMARIES[s.tier]

    for (let i = 0; i < sessionDates.length; i++) {
      const sessionDate = sessionDates[i]!
      const isAttended =
        Math.random() > (s.tier === 'C' ? 0.25 : s.tier === 'D' ? 0.2 : 0.1)
      const numGoals = randomInt(2, 4)
      const goalsMetCount = isAttended
        ? s.tier === 'A'
          ? numGoals
          : s.tier === 'B'
            ? randomInt(2, numGoals)
            : randomInt(1, 2)
        : 0

      const goalPool = [
        'Use breathing technique before responding to frustration',
        'Complete class period without office referral',
        'Practice one peer conflict resolution strategy',
        'Attend all scheduled classes',
        'Report to counselor before leaving a triggering situation',
        'Identify and name emotional state when escalating',
      ]

      const sessionGoals = Array.from({ length: numGoals }, (_, idx) => ({
        goal: goalPool[idx % goalPool.length]!,
        met: idx < goalsMetCount,
      }))

      const goalsAttempted = numGoals
      const goalsMet = goalsMetCount
      const goalCompletionRate =
        goalsAttempted > 0
          ? Math.round((goalsMet / goalsAttempted) * 100 * 100) / 100
          : 0

      const sessionType: SessionType =
        i === 0 ? 'intake_assessment' : randomItem(SESSION_TYPES_NON_INTAKE)

      await prisma.session.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          counselor_id: counselorProfile.id,
          session_date: sessionDate,
          session_type: sessionType,
          session_format: SessionFormat.individual,
          duration_minutes: randomItem([30, 30, 45, 60]),
          attendance_status: isAttended
            ? 'attended'
            : randomItem(['no_show', 'rescheduled'] as const),
          session_summary: isAttended ? randomItem(summaries) : null,
          session_goals: sessionGoals,
          goals_attempted: goalsAttempted,
          goals_met: goalsMet,
          goal_completion_rate: goalCompletionRate,
        },
      })
    }

    seededStudents.push({
      student,
      tier: s.tier,
      counselorProfile,
      currentMonthIncidents: s.currentMonthIncidents,
    })

    studentCount++
    if (studentCount % 10 === 0) {
      console.log(`  ${studentCount}/${STUDENT_COUNT} students seeded...`)
    }
  }

  const supplementalEligibleCount = seededStudents.filter(
    e =>
      (e.tier === 'A' || e.tier === 'B') &&
      new Date(e.student.intake_date) < new Date('2024-11-01')
  ).length

  await seedSuccessPlans(seededStudents, tenant.id)
  await seedDetailedSessions(seededStudents, tenant.id)
  await seedSampleAIAnalyses(seededStudents)

  console.log('')
  console.log('Seed complete.')
  console.log(`  Students: ${STUDENT_COUNT}`)
  console.log('  Tier A (strong reducers): 25')
  console.log('  Tier B (moderate progress): 25')
  console.log('  Tier C (plateau): 10')
  console.log('  Tier D (regression/recent): 10')
  console.log('')
  console.log('📊 Seed summary:')
  console.log(`   Success plans:         ${STUDENT_COUNT} (one per student)`)
  console.log(
    `   Supplemental sessions: ~${supplementalEligibleCount * 2} (Tier A + B with 4+ months history)`
  )
  console.log(
    `   AI analyses generated: ${process.env.OPENAI_API_KEY ? '5 (representative sample)' : '0 (OPENAI_API_KEY not set)'}`
  )
  console.log(
    `   AI analyses pending:   ${process.env.OPENAI_API_KEY ? '65 (trigger on first profile view in production)' : '70 (set OPENAI_API_KEY and re-run seed for sample AI)'}`
  )
  console.log('')
  console.log('   Token usage: minimal — AI called for 5 students only when OPENAI_API_KEY is set.')
  console.log('   Remaining students will get AI analysis automatically')
  console.log('   when their first session is logged or profile is viewed.')
  console.log('')
  console.log('Sign in with your existing test owner, counselor, and assistant accounts.')
}

main()
  .catch(e => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
