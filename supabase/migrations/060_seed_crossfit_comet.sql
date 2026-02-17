-- ============================================================================
-- PHASE 7: Seed CrossFit Comet as First Tenant
-- ============================================================================
-- This migration re-creates CrossFit Comet as the first gym on the platform,
-- migrating their original data into the multi-tenant schema.
-- ============================================================================

-- Use a fixed UUID so we can reference it throughout
DO $$
DECLARE
  comet_gym_id UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN

-- ============================================================================
-- 1. CREATE THE GYM
-- ============================================================================
INSERT INTO public.gyms (id, name, slug, status, contact_email, contact_phone, address_line1, address_line2, city, postcode, country, google_maps_embed_url)
VALUES (
  comet_gym_id,
  'CrossFit Comet',
  'comet',
  'active',
  'info@crossfitcomet.com',
  '07740195130',
  'Unit 24, Bar Lane Industrial Estate',
  'Basford',
  'Nottingham',
  'NG6 0JA',
  'GB',
  'https://maps.google.com/maps?q=Unit+24,+Bar+Lane+Industrial+Estate,+Basford,+Nottingham+NG6+0JA,+UK&t=&z=15&ie=UTF8&iwloc=&output=embed'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;


-- ============================================================================
-- 2. SET COMET'S ORIGINAL BRANDING (dark theme, orange accent)
-- ============================================================================
INSERT INTO public.gym_branding (
  gym_id,
  color_bg, color_bg_light, color_bg_dark, color_surface,
  color_accent, color_accent2, color_secondary, color_secondary2, color_specialty,
  color_text, color_muted, color_header, color_footer,
  font_header, font_body, border_radius, theme_mode,
  hero_headline, hero_subtitle,
  cta_headline, cta_subtitle,
  about_mission, about_philosophy, footer_text
)
VALUES (
  comet_gym_id,
  '#181820', '#2a2a38', '#0f0f14', '#23232e',
  '#ff4f1f', '#ff1f4f', '#00d4ff', '#00ff88', '#9d4edd',
  '#ffffff', '#888888', '#ffffff', '#ffffff',
  'Poppins', 'Open Sans', '1rem', 'dark',
  'Welcome to CrossFit Comet',
  'Where strength meets community. Transform your fitness journey with expert coaching, world-class programming, and a supportive atmosphere.',
  'Ready to Start Your Journey?',
  'Join CrossFit Comet today and experience the difference. Your first class is free!',
  'At CrossFit Comet, we believe fitness is more than just a workout—it''s a lifestyle. Our mission is to create a welcoming, inclusive community where athletes of all levels can push their limits, achieve their goals, and become the best version of themselves.',
  'Founded in Nottingham, we''ve built our gym on the principles of functional fitness, community support, and expert coaching. Whether you''re a complete beginner or a seasoned athlete, we''re here to guide you every step of the way.',
  'CrossFit® Affiliate. CrossFit® is a registered trademark of CrossFit, LLC.'
)
ON CONFLICT (gym_id) DO UPDATE SET
  color_accent = EXCLUDED.color_accent,
  theme_mode = EXCLUDED.theme_mode;


-- ============================================================================
-- 3. ENABLE ALL FEATURES FOR COMET
-- ============================================================================
INSERT INTO public.gym_features (gym_id, feature_key, enabled, enabled_at) VALUES
  (comet_gym_id, 'class_booking', true, now()),
  (comet_gym_id, 'wod_programming', true, now()),
  (comet_gym_id, 'coach_profiles', true, now()),
  (comet_gym_id, 'day_passes', true, now()),
  (comet_gym_id, 'trial_memberships', true, now()),
  (comet_gym_id, 'service_booking', true, now()),
  (comet_gym_id, 'accounting_integration', true, now()),
  (comet_gym_id, 'coach_analytics', true, now()),
  (comet_gym_id, 'member_management', true, now())
ON CONFLICT (gym_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;


-- ============================================================================
-- 4. SEED COMET'S PROGRAMS (from original src/data/programs.ts + programDetails.ts)
-- ============================================================================
INSERT INTO public.gym_programs (gym_id, slug, title, description, tagline, overview, features, benefits, who_is_it_for, level, price_pence, price_unit, price_note, schedule_info, sort_order)
VALUES
  (comet_gym_id, 'crossfit', 'CrossFit',
   'High-intensity functional fitness for all levels. Build strength, endurance, and community.',
   'Forge Elite Fitness Through Functional Movement',
   'CrossFit combines weightlifting, gymnastics, and metabolic conditioning into varied daily workouts that challenge every aspect of your fitness. Our expert coaches scale each workout to your ability level, ensuring you get a safe, effective workout every time.',
   ARRAY['Constantly varied workouts', 'Functional movements', 'High intensity training', 'Scalable for any fitness level', 'Expert coaching'],
   '[{"title":"Constantly Varied","description":"No two workouts are the same. Keep your body adapting and your mind engaged with new challenges daily."},{"title":"Functional Movements","description":"Master movements that translate to real-life strength and capability, from squats to pull-ups."},{"title":"Community Driven","description":"Train alongside supportive athletes who push you to be your best and celebrate your progress."},{"title":"Scalable","description":"Whether you''re brand new or a seasoned athlete, workouts are tailored to your current fitness level."}]'::JSONB,
   ARRAY['Anyone looking to improve overall fitness', 'Athletes seeking functional strength', 'People who thrive in group settings', 'Those ready to challenge themselves'],
   'all', 7000, 'per month', 'Includes specialty classes',
   'Multiple daily sessions Mon-Fri, weekends available', 0),

  (comet_gym_id, 'comet-plus', 'Comet Plus',
   'Extra programming by head coach Dan designed to complement class workouts and prepare you for competition environments.',
   'Competition-Focused Programming by Head Coach Dan',
   'Extra programming designed by head coach Dan to complement class workouts and prepare you for competition environments. This add-on programming aligns perfectly with your regular class attendance to accelerate your progress and develop advanced skills.',
   ARRAY['Additional competition-focused programming', 'Designed by head coach Dan', 'Aligns with class programming', 'Competition preparation', 'Advanced skill development'],
   '[{"title":"Competition Programming","description":"Additional workouts specifically designed to prepare you for the demands of competitive CrossFit."},{"title":"Expert Design","description":"Created by head coach Dan with years of competition experience and coaching expertise."},{"title":"Aligns with Classes","description":"Designed to complement your regular class programming, not compete with it."},{"title":"Advanced Development","description":"Focus on skills, movements, and energy systems needed for competition success."}]'::JSONB,
   ARRAY['Athletes preparing for competitions', 'Those seeking advanced programming', 'Members wanting to take training to the next level', 'Athletes committed to competitive CrossFit'],
   'all', 2000, 'per month', 'Add-on to membership',
   'Additional programming alongside regular classes', 1),

  (comet_gym_id, 'crossfit-gymnastics', 'CrossFit Gymnastics',
   'Develop gymnastics skills and body control. Master movements like handstands, muscle-ups, and more.',
   'Master Bodyweight Control and Gymnastics Skills',
   'Develop impressive gymnastics skills through progressive programming. From handstands to muscle-ups, our dedicated gymnastics sessions focus on building the strength, flexibility, and technique needed for advanced movements.',
   ARRAY['Skill progressions', 'Body awareness training', 'Handstand work', 'Bar and ring movements', 'Flexibility development'],
   '[{"title":"Skill Progressions","description":"Systematic approach to building gymnastics skills from foundations to advanced movements."},{"title":"Body Awareness","description":"Develop kinesthetic awareness and control through targeted drills and practice."},{"title":"Dedicated Time","description":"Focus solely on gymnastics without the pressure of a timed workout."},{"title":"Small Groups","description":"Low coach-to-athlete ratios ensure personalized attention and feedback."}]'::JSONB,
   ARRAY['Athletes wanting to improve gymnastics skills', 'Those working toward muscle-ups, handstands, etc.', 'CrossFitters looking to strengthen weaknesses', 'Anyone interested in bodyweight mastery'],
   'intermediate', 2000, 'per session', NULL,
   'Saturdays 10:30 AM', 2),

  (comet_gym_id, 'functional-bodybuilding', 'Functional Bodybuilding',
   'Build muscle and improve movement quality with intentional strength training and accessory work.',
   'Build Muscle With Purpose and Movement Quality',
   'Combine the muscle-building benefits of bodybuilding with functional movement patterns. This program emphasizes controlled tempo work, accessory movements, and hypertrophy while maintaining the movement quality that keeps you injury-free.',
   ARRAY['Hypertrophy focus', 'Movement quality emphasis', 'Accessory programming', 'Tempo training', 'Injury prevention'],
   '[{"title":"Hypertrophy Focus","description":"Structured programming designed to build lean muscle mass effectively."},{"title":"Movement Quality","description":"Every rep performed with intention and proper mechanics for long-term health."},{"title":"Tempo Training","description":"Controlled eccentric and concentric phases maximize muscle engagement and growth."},{"title":"Injury Prevention","description":"Build resilient muscles and joints through balanced programming and proper progression."}]'::JSONB,
   ARRAY['Athletes looking to build muscle', 'Those recovering from or preventing injuries', 'CrossFitters wanting accessory work', 'Anyone seeking aesthetic and functional gains'],
   'all', 2000, 'per session', NULL,
   'Saturdays 10:30 AM', 3),

  (comet_gym_id, 'weightlifting', 'Weightlifting',
   'Olympic weightlifting technique and strength. Master the snatch and clean & jerk.',
   'Master the Snatch and Clean & Jerk',
   'Olympic weightlifting is the pinnacle of strength, speed, and technique. Our dedicated weightlifting program helps you develop the positions, timing, and power needed to move heavy weights overhead with confidence.',
   ARRAY['Olympic lift focus', 'Technical coaching', 'Strength programming', 'Competition preparation', 'Small class sizes'],
   '[{"title":"Technical Mastery","description":"Detailed coaching on the complex positions and movements of Olympic lifting."},{"title":"Strength Development","description":"Build explosive power and full-body strength through the snatch and clean & jerk."},{"title":"Competition Prep","description":"Programming designed to prepare athletes for local and national competitions."},{"title":"Expert Coaching","description":"Work with coaches experienced in Olympic weightlifting technique and programming."}]'::JSONB,
   ARRAY['Athletes serious about Olympic lifting', 'Those preparing for competitions', 'CrossFitters wanting to improve lifts', 'Anyone passionate about barbell sports'],
   'intermediate', 2000, 'per session', NULL,
   'Saturdays 10:30 AM', 4),

  (comet_gym_id, 'open-gym', 'Open Gym',
   'Train on your own schedule. Access to all equipment and facilities during open gym hours.',
   'Train On Your Terms',
   'Sometimes the best workout is the one you design yourself. Open Gym gives experienced athletes access to all our equipment and facilities to train on their own programming, perfect a skill, or get extra work in.',
   ARRAY['Flexible schedule', 'All equipment available', 'Self-directed training', 'Coach available for questions', 'Perfect for experienced athletes'],
   '[{"title":"Flexible Schedule","description":"Train when it works for you with multiple open gym sessions throughout the week."},{"title":"Full Equipment Access","description":"Use any equipment in the gym for your personal training goals."},{"title":"Self-Directed","description":"Follow your own program, work on skills, or do extra accessory work."},{"title":"Coach Support","description":"Coaches available to answer questions or provide movement feedback."}]'::JSONB,
   ARRAY['Experienced athletes with their own programming', 'Those wanting extra skill practice', 'Athletes following online programming', 'Members needing flexible training times'],
   'intermediate', NULL, NULL, NULL,
   'Multiple sessions daily - see schedule', 5)
ON CONFLICT (gym_id, slug) DO NOTHING;


-- ============================================================================
-- 5. SEED COMET'S SCHEDULE (from original src/data/schedule.ts — 58 entries)
-- ============================================================================
INSERT INTO public.gym_schedule (gym_id, day_of_week, start_time, class_name, max_capacity) VALUES
  -- Monday
  (comet_gym_id, 'monday', '06:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'monday', '07:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'monday', '09:00', 'Open Gym', 16),
  (comet_gym_id, 'monday', '09:30', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'monday', '10:30', 'Open Gym', 16),
  (comet_gym_id, 'monday', '15:30', 'Open Gym', 16),
  (comet_gym_id, 'monday', '16:30', 'CrossFit | Open Gym', 16),
  -- Tuesday
  (comet_gym_id, 'tuesday', '06:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'tuesday', '07:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'tuesday', '09:00', 'Open Gym', 16),
  (comet_gym_id, 'tuesday', '09:30', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'tuesday', '10:30', 'Open Gym', 16),
  (comet_gym_id, 'tuesday', '15:30', 'Open Gym', 16),
  (comet_gym_id, 'tuesday', '16:30', 'CrossFit | Open Gym', 16),
  -- Wednesday
  (comet_gym_id, 'wednesday', '06:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'wednesday', '07:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'wednesday', '09:00', 'Open Gym', 16),
  (comet_gym_id, 'wednesday', '09:30', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'wednesday', '10:30', 'Open Gym', 16),
  (comet_gym_id, 'wednesday', '15:30', 'Open Gym', 16),
  (comet_gym_id, 'wednesday', '16:30', 'CrossFit | Open Gym', 16),
  -- Thursday
  (comet_gym_id, 'thursday', '06:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'thursday', '07:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'thursday', '09:00', 'Open Gym', 16),
  (comet_gym_id, 'thursday', '09:30', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'thursday', '10:30', 'Open Gym', 16),
  (comet_gym_id, 'thursday', '15:30', 'Open Gym', 16),
  (comet_gym_id, 'thursday', '16:30', 'CrossFit', 16),
  -- Friday
  (comet_gym_id, 'friday', '06:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'friday', '07:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'friday', '09:00', 'Open Gym', 16),
  (comet_gym_id, 'friday', '09:30', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'friday', '10:30', 'Open Gym', 16),
  (comet_gym_id, 'friday', '15:30', 'Open Gym', 16),
  (comet_gym_id, 'friday', '16:30', 'CrossFit', 16),
  -- Saturday
  (comet_gym_id, 'saturday', '08:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'saturday', '09:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'saturday', '10:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'saturday', '10:30', 'Specialty Class', 16),
  -- Sunday
  (comet_gym_id, 'sunday', '09:00', 'CrossFit | Open Gym', 16),
  (comet_gym_id, 'sunday', '10:00', 'Open Gym', 16);


-- ============================================================================
-- 6. SEED COMET'S STATS (from original src/data/stats.ts)
-- ============================================================================
INSERT INTO public.gym_stats (gym_id, label, value, suffix, sort_order) VALUES
  (comet_gym_id, 'Classes Per Week', 40, '+', 0),
  (comet_gym_id, 'Certified Coaches', 8, NULL, 1);


-- ============================================================================
-- 7. SEED COMET'S MEMBERSHIP TYPES
-- ============================================================================
INSERT INTO public.gym_memberships (gym_id, slug, display_name, description, price_pence, billing_period, sort_order) VALUES
  (comet_gym_id, 'trial', 'Free Trial', 'Try a class with no commitment', 0, 'one-time', 0),
  (comet_gym_id, 'crossfit', 'CrossFit', 'Full access to all CrossFit classes', 7000, 'monthly', 1),
  (comet_gym_id, 'comet-plus', 'Comet Plus', 'CrossFit membership plus competition programming', 9000, 'monthly', 2),
  (comet_gym_id, 'open-gym', 'Open Gym', 'Access during open gym hours', 4000, 'monthly', 3),
  (comet_gym_id, 'specialty', 'Specialty Program', 'Individual specialty class access', 2000, 'per session', 4)
ON CONFLICT (gym_id, slug) DO NOTHING;


-- ============================================================================
-- 8. ASSIGN ALL EXISTING DATA TO COMET
-- ============================================================================
-- All pre-existing data (profiles, bookings, payments, etc.) belongs to CrossFit Comet
UPDATE public.profiles SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.bookings SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.payments SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.workouts SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.trial_memberships SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.workout_bookings SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.coach_services SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.service_bookings SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.stripe_customers SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.accounting_integrations SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.accounting_account_mappings SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.accounting_sync_logs SET gym_id = comet_gym_id WHERE gym_id IS NULL;
UPDATE public.accounting_synced_transactions SET gym_id = comet_gym_id WHERE gym_id IS NULL;


-- ============================================================================
-- 9. ENFORCE NOT NULL ON gym_id (all data now has a gym assigned)
-- ============================================================================
-- Only add NOT NULL if there's no remaining NULL data
DO $enforce$
BEGIN
  -- profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.profiles ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- bookings
  IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.bookings ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- payments
  IF NOT EXISTS (SELECT 1 FROM public.payments WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.payments ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- workouts
  IF NOT EXISTS (SELECT 1 FROM public.workouts WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.workouts ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- trial_memberships
  IF NOT EXISTS (SELECT 1 FROM public.trial_memberships WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.trial_memberships ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- workout_bookings
  IF NOT EXISTS (SELECT 1 FROM public.workout_bookings WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.workout_bookings ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- coach_services
  IF NOT EXISTS (SELECT 1 FROM public.coach_services WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.coach_services ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- service_bookings
  IF NOT EXISTS (SELECT 1 FROM public.service_bookings WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.service_bookings ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- stripe_customers
  IF NOT EXISTS (SELECT 1 FROM public.stripe_customers WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.stripe_customers ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- accounting_integrations
  IF NOT EXISTS (SELECT 1 FROM public.accounting_integrations WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.accounting_integrations ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- accounting_account_mappings
  IF NOT EXISTS (SELECT 1 FROM public.accounting_account_mappings WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.accounting_account_mappings ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- accounting_sync_logs
  IF NOT EXISTS (SELECT 1 FROM public.accounting_sync_logs WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.accounting_sync_logs ALTER COLUMN gym_id SET NOT NULL;
  END IF;

  -- accounting_synced_transactions
  IF NOT EXISTS (SELECT 1 FROM public.accounting_synced_transactions WHERE gym_id IS NULL LIMIT 1) THEN
    ALTER TABLE public.accounting_synced_transactions ALTER COLUMN gym_id SET NOT NULL;
  END IF;
END $enforce$;

END $$;


-- ============================================================================
-- DONE — Phase 7: CrossFit Comet is now the first tenant
-- ============================================================================
-- CrossFit Comet is live at: comet.gymplatform.com (or ?tenant=comet locally)
-- - Dark theme with orange (#ff4f1f) accent
-- - All 9 features enabled
-- - 6 programs, 41 schedule entries, 2 stats, 5 membership types
-- - All existing user data assigned to Comet
-- - gym_id is NOT NULL on all 13 tables
