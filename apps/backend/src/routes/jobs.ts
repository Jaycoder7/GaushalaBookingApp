import crypto from 'crypto';
import express from 'express';
import { processBackgroundJobs } from '../services/jobs.service';

const router = express.Router();

function authorized(value: string | undefined) {
  const expected = process.env.CRON_SECRET;
  if (!expected || !value) return false;
  const supplied = value.startsWith('Bearer ') ? value.slice(7) : value;
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

router.all('/process', async (request, response, next) => {
  try {
    if (!authorized(request.headers.authorization)) {
      response.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }
    const result = await processBackgroundJobs(10);
    response.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
