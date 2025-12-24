import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter removed - using JWT sessions only (no database sessions)
  // This avoids build-time errors and is simpler for credentials-based auth
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
          subscriptionTier: user.subscriptionTier,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = (user as { subscriptionTier?: string }).subscriptionTier || 'free';
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin || false;
      }
      // Refresh subscription tier on session update
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { subscriptionTier: true, isAdmin: true },
        });
        if (dbUser) {
          token.subscriptionTier = dbUser.subscriptionTier;
          token.isAdmin = dbUser.isAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
