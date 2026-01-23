-- Revert muscle groups to broad categories and update subcategories to Title Case

-- 1. Update subcategories to Title Case (removing underscores)
ALTER TABLE crossfit_movements
DROP CONSTRAINT IF EXISTS crossfit_movements_subcategory_check;

UPDATE crossfit_movements
SET subcategory = CASE
  WHEN subcategory = 'olympic' THEN 'Olympic'
  WHEN subcategory = 'powerlifting' THEN 'Powerlifting'
  WHEN subcategory = 'bodybuilding' THEN 'Bodybuilding'
  WHEN subcategory = 'gymnastic_strength' THEN 'Gymnastic Strength'
  WHEN subcategory = 'gymnastic_skill' THEN 'Gymnastic Skill'
  WHEN subcategory = 'cardio' THEN 'Cardio'
  WHEN subcategory = 'accessory' THEN 'Accessory'
  ELSE subcategory
END;

ALTER TABLE crossfit_movements
ADD CONSTRAINT crossfit_movements_subcategory_check
CHECK (subcategory IN ('Olympic', 'Powerlifting', 'Bodybuilding', 'Gymnastic Strength', 'Gymnastic Skill', 'Cardio', 'Accessory'));

-- 2. Revert muscle groups to broad categories

-- Legs (Quads, Hamstrings, Glutes, Calves -> Legs)
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

-- Back (Lats, Upper Back, Lower Back -> Back)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(primary_muscle_groups, 'lats', 'back'),
      'upper_back', 'back'
    ),
    'lower_back', 'back'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(
      ARRAY_REPLACE(secondary_muscle_groups, 'lats', 'back'),
      'upper_back', 'back'
    ),
    'lower_back', 'back'
  );

-- Arms (Biceps, Triceps, Forearms -> Arms)
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

-- Core (Abs, Obliques -> Core)
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(primary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  ),
  secondary_muscle_groups = ARRAY_REPLACE(
    ARRAY_REPLACE(secondary_muscle_groups, 'abs', 'core'),
    'obliques', 'core'
  );

-- Clean up duplicates in arrays (e.g. if 'quads' and 'glutes' both became 'legs')
UPDATE crossfit_movements
SET primary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(primary_muscle_groups)),
    secondary_muscle_groups = ARRAY(SELECT DISTINCT UNNEST(secondary_muscle_groups));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Muscle groups reverted and subcategories updated successfully';
END $$;
