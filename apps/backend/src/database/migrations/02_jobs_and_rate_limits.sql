CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('email', 'calendar_sync')),
  payload JSONB NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  dedupe_key VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'dead')),
  attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INT NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 100),
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_ready
  ON background_jobs (run_after, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_background_jobs_dedupe
  ON background_jobs (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  scope VARCHAR(50) NOT NULL,
  key_hash CHAR(64) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 1 CHECK (request_count > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (scope, key_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires_at
  ON rate_limit_counters (expires_at);

ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE background_jobs, rate_limit_counters FROM anon, authenticated;
