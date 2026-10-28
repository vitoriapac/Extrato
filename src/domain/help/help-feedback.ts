/**
 * help-feedback.ts
 * Gestão puramente local e privativa de feedback das instruções do StudyTrack.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface TopicFeedbackRecord {
  helpful: boolean;
  timestamp: string;
}

export const HELP_FEEDBACK_STORAGE_KEY = 'studytrack_help_feedback';

export function getHelpFeedbackMap(
  storage?: StorageLike | null
): Record<string, TopicFeedbackRecord> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(HELP_FEEDBACK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function getTopicFeedback(
  storage: StorageLike | null | undefined,
  topicId: string
): boolean | null {
  if (!topicId) return null;
  const map = getHelpFeedbackMap(storage);
  const entry = map[topicId];
  return typeof entry?.helpful === 'boolean' ? entry.helpful : null;
}

export function saveTopicFeedback(
  storage: StorageLike | null | undefined,
  topicId: string,
  helpful: boolean,
  nowISO: string = new Date().toISOString()
): void {
  if (!storage || !topicId) return;
  try {
    const map = getHelpFeedbackMap(storage);
    map[topicId] = {
      helpful: Boolean(helpful),
      timestamp: nowISO,
    };
    storage.setItem(HELP_FEEDBACK_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Falha silenciosa em localStorage inacessível ou cheio
  }
}

export function clearTopicFeedback(
  storage: StorageLike | null | undefined,
  topicId: string
): void {
  if (!storage || !topicId) return;
  try {
    const map = getHelpFeedbackMap(storage);
    if (topicId in map) {
      delete map[topicId];
      storage.setItem(HELP_FEEDBACK_STORAGE_KEY, JSON.stringify(map));
    }
  } catch {
    // Falha silenciosa
  }
}
