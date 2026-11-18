import { renderCollectionFooter } from './list-components.js';

export const DEFAULT_LIST_VISIBLE_ITEMS = 5;
// Regra das listas: o que pode passar de ~20 itens usa paginação ('pages'); o resto, "Mostrar mais" ('more').
// A decisão é por tipo de lista, nunca pela contagem do momento.
export const PAGINATION_THRESHOLD = 20;
export const DEFAULT_PAGE_SIZE = 10;

export function createProgressiveList({
  items = [],
  initialLimit = DEFAULT_LIST_VISIBLE_ITEMS,
  sort,
  mode = 'more',
  pageSize = DEFAULT_PAGE_SIZE,
  page: initialPage = 1,
}: any = {}) {
  const ordered = sort ? [...items].sort(sort) : [...items];
  const paged = mode === 'pages';
  const limit = Math.max(1, Math.floor(initialLimit) || DEFAULT_LIST_VISIBLE_ITEMS);
  const size = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(ordered.length / size));
  const clamp = (n: number) => Math.min(pageCount, Math.max(1, Math.floor(n) || 1));
  let expanded = false;
  let page = clamp(initialPage);
  return {
    get items() {
      return ordered;
    },
    get totalItems() {
      return ordered.length;
    },
    get visibleItems() {
      if (paged) return ordered.slice((page - 1) * size, page * size);
      return expanded ? ordered : ordered.slice(0, limit);
    },
    get hiddenItems() {
      if (paged) return ordered.length - this.visibleItems.length;
      return expanded ? 0 : Math.max(0, ordered.length - limit);
    },
    get expanded() {
      return expanded;
    },
    get page() {
      return page;
    },
    pageCount,
    pageSize: size,
    initialLimit: limit,
    goTo(n: number) {
      page = clamp(n);
    },
    next() {
      page = clamp(page + 1);
    },
    prev() {
      page = clamp(page - 1);
    },
    expand() {
      expanded = ordered.length > limit;
    },
    collapse() {
      expanded = false;
    },
    reset() {
      expanded = false;
      page = 1;
    },
    toggle() {
      expanded ? this.collapse() : this.expand();
    },
  };
}

// Explicit opt-in: charts, matrices, navigation and achievements are excluded.
// Entrada: [seletor da lista, seletor dos itens, itens à vista, modo, rótulo]. O modo padrão é
// "Mostrar mais"; 'pages' pagina (listas que podem passar de ~20 itens, com tamanho de página no 3º campo).
const LISTS: any[] = [
  ['.sustainability-exclusions', ':scope > li'],
  ['.recurring-priority-list', ':scope > li'],
  // Cada retrato é uma dobra: 5 por página mantém a aba Histórico abaixo de 20 dobras à vista.
  ['.weekly-adherence-history > ol', ':scope > li', 5, 'pages', 'fechamentos'],
  ['.adherence-week-list', ':scope > li'],
  ['.execution-breakdown-list', ':scope > li'],
  ['.diagnosis-groups', ':scope > details, :scope > .diagnosis-group-line', 8],
  ['.diagnosis-consolidated-list', ':scope > article', 3],
  ['.adherence-subjects tbody', ':scope > tr'],
  ['.preparation-signal-list', ':scope > details'],
  ['.subject-accuracy-list', ':scope > li'],
  ['.projection-calibration-list', ':scope > details'],
  ['.strategic-timeline', ':scope > li'],
  ['.recommendation-followup-list', ':scope > details'],
  ['#gapMapDashboard', ':scope > .data-row'],
  ['#decisionHistoryDashboard', ':scope > .data-row', DEFAULT_PAGE_SIZE, 'pages', 'decisões'],
  // Hoje leads with the plan: two alerts, the rest behind "Mostrar mais".
  ['#alertasInteligentesList', ':scope > .alerta-item', 2],
  // Um tópico por linha e centenas deles num exame: Retenção pagina.
  ['#retentionRecords', ':scope > .retention-row', DEFAULT_PAGE_SIZE, 'pages', 'tópicos'],
  ['#questionPerformanceRecords', ':scope > .performance-row'],
  ['#upcomingList', ':scope > li'],
  ['#calAtrasadas', ':scope > .overdue-group'],
  ['.exam-intelligence-list', ':scope > li'],
  ['.exam-configuration-audit > ul', ':scope > li'],
  ['.diagnosis-summary > section', ':scope > article'],
  ['.simulation-trend-list', ':scope > li'],
  ['.performance-topic-analysis', ':scope > li'],
  ['.weekly-decision-results', ':scope > li'],
  ['.phase-strategy-changes', ':scope > li'],
  ['.adaptive-history > ol', ':scope > li'],
  ['.weekly-focus-history > ol', ':scope > li'],
  ['.study-plan-details', ':scope > .study-plan-topic'],
  ['.performance-changes:not(.performance-topic-list)', ':scope > li'],
  ['.diagnostic-secondary-reasons', ':scope > li'],
  ['.readiness-change-factors', ':scope > li'],
  ['.performance-topic-events', ':scope > li'],
];

export function mountProgressiveLists({ document, window }: { document: any; window: any }) {
  const states = new Map();
  const renderedFooters = new WeakMap();
  let sequence = 0,
    scheduled = false;
  const sync = () => {
    scheduled = false;
    states.forEach((state, id) => {
      if (!state.root.isConnected) states.delete(id);
    });
    LISTS.forEach(([selector, itemSelector, initialLimit, mode, label]) =>
      document.querySelectorAll(selector).forEach((root: any) => {
        const items = [...root.querySelectorAll(itemSelector)];
        if (!root.id) root.id = `progressive-list-${++sequence}`;
        let state = states.get(root.id);
        if (
          !state ||
          state.root !== root ||
          state.items.length !== items.length ||
          state.items.some((item: any, index: any) => item !== items[index])
        ) {
          const same = state?.root === root;
          const expanded = state?.model.expanded && same;
          state = {
            root,
            items,
            model: createProgressiveList({
              items,
              initialLimit,
              mode,
              pageSize: initialLimit,
              page: same ? state.model.page : 1,
            }),
          };
          if (expanded) state.model.expand();
          states.set(root.id, state);
        }
        const paged = mode === 'pages';
        const first = (state.model.page - 1) * state.model.pageSize;
        items.forEach((item, index) => {
          item.classList.add('progressive-list-item');
          const hidden = paged
            ? index < first || index >= first + state.model.pageSize
            : !state.model.expanded && index >= state.model.initialLimit;
          if (item.hidden !== hidden) item.hidden = hidden;
        });
        const anchor = root.tagName === 'TBODY' ? root.closest('table') : root;
        if (paged) {
          let footer = anchor.nextElementSibling;
          if (!footer?.matches('[data-progressive-pages]')) footer = null;
          const html = renderCollectionFooter({
            variant: 'block',
            total: items.length,
            page: state.model.page,
            pageSize: state.model.pageSize,
            actionAttr: 'data-page-to',
            label,
          });
          if (!html) {
            footer?.remove();
            return;
          }
          if (!footer) {
            footer = document.createElement('div');
            footer.dataset.progressivePages = root.id;
            anchor.after(footer);
          }
          // Compara com o último HTML gerado, não com innerHTML (o navegador normaliza atributos
          // como data-hide-sm e a diferença reescreveria o rodapé a cada mutação, em laço).
          if (renderedFooters.get(footer) !== html) {
            footer.innerHTML = html;
            renderedFooters.set(footer, html);
          }
          return;
        }
        let button = anchor.nextElementSibling;
        if (!button?.matches('[data-progressive-toggle]')) button = null;
        if (items.length <= state.model.initialLimit) {
          button?.remove();
          return;
        }
        if (!button) {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'progressive-list-toggle';
          button.dataset.progressiveToggle = root.id;
          anchor.after(button);
        }
        button.setAttribute('aria-controls', root.id);
        button.setAttribute('aria-expanded', String(state.model.expanded));
        const text = state.model.expanded
          ? 'Mostrar menos ↑'
          : `Mostrar mais · +${state.model.hiddenItems} ↓`;
        if (button.textContent !== text) button.textContent = text;
      })
    );
  };
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      window.queueMicrotask(sync);
    }
  };
  const reset = () => {
    states.forEach(state => state.model.reset());
    schedule();
  };
  const click = (event: any) => {
    const pageButton = event.target.closest('[data-page-to]');
    const pages = pageButton?.closest('[data-progressive-pages]');
    const pageState = pages && states.get(pages.dataset.progressivePages);
    if (pageState) {
      pageState.model.goTo(Number(pageButton.dataset.pageTo));
      sync();
      // O botão clicado foi recriado: seta volta à mesma seta (ou à página atual, na ponta); número vai à atual.
      const buttons = [...pages.querySelectorAll('[data-page-to]')] as HTMLElement[];
      const dir = pageButton.dataset.pageDir;
      const target =
        (dir && buttons.find(b => b.dataset.pageDir === dir)) ||
        buttons.find(b => b.getAttribute('aria-current') === 'page');
      target?.focus({ preventScroll: true });
      const list = document.getElementById(pages.dataset.progressivePages);
      if (list && list.getBoundingClientRect().top < 0)
        list.scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        });
      return;
    }
    const action = event.target.closest('[data-delegated-click]')?.dataset.delegatedClick || '';
    if (/^(toggleActiveExamTag|setSubjectExamFilter|clearSessionHistoryFilters)/.test(action))
      reset();
    const button = event.target.closest('[data-progressive-toggle]');
    if (!button) return;
    const state = states.get(button.dataset.progressiveToggle);
    if (!state) return;
    state.model.toggle();
    sync();
    button.focus({ preventScroll: true });
    const rect = button.getBoundingClientRect();
    if (!state.model.expanded && (rect.top < 0 || rect.bottom > window.innerHeight))
      button.scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
  };
  const filter = (event: any) => {
    if (event.target.matches('input[type="search"],select,input[type="date"]')) reset();
  };
  const observer = new window.MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', click);
  document.addEventListener('input', filter);
  document.addEventListener('change', filter);
  sync();
  return {
    reset,
    destroy() {
      observer.disconnect();
      document.removeEventListener('click', click);
      document.removeEventListener('input', filter);
      document.removeEventListener('change', filter);
      states.clear();
    },
  };
}
