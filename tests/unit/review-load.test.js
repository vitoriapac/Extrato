import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReviewLoad, renderReviewLoad } from '../../src/ui/renderers/reviews-renderer.js';

const reviews = [
  { date: '2026-09-28', status: 'Pendente' },
  { date: '2026-09-30', status: 'Pendente' },
  { date: '2026-09-29', status: 'Concluído' },
  { date: '2026-10-01', status: 'Pendente' },
  { date: '2026-10-03', status: 'Pendente' },
  { date: '2026-10-03', status: 'Pendente' },
  { date: '2026-10-31', status: 'Pendente' },
  { date: null, status: 'Pendente' },
];

test('carga de revisões soma atrasadas à parte e mantém dias vazios como zero', () => {
  const load = buildReviewLoad(reviews, '2026-10-01');
  assert.equal(load.days.length, 30);
  assert.equal(load.days[0].date, '2026-10-01');
  assert.equal(load.days[29].date, '2026-10-30');
  assert.deepEqual(
    load.days.slice(0, 4).map(day => day.count),
    [1, 0, 2, 0]
  );
  assert.equal(load.overdue, 2);
  assert.equal(load.total, 3);
  const html = renderReviewLoad(load);
  // Every day has a bar, including the empty ones.
  assert.equal((html.match(/class="review-load__day/g) || []).length, 30);
  assert.equal((html.match(/review-load__day is-zero/g) || []).length, 28);
  assert.match(html, /<strong class="is-overdue">2 revisões atrasadas<\/strong>/);
  assert.match(html, /3 revisões nos próximos 30 dias, pico de 2 em 2026-10-03/);
  assert.match(html, /role="img" aria-label="Carga de revisões: 2 revisões atrasadas;/);
});

test('carga de revisões some sem pendências e não mostra coluna de atraso sem atrasadas', () => {
  assert.equal(renderReviewLoad(buildReviewLoad([], '2026-10-01')), '');
  const html = renderReviewLoad(buildReviewLoad([{ date: '2026-10-02', status: 'Pendente' }], '2026-10-01'));
  assert.doesNotMatch(html, /review-load__overdue/);
  assert.match(html, /nenhuma atrasada/);
});
