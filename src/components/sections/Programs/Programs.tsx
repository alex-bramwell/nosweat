import { Section, Container, Card, Button } from '../../common';
import { programs } from '../../../data/programs';
import styles from './Programs.module.scss';

const Programs = () => {
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
                <div className={styles.level}>{program.level}</div>
                <h3 className={styles.programTitle}>{program.title}</h3>
                <p className={styles.description}>{program.description}</p>
                <ul className={styles.features}>
                  {program.features.map((feature, index) => (
                    <li key={index} className={styles.feature}>
                      <span className={styles.checkmark}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="primary" as="a" href="/programs">
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default Programs;
