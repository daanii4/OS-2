import { format, isValid, parseISO } from 'date-fns'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessStudent, getProfile } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { OS_PUBLIC_CONTACT_EMAIL } from '@/lib/brand-contact'
import { getTenantFromRequest } from '@/lib/tenant'

type CoverPageProps = {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}

function parseDateParam(value: string | undefined): Date | null {
  if (!value?.trim()) return null
  const d = parseISO(value.trim())
  return isValid(d) ? d : null
}

export default async function ReportCoverPage({ params, searchParams }: CoverPageProps) {
  const { studentId } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.active) redirect('/login')

  const tenant = await getTenantFromRequest()
  if (profile.tenant_id && profile.tenant_id !== tenant.id) redirect('/login')

  const authorized = await canAccessStudent(profile.id, profile.role, studentId, tenant.id)
  if (!authorized) notFound()

  const student = await prisma.student.findFirst({
    where: { id: studentId, tenant_id: tenant.id },
    select: {
      first_name: true,
      last_name: true,
      school: true,
      district: true,
    },
  })
  if (!student) notFound()

  const fromDate = parseDateParam(sp.from)
  const toDate = parseDateParam(sp.to)
  const formattedFrom = fromDate ? format(fromDate, 'MMMM d, yyyy') : ''
  const formattedTo = toDate ? format(toDate, 'MMMM d, yyyy') : ''

  return (
    <div
      style={{
        width: '816px',
        height: '1056px',
        background: '#2d3820',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px',
        fontFamily: 'system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 70% 60% at 75% 30%, rgba(214,160,51,0.18) 0%, transparent 65%)',
        }}
        aria-hidden
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5px',
          height: '100%',
          background: '#d6a033',
        }}
        aria-hidden
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '80px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <img
          src="/logo-3d.png"
          alt="Operation Scholars"
          style={{
            width: '80px',
            height: '80px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 16px rgba(214,160,51,0.4))',
          }}
        />
        <div>
          <p
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: '24px',
              color: '#ffffff',
              margin: 0,
            }}
          >
            Operation Scholars
          </p>
          <p
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              margin: '4px 0 0',
            }}
          >
            Behavioral Intelligence Platform
          </p>
        </div>
      </div>

      <div
        style={{
          width: '64px',
          height: '2px',
          background: '#d6a033',
          marginBottom: '40px',
          position: 'relative',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '12px',
          }}
        >
          Student Progress Report
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '42px',
            fontStyle: 'italic',
            color: '#d6a033',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: '0 0 16px',
          }}
        >
          {student.first_name} {student.last_name}
        </h1>
        <p
          style={{
            fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}
        >
          {formattedFrom && formattedTo
            ? `${formattedFrom} — ${formattedTo}`
            : formattedFrom || formattedTo || ''}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 4px',
            }}
          >
            {student.school} · {student.district}
          </p>
          <p
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              margin: 0,
            }}
          >
            Prepared by Operation Scholars
          </p>
        </div>
        <p
          style={{
            fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.25)',
            margin: 0,
          }}
        >
          {OS_PUBLIC_CONTACT_EMAIL}
        </p>
      </div>
    </div>
  )
}
