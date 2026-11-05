import { useEffect, useRef } from 'react';

type EscapeHandler = () => void;

const activeHandlers = new Map<symbol, EscapeHandler>();
let listenerAttached = false;

function handleEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;

  const topmostHandler = Array.from(activeHandlers.values()).at(-1);
  if (!topmostHandler) return;

  event.preventDefault();
  event.stopPropagation();
  topmostHandler();
}

/** Register an Escape action while a popup, drawer, or dialog is open. */
export function useEscapeKey(isActive: boolean, onEscape: EscapeHandler) {
  const handlerRef = useRef(onEscape);

  useEffect(() => {
    handlerRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive) return;

    const id = Symbol('escape-handler');
    activeHandlers.set(id, () => handlerRef.current());

    if (!listenerAttached) {
      window.addEventListener('keydown', handleEscape, true);
      listenerAttached = true;
    }

    return () => {
      activeHandlers.delete(id);
      if (activeHandlers.size === 0 && listenerAttached) {
        window.removeEventListener('keydown', handleEscape, true);
        listenerAttached = false;
      }
    };
  }, [isActive]);
}
