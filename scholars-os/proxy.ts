import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTenantFromHostname } from '@/lib/tenant'

/** Routes reachable while user must still set password (invite flow → onboarding). */
const BYPASS_MUST_RESET = ['/login', '/reset-password', '/onboarding', '/api/auth']

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

  const path = request.nextUrl.pathname
  /** Public files from /public — must not redirect to /login or favicons and <img> break. */
  const isPublicAsset =
    path.startsWith('/static/') ||
    path.startsWith('/animations/') ||
    path.startsWith('/icon') ||
    path === '/favicon.ico' ||
    path === '/apple-icon.png' ||
    path === '/logo-mark.png' ||
    path === '/logo.png' ||
    path === '/logo-3d.webp' ||
    path === '/logo-3d.png'

  if (isPublicAsset) {
    return NextResponse.next({ request: { headers: requestHeaders } })
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLogin = path.startsWith('/login')
  const isApiAuth = path.startsWith('/api/auth')

  if (!user && !isLogin && !isApiAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const isBypassMustReset = BYPASS_MUST_RESET.some(r => path.startsWith(r))
  const isApiRoute = path.startsWith('/api/')

  if (user && !isBypassMustReset && !isApiRoute) {
    const mustReset = user.user_metadata?.must_reset_password === true
    if (mustReset) {
      const url = request.nextUrl.clone()
      url.pathname = '/reset-password'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
}
