-- Feature votes for the public roadmap page
CREATE TABLE IF NOT EXISTS feature_votes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes(feature_id);

ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature votes"
  ON feature_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON feature_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
  ON feature_votes FOR DELETE
  USING (auth.uid() = user_id);
