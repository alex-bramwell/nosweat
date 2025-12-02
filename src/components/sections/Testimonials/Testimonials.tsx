import { Section, Container, Card } from '../../common';
import { testimonials } from '../../../data/testimonials';
import styles from './Testimonials.module.scss';

const Testimonials = () => {
  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.header}>
          <h2 className={styles.title}>Member Success Stories</h2>
          <p className={styles.subtitle}>
            Don't just take our word for it. Hear from our amazing community members.
          </p>
        </div>

        <div className={styles.grid}>
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} variant="elevated" padding="large">
              <div className={styles.testimonial}>
                <div className={styles.quote}>"{testimonial.quote}"</div>
                <div className={styles.author}>
                  <div className={styles.authorInfo}>
                    <div className={styles.name}>{testimonial.name}</div>
                    {testimonial.program && (
                      <div className={styles.program}>{testimonial.program}</div>
                    )}
                    {testimonial.memberSince && (
                      <div className={styles.memberSince}>
                        Member since {testimonial.memberSince}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
};

export default Testimonials;
