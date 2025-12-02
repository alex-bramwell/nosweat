import { Section, Container } from '../../common';
import { stats } from '../../../data/stats';
import styles from './Stats.module.scss';

const Stats = () => {
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
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default Stats;
