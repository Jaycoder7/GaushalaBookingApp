import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      admin?: { email: string; sub: string };
    }
  }
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
  
  req.admin = payload;
  next();
}
