import { useRef, useCallback, useEffect, useState } from 'react';
import styles from './DurationInput.module.scss';

export interface DurationInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function DurationInput({
  id,
  value,
  onChange,
  placeholder = '0',
  className,
  disabled = false,
  min = 0,
  max = 999,
}: DurationInputProps) {
  // Parse the value into minutes
  const parseValue = (val: string): number => {
    if (!val) return 0;

    // Handle MM:SS format - just take minutes
    if (val.includes(':')) {
      const [minutes] = val.split(':').map(v => parseInt(v, 10) || 0);
      return minutes;
    }

    // Handle "X min" format
    const minMatch = val.match(/(\d+)\s*min/i);
    if (minMatch) {
      return parseInt(minMatch[1], 10);
    }

    // Try to parse as just minutes
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      return num;
    }

    return 0;
  };

  const [minutes, setMinutes] = useState(parseValue(value));

  // Update internal state when value prop changes
  useEffect(() => {
    setMinutes(parseValue(value));
  }, [value]);

  const updateValue = useCallback((newMinutes: number) => {
    const clamped = Math.max(min, Math.min(max, newMinutes));
    setMinutes(clamped);

    if (clamped === 0) {
      onChange('');
    } else {
      onChange(`${clamped} min`);
    }
  }, [onChange, min, max]);

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = (action: () => void) => {
    action();
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, 100);
    }, 400);
  };

  const stopHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const increment = () => updateValue(minutes + 1);
  const decrement = () => updateValue(minutes - 1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) {
      updateValue(val);
    } else if (e.target.value === '') {
      updateValue(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
  };

  return (
    <div className={`${styles.durationInput} ${className || ''}`}>
      <button
        type="button"
        className={styles.stepButton}
        onMouseDown={() => !disabled && startHold(decrement)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => !disabled && startHold(decrement)}
        onTouchEnd={stopHold}
        disabled={disabled || minutes <= min}
        aria-label="Decrease minutes"
        tabIndex={-1}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <div className={styles.durationInputWrapper}>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={minutes === 0 ? '' : minutes}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.durationTextInput}
        />
        <span className={styles.durationUnitLabel}>min</span>
      </div>

      <button
        type="button"
        className={styles.stepButton}
        onMouseDown={() => !disabled && startHold(increment)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => !disabled && startHold(increment)}
        onTouchEnd={stopHold}
        disabled={disabled || minutes >= max}
        aria-label="Increase minutes"
        tabIndex={-1}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export default DurationInput;
