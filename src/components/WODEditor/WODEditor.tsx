import React, { useState } from 'react';
import { Card, Button } from '../common';
import { Select, type SelectOption } from '../common/Select/Select';
import type { WorkoutFormData } from '../../types';
import styles from './WODEditor.module.scss';

interface WODEditorProps {
  initialData?: Partial<WorkoutFormData>;
  onSave: (workout: WorkoutFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export const WODEditor: React.FC<WODEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<WorkoutFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    title: initialData?.title || '',
    description: initialData?.description || '',
    workoutType: initialData?.workoutType || 'amrap',
    duration: initialData?.duration || '',
    rounds: initialData?.rounds,
    warmup: initialData?.warmup || [],
    strength: initialData?.strength || [],
    metcon: initialData?.metcon || [],
    cooldown: initialData?.cooldown || [],
    movements: initialData?.movements || [],
    coachNotes: initialData?.coachNotes || '',
    scalingNotes: initialData?.scalingNotes || '',
    status: initialData?.status || 'published',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Select options
  const workoutTypeOptions: SelectOption[] = [
    { value: 'amrap', label: 'AMRAP' },
    { value: 'fortime', label: 'For Time' },
    { value: 'emom', label: 'EMOM' },
    { value: 'strength', label: 'Strength' },
    { value: 'endurance', label: 'Endurance' }
  ];

  const statusOptions: SelectOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  // Helper to update array fields
  const updateArrayField = (field: keyof WorkoutFormData, value: string) => {
    const items = value.split('\n').filter(line => line.trim());
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Ensure metcon has at least one item if it's required
      if (!formData.metcon || formData.metcon.length === 0) {
        throw new Error('MetCon / Main Workout is required');
      }
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout');
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="elevated" padding="large">
      <form onSubmit={handleSubmit} className={styles.editor}>
        <h2 className={styles.title}>
          {isEditing ? 'Edit Workout' : 'Create New Workout'}
        </h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="workoutType">Type *</label>
            <Select
              options={workoutTypeOptions}
              value={formData.workoutType}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                workoutType: value as WorkoutFormData['workoutType']
              }))}
              placeholder="Select workout type"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            required
            placeholder="e.g., Metcon Monday"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            placeholder="e.g., 21-15-9 reps for time"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              type="text"
              placeholder="e.g., 20 min or 15 min cap"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rounds">Rounds</label>
            <input
              id="rounds"
              type="number"
              placeholder="Number of rounds"
              value={formData.rounds || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                rounds: e.target.value ? parseInt(e.target.value) : undefined
              }))}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="warmup">Warm-Up (one item per line)</label>
          <textarea
            id="warmup"
            rows={4}
            placeholder={'3 Rounds:\n10 Air Squats\n10 Push-Ups\n200m Run'}
            value={formData.warmup?.join('\n') || ''}
            onChange={(e) => updateArrayField('warmup', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="strength">Strength (one item per line)</label>
          <textarea
            id="strength"
            rows={4}
            placeholder={'Back Squat\n5-5-5-5-5 @ 75% 1RM\nRest 2-3 min between sets'}
            value={formData.strength?.join('\n') || ''}
            onChange={(e) => updateArrayField('strength', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="metcon">MetCon / Main Workout (one item per line) *</label>
          <textarea
            id="metcon"
            rows={6}
            required
            placeholder={'15 Wall Balls (20/14 lbs)\n12 Box Jumps (24/20 in)\n9 Burpees'}
            value={formData.metcon?.join('\n') || ''}
            onChange={(e) => updateArrayField('metcon', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cooldown">Cool-Down (one item per line)</label>
          <textarea
            id="cooldown"
            rows={3}
            placeholder={'5 min easy row\nStretch hip flexors'}
            value={formData.cooldown?.join('\n') || ''}
            onChange={(e) => updateArrayField('cooldown', e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="coachNotes">Coach&apos;s Notes</label>
          <textarea
            id="coachNotes"
            rows={3}
            placeholder="Focus on maintaining consistent pace..."
            value={formData.coachNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, coachNotes: e.target.value }))}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="scalingNotes">Scaling Notes</label>
          <textarea
            id="scalingNotes"
            rows={3}
            placeholder="Scale wall balls to 14/10 lbs, box jumps to step-ups..."
            value={formData.scalingNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, scalingNotes: e.target.value }))}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="status">Status</label>
          <Select
            options={statusOptions}
            value={formData.status}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              status: value as 'draft' | 'published'
            }))}
            placeholder="Select status"
          />
          <small>Draft workouts are only visible to coaches</small>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Workout' : 'Create Workout'}
          </Button>
        </div>
      </form>
    </Card>
  );
};