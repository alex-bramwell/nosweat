import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, CloseIcon } from '../common/Icons';
import type { MovementSelection } from '../../types';
import styles from './WorkoutSummaryDrawer.module.scss';

interface SectionMovements {
  warmup: MovementSelection[];
  strength: MovementSelection[];
  metcon: MovementSelection[];
  cooldown: MovementSelection[];
}

interface WorkoutSummaryDrawerProps {
  sectionMovements: SectionMovements;
  onRemoveMovement: (section: keyof SectionMovements, index: number) => void;
}

export const WorkoutSummaryDrawer: React.FC<WorkoutSummaryDrawerProps> = ({
  sectionMovements,
  onRemoveMovement
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalMovements =
    sectionMovements.warmup.length +
    sectionMovements.strength.length +
    sectionMovements.metcon.length +
    sectionMovements.cooldown.length;

  // Don't show if no movements
  if (totalMovements === 0) {
    return null;
  }

  const formatMovementDisplay = (selection: MovementSelection): string => {
    const parts: string[] = [];
    if (selection.reps) parts.push(`${selection.reps} reps`);
    if (selection.weight) parts.push(selection.weight);
    if (selection.distance) parts.push(selection.distance);
    if (selection.duration) parts.push(selection.duration);
    return parts.length > 0 ? parts.join(' · ') : '';
  };

  const renderSection = (
    title: string,
    movements: MovementSelection[],
    sectionKey: keyof SectionMovements
  ) => {
    if (movements.length === 0) return null;

    return (
      <div className={styles.workoutDrawerSection}>
        <h4 className={styles.workoutDrawerSectionTitle}>{title}</h4>
        <ul className={styles.movementList}>
          {movements.map((movement, index) => (
            <li key={index} className={styles.movementItem}>
              <div className={styles.movementInfo}>
                <span className={styles.movementName}>{movement.movement.name}</span>
                <span className={styles.movementDetails}>
                  {formatMovementDisplay(movement)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMovement(sectionKey, index)}
                className={styles.removeButton}
                aria-label={`Remove ${movement.movement.name}`}
              >
                <CloseIcon size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className={`${styles.drawer} ${isExpanded ? styles.expanded : ''}`}>
      <button
        type="button"
        className={styles.handle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse workout summary' : 'Expand workout summary'}
      >
        <div className={styles.handleContent}>
          <span className={styles.handleIcon}>
            {isExpanded ? <ChevronDownIcon size={20} /> : <ChevronUpIcon size={20} />}
          </span>
          <span className={styles.handleText}>
            Workout Summary
          </span>
          <span className={styles.workoutDrawerMovementCount}>{totalMovements}</span>
        </div>
      </button>

      {isExpanded && (
        <div className={styles.workoutDrawerContent}>
          {renderSection('Warmup', sectionMovements.warmup, 'warmup')}
          {renderSection('Strength', sectionMovements.strength, 'strength')}
          {renderSection('MetCon', sectionMovements.metcon, 'metcon')}
          {renderSection('Cooldown', sectionMovements.cooldown, 'cooldown')}
        </div>
      )}
    </div>
  );
};
