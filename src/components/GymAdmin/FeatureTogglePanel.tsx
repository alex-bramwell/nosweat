import { useState, type ReactNode } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { FEATURES, getFeaturesByCategory, type FeatureDefinition } from '../../config/features';
import type { FeatureKey } from '../../types/tenant';
import { Card } from '../common';
import FeatureDisableModal from './FeatureDisableModal';
import styles from './FeatureTogglePanel.module.scss';

const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const FEATURE_ICONS: Record<FeatureKey, ReactNode> = {
  class_booking: (
    <svg {...svgProps}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  wod_programming: (
    <svg {...svgProps}><path d="M6.5 6.5h11M6.5 17.5h11" /><path d="M4 6.5a2.5 2.5 0 1 1 0 5M4 11.5a2.5 2.5 0 1 0 0 5" /><path d="M20 6.5a2.5 2.5 0 1 0 0 5M20 11.5a2.5 2.5 0 1 1 0 5" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
  ),
  coach_profiles: (
    <svg {...svgProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  day_passes: (
    <svg {...svgProps}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>
  ),
  trial_memberships: (
    <svg {...svgProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  ),
  service_booking: (
    <svg {...svgProps}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14l2 2 4-4" /></svg>
  ),
  accounting_integration: (
    <svg {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  ),
  coach_analytics: (
    <svg {...svgProps}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
  ),
  member_management: (
    <svg {...svgProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
};

const FeatureTogglePanel: React.FC = () => {
  const { gym, features, refreshTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [disableModalData, setDisableModalData] = useState<{
    feature: FeatureDefinition;
    dependents: FeatureDefinition[];
  } | null>(null);

  const featuresByCategory = getFeaturesByCategory();

  const categoryLabels: Record<string, string> = {
    core: 'Core Features',
    coaching: 'Coaching Features',
    business: 'Business Features',
  };

  const getEnabledCount = (): number => {
    return FEATURES.filter((feature) => features[feature.key]).length;
  };

  const isDependencyMet = (feature: FeatureDefinition): boolean => {
    if (!feature.dependencies || feature.dependencies.length === 0) {
      return true;
    }
    return feature.dependencies.every((dep) => features[dep]);
  };

  const getDependencyNames = (feature: FeatureDefinition): string => {
    if (!feature.dependencies) return '';
    return feature.dependencies
      .map((dep) => {
        const depFeature = FEATURES.find((f) => f.key === dep);
        return depFeature?.name || dep;
      })
      .join(', ');
  };

  const getDependents = (featureKey: FeatureKey): FeatureKey[] => {
    return FEATURES.filter((f) => f.dependencies?.includes(featureKey)).map((f) => f.key);
  };

  const handleToggle = async (featureKey: FeatureKey, currentValue: boolean) => {
    if (!gym) return;

    const feature = FEATURES.find((f) => f.key === featureKey);
    if (!feature) return;

    // When disabling, show confirmation modal
    if (currentValue) {
      const dependents = getDependents(featureKey);
      const enabledDependents = dependents.filter((dep) => features[dep]);
      const dependentFeatures = enabledDependents
        .map((dep) => FEATURES.find((f) => f.key === dep))
        .filter((f): f is FeatureDefinition => f !== undefined);

      setDisableModalData({ feature, dependents: dependentFeatures });
      return;
    }

    // Toggle the feature on
    await toggleFeature(featureKey, true);
  };

  const toggleFeature = async (featureKey: FeatureKey, enabled: boolean) => {
    if (!gym) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const feature = FEATURES.find((f) => f.key === featureKey);
      if (!feature) throw new Error('Feature not found');

      // Upsert the feature record
      const { error } = await supabase.from('gym_features').upsert(
        {
          gym_id: gym.id,
          feature_key: featureKey,
          enabled,
          enabled_at: enabled ? new Date().toISOString() : null,
          monthly_cost_pence: feature.monthlyPricePence,
        },
        {
          onConflict: 'gym_id,feature_key',
        }
      );

      if (error) throw error;

      await refreshTenant();
      setMessage({
        type: 'success',
        text: `${feature.name} ${enabled ? 'enabled' : 'disabled'} successfully!`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error toggling feature:', error);
      setMessage({ type: 'error', text: 'Failed to update feature. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableConfirm = async () => {
    if (!disableModalData) return;

    // Disable all dependent features first
    for (const dep of disableModalData.dependents) {
      await toggleFeature(dep.key, false);
    }

    // Disable the main feature
    await toggleFeature(disableModalData.feature.key, false);

    setDisableModalData(null);
  };

  const count = getEnabledCount();

  return (
    <div className={styles.featurePanel}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
        <div key={category} className={styles.category}>
          <h2 className={styles.categoryTitle}>{categoryLabels[category]}</h2>
          <div className={styles.featureGrid}>
            {categoryFeatures.map((feature) => {
              const isEnabled = features[feature.key];
              const canToggle = isDependencyMet(feature);
              const isDisabled = isLoading || (!canToggle && !isEnabled);

              return (
                <Card key={feature.key} className={styles.featureCard}>
                  <div className={styles.featureHeader}>
                    <div className={styles.featureIcon}>{FEATURE_ICONS[feature.key]}</div>
                    <div className={styles.featureInfo}>
                      <h3 className={styles.featureName}>{feature.name}</h3>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        disabled={isDisabled}
                        onChange={() => handleToggle(feature.key, isEnabled)}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <p className={styles.featureDescription}>{feature.description}</p>
                  {feature.dependencies && feature.dependencies.length > 0 && !canToggle && (
                    <div className={styles.featureRequirement}>
                      <span className={styles.requirementIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      </span>
                      <span>Requires: {getDependencyNames(feature)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <div className={styles.featureBadge}>
        <span className={styles.badgeCount}>{count}</span>
        <span className={styles.badgeLabel}>{count === 1 ? 'feature' : 'features'} enabled</span>
      </div>

      {disableModalData && (
        <FeatureDisableModal
          isOpen={true}
          onClose={() => setDisableModalData(null)}
          onConfirm={handleDisableConfirm}
          feature={disableModalData.feature}
          dependentFeatures={disableModalData.dependents}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default FeatureTogglePanel;
