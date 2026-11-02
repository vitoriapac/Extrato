import { pickPersistentState } from '../../state/state-boundaries.js';

// Save bookkeeping and the live timer move on their own; undo neither restores nor compares them.
const VOLATILE = new Set(['updatedAt', 'lastBackupAt', 'lastExportAt', 'activeTimer']);

const userData = (state: Record<string, any>) => {
  const data = pickPersistentState(state);
  for (const key of VOLATILE) delete data[key];
  return data;
};

/**
 * Runs `action` (which mutates `state` in place) and returns an undo that puts every persistent
 * value back exactly as it was. The undo refuses (returns false) once anything else changed since
 * the action, so it never discards later work.
 */
export function captureUndo(state: Record<string, any>, action: () => void) {
  const before = structuredClone(userData(state));
  action();
  const after = JSON.stringify(userData(state));
  return function undo(current: Record<string, any> = state): boolean {
    if (JSON.stringify(userData(current)) !== after) return false;
    for (const key of Object.keys(userData(current))) if (!(key in before)) delete current[key];
    for (const [key, value] of Object.entries(before)) current[key] = structuredClone(value);
    return true;
  };
}
