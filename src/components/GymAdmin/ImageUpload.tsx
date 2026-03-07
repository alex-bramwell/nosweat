import { useState, useRef } from 'react';
import { uploadGymAsset, type AssetType } from '../../lib/storage';
import styles from './ImageUpload.module.scss';

interface ImageUploadProps {
  label: string;
  description: string;
  value: string;
  gymId: string;
  assetType: AssetType;
  onUpload: (url: string) => void;
  onRemove: () => void;
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  description,
  value,
  gymId,
  assetType,
  onUpload,
  onRemove,
  accept = 'image/*',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gymId) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { url } = await uploadGymAsset(gymId, assetType, file);
      onUpload(url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.imageUpload}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        <span className={styles.description}>{description}</span>
      </div>

      {value ? (
        <div className={styles.preview}>
          <img src={value} alt={label} className={styles.previewImage} />
          <div className={styles.previewActions}>
            <button type="button" className={styles.changeButton} onClick={handleClick} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Change'}
            </button>
            <button type="button" className={styles.removeButton} onClick={onRemove}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.uploadArea} onClick={handleClick} disabled={isUploading}>
          {isUploading ? (
            <span className={styles.uploadText}>Uploading...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.uploadIcon}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className={styles.uploadText}>Click to upload</span>
              <span className={styles.uploadHint}>PNG, JPG, SVG up to 5MB</span>
            </>
          )}
        </button>
      )}

      {error && <span className={styles.error}>{error}</span>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload;
