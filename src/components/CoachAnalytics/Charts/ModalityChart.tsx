import React from 'react';
import styles from './Charts.module.scss';
import { InfoTooltip } from '../../common/InfoTooltip';

interface ModalityChartProps {
    data: {
        modality: 'Monostructural' | 'Gymnastics' | 'Weightlifting';
        percentage: number;
        count: number;
    }[];
}

const COLORS = {
    Monostructural: '#3b82f6', // blue
    Gymnastics: '#10b981',    // green
    Weightlifting: '#f97316'  // orange
};

export const ModalityChart: React.FC<ModalityChartProps> = ({ data }) => {
    // Calculate SVG paths (Donut)
    // Simple approximation: using stroke-dasharray on circles

    // Sort for consistency
    const sortedData = [...data].sort((a, b) => {
        const order = { Monostructural: 1, Gymnastics: 2, Weightlifting: 3 };
        return order[a.modality] - order[b.modality];
    });

    const total = sortedData.reduce((sum, item) => sum + item.count, 0);
    let accumulatedPercent = 0;

    // Render segments as SVG circles with stroke-dasharray
    // Circumference = 2 * PI * r
    const r = 40;
    const c = 2 * Math.PI * r;

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h4 className={styles.chartTitle}>Modality Distribution</h4>
                <InfoTooltip content="Balance between Monostructural (Cardio), Gymnastics (Bodyweight), and Weightlifting (External Load). A balanced program typically aims for an even 1/3 split over time." />
            </div>
            <div className={styles.chartContentRow}>
                <div className={styles.donutChart}>
                    <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                        {sortedData.map((item) => {
                            if (item.count === 0) return null;

                            const pct = item.count / total;
                            const dashArray = `${pct * c} ${c}`;
                            const offset = -accumulatedPercent * c;

                            accumulatedPercent += pct;

                            return (
                                <circle
                                    key={item.modality}
                                    cx="50"
                                    cy="50"
                                    r={r}
                                    fill="transparent"
                                    stroke={COLORS[item.modality]}
                                    strokeWidth="12"
                                    strokeDasharray={dashArray}
                                    strokeDashoffset={offset}
                                    transform="rotate(-90 50 50)"
                                    className={styles.segment}
                                />
                            );
                        })}
                        {/* Text in center */}
                        <text x="50" y="50" textAnchor="middle" dy=".3em" fill="white" fontSize="14" fontWeight="600">
                            {total}
                        </text>
                    </svg>
                </div>
                <div className={styles.legend}>
                    {sortedData.map(item => (
                        <div key={item.modality} className={styles.legendItem}>
                            <span className={styles.dot} style={{ backgroundColor: COLORS[item.modality] }} />
                            <span className={styles.label}>{item.modality.slice(0, 1)}</span>
                            <span className={styles.percent}>{item.percentage.toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
