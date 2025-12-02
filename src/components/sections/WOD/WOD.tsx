import { Section, Container, Card } from '../../common';
import { todaysWOD } from '../../../data/wod';
import styles from './WOD.module.scss';

const WOD = () => {
  const wodTypeLabels = {
    amrap: 'AMRAP',
    fortime: 'For Time',
    emom: 'EMOM',
    strength: 'Strength',
    endurance: 'Endurance',
  };

  return (
    <Section spacing="large" background="surface">
      <Container size="small">
        <div className={styles.header}>
          <h2 className={styles.title}>Workout of the Day</h2>
          <p className={styles.date}>
            {new Date(todaysWOD.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <Card variant="elevated" padding="large">
          <div className={styles.wod}>
            <div className={styles.wodHeader}>
              <h3 className={styles.wodTitle}>{todaysWOD.title}</h3>
              <span className={styles.wodType}>{wodTypeLabels[todaysWOD.type]}</span>
            </div>

            <p className={styles.description}>{todaysWOD.description}</p>

            <div className={styles.movements}>
              {todaysWOD.movements.map((movement, index) => (
                <div key={index} className={styles.movement}>
                  <span className={styles.bullet}>•</span>
                  <span>{movement}</span>
                </div>
              ))}
            </div>

            {todaysWOD.duration && (
              <div className={styles.meta}>
                <span className={styles.metaLabel}>Time Cap:</span>
                <span className={styles.metaValue}>{todaysWOD.duration}</span>
              </div>
            )}

            <div className={styles.footer}>
              <p className={styles.note}>
                Scale as needed. All movements can be modified to match your fitness level.
                Ask your coach for scaling options!
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </Section>
  );
};

export default WOD;
