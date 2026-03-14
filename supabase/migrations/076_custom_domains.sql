-- Custom domain support for gym sites
-- Allows gym owners to use their own domain (e.g., www.mygym.com) instead of /gym/:slug

ALTER TABLE gyms
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain_status TEXT NOT NULL DEFAULT 'none'
    CHECK (custom_domain_status IN ('none', 'pending', 'verified', 'failed')),
  ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ;

-- Index for fast hostname lookups (only non-null domains)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gyms_custom_domain
  ON gyms (custom_domain)
  WHERE custom_domain IS NOT NULL;

-- Add custom_domain feature to all existing gyms (disabled by default)
INSERT INTO gym_features (gym_id, feature_key, enabled, monthly_cost_pence)
SELECT id, 'custom_domain', false, 2000
FROM gyms
WHERE id NOT IN (
  SELECT gym_id FROM gym_features WHERE feature_key = 'custom_domain'
)
ON CONFLICT DO NOTHING;
