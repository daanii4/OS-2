import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTenantFromHostname } from '@/lib/tenant'

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? request.nextUrl.hostname
  const tenant = getTenantFromHostname(hostname)
  const requestHeaders = new Headers(request.headers)

  if (tenant) {
    requestHeaders.set('x-tenant-slug', tenant)
  } else {
    requestHeaders.delete('x-tenant-slug')
  }

  if (tenant && request.nextUrl.pathname === '/') {
    const tenantUrl = request.nextUrl.clone()
    tenantUrl.pathname = `/app/${tenant}`
    return NextResponse.rewrite(tenantUrl, { request: { headers: requestHeaders } })
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Required on every middleware call — refreshes expired sessions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
  // Next.js 16: proxy replaces middleware
}
