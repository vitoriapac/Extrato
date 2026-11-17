/**
 * View-Model da Ficha Inteligente do Tópico (FIT-01 a FIT-10).
 * Apenas formata os dados produzidos por `buildTopicIntelligence` para a UI.
 */

import type { TopicIntelligenceSnapshot } from '../../domain/topic-intelligence/topic-intelligence-types.js';
import type { BadgeVariant } from '../../ui/primitives/badge.js';

export interface TopicIntelligenceViewModel {
  snapshot: TopicIntelligenceSnapshot;
  headerSubtitle: string;
  priorityBadgeVariant: BadgeVariant;
  accuracyText: string;
  accuracyDetail: string;
  lastActivityText: string;
  lastActivityDetail: string;
  coverageText: string;
  actionButtonLabel: string;
}

function mapPriorityBadgeVariant(classification: string): BadgeVariant {
  const normalized = classification.toLowerCase();
  if (normalized.includes('alta')) return 'danger';
  if (normalized.includes('média') || normalized.includes('media')) return 'warning';
  if (normalized.includes('controlado')) return 'success';
  if (normalized.includes('insuficiente')) return 'insufficient';
  return 'info';
}

export function buildTopicIntelligenceViewModel(
  snapshot: TopicIntelligenceSnapshot | null
): TopicIntelligenceViewModel | null {
  if (!snapshot) return null;

  const headerSubtitle = [snapshot.subjectName, snapshot.examLabel].filter(Boolean).join(' · ');

  const accuracyText =
    snapshot.performance.accuracyPercent != null ? `${snapshot.performance.accuracyPercent}%` : '—';
  const accuracyDetail =
    snapshot.performance.totalQuestions > 0
      ? `${snapshot.performance.correctCount}/${snapshot.performance.totalQuestions} questões`
      : 'Sem questões registradas';

  const days = snapshot.retention.daysSinceLastActivity;
  const lastActivityText =
    days != null ? (days === 0 ? 'Hoje' : `${days} ${days === 1 ? 'dia' : 'dias'}`) : '—';
  const lastActivityDetail =
    snapshot.retention.lastActivityLocalDate || 'Nenhuma atividade registrada';

  const coverageText =
    snapshot.progress.coveragePercent != null ? `${snapshot.progress.coveragePercent}%` : '—';

  const actionButtonLabel = snapshot.nextAction
    ? snapshot.nextAction.suggestedMinutes
      ? `${snapshot.nextAction.label} (${snapshot.nextAction.suggestedMinutes} min)`
      : snapshot.nextAction.label
    : 'Iniciar estudo neste tópico';

  return {
    snapshot,
    headerSubtitle,
    priorityBadgeVariant: mapPriorityBadgeVariant(snapshot.priority.classification),
    accuracyText,
    accuracyDetail,
    lastActivityText,
    lastActivityDetail,
    coverageText,
    actionButtonLabel,
  };
}
