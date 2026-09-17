import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'AgriSense Login',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email) {
          return {
            id: credentials.email,
            name: credentials.email.split('@')[0],
            email: credentials.email,
          }
        }
        return { id: '1', name: 'Demo Farmer', email: 'farmer@agrisense.com' }
      },
    }),
    GoogleProvider({
      // FIXED: Google OAuth client configuration
      // Ensure these environment variables are actually in your .env or .env.local file!
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev',
  pages: { signIn: '/signin', error: '/signin' },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.email) {
        session.user.email = token.email;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 1. If relative URL, resolve against current baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);
        const currentBase = new URL(baseUrl);

        // 2. Allow same origin
        if (targetUrl.origin === currentBase.origin) {
          return url;
        }

        // 3. Allow local origins
        if (targetUrl.hostname === "localhost" || targetUrl.hostname === "127.0.0.1") {
          return url;
        }

        // 4. Allow deployed production and preview domains
        if (
          targetUrl.hostname === "agrisensehub.vercel.app" ||
          targetUrl.hostname.endsWith(".vercel.app") ||
          targetUrl.hostname.includes("agrisense")
        ) {
          return url;
        }
      } catch {
        // Fall back to baseUrl dashboard
      }

      return `${baseUrl}/dashboard`;
    },
  },
})

export { handler as GET, handler as POST }
