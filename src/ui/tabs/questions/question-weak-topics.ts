import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { WeakTopics } from './WeakTopics.js';

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
    .sort((a, b) => Number(a.topic.resolved < MIN_TOPIC_EVIDENCE_QUESTIONS) - Number(b.topic.resolved < MIN_TOPIC_EVIDENCE_QUESTIONS) || a.topic.accuracy! - b.topic.accuracy! || a.index - b.index)
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
}: {
  topics: WeakTopic[];
  formatDate: (iso: string) => string;
  escapeHtml: (text: string) => string;
}): string {
  return render(h(WeakTopics, { topics, formatDate }));
}
