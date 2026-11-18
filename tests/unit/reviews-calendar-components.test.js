import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { ReviewsTable } from '../../src/ui/tabs/reviews/ReviewsTable.js';
import { createReviewsTabController } from '../../src/ui/tabs/reviews/reviews-tab-controller.js';
import { CalendarTable } from '../../src/ui/tabs/calendar/CalendarTable.js';
import { createCalendarTabController } from '../../src/ui/tabs/calendar/calendar-tab-controller.js';

test('ReviewsTable Preact Component — exibe estado vazio quando sem revisões', () => {
  const html = render(
    h(ReviewsTable, {
      groups: { overdue: [], today: [], upcoming: [], completed: [] },
      totalCount: 0,
      renderReadRow: () => '',
      renderEditRow: () => '',
      renderGroupHeader: () => '',
    })
  );

  assert.match(html, /Nenhuma revisão encontrada com esses filtros/);
  assert.match(html, /gerarAgendaAutomatica\(\)/);
});

test('createReviewsTabController — agrupa revisões em Atrasadas, Hoje, Próximas e Concluídas', () => {
  const today = '2026-03-10';
  const state = {
    reviewAgenda: [
      { id: 'r1', date: '2026-03-08', status: 'Pendente', subjectId: 's1' },
      { id: 'r2', date: '2026-03-10', status: 'Pendente', subjectId: 's1' },
      { id: 'r3', date: '2026-03-15', status: 'Pendente', subjectId: 's1' },
      {
        id: 'r4',
        date: '2026-03-05',
        status: 'Concluído',
        subjectId: 's1',
        completedAt: '2026-03-05',
      },
    ],
  };

  const controller = createReviewsTabController({
    state,
    filters: { subjectId: '', status: '', month: '', type: '' },
    entitySubjectId: item => item.subjectId,
    todayISO: () => today,
    monthKey: d => (d ? d.slice(0, 7) : ''),
    DIFFICULTY_WEIGHT: { Fácil: 1, Médio: 2, Difícil: 3 },
    getTopicDifficulty: () => 'Médio',
    agendaUiState: {
      editingId: null,
      completedExpanded: true,
    },
    renderAgendaReadRow: item => `<tr><td>Item ${item.id}</td></tr>`,
    renderAgendaEditRow: () => '',
    renderGroupHeader: ({ title, count }) => `<tr><th>${title} (${count})</th></tr>`,
    renderCollectionFooter: () => '',
  });

  const html = controller.renderHtml();

  assert.match(html, /Atrasadas \(1\)/);
  assert.match(html, /Hoje \(1\)/);
  assert.match(html, /Próximas revisões \(1\)/);
  assert.match(html, /Histórico de revisões concluídas \(1\)/);
  assert.ok(html.indexOf('Hoje (1)') < html.indexOf('Atrasadas (1)'));
  assert.match(html, /Item r1/);
  assert.match(html, /Item r2/);
  assert.match(html, /Item r3/);
  assert.match(html, /Item r4/);
});

test('sem revisão para hoje mostra orientação e mantém concluídas recolhidas', () => {
  const html = render(
    h(ReviewsTable, {
      groups: {
        today: [],
        overdue: [],
        upcoming: [{ id: 'future', status: 'Pendente' }],
        completed: [{ id: 'done', status: 'Concluído' }],
      },
      totalCount: 2,
      completedExpanded: false,
      renderReadRow: item => `<tr><td>${item.id}</td></tr>`,
      renderEditRow: () => '',
      renderGroupHeader: ({ title }) => `<th>${title}</th>`,
    })
  );
  assert.match(html, /Nenhuma revisão pendente para hoje/);
  assert.match(html, /future/);
  assert.doesNotMatch(html, />done</);
});

test('CalendarTable Preact Component — exibe estado vazio e renderiza linhas de calendário', () => {
  const emptyHtml = render(
    h(CalendarTable, {
      rows: [],
      renderReadRow: () => '',
      renderEditRow: () => '',
    })
  );
  assert.match(emptyHtml, /Nenhum item encontrado no calendário/);

  const controller = createCalendarTabController({
    state: {
      calendar: [
        { id: 'c1', date: '2026-03-10', week: 'Semana 1', subjectId: 's1', status: 'Não iniciado' },
      ],
    },
    filters: { subjectId: '', status: '', month: '', type: '' },
    entitySubjectId: item => item.subjectId,
    monthKey: d => (d ? d.slice(0, 7) : ''),
    calendarUiState: { calendarPage: 1, editingId: null },
    renderCalendarReadRow: item => `<tr><td>Cal ${item.id} - ${item.week}</td></tr>`,
    renderCalendarEditRow: () => '',
  });

  const html = controller.renderHtml();
  assert.match(html, /Cal c1 - Semana 1/);
});

test('ReviewsTable — Próximas e Concluídas em páginas de 10, cada grupo com a sua', () => {
  const items = (prefix, n) =>
    Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, status: 'Pendente' }));
  const footers = [];
  const html = render(
    h(ReviewsTable, {
      groups: { today: [], overdue: [], upcoming: items('u', 25), completed: items('c', 12) },
      totalCount: 37,
      completedExpanded: true,
      upcomingPage: 3,
      completedPage: 2,
      renderReadRow: item => `<tr><td>${item.id}</td></tr>`,
      renderEditRow: () => '',
      renderGroupHeader: ({ title }) => `<th>${title}</th>`,
      renderFooter: opts => {
        footers.push(opts);
        return '';
      },
    })
  );
  assert.match(html, />u20</);
  assert.match(html, />u24</);
  assert.doesNotMatch(html, />u19</);
  assert.match(html, />c10</);
  assert.match(html, />c11</);
  assert.doesNotMatch(html, />c9</);
  assert.deepEqual(
    footers.map(f => [f.page, f.total, f.pageAction(2), f.pageAction(4)]),
    [
      [3, 25, "goToListPage('agendaUpcoming',2)", "goToListPage('agendaUpcoming',4)"],
      [2, 12, "goToListPage('agendaCompleted',2)", "goToListPage('agendaCompleted',4)"],
    ]
  );
});

test('CalendarTable — lista em páginas de 10 com rodapé e página limitada', () => {
  const rows = Array.from({ length: 23 }, (_, i) => ({
    id: `c${i}`,
    date: '2026-03-10',
    status: 'Não iniciado',
  }));
  const base = {
    rows,
    renderReadRow: item => `<tr><td>${item.id}</td></tr>`,
    renderEditRow: () => '',
  };
  let html = render(h(CalendarTable, base));
  assert.match(html, />c9</);
  assert.doesNotMatch(html, />c10</);
  assert.match(html, /Exibindo 1–10 de 23 itens/);
  assert.match(html, /goToListPage\('calendar',2\)/);
  html = render(h(CalendarTable, { ...base, page: 3 }));
  assert.match(html, />c22</);
  assert.match(html, /Exibindo 21–23 de 23 itens/);
  html = render(h(CalendarTable, { ...base, page: 99 }));
  assert.match(html, /Página 3 de 3/);
  html = render(h(CalendarTable, { ...base, rows: rows.slice(0, 8) }));
  assert.doesNotMatch(html, /list-pagination/);
});

test('ReviewsTable — Hoje e Atrasadas também em páginas de 10, cada grupo com a sua', () => {
  const items = (prefix, n) =>
    Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, status: 'Pendente' }));
  const footers = [];
  const html = render(
    h(ReviewsTable, {
      groups: { today: items('t', 14), overdue: items('o', 23), upcoming: [], completed: [] },
      totalCount: 37,
      todayPage: 2,
      overduePage: 3,
      renderReadRow: item => `<tr><td>${item.id}</td></tr>`,
      renderEditRow: () => '',
      renderGroupHeader: ({ title }) => `<th>${title}</th>`,
      renderFooter: opts => {
        footers.push(opts);
        return '';
      },
    })
  );
  assert.match(html, />t10</);
  assert.doesNotMatch(html, />t9</);
  assert.match(html, />o22</);
  assert.match(html, />o20</);
  assert.doesNotMatch(html, />o19</);
  assert.deepEqual(
    footers.map(f => [f.page, f.total, f.pageAction(1)]),
    [
      [2, 14, "goToListPage('agendaToday',1)"],
      [3, 23, "goToListPage('agendaOverdue',1)"],
    ]
  );
});
