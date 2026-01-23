import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoTooltip.module.scss';

export interface InfoTooltipProps {
  content: string;
  className?: string;
}

// Color mappings for keywords
const colorKeywords: Record<string, string> = {
  // Status colors
  'green': 'green',
  'yellow': 'yellow',
  'red': 'red',
  'blue': 'blue',
  // Positive keywords
  'balanced': 'green',
  'positive': 'green',
  'increase': 'green',
  // Warning keywords
  'underused': 'yellow',
  'warning': 'yellow',
  'improve': 'yellow',
  // Negative keywords
  'overused': 'red',
  'decrease': 'red',
  'too much': 'red',
  // Info keywords
  'actionable': 'blue',
};

// Parse content and replace color keywords with styled pills
const parseContent = (content: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let keyIndex = 0;

  // Create regex pattern for all keywords (case insensitive)
  const keywords = Object.keys(colorKeywords);
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

  const matches = content.matchAll(pattern);
  let lastIndex = 0;

  for (const match of matches) {
    const matchIndex = match.index!;
    const matchText = match[0];
    const colorKey = matchText.toLowerCase();
    const color = colorKeywords[colorKey];

    // Add text before this match
    if (matchIndex > lastIndex) {
      parts.push(content.substring(lastIndex, matchIndex));
    }

    // Add the colored pill
    parts.push(
      <span key={keyIndex++} className={`${styles.colorPill} ${styles[`pill${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
        {matchText}
      </span>
    );

    lastIndex = matchIndex + matchText.length;
  }

  // Add any remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const [horizontalPosition, setHorizontalPosition] = useState<'center' | 'left' | 'right'>('center');
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Detect mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current && !isMobile) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      let top = 0;
      let left = 0;
      let newPos: 'top' | 'bottom' = 'top';
      let newHPos: 'center' | 'left' | 'right' = 'center';

      // Vertical logic
      if (spaceAbove < 100) {
        newPos = 'bottom';
        top = rect.bottom + scrollY + 8;
      } else {
        newPos = 'top';
        top = rect.top + scrollY - 8;
      }

      // Horizontal logic
      if (spaceRight < 150) {
        newHPos = 'right';
        left = rect.right + scrollX;
      } else if (spaceLeft < 150) {
        newHPos = 'left';
        left = rect.left + scrollX;
      } else {
        newHPos = 'center';
        left = rect.left + (rect.width / 2) + scrollX;
      }

      setPosition(newPos);
      setHorizontalPosition(newHPos);
      setCoords({ top, left });
    }
  }, [isVisible, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      // Handle scroll to update position or close
      window.addEventListener('scroll', () => setIsVisible(false), { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', () => setIsVisible(false));
    };
  }, [isVisible]);

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  // Mobile: render as fixed bottom bar
  const handleMobileClose = () => {
    setClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setClosing(false);
    }, 500); // match slower animation duration
  };

  if (isVisible && isMobile) {
    return (
      <>
        <div className={styles.mobileTooltipBackdrop} onClick={handleMobileClose} />
        <div
          className={
            styles.mobileTooltipBar + (closing ? ' ' + styles.closing : '')
          }
          ref={tooltipRef}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.mobileTooltipHeader}>
            <span className={styles.mobileTooltipTitle}>Info</span>
            <button
              className={styles.mobileTooltipClose}
              onClick={handleMobileClose}
              aria-label="Close info"
              disabled={closing}
            >
              ×
            </button>
          </div>
          <div className={styles.mobileTooltipContent}>{parseContent(content)}</div>
        </div>
      </>
    );
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className={`${styles.tooltip} ${styles.portal} ${styles[position]} ${styles[`align${horizontalPosition.charAt(0).toUpperCase() + horizontalPosition.slice(1)}`]}`}
      style={{ 
        top: coords.top, 
        left: coords.left,
      }}
      role="tooltip"
    >
      <div className={styles.tooltipContent}>
        {parseContent(content)}
      </div>
      <div className={styles.tooltipArrow} />
    </div>
  );

  return (
    <div className={`${styles.tooltipWrapper} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.infoButton}
        onClick={handleToggle}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-label="More information"
        aria-expanded={isVisible}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 7V11M8 5V5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isVisible && !isMobile && createPortal(tooltipContent, document.body)}
    </div>
  );
};
