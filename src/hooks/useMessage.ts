import { useState, useCallback, useRef } from 'react';

export interface Message {
  type: 'success' | 'error';
  text: string;
}

/**
 * Reusable hook for showing success/error feedback messages
 * with auto-dismiss after a configurable timeout.
 */
export function useMessage(autoDismissMs = 5000) {
  const [message, setMessage] = useState<Message | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clear = useCallback(() => {
    setMessage(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const show = useCallback(
    (type: Message['type'], text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMessage({ type, text });
      if (autoDismissMs > 0) {
        timerRef.current = setTimeout(() => setMessage(null), autoDismissMs);
      }
    },
    [autoDismissMs]
  );

  const showSuccess = useCallback((text: string) => show('success', text), [show]);
  const showError = useCallback((text: string) => show('error', text), [show]);

  return { message, setMessage, showSuccess, showError, clear };
}
