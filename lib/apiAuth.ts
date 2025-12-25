import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import jwt from 'jsonwebtoken';

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  subscriptionTier: string;
  isAdmin: boolean;
}

interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

/**
 * Authenticate API request from either:
 * 1. NextAuth session (web app - uses cookies)
 * 2. Bearer token (mobile app - uses Authorization header)
 *
 * Usage in API routes:
 *   const { user, error } = await getAuthUser(request);
 *   if (!user) {
 *     return NextResponse.json({ error }, { status: 401 });
 *   }
 */
export async function getAuthUser(request?: Request): Promise<AuthResult> {
  // First, try NextAuth session (works for web app)
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name,
        subscriptionTier: session.user.subscriptionTier || 'free',
        isAdmin: session.user.isAdmin || false,
      },
    };
  }

  // If no session, check for Bearer token (mobile app)
  if (request) {
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.NEXTAUTH_SECRET;

      if (!secret) {
        return { user: null, error: 'Server configuration error' };
      }

      try {
        const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

        if (decoded.id && decoded.email) {
          return {
            user: {
              id: decoded.id,
              email: decoded.email,
              name: decoded.name || null,
              subscriptionTier: decoded.subscriptionTier || 'free',
              isAdmin: decoded.isAdmin || false,
            },
          };
        }
      } catch {
        return { user: null, error: 'Invalid or expired token' };
      }
    }
  }

  return { user: null, error: 'Unauthorized' };
}
