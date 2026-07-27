CREATE TABLE IF NOT EXISTS threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id),
  threat_score INTEGER NOT NULL CHECK (threat_score BETWEEN 0 AND 100),
  threat_level VARCHAR(8) NOT NULL CHECK (threat_level IN ('LOW', 'MEDIUM', 'HIGH')),
  status VARCHAR(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED')),
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threats_status ON threats (status);
CREATE INDEX IF NOT EXISTS idx_threats_threat_level ON threats (threat_level);
CREATE INDEX IF NOT EXISTS idx_threats_created_at ON threats (created_at DESC);