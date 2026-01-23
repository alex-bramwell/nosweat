import React from 'react';
import styles from './Charts.module.scss';
import type { TimeDomainStats } from '../../../types';
import { InfoTooltip } from '../../common/InfoTooltip';

interface TimeDomainChartProps {
    data: TimeDomainStats[];
}

export const TimeDomainChart: React.FC<TimeDomainChartProps> = ({ data }) => {
    // Order: Sprint -> Short -> Medium -> Long
    const orderedData = [
        data.find(d => d.domain === 'Sprint') || { domain: 'Sprint', count: 0, percentage: 0 },
        data.find(d => d.domain === 'Short') || { domain: 'Short', count: 0, percentage: 0 },
        data.find(d => d.domain === 'Medium') || { domain: 'Medium', count: 0, percentage: 0 },
        data.find(d => d.domain === 'Long') || { domain: 'Long', count: 0, percentage: 0 }
    ];

    const maxCount = Math.max(...orderedData.map(d => d.count), 1);

    const getBarColor = (domain: string) => {
        switch (domain) {
            case 'Sprint': return '#ef4444'; // Red - Anaerobic
            case 'Short': return '#f97316';  // Orange - High Intensity
            case 'Medium': return '#eab308'; // Yellow - Standard Metcon
            case 'Long': return '#10b981';   // Green - Endurance
            default: return '#64748b';
        }
    };

    const getDomainLabel = (domain: string) => {
        switch (domain) {
            case 'Sprint': return '< 5m';
            case 'Short': return '5-10m';
            case 'Medium': return '10-20m';
            case 'Long': return '20m+';
            default: return domain;
        }
    };

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h4 className={styles.chartTitle}>Time Domains</h4>
                <InfoTooltip content="Distribution of workout durations. Sprint (<5m), Short (5-10m), Medium (10-20m), and Long (20m+). Varying time domains ensures fitness across all energy systems." />
            </div>
            <div className={styles.chartContentRow} style={{ alignItems: 'flex-end', height: '100px', gap: '8px' }}>
                {orderedData.map((item) => {
                    const height = (item.count / maxCount) * 100;
                    return (
                        <div key={item.domain} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                                <div
                                    style={{
                                        width: '100%',
                                        height: `${height}%`,
                                        backgroundColor: getBarColor(item.domain as string),
                                        borderRadius: '4px 4px 0 0',
                                        minHeight: item.count > 0 ? '4px' : '0',
                                        transition: 'height 0.3s ease'
                                    }}
                                    title={`${item.domain}: ${item.count} workouts`}
                                />
                                {item.count > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '4px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.65rem',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        {item.count}
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>
                                {getDomainLabel(item.domain as string)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
