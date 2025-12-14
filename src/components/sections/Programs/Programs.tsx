import { useState } from 'react';
import { Section, Container, Card, Button } from '../../common';
import { ProgramModal } from '../../ProgramModal';
import { programs } from '../../../data/programs';
import { weeklySchedule } from '../../../data/schedule';
import styles from './Programs.module.scss';

const Programs = () => {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const getLevelStyle = (title: string): string => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('crossfit') && !normalizedTitle.includes('gymnastics')) {
      return styles.levelCrossFit;
    }
    if (normalizedTitle.includes('open gym')) {
      return styles.levelOpenGym;
    }
    if (normalizedTitle.includes('gymnastics') ||
        normalizedTitle.includes('weightlifting') ||
        normalizedTitle.includes('bodybuilding')) {
      return styles.levelSpecialty;
    }
    if (normalizedTitle.includes('comet plus')) {
      return styles.levelCometPlus;
    }

    return styles.level;
  };

  const getScheduleInfo = (title: string): string => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes('crossfit') && !normalizedTitle.includes('gymnastics')) {
      // Count CrossFit classes
      const cfClasses = weeklySchedule.filter(cls =>
        cls.className.toLowerCase().includes('crossfit')
      );
      const uniqueTimes = new Set(cfClasses.map(cls => cls.time));
      return `${uniqueTimes.size} weekly sessions`;
    }

    if (normalizedTitle.includes('open gym')) {
      // Count Open Gym classes
      const ogClasses = weeklySchedule.filter(cls =>
        cls.className.toLowerCase().includes('open gym')
      );
      return `${ogClasses.length} weekly sessions`;
    }

    if (normalizedTitle.includes('gymnastics') ||
        normalizedTitle.includes('weightlifting') ||
        normalizedTitle.includes('bodybuilding')) {
      // Specialty classes (Saturday 10:30 AM)
      return 'Sat 10:30 AM';
    }

    if (normalizedTitle.includes('comet plus')) {
      return 'Unlimited access';
    }

    return 'Check schedule';
  };

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.header}>
          <h2 className={styles.title}>Our Programs</h2>
          <p className={styles.subtitle}>
            Choose the program that fits your goals. All programs include expert coaching
            and a supportive community.
          </p>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.legendBadge} ${styles.levelCrossFit}`}></span>
              <span>CrossFit</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendBadge} ${styles.levelOpenGym}`}></span>
              <span>Open Gym</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendBadge} ${styles.levelSpecialty}`}></span>
              <span>Specialty</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.legendBadge} ${styles.levelCometPlus}`}></span>
              <span>Premium</span>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {programs.map((program) => (
            <Card key={program.id} variant="elevated" hoverable>
              <div className={styles.programCard}>
                <div className={`${styles.level} ${getLevelStyle(program.title)}`}>
                  {getScheduleInfo(program.title)}
                </div>
                <h3 className={styles.programTitle}>{program.title}</h3>
                {program.price && (
                  <div className={styles.pricing}>
                    <span className={styles.price}>£{program.price}</span>
                    <span className={styles.priceUnit}>{program.priceUnit}</span>
                    {program.priceNote && (
                      <span className={styles.priceNote}>{program.priceNote}</span>
                    )}
                  </div>
                )}
                <p className={styles.description} dangerouslySetInnerHTML={{ __html: program.description }} />
                <ul className={styles.features}>
                  {program.features.map((feature, index) => (
                    <li key={index} className={styles.feature}>
                      <span className={styles.checkmark}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" onClick={() => setSelectedProgram(program.id)}>
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>

      {selectedProgram && (
        <ProgramModal
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          programId={selectedProgram}
        />
      )}
    </Section>
  );
};

export default Programs;
