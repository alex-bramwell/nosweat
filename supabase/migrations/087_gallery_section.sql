-- Opt-in Gallery section: photos (+ up to one video by link) shown as a grid
-- or a carousel. Adds the storage columns and slots "gallery" into the section
-- order, hidden by default (owners turn it on in the builder).

ALTER TABLE public.gym_branding
  ADD COLUMN IF NOT EXISTS gallery_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_layout text DEFAULT 'grid';

COMMENT ON COLUMN public.gym_branding.gallery_items IS 'Ordered array of {type: image|video, url}. Max one video. Video url is a link (YouTube/Vimeo/mp4).';
COMMENT ON COLUMN public.gym_branding.gallery_layout IS 'grid | carousel. Carousel is only offered once there are more than 3 photos.';

-- Include "gallery" in the homepage section order (default for new rows + backfill).
ALTER TABLE public.gym_branding ALTER COLUMN section_order
  SET DEFAULT '["hero","programs","wod","stats","gallery","cta"]'::jsonb;

UPDATE public.gym_branding
  SET section_order = section_order || '["gallery"]'::jsonb
  WHERE NOT (section_order @> '["gallery"]'::jsonb);

-- Default the gallery to hidden (opt-in) for existing gyms.
UPDATE public.gym_branding
  SET visible_sections = visible_sections || '{"gallery": false}'::jsonb
  WHERE NOT (visible_sections ? 'gallery');
