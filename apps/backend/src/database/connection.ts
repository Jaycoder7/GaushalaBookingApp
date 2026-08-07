import '../config';
import { Pool, PoolClient, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL
  || process.env.POSTGRES_URL
  || process.env.POSTGRES_PRISMA_URL;
const usesRequireSsl = Boolean(connectionString && /[?&]sslmode=require(?:&|$)/.test(connectionString));

const pool = new Pool({
  connectionString,
  // PostgreSQL's `require` mode encrypts traffic without CA verification.
  // Use `verify-full` plus the Supabase CA when strict verification is needed.
  ssl: usesRequireSsl ? { rejectUnauthorized: false } : undefined,
  // Keep each serverless instance's pool deliberately small. Supabase's
  // pooled POSTGRES_URL should be preferred in production.
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('Database connection successful');
  } finally {
    client.release();
  }
}

export function getPool() {
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn('Long query detected:', { text, duration });
    }
    return result;
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
