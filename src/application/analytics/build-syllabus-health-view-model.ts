import { buildSubjectAccuracy } from './build-subject-accuracy.js';

export interface SyllabusHealthSubject {
  id: string;
  name: string;
  concludedPct: number;
  inProgressPct: number;
  accuracy: number | null;
  target: number;
  gap: number | null;
  status: 'ok' | 'attention' | 'insufficient';
}

export interface SyllabusHealthViewModel {
  subjects: SyllabusHealthSubject[];
}

export function buildSyllabusHealthViewModel(state: any): SyllabusHealthViewModel {
  if (!state || !Array.isArray(state.subjects) || state.subjects.length === 0) {
    return { subjects: [] };
  }

  const activeSubjects = state.subjects.filter((s: any) => !s.archived);
  if (activeSubjects.length === 0) {
    return { subjects: [] };
  }

  const accuracyData = buildSubjectAccuracy({
    subjects: activeSubjects,
    questions: state.questoes || [],
    simulations: state.simulados || [],
    blueprint: state.examBlueprint || {},
    globalTarget: state.metas?.metaAprovacao ?? 80,
  });

  const accuracyMap = new Map<string, any>();
  accuracyData.forEach((item: any) => {
    accuracyMap.set(item.subjectId, item);
  });

  const subjects: SyllabusHealthSubject[] = activeSubjects.map((s: any) => {
    const topics = Array.isArray(s.topics) ? s.topics : [];
    const totalTopics = topics.length;
    const concludedCount = topics.filter((t: any) => t.status === 'Concluído').length;
    const inProgressCount = topics.filter((t: any) => t.status === 'Em andamento').length;

    const concludedPct = totalTopics > 0 ? Math.round((concludedCount / totalTopics) * 100) : 0;
    const inProgressPct = totalTopics > 0 ? Math.round((inProgressCount / totalTopics) * 100) : 0;

    const acc = accuracyMap.get(s.id);
    const accuracy =
      acc && acc.personal?.accuracy != null
        ? acc.personal.accuracy
        : acc && acc.simulation?.accuracy != null
          ? acc.simulation.accuracy
          : null;
    const target = acc ? acc.target : (state.metas?.metaAprovacao ?? 80);
    const gap = accuracy != null ? Math.round((accuracy - target) * 10) / 10 : null;

    let status: 'ok' | 'attention' | 'insufficient' = 'insufficient';
    if (accuracy != null) {
      if (gap != null && gap < -5) {
        status = 'attention';
      } else {
        status = 'ok';
      }
    }

    return {
      id: s.id,
      name: s.name,
      concludedPct,
      inProgressPct,
      accuracy,
      target,
      gap,
      status,
    };
  });

  // Sort: subjects needing attention first, then by concludedPct descending
  subjects.sort((a, b) => {
    if (a.status === 'attention' && b.status !== 'attention') return -1;
    if (b.status === 'attention' && a.status !== 'attention') return 1;
    return b.concludedPct - a.concludedPct;
  });

  return { subjects };
}
