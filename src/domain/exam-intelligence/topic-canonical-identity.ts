/**
 * Identidade Canônica de Tópicos (Ciclo 2.1 — modelo híbrido).
 *
 * Permite sugerir correspondências entre nomes de tópicos de diferentes editais
 * e um catálogo canônico opcional, exigindo confirmação explícita (sem fusão
 * automática por semelhança textual) e preservando o nome original do edital.
 */

import type { TopicEquivalenceRecord } from '../../core/types.js';

export interface CanonicalTopicEntry {
  canonicalTopicId: string;
  canonicalName: string;
  aliases?: readonly string[];
}

export interface CanonicalMatchSuggestion {
  canonicalTopicId: string;
  canonicalName: string;
  score: number;
  ambiguous: boolean;
}

export function normalizeTopicTitle(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sugere correspondências candidatas sem jamais aplicar fusão automática.
 */
export function suggestCanonicalMatches({
  topicName,
  canonicalCatalog = [],
}: {
  topicName: string;
  canonicalCatalog?: readonly CanonicalTopicEntry[];
}): CanonicalMatchSuggestion[] {
  const target = normalizeTopicTitle(topicName);
  if (!target || !canonicalCatalog.length) return [];

  const targetTokens = new Set(target.split(' ').filter(Boolean));
  const matches: Array<{ entry: CanonicalTopicEntry; score: number }> = [];

  for (const entry of canonicalCatalog) {
    const candidates = [entry.canonicalName, ...(entry.aliases || [])]
      .map(normalizeTopicTitle)
      .filter(Boolean);

    let bestScore = 0;
    for (const candidate of candidates) {
      if (candidate === target) {
        bestScore = 1;
        break;
      }
      const candidateTokens = new Set(candidate.split(' ').filter(Boolean));
      const intersection = [...targetTokens].filter(t => candidateTokens.has(t)).length;
      const union = new Set([...targetTokens, ...candidateTokens]).size;
      const jaccard = union > 0 ? intersection / union : 0;
      if (jaccard > bestScore) bestScore = jaccard;
    }

    if (bestScore >= 0.5) {
      matches.push({ entry, score: Number(bestScore.toFixed(2)) });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const topScore = matches[0]?.score ?? 0;
  const tiedAtTop = matches.filter(m => m.score === topScore).length > 1;

  return matches.slice(0, 3).map(m => ({
    canonicalTopicId: m.entry.canonicalTopicId,
    canonicalName: m.entry.canonicalName,
    score: m.score,
    ambiguous: tiedAtTop || m.score < 1,
  }));
}

export function confirmTopicEquivalence({
  id,
  topicId,
  preservedOriginalName,
  canonicalTopicId,
  canonicalName,
  source = 'manual',
  confirmedAt,
}: {
  id: string;
  topicId: string;
  preservedOriginalName: string;
  canonicalTopicId: string;
  canonicalName: string;
  source?: 'manual' | 'catalog';
  confirmedAt: string;
}): TopicEquivalenceRecord {
  return Object.freeze({
    id,
    topicId,
    preservedOriginalName: preservedOriginalName.trim(),
    canonicalTopicId,
    canonicalName: canonicalName.trim(),
    source,
    confirmedAt,
  });
}

export function resolveCanonicalTopicId(
  topicId: string,
  equivalences: readonly TopicEquivalenceRecord[] = []
): string {
  const found = equivalences.find(eq => eq.topicId === topicId);
  return found ? found.canonicalTopicId : topicId;
}
