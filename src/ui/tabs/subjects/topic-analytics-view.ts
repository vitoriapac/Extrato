export interface TopicAnalyticsStateOptions {
  subject: { id: string; name: string };
  topic: {
    id: string;
    name: string;
    status: string;
    lastReviewedAt?: string | null;
  };
  topicMasteryIndex: (subjectId: string, topicId: string) => any;
  topicRetentionScore: (subjectId: string, topicId: string) => any;
  diagnoseTopic: (subjectId: string, topicId: string) => any;
  topicReviewHealthScore: (
    topic: any,
    masteryResult: any,
    retentionResult: any,
    diagnosis: any
  ) => any;
  diasParaRevisao: (date: string) => number | null;
  localDateFromTimestamp: (ts: string | null | undefined) => string | null;
  prerequisiteBlockers: (topic: any, allTopics: any[]) => string[];
  allTopics: () => any[];
  needsMaintenance: (opts: any) => boolean;
  getTopicName: (id: string) => string | null;
  escapeHtml: (s: string) => string;
}

export function renderTopicAnalyticsState({
  subject,
  topic,
  topicMasteryIndex,
  topicRetentionScore,
  diagnoseTopic,
  topicReviewHealthScore,
  diasParaRevisao,
  localDateFromTimestamp,
  prerequisiteBlockers,
  allTopics,
  needsMaintenance,
  getTopicName,
  escapeHtml,
}: TopicAnalyticsStateOptions): string {
  const coverage =
    topic.status === 'Concluído'
      ? 100
      : topic.status === 'Em andamento' || topic.status === 'Revisão'
        ? 50
        : 0;
  const masteryResult = topicMasteryIndex(subject.id, topic.id);
  const retentionResult = topicRetentionScore(subject.id, topic.id);
  const mastery = masteryResult.confidence > 0 ? masteryResult.score : null;
  const retention = retentionResult.available ? retentionResult.score : null;
  const diagnosis = diagnoseTopic(subject.id, topic.id);
  const reviewHealth = topicReviewHealthScore(topic, masteryResult, retentionResult, diagnosis);
  const lastContact = diagnosis?.lastActivity
    ? Math.max(0, -(diasParaRevisao(diagnosis.lastActivity) ?? 0))
    : null;
  const lastReviewDate = localDateFromTimestamp(topic.lastReviewedAt);
  const lastReview = lastReviewDate ? Math.max(0, -(diasParaRevisao(lastReviewDate) ?? 0)) : null;
  const performance = diagnosis?.performance?.accuracy ?? null;
  const trend = diagnosis?.trend;

  const blockers = prerequisiteBlockers(
    { ...topic, mastery, covered: coverage === 100 },
    allTopics().map(item => ({
      ...item,
      covered: item.status === 'Concluído',
      mastery:
        topicMasteryIndex(item.subjectId, item.id).confidence > 0
          ? topicMasteryIndex(item.subjectId, item.id).score
          : null,
    }))
  );

  let label = 'Não iniciado';
  if (coverage > 0 && mastery === null) label = 'Em estudo · aguardando questões';
  else if (coverage === 100 && mastery! < 50) label = 'Coberto, não consolidado';
  else if (coverage === 100 && retention !== null && retention < 60) label = 'Domínio em risco';
  else if (coverage === 100 && mastery! >= 75) label = 'Consolidado';
  else if (coverage === 100) label = 'Em consolidação';
  else if (coverage > 0) label = 'Em estudo';

  if (blockers.length) label = 'Bloqueado por pré-requisito';
  else if (
    coverage === 100 &&
    needsMaintenance({
      covered: true,
      masteryGap: mastery === null ? null : 100 - mastery,
      retentionRisk: retention === null ? null : 100 - retention,
      reviewHealthRisk: reviewHealth.value === null ? null : 100 - reviewHealth.value,
    })
  )
    label = 'Estudado, mas precisa consolidação';

  const pctMetric = (name: string, value: any, detail = '') =>
    `<div class="topic-metric"><span>${name}</span><strong>${value === null ? 'Aguardando dados' : Math.round(value) + '%'}</strong><div class="topic-metric-track"><i style="width:${value === null ? 0 : Math.round(value)}%"></i></div>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div>`;
  const textMetric = (name: string, value: any, detail = '') =>
    `<div class="topic-metric"><span>${name}</span><strong>${escapeHtml(value)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</div>`;

  const trendText =
    !trend || trend.key === 'insufficient' ? 'Aguardando dados' : `${trend.icon} ${trend.label}`;
  const eligibility = blockers.length
    ? `🔒 Aguarda ${blockers.map(id => getTopicName(id) || id).join(', ')}`
    : coverage === 100 &&
        !needsMaintenance({
          covered: true,
          masteryGap: mastery === null ? null : 100 - mastery,
          retentionRisk: retention === null ? null : 100 - retention,
          reviewHealthRisk: reviewHealth.value === null ? null : 100 - reviewHealth.value,
        })
      ? '✓ Consolidado'
      : (reviewHealth as { level?: string }).level === 'critical'
        ? '↻ Revisão recomendada'
        : masteryResult.evidence?.evidenceStrength! < 0.35
          ? '⚠ Poucos dados'
          : '★ Elegível para priorização';

  return `<div class="topic-analytics-state"><div class="topic-analytics-title">Estado analítico <strong>${escapeHtml(label)}</strong><small>${escapeHtml(eligibility)}</small></div><div class="topic-analytics-metrics">${pctMetric('Cobertura', coverage)}${pctMetric('Domínio', mastery, mastery === null ? 'Registre questões deste tópico' : 'Evidência ' + masteryResult.evidence.evidenceLabel.toLowerCase())}${pctMetric('Retenção', retention, retention === null ? 'Conclua revisões vinculadas' : 'Evidência ' + (retentionResult as { evidence: { evidenceLabel: string } }).evidence.evidenceLabel.toLowerCase())}${pctMetric('Saúde da revisão', reviewHealth.value, reviewHealth.reasons[0] as string)}${textMetric('Último contato', lastContact === null ? 'Sem registro' : lastContact === 0 ? 'Hoje' : lastContact + ' dias')}${textMetric('Última revisão', lastReview === null ? 'Sem registro' : lastReview === 0 ? 'Hoje' : lastReview + ' dias')}${pctMetric('Desempenho recente', performance, diagnosis?.performance?.resolved ? diagnosis.performance.resolved + ' questões' : 'Sem questões')}${textMetric('Tendência', trendText, trend?.delta == null ? '' : (trend.delta >= 0 ? '+' : '') + trend.delta + ' p.p.')}</div></div>`;
}
