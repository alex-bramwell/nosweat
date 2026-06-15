import { useEffect, useRef, type RefObject } from 'react';

type DismissableRef = RefObject<HTMLElement | null>;

/**
 * Dismisses an open popover / dropdown / tooltip when the user clicks outside
 * every provided element or presses Escape. Pass a single ref or several (for
 * example a tooltip and its trigger). Bind only while open by passing `enabled`
 * so the document listeners are not attached when there is nothing to dismiss.
 */
export function useDismiss(
  refs: DismissableRef | DismissableRef[],
  onDismiss: () => void,
  enabled = true,
): void {
  // Keep the latest callback without re-binding the listeners every render.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!enabled) return;
    const refList = Array.isArray(refs) ? refs : [refs];

    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = refList.some((ref) => ref.current?.contains(target));
      if (!isInside) onDismissRef.current();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismissRef.current();
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
    // refs holds stable RefObjects; only `enabled` should re-bind the listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
