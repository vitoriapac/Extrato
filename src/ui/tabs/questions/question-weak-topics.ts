// Presentation only: picks from the topic performance the app already computes
// (getSubjectTopicPerformance); no new accuracy math lives here.
// Same sample threshold used by "amostra pequena" in Desempenho and by the topic list in Questões.
export const MIN_TOPIC_EVIDENCE_QUESTIONS = 30;
export const WEAK_TOPICS_LIMIT = 3;

export interface TopicPerformanceRow {
  id: string;
  name: string;
  subjectName?: string;
  resolved: number;
  accuracy: number | null;
}

export interface WeakTopic {
  topicId: string;
  name: string;
  subjectName: string;
  accuracy: number;
  sampleSize: number;
  periodStart: string | null;
  periodEnd: string | null;
  insufficient: boolean;
}

export function selectWeakTopics({
  topics,
  records,
  limit = WEAK_TOPICS_LIMIT,
}: {
  topics: TopicPerformanceRow[];
  records: Array<{ topicId?: string | null; date?: string }>;
  limit?: number;
}): WeakTopic[] {
  return topics
    .filter(topic => topic.resolved > 0 && topic.accuracy !== null)
    .map((topic, index) => ({ topic, index }))
    // Array.prototype.sort is stable, the index tie-break just makes it explicit.
    .sort((a, b) => a.topic.accuracy! - b.topic.accuracy! || a.index - b.index)
    .slice(0, limit)
    .map(({ topic }) => {
      const dates = records
        .filter(record => record.topicId === topic.id && record.date)
        .map(record => record.date!)
        .sort();
      return {
        topicId: topic.id,
        name: topic.name,
        subjectName: topic.subjectName || '',
        accuracy: topic.accuracy!,
        sampleSize: topic.resolved,
        periodStart: dates[0] ?? null,
        periodEnd: dates[dates.length - 1] ?? null,
        insufficient: topic.resolved < MIN_TOPIC_EVIDENCE_QUESTIONS,
      };
    });
}

export function renderWeakTopics({
  topics,
  formatDate,
  escapeHtml,
}: {
  topics: WeakTopic[];
  formatDate: (iso: string) => string;
  escapeHtml: (text: string) => string;
}): string {
  const head =
    '<h3 class="module-heading__title">Onde vale insistir</h3>';
  if (!topics.length) {
    return `<section class="weak-topics" aria-label="Onde vale insistir">${head}<p class="analytics-note">Registre questões com tópico para ver onde o acerto está mais baixo.</p></section>`;
  }
  const items = topics
    .map(topic => {
      const period =
        topic.periodStart && topic.periodEnd
          ? topic.periodStart === topic.periodEnd
            ? formatDate(topic.periodStart)
            : `${formatDate(topic.periodStart)} a ${formatDate(topic.periodEnd)}`
          : '';
      return `<li class="weak-topics__item"><span class="weak-topics__name">${escapeHtml(topic.name)}${topic.subjectName ? ` <small>${escapeHtml(topic.subjectName)}</small>` : ''}</span><span class="weak-topics__acc weak-topics__num">${String(topic.accuracy).replace('.', ',')}%</span><span class="weak-topics__meta"><span class="weak-topics__num">${topic.sampleSize}</span> questões${period ? ` · <span class="weak-topics__num">${escapeHtml(period)}</span>` : ''}${topic.insufficient ? ' · <strong class="weak-topics__flag">Evidência insuficiente</strong>' : ''}</span></li>`;
    })
    .join('');
  return `<section class="weak-topics" aria-label="Onde vale insistir">${head}<ol class="weak-topics__list">${items}</ol></section>`;
}
