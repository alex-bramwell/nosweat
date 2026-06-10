import { useMemo } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import styles from './CardFields.module.scss';

/**
 * Custom-styled, split card inputs (number / expiry / CVC) built on Stripe
 * Elements. Each field is an individual Stripe-secured input, so card data
 * never touches our DOM (stays PCI SAQ A) while the layout, labels and chrome
 * are our own. Must be rendered inside a Stripe <Elements> provider; the parent
 * confirms with stripe.confirmCardPayment/confirmCardSetup using
 * elements.getElement(CardNumberElement).
 */
export const CardFields: React.FC = () => {
  // Stripe Element text renders inside an iframe and can't read CSS variables,
  // so resolve the current theme's concrete values once at mount.
  const elementOptions = useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
    return {
      style: {
        base: {
          color: v('--color-text', '#1a1a2e'),
          fontFamily: v('--font-body', "'Inter', system-ui, sans-serif"),
          fontSize: '16px',
          fontSmoothing: 'antialiased',
          '::placeholder': { color: v('--color-muted', '#8b8b9e') },
        },
        invalid: { color: '#e5424d' },
      },
    };
  }, []);

  return (
    <div className={styles.cardFields}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Card number</span>
        <div className={styles.fieldInput}>
          <CardNumberElement options={{ ...elementOptions, showIcon: true }} />
        </div>
      </label>

      <div className={styles.fieldRow}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Expiry</span>
          <div className={styles.fieldInput}>
            <CardExpiryElement options={elementOptions} />
          </div>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>CVC</span>
          <div className={styles.fieldInput}>
            <CardCvcElement options={elementOptions} />
          </div>
        </label>
      </div>
    </div>
  );
};

export default CardFields;
