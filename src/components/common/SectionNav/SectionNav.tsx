import { useState } from 'react';
import styles from './SectionNav.module.scss';

export interface SectionNavItem {
  id: string;
  label: string;
  /** Inline variant only: render a check instead of a dot and strike the label. */
  done?: boolean;
}

interface SectionNavProps {
  items: SectionNavItem[];
  /** The id of the currently active item (highlighted). Optional for the
   *  inline checklist variant, where items are tracked by `done` instead. */
  activeId?: string;
  /** Called when an item is chosen. The parent decides what that means
   *  (scroll to a section, switch a tab, jump to a setup step, etc.). */
  onSelect: (id: string) => void;
  /** Heading shown above the list. */
  title?: string;
  /**
   * 'floating' (default): a fixed, sticky left-edge navigator that expands on
   * hover (desktop) or slides in (mobile) - for long scroll pages.
   * 'inline': a static panel that sits in the page flow - for checklists.
   */
  variant?: 'floating' | 'inline';
  /** Inline variant only: content shown at the right of the header (e.g. progress). */
  meta?: React.ReactNode;
}

const Check = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * A section/step navigator with a shared dotted-list look. Use the floating
 * variant for scroll pages (pair with useScrollSpy) and the inline variant for
 * a checklist-style panel. Theme-adaptive via --color-* tokens.
 */
export const SectionNav: React.FC<SectionNavProps> = ({
  items,
  activeId,
  onSelect,
  title = 'Sections',
  variant = 'floating',
  meta,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className={styles.inlinePanel}>
        {(title || meta) && (
          <div className={styles.inlineHeader}>
            <span className={styles.inlineTitle}>{title}</span>
            {meta && <span className={styles.inlineMeta}>{meta}</span>}
          </div>
        )}
        <div className={styles.inlineList}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`${styles.inlineLink} ${item.done ? styles.inlineLinkDone : ''} ${
                activeId === item.id ? styles.inlineLinkActive : ''
              }`}
            >
              <span className={`${styles.indicator} ${item.done ? styles.indicatorDone : ''}`}>
                {item.done && <Check />}
              </span>
              <span className={styles.inlineLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label={title}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close navigation">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`${styles.link} ${activeId === item.id ? styles.linkActive : ''}`}
          >
            <span className={styles.dot} />
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        className={`${styles.toggle} ${open ? styles.toggleHidden : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open section navigation"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </>
  );
};

export default SectionNav;
