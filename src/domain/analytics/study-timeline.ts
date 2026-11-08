import { subjectColorOf } from '../subjects/subject-color.js';
import { addLocalDays } from '../../core/date-utils.js';

export interface StudyTimelineSession {
  date?: string | null;
  durationSeconds?: number | null;
  subjectId?: string | null;
  type?: string | null;
}

export interface SubjectMeta {
  id: string;
  name: string;
  color?: unknown;
}

export interface TimelineSegment {
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  seconds: number;
  share: number;
}

export interface TimelineDay {
  date: string;
  totalSeconds: number;
  segments: TimelineSegment[];
}

export interface TimelineSubjectSummary {
  subjectId: string;
  subjectName: string;
  colorSlot: number;
  totalSeconds: number;
  percentage: number;
}

export interface StudyTimelineModel {
  days: TimelineDay[];
  totalSeconds: number;
  maxDaySeconds: number;
  subjectSummaries: TimelineSubjectSummary[];
  periodDaysCount: number;
}

export interface BuildStudyTimelineOptions {
  sessions: StudyTimelineSession[];
  subjects: SubjectMeta[];
  startDate: string;
  endDate: string;
}

/**
 * Agrupa sessões de estudo por dia e por disciplina para exibição em gráfico de colunas empilhadas.
 * Função pura e determinística sem efeitos colaterais.
 */
export function buildStudyTimelineModel({
  sessions = [],
  subjects = [],
  startDate,
  endDate,
}: BuildStudyTimelineOptions): StudyTimelineModel {
  if (!startDate || !endDate || startDate > endDate) {
    return {
      days: [],
      totalSeconds: 0,
      maxDaySeconds: 0,
      subjectSummaries: [],
      periodDaysCount: 0,
    };
  }

  const subjectMap = new Map<string, { name: string; colorSlot: number }>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      name: s.name,
      colorSlot: subjectColorOf(s, subjects),
    });
  }

  // Mapeia dias do intervalo sequencialmente
  const daysMap = new Map<string, Map<string, number>>();
  let current = startDate;
  let count = 0;
  const maxGuard = 366; // Proteção contra loops infinitos

  while (current && current <= endDate && count < maxGuard) {
    daysMap.set(current, new Map<string, number>());
    current = addLocalDays(current, 1) || '';
    count++;
  }

  // Agrega sessões válidas no intervalo
  const totalPerSubject = new Map<string, number>();
  let overallSeconds = 0;

  for (const session of sessions) {
    const d = session.date;
    if (!d || !daysMap.has(d)) continue;
    const dur = Math.max(0, Number(session.durationSeconds) || 0);
    if (dur <= 0) continue;

    const subId = session.subjectId || '__sem_disciplina';
    const dayMap = daysMap.get(d)!;
    dayMap.set(subId, (dayMap.get(subId) || 0) + dur);

    totalPerSubject.set(subId, (totalPerSubject.get(subId) || 0) + dur);
    overallSeconds += dur;
  }

  // Com muitas disciplinas a paleta de 8 cores não distingue as séries: as 6 maiores ficam nomeadas, o resto vira "Outras disciplinas".
  const MAX_NAMED = 6;
  const OTHER_ID = '__outras';
  const ranked = [...totalPerSubject.entries()].sort((a, b) => b[1] - a[1]);
  const named = new Set(ranked.length > MAX_NAMED + 1 ? ranked.slice(0, MAX_NAMED).map(([id]) => id) : ranked.map(([id]) => id));
  const foldId = (id: string) => (named.has(id) ? id : OTHER_ID);
  subjectMap.set(OTHER_ID, { name: 'Outras disciplinas', colorSlot: 0 });
  let maxDaySeconds = 0;
  const days: TimelineDay[] = [];

  for (const [date, dayMap] of daysMap.entries()) {
    let dayTotal = 0;
    const segments: TimelineSegment[] = [];

    const folded = new Map<string, number>();
    for (const [id, secs] of dayMap.entries()) folded.set(foldId(id), (folded.get(foldId(id)) || 0) + secs);
    for (const [subId, secs] of folded.entries()) {
      if (secs <= 0) continue;
      dayTotal += secs;
      const meta = subjectMap.get(subId) || {
        name: subId === '__sem_disciplina' ? 'Sem disciplina' : 'Outra',
        colorSlot: 1,
      };
      segments.push({
        subjectId: subId,
        subjectName: meta.name,
        colorSlot: meta.colorSlot,
        seconds: secs,
        share: 0, // calculado abaixo
      });
    }

    if (dayTotal > maxDaySeconds) {
      maxDaySeconds = dayTotal;
    }

    // Calcula share relativo ao dia
    for (const seg of segments) {
      seg.share = dayTotal > 0 ? Math.round((seg.seconds / dayTotal) * 100) : 0;
    }

    days.push({
      date,
      totalSeconds: dayTotal,
      segments,
    });
  }

  // Resumo de disciplinas ordenado por tempo decrescente
  const subjectSummaries: TimelineSubjectSummary[] = [];
  const foldedTotals = new Map<string, number>();
  for (const [id, secs] of totalPerSubject.entries()) foldedTotals.set(foldId(id), (foldedTotals.get(foldId(id)) || 0) + secs);
  for (const [subId, totalSecs] of foldedTotals.entries()) {
    const meta = subjectMap.get(subId) || {
      name: subId === '__sem_disciplina' ? 'Sem disciplina' : 'Outra',
      colorSlot: 1,
    };
    subjectSummaries.push({
      subjectId: subId,
      subjectName: meta.name,
      colorSlot: meta.colorSlot,
      totalSeconds: totalSecs,
      percentage: overallSeconds > 0 ? +((totalSecs / overallSeconds) * 100).toFixed(1) : 0,
    });
  }

  subjectSummaries.sort((a, b) => b.totalSeconds - a.totalSeconds);

  return {
    days,
    totalSeconds: overallSeconds,
    maxDaySeconds,
    subjectSummaries,
    periodDaysCount: count,
  };
}
