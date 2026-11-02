import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSubjectAccuracyTarget } from '../../src/domain/analytics/subject-accuracy-target.js';
import { buildSubjectAccuracy } from '../../src/application/analytics/build-subject-accuracy.js';
import { buildSavedSubjectConfig } from '../../src/application/exams/save-subject-config.js';
import { normalizeExamBlueprint } from '../../src/state/strategic.js';
test('meta opcional herda a geral e preserva zero e peso oficial', () => {
  /** @type {import('../../src/core/types.ts').ExamBlueprintSubject} */
  const current = {
    subjectId: 's',
    expectedQuestions: 10,
    questionWeight: 1,
    priority: 'normal',
    masteryTarget: 80,
    official: true,
  };
  const input = {
    priority: 'normal',
    masteryTarget: '80',
    expectedQuestions: '10',
    questionWeight: '1',
    accuracyTarget: '0',
  };
  const saved = buildSavedSubjectConfig('s', current, input);
  assert.equal(saved.official, true);
  assert.equal(saved.masteryTarget, 80);
  const blueprint = normalizeExamBlueprint({ subjects: [saved] });
  assert.equal(resolveSubjectAccuracyTarget('s', blueprint, 85), 0);
  assert.equal(resolveSubjectAccuracyTarget('missing', blueprint, 85), 85);
  assert.equal(buildSavedSubjectConfig('s', current, { ...input, accuracyTarget: '101' }), null);
  assert.equal(
    buildSavedSubjectConfig('s', current, { ...input, accuracyTarget: '' }).accuracyTarget,
    null
  );
});
test('amostras pequenas permanecem insuficientes e streams não são duplicados', () => {
  const rows = buildSubjectAccuracy({
    subjects: [{ id: 's', name: 'Disciplina' }],
    blueprint: { subjects: [{ subjectId: 's', accuracyTarget: 75 }] },
    questions: [{ subjectId: 's', resolved: 8, correct: 4 }],
    simulations: [{ breakdown: [{ subjectId: 's', total: 40, correct: 32 }] }],
  });
  assert.equal(rows[0].personal.state, 'insufficient');
  assert.equal(rows[0].simulation.state, 'on_target');
  assert.equal(rows[0].simulation.total, 40);
});
import { renderSubjectAccuracy } from '../../src/ui/renderers/subject-accuracy-renderer.js';
test('acerto por disciplina usa barra com meta, texto além da cor e tabela em "Ver dados"', () => {
  const html = renderSubjectAccuracy(
    buildSubjectAccuracy({
      subjects: [
        { id: 'a', name: 'Abaixo' },
        { id: 'b', name: 'Na meta' },
        { id: 'c', name: 'Pouca <amostra>' },
      ],
      blueprint: { subjects: [{ subjectId: 'a', accuracyTarget: 80 }] },
      globalTarget: 70,
      questions: [
        { subjectId: 'a', resolved: 20, correct: 12 },
        { subjectId: 'b', resolved: 20, correct: 16 },
        { subjectId: 'c', resolved: 5, correct: 1 },
      ],
    })
  );
  const rows = html.split('<li ').slice(1);
  assert.match(rows[0], /is-below/);
  assert.match(rows[0], /chart-bullet__fill is-below/);
  assert.match(rows[0], /20 p\.p\. abaixo da meta/);
  assert.match(rows[0], /chart-bullet__target/);
  assert.match(rows[1], /na meta/);
  assert.doesNotMatch(rows[1], /is-below/);
  // Insufficient sample: no target mark, so no amber verdict either.
  assert.match(rows[2], /amostra insuficiente/);
  assert.doesNotMatch(rows[2], /chart-bullet__target|is-below/);
  assert.match(html, /Pouca &lt;amostra&gt;/);
  assert.match(html, /<details class="subject-accuracy-data"><summary>Ver dados<\/summary>/);
  assert.match(html, /<th scope="row">Abaixo<\/th><td>80%<\/td><td>60% · 20 questões · 20 p\.p\. abaixo da meta<\/td>/);
  assert.match(html, /<td>70% · herdada da meta geral<\/td>/);
});
import { buildSubjectWeeklyAccuracy } from '../../src/application/analytics/build-subject-accuracy.js';
test('acerto semanal por disciplina agrupa janelas de 7 dias e deixa semanas vazias como null', () => {
  const trend = buildSubjectWeeklyAccuracy(
    [
      { subjectId: 'a', date: '2026-10-01', resolved: 10, correct: 8 },
      { subjectId: 'a', date: '2026-09-25', resolved: 10, correct: 6 },
      { subjectId: 'a', date: '2026-09-24', resolved: 10, correct: 4 },
      { subjectId: 'a', date: '2026-08-01', resolved: 10, correct: 10 },
      { subjectId: 'a', date: '2026-10-02', resolved: 10, correct: 10 },
      { subjectId: 'b', date: '2026-09-30', resolved: 0, correct: 0 },
    ],
    '2026-10-01',
    4
  );
  assert.deepEqual(trend.get('a'), [null, null, 40, 70]);
  assert.equal(trend.has('b'), false);
});
