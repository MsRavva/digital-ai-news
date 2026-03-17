-- ============================================
-- OAuth audit logs
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('github', 'google')),
  source text NOT NULL DEFAULT 'unknown' CHECK (source IN ('login', 'register', 'unknown')),
  source_path text,
  redirect_to text,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  current_step text NOT NULL,
  last_message text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text,
  step_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  diagnostics jsonb NOT NULL DEFAULT '[]'::jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  ip_address text,
  user_agent text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oauth_audit_logs_last_event_at_idx
  ON oauth_audit_logs (last_event_at DESC);

CREATE INDEX IF NOT EXISTS oauth_audit_logs_status_idx
  ON oauth_audit_logs (status);

CREATE INDEX IF NOT EXISTS oauth_audit_logs_provider_idx
  ON oauth_audit_logs (provider);

ALTER TABLE oauth_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view oauth audit logs" ON oauth_audit_logs;

CREATE POLICY "Teachers can view oauth audit logs"
ON oauth_audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id::text = auth.uid()::text
    AND profiles.role IN ('teacher', 'admin')
  )
);
