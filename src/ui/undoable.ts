import { captureUndo } from '../application/undo/state-undo.js';

interface UndoDeps {
  getState: () => Record<string, any>;
  persistAndRender: () => void;
  showToast: (message: string) => void;
  showUndoToast: (message: string, onUndo: () => void) => void;
}
let deps: UndoDeps | null = null;

/** Wired once in app.ts; controllers then call runUndoable without new plumbing. */
export function configureUndo(value: UndoDeps | null) {
  deps = value;
}

/**
 * Deletes immediately and offers "Desfazer" instead of asking "Tem certeza?" first (F6).
 * `action` mutates the state; this saves, renders and keeps the undo until the notice closes.
 */
export function runUndoable(message: string, action: () => void) {
  if (!deps) {
    action();
    return;
  }
  const { getState, persistAndRender, showToast, showUndoToast } = deps;
  const undo = captureUndo(getState(), action);
  persistAndRender();
  showUndoToast(message, () => {
    if (!undo(getState())) {
      showToast('Não foi possível desfazer: os dados mudaram depois da exclusão.');
      return;
    }
    persistAndRender();
    showToast('Exclusão desfeita.');
  });
}
