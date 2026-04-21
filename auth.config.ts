import type { NextAuthConfig } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

// Edge-safe config (no Node.js-only imports, no Drizzle)
// Used by middleware.ts
export default {
  providers: [GitHub, Google],
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig
