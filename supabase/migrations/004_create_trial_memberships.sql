-- Create trial_memberships table to track free trial memberships
CREATE TABLE trial_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_setup_intent_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT CHECK (status IN ('active', 'converted', 'cancelled', 'expired')) DEFAULT 'active',
  auto_convert_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_trial_memberships_user_id ON trial_memberships(user_id);
CREATE INDEX idx_trial_memberships_status ON trial_memberships(status);
CREATE INDEX idx_trial_memberships_end_date ON trial_memberships(trial_end_date);

-- Enable Row Level Security
ALTER TABLE trial_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own trial membership"
  ON trial_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trial membership"
  ON trial_memberships FOR UPDATE
  USING (auth.uid() = user_id);
