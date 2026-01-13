import React, { useState, useEffect, useMemo } from 'react';
import { movementService } from '../../services/movementService';
import { GymnasticIcon, WeightliftingIcon, MetabolicIcon, SkillIcon } from '../common/Icons';
import type { CrossFitMovement, MuscleGroup, MovementSelection } from '../../types';
import styles from './MovementBuilder.module.scss';

interface MovementBuilderProps {
  onAddMovement: (selection: MovementSelection) => void;
  section: 'warmup' | 'strength' | 'metcon' | 'cooldown';
}

const MUSCLE_GROUPS: MuscleGroup[] = ['shoulders', 'back', 'chest', 'arms', 'legs', 'core'];

export const MovementBuilder: React.FC<MovementBuilderProps> = ({ onAddMovement, section }) => {
  const [movements, setMovements] = useState<CrossFitMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<CrossFitMovement | null>(null);

  // Movement details form
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await movementService.getAllMovements();
      setMovements(data);
      setError(null);
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      );
    }

    // Filter by muscle groups
    if (selectedMuscleGroups.length > 0) {
      filtered = filtered.filter(m =>
        m.primary_muscle_groups.some(mg => selectedMuscleGroups.includes(mg)) ||
        m.secondary_muscle_groups.some(mg => selectedMuscleGroups.includes(mg))
      );
    }

    return filtered;
  }, [movements, searchQuery, selectedMuscleGroups]);

  const toggleMuscleGroup = (muscleGroup: MuscleGroup) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(muscleGroup)
        ? prev.filter(mg => mg !== muscleGroup)
        : [...prev, muscleGroup]
    );
  };

  const handleSelectMovement = (movement: CrossFitMovement) => {
    setSelectedMovement(movement);
    // Reset form
    setReps('');
    setWeight('');
    setDistance('');
    setDuration('');
    setNotes('');
  };

  const handleAddToWorkout = () => {
    if (!selectedMovement) return;

    const selection: MovementSelection = {
      movement: selectedMovement,
      reps: reps || undefined,
      weight: weight || undefined,
      distance: distance || undefined,
      duration: duration || undefined,
      notes: notes || undefined
    };

    onAddMovement(selection);

    // Reset selection
    setSelectedMovement(null);
    setReps('');
    setWeight('');
    setDistance('');
    setDuration('');
    setNotes('');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return styles.beginner;
      case 'intermediate': return styles.intermediate;
      case 'advanced': return styles.advanced;
      default: return '';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gymnastic': return <GymnasticIcon size={24} />;
      case 'weightlifting': return <WeightliftingIcon size={24} />;
      case 'metabolic': return <MetabolicIcon size={24} />;
      case 'skill': return <SkillIcon size={24} />;
      default: return <GymnasticIcon size={24} />;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading movements...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadMovements} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.movementBuilder}>
      <div className={styles.header}>
        <h3>Add Movement to {section.charAt(0).toUpperCase() + section.slice(1)}</h3>
      </div>

      {!selectedMovement ? (
        <>
          {/* Search and Filters */}
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Search movements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />

            <div className={styles.muscleGroupFilters}>
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg}
                  onClick={() => toggleMuscleGroup(mg)}
                  className={`${styles.filterButton} ${
                    selectedMuscleGroups.includes(mg) ? styles.active : ''
                  }`}
                >
                  {mg.charAt(0).toUpperCase() + mg.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Movement Grid */}
          <div className={styles.movementGrid}>
            {filteredMovements.length === 0 ? (
              <p className={styles.noResults}>No movements found matching your filters.</p>
            ) : (
              filteredMovements.map(movement => (
                <div
                  key={movement.id}
                  className={styles.movementCard}
                  onClick={() => handleSelectMovement(movement)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.categoryIcon}>
                      {getCategoryIcon(movement.category)}
                    </span>
                    <h4>{movement.name}</h4>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.muscleGroups}>
                      {movement.primary_muscle_groups.map(mg => (
                        <span key={mg} className={`${styles.muscleTag} ${styles.primary}`}>
                          {mg}
                        </span>
                      ))}
                    </div>

                    <span className={`${styles.difficulty} ${getDifficultyColor(movement.difficulty)}`}>
                      {movement.difficulty}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Movement Details Form */}
          <div className={styles.detailsForm}>
            <div className={styles.selectedMovement}>
              <h4>{selectedMovement.name}</h4>
              <p className={styles.description}>{selectedMovement.description}</p>
              <button
                onClick={() => setSelectedMovement(null)}
                className={styles.backButton}
              >
                ← Back to Selection
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="reps">Reps/Sets</label>
                <input
                  id="reps"
                  type="text"
                  placeholder="e.g., 10, 21-15-9, 5x5"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="weight">Weight</label>
                <input
                  id="weight"
                  type="text"
                  placeholder="e.g., 135 lbs, RX, bodyweight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="distance">Distance</label>
                <input
                  id="distance"
                  type="text"
                  placeholder="e.g., 400m, 1 mile"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="duration">Duration</label>
                <input
                  id="duration"
                  type="text"
                  placeholder="e.g., 2 min, 30 sec"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  placeholder="Any additional instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </div>

            {selectedMovement.scaling_options.length > 0 && (
              <div className={styles.scalingOptions}>
                <h5>Scaling Options:</h5>
                <ul>
                  {selectedMovement.scaling_options.map((option, idx) => (
                    <li key={idx}>{option}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleAddToWorkout}
              className={styles.addButton}
            >
              Add to {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
