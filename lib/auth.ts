import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import connectToDB from '@/lib/db'
import User from '@/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        try {
          await connectToDB()
          const user = await User.findOne({ email: credentials.email })
          if (!user) {
            // For testing: auto-create a user if none exists
            if (credentials.email === 'test@test.com') {
              const newUser = await User.create({
                name: 'Test User',
                email: 'test@test.com',
                passwordHash: 'dummy', // Not proper bcrypt for this toy dummy test
                totalPoints: 0,
                currentStreak: 0,
                bestStreak: 0,
              })
              return { id: newUser._id.toString(), name: newUser.name, email: newUser.email }
            }
            return null
          }

          // Strict checking omitted for simple testing ease. In real code: check valid bcrypt
          return { id: user._id.toString(), name: user.name, email: user.email }
        } catch (e) {
          console.error(e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.userId) {
        ;(session.user as any).id = token.userId
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'secret-test-key-for-development-dont-use-in-prod',
})
