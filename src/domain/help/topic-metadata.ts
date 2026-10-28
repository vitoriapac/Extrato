/**
 * topic-metadata.ts
 * Cálculo de tempo estimado de leitura e nível pedagógico dos tópicos de instrução.
 */

export interface TopicMetadata {
  readingTimeMinutes: number;
  readingTimeLabel: string;
  level: 'Iniciante' | 'Estratégico' | 'Avançado';
  levelBadgeClass: string;
}

export function computeTopicMetadata(topic: {
  id?: string;
  kind?: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: any[];
  flow?: string[];
  visual?: any;
}): TopicMetadata {
  const textParts = [
    ...(topic.paragraphs || []),
    ...(topic.bullets || []),
    ...(topic.flow || []),
    ...(topic.steps || []).map(s =>
      typeof s === 'string' ? s : `${s?.title || ''} ${s?.detail || ''}`
    ),
  ];
  const totalWords = textParts.join(' ').trim().split(/\s+/).filter(Boolean).length;

  // Média de leitura didática: ~120 palavras/minuto + 30 segundos se houver simulador/visual
  const visualTimeMinutes = topic.visual ? 0.5 : 0;
  const rawMinutes = Math.max(1, Math.round(totalWords / 120 + visualTimeMinutes));
  const readingTimeLabel = `${rawMinutes} min de leitura`;

  // Determinação do nível didático
  let level: 'Iniciante' | 'Estratégico' | 'Avançado' = 'Iniciante';
  let levelBadgeClass =
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';

  const id = topic.id || '';
  const isAdvanced =
    id.includes('evidence') ||
    id.includes('projection') ||
    id.includes('adaptive') ||
    id.includes('what-if') ||
    id.includes('history');

  const isStrategic =
    id.includes('readiness') ||
    id.includes('adherence') ||
    id.includes('diagnosis') ||
    id.includes('weekly') ||
    id.includes('planning') ||
    topic.kind === 'concept';

  if (isAdvanced) {
    level = 'Avançado';
    levelBadgeClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
  } else if (isStrategic) {
    level = 'Estratégico';
    levelBadgeClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
  }

  return {
    readingTimeMinutes: rawMinutes,
    readingTimeLabel,
    level,
    levelBadgeClass,
  };
}
