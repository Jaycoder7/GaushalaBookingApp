import { Request, Response, NextFunction } from 'express';

export function validateBookingInput(req: Request, res: Response, next: NextFunction) {
  const { slotId, familyName, phone, email, headcount } = req.body;
  
  const errors: string[] = [];
  
  if (!slotId || typeof slotId !== 'string' || !/^[0-9a-f-]{36}$/i.test(slotId)) errors.push('Invalid slotId');
  if (!familyName || typeof familyName !== 'string' || familyName.trim().length < 2 || familyName.trim().length > 255) errors.push('Family name must be between 2 and 255 characters');
  if (!phone || !/^\+?[1-9]\d{1,14}$/.test(phone)) errors.push('Invalid phone number');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email address');
  if (!headcount || !Number.isInteger(headcount) || headcount < 1 || headcount > 6) errors.push('Headcount must be between 1 and 6');
  if (typeof req.body.note === 'string' && req.body.note.length > 1000) errors.push('Note must be 1000 characters or fewer');
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Please correct the highlighted fields.', code: 'VALIDATION_ERROR', details: errors });
  }
  
  next();
}
