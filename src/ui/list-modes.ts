// Regra das listas longas: lista que pode passar de ~20 itens usa paginação ('pages'); as demais usam
// "Mostrar mais" ('more'). A decisão é por tipo de lista, declarada aqui, nunca pela contagem do momento
// (a tela não troca de padrão quando os dados crescem). tests/unit/list-modes.test.js confere a regra.
//
// `ceiling` é o teto realista de itens que a lista chega a ter no uso, um julgamento declarado por quem
// escreve a lista. Acima do limiar sem paginar, a lista só entra com `exception` explicando o motivo,
// e essas exceções são a fila de revisão da regra.
export const PAGINATION_THRESHOLD = 20;
export const DEFAULT_PAGE_SIZE = 10;

export type ListMode = 'more' | 'pages';

export interface DomListSpec {
  // Raiz da lista e seletor dos itens (relativo à raiz); o montador esconde o excedente.
  selector: string;
  items: string;
  mode: ListMode;
  // 'more': itens à vista; 'pages': itens por página.
  limit?: number;
  // Só em 'pages': rótulo da contagem ("Exibindo 1–10 de N rótulo").
  label?: string;
  ceiling: number;
  exception?: string;
}

const more = (selector: string, items: string, ceiling: number, extra: Partial<DomListSpec> = {}): DomListSpec => ({
  selector,
  items,
  mode: 'more',
  ceiling,
  ...extra,
});
const pages = (
  selector: string,
  items: string,
  label: string,
  ceiling: number,
  limit = DEFAULT_PAGE_SIZE
): DomListSpec => ({ selector, items, mode: 'pages', label, ceiling, limit });

const DISCIPLINAS = 'disciplinas do concurso (até ~30); revisar se o catálogo passar disso';
const SEMANAL = 'um registro por semana; passa de 20 em cerca de cinco meses de uso. Fica em "Mostrar mais" por decisão do plano de listas, a rever';

export const DOM_LISTS: DomListSpec[] = [
  more('.sustainability-exclusions', ':scope > li', 10),
  more('.recurring-priority-list', ':scope > li', 10),
  // Cada retrato é uma dobra: 5 por página mantém a aba Histórico abaixo de 20 dobras à vista.
  pages('.weekly-adherence-history > ol', ':scope > li', 'fechamentos', 104, 5),
  more('.adherence-week-list', ':scope > li', 12),
  more('.execution-breakdown-list', ':scope > li', 10),
  more('.diagnosis-groups', ':scope > details, :scope > .diagnosis-group-line', 30, {
    limit: 8,
    exception: DISCIPLINAS,
  }),
  more('.diagnosis-consolidated-list', ':scope > article', 300, {
    limit: 3,
    exception:
      'tópicos de um grupo do Diagnóstico; o grupo já tem filtro por severidade e a contagem dos sem evidência não é despejada (T49)',
  }),
  more('.adherence-subjects tbody', ':scope > tr', 30, { exception: DISCIPLINAS }),
  more('.preparation-signal-list', ':scope > details', 12),
  more('.subject-accuracy-list', ':scope > li', 30, { exception: DISCIPLINAS }),
  more('.projection-calibration-list', ':scope > details', 10),
  more('.strategic-timeline', ':scope > li', 200, { exception: SEMANAL }),
  more('.recommendation-followup-list', ':scope > details', 10),
  more('#gapMapDashboard', ':scope > .data-row', 60, {
    exception: 'lacunas priorizadas por tópico; o mapa já vem ordenado por prioridade',
  }),
  pages('#decisionHistoryDashboard', ':scope > .data-row', 'decisões', 100),
  // Hoje abre com o plano: dois alertas, o resto em "Mostrar mais".
  more('#alertasInteligentesList', ':scope > .alerta-item', 10, { limit: 2 }),
  pages('#retentionRecords', ':scope > .retention-row', 'tópicos', 400),
  pages('#questionPerformanceRecords', ':scope > .performance-row', 'tópicos', 400),
  // Resumo da Agenda: cinco por página; a lista inteira fica em "Ver todas no calendário".
  pages('#upcomingList', ':scope > li', 'itens', 100, 5),
  pages('#calAtrasadas', ':scope > .overdue-group', 'datas', 60),
  more('.mastery-matrix', ':scope > details', 30, { exception: DISCIPLINAS }),
  pages('.exam-matrix-table tbody', ':scope > tr', 'tópicos', 400),
  pages('.exam-matrix-cards', ':scope > article', 'tópicos', 400),
  // Capada em 5 + 10 no renderer; o resto vai para o Diagnóstico.
  more('.incidence-quadrant > ul', ':scope > li', 15),
  more('.incidence-subject__list', ':scope > li', 30, { limit: 8, exception: DISCIPLINAS }),
  more('.diagnostic-supporting > ul', ':scope > li', 10),
  more('.performance-subject-comparison .performance-subject-previews', ':scope > li', 30, {
    exception: DISCIPLINAS,
  }),
  more('.performance-subject-comparison tbody', ':scope > tr', 30, { exception: DISCIPLINAS }),
  more('.stability-map-cell > ul', ':scope > li', 30, { exception: DISCIPLINAS }),
  pages('.performance-topic-list', ':scope > li', 'tópicos', 80),
  more('.priority-history-observations', ':scope > li', 52, {
    exception: 'um ponto por semana em cada tópico; ' + SEMANAL,
  }),
  more('.strategic-timeline-detail > ul', ':scope > li', 10),
  more('.daily-execution-following > ul', ':scope > li', 15),
  more('.exam-intelligence-list', ':scope > li', 15),
  more('.exam-configuration-audit > ul', ':scope > li', 10),
  more('.diagnosis-summary > section', ':scope > article', 10),
  more('.simulation-trend-list', ':scope > li', 40, {
    exception:
      'simulados acumulam com o tempo; a lista completa fica em Questões & Simulados, que pagina',
  }),
  more('.performance-topic-analysis', ':scope > li', 30, {
    exception: 'tópicos de uma disciplina na análise; revisar se passar de 30',
  }),
  more('.weekly-decision-results', ':scope > li', 12),
  more('.phase-strategy-changes', ':scope > li', 10),
  more('.adaptive-history > ol', ':scope > li', 52, { exception: SEMANAL }),
  more('.weekly-focus-history > ol', ':scope > li', 52, { exception: SEMANAL }),
  more('.study-plan-details', ':scope > .study-plan-topic', 20),
  more('.performance-changes:not(.performance-topic-list)', ':scope > li', 10),
  more('.diagnostic-secondary-reasons', ':scope > li', 10),
  more('.readiness-change-factors', ':scope > li', 10),
  more('.performance-topic-events', ':scope > li', 30, {
    exception: 'eventos de um tópico ao longo do tempo; revisar se passar de 30',
  }),
];

// Listas paginadas por controller (estado de página fora do DOM), na ordem de goToListPage.
export interface ControllerPagedSpec {
  key: string;
  label: string;
  ceiling: number;
}
export const CONTROLLER_PAGED: ControllerPagedSpec[] = [
  { key: 'sessionDays', label: 'dias', ceiling: 400 },
  { key: 'questions', label: 'registros', ceiling: 5000 },
  { key: 'simulations', label: 'simulados', ceiling: 200 },
  { key: 'agendaToday', label: 'revisões de hoje', ceiling: 100 },
  { key: 'agendaOverdue', label: 'revisões atrasadas', ceiling: 300 },
  { key: 'agendaUpcoming', label: 'revisões', ceiling: 300 },
  { key: 'agendaCompleted', label: 'revisões concluídas', ceiling: 2000 },
  { key: 'calendar', label: 'itens', ceiling: 400 },
  // Uma paginação por disciplina; a chave real é `subjectTopics:<id>`.
  { key: 'subjectTopics', label: 'tópicos filtrados', ceiling: 80 },
  { key: 'priorityHistory', label: 'tópicos', ceiling: 400 },
];

// "Mostrar mais" ou paginação que não passam pelo montador, com o motivo.
export const OUTSIDE_THE_MOUNTER: Array<{ file: string; reason: string }> = [
  {
    file: 'src/ui/tabs/dashboard/AllocationBalanceGrid.tsx',
    reason: 'botão em Preact com estado próprio; no máximo uma linha por disciplina do concurso (~30)',
  },
  {
    file: 'src/ui/performance/performance-questions-renderer.ts',
    reason: '"Mostrar todas as N disciplinas" é uma dobra com memória (data-fold-key), não um limite de itens',
  },
];
