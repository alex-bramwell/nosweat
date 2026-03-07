import { useRef, useCallback } from 'react';
import styles from './NumberInput.module.scss';

export interface NumberInputProps {
  id?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function NumberInput({
  id,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  placeholder,
  className,
  disabled = false,
  label,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const increment = useCallback(() => {
    const currentValue = value ?? 0;
    const newValue = Math.min(currentValue + step, max);
    onChange(newValue);
  }, [value, step, max, onChange]);

  const decrement = useCallback(() => {
    const currentValue = value ?? 0;
    const newValue = Math.max(currentValue - step, min);
    onChange(newValue === 0 ? undefined : newValue);
  }, [value, step, min, onChange]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(undefined);
    } else {
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal)) {
        onChange(Math.min(Math.max(numVal, min), max));
      }
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
    <div className={`${styles.numberInput} ${className || ''}`}>
      <button
        type="button"
        className={styles.stepButton}
        onMouseDown={() => !disabled && startHold(decrement)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => !disabled && startHold(decrement)}
        onTouchEnd={stopHold}
        disabled={disabled || (value !== undefined && value <= min)}
        aria-label="Decrease value"
        tabIndex={-1}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <div className={styles.numberInputWrapper}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value ?? ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.numberTextInput}
        />
        {label && <span className={styles.numberUnitLabel}>{label}</span>}
      </div>

      <button
        type="button"
        className={styles.stepButton}
        onMouseDown={() => !disabled && startHold(increment)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => !disabled && startHold(increment)}
        onTouchEnd={stopHold}
        disabled={disabled || (value !== undefined && value >= max)}
        aria-label="Increase value"
        tabIndex={-1}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export default NumberInput;
