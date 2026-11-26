// Local review reminder: the page saves only due dates (no topic names or answers) and the service
// worker counts what is due on the day it wakes. service-worker.template.js mirrors countDue and
// reminderText; keep the three in sync.
import type { ErrorFlashcard, ReviewAgendaItem } from '../../core/types.js';

export interface ReminderDigest {
  reviewDates: string[];
  flashcardDates: string[];
}

// A pending (never reviewed) card or one without a date is due right away.
const ALWAYS_DUE = '0000-00-00';

export function buildReminderDigest({
  reviews = [],
  flashcards = [],
}: {
  reviews?: ReviewAgendaItem[];
  flashcards?: ErrorFlashcard[];
}): ReminderDigest {
  return {
    reviewDates: reviews
      .filter(item => item.status !== 'Concluído' && item.date)
      .map(item => item.date)
      .sort(),
    flashcardDates: flashcards
      .map(card =>
        card.status === 'pending' || !card.nextReviewDate ? ALWAYS_DUE : card.nextReviewDate
      )
      .sort(),
  };
}

export function countDue(digest: ReminderDigest, today: string) {
  return {
    reviews: (digest.reviewDates || []).filter(date => date <= today).length,
    flashcards: (digest.flashcardDates || []).filter(date => date <= today).length,
  };
}

export function reminderText({ reviews, flashcards }: { reviews: number; flashcards: number }) {
  if (!reviews && !flashcards) return null;
  const parts = [
    reviews ? `${reviews} ${reviews === 1 ? 'revisão de tópico' : 'revisões de tópico'}` : '',
    flashcards ? `${flashcards} ${flashcards === 1 ? 'flashcard' : 'flashcards'}` : '',
  ].filter(Boolean);
  return `${parts.join(' e ')} para hoje. Abra a Revisão de hoje no Extrato.`;
}
