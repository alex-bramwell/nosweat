-- Add section visibility column to gym_branding
ALTER TABLE public.gym_branding
  ADD COLUMN IF NOT EXISTS visible_sections jsonb
    DEFAULT '{"hero": true, "programs": true, "wod": true, "cta": true, "stats": true}'::jsonb;
