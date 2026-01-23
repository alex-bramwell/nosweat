-- Fix muscle group inconsistencies to match TypeScript types
-- This migration ensures all muscle groups use the correct naming convention:
-- Valid groups: shoulders, back, chest, arms, legs, core, full body

-- Replace 'full_body' with 'full body' (with space)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(primary_muscle_groups, 'full_body', 'full body'),
    secondary_muscle_groups = ARRAY_REPLACE(secondary_muscle_groups, 'full_body', 'full body');

-- Clean up any granular muscle groups that weren't properly reverted by migration 021
-- These should have been converted to broad categories but we'll ensure they're cleaned up

-- Replace granular leg muscle groups with 'legs'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(primary_muscle_groups, 'quads', 'legs'),
        'hamstrings', 'legs'
      ),
      'glutes', 'legs'
    ),
    'calves', 'legs'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(secondary_muscle_groups, 'quads', 'legs'),
        'hamstrings', 'legs'
      ),
      'glutes', 'legs'
    ),
    'calves', 'legs'
  );

-- Replace granular back muscle groups with 'back'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(primary_muscle_groups, 'lats', 'back'),
        'upper_back', 'back'
      ),
      'lower_back', 'back'
    ),
    'traps', 'back'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(
        ARRAY_REPLACE(secondary_muscle_groups, 'lats', 'back'),
        'upper_back', 'back'
      ),
      'lower_back', 'back'
    ),
    'traps', 'back'
  );

-- Replace granular arm muscle groups with 'arms'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(primary_muscle_groups, 'biceps', 'arms'),
      'triceps', 'arms'
    ),
    'forearms', 'arms'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(secondary_muscle_groups, 'biceps', 'arms'),
      'triceps', 'arms'
    ),
    'forearms', 'arms'
  );

-- Replace granular core muscle groups with 'core'
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(primary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(secondary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  );

-- Remove duplicates that may have been created (e.g., ['legs', 'legs'] -> ['legs'])
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(primary_muscle_groups)),
    secondary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(secondary_muscle_groups));

-- Assign 'full body' to movements that engage multiple major muscle groups simultaneously
-- These are compound movements that significantly tax the entire body

-- Thruster: Full squat to overhead press in one motion
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Thruster';

-- Wall Ball: Squat and throw ball to target
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Wall Ball';

-- Clean & Jerk: Full body Olympic lift
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Clean & Jerk';

-- Burpee: Chest to ground, jump with hands overhead
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Burpee';

-- Devil Press: Burpee + double dumbbell snatch
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Devil Press';

-- Rope Climb: Full body climbing movement
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Rope Climb';

-- Snatch: Full Olympic lift from floor to overhead
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Snatch';

-- Clean: Full squat clean from floor to shoulders
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Clean';

-- Turkish Get-Up: Complex movement from lying to standing
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name = 'Turkish Get-Up';

-- Muscle-Ups: Explosive pull + dip transition
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['full body'],
    secondary_muscle_groups = ARRAY['core']
WHERE name IN ('Bar Muscle-Up', 'Ring Muscle-Up');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed all muscle group inconsistencies and assigned full body movements successfully';
END $$;
