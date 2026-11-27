import { unifiedReviewLabel as defaultUnifiedItemLabel } from '../../../application/calendar/build-unified-reviews.js';
import {
  isCalendarItemOverdue,
  selectTodayPendingNonSimulationItems,
  sortCalendarItemsForDay,
  type UnifiedCalendarItem,
} from '../../../domain/calendar/calendar-projection.js';
import { CALENDAR_ACTIVITY_LABELS } from '../../../state/schema.js';
import { renderIconSvg } from '../../primitives/icon.js';
import type { CalendarTabControllerContext } from './calendar-tab-controller.js';

export interface CalendarPendingListsDeps {
  ctx: CalendarTabControllerContext;
  getDoc: () => any;
  escapeHtml: (s: string) => string;
  escapeAttr: (s: string) => string;
  pluralize: (n: number, one: string, many: string) => string;
  todayISO: () => string;
  formatDatePt: (iso?: string | null) => string;
  diasParaRevisao: (date?: string | null) => number | null;
  showToast: (msg: string) => void;
  getUnifiedCalendarItems: (opts?: { includeRecurring?: boolean }) => UnifiedCalendarItem[];
  getRevisoesUnificadas: () => any[];
  updateCal: (id: string, field: string, value: any) => void;
}

/** Listas de pendências da Agenda e do Hoje: tarefas do dia e atrasadas agrupadas por data. */
export function createCalendarPendingLists(deps: CalendarPendingListsDeps) {
  const {
    ctx,
    getDoc,
    escapeHtml,
    escapeAttr,
    pluralize,
    todayISO,
    formatDatePt,
    diasParaRevisao,
    showToast,
    getUnifiedCalendarItems,
    getRevisoesUnificadas,
    updateCal,
  } = deps;

  const overdueExpandedDates: Record<string, Set<string>> = {
    calAtrasadas: new Set<string>(),
    hojeAtrasadas: new Set<string>(),
  };
  const overdueExpansionInitialized = new Set<string>();
  function toggleOverdueDate(elId: string, date: string) {
    const dates = overdueExpandedDates[elId] || (overdueExpandedDates[elId] = new Set());
    if (dates.has(date)) dates.delete(date);
    else dates.add(date);
    renderCalAtrasadas(elId);
  }

  function quickReviewButton(item: Record<string, any>, elId: string) {
    if (!String(elId || '').startsWith('hoje') || item.status === 'Concluído') {
      return '';
    }
    if (item.isEvent) {
      return `<button type="button" class="btn small ghost inline-flex items-center gap-1" data-calendar-view-event="${escapeAttr(item.id)}">Ver detalhes</button>`;
    }
    if (item.origem === 'Simulado') {
      return '';
    }
    const startBtn =
      item.kind === 'essay' && ctx.onStartTimer
        ? `<button type="button" class="btn small ghost inline-flex items-center gap-1" data-calendar-start-timer="${escapeAttr(item.id)}">Iniciar</button>`
        : '';
    return `${startBtn}<button type="button" class="btn small tonal quick-review-btn inline-flex items-center gap-1" data-delegated-click="completeUnifiedReview('${escapeAttr(item.id)}','${escapeAttr(item.origem)}')">${renderIconSvg('check', { size: 13, className: 'icon-inline' })}${item.origem === 'Calendário' ? 'Concluir tarefa' : 'Revisar'}</button>`;
  }

  function renderCalTarefasHoje(elId = 'calTarefasHoje') {
    const doc = getDoc();
    if (!doc) return;
    const ul = doc.getElementById(elId);
    if (!ul) return;
    if (elId === 'calTarefasHoje') {
      const title = ul.parentElement?.querySelector('h3');
      if (title) title.textContent = 'Tarefas de estudo e compromissos de hoje';
    }
    const today = todayISO();
    const unifiedToday = getUnifiedCalendarItems();
    const items =
      elId === 'hojeTarefasHoje'
        ? selectTodayPendingNonSimulationItems(unifiedToday, today)
        : sortCalendarItemsForDay(
            unifiedToday.filter(
              r => r.date === today && r.status !== 'Concluído' && r.status !== 'Cancelado'
            )
          );

    if (!items.length) {
      const emptyLabel =
        elId === 'hojeTarefasHoje'
          ? 'Nenhum compromisso ou tarefa na Agenda para hoje (siga o Plano de hoje acima).'
          : 'Nenhuma tarefa, compromisso ou revisão para hoje.';
      ul.innerHTML = `<li class="upcoming-empty">${emptyLabel}</li>`;
      return;
    }
    ul.innerHTML = items
      .map(x => {
        const kindLabel =
          x.kind === 'review' ? 'Revisão' : CALENDAR_ACTIVITY_LABELS[x.kind] || 'Tarefa';
        const timeBadge = x.startTime
          ? `<span class="dias-pill mr-1">${escapeHtml(x.startTime)}</span>`
          : '';
        const subjectPart = x.subject && x.subject !== x.title ? ` · ${escapeHtml(x.subject)}` : '';
        return `<li class="flex flex-wrap items-center gap-1.5"><span class="min-w-0 basis-full"><strong>${escapeHtml(x.title || defaultUnifiedItemLabel(x))}</strong>${subjectPart}</span><span class="dias-pill dias-hoje">${escapeHtml(kindLabel)}</span>${timeBadge}<span class="subject-progress-pill">${escapeHtml(x.status)}</span><span class="inline-flex flex-wrap items-center gap-1.5">${quickReviewButton(x, elId)}</span></li>`;
      })
      .join('');
  }

  // O total soma Agenda e Calendário; a Agenda só mostra a parte dela, então a origem fica à vista.
  function overdueOrigin(items: any[]): string {
    const agenda = items.filter((x: any) => x.origem === 'Agenda de Revisões').length,
      calendar = items.length - agenda;
    return agenda && calendar
      ? `${agenda} ${agenda === 1 ? 'revisão' : 'revisões'} + ${calendar} ${calendar === 1 ? 'tarefa' : 'tarefas'} · `
      : agenda
        ? `${agenda} ${agenda === 1 ? 'revisão' : 'revisões'} · `
        : calendar
          ? `${calendar} ${calendar === 1 ? 'tarefa' : 'tarefas'} · `
          : '';
  }

  function renderCalAtrasadas(elId = 'calAtrasadas') {
    const doc = getDoc();
    if (!doc) return;
    const ul = doc.getElementById(elId);
    if (!ul) return;
    const today = todayISO();
    const items = getRevisoesUnificadas()
      .filter(r => isCalendarItemOverdue(r, today))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // A lista completa mora na Agenda; Hoje e Calendário mostram só a contagem com o caminho até ela.
    if (elId !== 'calAtrasadas') {
      ul.innerHTML = items.length
        ? `<li class="overdue-summary"><strong>${pluralize(items.length, 'pendência atrasada', 'pendências atrasadas')}</strong><span>${overdueOrigin(items)}</span><div class="flex items-center gap-2 mt-2">${elId === 'hojeAtrasadas' ? '' : '<button type="button" class="btn small" data-action="open-recovery-mission" title="Missão guiada de até 30 minutos">Resgatar atrasos</button>'}<button class="btn ghost small" type="button" data-delegated-click="navigateKpi('agenda','overdue')">Ver na Agenda</button></div></li>`
        : '<li class="upcoming-empty">Nenhuma pendência atrasada.</li>';
      return;
    }
    renderCalAtrasadas('calAtrasadasResumo');

    if (!items.length) {
      ul.innerHTML = '<li class="upcoming-empty">Nenhuma pendência atrasada.</li>';
      return;
    }
    const groups = new Map<string, any[]>();
    items.forEach(item => {
      if (!groups.has(item.date)) groups.set(item.date, []);
      groups.get(item.date)!.push(item);
    });
    const entries = [...groups.entries()];

    if (!overdueExpansionInitialized.has(elId)) {
      (overdueExpandedDates[elId] || (overdueExpandedDates[elId] = new Set())).add(entries[0][0]);
      overdueExpansionInitialized.add(elId);
    }

    ul.innerHTML =
      `<li class="overdue-summary"><strong>${pluralize(items.length, 'pendência atrasada', 'pendências atrasadas')}</strong><span>${overdueOrigin(items)}${pluralize(entries.length, 'data', 'datas')} · mais antiga em ${formatDatePt(entries[0][0])}</span><button type="button" class="btn small mt-2 w-full" data-action="open-recovery-mission">Resgatar atrasos</button></li>` +
      // Todas as datas: "Mostrar mais" é do montador de listas (#calAtrasadas).
      entries
        .map(([date, dateItems]) => {
          const expanded = overdueExpandedDates[elId]?.has(date);
          return `<li class="overdue-group"><button type="button" class="overdue-group-title" aria-expanded="${Boolean(expanded)}" data-delegated-click="toggleOverdueDate('${elId}','${date}')"><span><strong>${formatDatePt(date)}</strong><small>${pluralize(dateItems.length, 'pendência', 'pendências')} · ${pluralize(Math.abs(diasParaRevisao(date) || 0), 'dia', 'dias')} de atraso</small></span>${renderIconSvg('chevron-right', { size: 14, className: 'overdue-chevron' })}</button><ul ${expanded ? '' : 'hidden'}>${dateItems.map((x: any) => `<li><span style="flex:1">${escapeHtml(x.title || x.subject || '—')} — ${escapeHtml(defaultUnifiedItemLabel(x))}<span class="item-origin">${x.origem}</span></span>${x.origem === 'Calendário' ? `<button type="button" class="btn ghost small" data-calendar-move-today="${escapeAttr(x.id)}">Mover para hoje</button>` : ''}${quickReviewButton(x, elId)}</li>`).join('')}</ul></li>`;
        })
        .join('');
  }

  function completeUnifiedReview(id: string, origin: string) {
    if (origin === 'Agenda de Revisões') {
      if (ctx.onCompleteAgendaReview) {
        ctx.onCompleteAgendaReview(id);
      }
    } else {
      const item = (ctx.state.calendar || []).find(x => x.id === id);
      if (!item || item.status === 'Concluído') return;
      updateCal(id, 'status', 'Concluído');
    }
    showToast(
      origin === 'Agenda de Revisões'
        ? 'Revisão concluída e indicadores atualizados.'
        : 'Tarefa concluída e indicadores atualizados.'
    );
  }

  return { toggleOverdueDate, renderCalTarefasHoje, renderCalAtrasadas, completeUnifiedReview };
}
