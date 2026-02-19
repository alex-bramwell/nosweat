import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DOCS_SECTIONS,
  DOCS_NAV_ITEMS,
  type CalloutType,
} from '../../components/docs/docsData';
import { ILLUSTRATIONS } from '../../components/guide/GuideIllustrations';
import styles from './Docs.module.scss';

/* ── Callout icon SVGs ── */
const CALLOUT_ICONS: Record<CalloutType, JSX.Element> = {
  tip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v1M12 21v1M4.22 4.22l.7.7M18.36 18.36l.7.7M1 12h1M21 12h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const CALLOUT_LABELS: Record<CalloutType, string> = {
  tip: 'Tip',
  note: 'Note',
  warning: 'Warning',
};

/* ── Helper: find topic title by id ── */
const topicTitleById = (id: string): string | undefined => {
  for (const section of DOCS_SECTIONS) {
    for (const topic of section.topics) {
      if (topic.id === id) return topic.title;
    }
  }
  return undefined;
};

const Docs = () => {
  const [activeTopic, setActiveTopic] = useState<string>(
    DOCS_SECTIONS[0].topics[0].id,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const topicRefs = useRef<Record<string, HTMLElement | null>>({});

  /* IntersectionObserver — highlight sidebar link for visible topic */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTopic(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    const refs = topicRefs.current;
    for (const id of Object.keys(refs)) {
      const el = refs[id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const assignRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      topicRefs.current[id] = el;
    },
    [],
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setSidebarOpen(false);
  };

  return (
    <div className={styles.docsPage}>
      {/* ── Header ── */}
      <header className={styles.docsHeader}>
        <h1 className={styles.docsTitle}>Documentation</h1>
        <p className={styles.docsSubtitle}>
          Step-by-step guides for every feature on the platform.
        </p>
      </header>

      {/* ── Mobile sidebar toggle ── */}
      <button
        className={`${styles.mobileSidebarToggle} ${sidebarOpen ? styles.mobileSidebarToggleHidden : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* ── Sidebar backdrop (mobile) ── */}
      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={styles.docsGrid}>
        {/* ── Sidebar ── */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarMobileHeader}>
            <span className={styles.sidebarHeading}>Navigation</span>
            <button
              className={styles.sidebarClose}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className={styles.sidebarNav}>
            {DOCS_NAV_ITEMS.map((section) => (
              <div key={section.sectionId} className={styles.sidebarSection}>
                <span className={styles.sidebarSectionTitle}>
                  {section.sectionTitle}
                </span>
                {section.topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => scrollTo(topic.id)}
                    className={`${styles.sidebarLink} ${activeTopic === topic.id ? styles.sidebarLinkActive : ''}`}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className={styles.content}>
          {DOCS_SECTIONS.map((section) =>
            section.topics.map((topic) => {
              const Illustration = ILLUSTRATIONS[topic.illustrationKey];

              return (
                <article
                  key={topic.id}
                  id={topic.id}
                  ref={assignRef(topic.id)}
                  className={styles.topicArticle}
                >
                  <h2 className={styles.topicTitle}>{topic.title}</h2>
                  <p className={styles.topicSummary}>{topic.summary}</p>

                  {/* Illustration */}
                  {Illustration && (
                    <div className={styles.topicIllustration}>
                      <Illustration />
                    </div>
                  )}

                  {/* Steps */}
                  <ol className={styles.stepsList}>
                    {topic.steps.map((step, idx) => (
                      <li key={idx} className={styles.step}>
                        <span className={styles.stepNumber}>{idx + 1}</span>
                        <div className={styles.stepContent}>
                          <span className={styles.stepText}>{step.text}</span>
                          {step.detail && (
                            <span className={styles.stepDetail}>{step.detail}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* Callouts */}
                  {topic.callouts?.map((callout, idx) => {
                    const typeClass =
                      callout.type === 'tip'
                        ? styles.calloutTip
                        : callout.type === 'note'
                          ? styles.calloutNote
                          : styles.calloutWarning;

                    return (
                      <div
                        key={idx}
                        className={`${styles.callout} ${typeClass}`}
                      >
                        <span className={styles.calloutIcon}>
                          {CALLOUT_ICONS[callout.type]}
                        </span>
                        <div className={styles.calloutBody}>
                          <span className={styles.calloutLabel}>
                            {CALLOUT_LABELS[callout.type]}
                          </span>
                          <p className={styles.calloutText}>{callout.text}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* External Links */}
                  {topic.externalLinks && topic.externalLinks.length > 0 && (
                    <div className={styles.externalLinks}>
                      <span className={styles.relatedLabel}>Resources:</span>
                      {topic.externalLinks.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.externalLink}
                        >
                          {link.label}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Related Topics */}
                  {topic.relatedTopics && topic.relatedTopics.length > 0 && (
                    <div className={styles.relatedTopics}>
                      <span className={styles.relatedLabel}>Related:</span>
                      {topic.relatedTopics.map((relId) => {
                        const title = topicTitleById(relId);
                        if (!title) return null;
                        return (
                          <button
                            key={relId}
                            className={styles.relatedLink}
                            onClick={() => scrollTo(relId)}
                          >
                            {title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};

export default Docs;
