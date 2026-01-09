import React, { useState, useRef, useEffect } from 'react';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      ref={selectRef}
      className={`${styles.select} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''} ${className}`}
    >
      <button
        type="button"
        className={styles.selectButton}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.selectValue}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={styles.selectChevron}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
            <path fill="rgba(255, 255, 255, 0.7)" d="M10 12L6 8h8z" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={styles.selectDropdown} role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.selectOption} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
