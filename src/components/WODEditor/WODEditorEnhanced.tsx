import React, { useState } from 'react';
import { MovementBuilder } from './MovementBuilder';
import { WorkoutSummaryDrawer } from './WorkoutSummaryDrawer';
import { Select, type SelectOption } from '../common/Select/Select';
import { NumberInput } from '../common/NumberInput';
import { DurationInput } from '../common/DurationInput';
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

// Helper to convert string movement to MovementSelection for builder mode
const stringToMovementSelection = (movementStr: string): MovementSelection => {
  // Create a custom movement object from the string
  const customMovement: import('../../types').CrossFitMovement = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: movementStr,
    category: 'metabolic',
    primary_muscle_groups: [],
    secondary_muscle_groups: [],
    equipment: [],
    difficulty: 'intermediate',
    scaling_options: [],
  };
  return { movement: customMovement };
};

// Helper to convert string array to MovementSelection array
const stringsToMovementSelections = (strings?: string[]): MovementSelection[] => {
  if (!strings || strings.length === 0) return [];
  return strings.map(stringToMovementSelection);
};

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
    initialData?.workoutType || (initialData as any)?.type || 'amrap'
  );
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [rounds, setRounds] = useState<number | undefined>(initialData?.rounds);
  const [coachNotes, setCoachNotes] = useState(initialData?.coachNotes || '');
  const [scalingNotes, setScalingNotes] = useState(initialData?.scalingNotes || '');
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
  const [showDescription, setShowDescription] = useState(!!initialData?.description);
  const [showCoachNotes, setShowCoachNotes] = useState(!!initialData?.coachNotes);
  const [showScalingNotes, setShowScalingNotes] = useState(!!initialData?.scalingNotes);

  // Workout type options for Select component
  const workoutTypeOptions: SelectOption[] = [
    { value: 'amrap', label: 'AMRAP' },
    { value: 'fortime', label: 'For Time' },
    { value: 'emom', label: 'EMOM' },
    { value: 'tabata', label: 'Tabata' },
    { value: 'strength', label: 'Strength' },
    { value: 'endurance', label: 'Endurance' }
  ];

  // Builder mode: structured movements - initialize from initialData if editing
  const [sectionMovements, setSectionMovements] = useState<SectionMovements>({
    warmup: stringsToMovementSelections(initialData?.warmup),
    strength: stringsToMovementSelections(initialData?.strength),
    metcon: stringsToMovementSelections(initialData?.metcon),
    cooldown: stringsToMovementSelections(initialData?.cooldown)
  });

  // Text mode: raw text input - initialize from initialData if editing
  const [textWarmup, setTextWarmup] = useState(initialData?.warmup?.join('\n') || '');
  const [textStrength, setTextStrength] = useState(initialData?.strength?.join('\n') || '');
  const [textMetcon, setTextMetcon] = useState(initialData?.metcon?.join('\n') || '');
  const [textCooldown, setTextCooldown] = useState(initialData?.cooldown?.join('\n') || '');

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
          <div className={styles.toggleRow}>
            <span className={styles.toggleText}>Add workout description</span>
            <button
              type="button"
              onClick={() => {
                setShowDescription(!showDescription);
                if (showDescription) setDescription('');
              }}
              className={`${styles.toggleButton} ${showDescription ? styles.active : ''}`}
              aria-pressed={showDescription}
            >
              <span className={styles.toggleTrack}>
                <span className={styles.toggleThumb} />
              </span>
            </button>
          </div>
          {showDescription && (
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief workout description..."
              className={styles.textarea}
              rows={3}
            />
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="duration">Duration</label>
            <DurationInput
              id="duration"
              value={duration}
              onChange={setDuration}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rounds">Rounds</label>
            <NumberInput
              id="rounds"
              value={rounds}
              onChange={setRounds}
              min={1}
              max={99}
              placeholder="e.g., 3, 5"
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
          <div className={styles.toggleRow}>
            <span className={styles.toggleText}>Add coach's notes</span>
            <button
              type="button"
              onClick={() => {
                setShowCoachNotes(!showCoachNotes);
                if (showCoachNotes) setCoachNotes('');
              }}
              className={`${styles.toggleButton} ${showCoachNotes ? styles.active : ''}`}
              aria-pressed={showCoachNotes}
            >
              <span className={styles.toggleTrack}>
                <span className={styles.toggleThumb} />
              </span>
            </button>
          </div>
          {showCoachNotes && (
            <textarea
              id="coachNotes"
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Additional coaching cues, focus areas, etc..."
              className={styles.textarea}
              rows={3}
            />
          )}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.toggleRow}>
            <span className={styles.toggleText}>Add scaling notes</span>
            <button
              type="button"
              onClick={() => {
                setShowScalingNotes(!showScalingNotes);
                if (showScalingNotes) setScalingNotes('');
              }}
              className={`${styles.toggleButton} ${showScalingNotes ? styles.active : ''}`}
              aria-pressed={showScalingNotes}
            >
              <span className={styles.toggleTrack}>
                <span className={styles.toggleThumb} />
              </span>
            </button>
          </div>
          {showScalingNotes && (
            <textarea
              id="scalingNotes"
              value={scalingNotes}
              onChange={(e) => setScalingNotes(e.target.value)}
              placeholder="Scaling options for different fitness levels..."
              className={styles.textarea}
              rows={3}
            />
          )}
        </div>
      </div>

      {/* Status and Actions */}
      <div className={styles.footer}>
        <div className={styles.statusToggle}>
          <div className={styles.statusOption}>
            <input
              type="radio"
              id="status-draft"
              name="status"
              value="draft"
              checked={status === 'draft'}
              onChange={() => setStatus('draft')}
            />
            <label htmlFor="status-draft" className={styles.statusLabel}>
              <span className={styles.statusIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </span>
              Draft
            </label>
          </div>
          <div className={styles.statusOption}>
            <input
              type="radio"
              id="status-published"
              name="status"
              value="published"
              checked={status === 'published'}
              onChange={() => setStatus('published')}
            />
            <label htmlFor="status-published" className={styles.statusLabel}>
              <span className={styles.statusIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              Published
            </label>
          </div>
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

      {/* Floating Workout Summary Drawer - only in builder mode */}
      {mode === 'builder' && (
        <WorkoutSummaryDrawer
          sectionMovements={sectionMovements}
          onRemoveMovement={handleRemoveMovement}
        />
      )}
    </form>
  );
};
