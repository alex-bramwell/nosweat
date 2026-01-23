import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { coachProfileService, type CoachProfileUpdateData } from '../../services/coachProfileService';
import styles from './CoachProfileEditor.module.scss';

interface CoachProfileEditorProps {
  onSave?: () => void;
}

export const CoachProfileEditor = ({ onSave }: CoachProfileEditorProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Input state for adding new items
  const [newCertification, setNewCertification] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const profile = await coachProfileService.getCoachProfile(user.id);
      if (profile) {
        setFullName(profile.fullName || '');
        setTitle(profile.title || '');
        setBio(profile.bio || '');
        setCertifications(profile.certifications || []);
        setSpecialties(profile.specialties || []);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: CoachProfileUpdateData = {
        fullName,
        title,
        bio,
        certifications,
        specialties,
      };

      await coachProfileService.updateCoachProfile(user.id, updateData);
      setSuccess('Profile updated successfully!');
      onSave?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addCertification = () => {
    const trimmed = newCertification.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const addSpecialty = () => {
    const trimmed = newSpecialty.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      setSpecialties([...specialties, trimmed]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  return (
    <div className={styles.profileEditor}>
      <div className={styles.header}>
        <h2>My Profile</h2>
        <p>Update your public profile information that appears on the Coaches page.</p>
      </div>

      {success && <div className={styles.successMessage}>{success}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.form}>
        {/* Basic Info */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Information</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Display Name</label>
              <input
                id="fullName"
                type="text"
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Title / Role</label>
              <input
                id="title"
                type="text"
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Head Coach, Senior Coach"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a brief bio about yourself, your coaching experience, and philosophy..."
              rows={5}
            />
            <span className={styles.hint}>This will appear on your public profile.</span>
          </div>
        </div>

        {/* Certifications */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Certifications</h3>

          <div className={styles.listInput}>
            {certifications.length > 0 && (
              <div className={styles.listItems}>
                {certifications.map((cert, index) => (
                  <div key={index} className={styles.listItem}>
                    <span className={styles.listItemText}>{cert}</span>
                    <button
                      type="button"
                      className={styles.listItemRemove}
                      onClick={() => removeCertification(index)}
                      aria-label="Remove certification"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.addItemRow}>
              <input
                type="text"
                className={styles.input}
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addCertification)}
                placeholder="e.g., CrossFit Level 2 Trainer"
              />
              <button
                type="button"
                className={styles.addButton}
                onClick={addCertification}
                disabled={!newCertification.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Specialties</h3>

          <div className={styles.listInput}>
            {specialties.length > 0 && (
              <div className={styles.tagsContainer}>
                {specialties.map((specialty, index) => (
                  <span key={index} className={styles.tag}>
                    {specialty}
                    <button
                      type="button"
                      className={styles.tagRemove}
                      onClick={() => removeSpecialty(index)}
                      aria-label="Remove specialty"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className={styles.addItemRow}>
              <input
                type="text"
                className={styles.input}
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addSpecialty)}
                placeholder="e.g., Olympic Weightlifting"
              />
              <button
                type="button"
                className={styles.addButton}
                onClick={addSpecialty}
                disabled={!newSpecialty.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Preview</h3>
          <div className={styles.preview}>
            <span className={styles.previewTitle}>How you&apos;ll appear on the Coaches page</span>
            <h4 className={styles.previewName}>{fullName || 'Your Name'}</h4>
            <p className={styles.previewRole}>{title || 'Your Title'}</p>
            <p className={styles.previewBio}>
              {bio || 'Your bio will appear here...'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={loadProfile}
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachProfileEditor;
