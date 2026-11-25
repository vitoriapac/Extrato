import { addLocalDays } from '../core/date-utils.ts';
import type { TopicDifficulty } from '../core/types.ts';

export interface ReviewIntervalOption {
  dias: number;
  tipo: string;
}

export const AGENDA_INTERVALS: ReviewIntervalOption[] = [
  { dias: 1, tipo: 'Revisão 24h' },
  { dias: 7, tipo: 'Revisão 7 dias' },
  { dias: 30, tipo: 'Revisão 30 dias' },
  { dias: 60, tipo: 'Revisão 60 dias' },
  { dias: 90, tipo: 'Revisão 90 dias' },
];

export const DIFFICULTY_INTERVALS: Record<TopicDifficulty, ReviewIntervalOption[]> = {
  Difícil: [
    { dias: 1, tipo: 'Revisão 24h' },
    { dias: 3, tipo: 'Revisão 3 dias' },
    { dias: 7, tipo: 'Revisão 7 dias' },
    { dias: 15, tipo: 'Revisão 15 dias' },
    { dias: 30, tipo: 'Revisão 30 dias' },
    { dias: 60, tipo: 'Revisão 60 dias' },
    { dias: 90, tipo: 'Revisão 90 dias' },
  ],
  Médio: [
    { dias: 1, tipo: 'Revisão 24h' },
    { dias: 7, tipo: 'Revisão 7 dias' },
    { dias: 30, tipo: 'Revisão 30 dias' },
    { dias: 60, tipo: 'Revisão 60 dias' },
    { dias: 90, tipo: 'Revisão 90 dias' },
  ],
  Fácil: [
    { dias: 1, tipo: 'Revisão 24h' },
    { dias: 14, tipo: 'Revisão 14 dias' },
    { dias: 30, tipo: 'Revisão 30 dias' },
    { dias: 60, tipo: 'Revisão 60 dias' },
    { dias: 90, tipo: 'Revisão 90 dias' },
  ],
};

export const PRE_EXAM_GENERAL_REVIEW_TYPE = 'Revisão geral pré-prova';
export const PRE_EXAM_WINDOW_OFFSETS = Object.freeze([-14, -13, -12, -11, -10]);

export interface PreExamReviewTopicInput {
  id: string;
  subjectId: string;
  status?: string;
}

export interface PreExamReviewExistingItem {
  topicId?: string | null;
  topicRef?: string | null;
  tipo?: string | null;
}

export interface PreExamGeneralReviewDraft {
  subjectId: string;
  topicId: string;
  date: string;
  suggestedDate: string;
  baseIntervalDays: number;
  adaptive: boolean;
  manualDate: boolean;
  adaptiveReason: string;
  tipo: string;
  status: 'Não iniciado';
}

/**
 * Gera rascunhos de Revisão Geral Pré-Prova na janela de 10 a 15 dias antes da prova
 * para todos os tópicos já concluídos que ainda não possuam esse marco agendado.
 */
export function buildPreExamGeneralReviewItems({
  topics = [],
  existingAgenda = [],
  examDate,
  today,
}: {
  topics: PreExamReviewTopicInput[];
  existingAgenda: PreExamReviewExistingItem[];
  examDate?: string | null;
  today: string;
}): PreExamGeneralReviewDraft[] {
  if (!examDate || !/^\d{4}-\d{2}-\d{2}$/.test(examDate) || examDate <= today) {
    return [];
  }
  const existingTopicIds = new Set(
    existingAgenda
      .filter(item => item.tipo === PRE_EXAM_GENERAL_REVIEW_TYPE)
      .map(item => item.topicId || item.topicRef)
      .filter(Boolean)
  );
  const completedTopics = topics.filter(
    topic => topic.status === 'Concluído' && !existingTopicIds.has(topic.id)
  );
  return completedTopics.map((topic, index) => {
    const offset = PRE_EXAM_WINDOW_OFFSETS[index % PRE_EXAM_WINDOW_OFFSETS.length];
    const rawTarget = addLocalDays(examDate, offset) || examDate;
    const date = rawTarget < today ? today : rawTarget;
    return {
      subjectId: topic.subjectId,
      topicId: topic.id,
      date,
      suggestedDate: date,
      baseIntervalDays: Math.abs(offset),
      adaptive: false,
      manualDate: false,
      adaptiveReason: 'Revisão geral automática na janela de 10–15 dias antes da prova.',
      tipo: PRE_EXAM_GENERAL_REVIEW_TYPE,
      status: 'Não iniciado',
    };
  });
}

export interface CalculateAdaptiveIntervalParams {
  baseDays: number;
  accuracy?: number | null;
  volume?: number;
  target?: number;
  trendKey?: string | null;
  dominantErrorKey?: string | null;
  reviews?: number;
}

export function calculateAdaptiveInterval({
  baseDays,
  accuracy = null,
  volume = 0,
  target = 70,
  trendKey = null,
  dominantErrorKey = null,
  reviews = 0,
}: CalculateAdaptiveIntervalParams): { days: number; reason: string } {
  const safeBase = Math.max(1, Number(baseDays) || 7);
  let factor = 1;
  const reasons: string[] = [];
  if (volume >= 10 && accuracy !== null) {
    if (accuracy < 50) {
      factor *= 0.65;
      reasons.push('acerto abaixo de 50%');
    } else if (accuracy < target) {
      factor *= 0.8;
      reasons.push('acerto abaixo da meta');
    } else if (accuracy >= target + 15) {
      factor *= 1.2;
      reasons.push('bom desempenho');
    }
  }
  if (trendKey === 'down') {
    factor *= 0.8;
    reasons.push('tendência em queda');
  } else if (trendKey === 'up') {
    factor *= 1.1;
    reasons.push('tendência positiva');
  }
  if (dominantErrorKey === 'esqueci') {
    factor *= 0.8;
    reasons.push('esquecimento predominante');
  }
  if (dominantErrorKey === 'naoSabia') {
    factor *= 0.85;
    reasons.push('lacuna de teoria');
  }
  if (reviews >= 3 && volume >= 10 && accuracy !== null && accuracy >= target) {
    factor *= 1.1;
    reasons.push('histórico consistente');
  }
  const upper = Math.min(60, Math.max(1, Math.floor(safeBase * 1.5)));
  const lower = Math.min(upper, Math.max(1, Math.ceil(safeBase * 0.5)));
  return {
    days: Math.max(lower, Math.min(upper, Math.round(safeBase * factor))),
    reason: reasons.length ? reasons.join(' · ') : 'intervalo-base preservado',
  };
}

export type ReviewRatingKey = 'again' | 'hard' | 'good' | 'easy';

export const REVIEW_RATINGS: Readonly<
  Record<ReviewRatingKey, { readonly label: string; readonly quality: number }>
> = Object.freeze({
  again: { label: 'Errei', quality: 1 },
  hard: { label: 'Difícil', quality: 3 },
  good: { label: 'Bom', quality: 4 },
  easy: { label: 'Fácil', quality: 5 },
});

export interface AdaptiveReviewState {
  easinessFactor: number;
  repetitions: number;
  intervalDays: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  lastRating: ReviewRatingKey | null;
  algorithmVersion: number;
}

export function createAdaptiveReviewState(
  source: Partial<AdaptiveReviewState> & Record<string, any> = {}
): AdaptiveReviewState {
  source = source || {};
  const rating = source.lastRating as ReviewRatingKey;
  return {
    easinessFactor: Math.max(1.3, Number(source.easinessFactor) || 2.5),
    repetitions: Math.max(0, Math.floor(Number(source.repetitions) || 0)),
    intervalDays: Math.max(0, Math.floor(Number(source.intervalDays) || 0)),
    lastReviewDate: source.lastReviewDate || null,
    nextReviewDate: source.nextReviewDate || null,
    lastRating: REVIEW_RATINGS[rating] ? rating : null,
    algorithmVersion: Math.max(1, Number(source.algorithmVersion) || 2),
  };
}

export function applyAdaptiveReviewRating(
  source: Partial<AdaptiveReviewState> & Record<string, any>,
  rating: ReviewRatingKey,
  {
    reviewDate,
    algorithmVersion = 2,
  }: { reviewDate?: string | null; algorithmVersion?: number } = {}
): AdaptiveReviewState {
  if (!REVIEW_RATINGS[rating]) throw new Error('Avaliação de revisão inválida.');
  const state = createAdaptiveReviewState(source),
    quality = REVIEW_RATINGS[rating].quality;
  let repetitions = state.repetitions,
    intervalDays = state.intervalDays;
  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = rating === 'easy' ? 4 : 1;
    else if (repetitions === 2) intervalDays = rating === 'hard' ? 4 : rating === 'easy' ? 8 : 6;
    else
      intervalDays = Math.max(
        1,
        Math.round(
          intervalDays *
            state.easinessFactor *
            (rating === 'hard' ? 0.8 : rating === 'easy' ? 1.3 : 1)
        )
      );
  }
  const easinessFactor = Math.max(
    1.3,
    state.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  return {
    easinessFactor: Math.round(easinessFactor * 100) / 100,
    repetitions,
    intervalDays: Math.min(365, intervalDays),
    lastReviewDate: reviewDate ?? null,
    nextReviewDate: addLocalDays(reviewDate, Math.min(365, intervalDays)),
    lastRating: rating,
    algorithmVersion,
  };
}

export function reviewBaseDaysFromType(type: string): number {
  if (type === 'Revisão 24h') return 1;
  const match = String(type || '').match(/(\d+)/);
  return match ? Math.max(1, Number(match[1])) : 7;
}

/**
 * Avaliação sugerida pelo acerto nas questões feitas na revisão, com os mesmos limites de
 * calculateAdaptiveInterval: abaixo de 50% errei, abaixo da meta difícil, meta + 15 fácil.
 */
export function suggestReviewRating(
  resolved: number,
  correct: number,
  target = 70
): { rating: ReviewRatingKey; accuracy: number } | null {
  const total = Math.max(0, Math.floor(Number(resolved) || 0));
  if (!total) return null;
  const accuracy = Math.round((Math.min(total, Math.max(0, Number(correct) || 0)) / total) * 100);
  const rating: ReviewRatingKey =
    accuracy < 50
      ? 'again'
      : accuracy < target
        ? 'hard'
        : accuracy >= target + 15
          ? 'easy'
          : 'good';
  return { rating, accuracy };
}
