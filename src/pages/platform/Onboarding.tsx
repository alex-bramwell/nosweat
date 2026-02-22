import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import styles from './Onboarding.module.scss';

type Step = 1 | 2;

const ALL_FEATURE_KEYS = [
  'class_booking',
  'wod_programming',
  'coach_profiles',
  'day_passes',
  'trial_memberships',
  'service_booking',
  'accounting_integration',
  'coach_analytics',
  'member_management',
] as const;

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1: Your Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Your Gym
  const [gymName, setGymName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('GB');
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London'
  );

  // General state
  const [launched, setLaunched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check auth and resume progress
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUserId(user.id);

      // Check if profile already has details filled (resume from Step 2)
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .single();

      if (profile?.first_name && profile?.last_name) {
        setFirstName(profile.first_name);
        setLastName(profile.last_name);
        setPhone(profile.phone || '');
        setCurrentStep(2);
      }
    };
    checkAuth();
  }, [navigate]);

  // Auto-generate slug from gym name
  useEffect(() => {
    if (gymName) {
      const generatedSlug = gymName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setSlug(generatedSlug);
      setSlugAvailable(null);
    }
  }, [gymName]);

  // Check slug availability (debounced)
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const { data, error: slugError } = await supabase
          .from('gyms')
          .select('id')
          .eq('slug', slug)
          .single();

        if (slugError && slugError.code === 'PGRST116') {
          setSlugAvailable(true);
        } else if (data) {
          setSlugAvailable(false);
        }
      } catch (err) {
        console.error('Error checking slug:', err);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  // Step 1: Save personal details
  const handleStep1Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim() || null,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      setCurrentStep(2);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create gym with trial
  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!gymName.trim()) {
      setError('Please enter a gym name.');
      return;
    }
    if (!slugAvailable) {
      setError('Please choose an available gym URL.');
      return;
    }
    if (slug.length < 2) {
      setError('Your gym URL must be at least 2 characters.');
      return;
    }
    if (!addressLine1.trim() || !city.trim() || !postcode.trim()) {
      setError('Please fill in your gym address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Re-check slug to avoid race conditions
      const { data: existingGym } = await supabase
        .from('gyms')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingGym) {
        setSlugAvailable(false);
        setError('That URL was just taken. Please choose a different one.');
        setLoading(false);
        return;
      }

      // 1. Create gym with trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({
          name: gymName.trim(),
          slug,
          owner_id: userId,
          status: 'active',
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || null,
          city: city.trim(),
          postcode: postcode.trim(),
          country,
          timezone,
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEnd.toISOString(),
          trial_member_limit: 5,
          trial_status: 'active',
        })
        .select()
        .single();

      if (gymError) throw gymError;

      const createdGymId = gymData.id;

      // 2. Create default branding record
      const { error: brandingError } = await supabase.from('gym_branding').insert({
        gym_id: createdGymId,
      });
      if (brandingError) throw brandingError;

      // 3. Enable ALL features for trial
      const featureInserts = ALL_FEATURE_KEYS.map((key) => ({
        gym_id: createdGymId,
        feature_key: key,
        enabled: true,
        enabled_at: new Date().toISOString(),
        monthly_cost_pence: 1000,
      }));

      const { error: featuresError } = await supabase
        .from('gym_features')
        .insert(featureInserts);
      if (featuresError) throw featuresError;

      // 4. Link profile to gym
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ gym_id: createdGymId })
        .eq('id', userId);
      if (profileError) throw profileError;

      setSlug(gymData.slug);
      setLaunched(true);
    } catch (err: any) {
      console.error('Error creating gym:', err);

      if (err.code === '23505' && err.message?.includes('gyms_slug_key')) {
        setSlugAvailable(false);
        setError('That URL was just taken. Please choose a different one.');
      } else if (err.code === '42501' || err.message?.includes('permission denied')) {
        setError('Permission denied. Please log out and log back in, then try again.');
      } else if (err.message?.includes('infinite recursion')) {
        setError('A database configuration issue was detected. Please contact support.');
      } else {
        setError(err.message || 'Failed to create gym. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.onboarding}>
      <div className={styles.container}>
        {/* Progress Bar */}
        {!launched && (
          <div className={styles.progress}>
            <div className={styles.progressSteps}>
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`${styles.progressStep} ${
                    step <= currentStep ? styles.progressStepActive : ''
                  }`}
                >
                  <div className={styles.progressStepNumber}>{step}</div>
                  <div className={styles.progressStepLabel}>
                    {step === 1 && 'Your Details'}
                    {step === 2 && 'Your Gym'}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className={styles.stepContent}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Step 1: Your Details */}
          {currentStep === 1 && !launched && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Your Details</h1>
              <p className={styles.stepDescription}>
                Tell us a bit about yourself to get started.
              </p>

              <form onSubmit={handleStep1Submit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="firstName" className={styles.label}>
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className={styles.input}
                      placeholder="John"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lastName" className={styles.label}>
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className={styles.input}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Phone Number <span className={styles.labelOptional}>(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                    placeholder="+44 7123 456789"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Your Gym */}
          {currentStep === 2 && !launched && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Your Gym</h1>
              <p className={styles.stepDescription}>
                Set up your gym's basic details. You can customise branding and features later.
              </p>

              <form onSubmit={handleStep2Submit} className={styles.form}>
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

                <div className={styles.formGroup}>
                  <label htmlFor="addressLine1" className={styles.label}>
                    Address
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className={styles.input}
                    placeholder="123 High Street"
                  />
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className={styles.input}
                    placeholder="Unit 4 (optional)"
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="city" className={styles.label}>
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className={styles.input}
                      placeholder="London"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="postcode" className={styles.label}>
                      Postcode
                    </label>
                    <input
                      id="postcode"
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      required
                      className={styles.input}
                      placeholder="SW1A 1AA"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country" className={styles.label}>
                    Country
                  </label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={styles.input}
                  >
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="NZ">New Zealand</option>
                    <option value="IE">Ireland</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="PT">Portugal</option>
                  </select>
                </div>

                <div className={styles.timezoneDisplay}>
                  <span className={styles.timezoneLabel}>Timezone</span>
                  <span className={styles.timezoneValue}>{timezone.replace(/_/g, ' ')}</span>
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
                    disabled={loading || !slugAvailable}
                    className={styles.submitButton}
                  >
                    {loading ? 'Creating...' : 'Create My Gym'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success State */}
          {launched && (
            <div className={styles.success}>
              <div className={styles.successAnimation}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className={styles.successTitle}>Your gym is ready!</h1>
              <p className={styles.successDescription}>
                Your 14-day free trial has started. You have full access to all features
                and can invite up to 5 members.
              </p>
              <div className={styles.successUrl}>
                <strong>Your gym URL:</strong>
                <br />
                nosweat.fitness/gym/{slug}
              </div>
              <a
                href="/dashboard"
                className={styles.visitButton}
              >
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
