-- Refine muscle groups to be more specific
-- This migration updates primary and secondary muscle groups to use more granular anatomy

-- 1. Squats (Legs -> Quads, Glutes)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads', 'glutes'],
    secondary_muscle_groups = ARRAY['hamstrings', 'core']
WHERE name IN ('Air Squat', 'Back Squat', 'Front Squat', 'Goblet Squat', 'Overhead Squat', 'Pistol Squat', 'Box Jump', 'Wall Ball', 'Thruster');

-- 2. Deadlifts / Hinges (Back/Legs -> Hamstrings, Glutes, Lower Back)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['hamstrings', 'glutes', 'lower_back'],
    secondary_muscle_groups = ARRAY['lats', 'traps', 'forearms']
WHERE name IN ('Deadlift', 'Sumo Deadlift', 'Romanian Deadlift', 'Kettlebell Swing', 'American Kettlebell Swing', 'Good Morning');

-- 3. Olympic Lifts (Full Body -> Specific Chain)
-- Snatch
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['hamstrings', 'glutes', 'shoulders', 'traps'],
    secondary_muscle_groups = ARRAY['quads', 'lower_back', 'triceps']
WHERE name LIKE '%Snatch%';

-- Clean
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['hamstrings', 'glutes', 'quads', 'traps'],
    secondary_muscle_groups = ARRAY['lats', 'lower_back', 'biceps']
WHERE name LIKE '%Clean%' AND name NOT LIKE '%Jerk%';

-- Jerk / Overhead Press
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['shoulders', 'triceps'],
    secondary_muscle_groups = ARRAY['upper_back', 'core']
WHERE name IN ('Shoulder Press', 'Push Press', 'Push Jerk', 'Split Jerk', 'Handstand Push-Up', 'Strict Handstand Push-Up');

-- 4. Pulling (Back -> Lats, Biceps)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['lats', 'biceps'],
    secondary_muscle_groups = ARRAY['upper_back', 'forearms']
WHERE name IN ('Pull-Up', 'Strict Pull-Up', 'Chin-Up', 'Ring Row', 'Barbell Row', 'Dumbbell Row', 'Rope Climb', 'Chest-to-Bar Pull-Up', 'Kipping Pull-Up', 'Butterfly Pull-Up');

-- 5. Pushing (Chest -> Chest, Triceps, Shoulders)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['chest', 'triceps', 'shoulders'],
    secondary_muscle_groups = ARRAY['core']
WHERE name IN ('Push-Up', 'Bench Press', 'Ring Dip', 'Dip', 'Hand-Release Push-Up', 'Burpee');

-- 6. Core (Core -> Abs, Obliques)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['abs'],
    secondary_muscle_groups = ARRAY['obliques'] -- hip_flexors not in type def yet, sticking to obliques
WHERE name IN ('Sit-Up', 'Toes-to-Bar', 'Knees-to-Elbow', 'V-Up', 'Hollow Rock', 'GHD Sit-Up', 'L-Sit');

-- Plank (Abs, Shoulders)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['abs', 'shoulders'],
    secondary_muscle_groups = ARRAY['quads', 'glutes']
WHERE name = 'Plank Hold';

-- 7. Lunges (Legs -> Quads, Glutes)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads', 'glutes'],
    secondary_muscle_groups = ARRAY['hamstrings', 'calves']
WHERE name LIKE '%Lunge%';

-- 8. Cardio
-- Row
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['lats', 'quads'],
    secondary_muscle_groups = ARRAY['biceps', 'hamstrings']
WHERE name LIKE 'Row%';

-- Run
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads', 'calves'],
    secondary_muscle_groups = ARRAY['hamstrings', 'glutes']
WHERE name LIKE 'Run%';

-- Bike
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['quads'],
    secondary_muscle_groups = ARRAY['hamstrings', 'calves']
WHERE name LIKE '%Bike%';

-- Double Unders
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY['calves'],
    secondary_muscle_groups = ARRAY['shoulders', 'forearms']
WHERE name LIKE '%Under%';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Muscle groups refined successfully';
END $$;
