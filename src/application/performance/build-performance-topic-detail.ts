import { buildQuestionEvolution } from '../questions/build-question-evolution.js';

export function buildPerformanceTopicDetail({
  topicRow = null,
  questions = [],
  today,
  period = '30',
  examProfile = null,
  history = [],
}: any = {}) {
  if (!topicRow) return null;
  const evolution = buildQuestionEvolution({
    questions,
    today,
    scope: 'topic',
    topicId: topicRow.id,
    period,
  });
  const labels: Record<string, string> = {
    topic_started: 'Estudo iniciado',
    topic_completed: 'Tópico concluído',
    topic_reopened: 'Tópico reaberto',
  };
  const events = history
    .filter((item: any) => labels[item.type])
    .slice()
    .sort((a: any, b: any) =>
      String(a.localDate || a.date).localeCompare(String(b.localDate || b.date))
    )
    .slice(-8)
    .map((item: any) => ({
      date: item.localDate || String(item.date || '').slice(0, 10),
      label: labels[item.type],
    }));
  return { topic: topicRow, evolution, examProfile, events };
}
