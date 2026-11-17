/**
 * Seletor memoizado para a Ficha Inteligente do Tópico.
 * Evita recalcular snapshots ao alternar entre abas quando a revisão de estado
 * e o escopo de concurso permanecem os mesmos.
 */

import type { TopicIntelligenceSnapshot } from '../../domain/topic-intelligence/topic-intelligence-types.js';
import {
  buildTopicIntelligence,
  type BuildTopicIntelligenceInput,
} from '../topic-intelligence/build-topic-intelligence.js';

export function createTopicIntelligenceSelector() {
  let cachedRevision: string | number | null = null;
  let cachedScopeKey = '';
  const cache = new Map<string, TopicIntelligenceSnapshot | null>();

  function getSnapshot(
    revision: string | number,
    scopeKey: string,
    input: BuildTopicIntelligenceInput
  ): TopicIntelligenceSnapshot | null {
    if (revision !== cachedRevision || scopeKey !== cachedScopeKey) {
      cache.clear();
      cachedRevision = revision;
      cachedScopeKey = scopeKey;
    }

    const topicKey = `${input.subject?.id || ''}:${input.topic?.id || ''}:${input.source || 'overview'}`;
    if (cache.has(topicKey)) {
      return cache.get(topicKey) ?? null;
    }

    const result = buildTopicIntelligence(input);
    cache.set(topicKey, result);
    return result;
  }

  function clear() {
    cache.clear();
    cachedRevision = null;
    cachedScopeKey = '';
  }

  return { getSnapshot, clear };
}
