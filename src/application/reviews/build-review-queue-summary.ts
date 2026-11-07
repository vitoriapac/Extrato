import { parseLocalDate } from '../../core/date-utils.js';
import type { ErrorFlashcard, ReviewAgendaItem } from '../../core/types.js';
import { getDueFlashcards } from '../../domain/notebook/error-notebook-engine.js';

export function buildReviewQueueSummary({ reviews = [], flashcards = [], today }: {
  reviews?: ReviewAgendaItem[];
  flashcards?: ErrorFlashcard[];
  today: string;
}) {
  const pending = reviews.filter(item => item.status !== 'Concluído' && parseLocalDate(item.date));
  const upcomingTopics = pending.map(item => item.date).filter(date => date > today).sort();
  const upcomingCards = flashcards
    .filter(card => card.status === 'reviewing' && card.nextReviewDate && parseLocalDate(card.nextReviewDate) && card.nextReviewDate > today)
    .map(card => card.nextReviewDate!)
    .sort();
  return {
    topicsDue: pending.filter(item => item.date <= today).length,
    topicsNext: upcomingTopics[0] || null,
    flashcardsDue: getDueFlashcards(flashcards, today).length,
    flashcardsNext: upcomingCards[0] || null,
  };
}
