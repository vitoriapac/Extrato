import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGoalHistoryCharts } from '../../src/ui/renderers/goal-history-chart-renderer.js';
import { columnGeometry } from '../../src/ui/primitives/charts/geometry.js';

const week = (start, topics, questions, current = false) => ({
  weekStart: start,
  current,
  topicsConcl: topics,
  questoesResolved: questions,
  simuladosCount: 0,
  semanalOk: topics >= 2,
  questoesOk: questions >= 50,
  simuladosOk: false,
});

test('histórico de metas: colunas da mais antiga para a atual, meta em texto e âmbar só em semana encerrada abaixo', () => {
  const html = renderGoalHistoryCharts(
    [week('2026-10-26', 0, 10, true), week('2026-10-19', 3, 40), week('2026-10-12', 1, 60)],
    { semanal: 2, questoesSemanal: 50, simuladosSemanal: 0 }
  );
  const [topics, questions, sims] = html.split('<figure').slice(1);
  assert.match(topics, /1 de 2 semanas encerradas na meta/);
  assert.match(topics, /aria-label="Tópicos concluídos por semana, meta 2: 2026-10-12: 1 de 2; 2026-10-19: 3 de 2; 2026-10-26: 0 de 2 \(em andamento\)\. 1 de 2 semanas encerradas na meta\."/);
  const tones = [...topics.matchAll(/chart-columns__bar--(\w+)/g)].map(m => m[1]);
  assert.deepEqual(tones, ['attention', 'primary', 'muted']);
  assert.match(topics, /chart-columns__target/);
  assert.match(questions, /1 de 2 semanas encerradas na meta/);
  // No goal: no line, no amber.
  assert.match(sims, /sem meta definida/);
  assert.doesNotMatch(sims, /chart-columns__target|--attention|is-below/);
  assert.equal(renderGoalHistoryCharts([], {}), '');
});

test('columnGeometry mantém traço no zero, separa colunas marcadas e escala pela meta', () => {
  const g = columnGeometry([{ value: 0 }, { value: 10, separated: true }, { value: 5 }], { height: 42, width: 8, gap: 2, separation: 8, max: 20 });
  assert.deepEqual(g.bars.map(b => b.x), [0, 18, 28]);
  assert.equal(g.bars[0].height, 1);
  assert.equal(g.bars[0].zero, true);
  assert.equal(g.bars[1].height, 20);
  assert.equal(g.top, 20);
  assert.equal(g.yFor(20), 2);
  assert.equal(g.width, 36);
});
