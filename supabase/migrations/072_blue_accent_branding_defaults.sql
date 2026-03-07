-- Update default branding to blue accent + Zinc neutrals for WCAG AA compliance
-- Fixes: invisible button text, failing muted contrast, washed-out greyscale look

ALTER TABLE public.gym_branding
  ALTER COLUMN color_bg         SET DEFAULT '#ffffff',
  ALTER COLUMN color_bg_light   SET DEFAULT '#fafafa',
  ALTER COLUMN color_bg_dark    SET DEFAULT '#f4f4f5',
  ALTER COLUMN color_surface    SET DEFAULT '#ffffff',
  ALTER COLUMN color_accent     SET DEFAULT '#2563eb',
  ALTER COLUMN color_accent2    SET DEFAULT '#1d4ed8',
  ALTER COLUMN color_secondary  SET DEFAULT '#3f3f46',
  ALTER COLUMN color_secondary2 SET DEFAULT '#52525b',
  ALTER COLUMN color_specialty  SET DEFAULT '#6366f1',
  ALTER COLUMN color_text       SET DEFAULT '#18181b',
  ALTER COLUMN color_muted      SET DEFAULT '#71717a',
  ALTER COLUMN color_header     SET DEFAULT '#09090b',
  ALTER COLUMN color_footer     SET DEFAULT '#18181b';
