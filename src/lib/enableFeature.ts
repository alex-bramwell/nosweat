import { supabase } from './supabase';
import type { FeatureKey } from '../types/tenant';

/**
 * Enable a gym feature inline (e.g. from the builder locked overlay).
 * Uses upsert so it works whether or not a row already exists.
 */
export async function enableFeature(gymId: string, featureKey: FeatureKey): Promise<void> {
  const { error } = await supabase
    .from('gym_features')
    .upsert(
      {
        gym_id: gymId,
        feature_key: featureKey,
        enabled: true,
        enabled_at: new Date().toISOString(),
      },
      { onConflict: 'gym_id,feature_key' }
    );

  if (error) throw error;
}
