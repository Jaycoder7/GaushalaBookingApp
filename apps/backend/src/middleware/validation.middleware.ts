import { Request, Response, NextFunction } from 'express';

export function validateBookingInput(req: Request, res: Response, next: NextFunction) {
  const { slotId, familyName, phone, email, headcount } = req.body;
  
  const errors: string[] = [];
  
  if (!slotId || typeof slotId !== 'string') errors.push('Invalid slotId');
  if (!familyName || typeof familyName !== 'string' || familyName.trim().length < 2) errors.push('Family name must be at least 2 characters');
  if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) errors.push('Invalid phone number');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!headcount || !Number.isInteger(headcount) || headcount < 1 || headcount > 6) errors.push('Headcount must be between 1 and 6');
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
}
