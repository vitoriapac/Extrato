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
    'inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-text';

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
    levelBadgeClass =
      'inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-text';
  } else if (isStrategic) {
    level = 'Estratégico';
    levelBadgeClass =
      'inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-text';
  } else {
    level = 'Iniciante';
    levelBadgeClass =
      'inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-text';
  }

  return {
    readingTimeMinutes: rawMinutes,
    readingTimeLabel,
    level,
    levelBadgeClass,
  };
}
