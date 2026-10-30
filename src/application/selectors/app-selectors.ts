/**
 * Application Selectors & Entity Queries
 *
 * Funções puras de seleção de dados e projeção de entidades para o StudyTrack:
 * - Resolução de Disciplinas e Tópicos ativos, arquivados e opções de seleção.
 * - Resolução polimórfica de IDs e Nomes de entidades (entitySubjectId, entitySubjectName).
 * - Cálculos de calendário e proximidade civil local (=A2-HOJE, pills, agrupamentos mensais).
 *
 * Camada: Application / Domain Queries (Puramente determinístico).
 */

import { parseLocalDate } from '../../core/date-utils.js';
import { formatDateBR } from '../../core/format-date.js';

export const MESES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function getSubjectById(subjects: any[], subjectId: string): any | null {
  if (!Array.isArray(subjects)) return null;
  return subjects.find(s => s.id === subjectId) || null;
}

export function getTopicById(
  subjects: any[],
  topicId: string | null | undefined
): { subject: any; topic: any } | null {
  if (!Array.isArray(subjects) || !topicId) return null;
  for (const subject of subjects) {
    if (Array.isArray(subject.topics)) {
      const topic = subject.topics.find((t: any) => t.id === topicId);
      if (topic) return { subject, topic };
    }
  }
  return null;
}

export function getSubjectName(subjects: any[], subjectId: string): string {
  return getSubjectById(subjects, subjectId)?.name || 'Disciplina removida';
}

export function getTopicName(subjects: any[], topicId: string): string {
  return getTopicById(subjects, topicId)?.topic?.name || 'Tópico removido';
}

export function entitySubjectId(subjects: any[], item: Record<string, any>): string | null {
  if (item?.subjectId) return item.subjectId;
  if (!item?.subject || !Array.isArray(subjects)) return null;
  return subjects.find(s => s.name === item.subject)?.id || null;
}

export function entitySubjectName(subjects: any[], item: Record<string, any>): string {
  const id = entitySubjectId(subjects, item);
  return id ? getSubjectName(subjects, id) : item?.subject || '—';
}

export function allTopics(subjects: any[]): any[] {
  if (!Array.isArray(subjects)) return [];
  return subjects.flatMap(s =>
    (s.topics || []).map((t: any) => ({
      ...t,
      subjectName: s.name,
      subjectId: s.id,
      subjectArchived: Boolean(s.archived),
      topicArchived: Boolean(t.archived),
    }))
  );
}

export function activeSubjects(subjects: any[]): any[] {
  if (!Array.isArray(subjects)) return [];
  return subjects.filter(subject => !subject.archived);
}

export function activeTopics(subjects: any[]): any[] {
  return allTopics(subjects).filter(topic => !topic.subjectArchived && !topic.topicArchived);
}

export function isActiveSubjectId(subjects: any[], subjectId: string | null | undefined): boolean {
  if (!subjectId) return false;
  const subject = getSubjectById(subjects, subjectId);
  return Boolean(subject && !subject.archived);
}

export function isActiveTopicId(subjects: any[], topicId: string | null | undefined): boolean {
  if (!topicId) return false;
  const found = getTopicById(subjects, topicId);
  return Boolean(found && !found.subject.archived && !found.topic.archived);
}

export function isActiveStudyReference(
  subjects: any[],
  subjectId: string | null | undefined,
  topicId: string | null = null
): boolean {
  if (!isActiveSubjectId(subjects, subjectId)) return false;
  return !topicId || isActiveTopicId(subjects, topicId);
}

export function subjectsForSelection(subjects: any[], selectedId: string | null = null): any[] {
  if (!Array.isArray(subjects)) return [];
  return subjects.filter(subject => !subject.archived || subject.id === selectedId);
}

export function topicsForSelection(
  subjects: any[],
  subjectOrId: any,
  selectedTopicId: string | null = null
): any[] {
  const subject =
    subjectOrId && typeof subjectOrId === 'object'
      ? subjectOrId
      : getSubjectById(subjects, subjectOrId);
  if (!subject || !Array.isArray(subject.topics)) return [];
  return subject.topics.filter((topic: any) => !topic.archived || topic.id === selectedTopicId);
}

export function localDateISO(value: any): string {
  if (arguments.length === 0 || value === undefined || value === null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string | null | undefined, days: number): string {
  if (!iso) return '';
  const d = parseLocalDate(iso);
  if (!d) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return localDateISO(d);
}

export function formatDatePt(iso: string | null | undefined): string {
  return iso ? formatDateBR(iso) : '—';
}

export function monthKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 7);
}

export function monthLabel(key: string | null | undefined): string {
  if (!key) return '';
  const [y, m] = key.split('-');
  const monthIndex = parseInt(m, 10) - 1;
  return `${MESES_PT[monthIndex] || m} de ${y}`;
}

export function collectMonthKeys(...arrays: any[][]): string[] {
  const set = new Set<string>();
  arrays.forEach(arr => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        const k = monthKey(item?.date);
        if (k) set.add(k);
      });
    }
  });
  return [...set].sort();
}

export function startOfWeek(d: any): string {
  const date = parseLocalDate(d);
  if (!date) return '';
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return localDateISO(date);
}

export function isSameWeek(iso: string | null | undefined, today: string): boolean {
  if (!iso || !today) return false;
  return startOfWeek(iso) === startOfWeek(today);
}

export function isSameMonth(iso: string | null | undefined, today: string): boolean {
  if (!iso || !today) return false;
  return monthKey(iso) === monthKey(today);
}

export function diasParaRevisao(
  targetIso: string | null | undefined,
  todayIso: string
): number | null {
  if (!targetIso || !todayIso) return null;
  const alvo = parseLocalDate(targetIso);
  const hoje = parseLocalDate(todayIso);
  if (!alvo || !hoje) return null;
  return Math.round((Number(alvo) - Number(hoje)) / 86400000);
}

export function diasParaRevisaoPill(
  targetIso: string | null | undefined,
  status: string,
  todayIso: string
): string {
  const dias = diasParaRevisao(targetIso, todayIso);
  if (dias === null) return `<span class="dias-pill dias-futura">—</span>`;
  if (status === 'Concluído') {
    return `<span class="dias-pill dias-futura">—</span>`;
  }
  if (dias < 0) return `<span class="dias-pill dias-atrasada">${dias}d</span>`;
  if (dias === 0) return `<span class="dias-pill dias-hoje">hoje</span>`;
  if (dias <= 7) return `<span class="dias-pill dias-proxima">em ${dias}d</span>`;
  return `<span class="dias-pill dias-futura">em ${dias}d</span>`;
}

export interface AppSelectorsDependencies {
  getState: () => { subjects?: any[]; [key: string]: any };
  getToday: () => string;
}

export function createAppSelectors(deps: AppSelectorsDependencies) {
  const getSubjects = () => deps.getState()?.subjects || [];
  const getToday = () => deps.getToday();

  return {
    getSubjectById: (id: string) => getSubjectById(getSubjects(), id),
    getTopicById: (id: string | null | undefined) => getTopicById(getSubjects(), id),
    getSubjectName: (id: string) => getSubjectName(getSubjects(), id),
    getTopicName: (id: string) => getTopicName(getSubjects(), id),
    entitySubjectId: (item: Record<string, any>) => entitySubjectId(getSubjects(), item),
    entitySubjectName: (item: Record<string, any>) => entitySubjectName(getSubjects(), item),
    allTopics: () => allTopics(getSubjects()),
    activeSubjects: () => activeSubjects(getSubjects()),
    activeTopics: () => activeTopics(getSubjects()),
    isActiveSubjectId: (id: string | null | undefined) => isActiveSubjectId(getSubjects(), id),
    isActiveTopicId: (id: string | null | undefined) => isActiveTopicId(getSubjects(), id),
    isActiveStudyReference: (sId: string | null | undefined, tId: string | null = null) =>
      isActiveStudyReference(getSubjects(), sId, tId),
    subjectsForSelection: (selectedId: string | null = null) =>
      subjectsForSelection(getSubjects(), selectedId),
    topicsForSelection: (subjectOrId: any, selectedTopicId: string | null = null) =>
      topicsForSelection(getSubjects(), subjectOrId, selectedTopicId),
    diasParaRevisao: (iso: string | null | undefined) => diasParaRevisao(iso, getToday()),
    diasParaRevisaoPill: (iso: string | null | undefined, status: string) =>
      diasParaRevisaoPill(iso, status, getToday()),
    monthKey,
    monthLabel,
    collectMonthKeys,
    startOfWeek,
    isSameWeek: (iso: string | null | undefined) => isSameWeek(iso, getToday()),
    isSameMonth: (iso: string | null | undefined) => isSameMonth(iso, getToday()),
    addDays,
    formatDatePt,
    localDateISO,
  };
}
