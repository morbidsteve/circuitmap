import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import { authOptions } from './auth';
import { prisma } from './db';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  isAdmin: boolean;
}

/**
 * Get the authenticated user from either:
 * 1. NextAuth session (web app with cookies)
 * 2. Bearer token (mobile app with JWT)
 *
 * Returns null if no valid authentication is found.
 */
export async function getAuthenticatedUser(
  request?: Request
): Promise<AuthenticatedUser | null> {
  // First, try NextAuth session (works for web app)
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null,
      subscriptionTier: session.user.subscriptionTier || 'free',
      isAdmin: session.user.isAdmin || false,
    };
  }

  // If no session, try Bearer token (mobile app)
  if (request) {
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.NEXTAUTH_SECRET;

      if (!secret) {
        console.error('NEXTAUTH_SECRET is not configured');
        return null;
      }

      try {
        const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

        // Optionally verify the user still exists in the database
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            fullName: true,
            subscriptionTier: true,
            isAdmin: true,
          },
        });

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            subscriptionTier: user.subscriptionTier,
            isAdmin: user.isAdmin,
          };
        }
      } catch (error) {
        // Token is invalid or expired
        console.error('Bearer token validation failed:', error);
      }
    }
  }

  return null;
}
