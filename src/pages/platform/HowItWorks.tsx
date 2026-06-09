import { useRef, useEffect, useState } from 'react';
import styles from './PlatformHome.module.scss';

const STEPS = [
  { number: 1, title: 'Sign up', description: 'Create your account in seconds. No credit card required to start.' },
  { number: 2, title: 'Customise your brand', description: 'Choose your colours, upload your logo, set your theme. Make it yours.' },
  { number: 3, title: 'Choose your features', description: 'Toggle on the features you need. Everything is included in your plan.' },
  { number: 4, title: 'Go live', description: 'Your gym is online instantly. No technical skills needed.' },
];

const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const connectorRef = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  const gsapLoaded = useRef(false);

  // CSS fallback: IntersectionObserver triggers .visible class
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // GSAP enhancement: runs on top of CSS fallback if available
  useEffect(() => {
    if (!visible || gsapLoaded.current) return;

    let ctx: { revert: () => void } | null = null;

    const initGsap = async () => {
      try {
        // Dynamic import hidden from Vite's static analysis so the app
        // works even when gsap isn't installed (CSS fallback kicks in)
        const gsapId = 'gsap';
        const gsapModule = await import(/* @vite-ignore */ gsapId);
        const scrollModule = await import(/* @vite-ignore */ `${gsapId}/ScrollTrigger`);
        const gsap = gsapModule.default || gsapModule.gsap;
        const ScrollTrigger = scrollModule.default || scrollModule.ScrollTrigger;

        if (!gsap || !ScrollTrigger || !sectionRef.current) return;

        gsap.registerPlugin(ScrollTrigger);
        gsapLoaded.current = true;

        ctx = gsap.context(() => {
          const section = sectionRef.current!;
          const steps = section.querySelectorAll(`.${styles.step}`);
          const connector = connectorRef.current;

          // Reset CSS fallback opacity so GSAP can control it
          gsap.set(steps, { opacity: 0, y: 40 });

          // Connector line draw
          if (connector) {
            const line = connector.querySelector('line');
            if (line) {
              const length = Math.sqrt(
                Math.pow(parseFloat(line.getAttribute('x2') || '0') - parseFloat(line.getAttribute('x1') || '0'), 2) +
                Math.pow(parseFloat(line.getAttribute('y2') || '0') - parseFloat(line.getAttribute('y1') || '0'), 2),
              );
              gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
              gsap.to(line, {
                strokeDashoffset: 0,
                duration: 1.8,
                ease: 'power2.inOut',
                scrollTrigger: {
                  trigger: section,
                  start: 'top 70%',
                  toggleActions: 'play none none none',
                },
              });
            }
          }

          // Stagger in each step
          steps.forEach((step, i) => {
            const number = step.querySelector(`.${styles.stepNumber}`);
            const title = step.querySelector(`.${styles.stepTitle}`);
            const desc = step.querySelector(`.${styles.stepDescription}`);

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
              delay: i * 0.25,
            });

            // Step container fades in
            tl.to(step, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });

            // Number pops with scale
            if (number) {
              tl.from(number, { scale: 0, rotation: -180, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.3');
            }

            // Title slides up
            if (title) {
              tl.from(title, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' }, '-=0.2');
            }

            // Description fades in
            if (desc) {
              tl.from(desc, { opacity: 0, y: 15, duration: 0.4, ease: 'power2.out' }, '-=0.15');
            }
          });
        }, sectionRef);
      } catch {
        // GSAP not available - CSS fallback handles everything
      }
    };

    initGsap();

    return () => {
      ctx?.revert();
    };
  }, [visible]);

  return (
    <section
      className={`${styles.howItWorks} ${visible ? styles.howItWorksVisible : ''}`}
      ref={sectionRef}
    >
      <div className={styles.platformHomeInner}>
        <h2 className={styles.sectionTitle}>How It Works</h2>

        <div className={styles.stepsGrid}>
          {/* Connector line between step numbers */}
          <svg
            className={styles.stepsConnector}
            ref={connectorRef}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="connectorGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <line
              x1="12.5%"
              y1="50%"
              x2="87.5%"
              y2="50%"
              stroke="url(#connectorGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {STEPS.map((step) => (
            <div key={step.number} className={styles.step}>
              <div className={styles.stepNumber}>{step.number}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
