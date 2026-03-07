import { supabase } from './supabase';

const BUCKET = 'gym-assets';

export type AssetType = 'logo' | 'logo_dark' | 'favicon' | 'hero_image' | 'about_image' | 'og_image';

export async function uploadGymAsset(
  gymId: string,
  assetType: AssetType,
  file: File
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${gymId}/${assetType}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { url: publicUrl, path };
}

export async function deleteGymAsset(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw error;
}
