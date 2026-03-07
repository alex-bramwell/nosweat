import { Section, Container, Button, EmptyStatePreview } from '../../common';
import { useTenant } from '../../../contexts/TenantContext';
import { useIsBuilder } from '../../../contexts/BrandingOverrideContext';
import { SAMPLE_STATS } from '../../../data/sampleContent';
import styles from './Stats.module.scss';

const Stats = () => {
  const { stats } = useTenant();
  const isBuilder = useIsBuilder();

  const displayStats = stats.length > 0 ? stats : (isBuilder ? SAMPLE_STATS : []);
  const isSample = stats.length === 0 && isBuilder;

  if (displayStats.length === 0) {
    return null;
  }

  const content = (
    <Section spacing="relaxed" background="surface">
      <Container>
        <div className={styles.statsGrid}>
          {displayStats.map((stat) => (
            <div key={stat.id} className={styles.statItem}>
              <div className={styles.statValue}>
                {stat.value}
                {stat.suffix && <span className={styles.statSuffix}>{stat.suffix}</span>}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
              <Button variant="outline" as="a" href="/about" className={styles.statAction}>
                Learn Our Story
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );

  if (isSample) {
    return (
      <EmptyStatePreview
        title="Gym Stats"
        description="Highlight your gym's key numbers — weekly classes, certified coaches, active members. Add stats from your dashboard."
      >
        {content}
      </EmptyStatePreview>
    );
  }

  return content;
};

export default Stats;
