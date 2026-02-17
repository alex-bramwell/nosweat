import { useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { FEATURES, getFeaturesByCategory, type FeatureDefinition } from '../../config/features';
import type { FeatureKey } from '../../types/tenant';
import { Card } from '../common';
import styles from './FeatureTogglePanel.module.scss';

const FeatureTogglePanel: React.FC = () => {
  const { gym, features, refreshTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const featuresByCategory = getFeaturesByCategory();

  const categoryLabels: Record<string, string> = {
    core: 'Core Features',
    coaching: 'Coaching Features',
    business: 'Business Features',
  };

  const calculateTotal = (): { count: number; costPence: number } => {
    let count = 0;
    let costPence = 0;

    FEATURES.forEach((feature) => {
      if (features[feature.key]) {
        count++;
        costPence += feature.monthlyPricePence;
      }
    });

    return { count, costPence };
  };

  const formatPrice = (pence: number): string => {
    return `£${(pence / 100).toFixed(0)}`;
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

    // Check if toggling off and has dependents that are enabled
    if (currentValue) {
      const dependents = getDependents(featureKey);
      const enabledDependents = dependents.filter((dep) => features[dep]);

      if (enabledDependents.length > 0) {
        const dependentNames = enabledDependents
          .map((dep) => {
            const depFeature = FEATURES.find((f) => f.key === dep);
            return depFeature?.name || dep;
          })
          .join(', ');

        const confirmDisable = window.confirm(
          `Disabling "${feature.name}" will also require disabling: ${dependentNames}. Continue?`
        );

        if (!confirmDisable) return;

        // Disable all dependents
        for (const depKey of enabledDependents) {
          await toggleFeature(depKey, false);
        }
      }
    }

    // Toggle the feature
    await toggleFeature(featureKey, !currentValue);
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

  const { count, costPence } = calculateTotal();

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
                    <div className={styles.featureIcon}>{feature.icon}</div>
                    <div className={styles.featureInfo}>
                      <h3 className={styles.featureName}>{feature.name}</h3>
                      <span className={styles.featurePrice}>
                        {formatPrice(feature.monthlyPricePence)}/month
                      </span>
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
                      <span className={styles.requirementIcon}>ℹ️</span>
                      <span>Requires: {getDependencyNames(feature)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Card className={styles.totalCard}>
        <div className={styles.totalContent}>
          <div className={styles.totalInfo}>
            <span className={styles.totalLabel}>Total Monthly Cost</span>
            <span className={styles.totalSubtext}>
              {count} {count === 1 ? 'feature' : 'features'} enabled
            </span>
          </div>
          <div className={styles.totalPrice}>{formatPrice(costPence)}/month</div>
        </div>
      </Card>
    </div>
  );
};

export default FeatureTogglePanel;
