import React, { useState, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '../common/Icons';
import { Button } from '../common';
import type { WorkoutDB } from '../../types';
import type { BookingWithUser } from '../../services/wodBookingService';
import styles from './WorkoutSummaryDrawer.module.scss';
import viewStyles from './WorkoutViewDrawer.module.scss';

interface WorkoutViewDrawerProps {
  workout: WorkoutDB;
  bookings?: BookingWithUser[];
  maxCapacity?: number;
  canEdit?: boolean;
  onEdit?: () => void;
  onClose?: () => void;
}

export const WorkoutViewDrawer: React.FC<WorkoutViewDrawerProps> = ({
  workout,
  bookings = [],
  maxCapacity = 16,
  canEdit = false,
  onEdit,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand when workout changes
  useEffect(() => {
    setIsExpanded(true);
  }, [workout.id]);

  const totalMovements =
    (workout.warmup?.length || 0) +
    (workout.strength?.length || 0) +
    (workout.metcon?.length || 0) +
    (workout.cooldown?.length || 0);

  const renderSection = (title: string, movements: string[] | undefined) => {
    if (!movements || movements.length === 0) return null;

    return (
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{title}</h4>
        <ul className={styles.movementList}>
          {movements.map((movement, index) => (
            <li key={index} className={styles.movementItem}>
              <div className={styles.movementInfo}>
                <span className={styles.movementName}>{movement}</span>
              </div>
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
          <span className={styles.badge}>{totalMovements}</span>
        </div>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          {/* Workout Header */}
          <div className={viewStyles.header}>
            <div className={viewStyles.headerInfo}>
              <h3 className={viewStyles.title}>{workout.title}</h3>
              <p className={viewStyles.date}>
                {new Date(workout.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <span className={viewStyles.type}>{workout.type.toUpperCase()}</span>
            </div>
            <div className={viewStyles.headerActions}>
              {canEdit && onEdit && (
                <Button variant="outline" size="small" onClick={onEdit}>
                  Edit Workout
                </Button>
              )}
              {onClose && (
                <button
                  type="button"
                  className={viewStyles.closeButton}
                  onClick={onClose}
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {workout.description && (
            <p className={viewStyles.description}>{workout.description}</p>
          )}

          {/* Workout Sections */}
          {renderSection('Warmup', workout.warmup)}
          {renderSection('Strength', workout.strength)}
          {renderSection('MetCon', workout.metcon)}
          {renderSection('Cooldown', workout.cooldown)}

          {/* Bookings */}
          <div className={viewStyles.bookings}>
            <h4 className={styles.sectionTitle}>
              Bookings
              <span className={viewStyles.bookingCount}>
                {bookings.length} / {maxCapacity}
              </span>
            </h4>
            {bookings.length === 0 ? (
              <p className={viewStyles.noBookings}>No bookings for this workout.</p>
            ) : (
              <ul className={viewStyles.bookingList}>
                {bookings.map((booking, index) => (
                  <li key={booking.id} className={viewStyles.bookingItem}>
                    <span className={viewStyles.bookingNumber}>{index + 1}</span>
                    <div className={viewStyles.bookingInfo}>
                      <span className={viewStyles.bookingName}>{booking.userName}</span>
                      <span className={viewStyles.bookingEmail}>{booking.userEmail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
