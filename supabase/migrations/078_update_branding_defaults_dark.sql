-- ============================================================================
-- Update gym_branding column defaults to Comet dark theme
-- ============================================================================
-- New gyms should get the dark starter theme by default, matching the
-- onboarding seed values and DEFAULT_BRANDING in the frontend.
-- ============================================================================

ALTER TABLE public.gym_branding
  ALTER COLUMN color_bg SET DEFAULT '#181820',
  ALTER COLUMN color_bg_light SET DEFAULT '#2a2a38',
  ALTER COLUMN color_bg_dark SET DEFAULT '#0f0f14',
  ALTER COLUMN color_surface SET DEFAULT '#23232e',
  ALTER COLUMN color_accent SET DEFAULT '#ff4f1f',
  ALTER COLUMN color_accent2 SET DEFAULT '#ff1f4f',
  ALTER COLUMN color_secondary SET DEFAULT '#00d4ff',
  ALTER COLUMN color_secondary2 SET DEFAULT '#00ff88',
  ALTER COLUMN color_specialty SET DEFAULT '#9d4edd',
  ALTER COLUMN color_text SET DEFAULT '#ffffff',
  ALTER COLUMN color_muted SET DEFAULT '#888888',
  ALTER COLUMN color_header SET DEFAULT '#ffffff',
  ALTER COLUMN color_footer SET DEFAULT '#ffffff',
  ALTER COLUMN font_header SET DEFAULT 'Poppins',
  ALTER COLUMN font_body SET DEFAULT 'Open Sans',
  ALTER COLUMN border_radius SET DEFAULT '1rem',
  ALTER COLUMN theme_mode SET DEFAULT 'dark';
