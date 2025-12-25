import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshRequest {
  token: string;
}

/**
 * Mobile authentication endpoint
 * POST /api/auth/mobile
 *
 * Authenticates mobile app users and returns a JWT token
 * Compatible with the NextAuth JWT structure used by the web app
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as LoginRequest;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isCorrectPassword = await bcrypt.compare(password, user.password);

    if (!isCorrectPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT with same structure as NextAuth
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.fullName,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Refresh/validate token endpoint
 * GET /api/auth/mobile
 *
 * Validates a token and returns refreshed user data
 * Use Authorization: Bearer <token> header
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.NEXTAUTH_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify and decode token
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        subscriptionTier: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return fresh user data (token is still valid)
    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        subscriptionTier: user.subscriptionTier,
        isAdmin: user.isAdmin,
      },
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Token validation failed' },
      { status: 500 }
    );
  }
}
