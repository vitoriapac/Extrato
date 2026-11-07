import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgendaBuckets, describeBucket } from '../../src/application/reviews/build-agenda-buckets.js';
import { createCalendarState, initialCalendarView } from '../../src/ui/calendar/calendar-state.js';
import { createCalendarController } from '../../src/ui/calendar/calendar-controller.js';

const TODAY = '2026-11-07';
const R = 'Agenda de Revisões';
const T = 'Calendário';
const make = (n, date, origem, status = 'Pendente') =>
  Array.from({ length: n }, (_, i) => ({ id: `${origem}-${date}-${status}-${i}`, date, origem, status }));

// 74 itens como na auditoria: 9 atrasados (7 revisões + 2 tarefas), 1 hoje, 14 nos próximos 7 dias.
const items = [
  ...make(7, '2026-11-01', R),
  ...make(2, '2026-11-05', T),
  ...make(1, TODAY, R),
  ...make(10, '2026-11-10', R),
  ...make(4, '2026-11-14', T),
  ...make(1, '2026-11-14', R, 'Concluído'), // concluído nunca conta
  ...make(30, '2026-12-20', R), // além de 7 dias
  ...make(5, '2026-10-01', T, 'Concluído'),
  ...make(14, '2026-12-25', T),
];

test('filas da Agenda separam atrasadas, hoje e próximos 7 dias por tipo', () => {
  assert.equal(items.length, 74);
  const b = buildAgendaBuckets(items, TODAY);
  assert.deepEqual(b.overdue, { total: 9, reviews: 7, tasks: 2 });
  assert.deepEqual(b.today, { total: 1, reviews: 1, tasks: 0 });
  assert.deepEqual(b.next7, { total: 14, reviews: 10, tasks: 4 });
});

test('em toda fila total === revisões + tarefas', () => {
  for (const list of [items, [], make(3, TODAY, T), [...make(2, '2026-11-14', R), ...make(5, '2026-11-08', T)]]) {
    for (const bucket of Object.values(buildAgendaBuckets(list, TODAY))) {
      assert.equal(bucket.total, bucket.reviews + bucket.tasks);
    }
  }
});

test('limite de 7 dias é inclusivo e datas inválidas ficam de fora', () => {
  const b = buildAgendaBuckets([
    { date: '2026-11-14', origem: R, status: 'Pendente' },
    { date: '2026-11-15', origem: R, status: 'Pendente' },
    { date: '', origem: R, status: 'Pendente' },
  ], TODAY);
  assert.equal(b.next7.total, 1);
});

test('rótulo traz tipo e período', () => {
  assert.equal(describeBucket({ total: 9, reviews: 7, tasks: 2 }, 'atrasadas'), '7 revisões + 2 tarefas atrasadas');
  assert.equal(describeBucket({ total: 1, reviews: 1, tasks: 0 }, 'hoje'), '1 revisão hoje');
  assert.equal(describeBucket({ total: 0, reviews: 0, tasks: 0 }, 'nos próximos 7 dias'), 'Nada nos próximos 7 dias');
});

test('visão inicial: 1280 abre em Mês, abaixo de 760 abre em Lista, escolha lembrada vence', () => {
  assert.equal(initialCalendarView(createCalendarState(), false), 'month');
  assert.equal(initialCalendarView(createCalendarState(), true), 'agenda');
  assert.equal(initialCalendarView(createCalendarState({ view: 'month' }), true), 'month');
  assert.equal(initialCalendarView(createCalendarState({ view: 'agenda' }), false), 'agenda');
  const state = createCalendarState();
  createCalendarController({ service: {}, state }).setView('month');
  assert.equal(initialCalendarView(state, true), 'month');
});

test('fila vazia usa texto próprio', () => {
  assert.equal(describeBucket({ total: 0, reviews: 0, tasks: 0 }, 'atrasadas', 'Nada atrasado'), 'Nada atrasado');
});

test('singular concorda com o período', () => {
  assert.equal(describeBucket({ total: 1, reviews: 1, tasks: 0 }, 'atrasadas', 'Nada atrasado', 'atrasada'), '1 revisão atrasada');
});
