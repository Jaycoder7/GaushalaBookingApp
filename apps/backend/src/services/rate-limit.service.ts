import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { query } from '../database/connection';

interface RateLimitOptions {
  scope: string;
  windowMs: number;
  limit: number;
  key: (request: Request) => string;
  message: string;
}

export async function consumeRateLimit(
  scope: string,
  rawKey: string,
  windowMs: number,
  limit: number,
  now = new Date()
) {
  const pepper = process.env.RATE_LIMIT_SECRET || process.env.JWT_SECRET || 'development-rate-limit-secret';
  const keyHash = crypto.createHash('sha256').update(`${pepper}:${rawKey}`).digest('hex');
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + windowMs * 2);

  const result = await query<{ request_count: number }>(
    `INSERT INTO rate_limit_counters (
       scope, key_hash, window_start, request_count, expires_at
     ) VALUES ($1, $2, $3, 1, $4)
     ON CONFLICT (scope, key_hash, window_start)
     DO UPDATE SET request_count = rate_limit_counters.request_count + 1
     RETURNING request_count`,
    [scope, keyHash, windowStart, expiresAt]
  );

  // Opportunistic cleanup keeps the table bounded without adding request latency
  // on every call. The deletion is deliberately not awaited.
  if (Math.random() < 0.01) {
    void query('DELETE FROM rate_limit_counters WHERE expires_at < NOW()').catch(error => {
      console.error('Rate-limit cleanup failed:', error);
    });
  }

  return {
    allowed: result.rows[0].request_count <= limit,
    remaining: Math.max(0, limit - result.rows[0].request_count),
    resetAt: new Date(windowStartMs + windowMs),
  };
}

export function databaseRateLimit(options: RateLimitOptions) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await consumeRateLimit(
        options.scope,
        options.key(request),
        options.windowMs,
        options.limit
      );
      response.setHeader('RateLimit-Limit', String(options.limit));
      response.setHeader('RateLimit-Remaining', String(result.remaining));
      response.setHeader('RateLimit-Reset', String(Math.ceil(result.resetAt.getTime() / 1000)));
      if (!result.allowed) {
        response.status(429).json({ error: options.message, code: 'RATE_LIMITED' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
