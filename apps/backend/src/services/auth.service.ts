// Google OAuth Authentication Service

import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthPayload {
  email: string;
  sub: string;
}

export function validateAdminEmail(email: string): boolean {
  const GOOGLE_ADMIN_EMAIL = process.env.GOOGLE_ADMIN_EMAIL;
  if (!GOOGLE_ADMIN_EMAIL) {
    console.warn('GOOGLE_ADMIN_EMAIL not configured');
    return false;
  }
  return email.toLowerCase() === GOOGLE_ADMIN_EMAIL.toLowerCase();
}

export function generateToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return jwt.sign(payload, secret || 'development-only-secret', { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') return null;
    const decoded = jwt.verify(token, secret || 'development-only-secret') as AuthPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function authenticateGoogleCredential(credential: string): Promise<AuthPayload | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured');

  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified || !payload.sub || !validateAdminEmail(payload.email)) {
    return null;
  }
  return { email: payload.email, sub: payload.sub };
}
