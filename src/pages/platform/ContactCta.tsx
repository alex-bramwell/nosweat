import { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, Button, modalStyles as m } from '../../components/common';
import styles from './PlatformHome.module.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

const MessageIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

interface ContactCtaProps {
  missionRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const ContactCta = ({ missionRef, isOpen, onOpen, onClose }: ContactCtaProps) => {
  const [floating, setFloating] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Watch mission section visibility
  useEffect(() => {
    const el = missionRef.current;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setFloating(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [missionRef]);

  const openModal = useCallback(() => {
    setSent(false);
    onOpen();
  }, [onOpen]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }

      setSent(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating action button */}
      <button
        className={`${styles.contactFab} ${floating && !isOpen ? styles.contactFabVisible : ''}`}
        onClick={openModal}
        aria-label="Get in touch"
      >
        <MessageIcon />
      </button>

      {/* Modal - uses the same common Modal component as login/auth */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className={m.modalBody}>
          <div className={m.modalHeader}>
            <h2 className={m.modalTitle}>Get in touch</h2>
            <p className={m.modalSubtitle}>
              Have a question about No Sweat? Want to see a demo? Drop us a message and we will get back to you.
            </p>
          </div>

          {sent ? (
            <div className={styles.contactSent}>
              <div className={styles.contactSentIcon}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4 className={styles.contactSentTitle}>Message sent</h4>
              <p className={styles.contactSentText}>
                We will get back to you as soon as possible.
              </p>
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <form className={m.modalForm} onSubmit={handleSubmit}>
              <div className={m.modalFieldGroup}>
                <label className={m.modalFieldLabel} htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  className={m.modalInput}
                  type="text"
                  required
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className={m.modalFieldGroup}>
                <label className={m.modalFieldLabel} htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  className={m.modalInput}
                  type="email"
                  required
                  placeholder="you@gym.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className={m.modalFieldGroup}>
                <label className={m.modalFieldLabel} htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  className={`${m.modalInput} ${m.modalTextarea}`}
                  required
                  placeholder="Tell us about your gym and what you need..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
              {error && <div className={m.modalError}>{error}</div>}
              <Button type="submit" disabled={sending} fullWidth>
                {sending ? 'Sending...' : 'Send message'}
                {!sending && <SendIcon />}
              </Button>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ContactCta;
