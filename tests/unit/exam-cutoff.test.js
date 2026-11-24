import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCutoffReference,
  cutoffPercent,
  normalizeExamCutoff,
} from '../../src/domain/analytics/cutoff-reference.js';
import { buildExamTodaySignals } from '../../src/application/analytics/build-exam-today-signals.js';
import { renderExamTodaySignals } from '../../src/ui/renderers/exam-today-renderer.js';
import { normalizeExamBlueprint } from '../../src/state/strategic.js';

test('corte informado vira % da escala; inválido é descartado', () => {
  assert.deepEqual(normalizeExamCutoff({ score: '72', maxScore: '120', year: '2024' }), {
    score: 72,
    maxScore: 120,
    year: 2024,
  });
  assert.deepEqual(normalizeExamCutoff({ score: '68,5' }), { score: 68.5, maxScore: 100 });
  assert.equal(normalizeExamCutoff({ score: 130, maxScore: 120 }), null);
  assert.equal(normalizeExamCutoff({ score: 0 }), null);
  assert.equal(normalizeExamCutoff(null), null);
  assert.equal(cutoffPercent({ score: 72, maxScore: 120 }), 60);
  assert.equal(normalizeExamBlueprint({ cutoff: { score: 'x' } }).cutoff, undefined);
  assert.deepEqual(normalizeExamBlueprint({ cutoff: { score: 60, maxScore: 80 } }).cutoff, {
    score: 60,
    maxScore: 80,
  });
});

test('corte informado pelo aluno tem precedência sobre catálogo e meta', () => {
  const profiles = {
    'bb-2023': { cutoffScores: [{ ano: 2023, score: 70, scale: 100, banca: 'X', praca: 'A' }] },
  };
  const informed = buildCutoffReference({
    activeExamTags: ['bb'],
    profiles,
    informed: { score: 72, maxScore: 120, year: 2024 },
  });
  assert.equal(informed.kind, 'informed');
  assert.match(informed.text, /2024 informada por você: 60% da escala/);
  assert.equal(buildCutoffReference({ activeExamTags: ['bb'], profiles }).kind, 'official');
  assert.equal(buildCutoffReference({ activeExamTags: ['bb'], profiles: {} }).kind, 'goal');
});

const signals = (central, cutoff) =>
  buildExamTodaySignals({
    calibration: { available: true, central, target: 75 },
    blueprint: { targetScore: 75, subjects: [], ...(cutoff ? { cutoff } : {}) },
  });

test('nota projetada é lida contra o corte e a meta', () => {
  const below = signals(62, { score: 68 });
  assert.equal(below.score.cutoff, 68);
  assert.equal(below.score.cutoffGap, -6);
  const html = renderExamTodaySignals(below);
  assert.match(html, /overview-signal--danger/);
  assert.match(html, /6 p\.p\. abaixo do corte de 68% · meta 75%/);

  const between = renderExamTodaySignals(signals(70, { score: 68 }));
  assert.match(between, /overview-signal--warning/);
  assert.match(between, /2 p\.p\. acima do corte de 68%/);

  assert.match(renderExamTodaySignals(signals(80, { score: 68 })), /overview-signal--success/);
  const noCutoff = renderExamTodaySignals(signals(70));
  assert.match(noCutoff, /5 p\.p\. abaixo da meta de 75%/);
  assert.equal(signals(70).score.cutoffGap, null);
});
