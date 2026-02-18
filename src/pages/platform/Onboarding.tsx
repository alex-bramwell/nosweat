import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FEATURES } from '../../config/features';
import type { FeatureKey } from '../../types/tenant';
import styles from './Onboarding.module.scss';

type Step = 1 | 2 | 3 | 4;

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [gymId, setGymId] = useState<string | null>(null);

  // Step 1: Gym Name & Slug
  const [gymName, setGymName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Step 2: Branding
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [borderRadius, setBorderRadius] = useState(8);

  // Step 3: Features
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);

  // Step 4: Launch state
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUserId(user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  // Auto-generate slug from gym name
  useEffect(() => {
    if (gymName) {
      const generatedSlug = gymName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      setSlug(generatedSlug);
      setSlugAvailable(null); // Reset availability check
    }
  }, [gymName]);

  // Check slug availability
  const checkSlugAvailability = async () => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows returned - slug is available
        setSlugAvailable(true);
      } else if (data) {
        // Slug already exists
        setSlugAvailable(false);
      }
    } catch (err) {
      console.error('Error checking slug:', err);
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (slug) {
        checkSlugAvailability();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  // Step 1: Create Gym
  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!slugAvailable) {
      setError('Please choose an available gym URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Create the gym
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({
          name: gymName,
          slug,
          owner_id: userId,
          status: 'onboarding',
        })
        .select()
        .single();

      if (gymError) throw gymError;

      const createdGymId = gymData.id;
      setGymId(createdGymId);

      // Create default branding record
      const { error: brandingError } = await supabase.from('gym_branding').insert({
        gym_id: createdGymId,
        color_accent: primaryColor,
        theme_mode: themeMode,
        border_radius: `${borderRadius / 16}rem`,
      });

      if (brandingError) throw brandingError;

      // Update user profile with gym_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ gym_id: createdGymId })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Move to next step
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Error creating gym:', err);
      setError(err.message || 'Failed to create gym. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Update Branding
  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: brandingError } = await supabase
        .from('gym_branding')
        .update({
          color_accent: primaryColor,
          theme_mode: themeMode,
          border_radius: `${borderRadius / 16}rem`,
        })
        .eq('gym_id', gymId);

      if (brandingError) throw brandingError;

      setCurrentStep(3);
    } catch (err: any) {
      console.error('Error updating branding:', err);
      setError(err.message || 'Failed to update branding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save Features
  const handleStep3Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Insert selected features
      if (selectedFeatures.length > 0) {
        const featureInserts = selectedFeatures.map((key) => ({
          gym_id: gymId,
          feature_key: key,
          enabled: true,
          enabled_at: new Date().toISOString(),
          monthly_cost_pence: 1000,
        }));

        const { error: featuresError } = await supabase
          .from('gym_features')
          .insert(featureInserts);

        if (featuresError) throw featuresError;
      }

      setCurrentStep(4);
    } catch (err: any) {
      console.error('Error saving features:', err);
      setError(err.message || 'Failed to save features. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Launch
  const handleLaunch = async () => {
    setError('');
    setLaunching(true);

    try {
      // Update gym status to active
      const { error: updateError } = await supabase
        .from('gyms')
        .update({ status: 'active' })
        .eq('id', gymId);

      if (updateError) throw updateError;

      setLaunched(true);
    } catch (err: any) {
      console.error('Error launching gym:', err);
      setError(err.message || 'Failed to launch gym. Please try again.');
    } finally {
      setLaunching(false);
    }
  };

  const toggleFeature = (key: FeatureKey) => {
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const totalMonthlyCost = selectedFeatures.length * 10;

  return (
    <div className={styles.onboarding}>
      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progress}>
          <div className={styles.progressSteps}>
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`${styles.progressStep} ${
                  step <= currentStep ? styles.progressStepActive : ''
                }`}
              >
                <div className={styles.progressStepNumber}>{step}</div>
                <div className={styles.progressStepLabel}>
                  {step === 1 && 'Name'}
                  {step === 2 && 'Brand'}
                  {step === 3 && 'Features'}
                  {step === 4 && 'Launch'}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className={styles.stepContent}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Step 1: Name Your Gym */}
          {currentStep === 1 && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Name Your Gym</h1>
              <p className={styles.stepDescription}>
                Choose a name and URL for your gym website.
              </p>

              <form onSubmit={handleStep1Submit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="gymName" className={styles.label}>
                    Gym Name
                  </label>
                  <input
                    id="gymName"
                    type="text"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    required
                    className={styles.input}
                    placeholder="My Awesome Gym"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="slug" className={styles.label}>
                    Your Website URL
                  </label>
                  <div className={styles.slugInput}>
                    <span className={styles.slugSuffix}>nosweat.fitness/gym/</span>
                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      required
                      className={styles.input}
                      placeholder="my-awesome-gym"
                    />
                  </div>
                  {checkingSlug && (
                    <p className={styles.slugStatus}>Checking availability...</p>
                  )}
                  {!checkingSlug && slugAvailable === true && (
                    <p className={styles.slugAvailable}>✓ URL is available</p>
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <p className={styles.slugUnavailable}>
                      ✗ This URL is already taken. Try another.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !slugAvailable}
                  className={styles.submitButton}
                >
                  {loading ? 'Creating...' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Brand Your Gym */}
          {currentStep === 2 && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Brand Your Gym</h1>
              <p className={styles.stepDescription}>
                Customize your gym's look and feel. You can always change this later.
              </p>

              <form onSubmit={handleStep2Submit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="primaryColor" className={styles.label}>
                    Primary Color
                  </label>
                  <div className={styles.colorPickerWrapper}>
                    <input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className={styles.colorPicker}
                    />
                    <span className={styles.colorValue}>{primaryColor}</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Theme Mode</label>
                  <div className={styles.toggleGroup}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${
                        themeMode === 'light' ? styles.toggleButtonActive : ''
                      }`}
                      onClick={() => setThemeMode('light')}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${
                        themeMode === 'dark' ? styles.toggleButtonActive : ''
                      }`}
                      onClick={() => setThemeMode('dark')}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="borderRadius" className={styles.label}>
                    Border Radius: {borderRadius}px
                  </label>
                  <input
                    id="borderRadius"
                    type="range"
                    min="0"
                    max="24"
                    step="2"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={styles.backButton}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                  >
                    {loading ? 'Saving...' : 'Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={styles.skipButton}
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Choose Your Features */}
          {currentStep === 3 && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Choose Your Features</h1>
              <p className={styles.stepDescription}>
                Select the features you need. £10/month per feature. You can add or remove
                features anytime.
              </p>

              <form onSubmit={handleStep3Submit} className={styles.form}>
                <div className={styles.featuresGrid}>
                  {FEATURES.map((feature) => (
                    <label key={feature.key} className={styles.featureCard}>
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature.key)}
                        onChange={() => toggleFeature(feature.key)}
                        className={styles.featureCheckbox}
                      />
                      <div className={styles.featureIcon}>{feature.icon}</div>
                      <h3 className={styles.featureName}>{feature.name}</h3>
                      <p className={styles.featureDescription}>{feature.description}</p>
                      <p className={styles.featurePrice}>£10/month</p>
                    </label>
                  ))}
                </div>

                <div className={styles.costSummary}>
                  <span className={styles.costLabel}>Total monthly cost:</span>
                  <span className={styles.costAmount}>£{totalMonthlyCost}</span>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={styles.backButton}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.submitButton}
                  >
                    {loading ? 'Saving...' : 'Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className={styles.skipButton}
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Preview & Launch */}
          {currentStep === 4 && !launched && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Preview & Launch</h1>
              <p className={styles.stepDescription}>
                You're all set! Review your setup and launch your gym.
              </p>

              <div className={styles.summary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Gym Name:</span>
                  <span className={styles.summaryValue}>{gymName}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Website URL:</span>
                  <span className={styles.summaryValue}>
                    nosweat.fitness/gym/{slug}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Features:</span>
                  <span className={styles.summaryValue}>
                    {selectedFeatures.length} feature
                    {selectedFeatures.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Monthly Cost:</span>
                  <span className={styles.summaryValue}>£{totalMonthlyCost}</span>
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={styles.backButton}
                >
                  Back
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className={styles.launchButton}
                >
                  {launching ? 'Launching...' : 'Launch Your Gym'}
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {launched && (
            <div className={styles.success}>
              <div className={styles.successAnimation}>🎉</div>
              <h1 className={styles.successTitle}>Your gym is live!</h1>
              <p className={styles.successDescription}>
                Congratulations! Your gym website is now active and ready for members.
              </p>
              <div className={styles.successUrl}>
                <strong>Your website:</strong>
                <br />
                nosweat.fitness/gym/{slug}
              </div>
              <a
                href={`/gym/${slug}`}
                className={styles.visitButton}
              >
                Visit Your Site
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
