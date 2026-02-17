import { Section, Container, Button } from '../../common';
import { useTenant } from '../../../contexts/TenantContext';
import styles from './Stats.module.scss';

const Stats = () => {
  const { stats } = useTenant();
  return (
    <Section spacing="large" background="surface">
      <Container>
        <div className={styles.stats}>
          {stats.map((stat) => (
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
};

export default Stats;
