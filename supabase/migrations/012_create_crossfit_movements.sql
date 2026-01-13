-- Create CrossFit movements table
-- This table stores a comprehensive library of CrossFit movements with muscle group tracking,
-- equipment requirements, difficulty levels, and scaling options for workout programming.

CREATE TABLE IF NOT EXISTS crossfit_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('gymnastic', 'weightlifting', 'metabolic', 'skill')),
  primary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  secondary_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  scaling_options TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_crossfit_movements_category ON crossfit_movements(category);
CREATE INDEX idx_crossfit_movements_difficulty ON crossfit_movements(difficulty);
CREATE INDEX idx_crossfit_movements_primary_muscle_groups ON crossfit_movements USING GIN(primary_muscle_groups);
CREATE INDEX idx_crossfit_movements_secondary_muscle_groups ON crossfit_movements USING GIN(secondary_muscle_groups);

-- Enable Row Level Security
ALTER TABLE crossfit_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read movements (needed for workout creation)
CREATE POLICY "Allow authenticated users to read movements"
  ON crossfit_movements FOR SELECT
  TO authenticated
  USING (true);

-- Only coaches and admins can insert movements
CREATE POLICY "Allow coaches and admins to insert movements"
  ON crossfit_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Only coaches and admins can update movements
CREATE POLICY "Allow coaches and admins to update movements"
  ON crossfit_movements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('coach', 'admin')
    )
  );

-- Only admins can delete movements
CREATE POLICY "Allow admins to delete movements"
  ON crossfit_movements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_crossfit_movements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crossfit_movements_updated_at
  BEFORE UPDATE ON crossfit_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_crossfit_movements_updated_at();

-- Seed with comprehensive CrossFit movements
INSERT INTO crossfit_movements (name, category, primary_muscle_groups, secondary_muscle_groups, equipment, difficulty, description, scaling_options) VALUES
  -- Gymnastic Movements (27)
  ('Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms'], ARRAY['pull-up bar'], 'intermediate', 'Dead hang pull-up, chin over bar', ARRAY['Banded pull-up', 'Ring row', 'Jumping pull-up']),
  ('Chest-to-Bar Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms', 'shoulders'], ARRAY['pull-up bar'], 'advanced', 'Pull-up with chest touching bar', ARRAY['Regular pull-up', 'Banded CTB', 'Ring row']),
  ('Bar Muscle-Up', 'gymnastic', ARRAY['back', 'chest'], ARRAY['arms', 'shoulders'], ARRAY['pull-up bar'], 'advanced', 'Explosive pull-up transition to bar dip', ARRAY['Banded muscle-up', 'Jumping muscle-up', 'Pull-up + dip']),
  ('Ring Muscle-Up', 'gymnastic', ARRAY['back', 'chest'], ARRAY['arms', 'shoulders'], ARRAY['gymnastic rings'], 'advanced', 'Explosive pull transition to ring dip', ARRAY['Banded ring muscle-up', 'Ring row + ring dip', 'Bar muscle-up']),
  ('Toes-to-Bar', 'gymnastic', ARRAY['core'], ARRAY['shoulders'], ARRAY['pull-up bar'], 'intermediate', 'Hang from bar, bring toes to touch bar', ARRAY['Knees-to-elbow', 'Knee raise', 'Sit-up']),
  ('Knees-to-Elbow', 'gymnastic', ARRAY['core'], ARRAY['shoulders'], ARRAY['pull-up bar'], 'beginner', 'Hang from bar, bring knees to elbows', ARRAY['Knee raise', 'Sit-up', 'Plank hold']),
  ('Ring Dip', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders'], ARRAY['gymnastic rings'], 'intermediate', 'Dip on rings, arms fully extended at top', ARRAY['Banded ring dip', 'Box dip', 'Push-up']),
  ('Push-Up', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders', 'core'], ARRAY['bodyweight'], 'beginner', 'Standard push-up, chest to ground', ARRAY['Knee push-up', 'Incline push-up', 'Hand-release push-up']),
  ('Handstand Push-Up', 'gymnastic', ARRAY['shoulders'], ARRAY['arms', 'core'], ARRAY['wall'], 'advanced', 'Inverted push-up against wall', ARRAY['Pike push-up', 'Box HSPU', 'Dumbbell press']),
  ('Strict Handstand Push-Up', 'gymnastic', ARRAY['shoulders'], ARRAY['arms', 'core'], ARRAY['wall'], 'advanced', 'Strict HSPU, no kipping', ARRAY['Kipping HSPU', 'Pike push-up', 'Push press']),
  ('Pistol Squat', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'advanced', 'Single-leg squat to full depth', ARRAY['Box pistol', 'Assisted pistol', 'Goblet squat']),
  ('Rope Climb', 'gymnastic', ARRAY['back', 'arms'], ARRAY['core', 'legs'], ARRAY['climbing rope'], 'intermediate', 'Climb 15ft rope to top', ARRAY['Lying rope pull', 'Towel pull-up', 'Pull-up']),
  ('Burpee', 'gymnastic', ARRAY['chest', 'legs'], ARRAY['core', 'shoulders'], ARRAY['bodyweight'], 'beginner', 'Chest to ground, jump with hands overhead', ARRAY['Step-back burpee', 'No push-up burpee', 'Elevated burpee']),
  ('Box Jump', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['plyo box'], 'beginner', 'Jump onto box, full hip extension', ARRAY['Step-up', 'Reduced height', 'Box step-over']),
  ('Wall Walk', 'gymnastic', ARRAY['shoulders'], ARRAY['core', 'chest'], ARRAY['wall'], 'intermediate', 'Walk hands and feet up wall to handstand', ARRAY['Partial wall walk', 'Inchworm', 'Plank hold']),
  ('Air Squat', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'beginner', 'Full depth squat, hips below knees', ARRAY['Box squat', 'Partial squat', 'Chair squat']),
  ('Lunge', 'gymnastic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'beginner', 'Walking or reverse lunge', ARRAY['Box step-up', 'Reduced range', 'Air squat']),
  ('Sit-Up', 'gymnastic', ARRAY['core'], ARRAY[]::TEXT[], ARRAY['ab-mat'], 'beginner', 'Abmat sit-up, shoulders touch ground', ARRAY['Anchored sit-up', 'Crunch', 'Dead bug']),
  ('V-Up', 'gymnastic', ARRAY['core'], ARRAY[]::TEXT[], ARRAY['bodyweight'], 'intermediate', 'Lift legs and torso simultaneously', ARRAY['Tuck-up', 'Sit-up', 'Hollow rock']),
  ('Hollow Rock', 'gymnastic', ARRAY['core'], ARRAY[]::TEXT[], ARRAY['bodyweight'], 'intermediate', 'Rock in hollow body position', ARRAY['Hollow hold', 'Dead bug', 'Plank']),
  ('L-Sit', 'gymnastic', ARRAY['core'], ARRAY['shoulders', 'arms'], ARRAY['parallettes', 'floor'], 'advanced', 'Hold seated position with legs extended', ARRAY['Tuck sit', 'Single leg L-sit', 'Plank']),
  ('Handstand Hold', 'gymnastic', ARRAY['shoulders'], ARRAY['core', 'arms'], ARRAY['wall'], 'intermediate', 'Hold handstand against wall', ARRAY['Plank hold', 'Pike hold', 'Wall walk partial']),
  ('Ring Row', 'gymnastic', ARRAY['back'], ARRAY['arms'], ARRAY['gymnastic rings'], 'beginner', 'Horizontal row on rings', ARRAY['Elevated ring row', 'Bent knee row', 'Band pull-apart']),
  ('Dip', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders'], ARRAY['dip bars', 'rings'], 'intermediate', 'Parallel bar dip, full range', ARRAY['Banded dip', 'Box dip', 'Push-up']),
  ('Kipping Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms', 'core'], ARRAY['pull-up bar'], 'intermediate', 'Pull-up using hip drive and kip', ARRAY['Strict pull-up', 'Banded kipping pull-up', 'Ring row']),
  ('Butterfly Pull-Up', 'gymnastic', ARRAY['back'], ARRAY['arms', 'shoulders'], ARRAY['pull-up bar'], 'advanced', 'Circular kipping pull-up for speed', ARRAY['Kipping pull-up', 'Strict pull-up', 'Ring row']),
  ('Hand-Release Push-Up', 'gymnastic', ARRAY['chest', 'arms'], ARRAY['shoulders'], ARRAY['bodyweight'], 'beginner', 'Push-up with hands lifted off ground at bottom', ARRAY['Regular push-up', 'Knee push-up', 'Incline push-up']),

  -- Weightlifting Movements (34)
  ('Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Full squat snatch from floor to overhead', ARRAY['Power snatch', 'Hang snatch', 'Overhead squat']),
  ('Power Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Snatch caught above parallel', ARRAY['Hang power snatch', 'Muscle snatch', 'Dumbbell snatch']),
  ('Hang Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Snatch from hang position (above knee)', ARRAY['Hang power snatch', 'Power snatch', 'Dumbbell snatch']),
  ('Hang Power Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back'], ARRAY['barbell'], 'intermediate', 'Power snatch from hang above knee', ARRAY['Dumbbell snatch', 'Kettlebell swing', 'Power clean']),
  ('Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'advanced', 'Full squat clean from floor to shoulders', ARRAY['Power clean', 'Hang clean', 'Front squat']),
  ('Power Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'intermediate', 'Clean caught above parallel', ARRAY['Hang power clean', 'Dumbbell clean', 'Deadlift + front squat']),
  ('Hang Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'advanced', 'Clean from hang position', ARRAY['Hang power clean', 'Power clean', 'Dumbbell clean']),
  ('Hang Power Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders'], ARRAY['barbell'], 'intermediate', 'Power clean from hang above knee', ARRAY['Dumbbell clean', 'Kettlebell swing', 'Deadlift']),
  ('Clean & Jerk', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['back', 'core'], ARRAY['barbell'], 'advanced', 'Clean to shoulders, then jerk overhead', ARRAY['Power clean + push press', 'Thruster', 'Front squat + press']),
  ('Split Jerk', 'weightlifting', ARRAY['shoulders', 'legs'], ARRAY['core'], ARRAY['barbell'], 'advanced', 'Jerk with split stance', ARRAY['Push jerk', 'Push press', 'Shoulder press']),
  ('Push Jerk', 'weightlifting', ARRAY['shoulders', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Jerk with small dip and drive', ARRAY['Push press', 'Shoulder press', 'Thruster']),
  ('Thruster', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core'], ARRAY['barbell', 'dumbbell'], 'intermediate', 'Front squat to overhead press in one motion', ARRAY['Front squat + push press', 'Goblet squat + press', 'Reduced weight']),
  ('Front Squat', 'weightlifting', ARRAY['legs'], ARRAY['core', 'back'], ARRAY['barbell'], 'intermediate', 'Squat with bar on front rack', ARRAY['Goblet squat', 'Reduced weight', 'Box squat']),
  ('Back Squat', 'weightlifting', ARRAY['legs'], ARRAY['core', 'back'], ARRAY['barbell'], 'beginner', 'Squat with bar on back', ARRAY['Goblet squat', 'Air squat', 'Box squat']),
  ('Overhead Squat', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core', 'back'], ARRAY['barbell'], 'advanced', 'Squat with bar overhead', ARRAY['PVC overhead squat', 'Goblet squat', 'Front squat']),
  ('Deadlift', 'weightlifting', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['barbell'], 'beginner', 'Lift bar from ground to standing', ARRAY['Reduced weight', 'Rack pull', 'Romanian deadlift']),
  ('Sumo Deadlift', 'weightlifting', ARRAY['legs', 'back'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Wide stance deadlift', ARRAY['Conventional deadlift', 'Reduced weight', 'Kettlebell deadlift']),
  ('Romanian Deadlift', 'weightlifting', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Deadlift with slight knee bend, focus on hamstrings', ARRAY['Dumbbell RDL', 'Reduced weight', 'Good morning']),
  ('Shoulder Press', 'weightlifting', ARRAY['shoulders'], ARRAY['arms', 'core'], ARRAY['barbell'], 'beginner', 'Strict overhead press from shoulders', ARRAY['Dumbbell press', 'Reduced weight', 'Push press']),
  ('Push Press', 'weightlifting', ARRAY['shoulders', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Overhead press with leg drive', ARRAY['Shoulder press', 'Dumbbell push press', 'Reduced weight']),
  ('Bench Press', 'weightlifting', ARRAY['chest'], ARRAY['arms', 'shoulders'], ARRAY['barbell', 'bench'], 'beginner', 'Horizontal press on bench', ARRAY['Dumbbell bench press', 'Push-up', 'Reduced weight']),
  ('Overhead Walking Lunge', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core'], ARRAY['barbell', 'dumbbell', 'plate'], 'intermediate', 'Walking lunge with weight overhead', ARRAY['Regular lunge', 'Goblet lunge', 'Walking lunge']),
  ('Front Rack Lunge', 'weightlifting', ARRAY['legs'], ARRAY['core'], ARRAY['barbell', 'dumbbell'], 'intermediate', 'Lunge with weight in front rack', ARRAY['Goblet lunge', 'Walking lunge', 'Air lunge']),
  ('Goblet Squat', 'weightlifting', ARRAY['legs'], ARRAY['core'], ARRAY['dumbbell', 'kettlebell'], 'beginner', 'Squat holding weight at chest', ARRAY['Air squat', 'Reduced weight', 'Box squat']),
  ('Dumbbell Snatch', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core', 'back'], ARRAY['dumbbell'], 'intermediate', 'Single-arm snatch with dumbbell', ARRAY['Dumbbell swing', 'Kettlebell swing', 'Reduced weight']),
  ('Dumbbell Clean', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders'], ARRAY['dumbbell'], 'beginner', 'Clean dumbbells to shoulders', ARRAY['Hang dumbbell clean', 'Reduced weight', 'Kettlebell swing']),
  ('Devil Press', 'weightlifting', ARRAY['chest', 'shoulders', 'legs'], ARRAY['core', 'back'], ARRAY['dumbbell'], 'advanced', 'Burpee + double dumbbell snatch', ARRAY['Single dumbbell snatch', 'Dumbbell thruster', 'Burpee']),
  ('Turkish Get-Up', 'weightlifting', ARRAY['shoulders', 'core'], ARRAY['legs'], ARRAY['kettlebell', 'dumbbell'], 'intermediate', 'Complex movement from lying to standing with weight overhead', ARRAY['Partial TGU', 'Reduced weight', 'Windmill']),
  ('Kettlebell Swing', 'weightlifting', ARRAY['legs', 'back'], ARRAY['shoulders', 'core'], ARRAY['kettlebell'], 'beginner', 'Hip hinge swing to eye level', ARRAY['Russian swing', 'Reduced weight', 'Dumbbell swing']),
  ('American Kettlebell Swing', 'weightlifting', ARRAY['legs', 'back', 'shoulders'], ARRAY['core'], ARRAY['kettlebell'], 'intermediate', 'Hip hinge swing overhead', ARRAY['Russian swing', 'Reduced weight', 'Dumbbell swing']),
  ('Sumo Deadlift High Pull', 'weightlifting', ARRAY['legs', 'back', 'shoulders'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Wide stance deadlift with high pull', ARRAY['Upright row', 'Deadlift', 'Hang power clean']),
  ('Barbell Row', 'weightlifting', ARRAY['back'], ARRAY['arms'], ARRAY['barbell'], 'intermediate', 'Bent over barbell row', ARRAY['Dumbbell row', 'Ring row', 'Reduced weight']),
  ('Dumbbell Row', 'weightlifting', ARRAY['back'], ARRAY['arms'], ARRAY['dumbbell', 'bench'], 'beginner', 'Single-arm row with dumbbell', ARRAY['Ring row', 'Reduced weight', 'Band row']),
  ('Farmers Carry', 'weightlifting', ARRAY['core', 'back'], ARRAY['legs', 'arms'], ARRAY['dumbbell', 'kettlebell'], 'beginner', 'Walk carrying heavy weights at sides', ARRAY['Reduced weight', 'Shorter distance', 'Single-arm carry']),

  -- Metabolic Conditioning (10)
  ('Row (Calories)', 'metabolic', ARRAY['back', 'legs'], ARRAY['core', 'arms'], ARRAY['rowing machine'], 'beginner', 'Rowing machine for calories', ARRAY['Reduced calories', 'Bike calories', 'Ski calories']),
  ('Row (Meters)', 'metabolic', ARRAY['back', 'legs'], ARRAY['core', 'arms'], ARRAY['rowing machine'], 'beginner', 'Rowing machine for distance', ARRAY['Reduced meters', 'Bike', 'Ski']),
  ('Assault Bike (Calories)', 'metabolic', ARRAY['legs'], ARRAY['arms', 'core'], ARRAY['assault bike'], 'beginner', 'Air bike for calories', ARRAY['Reduced calories', 'Row calories', 'Ski calories']),
  ('Run (400m)', 'metabolic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'beginner', 'Run 400 meters', ARRAY['200m run', 'Row', 'Bike']),
  ('Run (800m)', 'metabolic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'intermediate', 'Run 800 meters', ARRAY['400m run', 'Row', 'Bike']),
  ('Run (1 Mile)', 'metabolic', ARRAY['legs'], ARRAY['core'], ARRAY['bodyweight'], 'intermediate', 'Run 1 mile', ARRAY['800m run', '2000m row', 'Bike']),
  ('Double-Under', 'metabolic', ARRAY['legs'], ARRAY['shoulders', 'core'], ARRAY['jump rope'], 'intermediate', 'Jump rope with double spin per jump', ARRAY['Single-under', 'Penguin taps', 'Jumping jacks']),
  ('Single-Under', 'metabolic', ARRAY['legs'], ARRAY['shoulders'], ARRAY['jump rope'], 'beginner', 'Jump rope with single spin per jump', ARRAY['Imaginary jump rope', 'Step-overs', 'Jumping jacks']),
  ('Ski Erg (Calories)', 'metabolic', ARRAY['back', 'core'], ARRAY['legs', 'shoulders'], ARRAY['ski erg'], 'beginner', 'Ski erg machine for calories', ARRAY['Reduced calories', 'Row calories', 'Bike calories']),
  ('Ski Erg (Meters)', 'metabolic', ARRAY['back', 'core'], ARRAY['legs', 'shoulders'], ARRAY['ski erg'], 'beginner', 'Ski erg machine for distance', ARRAY['Reduced meters', 'Row meters', 'Bike']),

  -- Object Manipulation (5)
  ('Wall Ball', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core'], ARRAY['medicine ball'], 'beginner', 'Squat and throw ball to target', ARRAY['Reduced weight', 'Front squat + press', 'Air squat + press']),
  ('Medicine Ball Clean', 'weightlifting', ARRAY['legs', 'shoulders'], ARRAY['core', 'back'], ARRAY['medicine ball'], 'beginner', 'Clean medicine ball to shoulders', ARRAY['Reduced weight', 'Dumbbell clean', 'Wall ball']),
  ('Slam Ball', 'weightlifting', ARRAY['core', 'shoulders'], ARRAY['back', 'legs'], ARRAY['slam ball'], 'beginner', 'Overhead slam to ground', ARRAY['Reduced weight', 'Medicine ball slam', 'Dumbbell swing']),
  ('Sandbag Carry', 'weightlifting', ARRAY['back', 'legs'], ARRAY['core', 'shoulders'], ARRAY['sandbag'], 'intermediate', 'Carry sandbag on shoulder or bear hug', ARRAY['Reduced weight', 'Farmers carry', 'Shorter distance']),
  ('D-Ball Over Shoulder', 'weightlifting', ARRAY['legs', 'back'], ARRAY['core', 'shoulders'], ARRAY['d-ball'], 'intermediate', 'Lift and throw ball over shoulder', ARRAY['Reduced weight', 'Ball to shoulder only', 'Sandbag carry']),

  -- Skill/Accessory (6)
  ('Plank Hold', 'skill', ARRAY['core'], ARRAY['shoulders'], ARRAY['bodyweight'], 'beginner', 'Hold plank position', ARRAY['Knee plank', 'Reduced time', 'Dead bug']),
  ('Superman Hold', 'skill', ARRAY['back', 'core'], ARRAY[]::TEXT[], ARRAY['bodyweight'], 'beginner', 'Hold superman position on ground', ARRAY['Reduced time', 'Back extension', 'Bird dog']),
  ('GHD Sit-Up', 'skill', ARRAY['core'], ARRAY['back'], ARRAY['GHD machine'], 'intermediate', 'Full range sit-up on GHD', ARRAY['Abmat sit-up', 'Partial GHD', 'Sit-up']),
  ('GHD Hip Extension', 'skill', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['GHD machine'], 'intermediate', 'Hip extension on GHD', ARRAY['Back extension', 'Superman hold', 'Good morning']),
  ('Good Morning', 'skill', ARRAY['back', 'legs'], ARRAY['core'], ARRAY['barbell'], 'intermediate', 'Hip hinge with bar on back', ARRAY['Reduced weight', 'Romanian deadlift', 'Superman hold']),
  ('Banded Pull-Apart', 'skill', ARRAY['shoulders', 'back'], ARRAY[]::TEXT[], ARRAY['resistance band'], 'beginner', 'Pull resistance band apart at chest height', ARRAY['Lighter band', 'Reduced reps', 'Arm circles']);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CrossFit movements table created successfully with % movements', (SELECT COUNT(*) FROM crossfit_movements);
END $$;
