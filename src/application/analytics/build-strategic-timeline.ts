import { formatPeriodBR } from '../../core/format-date.js';
import {
  normalizeExamTags,
  isTopicInExamScope,
  isSimulationInExamScope,
} from '../../domain/exams/exam-scope.js';
import { localDateFromTimestamp } from '../../domain/sessions/study-session.js';
import { groupStrategicTimeline } from './group-strategic-timeline.js';
import { buildRecoveryTimelineDetail } from './build-recovery-timeline-detail.js';

type Row = Record<string, any>;
const TRAJECTORY_LABELS: Record<string, string> = {
  on_track: 'no caminho',
  attention: 'em atenção',
  at_risk: 'em risco',
  insufficient_data: 'com dados insuficientes',
};

export const strategicScopeKey = (tags: unknown) =>
  Array.isArray(tags) ? JSON.stringify(normalizeExamTags(tags)) : null;
export function strategicRecordInScope(record: Row, activeExamTags: string[], topics: Row[] = []) {
  if (Array.isArray(record.activeExamTags))
    return strategicScopeKey(record.activeExamTags) === strategicScopeKey(activeExamTags);
  const topic = topics.find(item => item.id === record.topicId);
  return topic ? isTopicInExamScope(topic, activeExamTags) : !activeExamTags.length;
}
export function buildStrategicTimeline({
  readinessSnapshots = [],
  weeklyCloseSnapshots = [],
  recommendations = [],
  recommendationHistory = [],
  studyPlans = [],
  adaptiveHistory = [],
  planAdjustments = [],
  simulations = [],
  topics = [],
  activeExamTags = [],
  filter = 'all',
  groupBy = 'week',
  today = null,
}: any = {}) {
  const events: Row[] = [],
    seen = new Set<string>();
  const add = (
    source: string,
    id: string,
    time: string | null | undefined,
    category: string,
    title: string,
    description: string,
    record: Row
  ) => {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(record.date || '')
      ? record.date
      : /^\d{4}-\d{2}-\d{2}$/.test(time || '')
        ? time
        : localDateFromTimestamp(time);
    const key = `${source}:${id}`;
    if (!id || !date || (today && date > today) || seen.has(key)) return;
    seen.add(key);
    events.push({
      id: key,
      sourceId: id,
      date,
      time: time || date,
      category,
      title,
      description,
      details:
        source === 'adaptive' || source === 'adaptive-revert'
          ? buildRecoveryTimelineDetail(record, { reverted: source === 'adaptive-revert' })
          : null,
      phase:
        record.examPhase?.label ||
        record.phaseStrategy?.phase?.label ||
        record.phase?.label ||
        null,
      legacyScope: !Array.isArray(record.activeExamTags),
      sequence: events.length,
    });
  };
  const exact = (record: Row) =>
    strategicScopeKey(record.activeExamTags) === strategicScopeKey(activeExamTags);
  const scoped = (record: Row) => strategicRecordInScope(record, activeExamTags, topics);
  const readiness = readinessSnapshots
    .filter(exact)
    .sort(
      (a: any, b: any) =>
        a.date.localeCompare(b.date) ||
        String(a.savedAt || '').localeCompare(String(b.savedAt || ''))
    );
  readiness.forEach((item: any, index: any) => {
    const previous = readiness[index - 1],
      delta = previous ? item.score - previous.score : null;
    add(
      'readiness',
      item.id,
      item.savedAt || item.date,
      'readiness',
      'Prontidão',
      `${previous ? previous.score + ' → ' : ''}${item.score}/100${delta == null ? '' : ` · ${delta >= 0 ? '+' : ''}${delta}`} · ${item.reason || 'Retrato da preparação'}`,
      item
    );
  });
  weeklyCloseSnapshots.filter(exact).forEach((item: any) => {
    const frame = item.weeklyClose?.adherence,
      value = frame
        ? frame.assessment?.status === 'insufficient_data'
          ? null
          : frame.model?.priority?.adherence
        : item.weeklyClose?.decisionCycle?.execution?.strategicAdherence;
    add(
      'close',
      item.id,
      item.savedAt || item.period?.end,
      'decisions',
      'Fechamento semanal',
      `${formatPeriodBR(item.period?.start, item.period?.end)} · aderência estratégica ${value == null ? 'sem dados' : Math.round(value * 10) / 10 + '%'}`,
      item
    );
  });
  const feedbackIds = new Set(
    recommendations.map((item: any) => item.recommendationId).filter(Boolean)
  );
  recommendations.filter(scoped).forEach((item: any) => {
    if (typeof item.accepted !== 'boolean') return;
    const name =
      item.snapshot?.explanationSnapshot?.topicName ||
      topics.find((topic: any) => topic.id === item.topicId)?.name ||
      'Tópico removido';
    add(
      'recommendation',
      item.id || item.recommendationId,
      item.createdAt || item.date,
      'decisions',
      item.accepted ? 'Recomendação aceita' : 'Recomendação rejeitada',
      `${name} · ${item.snapshot?.recommendedMinutes ?? 'sem duração registrada'} min`,
      item
    );
  });
  recommendationHistory
    .filter(
      (item: any) =>
        !feedbackIds.has(item.id) && ['executed', 'dismissed'].includes(item.status) && scoped(item)
    )
    .forEach((item: any) =>
      add(
        'recommendation-history',
        item.id,
        item.executedAt || item.dismissedAt || item.createdAt,
        'decisions',
        item.status === 'executed' ? 'Recomendação aceita' : 'Recomendação rejeitada',
        topics.find((topic: any) => topic.id === item.topicId)?.name || 'Tópico removido',
        item
      )
    );
  studyPlans
    .filter((item: any) =>
      Array.isArray(item.activeExamTags) ? exact(item) : !activeExamTags.length
    )
    .forEach((item: any) => {
      const phase = item.phaseStrategy;
      add(
        'plan',
        item.id,
        phase?.appliedAt || item.confirmedAt,
        'planning',
        phase?.status === 'reverted'
          ? 'Estratégia por fase revertida'
          : phase
            ? 'Estratégia por fase aplicada'
            : 'Plano semanal confirmado',
        `${phase?.phase?.label ? phase.phase.label + ' · ' : ''}${item.weeklyPlannedMinutes} min distribuídos`,
        item
      );
    });
  adaptiveHistory
    .filter(
      (item: any) =>
        ['applied', 'reverted'].includes(item.status) &&
        scoped({ ...item, topicId: item.targetTopicId })
    )
    .forEach((item: any) => {
      const recovery = item.decisionType === 'recovery',
        transfer = `${item.minutes ?? '—'} min de ${item.sourceName || 'origem'} para ${item.targetName || 'destino'}`;
      const capacity =
        item.totalMinutesBefore != null && item.totalMinutesAfter != null
          ? ` · carga semanal ${item.totalMinutesBefore} → ${item.totalMinutesAfter} min`
          : '';
      const status = item.trajectoryStatus
        ? ` · trajetória ${TRAJECTORY_LABELS[item.trajectoryStatus] || 'reavaliada'}`
        : '';
      add(
        'adaptive',
        item.id,
        item.decidedAt || item.createdAt,
        'planning',
        recovery ? 'Plano de recuperação aplicado' : 'Redistribuição adaptativa',
        recovery
          ? `${transfer}${capacity}`
          : `${transfer}${capacity}${status}${item.reasons?.length ? ' · ' + item.reasons.slice(0, 2).join(' · ') : ''}`,
        item
      );
      if (item.revertedAt)
        add(
          'adaptive-revert',
          item.id,
          item.revertedAt,
          'planning',
          recovery ? 'Plano de recuperação revertido' : 'Redistribuição revertida',
          recovery
            ? 'Atividades já realizadas foram preservadas.'
            : 'Uma nova versão preservou o plano anterior.',
          { ...item, date: null }
        );
    });
  planAdjustments
    .filter(
      (item: any) =>
        scoped(item) ||
        (!Array.isArray(item.activeExamTags) &&
          (item.allocations || []).some((allocation: any) =>
            scoped({ topicId: allocation.topicId })
          ))
    )
    .forEach((item: any) => {
      add(
        'adjustment',
        item.id,
        item.appliedAt || item.confirmedAt || item.createdAt || item.date,
        'planning',
        'Replanejamento registrado',
        item.reason || 'Decisão de planejamento registrada.',
        item
      );
      if (item.undoneAt)
        add(
          'adjustment-undo',
          item.id,
          item.undoneAt,
          'planning',
          'Replanejamento desfeito',
          'Atividades já executadas permanecem preservadas.',
          item
        );
    });
  simulations
    .filter((item: any) => isSimulationInExamScope(item, activeExamTags))
    .forEach((item: any) =>
      add(
        'simulation',
        item.id,
        item.date,
        'simulations',
        'Simulado registrado',
        `${item.nome || 'Simulado'} · ${Number(item.total) > 0 ? Math.round((Number(item.correct) / Number(item.total)) * 100) + '% de acerto' : 'sem amostra'}`,
        { ...item, activeExamTags: item.examTags }
      )
    );
  const accepts = (category: string) =>
    filter === 'all' ||
    filter === category ||
    (filter === 'performance' && category === 'readiness') ||
    (filter === 'assessments' && category === 'simulations');
  const rows = events
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        String(b.time).localeCompare(String(a.time)) ||
        b.sequence - a.sequence
    )
    .filter(item => accepts(item.category));
  return { rows, total: rows.length, filter, ...groupStrategicTimeline(rows, { groupBy }) };
}
