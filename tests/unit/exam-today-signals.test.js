import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamTodaySignals } from '../../src/application/analytics/build-exam-today-signals.ts';
import { renderExamTodaySignals } from '../../src/ui/renderers/exam-today-renderer.ts';

const blueprint = {
  targetScore: 80,
  activeExamTags: [],
  scoringMode: 'certo-errado',
  subjects: [{ subjectId: 'esp', minScore: 50 }],
};
const subjects = [{ id: 'esp', name: 'Específicos' }];

test('A prova hoje: nota projetada × meta, mínimo no último simulado e pendências', () => {
  const model = buildExamTodaySignals({
    calibration: { available: true, central: 72.4, target: 80 },
    simulations: [
      { date: '2026-10-01', breakdown: [{ subjectId: 'esp', correct: 40, total: 50 }] },
      // O mais recente manda: 20 certas e 15 erradas em 50 → 10% líquida, abaixo de 50%.
      {
        date: '2026-11-01',
        scoring: 'certo-errado',
        breakdown: [{ subjectId: 'esp', correct: 20, wrong: 15, total: 50 }],
      },
    ],
    blueprint,
    subjects,
    overdue: 9,
  });
  assert.deepEqual(model.score, {
    available: true,
    central: 72,
    target: 80,
    gap: -8,
    net: true,
    cutoff: null,
    cutoffGap: null,
  });
  assert.deepEqual(model.minimum.names, ['Específicos']);
  assert.equal(model.minimum.simulationDate, '2026-11-01');
  const html = renderExamTodaySignals(model);
  assert.match(html, /Nota líquida projetada/);
  assert.match(html, /8 p\.p\. abaixo da meta de 80%/);
  assert.match(html, /Específicos · simulado de 01\/11\/2026/);
  assert.match(html, /id="overviewAttentionViewAll"[^>]*data-signal-tab="hoje"/);
  assert.match(html, /9<\/strong><span class="overview-signal__label">Pendências atrasadas/);
});

test('A prova hoje sem projeção nem mínimos diz o que falta, sem números inventados', () => {
  const html = renderExamTodaySignals(
    buildExamTodaySignals({
      calibration: { available: false, target: null },
      blueprint: { subjects: [] },
    })
  );
  assert.match(html, /Registre simulados comparáveis para projetar/);
  assert.match(html, /Defina os mínimos eliminatórios nas Metas/);
  assert.match(html, /Revisões e tarefas em dia/);
});
