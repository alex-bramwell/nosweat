import React from 'react';
import styles from './DetailGrid.module.scss';

export interface DetailGridItem {
  label: string;
  value: React.ReactNode;
  status?: 'enabled' | 'disabled' | 'muted';
}

export interface DetailGridProps {
  items: DetailGridItem[];
  className?: string;
}

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
        <span className={statusClassMap[item.status || ''] || styles.detailValue}>
          {item.value}
        </span>
      </div>
    ))}
  </div>
);

export default DetailGrid;
