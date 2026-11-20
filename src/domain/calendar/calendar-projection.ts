import type { CalendarActivityKind, CalendarRecurrenceRule, Metas } from '../../core/types.js';
import { addLocalDays, formatLocalDate, parseLocalDate } from '../../core/date-utils.js';

export type UnifiedCalendarKind = CalendarActivityKind | 'review';
export type UnifiedCalendarOrigin = 'Calendário' | 'Agenda de Revisões' | 'Simulado';

export interface UnifiedCalendarItem {
  key: string;
  id: string;
  date: string;
  kind: UnifiedCalendarKind;
  title: string;
  label: string;
  status: string;
  origem: UnifiedCalendarOrigin;
  subjectId: string | null;
  subject: string;
  topicId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  estimatedMinutes?: number | null;
  recurrence?: CalendarRecurrenceRule | null;
  isRecurringInstance?: boolean;
  description?: string | null;
  location?: string | null;
  externalUrl?: string | null;
  linkedSimulationId?: string | null;
  essayTheme?: string | null;
  essayScore?: number | null;
  essayMaxScore?: number | null;
  essayStatus?: 'draft' | 'written' | 'graded' | null;
  isEvent: boolean;
  isDraggable: boolean;
}

export interface DailyCalendarLoad {
  date: string;
  totalMinutes: number;
  itemCount: number;
  actionableCount: number;
  conflicts: Array<{ first: UnifiedCalendarItem; second: UnifiedCalendarItem }>;
}

const NON_PENDING_STATUSES = new Set(['Concluído', 'Cancelado']);

export function isActionableCalendarKind(kind: UnifiedCalendarKind): boolean {
  return kind !== 'event';
}

export function isCalendarItemPending(item: Pick<UnifiedCalendarItem, 'status' | 'date'>): boolean {
  return Boolean(item.date) && !NON_PENDING_STATUSES.has(item.status || '');
}

/**
 * Marcos/eventos oficiais (ex: prova, inscrição) não viram pendência atrasada
 * automaticamente quando a data passa.
 */
export function isCalendarItemOverdue(
  item: Pick<UnifiedCalendarItem, 'kind' | 'status' | 'date'>,
  today: string
): boolean {
  if (!isActionableCalendarKind(item.kind)) return false;
  return isCalendarItemPending(item) && item.date < today;
}

export function timeToMinutes(hhmm: string | null | undefined): number | null {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function sortCalendarItemsForDay<T extends Pick<UnifiedCalendarItem, 'startTime' | 'title' | 'subject'>>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const ta = timeToMinutes(a.startTime);
    const tb = timeToMinutes(b.startTime);
    if (ta !== null && tb !== null) {
      if (ta !== tb) return ta - tb;
    } else if (ta !== null) {
      return -1;
    } else if (tb !== null) {
      return 1;
    }
    const labelA = (a.title || a.subject || '').toLowerCase();
    const labelB = (b.title || b.subject || '').toLowerCase();
    return labelA.localeCompare(labelB, 'pt-BR');
  });
}

/**
 * Seleciona os itens pendentes do dia para a lista de compromissos da aba Hoje,
 * excluindo simulados (`mock_exam`) porque eles possuem seção dedicada em Hoje
 * (`#hojeSimuladosPlanejados`), evitando duplicação visual.
 */
export function selectTodayPendingNonSimulationItems(
  items: UnifiedCalendarItem[],
  today: string
): UnifiedCalendarItem[] {
  if (!today) return [];
  return sortCalendarItemsForDay(
    items.filter(
      item =>
        item.date === today &&
        item.status !== 'Concluído' &&
        item.status !== 'Cancelado' &&
        item.kind !== 'mock_exam'
    )
  );
}

/**
 * Seleciona simulados planejados (da Agenda ou de `state.simulados`, já
 * deduplicados por `linkedSimulationId` via `buildUnifiedCalendarItems`)
 * para exibição unificada a partir de `today`.
 */
export function selectPlannedSimulationsForTodayView(
  items: UnifiedCalendarItem[],
  today: string
): UnifiedCalendarItem[] {
  if (!today) return [];
  const planned = items.filter(
    item =>
      item.kind === 'mock_exam' &&
      item.status !== 'Concluído' &&
      item.status !== 'Cancelado' &&
      Boolean(item.date) &&
      item.date >= today
  );
  return [...planned].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return sortCalendarItemsForDay([a, b])[0] === a ? -1 : 1;
  });
}

export interface EssayEvolutionEntry {
  id: string;
  date: string;
  title: string;
  essayTheme: string | null;
  essayStatus: 'draft' | 'written' | 'graded';
  essayScore: number | null;
  essayMaxScore: number | null;
  normalizedPercent: number | null;
  taskStatus: string;
}

export interface EssayEvolutionSummary {
  totalCount: number;
  gradedCount: number;
  averagePercent: number | null;
  latestScoreLabel: string | null;
  entries: EssayEvolutionEntry[];
}

/**
 * Consolida o histórico e a evolução das redações cadastradas na Agenda,
 * mantendo o lançamento de nota independente da conclusão da tarefa.
 */
export function buildEssayEvolutionSummary(
  items: UnifiedCalendarItem[]
): EssayEvolutionSummary {
  const essays = items
    .filter(item => item.kind === 'essay' && !item.isRecurringInstance && item.status !== 'Cancelado')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const entries: EssayEvolutionEntry[] = essays.map(item => {
    const score = typeof item.essayScore === 'number' && Number.isFinite(item.essayScore) ? item.essayScore : null;
    const maxScore =
      typeof item.essayMaxScore === 'number' && Number.isFinite(item.essayMaxScore) && item.essayMaxScore > 0
        ? item.essayMaxScore
        : null;
    const normalizedPercent =
      score !== null && maxScore !== null ? Math.round((score / maxScore) * 100) : null;
    const essayStatus: 'draft' | 'written' | 'graded' =
      item.essayStatus === 'graded' || score !== null
        ? 'graded'
        : item.essayStatus === 'written' || item.status === 'Concluído'
          ? 'written'
          : 'draft';
    return {
      id: item.id,
      date: item.date,
      title: item.title || 'Redação',
      essayTheme: item.essayTheme || null,
      essayStatus,
      essayScore: score,
      essayMaxScore: maxScore,
      normalizedPercent,
      taskStatus: item.status || 'Não iniciado',
    };
  });

  const graded = entries.filter(e => e.essayScore !== null);
  const withPercent = graded.filter(e => e.normalizedPercent !== null);
  const averagePercent =
    withPercent.length > 0
      ? Math.round(
          withPercent.reduce((sum, e) => sum + (e.normalizedPercent || 0), 0) / withPercent.length
        )
      : null;
  const latestGraded = graded[0] || null;
  const latestScoreLabel = latestGraded
    ? `${latestGraded.essayScore}${latestGraded.essayMaxScore ? `/${latestGraded.essayMaxScore}` : ''}`
    : null;

  return {
    totalCount: entries.length,
    gradedCount: graded.length,
    averagePercent,
    latestScoreLabel,
    entries,
  };
}

export function computeDailyCalendarLoad(
  items: UnifiedCalendarItem[],
  date: string
): DailyCalendarLoad {
  const dayItems = sortCalendarItemsForDay(
    items.filter(item => item.date === date && item.status !== 'Cancelado')
  );
  let totalMinutes = 0;
  let actionableCount = 0;

  for (const item of dayItems) {
    if (!isActionableCalendarKind(item.kind)) continue;
    actionableCount += 1;
    if (item.status !== 'Concluído' && typeof item.estimatedMinutes === 'number' && item.estimatedMinutes > 0) {
      totalMinutes += item.estimatedMinutes;
    }
  }

  const timed = dayItems
    .map(item => {
      const start = timeToMinutes(item.startTime);
      if (start === null) return null;
      const explicitEnd = timeToMinutes(item.endTime);
      const duration = item.estimatedMinutes && item.estimatedMinutes > 0 ? item.estimatedMinutes : 30;
      const end = explicitEnd !== null && explicitEnd > start ? explicitEnd : start + duration;
      return { item, start, end };
    })
    .filter((entry): entry is { item: UnifiedCalendarItem; start: number; end: number } => entry !== null);

  const conflicts: Array<{ first: UnifiedCalendarItem; second: UnifiedCalendarItem }> = [];
  for (let i = 0; i < timed.length; i += 1) {
    for (let j = i + 1; j < timed.length; j += 1) {
      if (timed[i].end > timed[j].start && timed[j].end > timed[i].start) {
        conflicts.push({ first: timed[i].item, second: timed[j].item });
      }
    }
  }

  return {
    date,
    totalMinutes,
    itemCount: dayItems.length,
    actionableCount,
    conflicts,
  };
}

export function getWeekDates(anchorDate: string): string[] {
  const parsed = parseLocalDate(anchorDate);
  if (!parsed) return [];
  const startOffset = -parsed.getDay();
  const start = addLocalDays(formatLocalDate(parsed), startOffset);
  if (!start) return [];
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = addLocalDays(start, i);
    if (day) days.push(day);
  }
  return days;
}

export function getAvailableMinutesForDate(
  metas: Partial<Pick<Metas, 'horasDiarias' | 'horasPorDia'>> | null | undefined,
  date: string
): number {
  if (!metas) return 0;
  const parsed = parseLocalDate(date);
  if (parsed && metas.horasPorDia && typeof metas.horasPorDia === 'object') {
    const dayHours = Number(metas.horasPorDia[String(parsed.getDay())]);
    if (Number.isFinite(dayHours) && dayHours >= 0) {
      return Math.round(dayHours * 60);
    }
  }
  const fallbackHours = Number(metas.horasDiarias);
  return Number.isFinite(fallbackHours) && fallbackHours > 0 ? Math.round(fallbackHours * 60) : 0;
}

export interface DraftOverloadPreview {
  existingMinutes: number;
  draftMinutes: number;
  projectedMinutes: number;
  availableMinutes: number;
  isOverloaded: boolean;
}

/**
 * Calcula em memória a carga projetada ao cadastrar ou editar uma atividade
 * para avisar sobre sobrecarga sem bloquear o salvamento.
 */
export function computeDraftOverloadPreview(
  items: UnifiedCalendarItem[],
  draft: {
    id?: string | null;
    kind: UnifiedCalendarKind;
    date: string;
    status?: string;
    startTime?: string | null;
    endTime?: string | null;
    estimatedMinutes?: number | string | null;
  },
  metas: Partial<Pick<Metas, 'horasDiarias' | 'horasPorDia'>> | null | undefined
): DraftOverloadPreview {
  if (!draft.date || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
    return {
      existingMinutes: 0,
      draftMinutes: 0,
      projectedMinutes: 0,
      availableMinutes: 0,
      isOverloaded: false,
    };
  }
  const remainingItems = draft.id ? items.filter(item => item.id !== draft.id) : items;
  const existingLoad = computeDailyCalendarLoad(remainingItems, draft.date);
  let draftMinutes = 0;
  if (
    isActionableCalendarKind(draft.kind) &&
    draft.status !== 'Concluído' &&
    draft.status !== 'Cancelado'
  ) {
    const explicitMinutes = Number(draft.estimatedMinutes);
    if (Number.isFinite(explicitMinutes) && explicitMinutes > 0) {
      draftMinutes = Math.round(explicitMinutes);
    } else {
      const start = timeToMinutes(draft.startTime);
      const end = timeToMinutes(draft.endTime);
      if (start !== null && end !== null && end > start) {
        draftMinutes = end - start;
      }
    }
  }
  const projectedMinutes = existingLoad.totalMinutes + draftMinutes;
  const availableMinutes = getAvailableMinutesForDate(metas, draft.date);
  return {
    existingMinutes: existingLoad.totalMinutes,
    draftMinutes,
    projectedMinutes,
    availableMinutes,
    isOverloaded: availableMinutes > 0 && projectedMinutes > availableMinutes,
  };
}

function nextRecurringDate(date: string, rule: CalendarRecurrenceRule): string | null {
  if (rule === 'weekly') return addLocalDays(date, 7);
  if (rule === 'biweekly') return addLocalDays(date, 14);
  if (rule === 'monthly') {
    const parsed = parseLocalDate(date);
    if (!parsed) return null;
    const targetDay = parsed.getDate();
    const next = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 1, 12, 0, 0, 0);
    const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0, 12, 0, 0, 0).getDate();
    next.setDate(Math.min(targetDay, maxDay));
    return formatLocalDate(next);
  }
  return null;
}

/**
 * Expande ocorrências recorrentes em memória dentro de [rangeStart, rangeEnd]
 * sem mutar ou duplicar registros persistidos.
 */
export function expandRecurringCalendarItems(
  items: UnifiedCalendarItem[],
  rangeStart: string,
  rangeEnd: string
): UnifiedCalendarItem[] {
  if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return items;
  const result = [...items];
  const existingKeys = new Set(items.map(i => `${i.id}:${i.date}`));

  for (const item of items) {
    const rule = item.recurrence;
    if (!rule || rule === 'none' || !item.date || item.status === 'Cancelado') continue;
    let cursor: string | null = item.date;
    let steps = 0;
    while (steps < 64) {
      steps += 1;
      cursor = nextRecurringDate(cursor, rule);
      if (!cursor || cursor > rangeEnd) break;
      if (cursor < rangeStart) continue;
      if (existingKeys.has(`${item.id}:${cursor}`)) continue;
      existingKeys.add(`${item.id}:${cursor}`);
      result.push({
        ...item,
        key: `${item.origem}:${item.id}:${cursor}`,
        date: cursor,
        status: 'Não iniciado',
        isRecurringInstance: true,
        isDraggable: false,
      });
    }
  }

  return result;
}
