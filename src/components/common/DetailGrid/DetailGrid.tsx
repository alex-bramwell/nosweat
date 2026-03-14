import React, { useState, useCallback } from 'react';
import styles from './DetailGrid.module.scss';

export interface DetailGridItem {
  label: string;
  value: React.ReactNode;
  status?: 'enabled' | 'disabled' | 'muted';
  /** If provided, value becomes a clickable link */
  href?: string;
  /** Show a copy button that copies this string */
  copyValue?: string;
}

export interface DetailGridProps {
  items: DetailGridItem[];
  className?: string;
}

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ''}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
};

const statusClassMap: Record<string, string> = {
  enabled: styles.valueEnabled,
  disabled: styles.valueDisabled,
  muted: styles.valueMuted,
};

const DetailGrid: React.FC<DetailGridProps> = ({ items, className }) => (
  <div className={`${styles.detailGrid} ${className || ''}`}>
    {items.map((item) => (
      <div key={item.label} className={styles.detailItem}>
        <span className={styles.detailLabel}>{item.label}</span>
        {item.href ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${statusClassMap[item.status || ''] || styles.detailValue} ${styles.detailLink}`}
          >
            {item.value}
          </a>
        ) : (
          <span className={statusClassMap[item.status || ''] || styles.detailValue}>
            {item.value}
          </span>
        )}
        {item.copyValue && <CopyButton value={item.copyValue} />}
      </div>
    ))}
  </div>
);

export default DetailGrid;
