CREATE TABLE IF NOT EXISTS restricted_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL CHECK (radius_km > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
