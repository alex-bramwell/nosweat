import React from 'react';
import styles from './Charts.module.scss';
import { InfoTooltip } from '../../common/InfoTooltip';

interface HeavyDayTrackerProps {
    count: number;
    periodLabel: string; // e.g., "this month"
}

export const HeavyDayTracker: React.FC<HeavyDayTrackerProps> = ({ count, periodLabel }) => {
    // Example target - could be dynamic later
    const target = 4;
    const progress = Math.min((count / target) * 100, 100);

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h4 className={styles.chartTitle}>Heavy Days</h4>
                <InfoTooltip content="Number of days focused on heavy lifting (Strength/Power). Aim for at least 1 heavy day per week to maintain strength alongside conditioning." />
            </div>
            <div className={styles.statCard}>
                <div className={`${styles.statValue} ${styles.heavy}`}>{count}</div>
                <div className={styles.statTarget}>Target: {target} / {periodLabel}</div>

                <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};
