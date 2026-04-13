# Operation Scholars OS — Engineering Brief

**Multi-Tenancy Migration + Form-Driven Data Model Update**
QuasarNova LLC · April 2026 · For: Cursor (Agent 1)

---

## Overview

Two coordinated changes. They are implemented together because the new
tables introduced by the form data model update must carry `tenant_id`
from day one — building them without it and retrofitting later is
unnecessary work.


| Change                                                                                                                         | Risk                                                | Sequence                       |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------ |
| Multi-tenancy — add `tenant_id` to every table, enforce at query layer, route tenants by subdomain                             | HIGH — touches every table, every query, middleware | M1 → M5, then app code deploy  |
| Form data model — new `referrals` table, new `consent_records` table, `school_year` on students, corrected `session_type` enum | MEDIUM — additive except enum replacement           | Alongside M1–M2, enum after M5 |


**Hard rule:** Do not combine M2 (add nullable) and M4 (enforce NOT NULL)
into a single migration. The nullable → backfill → non-nullable sequence
is mandatory. Skipping it on a live database with existing rows will cause
constraint violations.

---

## Part 1 — Schema Changes

### 1.1 New Table: `tenants`

Add to `prisma/schema.prisma`:

```prisma
enum TenantPlan {
  starter
  growth
  enterprise
}

model Tenant {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique  // URL-safe, lowercase — e.g. 'demarieya'
  subdomain   String     @unique  // Full subdomain — e.g. 'demarieya.scholars-os.vercel.app'
  owner_email String
  plan        TenantPlan @default(starter)
  active      Boolean    @default(true)
  created_at  DateTime   @default(now())

  // Relations
  profiles          Profile[]
  students          Student[]
  referrals         Referral[]
  consent_records   ConsentRecord[]

  @@map("tenants")
}
```

### 1.2 Add `tenant_id` to Every Existing Model

Add these fields to `Profile`, `Student`, `BehavioralIncident`, `Session`,
`SuccessPlan`, and `AiAnalysis`. Pattern is identical for each:

```prisma
tenant_id  String
tenant     Tenant  @relation(fields: [tenant_id], references: [id])

@@index([tenant_id])
```

For `Student`, also add the compound index:

```prisma
@@index([tenant_id, assigned_counselor_id])
```

For `BehavioralIncident`, `Session`, `SuccessPlan`, `AiAnalysis`, also add:

```prisma
@@index([tenant_id, student_id])
```

### 1.3 New Table: `referrals`

```prisma
enum ReferralStatus {
  open
  in_progress
  completed
  closed
}

model Referral {
  id                 String         @id @default(uuid())
  tenant_id          String
  student_id         String
  referral_date      DateTime
  referred_by        String         // Name of referring teacher or admin
  brief_description  String?        @db.Text
  intervention_types String[]       // Array of SessionType values — what was requested
  status             ReferralStatus @default(open)
  assigned_to        String?        // FK → profiles — which behaviorist is assigned
  linked_consent_id  String?        // FK → consent_records — once consent obtained
  created_by         String         // FK → profiles — who entered this referral
  created_at         DateTime       @default(now())
  updated_at         DateTime       @updatedAt

  // Relations
  tenant            Tenant         @relation(fields: [tenant_id], references: [id])
  student           Student        @relation(fields: [student_id], references: [id])
  assigned_profile  Profile?       @relation("AssignedReferrals", fields: [assigned_to], references: [id])
  created_by_profile Profile       @relation("CreatedReferrals", fields: [created_by], references: [id])
  consent_record    ConsentRecord? @relation(fields: [linked_consent_id], references: [id])

  @@index([tenant_id])
  @@index([tenant_id, student_id])
  @@map("referrals")
}
```

### 1.4 New Table: `consent_records`

```prisma
enum ConsentStatus {
  active
  expired
  revoked
}

model ConsentRecord {
  id                   String        @id @default(uuid())
  tenant_id            String
  student_id           String
  school_year          String        // e.g. '2025-2026' — format YYYY-YYYY
  parent_guardian_name String
  consent_date         DateTime
  district             String        // Stored as it was at time of signing
  school               String        // Stored as it was at time of signing
  behaviorist_name     String        // Pre-populated from assigned counselor's name
  status               ConsentStatus @default(active)
  signed_copy_url      String?       // Vercel Blob URL — Phase 2 feature. Nullable until then.
  created_by           String        // FK → profiles
  created_at           DateTime      @default(now())

  // Relations
  tenant             Tenant    @relation(fields: [tenant_id], references: [id])
  student            Student   @relation(fields: [student_id], references: [id])
  created_by_profile Profile   @relation(fields: [created_by], references: [id])
  referrals          Referral[]

  @@index([tenant_id])
  @@index([tenant_id, student_id])
  @@map("consent_records")
}
```

### 1.5 Add `school_year` to `Student`

Add one nullable field to the `Student` model:

```prisma
school_year  String?  // e.g. '2025-2026'. Validated on input as YYYY-YYYY format.
```

### 1.6 Replace `session_type` Enum

Remove the old enum entirely and replace with:

```prisma
enum SessionType {
  intake_assessment       // First meeting — initial assessment of the student
  behavioral_observation  // 'Behavioral observations' — from De'marieya's referral form
  classroom_support       // 'Classroom support' — from referral form
  emotional_regulation    // 'Emotional regulation support' — from referral form
  group_behavior_support  // 'Group behavior support' — from referral form
  peer_conflict_mediation // 'Peer conflict management/mediation' — from referral form
  check_in                // '1:1 Check-ins' — from referral form
  crisis                  // Not on referral form but operationally required
}
```

**This is the only potentially breaking change.** Handle in Section 2 Step 6 below.

---

## Part 2 — Migration Sequence

Run each step as a **separate** Prisma migration. Never combine.

---

### M1 — Create `tenants`, `referrals`, `consent_records` tables. Seed De'marieya's tenant.

```bash
npx prisma migrate dev --name m1_create_tenants_referrals_consent
```

After migration runs, execute this seed SQL in the Supabase SQL Editor:

```sql
INSERT INTO tenants (name, slug, subdomain, owner_email, plan, active)
VALUES (
  'Operation Scholars',
  'demarieya',
  'demarieya.scholars-os.vercel.app',
  'demarieya@operationscholars.com',
  'starter',
  true
);
```

**Verify:** `SELECT id, slug FROM tenants WHERE slug = 'demarieya';` returns exactly one row.
Save the returned `id` — you will need it for M3.

---

### M2 — Add `tenant_id` as NULLABLE + `school_year` to all existing tables. Add indexes.

```bash
npx prisma migrate dev --name m2_add_tenant_id_nullable
```

This migration adds `tenant_id UUID` with a foreign key reference to `tenants(id)` to:
`profiles`, `students`, `behavioral_incidents`, `sessions`, `success_plans`, `ai_analyses`

And adds `school_year VARCHAR` nullable to `students`.

Also adds all indexes specified in Section 1.2 in the same migration.

**Verify:** All 6 tables now show a `tenant_id` column, nullable, in Supabase Table Editor.

---

### M3 — Backfill all existing rows with De'marieya's `tenant_id`.

This is a data migration, not a schema change. Use `prisma db execute`:

```bash
npx prisma db execute --file prisma/sql/m3_backfill_tenant_id.sql --schema prisma/schema.prisma
```

Create `prisma/sql/m3_backfill_tenant_id.sql`:

```sql
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'demarieya';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant demarieya not found — run M1 seed first';
  END IF;

  UPDATE profiles              SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE students              SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE behavioral_incidents  SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE sessions              SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE success_plans         SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE ai_analyses           SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;

  RAISE NOTICE 'Backfill complete for tenant: %', v_tenant_id;
END $$;
```

**Verify before M4 — all of these must return 0:**

```sql
SELECT COUNT(*) FROM profiles             WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM students             WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM behavioral_incidents WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM sessions             WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM success_plans        WHERE tenant_id IS NULL;
SELECT COUNT(*) FROM ai_analyses          WHERE tenant_id IS NULL;
```

**Do not run M4 until every count is 0.**

---

### M4 — Make `tenant_id` NOT NULL on all tables.

Only run after M3 verification passes.

```bash
npx prisma migrate dev --name m4_tenant_id_not_null
```

**Verify:** Attempt to insert a row without `tenant_id` — must fail with a NOT NULL constraint error.

---

### M5 — Deploy tenant-aware application code.

This is a code deploy, not a schema migration. The application must be
deployed before any new write operations happen — M4 adds NOT NULL but
the old code doesn't supply `tenant_id` on writes, which causes insert
failures.

Deploy includes: (1) through (5) in the Code Changes section below.

---

### M6 — Replace `session_type` enum. Run after M5 is live.

Before running the migration, check for any existing rows with old values:

```sql
-- Check for rows using values that are being removed
SELECT COUNT(*) FROM sessions WHERE session_type = 'follow_up';
SELECT COUNT(*) FROM sessions WHERE session_type = 'initial_assessment';
```

If any rows exist with `follow_up`:

```sql
UPDATE sessions SET session_type = 'check_in' WHERE session_type = 'follow_up';
```

If any rows exist with `initial_assessment`:

```sql
UPDATE sessions SET session_type = 'intake_assessment' WHERE session_type = 'initial_assessment';
```

Verify zero rows with old values, then:

```bash
npx prisma migrate dev --name m6_update_session_type_enum
```

---

## Part 3 — Code Changes (M5 Deploy)

### 3.1 `lib/tenant.ts` — New File

```typescript
// lib/tenant.ts
import { headers } from 'next/headers'
import { prisma } from './prisma'
import { cache } from 'react'

// Cached per-request — fetches tenant record from DB exactly once per request lifecycle
export const getTenantFromSlug = cache(async (slug: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, active: true }
  })

  if (!tenant) throw new Error(`Tenant not found: ${slug}`)
  if (!tenant.active) throw new Error(`Tenant inactive: ${slug}`)

  return tenant
})

// Call at the top of every API route handler to get the tenant context.
// Never resolve tenant inline in a route handler.
export async function getTenantFromRequest(): Promise<{ id: string; slug: string }> {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')

  if (!slug) throw new Error('No tenant slug in request headers')

  return getTenantFromSlug(slug)
}
```

### 3.2 `proxy.ts` — Updated Middleware (Next.js 16)

Replace the current `proxy.ts` with this tenant-aware version:

```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''

  // Extract subdomain slug
  // 'demarieya.scholars-os.vercel.app' → 'demarieya'
  // 'localhost:3000' → treat as main domain
  const parts = hostname.split('.')
  const subdomain = parts[0]
  const isMainDomain =
    subdomain === 'scholars-os' ||
    subdomain === 'www' ||
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1')

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  if (!isMainDomain) {
    // Inject tenant slug header for downstream resolution
    supabaseResponse.headers.set('x-tenant-slug', subdomain)

    // Redirect unauthenticated users to login
    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } else {
    // Main domain — still enforce auth
    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

### 3.3 `lib/permissions.ts` — Updated with `tenantId`

Replace `canAccessStudent()` with the tenant-aware version:

```typescript
// lib/permissions.ts
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'

/**
 * Verifies a user can access a specific student record.
 * Now requires tenantId — cross-tenant access is impossible by design.
 * Owner/assistant: verified student belongs to their tenant.
 * Counselor: verified assigned AND in their tenant.
 */
export async function canAccessStudent(
  userId: string,
  role: UserRole,
  studentId: string,
  tenantId: string  // Required — no default
): Promise<boolean> {
  if (role === 'owner' || role === 'assistant') {
    // Verify student belongs to this tenant — don't trust studentId alone
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenant_id: tenantId },
      select: { id: true }
    })
    return student !== null
  }

  // Counselor: must be assigned AND student must be in this tenant
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      tenant_id: tenantId,
      assigned_counselor_id: userId
    },
    select: { id: true }
  })
  return student !== null
}

export async function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, active: true, tenant_id: true }
  })
}
```

### 3.4 Standard API Route Pattern — Updated for Tenant Context

Every API route now follows this 6-step pattern. Update all existing routes:

```typescript
export async function POST(req: NextRequest) {
  // Step 1: Auth
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Step 2: Profile + role
  const profile = await getProfile(user.id)
  if (!profile || !profile.active) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  // Step 3: Tenant — from middleware header, never from client
  const tenant = await getTenantFromRequest()

  // Step 4: Defense-in-depth — session tenant must match request tenant
  if (profile.tenant_id !== tenant.id) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  // Step 5: Resource access check — now includes tenantId
  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  // Step 6: Validate, compute, write — tenant_id always injected server-side
  const record = await prisma.student.create({
    data: { ...parsed.data, tenant_id: tenant.id }
    // tenant_id is NEVER accepted from the request body
  })

  return NextResponse.json({ data: record }, { status: 201 })
}
```

### 3.5 New API Routes Required


| Route                          | Method | Description                                                                         |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| `/api/students/[id]/referrals` | `GET`  | List referrals for a student                                                        |
| `/api/students/[id]/referrals` | `POST` | Create a new referral for an existing student                                       |
| `/api/students/[id]/consent`   | `GET`  | List consent records for a student                                                  |
| `/api/students/[id]/consent`   | `POST` | Create a consent record                                                             |
| `/api/students`                | `POST` | Updated — 3-step intake now creates student + referral + consent in one transaction |


The 3-step intake `POST /api/students` creates all three records in a
Prisma transaction. If consent is skipped (Step 3 is optional), only
the student and referral records are created.

```typescript
// POST /api/students — 3-step intake transaction
const result = await prisma.$transaction(async (tx) => {
  // Step 1 result
  const student = await tx.student.create({ data: { ...studentData, tenant_id: tenant.id } })

  // Step 2 result
  const referral = await tx.referral.create({
    data: { ...referralData, student_id: student.id, tenant_id: tenant.id, created_by: profile.id }
  })

  // Step 3 result — only if consent data provided
  const consent = consentData
    ? await tx.consentRecord.create({
        data: { ...consentData, student_id: student.id, tenant_id: tenant.id, created_by: profile.id }
      })
    : null

  return { student, referral, consent }
})
```

---

## Part 4 — Rule File Updates

Give these to Cursor separately after the migration and code deploy are confirmed working.

### Update `general.mdc`

In the Project Structure section, add to the `lib/` directory:

```
lib/
  tenant.ts       # getTenantFromRequest(), getTenantFromSlug()
```

In the Core Stack section, add one line under Auth:

```
Tenant routing: Subdomain → tenant slug → tenant_id injected by proxy.ts into x-tenant-slug header. All route handlers call getTenantFromRequest() — never resolve tenant inline.
```

### Update `api-routes.mdc`

Replace the 5-step route pattern with the 6-step tenant-aware version from Section 3.4 above.

Add a new section: **Tenant Rules**

- `tenant_id` is NEVER accepted from the request body
- Always call `getTenantFromRequest()` in Step 3
- Always verify `profile.tenant_id === tenant.id` before any DB operation
- Every Prisma write includes `tenant_id: tenant.id` — no exceptions
- Every Prisma read includes `tenant_id` in the `where` clause — no exceptions

### Update `prisma_supabase.mdc`

Add a new section: **Multi-Tenancy Query Pattern**

```typescript
// CORRECT — every query scoped to tenant
const students = await prisma.student.findMany({
  where: {
    tenant_id: tenantId,                                          // always first
    ...(role === 'counselor' ? { assigned_counselor_id: userId } : {})
  }
})

// WRONG — missing tenant_id in where clause
const students = await prisma.student.findMany({
  where: { assigned_counselor_id: userId }
})
// ^ A counselor from Tenant A could see Tenant B students if they guess a student ID
```

---

## Part 5 — Acceptance Gates

### Gate 1 — Multi-Tenancy


| #   | Test                                        | How to Verify                                                                                                                              |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Tenants table exists with De'marieya's row  | Supabase Table Editor: `tenants` table has 1 row, `slug='demarieya'`                                                                       |
| 2   | All 6 tables have `tenant_id NOT NULL`      | Supabase: each table shows NOT NULL constraint on `tenant_id`                                                                              |
| 3   | All existing rows have `tenant_id` set      | `SELECT COUNT(*) FROM students WHERE tenant_id IS NULL;` returns 0. Run for all 6 tables.                                                  |
| 4   | Subdomain middleware injects header         | Hit `demarieya.scholars-os.vercel.app` — Next.js logs show `x-tenant-slug: demarieya`                                                      |
| 5   | Cross-tenant access blocked                 | Create second test tenant. Create student in tenant B. Log in as tenant A user. `GET /api/students/[tenant-B-student-id]` must return 403. |
| 6   | Session contains `tenant_id`                | After login, confirm `profile.tenant_id` is present and matches tenant                                                                     |
| 7   | New student record auto-assigns `tenant_id` | `POST /api/students` → verify `tenant_id` is set in DB, not null                                                                           |


### Gate 2 — Form Data Model


| #   | Test                                       | How to Verify                                                                                                                       |
| --- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `referrals` table exists                   | Supabase: all fields from Section 1.3 present                                                                                       |
| 2   | `consent_records` table exists             | Supabase: all fields from Section 1.4 present                                                                                       |
| 3   | `school_year` on `students`                | Supabase: `students` table has `school_year` nullable column                                                                        |
| 4   | New `session_type` values work             | Create session with `session_type='behavioral_observation'` — no error. Try `'follow_up'` — must fail validation.                   |
| 5   | 3-step intake creates all 3 records        | Full intake flow: verify `students`, `referrals`, `consent_records` rows all created and linked                                     |
| 6   | Quick referral for existing student        | From existing student profile, create new referral. Verify: new `referrals` row, correct `student_id`, no duplicate student record. |
| 7   | District pre-populates from tenant default | New student: district defaults to `'Tracy Unified School District'`. Field is editable.                                             |


---

## End-of-Session Report Format

```
MULTI-TENANCY + FORM MIGRATION SESSION REPORT

SHIPPED:
- [list completed items]

MIGRATION STATUS:
- M1: PASS / FAIL
- M2: PASS / FAIL
- M3: PASS / FAIL — null row counts: [list per table]
- M4: PASS / FAIL
- M5 (code deploy): PASS / FAIL
- M6 (enum): PASS / FAIL

ACCEPTANCE GATE 1 (Multi-Tenancy):
- Item 1–7: PASS / FAIL with detail

ACCEPTANCE GATE 2 (Form Data Model):
- Item 1–7: PASS / FAIL with detail

BLOCKERS / OPEN DECISIONS:
- [anything needed before next session]
```

---

*QuasarNova LLC · Operation Scholars OS · Multi-Tenancy + Form Migration Brief · April 2026*