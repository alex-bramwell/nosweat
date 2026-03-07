-- Add navbar style option to gym_branding
ALTER TABLE public.gym_branding
  ADD COLUMN IF NOT EXISTS nav_style TEXT DEFAULT 'floating'
    CHECK (nav_style IN ('floating', 'standard'));
