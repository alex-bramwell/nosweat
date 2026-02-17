import { useState } from 'react';
import { Section, Container, Card, Button } from '../../common';
import { ProgramModal } from '../../ProgramModal';
import { useTenant } from '../../../contexts/TenantContext';
import styles from './Programs.module.scss';

const Programs = () => {
  const { programs, schedule } = useTenant();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Map program level to a generic style class
  const getLevelStyle = (level: string | null): string => {
    switch (level) {
      case 'all':
        return styles.levelCrossFit;
      case 'beginner':
        return styles.levelOpenGym;
      case 'intermediate':
        return styles.levelSpecialty;
      case 'advanced':
        return styles.levelAdvanced;
      default:
        return styles.level;
    }
  };

  const getScheduleInfo = (program: typeof programs[0]): string => {
    // If the program has schedule_info set, use it
    if (program.schedule_info) return program.schedule_info;

    // Otherwise try to count matching schedule entries
    const matchingClasses = schedule.filter(cls =>
      cls.class_name.toLowerCase().includes(program.title.toLowerCase())
    );
    if (matchingClasses.length > 0) {
      return `${matchingClasses.length} weekly sessions`;
    }

    return 'Check schedule';
  };

  if (programs.length === 0) {
    return null;
  }

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.header}>
          <h2 className={styles.title}>Our Programs</h2>
          <p className={styles.subtitle}>
            Choose the program that fits your goals. All programs include expert coaching
            and a supportive community.
          </p>
        </div>

        <div className={styles.grid}>
          {programs.map((program) => (
            <Card key={program.id} variant="elevated" hoverable>
              <div className={styles.programCard}>
                <div className={`${styles.level} ${getLevelStyle(program.level)}`}>
                  {getScheduleInfo(program)}
                </div>
                <h3 className={styles.programTitle}>{program.title}</h3>
                {program.price_pence != null && (
                  <div className={styles.pricing}>
                    <span className={styles.price}>
                      £{(program.price_pence / 100).toFixed(program.price_pence % 100 === 0 ? 0 : 2)}
                    </span>
                    {program.price_unit && (
                      <span className={styles.priceUnit}>{program.price_unit}</span>
                    )}
                    {program.price_note && (
                      <span className={styles.priceNote}>{program.price_note}</span>
                    )}
                  </div>
                )}
                {program.description && (
                  <p className={styles.description} dangerouslySetInnerHTML={{ __html: program.description }} />
                )}
                <ul className={styles.features}>
                  {program.features.map((feature, index) => (
                    <li key={index} className={styles.feature}>
                      <span className={styles.checkmark}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" onClick={() => setSelectedProgram(program.slug)}>
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
