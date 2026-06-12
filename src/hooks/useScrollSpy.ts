import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Tracks which of a set of page sections is currently in view (scroll-spy) and
 * provides helpers to wire it up. Pair with <SectionNav /> to drive a sticky
 * section navigator.
 *
 *   const { activeId, assignRef, scrollTo } = useScrollSpy(SECTIONS.map(s => s.id));
 *   ...
 *   <section id={s.id} ref={assignRef(s.id)}>...</section>
 *   <SectionNav items={SECTIONS} activeId={activeId} onSelect={scrollTo} />
 */
export function useScrollSpy(ids: string[], options?: { rootMargin?: string }) {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const key = ids.join(',');
  const rootMargin = options?.rootMargin ?? '-20% 0px -60% 0px';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin, threshold: 0 }
    );

    const current = refs.current;
    for (const id of key.split(',')) {
      const el = current[id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [key, rootMargin]);

  const assignRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      refs.current[id] = el;
    },
    []
  );

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return { activeId, assignRef, scrollTo };
}
