import { Section, Container, Card, Button, EmptyStatePreview } from '../../common';
import { useTenant, useGymPath } from '../../../contexts/TenantContext';
import { useIsBuilder } from '../../../contexts/BrandingOverrideContext';
import { formatPriceShort } from '../../../utils/payment';
import type { GymMembership } from '../../../types/tenant';
import styles from './Memberships.module.scss';

const periodLabel = (billingPeriod: string): string => (billingPeriod === 'yearly' ? '/year' : '/month');

// Shown in the builder when a gym hasn't created any plans yet, so owners can
// see what the section looks like before adding their own.
const SAMPLE_MEMBERSHIPS: GymMembership[] = [
  {
    id: 'sample-1', gym_id: '', slug: 'unlimited', display_name: 'Unlimited',
    description: 'Full access to every class plus open gym whenever you like.',
    price_pence: 6900, billing_period: 'monthly',
    features: ['Unlimited access to all classes', 'Open gym whenever you like', 'Free entry to community events'],
    stripe_price_id: null, stripe_product_id: null, sort_order: 0, is_active: true,
  },
  {
    id: 'sample-2', gym_id: '', slug: 'premium', display_name: 'Premium',
    description: 'Everything in Unlimited, with personal coaching and priority booking.',
    price_pence: 8900, billing_period: 'monthly',
    features: ['Everything in Unlimited', 'Monthly 1:1 coaching session', 'Priority class booking'],
    stripe_price_id: null, stripe_product_id: null, sort_order: 1, is_active: true,
  },
  {
    id: 'sample-3', gym_id: '', slug: 'open-gym', display_name: 'Open Gym',
    description: 'Train on your own schedule during staffed open gym hours.',
    price_pence: 4000, billing_period: 'monthly',
    features: ['Open gym access during staffed hours', 'Use of all equipment'],
    stripe_price_id: null, stripe_product_id: null, sort_order: 2, is_active: true,
  },
];

const Memberships = () => {
  const { memberships } = useTenant();
  const isBuilder = useIsBuilder();
  const gymPath = useGymPath();

  const active = memberships.filter((m) => m.is_active && (m.price_pence ?? 0) > 0);
  const display = active.length > 0 ? active : (isBuilder ? SAMPLE_MEMBERSHIPS : []);

  // Nothing to show on the live site until the gym adds priced plans.
  if (display.length === 0) return null;

  const content = (
    <Section spacing="relaxed" background="surface" className={styles.membershipsSection}>
      <Container>
        <div className={styles.membershipsHeader}>
          <h2 className={styles.membershipsTitle}>Memberships</h2>
          <p className={styles.membershipsSubtitle}>
            Join on a plan that suits you. Cancel anytime - your membership runs to the end of the period you've paid for.
          </p>
        </div>

        <div className={styles.membershipsGrid}>
          {display.map((plan) => (
            <Card key={plan.id} variant="outlined" className={styles.planCard}>
              <div className={styles.planTop}>
                <h3 className={styles.planName}>{plan.display_name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.planAmount}>{formatPriceShort(plan.price_pence ?? 0)}</span>
                  <span className={styles.planPeriod}>{periodLabel(plan.billing_period)}</span>
                </div>
                {plan.description && <p className={styles.planDescription}>{plan.description}</p>}
              </div>

              {plan.features.length > 0 && (
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature, i) => (
                    <li key={i} className={styles.planFeature}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.planAction}>
                {isBuilder ? (
                  <Button variant="primary" fullWidth disabled>Join</Button>
                ) : (
                  <Button variant="primary" fullWidth as="a" href={gymPath(`/dashboard?plan=${plan.id}`)}>
                    Join {plan.display_name}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );

  if (active.length === 0 && isBuilder) {
    return (
      <EmptyStatePreview
        title="Memberships"
        description="Show your membership plans with pricing and features so visitors can join. Add your plans in the Pricing & Plans tab to replace this preview."
      >
        {content}
      </EmptyStatePreview>
    );
  }

  return content;
};

export default Memberships;
