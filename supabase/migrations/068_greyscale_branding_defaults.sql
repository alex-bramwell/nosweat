-- Update default branding colors to greyscale palette
-- New gyms now start with a clean black/white/grey theme

ALTER TABLE public.gym_branding
  ALTER COLUMN color_bg         SET DEFAULT '#ffffff',
  ALTER COLUMN color_bg_light   SET DEFAULT '#f5f5f5',
  ALTER COLUMN color_bg_dark    SET DEFAULT '#e5e5e5',
  ALTER COLUMN color_surface    SET DEFAULT '#ffffff',
  ALTER COLUMN color_accent     SET DEFAULT '#111111',
  ALTER COLUMN color_accent2    SET DEFAULT '#333333',
  ALTER COLUMN color_secondary  SET DEFAULT '#555555',
  ALTER COLUMN color_secondary2 SET DEFAULT '#444444',
  ALTER COLUMN color_specialty  SET DEFAULT '#777777',
  ALTER COLUMN color_text       SET DEFAULT '#111111',
  ALTER COLUMN color_muted      SET DEFAULT '#888888',
  ALTER COLUMN color_header     SET DEFAULT '#000000',
  ALTER COLUMN color_footer     SET DEFAULT '#111111';
