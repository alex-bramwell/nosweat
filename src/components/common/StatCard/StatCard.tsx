import { useRef, useEffect, useState } from 'react';
import styles from './StatCard.module.scss';

export interface StatCardProps {
  value: number | string;
  suffix?: string;
  label: string;
  gradient?: 'accent' | 'secondary';
  animate?: boolean;
  className?: string;
}

const StatCard = ({
  value,
  suffix = '',
  label,
  gradient = 'accent',
  animate = true,
  className = '',
}: StatCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(
    animate && typeof value === 'number' ? '0' : String(value)
  );

  useEffect(() => {
    if (!animate || typeof value !== 'number') {
      setDisplayValue(String(value));
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          const target = value;
          const duration = 1000;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out curve
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(String(Math.round(eased * target)));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, animate]);

  const classes = [styles.statCard, className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes}>
      <div className={`${styles.statValue} ${styles[gradient]}`}>
        {displayValue}
        {suffix && <span className={styles.statSuffix}>{suffix}</span>}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
};

export default StatCard;
