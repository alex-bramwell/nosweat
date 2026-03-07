import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';
import { getLocalizedPrice } from '../../utils/pricing';
import styles from './PlatformSubscribe.module.scss';

const PlatformSubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const userId = searchParams.get('uid') || '';
  const price = useMemo(() => getLocalizedPrice(), []);
  const [error, setError] = useState('');

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/subscriptions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: price.stripePriceId,
        email,
        userId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to create checkout session');
    }

    const data = await res.json();
    return data.clientSecret;
  }, [price.stripePriceId, email, userId]);

  if (!stripePromise) {
    return (
      <div className={styles.platformSubscribePage}>
        <div className={styles.subscribeResultCard}>
          <div className={styles.subscribeErrorBanner}>
            Payment system is not configured. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.platformSubscribePage}>
      <div className={styles.subscribeInner}>
        <div className={styles.subscribeHeader}>
          <h1 className={styles.subscribeHeadline}>Start your subscription</h1>
          <p className={styles.subscribeTagline}>
            {price.formatted}<span className={styles.period}>{price.period}</span>
            {' '}&mdash; cancel any time
          </p>
        </div>

        {error && <div className={styles.subscribeErrorBanner}>{error}</div>}

        <div className={styles.checkoutWrapper}>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
              fetchClientSecret,
              onComplete: () => setError(''),
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
};

const SubscribeComplete = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [customerEmail, setCustomerEmail] = useState('');

  useState(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    fetch(`/api/subscriptions/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'complete') {
          setStatus('success');
          setCustomerEmail(data.customerEmail || '');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  });

  return (
    <div className={styles.platformSubscribePage}>
      <div className={styles.subscribeResultCard}>
        {status === 'loading' && (
          <p className={styles.subscribeTagline}>Confirming your subscription...</p>
        )}

        {status === 'success' && (
          <>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className={styles.subscribeHeadline}>You&apos;re in!</h1>
            <p className={styles.subscribeTagline}>
              Confirmation sent to <strong>{customerEmail}</strong>
            </p>
            <Link to="/onboarding" className={styles.ctaButton}>
              Set up your gym
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className={styles.subscribeHeadline}>Something went wrong</h1>
            <p className={styles.subscribeTagline}>
              We couldn&apos;t confirm your subscription. Please contact support.
            </p>
            <Link to="/signup" className={styles.ctaButton}>
              Try again
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export { SubscribeComplete };
export default PlatformSubscribe;
