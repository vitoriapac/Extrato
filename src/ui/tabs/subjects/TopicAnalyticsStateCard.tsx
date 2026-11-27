import type { JSX } from 'preact';
import type { TopicAnalyticsStateOptions } from './topic-analytics-view.js';

export interface TopicAnalyticsMetric {
  kind: 'pct' | 'text';
  name: string;
  value: number | string | null;
  detail?: string;
}

export interface TopicAnalyticsStateModel {
  label: string;
  eligibility: string;
  metrics: TopicAnalyticsMetric[];
}

export function buildTopicAnalyticsStateModel({
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
}: Omit<TopicAnalyticsStateOptions, 'escapeHtml'>): TopicAnalyticsStateModel {
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
  ) {
    label = 'Estudado, mas precisa consolidação';
  }

  const trendText =
    !trend || trend.key === 'insufficient' ? 'Aguardando dados' : `${trend.label}`;
  const eligibility = blockers.length
    ? `Aguarda ${blockers.map(id => getTopicName(id) || id).join(', ')}`
    : coverage === 100 &&
        !needsMaintenance({
          covered: true,
          masteryGap: mastery === null ? null : 100 - mastery,
          retentionRisk: retention === null ? null : 100 - retention,
          reviewHealthRisk: reviewHealth.value === null ? null : 100 - reviewHealth.value,
        })
      ? 'Consolidado'
      : (reviewHealth as { level?: string }).level === 'critical'
        ? 'Revisão recomendada'
        : masteryResult.evidence?.evidenceStrength! < 0.35
          ? 'Poucos dados'
          : 'Elegível para priorização';

  const metrics: TopicAnalyticsMetric[] = [
    { kind: 'pct', name: 'Cobertura', value: coverage },
    {
      kind: 'pct',
      name: 'Domínio',
      value: mastery,
      detail:
        mastery === null
          ? 'Registre questões deste tópico'
          : `Evidência ${masteryResult.evidence.evidenceLabel.toLowerCase()}`,
    },
    {
      kind: 'pct',
      name: 'Retenção',
      value: retention,
      detail:
        retention === null
          ? 'Conclua revisões vinculadas'
          : `Evidência ${(retentionResult as { evidence: { evidenceLabel: string } }).evidence.evidenceLabel.toLowerCase()}`,
    },
    {
      kind: 'pct',
      name: 'Saúde da revisão',
      value: reviewHealth.value,
      detail: reviewHealth.reasons[0] as string,
    },
    {
      kind: 'text',
      name: 'Último contato',
      value: lastContact === null ? 'Sem registro' : lastContact === 0 ? 'Hoje' : `${lastContact} dias`,
    },
    {
      kind: 'text',
      name: 'Última revisão',
      value: lastReview === null ? 'Sem registro' : lastReview === 0 ? 'Hoje' : `${lastReview} dias`,
    },
    {
      kind: 'pct',
      name: 'Desempenho recente',
      value: performance,
      detail: diagnosis?.performance?.resolved
        ? `${diagnosis.performance.resolved} questões`
        : 'Sem questões',
    },
    {
      kind: 'text',
      name: 'Tendência',
      value: trendText,
      detail:
        trend?.delta == null
          ? ''
          : `${trend.delta >= 0 ? '+' : ''}${trend.delta} p.p.`,
    },
  ];

  return { label, eligibility, metrics };
}

export function TopicAnalyticsStateCard({
  model,
}: {
  model: TopicAnalyticsStateModel;
}): JSX.Element {
  return (
    <div class="topic-analytics-state">
      <div class="topic-analytics-title">
        Estado analítico <strong>{model.label}</strong>
        <small>{model.eligibility}</small>
      </div>
      <div class="topic-analytics-metrics">
        {model.metrics.map(metric =>
          metric.kind === 'pct' ? (
            <div key={metric.name} class="topic-metric">
              <span>{metric.name}</span>
              <strong>
                {metric.value === null ? 'Aguardando dados' : `${Math.round(Number(metric.value))}%`}
              </strong>
              <div class="topic-metric-track">
                <i
                  style={{
                    width: `${metric.value === null ? 0 : Math.round(Number(metric.value))}%`,
                  }}
                />
              </div>
              {metric.detail && <small>{metric.detail}</small>}
            </div>
          ) : (
            <div key={metric.name} class="topic-metric">
              <span>{metric.name}</span>
              <strong>{String(metric.value ?? '')}</strong>
              {metric.detail && <small>{metric.detail}</small>}
            </div>
          )
        )}
      </div>
    </div>
  );
}
