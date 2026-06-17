-- Site-builder robustness: give gym owners control over section order, which
-- hero cards show and in what order, CTA button copy, SEO meta, and the About
-- "what makes us different" value cards. All additive columns on gym_branding.

ALTER TABLE public.gym_branding
  ADD COLUMN IF NOT EXISTS section_order jsonb DEFAULT '["hero","programs","wod","stats","cta"]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_card_order jsonb DEFAULT '["daypass","trial","schedule"]'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_primary_text text,
  ADD COLUMN IF NOT EXISTS cta_secondary_text text,
  ADD COLUMN IF NOT EXISTS cta_note text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS about_values jsonb;

COMMENT ON COLUMN public.gym_branding.section_order IS 'Ordered list of homepage section keys (hero, programs, wod, stats, cta).';
COMMENT ON COLUMN public.gym_branding.hero_card_order IS 'Ordered list of hero action card keys (daypass, trial, schedule).';
COMMENT ON COLUMN public.gym_branding.about_values IS 'Array of {icon,title,description} cards for the About "what makes us different" section. Null = use defaults.';
