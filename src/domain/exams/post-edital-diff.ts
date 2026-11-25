import { normalizeTopicTitle } from '../exam-intelligence/topic-canonical-identity.js';
import type { ParsedSyllabusSubject } from '../../application/subjects/raw-syllabus-parser.js';
import type { TopicEquivalenceRecord } from '../../core/types.js';

export type PostEditalTopicCategory = 'covered' | 'equivalent_candidate' | 'delta_new';

export interface PostEditalDiffTopicItem {
  subjectName: string;
  incomingTopicName: string;
  code?: string;
  category: PostEditalTopicCategory;
  matchedTopicId: string | null;
  matchedTopicName: string | null;
  matchedSubjectName: string | null;
  similarityScore: number;
  weight: number;
}

export interface PostEditalDiffResult {
  baggageReusePercent: number;
  masteredReusePercent: number;
  masteredCount: number;
  totalIncomingTopics: number;
  coveredCount: number;
  equivalentCandidateCount: number;
  deltaNewCount: number;
  deltaEstimatedHours: number;
  availableHoursUntilD15: number | null;
  viable: boolean | null;
  items: PostEditalDiffTopicItem[];
  covered: PostEditalDiffTopicItem[];
  equivalentCandidates: PostEditalDiffTopicItem[];
  deltaNew: PostEditalDiffTopicItem[];
}

const DEFAULT_DELTA_TOPIC_MINUTES = 90;

const STOP_WORDS = new Set([
  'a',
  'as',
  'o',
  'os',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'na',
  'no',
  'nas',
  'nos',
  'para',
  'por',
  'com',
  'sem',
  'sobre',
  'seu',
  'sua',
]);

function significantTokens(title: string): Set<string> {
  return new Set(
    normalizeTopicTitle(title)
      .split(' ')
      .filter(token => token.length > 1 && !STOP_WORDS.has(token))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Compara em memória um edital colado/importado contra a bagagem histórica já estudada
 * pelo candidato, calculando % de aproveitamento, equivalências candidatas e delta pós-edital.
 */
export interface PostEditalExistingSubject {
  id: string;
  name?: string | null;
  archived?: boolean;
  topics?: Array<{
    id: string;
    name?: string | null;
    archived?: boolean;
    status?: string | null;
  }>;
}

export interface PostEditalSessionLike {
  topicId?: string | null;
  durationSeconds?: number | null;
}

export interface PostEditalQuestionLike {
  topicId?: string | null;
  resolved?: number | null;
  correct?: number | null;
}

export interface PostEditalBlueprintSubjectLike {
  subjectId?: string | null;
  questionWeight?: number | null;
}

export function buildPostEditalDiff({
  incomingSubjects = [],
  existingSubjects = [],
  equivalences = [],
  sessions = [],
  questions = [],
  blueprintSubjects = [],
  daysToExam = null,
  weeklyAvailableMinutes = 1200,
  estimatedMinutesPerNewTopic = DEFAULT_DELTA_TOPIC_MINUTES,
}: {
  incomingSubjects: ParsedSyllabusSubject[];
  existingSubjects?: PostEditalExistingSubject[];
  equivalences?: TopicEquivalenceRecord[];
  sessions?: PostEditalSessionLike[];
  questions?: PostEditalQuestionLike[];
  blueprintSubjects?: PostEditalBlueprintSubjectLike[];
  daysToExam?: number | null;
  weeklyAvailableMinutes?: number;
  estimatedMinutesPerNewTopic?: number;
}): PostEditalDiffResult {
  const studiedTopicIds = new Set<string>();
  for (const s of sessions || []) {
    if (s?.topicId && (Number(s.durationSeconds) || 0) > 0) studiedTopicIds.add(s.topicId);
  }
  for (const q of questions || []) {
    if (q?.topicId && (Number(q.resolved) || 0) > 0) studiedTopicIds.add(q.topicId);
  }

  const bpWeightBySubjectId = new Map<string, number>();
  for (const bp of blueprintSubjects || []) {
    if (bp?.subjectId) {
      bpWeightBySubjectId.set(bp.subjectId, Math.max(0.1, Number(bp.questionWeight ?? 1) || 1));
    }
  }

  const existingCatalog: Array<{
    topicId: string;
    topicName: string;
    subjectId: string;
    subjectName: string;
    normSubject: string;
    normTitle: string;
    tokens: Set<string>;
    studied: boolean;
  }> = [];
  const existingSubjectByNormName = new Map<string, PostEditalExistingSubject>();

  for (const sub of existingSubjects || []) {
    if (!sub || sub.archived) continue;
    const normSub = normalizeTopicTitle(sub.name || '');
    if (normSub) existingSubjectByNormName.set(normSub, sub);
    for (const top of sub.topics || []) {
      if (!top || top.archived) continue;
      const isStudied =
        studiedTopicIds.has(top.id) || Boolean(top.status && top.status !== 'Não iniciado');
      existingCatalog.push({
        topicId: top.id,
        topicName: top.name || '',
        subjectId: sub.id,
        subjectName: sub.name || '',
        normSubject: normSub,
        normTitle: normalizeTopicTitle(top.name || ''),
        tokens: significantTokens(top.name || ''),
        studied: isStudied,
      });
    }
  }

  // Mapa de equivalências confirmadas: nome preservado ou canônico -> tópico existente estudado
  const equivalenceByNormName = new Map<string, typeof existingCatalog[number]>();
  for (const eq of equivalences || []) {
    if (!eq?.confirmedAt || !eq.topicId) continue;
    const target = existingCatalog.find(item => item.topicId === eq.topicId);
    if (!target) continue;
    const normPreserved = normalizeTopicTitle(eq.preservedOriginalName || '');
    if (normPreserved) equivalenceByNormName.set(normPreserved, target);
    const normCanonical = normalizeTopicTitle(eq.canonicalName || '');
    if (normCanonical && !equivalenceByNormName.has(normCanonical)) {
      equivalenceByNormName.set(normCanonical, target);
    }
  }

  const items: PostEditalDiffTopicItem[] = [];
  let totalWeight = 0;
  let coveredWeight = 0;

  for (const incomingSub of incomingSubjects || []) {
    const normIncomingSub = normalizeTopicTitle(incomingSub.name || '');
    const mappedExistingSub = existingSubjectByNormName.get(normIncomingSub);
    const weight = mappedExistingSub
      ? (bpWeightBySubjectId.get(mappedExistingSub.id) ?? 1)
      : 1;

    for (const topic of incomingSub.topics || []) {
      const normTitle = normalizeTopicTitle(topic.name || '');
      if (!normTitle) continue;
      totalWeight += weight;

      const eqMatch = equivalenceByNormName.get(normTitle);
      if (eqMatch) {
        if (eqMatch.studied) coveredWeight += weight;
        items.push({
          subjectName: incomingSub.name,
          incomingTopicName: topic.name,
          ...(topic.code ? { code: topic.code } : {}),
          category: eqMatch.studied ? 'covered' : 'equivalent_candidate',
          matchedTopicId: eqMatch.topicId,
          matchedTopicName: eqMatch.topicName,
          matchedSubjectName: eqMatch.subjectName,
          similarityScore: 1,
          weight,
        });
        continue;
      }

      const incomingTokens = significantTokens(topic.name || '');
      let bestMatch: typeof existingCatalog[number] | null = null;
      let bestScore = 0;

      for (const candidate of existingCatalog) {
        if (candidate.normTitle === normTitle && candidate.normSubject === normIncomingSub) {
          bestMatch = candidate;
          bestScore = 1;
          break;
        }
        let score = candidate.normTitle === normTitle ? 0.95 : jaccardSimilarity(incomingTokens, candidate.tokens);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = candidate;
        }
      }

      if (bestMatch && bestScore >= 0.8 && bestMatch.studied) {
        coveredWeight += weight;
        items.push({
          subjectName: incomingSub.name,
          incomingTopicName: topic.name,
          ...(topic.code ? { code: topic.code } : {}),
          category: 'covered',
          matchedTopicId: bestMatch.topicId,
          matchedTopicName: bestMatch.topicName,
          matchedSubjectName: bestMatch.subjectName,
          similarityScore: Number(bestScore.toFixed(2)),
          weight,
        });
      } else if (bestMatch && bestScore >= 0.5) {
        items.push({
          subjectName: incomingSub.name,
          incomingTopicName: topic.name,
          ...(topic.code ? { code: topic.code } : {}),
          category: 'equivalent_candidate',
          matchedTopicId: bestMatch.topicId,
          matchedTopicName: bestMatch.topicName,
          matchedSubjectName: bestMatch.subjectName,
          similarityScore: Number(bestScore.toFixed(2)),
          weight,
        });
      } else {
        items.push({
          subjectName: incomingSub.name,
          incomingTopicName: topic.name,
          ...(topic.code ? { code: topic.code } : {}),
          category: 'delta_new',
          matchedTopicId: null,
          matchedTopicName: null,
          matchedSubjectName: null,
          similarityScore: 0,
          weight,
        });
      }
    }
  }

  const covered = items.filter(i => i.category === 'covered');
  const equivalentCandidates = items.filter(i => i.category === 'equivalent_candidate');
  const deltaNew = items.filter(i => i.category === 'delta_new');

  const baggageReusePercent =
    totalWeight > 0 ? Math.round((coveredWeight / totalWeight) * 100) : 0;

  const topicStats = new Map<string, { resolved: number; correct: number }>();
  for (const q of questions || []) {
    if (!q?.topicId) continue;
    const resolved = Math.max(0, Number(q.resolved) || 0);
    const correct = Math.max(0, Number(q.correct) || 0);
    if (!resolved) continue;
    const cur = topicStats.get(q.topicId) || { resolved: 0, correct: 0 };
    cur.resolved += resolved;
    cur.correct += correct;
    topicStats.set(q.topicId, cur);
  }
  const masteredCovered = covered.filter(item => {
    if (!item.matchedTopicId) return false;
    const stat = topicStats.get(item.matchedTopicId);
    return Boolean(stat && stat.resolved >= 10 && (stat.correct / stat.resolved) * 100 >= 75);
  });
  const masteredWeight = masteredCovered.reduce((sum, item) => sum + item.weight, 0);
  const masteredReusePercent =
    totalWeight > 0 ? Math.round((masteredWeight / totalWeight) * 100) : 0;

  const deltaEstimatedHours =
    Math.round(((deltaNew.length * estimatedMinutesPerNewTopic) / 60) * 10) / 10;

  let availableHoursUntilD15: number | null = null;
  let viable: boolean | null = null;
  if (daysToExam != null && Number.isFinite(Number(daysToExam))) {
    const usableDays = Math.max(0, Number(daysToExam) - 15);
    const weeklyHours = Math.max(0, Number(weeklyAvailableMinutes) || 0) / 60;
    availableHoursUntilD15 = Math.round(((usableDays / 7) * weeklyHours) * 10) / 10;
    viable = deltaEstimatedHours <= availableHoursUntilD15;
  }

  return {
    baggageReusePercent,
    masteredReusePercent,
    masteredCount: masteredCovered.length,
    totalIncomingTopics: items.length,
    coveredCount: covered.length,
    equivalentCandidateCount: equivalentCandidates.length,
    deltaNewCount: deltaNew.length,
    deltaEstimatedHours,
    availableHoursUntilD15,
    viable,
    items,
    covered,
    equivalentCandidates,
    deltaNew,
  };
}
