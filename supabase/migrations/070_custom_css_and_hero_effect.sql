-- Add custom CSS and hero effect columns to gym_branding
ALTER TABLE public.gym_branding
  ADD COLUMN IF NOT EXISTS custom_css text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_effect text DEFAULT 'comet';
