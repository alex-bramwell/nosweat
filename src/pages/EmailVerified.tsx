import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Section, Container, Button } from '../components/common';
import styles from './EmailVerified.module.scss';

const EmailVerified = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if there's an error in the URL params
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      setStatus('error');
      setErrorMessage(errorDescription || 'An error occurred during verification');
      return;
    }

    // Check if verification was successful
    const type = searchParams.get('type');
    if (type === 'signup') {
      setStatus('success');
    } else {
      // If no type parameter, assume verification is in progress
      setTimeout(() => {
        setStatus('success');
      }, 1500);
    }
  }, [searchParams]);

  const handleSignIn = () => {
    navigate('/?signin=true');
  };

  return (
    <Section spacing="large" background="default">
      <Container>
        <div className={styles.container}>
          {status === 'verifying' && (
            <div className={styles.content}>
              <div className={styles.spinner}>
                <svg viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                </svg>
              </div>
              <h1 className={styles.title}>Verifying your email...</h1>
              <p className={styles.message}>Please wait while we confirm your account.</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.content}>
              <div className={styles.successIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className={styles.title}>Email Verified Successfully!</h1>
              <p className={styles.message}>
                Your email has been verified. You can now sign in to your account and start your CrossFit Comet journey.
              </p>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>Access Your Dashboard</h3>
                    <p>View your progress and track your workouts</p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>Book Classes</h3>
                    <p>Reserve your spot in upcoming sessions</p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className={styles.featureText}>
                    <h3>Join the Community</h3>
                    <p>Connect with fellow athletes and coaches</p>
                  </div>
                </div>
              </div>
              <Button variant="primary" size="large" onClick={handleSignIn}>
                Sign In Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.content}>
              <div className={styles.errorIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h1 className={styles.title}>Verification Failed</h1>
              <p className={styles.message}>
                {errorMessage || 'We encountered an error verifying your email. This link may have expired or already been used.'}
              </p>
              <div className={styles.helpSection}>
                <h3>What can you do?</h3>
                <ul>
                  <li>Try signing in - your account may already be verified</li>
                  <li>Request a new verification email from the sign-in page</li>
                  <li>Contact our support team for assistance</li>
                </ul>
              </div>
              <div className={styles.actions}>
                <Button variant="primary" onClick={handleSignIn}>
                  Go to Sign In
                </Button>
                <Button variant="secondary" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
};

export default EmailVerified;
