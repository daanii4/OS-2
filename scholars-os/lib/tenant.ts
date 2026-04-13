import { headers } from 'next/headers'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

const ROOT_DOMAIN = 'quasarnova.net'

export function getTenantFromHostname(hostname: string | null | undefined): string | null {
  if (!hostname) return null

  const normalized = hostname.toLowerCase().split(':')[0]
  if (!normalized || normalized === ROOT_DOMAIN || normalized === `www.${ROOT_DOMAIN}`) {
    return null
  }

  if (normalized.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = normalized.slice(0, -(`.${ROOT_DOMAIN}`).length)
    return subdomain && subdomain !== 'www' ? subdomain : null
  }

  // Local development support, e.g. tenant.localhost:3000
  if (normalized.endsWith('.localhost')) {
    const subdomain = normalized.slice(0, -'.localhost'.length)
    return subdomain && subdomain !== 'www' ? subdomain : null
  }

  return null
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

export async function getTenantFromRequest(): Promise<{ id: string; slug: string; name: string; active: boolean }> {
  const headersList = await headers()
  const headerSlug = headersList.get('x-tenant-slug')
  const slug = headerSlug ?? process.env.DEFAULT_TENANT_SLUG ?? 'demarieya'
  const tenant = await getTenantFromSlug(slug)
  return tenant
}
