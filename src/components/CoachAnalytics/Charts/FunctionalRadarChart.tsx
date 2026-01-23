import React from 'react';
import styles from './Charts.module.scss';
import type { FunctionalPattern } from '../../../types';
import { InfoTooltip } from '../../common/InfoTooltip';

interface FunctionalRadarChartProps {
    data: {
        pattern: FunctionalPattern;
        count: number;
        percentage: number;
    }[];
}

export const FunctionalRadarChart: React.FC<FunctionalRadarChartProps> = ({ data }) => {
    // Define axes order
    const axes = ['squat', 'hinge', 'push', 'pull', 'lunge', 'core'];
    const maxVal = Math.max(...data.map(d => d.count), 5); // Minimum scale of 5

    // Calculate points
    const radius = 40;
    const center = 50;

    const getPoint = (value: number, index: number, total: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const distance = (value / maxVal) * radius;
        const x = center + Math.cos(angle) * distance;
        const y = center + Math.sin(angle) * distance;
        return { x, y };
    };

    const points = axes.map((axis, i) => {
        const item = data.find(d => d.pattern === axis) || { count: 0 };
        const { x, y } = getPoint(item.count, i, axes.length);
        return `${x},${y}`;
    }).join(' ');

    // Background Grid (Web)
    const gridLevels = [0.25, 0.5, 0.75, 1];

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h4 className={styles.chartTitle}>Functional Patterns</h4>
                <InfoTooltip content="Analysis of fundamental movement patterns. A well-rounded program should include a mix of Squat, Hinge, Push, Pull, Lunge, and Core movements." />
            </div>
            <div className={styles.radarChart}>
                <svg viewBox="0 0 100 100" className={styles.radarSvg}>
                    {/* Grid */}
                    {gridLevels.map(level => (
                        <polygon
                            key={level}
                            points={axes.map((_, i) => {
                                const { x, y } = getPoint(maxVal * level, i, axes.length);
                                return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="0.5"
                        />
                    ))}

                    {/* Axes Lines */}
                    {axes.map((axis, i) => {
                        const { x, y } = getPoint(maxVal, i, axes.length);
                        return (
                            <line
                                key={axis}
                                x1={center}
                                y1={center}
                                x2={x}
                                y2={y}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="0.5"
                            />
                        );
                    })}

                    {/* Data Polygon */}
                    <polygon
                        points={points}
                        fill="rgba(249, 115, 22, 0.2)" // brand orange transparent
                        stroke="#f97316"
                        strokeWidth="1.5"
                    />

                    {/* Labels */}
                    {axes.map((axis, i) => {
                        // Push label out slightly further
                        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                        const distance = radius + 12; // Label padding
                        const x = center + Math.cos(angle) * distance;
                        const y = center + Math.sin(angle) * distance;

                        return (
                            <text
                                key={axis}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dy=".3em"
                                fill="var(--color-muted)"
                                fontSize="8"
                                style={{ textTransform: 'capitalize' }}
                            >
                                {axis}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
