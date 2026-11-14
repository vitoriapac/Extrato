import { addLocalDays, parseLocalDate } from '../../core/date-utils.js';

export const PERFORMANCE_SECTIONS = Object.freeze([
  'overview',
  'subjects',
  'diagnosis',
  'questions',
  'simulations',
  'exam',
  'consistency',
  'history',
]);
/** Seções de uma página só ("Provas"): a do estado é a âncora para a qual a página rola. */
export const PROOF_SECTIONS: readonly string[] = Object.freeze(['questions', 'simulations', 'exam']);
/** Modos da Comparação entre disciplinas (Disciplinas): precisão, tendência, progresso e radar. */
export const COMPARE_MODES = Object.freeze(['accuracy', 'trend', 'progress', 'radar']);
export const PERFORMANCE_PERIODS = Object.freeze(['7', '30', '90', 'all']);

export function createPerformanceViewState() {
  return {
    section: 'overview',
    period: '30',
    comparePrevious: true,
    subjectId: null as string | null,
    topicId: null as string | null,
    subjectSort: 'gap',
    adherenceWeeks: 8,
    compareMode: 'accuracy',
  };
}

export function resolvePerformanceRange({
  today,
  period = '30',
  comparePrevious = true,
}: any = {}) {
  if (!parseLocalDate(today))
    return {
      start: null,
      end: null,
      previous: null,
      comparePrevious: false,
      label: 'Período indisponível',
    };
  if (period === 'all')
    return {
      start: null,
      end: today,
      previous: null,
      comparePrevious: false,
      label: 'Todo o histórico',
    };
  const days = PERFORMANCE_PERIODS.includes(String(period)) ? Number(period) : 30;
  const start = addLocalDays(today, 1 - days);
  return {
    start,
    end: today,
    previous: comparePrevious
      ? { start: addLocalDays(start, -days), end: addLocalDays(start, -1) }
      : null,
    comparePrevious: Boolean(comparePrevious),
    label: `Últimos ${days} dias`,
  };
}

export function updatePerformanceViewState(
  state: ReturnType<typeof createPerformanceViewState>,
  patch: any = {}
) {
  const next = { ...state };
  if (patch.section !== undefined && PERFORMANCE_SECTIONS.includes(patch.section))
    next.section = patch.section;
  if (patch.period !== undefined && PERFORMANCE_PERIODS.includes(String(patch.period)))
    next.period = String(patch.period);
  if (patch.comparePrevious !== undefined) next.comparePrevious = Boolean(patch.comparePrevious);
  if (patch.subjectId !== undefined) {
    next.subjectId = patch.subjectId || null;
    next.topicId = null;
  }
  if (patch.topicId !== undefined) next.topicId = patch.topicId || null;
  if (
    patch.subjectSort !== undefined &&
    ['gap', 'accuracy', 'evolution', 'questions', 'priority', 'balance'].includes(patch.subjectSort)
  )
    next.subjectSort = patch.subjectSort;
  if (patch.compareMode !== undefined && COMPARE_MODES.includes(patch.compareMode))
    next.compareMode = patch.compareMode;
  if (patch.adherenceWeeks !== undefined && [4, 8, 12].includes(Number(patch.adherenceWeeks)))
    next.adherenceWeeks = Number(patch.adherenceWeeks);
  if (next.period === 'all') next.comparePrevious = false;
  return next;
}
