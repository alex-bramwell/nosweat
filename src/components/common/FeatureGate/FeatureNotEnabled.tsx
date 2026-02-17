import React from 'react';
import { useTenant } from '../../../contexts/TenantContext';
import { getFeatureDefinition } from '../../../config/features';
import type { FeatureKey } from '../../../types/tenant';
import { Section, Container } from '../index';

interface FeatureNotEnabledProps {
  feature: FeatureKey;
}

/**
 * Friendly page-level fallback shown when a user navigates to a route
 * whose feature is disabled for their gym.
 */
export const FeatureNotEnabled: React.FC<FeatureNotEnabledProps> = ({ feature }) => {
  const { gym } = useTenant();
  const definition = getFeatureDefinition(feature);
  const featureName = definition?.name || feature;

  return (
    <Section spacing="large" background="surface">
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {definition?.icon || '🔒'}
          </div>
          <h2 style={{ marginBottom: '0.75rem' }}>
            {featureName} is not available
          </h2>
          <p style={{ color: 'var(--color-muted)', maxWidth: '480px', margin: '0 auto' }}>
            This feature is not currently enabled for {gym?.name || 'this gym'}.
            Contact your gym administrator for more information.
          </p>
        </div>
      </Container>
    </Section>
  );
};

export default FeatureNotEnabled;
