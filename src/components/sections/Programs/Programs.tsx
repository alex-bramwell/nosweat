import { useState } from 'react';
import { Section, Container, Card, Button, EmptyStatePreview } from '../../common';
import { ProgramModal } from '../../ProgramModal';
import { useTenant } from '../../../contexts/TenantContext';
import { useIsBuilder } from '../../../contexts/BrandingOverrideContext';
import { SAMPLE_PROGRAMS } from '../../../data/sampleContent';
import styles from './Programs.module.scss';

const Programs = () => {
  const { programs, schedule } = useTenant();
  const isBuilder = useIsBuilder();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Map program level to a generic style class
  const getLevelStyle = (level: string | null): string => {
    switch (level) {
      case 'all':
        return styles.programLevelCrossFit;
      case 'beginner':
        return styles.programLevelOpenGym;
      case 'intermediate':
        return styles.programLevelSpecialty;
      case 'advanced':
        return styles.programLevelAdvanced;
      default:
        return styles.programLevel;
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

  const displayPrograms = programs.length > 0 ? programs : (isBuilder ? SAMPLE_PROGRAMS : []);
  const isSample = programs.length === 0 && isBuilder;

  if (displayPrograms.length === 0) {
    return null;
  }

  const content = (
    <Section spacing="relaxed" background="default">
      <Container>
        <div className={styles.programsHeader}>
          <h2 className={styles.programsTitle}>Our Programs</h2>
          <p className={styles.programsSubtitle}>
            Choose the program that fits your goals. All programs include expert coaching
            and a supportive community.
          </p>
        </div>

        <div className={styles.programsGrid}>
          {displayPrograms.map((program) => (
            <Card key={program.id} variant="raised" hoverable>
              <div className={styles.programCard}>
                <div className={`${styles.programLevel} ${getLevelStyle(program.level)}`}>
                  {getScheduleInfo(program)}
                </div>
                <h3 className={styles.programTitle}>{program.title}</h3>
                {program.price_pence != null && (
                  <div className={styles.programPricing}>
                    <span className={styles.programPrice}>
                      £{(program.price_pence / 100).toFixed(program.price_pence % 100 === 0 ? 0 : 2)}
                    </span>
                    {program.price_unit && (
                      <span className={styles.programPriceUnit}>{program.price_unit}</span>
                    )}
                    {program.price_note && (
                      <span className={styles.programPriceNote}>{program.price_note}</span>
                    )}
                  </div>
                )}
                {program.description && (
                  <p className={styles.programDescription} dangerouslySetInnerHTML={{ __html: program.description }} />
                )}
                <ul className={styles.programFeatures}>
                  {program.features.map((feature, index) => (
                    <li key={index} className={styles.programFeature}>
                      <span className={styles.programCheckmark}>✓</span>
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

  if (isSample) {
    return (
      <EmptyStatePreview
        title="Programs & Memberships"
        description="Showcase your gym's programs with pricing, features, and class frequency. Add programs from your dashboard to replace this preview."
      >
        {content}
      </EmptyStatePreview>
    );
  }

  return content;
};

export default Programs;
