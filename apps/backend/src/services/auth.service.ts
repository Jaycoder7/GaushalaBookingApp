// Google OAuth Authentication Service

import jwt from 'jsonwebtoken';

const GOOGLE_ADMIN_EMAIL = process.env.GOOGLE_ADMIN_EMAIL;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthPayload {
  email: string;
  sub: string;
}

export function validateAdminEmail(email: string): boolean {
  if (!GOOGLE_ADMIN_EMAIL) {
    console.warn('GOOGLE_ADMIN_EMAIL not configured');
    return false;
  }
  return email.toLowerCase() === GOOGLE_ADMIN_EMAIL.toLowerCase();
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
