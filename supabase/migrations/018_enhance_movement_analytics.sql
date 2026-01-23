-- Migration: Enhance Movement Analytics and Add Heavy Day Tracking
-- 1. Add 'functional_pattern' to crossfit_movements
-- 2. Update 'muscle_groups' check constraint to include 'full body'
-- 3. Add 'loading_focus' to workouts/WODs for Heavy Day tracking

-- Step 1: Add functional_pattern column
ALTER TABLE crossfit_movements
ADD COLUMN IF NOT EXISTS functional_pattern TEXT CHECK (functional_pattern IN ('squat', 'hinge', 'push', 'pull', 'lunge', 'carry', 'core', 'monostructural', 'other'));

CREATE INDEX IF NOT EXISTS idx_crossfit_movements_functional_pattern ON crossfit_movements(functional_pattern);

-- Step 2: Update Data for Functional Patterns
-- Squats
UPDATE crossfit_movements SET functional_pattern = 'squat' WHERE name IN ('Air Squat', 'Back Squat', 'Front Squat', 'Overhead Squat', 'Goblet Squat', 'Box Squat', 'Pistol Squat', 'Thruster', 'Wall Ball', 'Cluster');

-- Hinges
UPDATE crossfit_movements SET functional_pattern = 'hinge' WHERE name IN ('Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Kettlebell Swing', 'American Kettlebell Swing', 'Russian Kettlebell Swing', 'Good Morning', 'Snatch', 'Power Snatch', 'Clean', 'Power Clean', 'Dumbbell Snatch', 'Dumbbell Clean');

-- Pushes
UPDATE crossfit_movements SET functional_pattern = 'push' WHERE name IN ('Push-Up', 'Handstand Push-Up', 'Strict Handstand Push-Up', 'Shoulder Press', 'Push Press', 'Push Jerk', 'Split Jerk', 'Bench Press', 'Dumbbell Bench Press', 'Dip', 'Ring Dip', 'Burpee');

-- Pulls
UPDATE crossfit_movements SET functional_pattern = 'pull' WHERE name IN ('Pull-Up', 'Strict Pull-Up', 'Kipping Pull-Up', 'Butterfly Pull-Up', 'Chest-to-Bar Pull-Up', 'Muscle-Up', 'Bar Muscle-Up', 'Ring Muscle-Up', 'Ring Row', 'Barbell Row', 'Dumbbell Row', 'Rope Climb');

-- Lunges
UPDATE crossfit_movements SET functional_pattern = 'lunge' WHERE name IN ('Lunge', 'Walking Lunge', 'Overhead Walking Lunge', 'Front Rack Lunge', 'Bulgarian Split Squat', 'Box Step-Up');

-- Carries
UPDATE crossfit_movements SET functional_pattern = 'carry' WHERE name IN ('Farmers Carry', 'Sandbag Carry', 'Yoke Carry', 'Overhead Carry');

-- Core
UPDATE crossfit_movements SET functional_pattern = 'core' WHERE name IN ('Sit-Up', 'GHD Sit-Up', 'Toes-to-Bar', 'Knees-to-Elbow', 'V-Up', 'Hollow Rock', 'Plank Hold', 'L-Sit');

-- Monostructural
UPDATE crossfit_movements SET functional_pattern = 'monostructural' WHERE category IN ('metabolic');


-- Step 3: Add 'full body' to muscle groups (Note: PostgreSQL arrays don't have simple check constraints we can easily modify in place without dropping, so we often manage this at the application layer or complex triggers, but here we will just update the data)
-- We'll assume the application enforces the allowed values, but we can backfill 'full body' now.

UPDATE crossfit_movements
SET primary_muscle_groups = array_append(array_remove(primary_muscle_groups, 'legs'), 'full body')
WHERE name IN ('Thruster', 'Wall Ball', 'Cluster', 'Burpee', 'Devil Press', 'Man Maker');

-- Step 4: Add loading_focus to workouts table (assuming table name is 'workouts' or 'wods')
-- Check if table is 'workouts'
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workouts') THEN
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS loading_focus TEXT CHECK (loading_focus IN ('light', 'moderate', 'heavy'));
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Enhanced movement analytics schema applied successfully';
END $$;
