import { Link } from 'react-router-dom';
import styles from './Payments.module.scss';

const STEPS = [
  {
    number: '1',
    title: 'A member books or subscribes',
    description:
      'Whether it\'s a day pass, a PT session, or a monthly membership, your members pay through your branded gym website. It looks and feels like your business — because it is.',
  },
  {
    number: '2',
    title: 'Payment goes straight to your account',
    description:
      'Money is deposited directly into your bank account via Stripe, the same payment platform used by Amazon, Shopify, and millions of businesses worldwide. We never hold your funds.',
  },
  {
    number: '3',
    title: 'A small platform fee is taken automatically',
    description:
      'No Sweat takes a small percentage from each transaction to keep the platform running. You\'ll always see exactly what was charged and what landed in your account. No hidden fees, no surprises.',
  },
];

const PAYMENT_TYPES = [
  {
    title: 'Day Passes',
    description: 'One-off payments for drop-in sessions. Members pay, you get paid, they get a confirmed booking. Simple.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h2M12 15h5" />
      </svg>
    ),
  },
  {
    title: 'Monthly Memberships',
    description: 'Recurring payments that bill automatically every month. Members subscribe once and you get steady, predictable income without chasing invoices.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: 'PT & Coaching Sessions',
    description: 'Your coaches set their rates, members book and pay online. The money flows to your gym account automatically — no cash in hand, no awkward conversations.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: 'Free Trials',
    description: 'Let new members try before they buy. We collect their card details securely upfront so you can convert them to paying members seamlessly after the trial ends.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const TRUST_POINTS = [
  {
    title: 'Bank-level security',
    description: 'All payments are processed by Stripe, which is PCI DSS Level 1 certified — the highest level of security in the payments industry. Card details never touch our servers.',
  },
  {
    title: 'Transparent fees',
    description: 'You see every transaction, every fee, and every payout in your Stripe dashboard. No hidden charges, no markups on payment processing. What you see is what you get.',
  },
  {
    title: 'Instant setup',
    description: 'Connect your bank account in minutes through Stripe\'s secure onboarding. Once verified, you can start accepting payments the same day.',
  },
  {
    title: 'You\'re always in control',
    description: 'Your Stripe account belongs to you. View payouts, download reports, issue refunds, and manage everything from your own Stripe dashboard — independent of No Sweat.',
  },
];

const Payments = () => {
  return (
    <div className={styles.paymentsPage}>
      {/* Hero */}
      <section className={styles.paymentsHero}>
        <div className={styles.paymentsHeroContent}>
          <div className={styles.paymentsHeroBadge}>
            <span className={styles.paymentsHeroBadgeDot} />
            Powered by Stripe
          </div>
          <h1 className={styles.paymentsHeroHeadline}>
            Get paid. Without the headache.
          </h1>
          <p className={styles.paymentsHeroSubtitle}>
            Every payment from your members goes directly to your bank account.
            No invoicing, no chasing, no spreadsheets. Just money in your account
            while you focus on running your gym.
          </p>
          <div className={styles.paymentsHeroCtas}>
            <Link to="/signup" className={styles.paymentsCtaPrimary}>
              Start Getting Paid
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/guide" className={styles.paymentsCtaSecondary}>
              See All Features
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.paymentsSection}>
        <div className={styles.paymentsInner}>
          <h2 className={styles.paymentsSectionTitle}>How you get paid</h2>
          <p className={styles.paymentsSectionSubtitle}>
            Three steps. That's it. No accounting degree required.
          </p>

          <div className={styles.stepsContainer}>
            {STEPS.map((step) => (
              <div key={step.number} className={styles.stepCard}>
                <div className={styles.stepCardNumber}>{step.number}</div>
                <h3 className={styles.stepCardTitle}>{step.title}</h3>
                <p className={styles.stepCardDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment types */}
      <section className={styles.paymentTypesSection}>
        <div className={styles.paymentsInner}>
          <h2 className={styles.paymentsSectionTitle}>Every way your gym makes money</h2>
          <p className={styles.paymentsSectionSubtitle}>
            All built in. All automatic. All going straight to your bank.
          </p>

          <div className={styles.paymentTypesGrid}>
            {PAYMENT_TYPES.map((type) => (
              <div key={type.title} className={styles.paymentTypeCard}>
                <div className={styles.paymentTypeIcon}>{type.icon}</div>
                <h3 className={styles.paymentTypeTitle}>{type.title}</h3>
                <p className={styles.paymentTypeDescription}>{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className={styles.paymentsSection}>
        <div className={styles.paymentsInner}>
          <h2 className={styles.paymentsSectionTitle}>Your money. Your control.</h2>
          <p className={styles.paymentsSectionSubtitle}>
            We built payments on Stripe so you never have to worry about security,
            compliance, or where your money is.
          </p>

          <div className={styles.trustGrid}>
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className={styles.trustCard}>
                <h3 className={styles.trustCardTitle}>{point.title}</h3>
                <p className={styles.trustCardDescription}>{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.paymentTypesSection}>
        <div className={styles.paymentsInner}>
          <h2 className={styles.paymentsSectionTitle}>Common questions</h2>

          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>How quickly do I get my money?</h3>
              <p className={styles.faqAnswer}>
                Stripe typically deposits funds into your bank account within 2-3 business days.
                You can track every payout in real-time from your Stripe dashboard.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What does it cost me?</h3>
              <p className={styles.faqAnswer}>
                No Sweat takes a small platform fee on each transaction (visible in your admin settings).
                Stripe also charges their standard processing fee (1.5% + 20p for UK cards).
                There are no hidden charges or monthly payment fees on top of your No Sweat subscription.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Do I need a Stripe account already?</h3>
              <p className={styles.faqAnswer}>
                Nope. When you're ready to accept payments, just click "Connect Stripe Account"
                in your gym admin panel. We'll walk you through creating and verifying your account
                in a few minutes. All you need is your bank details and some basic business info.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Can my members pay with Apple Pay or Google Pay?</h3>
              <p className={styles.faqAnswer}>
                Yes. Stripe automatically supports Apple Pay, Google Pay, and all major debit and
                credit cards. Your members can pay however is easiest for them.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>What happens if a member wants a refund?</h3>
              <p className={styles.faqAnswer}>
                You can issue refunds directly from your Stripe dashboard or through
                the No Sweat admin panel. The refund goes back to the member's original
                payment method automatically.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>Is this safe for my members?</h3>
              <p className={styles.faqAnswer}>
                Absolutely. Card details are handled entirely by Stripe and never pass through
                our servers. Stripe protects billions of pounds in payments every year for
                companies like Amazon, Google, and Deliveroo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.paymentsSection}>
        <div className={styles.paymentsCta}>
          <h2 className={styles.paymentsCtaHeadline}>
            Ready to stop chasing payments?
          </h2>
          <p className={styles.paymentsCtaSubtitle}>
            Sign up, connect Stripe, and start getting paid today.
            Your first gym site is free to set up.
          </p>
          <Link to="/signup" className={styles.paymentsCtaPrimary}>
            Get Started Free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Payments;
