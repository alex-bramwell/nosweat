import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import styles from './ProfileSettings.module.scss';

const ProfileSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyPhone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!name) {
        throw new Error('Name is required');
      }

      await updateProfile({
        name,
        phone: phone || undefined,
        emergencyContact: emergencyContact || undefined,
        emergencyPhone: emergencyPhone || undefined,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Profile Settings</h2>
        <p className={styles.subtitle}>Manage your personal information and emergency contacts</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={user.email}
              className={styles.input}
              disabled
            />
            <p className={styles.helpText}>Email cannot be changed</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>Full Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter your full name"
              disabled={isLoading}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Membership Type</label>
            <div className={styles.badge}>
              {user.membershipType.replace('-', ' ').toUpperCase()}
            </div>
            <p className={styles.helpText}>Contact us to change your membership</p>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Emergency Contact</h3>

          <div className={styles.field}>
            <label htmlFor="emergencyContact" className={styles.label}>Emergency Contact Name</label>
            <input
              id="emergencyContact"
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className={styles.input}
              placeholder="Contact name"
              disabled={isLoading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="emergencyPhone" className={styles.label}>Emergency Contact Phone</label>
            <input
              id="emergencyPhone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className={styles.input}
              placeholder="(555) 123-4567"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
