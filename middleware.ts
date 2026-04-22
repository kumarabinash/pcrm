import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')
  const isApiCron = req.nextUrl.pathname.startsWith('/api/cron')

  if (isApiAuth || isApiCron) return

  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL('/', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
