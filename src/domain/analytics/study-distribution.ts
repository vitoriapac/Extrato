import { subjectColorOf } from '../subjects/subject-color.js';

export interface StudyDistributionSession {
  date?: string | null;
  durationSeconds?: number | null;
  subjectId?: string | null;
}

export interface SubjectMeta {
  id: string;
  name: string;
  color?: unknown;
}

export interface StudyDistributionSlice {
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  seconds: number;
  percentage: number;
  startRatio: number;
  ratio: number;
}

export interface StudyDistributionModel {
  totalSeconds: number;
  sessionCount: number;
  slices: StudyDistributionSlice[];
  activeSubjectsCount: number;
}

export interface BuildStudyDistributionOptions {
  sessions: StudyDistributionSession[];
  subjects: SubjectMeta[];
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Agrega tempo total de estudo por disciplina para gráfico de rosca/pizza (Donut Chart).
 * Função pura e determinística sem dependências de DOM.
 */
export function buildStudyDistributionModel({
  sessions = [],
  subjects = [],
  startDate = null,
  endDate = null,
}: BuildStudyDistributionOptions): StudyDistributionModel {
  const subjectMap = new Map<string, { name: string; colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      name: s.name,
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  const totals = new Map<string, number>();
  let overallSeconds = 0;
  let sessionCount = 0;

  for (const session of sessions) {
    const d = session.date;
    if (startDate && d && d < startDate) continue;
    if (endDate && d && d > endDate) continue;

    const dur = Math.max(0, Number(session.durationSeconds) || 0);
    if (dur <= 0) continue;

    const subId = session.subjectId || '__sem_disciplina';
    totals.set(subId, (totals.get(subId) || 0) + dur);
    overallSeconds += dur;
    sessionCount++;
  }

  if (overallSeconds <= 0) {
    return {
      totalSeconds: 0,
      sessionCount: 0,
      slices: [],
      activeSubjectsCount: 0,
    };
  }

  const rawSlices: Array<{ subjectId: string; subjectName: string; colorSlot: number; seconds: number }> = [];
  for (const [subId, secs] of totals.entries()) {
    const meta = subjectMap.get(subId) || {
      name: subId === '__sem_disciplina' ? 'Sem disciplina' : 'Outra',
      colorSlot: 1,
    };
    rawSlices.push({
      subjectId: subId,
      subjectName: meta.name,
      colorSlot: meta.colorSlot,
      seconds: secs,
    });
  }

  // Ordena por duração decrescente
  rawSlices.sort((a, b) => b.seconds - a.seconds);

  // As 6 maiores ficam nomeadas; o restante vira uma fatia neutra (a paleta tem 8 cores).
  const MAX_NAMED = 6;
  if (rawSlices.length > MAX_NAMED + 1) {
    const rest = rawSlices.splice(MAX_NAMED);
    rawSlices.push({
      subjectId: '__outras',
      subjectName: 'Outras disciplinas',
      colorSlot: 0,
      seconds: rest.reduce((sum, item) => sum + item.seconds, 0),
    });
  }

  let currentRatio = 0;
  const slices: StudyDistributionSlice[] = rawSlices.map(s => {
    const ratio = s.seconds / overallSeconds;
    const slice: StudyDistributionSlice = {
      ...s,
      percentage: +(ratio * 100).toFixed(1),
      startRatio: +currentRatio.toFixed(4),
      ratio: +ratio.toFixed(4),
    };
    currentRatio += ratio;
    return slice;
  });

  return {
    totalSeconds: overallSeconds,
    sessionCount,
    slices,
    activeSubjectsCount: slices.length,
  };
}
