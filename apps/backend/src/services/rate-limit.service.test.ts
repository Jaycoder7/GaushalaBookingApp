jest.mock('../database/connection', () => ({ query: jest.fn() }));

import { query } from '../database/connection';
import { consumeRateLimit } from './rate-limit.service';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('database rate limiting', () => {
  beforeEach(() => mockedQuery.mockReset());

  it('allows requests through the configured limit', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ request_count: 2 }] } as any);
    await expect(consumeRateLimit('booking-ip', '127.0.0.1', 60_000, 3, new Date('2030-01-01T00:00:30Z')))
      .resolves.toMatchObject({ allowed: true, remaining: 1 });
  });

  it('rejects a request after the shared counter exceeds the limit', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ request_count: 4 }] } as any);
    await expect(consumeRateLimit('booking-ip', '127.0.0.1', 60_000, 3, new Date('2030-01-01T00:00:30Z')))
      .resolves.toMatchObject({ allowed: false, remaining: 0 });
  });
});
