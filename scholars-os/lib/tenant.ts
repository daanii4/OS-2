import { headers } from 'next/headers'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

const ROOT_NET = 'quasarnova.net'
const ROOT_COM = 'quasarnova.com'

/** First label under our apex (subdomain before quasarnova.net or quasarnova.com). */
export function getTenantFromHostname(hostname: string | null | undefined): string | null {
  if (!hostname) return null

  const normalized = hostname.toLowerCase().split(':')[0]

  for (const root of [ROOT_NET, ROOT_COM] as const) {
    if (!normalized || normalized === root || normalized === `www.${root}`) {
      return null
    }
    if (normalized.endsWith(`.${root}`)) {
      const subdomain = normalized.slice(0, -(`.${root}`).length)
      return subdomain && subdomain !== 'www' ? subdomain : null
    }
  }

  if (normalized.endsWith('.localhost')) {
    const subdomain = normalized.slice(0, -'.localhost'.length)
    return subdomain && subdomain !== 'www' ? subdomain : null
  }

  return null
}

/** Same as getTenantFromHostname — used when resolving tenant from Host header in RSC. */
export function getSubdomainLabelFromHost(hostHeader: string | null | undefined): string | null {
  return getTenantFromHostname(hostHeader)
}

export function tenantSearchTerm(tenant: string): string {
  return tenant.replace(/[-_]+/g, ' ').trim()
}

export const getTenantFromSlug = cache(async (slug: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, active: true },
  })

  if (!tenant) {
    throw new Error(`Tenant not found: ${slug}`)
  }
  if (!tenant.active) {
    throw new Error(`Tenant inactive: ${slug}`)
  }

  return tenant
})

async function findActiveTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, active: true },
  })
}

/**
 * Resolves tenant for the current request.
 * Tries x-tenant-slug (from proxy), then subdomain from Host (e.g. *.quasarnova.com),
 * then DEFAULT_TENANT_SLUG. If the hostname label does not match any slug (custom domain),
 * falls back to the first active tenant when only one org exists — set DEFAULT_TENANT_SLUG otherwise.
 */
async function resolveTenantFromRequest(): Promise<{
  id: string
  slug: string
  name: string
  active: boolean
}> {
  const headersList = await headers()
  const headerSlug = headersList.get('x-tenant-slug')
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host') ?? ''
  const hostLabel = getSubdomainLabelFromHost(host)

  const candidates: string[] = []
  if (headerSlug) candidates.push(headerSlug)
  if (hostLabel && !candidates.includes(hostLabel)) candidates.push(hostLabel)
  const envSlug = process.env.DEFAULT_TENANT_SLUG?.trim()
  if (envSlug && !candidates.includes(envSlug)) candidates.push(envSlug)

  for (const slug of candidates) {
    const tenant = await findActiveTenantBySlug(slug)
    if (tenant?.active) {
      return tenant
    }
  }

  const singleOrg = await prisma.tenant.findFirst({
    where: { active: true },
    orderBy: { created_at: 'asc' },
    select: { id: true, name: true, slug: true, active: true },
  })
  if (singleOrg) {
    return singleOrg
  }

  throw new Error(`Tenant not found for host: ${host || 'unknown'}`)
}

/** One resolution per React server request — avoids duplicate tenant DB work in the same render tree. */
export const getTenantFromRequest = cache(resolveTenantFromRequest)
