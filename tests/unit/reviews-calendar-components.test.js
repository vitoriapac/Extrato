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
      upcomingVisibleLimit: 5,
      completedVisibleLimit: 5,
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
      upcomingVisible: 5,
      completedVisible: 5,
    },
    renderAgendaReadRow: item => `<tr><td>Item ${item.id}</td></tr>`,
    renderAgendaEditRow: () => '',
    renderGroupHeader: ({ title, count }) => `<tr><th>${title} (${count})</th></tr>`,
    renderCollectionFooter: () => '',
  });

  const html = controller.renderHtml();

  assert.match(html, /Atrasadas \(1\)/);
  assert.match(html, /Hoje \(1\)/);
  assert.match(html, /Próximas \(1\)/);
  assert.match(html, /Concluídas \(1\)/);
  assert.match(html, /Item r1/);
  assert.match(html, /Item r2/);
  assert.match(html, /Item r3/);
  assert.match(html, /Item r4/);
});

test('CalendarTable Preact Component — exibe estado vazio e renderiza linhas de calendário', () => {
  const emptyHtml = render(
    h(CalendarTable, {
      rows: [],
      visibleLimit: 5,
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
    calendarUiState: { visible: 5, editingId: null },
    renderCalendarReadRow: item => `<tr><td>Cal ${item.id} - ${item.week}</td></tr>`,
    renderCalendarEditRow: () => '',
    renderCollectionFooter: () => '',
  });

  const html = controller.renderHtml();
  assert.match(html, /Cal c1 - Semana 1/);
});
