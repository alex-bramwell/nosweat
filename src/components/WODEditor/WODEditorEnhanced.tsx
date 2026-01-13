import React, { useState } from 'react';
import { MovementBuilder } from './MovementBuilder';
import { Select, type SelectOption } from '../common/Select/Select';
import { ArrowUpIcon, ArrowDownIcon, CloseIcon } from '../common/Icons';
import type { WorkoutFormData, MovementSelection } from '../../types';
import styles from './WODEditorEnhanced.module.scss';

interface WODEditorEnhancedProps {
  initialData?: Partial<WorkoutFormData>;
  onSave: (data: WorkoutFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

type WorkoutSection = 'warmup' | 'strength' | 'metcon' | 'cooldown';
type EditorMode = 'builder' | 'text';

interface SectionMovements {
  warmup: MovementSelection[];
  strength: MovementSelection[];
  metcon: MovementSelection[];
  cooldown: MovementSelection[];
}

export const WODEditorEnhanced: React.FC<WODEditorEnhancedProps> = ({
  initialData,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [mode, setMode] = useState<EditorMode>('builder');
  const [activeSection, setActiveSection] = useState<WorkoutSection | null>(null);

  // Form state
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [workoutType, setWorkoutType] = useState<WorkoutFormData['workoutType']>(
    initialData?.workoutType || 'amrap'
  );
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [rounds, setRounds] = useState<number | undefined>(initialData?.rounds);
  const [coachNotes, setCoachNotes] = useState(initialData?.coachNotes || '');
  const [scalingNotes, setScalingNotes] = useState(initialData?.scalingNotes || '');
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');

  // Workout type options for Select component
  const workoutTypeOptions: SelectOption[] = [
    { value: 'amrap', label: 'AMRAP' },
    { value: 'fortime', label: 'For Time' },
    { value: 'emom', label: 'EMOM' },
    { value: 'strength', label: 'Strength' },
    { value: 'endurance', label: 'Endurance' }
  ];

  // Builder mode: structured movements
  const [sectionMovements, setSectionMovements] = useState<SectionMovements>({
    warmup: [],
    strength: [],
    metcon: [],
    cooldown: []
  });

  // Text mode: raw text input
  const [textWarmup, setTextWarmup] = useState('');
  const [textStrength, setTextStrength] = useState('');
  const [textMetcon, setTextMetcon] = useState('');
  const [textCooldown, setTextCooldown] = useState('');

  const handleAddMovement = (section: WorkoutSection, selection: MovementSelection) => {
    setSectionMovements(prev => ({
      ...prev,
      [section]: [...prev[section], selection]
    }));
    setActiveSection(null);
  };

  const handleRemoveMovement = (section: WorkoutSection, index: number) => {
    setSectionMovements(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleMoveUp = (section: WorkoutSection, index: number) => {
    if (index === 0) return;
    setSectionMovements(prev => {
      const newMovements = [...prev[section]];
      [newMovements[index - 1], newMovements[index]] = [newMovements[index], newMovements[index - 1]];
      return { ...prev, [section]: newMovements };
    });
  };

  const handleMoveDown = (section: WorkoutSection, index: number) => {
    const movements = sectionMovements[section];
    if (index === movements.length - 1) return;
    setSectionMovements(prev => {
      const newMovements = [...prev[section]];
      [newMovements[index], newMovements[index + 1]] = [newMovements[index + 1], newMovements[index]];
      return { ...prev, [section]: newMovements };
    });
  };

  const formatMovementString = (selection: MovementSelection): string => {
    const parts = [selection.movement.name];
    if (selection.reps) parts.push(`- ${selection.reps} reps`);
    if (selection.weight) parts.push(`@ ${selection.weight}`);
    if (selection.distance) parts.push(`- ${selection.distance}`);
    if (selection.duration) parts.push(`(${selection.duration})`);
    if (selection.notes) parts.push(`[${selection.notes}]`);
    return parts.join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let warmup: string[], strength: string[], metcon: string[], cooldown: string[];

    if (mode === 'builder') {
      warmup = sectionMovements.warmup.map(formatMovementString);
      strength = sectionMovements.strength.map(formatMovementString);
      metcon = sectionMovements.metcon.map(formatMovementString);
      cooldown = sectionMovements.cooldown.map(formatMovementString);
    } else {
      warmup = textWarmup.split('\n').filter(line => line.trim());
      strength = textStrength.split('\n').filter(line => line.trim());
      metcon = textMetcon.split('\n').filter(line => line.trim());
      cooldown = textCooldown.split('\n').filter(line => line.trim());
    }

    // Validate that metcon has at least one movement
    if (metcon.length === 0) {
      alert('Please add at least one movement to the MetCon section.');
      return;
    }

    const allMovements = [...warmup, ...strength, ...metcon, ...cooldown];

    const formData: WorkoutFormData = {
      date,
      title,
      description,
      workoutType,
      duration: duration || undefined,
      rounds: rounds || undefined,
      warmup,
      strength,
      metcon,
      cooldown,
      movements: allMovements,
      coachNotes: coachNotes || undefined,
      scalingNotes: scalingNotes || undefined,
      status
    };

    onSave(formData);
  };

  const renderSectionBuilder = (section: WorkoutSection, label: string) => {
    const movements = sectionMovements[section];
    const isRequired = section === 'metcon';

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>
            {label}
            {isRequired && <span className={styles.required}>*</span>}
          </h3>
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === section ? null : section)}
            className={styles.addButton}
          >
            {activeSection === section ? 'Close' : '+ Add Movement'}
          </button>
        </div>

        {activeSection === section && (
          <MovementBuilder
            section={section}
            onAddMovement={(selection) => handleAddMovement(section, selection)}
          />
        )}

        {movements.length > 0 && (
          <div className={styles.movementList}>
            {movements.map((selection, index) => (
              <div key={index} className={styles.movementItem}>
                <div className={styles.movementControls}>
                  <button
                    type="button"
                    onClick={() => handleMoveUp(section, index)}
                    disabled={index === 0}
                    className={styles.iconButton}
                    title="Move up"
                  >
                    <ArrowUpIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(section, index)}
                    disabled={index === movements.length - 1}
                    className={styles.iconButton}
                    title="Move down"
                  >
                    <ArrowDownIcon size={16} />
                  </button>
                </div>
                <div className={styles.movementContent}>
                  <strong>{selection.movement.name}</strong>
                  <div className={styles.movementDetails}>
                    {selection.reps && <span>Reps: {selection.reps}</span>}
                    {selection.weight && <span>Weight: {selection.weight}</span>}
                    {selection.distance && <span>Distance: {selection.distance}</span>}
                    {selection.duration && <span>Duration: {selection.duration}</span>}
                    {selection.notes && <span className={styles.notes}>Note: {selection.notes}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMovement(section, index)}
                  className={styles.removeButton}
                  title="Remove movement"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSectionText = (
    section: WorkoutSection,
    label: string,
    value: string,
    onChange: (value: string) => void
  ) => {
    return (
      <div className={styles.section}>
        <label htmlFor={section} className={styles.sectionLabel}>
          {label}
          {section === 'metcon' && <span className={styles.required}>*</span>}
        </label>
        <textarea
          id={section}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.textarea}
          rows={5}
          placeholder="One movement per line..."
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={styles.wodEditor}>
      <div className={styles.header}>
        <h2>{isEditing ? 'Edit Workout' : 'Create Workout'}</h2>
        <div className={styles.modeToggle}>
          <button
            type="button"
            onClick={() => setMode('builder')}
            className={`${styles.modeButton} ${mode === 'builder' ? styles.active : ''}`}
          >
            Movement Builder
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`${styles.modeButton} ${mode === 'text' ? styles.active : ''}`}
          >
            Text Mode
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className={styles.basicInfo}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="workoutType">Workout Type *</label>
            <Select
              options={workoutTypeOptions}
              value={workoutType}
              onChange={(value) => setWorkoutType(value as WorkoutFormData['workoutType'])}
              placeholder="Select workout type"
              className={styles.selectWrapper}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">Workout Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Monday Madness, Fran, etc."
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Brief workout description..."
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 20:00, 12 min"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rounds">Rounds</label>
            <input
              id="rounds"
              type="number"
              value={rounds || ''}
              onChange={(e) => setRounds(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 3, 5"
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Workout Sections */}
      <div className={styles.workoutSections}>
        <h3>Workout Structure</h3>

        {mode === 'builder' ? (
          <>
            {renderSectionBuilder('warmup', 'Warmup')}
            {renderSectionBuilder('strength', 'Strength')}
            {renderSectionBuilder('metcon', workoutType ? workoutType.toUpperCase() : 'MetCon')}
            {renderSectionBuilder('cooldown', 'Cooldown')}
          </>
        ) : (
          <>
            {renderSectionText('warmup', 'Warmup', textWarmup, setTextWarmup)}
            {renderSectionText('strength', 'Strength', textStrength, setTextStrength)}
            {renderSectionText('metcon', workoutType ? workoutType.toUpperCase() : 'MetCon', textMetcon, setTextMetcon)}
            {renderSectionText('cooldown', 'Cooldown', textCooldown, setTextCooldown)}
          </>
        )}
      </div>

      {/* Notes */}
      <div className={styles.notes}>
        <div className={styles.formGroup}>
          <label htmlFor="coachNotes">Coach's Notes</label>
          <textarea
            id="coachNotes"
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            placeholder="Additional coaching cues, focus areas, etc..."
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="scalingNotes">Scaling Notes</label>
          <textarea
            id="scalingNotes"
            value={scalingNotes}
            onChange={(e) => setScalingNotes(e.target.value)}
            placeholder="Scaling options for different fitness levels..."
            className={styles.textarea}
            rows={3}
          />
        </div>
      </div>

      {/* Status and Actions */}
      <div className={styles.footer}>
        <div className={styles.statusToggle}>
          <label>
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === 'draft'}
              onChange={() => setStatus('draft')}
            />
            Draft
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="published"
              checked={status === 'published'}
              onChange={() => setStatus('published')}
            />
            Published
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" className={styles.saveButton}>
            {isEditing ? 'Update Workout' : 'Create Workout'}
          </button>
        </div>
      </div>
    </form>
  );
};
