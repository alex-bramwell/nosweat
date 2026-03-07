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
    <Section spacing="large" background="surface">
      <Container>
        <div className={styles.stats}>
          {displayStats.map((stat) => (
            <div key={stat.id} className={styles.stat}>
              <div className={styles.value}>
                {stat.value}
                {stat.suffix && <span className={styles.suffix}>{stat.suffix}</span>}
              </div>
              <div className={styles.label}>{stat.label}</div>
              <Button variant="outline" as="a" href="/about" className={styles.statCta}>
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
