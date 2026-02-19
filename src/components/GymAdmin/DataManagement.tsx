import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../common';
import Modal from '../common/Modal/Modal';
import styles from './DataManagement.module.scss';

// Tables to export, keyed by display name
const EXPORT_TABLES = [
  { table: 'gyms', label: 'Gym Info', idColumn: 'id' },
  { table: 'gym_branding', label: 'Branding', idColumn: 'gym_id' },
  { table: 'gym_features', label: 'Features', idColumn: 'gym_id' },
  { table: 'gym_programs', label: 'Programs', idColumn: 'gym_id' },
  { table: 'gym_schedule', label: 'Schedule', idColumn: 'gym_id' },
  { table: 'gym_stats', label: 'Stats', idColumn: 'gym_id' },
  { table: 'gym_memberships', label: 'Memberships', idColumn: 'gym_id' },
  { table: 'gym_feature_billing', label: 'Feature Billing', idColumn: 'gym_id' },
  { table: 'profiles', label: 'Members', idColumn: 'gym_id' },
  { table: 'bookings', label: 'Bookings', idColumn: 'gym_id' },
  { table: 'workout_bookings', label: 'Workout Bookings', idColumn: 'gym_id' },
  { table: 'workouts', label: 'Workouts', idColumn: 'gym_id' },
  { table: 'payments', label: 'Payments', idColumn: 'gym_id' },
  { table: 'trial_memberships', label: 'Trial Memberships', idColumn: 'gym_id' },
  { table: 'coach_services', label: 'Coach Services', idColumn: 'gym_id' },
  { table: 'service_bookings', label: 'Service Bookings', idColumn: 'gym_id' },
  { table: 'stripe_customers', label: 'Stripe Customers', idColumn: 'gym_id' },
  { table: 'accounting_integrations', label: 'Accounting Integrations', idColumn: 'gym_id' },
] as const;

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertToCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => escapeCSVField(row[h])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const DataManagement: React.FC = () => {
  const { gym } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!gym || !user) return null;

  const isOwner = user.id === gym.owner_id;

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    let exportedCount = 0;

    try {
      for (const { table, label, idColumn } of EXPORT_TABLES) {
        setExportProgress(`Exporting ${label}...`);

        const query = idColumn === 'id'
          ? supabase.from(table).select('*').eq('id', gym.id)
          : supabase.from(table).select('*').eq('gym_id', gym.id);

        const { data, error } = await query;

        if (error) {
          console.error(`Error exporting ${table}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          const csv = convertToCSV(data);
          downloadCSV(`${gym.slug}_${table}.csv`, csv);
          exportedCount++;
          // Small delay between downloads so the browser doesn't block them
          await new Promise(r => setTimeout(r, 300));
        }
      }

      setExportProgress('');
      if (exportedCount > 0) {
        setMessage({ type: 'success', text: `Exported ${exportedCount} table${exportedCount > 1 ? 's' : ''} as CSV.` });
      } else {
        setMessage({ type: 'success', text: 'No data found to export.' });
      }
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
      setExportProgress('');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage(null);

    try {
      const { error } = await supabase.rpc('delete_gym_data');

      if (error) throw error;

      // Redirect to platform home after deletion
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete gym. Please try again.' });
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
  };

  const isDeleteConfirmed = deleteConfirmText.toLowerCase() === 'delete';

  return (
    <div className={styles.dataManagement}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Data Export */}
      <Card className={styles.section}>
        <h2 className={styles.sectionTitle}>Export Data</h2>
        <p className={styles.sectionDescription}>
          Download all your gym data as CSV files. Each table (members, bookings,
          payments, etc.) is exported as a separate file.
        </p>
        <p className={styles.tableList}>
          Includes: gym info, branding, features, programs, schedule, stats,
          memberships, members, bookings, workouts, payments, coach services,
          and accounting data.
        </p>
        <button
          className={styles.exportButton}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </button>
        {exportProgress && (
          <p className={styles.exportProgress}>{exportProgress}</p>
        )}
      </Card>

      {/* Danger Zone - only visible to gym owner */}
      {isOwner && (
        <Card className={`${styles.section} ${styles.dangerZone}`}>
          <h2 className={styles.dangerTitle}>Danger Zone</h2>
          <p className={styles.dangerDescription}>
            Permanently delete your gym and all associated data including members,
            bookings, payments, programs, and schedules. This action cannot be undone.
          </p>
          <button
            className={styles.dangerButton}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete My Gym
          </button>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={handleCloseDeleteModal} size="small">
        <div className={styles.confirmModal}>
          <h2 className={styles.confirmTitle}>Delete Gym</h2>
          <p className={styles.confirmText}>
            You are about to permanently delete <strong>{gym.name}</strong> and
            all its data. This includes all members, bookings, payments, programs,
            schedules, and settings.
          </p>
          <div className={styles.confirmWarning}>
            This action is permanent and cannot be undone. We recommend exporting
            your data first.
          </div>
          <div className={styles.confirmInputGroup}>
            <label htmlFor="delete-confirm">
              Type <strong>delete</strong> to confirm
            </label>
            <input
              type="text"
              id="delete-confirm"
              className={styles.confirmInput}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              autoComplete="off"
              disabled={isDeleting}
            />
          </div>
          <div className={styles.confirmActions}>
            <button
              className={styles.cancelButton}
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className={styles.dangerButton}
              onClick={handleDelete}
              disabled={!isDeleteConfirmed || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;
