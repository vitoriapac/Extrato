import { buildReviewQueueSummary } from './build-review-queue-summary.js';
import { evaluateWeeklyReviewBudget } from '../../domain/reviews/mixed-review-batch.js';
import type { ErrorFlashcard, ReviewAgendaItem } from '../../core/types.js';

// Same block size the recovery mission uses; one flashcard takes about a minute.
export const TOPIC_REVIEW_MINUTES = 15;
export const FLASHCARD_MINUTES = 1;

/**
 * One review queue for Today: topic reviews and flashcards in minutes, against a daily cap taken
 * from the existing review budget (same % as the weekly one, applied to today's goal).
 */
export function buildTodayReviewLoad({
  reviews = [],
  flashcards = [],
  today,
  dailyGoalMinutes = 0,
  budgetPct = null,
  finalStretchSweep = false,
}: {
  reviews?: ReviewAgendaItem[];
  flashcards?: ErrorFlashcard[];
  today: string;
  dailyGoalMinutes?: number;
  budgetPct?: number | null;
  finalStretchSweep?: boolean;
}) {
  const summary = buildReviewQueueSummary({ reviews, flashcards, today, finalStretchSweep });
  const overdueTopics = reviews.filter(
    item => item.status !== 'Concluído' && item.date && item.date < today
  ).length;
  const budget = evaluateWeeklyReviewBudget({ plannedWeeklyMinutes: dailyGoalMinutes, budgetPct });
  const topicMinutes = summary.topicsDue * TOPIC_REVIEW_MINUTES;
  const flashcardMinutes = summary.flashcardsDue * FLASHCARD_MINUTES;
  const totalMinutes = topicMinutes + flashcardMinutes;
  // Without a daily goal there is no cap to compare against.
  const capMinutes = budget.budgetMinutes > 0 ? Math.max(15, budget.budgetMinutes) : null;
  return {
    topicCount: summary.topicsDue,
    overdueTopics,
    topicMinutes,
    flashcardCount: summary.flashcardsDue,
    flashcardMinutes,
    totalMinutes,
    capMinutes,
    budgetPct: budget.budgetPct,
    overCap: capMinutes != null && totalMinutes > capMinutes,
  };
}
