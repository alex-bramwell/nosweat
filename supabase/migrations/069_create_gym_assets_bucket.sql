-- Create storage bucket for gym assets (logos, hero images, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gym-assets',
  'gym-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can view gym assets (needed to render public site)
CREATE POLICY "Public read access for gym assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gym-assets');

-- RLS: Authenticated users can upload assets to their gym folder
CREATE POLICY "Gym owners can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gym-assets'
    AND auth.uid() IS NOT NULL
  );

-- RLS: Authenticated users can update their assets
CREATE POLICY "Gym owners can update assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'gym-assets'
    AND auth.uid() IS NOT NULL
  );

-- RLS: Authenticated users can delete their assets
CREATE POLICY "Gym owners can delete assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gym-assets'
    AND auth.uid() IS NOT NULL
  );
