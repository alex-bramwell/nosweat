-- Refine movement categories: Replace 'calisthenics' with 'gymnastic_strength' and 'gymnastic_skill'

-- 1. Drop the existing check constraint
ALTER TABLE crossfit_movements
DROP CONSTRAINT IF EXISTS crossfit_movements_subcategory_check;

-- 2. Update existing data (Map 'calisthenics' to new categories)

-- Strict / Strength Gymnastics
-- These are movements typically performed for strength development or strict mechanics
UPDATE crossfit_movements
SET subcategory = 'gymnastic_strength',
    recommended_sections = ARRAY['strength', 'warmup']
WHERE name IN (
  'Strict Pull-Up', 'Strict Handstand Push-Up', 'Push-Up', 'Ring Dip', 'Dip',
  'L-Sit', 'Pistol Squat', 'Rope Climb', 'Hand-Release Push-Up', 'Plank Hold',
  'Ring Row', 'Handstand Hold', 'Strict Toes-to-Bar', 'GHD Sit-Up', 'GHD Hip Extension',
  'Good Morning' -- Actually Good Morning is usually barbell/accessory, but if bodyweight it fits here or accessory
);

-- Dynamic / Skill Gymnastics
-- These are movements typically performed for metabolic conditioning or high-skill practice
UPDATE crossfit_movements
SET subcategory = 'gymnastic_skill',
    recommended_sections = ARRAY['metcon', 'skill']
WHERE name IN (
  'Pull-Up', 'Chest-to-Bar Pull-Up', 'Bar Muscle-Up', 'Ring Muscle-Up',
  'Toes-to-Bar', 'Knees-to-Elbow', 'Kipping Pull-Up', 'Butterfly Pull-Up',
  'Wall Walk', 'Burpee', 'Box Jump', 'Air Squat', 'Lunge', 'Sit-Up',
  'V-Up', 'Hollow Rock', 'Superman Hold'
);

-- Catch-all for any remaining 'calisthenics' (default to skill if unsure)
UPDATE crossfit_movements
SET subcategory = 'gymnastic_skill'
WHERE subcategory = 'calisthenics';

-- 3. Add new check constraint
ALTER TABLE crossfit_movements
ADD CONSTRAINT crossfit_movements_subcategory_check
CHECK (subcategory IN ('olympic', 'powerlifting', 'bodybuilding', 'gymnastic_strength', 'gymnastic_skill', 'cardio', 'accessory'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Movement categories refined: Calisthenics replaced with Gymnastic Strength/Skill';
END $$;
