import { useEffect, useRef } from 'react';
import { modalHistory } from '../utils/modalHistory';

/**
 * useModalBackHandler
 * React hook that connects any modal, drawer, or lightbox to the browser back navigation.
 * When open, pushes a history state.
 * When user presses mobile device Back / browser back, closes this overlay.
 * When closed via UI, cleanly pops the history state without leaving ghost entries.
 */
export function useModalBackHandler(
  isOpen: boolean,
  onClose: () => void,
  modalId: string
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const unregister = modalHistory.push(modalId, () => {
      onCloseRef.current();
    });

    return () => {
      unregister();
    };
  }, [isOpen, modalId]);
}
