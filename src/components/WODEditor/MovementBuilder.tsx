import React, { useState, useEffect, useMemo } from 'react';
import { movementService } from '../../services/movementService';
import { NumberInput } from '../common/NumberInput';
import { DurationInput } from '../common/DurationInput';
import Modal from '../common/Modal/Modal';
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
  const [reps, setReps] = useState<number | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

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
    setReps(undefined);
    setWeight(undefined);
    setDistance(undefined);
    setDuration('');
    setNotes('');
    setShowNotes(false);
  };

  const handleCloseModal = () => {
    setSelectedMovement(null);
    setReps(undefined);
    setWeight(undefined);
    setDistance(undefined);
    setDuration('');
    setNotes('');
    setShowNotes(false);
  };

  const handleAddToWorkout = () => {
    if (!selectedMovement) return;

    const selection: MovementSelection = {
      movement: selectedMovement,
      reps: reps ? String(reps) : undefined,
      weight: weight ? `${weight} lbs` : undefined,
      distance: distance ? `${distance}m` : undefined,
      duration: duration || undefined,
      notes: notes || undefined
    };

    onAddMovement(selection);

    // Reset selection
    setSelectedMovement(null);
    setReps(undefined);
    setWeight(undefined);
    setDistance(undefined);
    setDuration('');
    setNotes('');
    setShowNotes(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return styles.beginner;
      case 'intermediate': return styles.intermediate;
      case 'advanced': return styles.advanced;
      default: return '';
    }
  };

  const getSubcategoryStyle = (subcategory: string | undefined, category: string) => {
    // Use subcategory if available, otherwise fall back to category
    if (subcategory) {
      switch (subcategory) {
        case 'olympic': return styles.subcategoryOlympic;
        case 'powerlifting': return styles.subcategoryPowerlifting;
        case 'bodybuilding': return styles.subcategoryBodybuilding;
        case 'calisthenics': return styles.subcategoryCalisthenics;
        case 'cardio': return styles.subcategoryCardio;
        case 'accessory': return styles.subcategoryAccessory;
        default: return styles.subcategoryAccessory;
      }
    }
    // Fallback to category-based styling
    switch (category) {
      case 'gymnastic': return styles.subcategoryCalisthenics;
      case 'weightlifting': return styles.subcategoryPowerlifting;
      case 'metabolic': return styles.subcategoryCardio;
      case 'skill': return styles.subcategoryAccessory;
      default: return styles.subcategoryAccessory;
    }
  };

  const getSubcategoryLabel = (subcategory: string | undefined, category: string) => {
    // Use subcategory if available, otherwise fall back to category
    if (subcategory) {
      switch (subcategory) {
        case 'olympic': return 'Olympic';
        case 'powerlifting': return 'Powerlifting';
        case 'bodybuilding': return 'Bodybuilding';
        case 'calisthenics': return 'Calisthenics';
        case 'cardio': return 'Cardio';
        case 'accessory': return 'Accessory';
        default: return subcategory;
      }
    }
    // Fallback to category
    switch (category) {
      case 'gymnastic': return 'Gymnastic';
      case 'weightlifting': return 'Weightlifting';
      case 'metabolic': return 'Metabolic';
      case 'skill': return 'Skill';
      default: return category;
    }
  };

  if (loading) {
    return <div className={styles.movementBuilderLoading}>Loading movements...</div>;
  }

  if (error) {
    return (
      <div className={styles.movementBuilderError}>
        <p>{error}</p>
        <button onClick={loadMovements} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.movementBuilder}>
      <div className={styles.movementBuilderHeader}>
        <h3>Add Movement to {section.charAt(0).toUpperCase() + section.slice(1)}</h3>
      </div>

      {/* Search and Filters */}
      <div className={styles.movementSearchFilters}>
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
              <h4 className={styles.movementName}>{movement.name}</h4>

              <div className={styles.cardMeta}>
                <span className={`${styles.categoryPill} ${getSubcategoryStyle(movement.subcategory, movement.category)}`}>
                  {getSubcategoryLabel(movement.subcategory, movement.category)}
                </span>
                <span className={`${styles.difficulty} ${getDifficultyColor(movement.difficulty)}`}>
                  {movement.difficulty}
                </span>
              </div>

              <div className={styles.muscleGroups}>
                {movement.primary_muscle_groups.map(mg => (
                  <span key={mg} className={styles.muscleTag}>
                    {mg}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Movement Details Modal */}
      <Modal isOpen={!!selectedMovement} onClose={handleCloseModal}>
        {selectedMovement && (
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{selectedMovement.name}</h3>
              <div className={styles.modalMeta}>
                <span className={`${styles.categoryPill} ${getSubcategoryStyle(selectedMovement.subcategory, selectedMovement.category)}`}>
                  {getSubcategoryLabel(selectedMovement.subcategory, selectedMovement.category)}
                </span>
                <span className={`${styles.difficulty} ${getDifficultyColor(selectedMovement.difficulty)}`}>
                  {selectedMovement.difficulty}
                </span>
              </div>
              {selectedMovement.description && (
                <p className={styles.modalDescription}>{selectedMovement.description}</p>
              )}
            </div>

            <div className={styles.movementDetailsGrid}>
              <div className={styles.movementFieldGroup}>
                <label htmlFor="reps">Reps</label>
                <NumberInput
                  id="reps"
                  value={reps}
                  onChange={setReps}
                  min={1}
                  max={999}
                  placeholder="0"
                  label="reps"
                />
              </div>

              <div className={styles.movementFieldGroup}>
                <label htmlFor="weight">Weight</label>
                <NumberInput
                  id="weight"
                  value={weight}
                  onChange={setWeight}
                  min={1}
                  max={999}
                  placeholder="0"
                  label="lbs"
                />
              </div>

              <div className={styles.movementFieldGroup}>
                <label htmlFor="distance">Distance</label>
                <NumberInput
                  id="distance"
                  value={distance}
                  onChange={setDistance}
                  min={1}
                  max={9999}
                  placeholder="0"
                  label="m"
                />
              </div>

              <div className={styles.movementFieldGroup}>
                <label htmlFor="duration">Duration</label>
                <DurationInput
                  id="duration"
                  value={duration}
                  onChange={setDuration}
                />
              </div>

              <div className={`${styles.movementFieldGroup} ${styles.fullWidth}`}>
                <div className={styles.toggleRow}>
                  <span className={styles.toggleText}>Add notes</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotes(!showNotes);
                      if (showNotes) setNotes('');
                    }}
                    className={`${styles.toggleButton} ${showNotes ? styles.active : ''}`}
                    aria-pressed={showNotes}
                  >
                    <span className={styles.toggleTrack}>
                      <span className={styles.toggleThumb} />
                    </span>
                  </button>
                </div>
                {showNotes && (
                  <textarea
                    id="notes"
                    placeholder="Any additional instructions or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={styles.movementTextarea}
                    rows={3}
                  />
                )}
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
        )}
      </Modal>
    </div>
  );
};
