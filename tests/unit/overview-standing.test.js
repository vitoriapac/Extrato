import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOverviewStanding } from '../../src/application/analytics/build-overview-standing.js';
import { renderOverviewStanding } from '../../src/ui/renderers/overview-standing-renderer.js';

const row = (topicId, presencePercent, mastery, confidence = 'moderate') => ({
  topicId,
  name: `Tópico ${topicId}`,
  subjectName: 'Disciplina',
  presencePercent,
  mastery,
  confidence,
});

test('trajetória só existe quando a projeção calibrada tem evidência suficiente', () => {
  assert.equal(buildOverviewStanding({ calibration: { available: false } }).trajectory, null);
  assert.equal(buildOverviewStanding({ calibration: null }).trajectory, null);
  const html = renderOverviewStanding(buildOverviewStanding({ calibration: { available: false } }));
  assert.doesNotMatch(html, /Trajetória nos simulados/);
  const calibration = {
    available: true,
    central: 70,
    low: 62,
    high: 78,
    target: 80,
    status: 'below',
    confidenceLabel: 'Baixa',
    observations: [
      { date: '2026-09-01', value: 60 },
      { date: '2026-10-01', value: 68 },
    ],
  };
  const standing = buildOverviewStanding({ calibration });
  assert.equal(standing.trajectory.observations.length, 2);
  const withChart = renderOverviewStanding(standing);
  assert.match(withChart, /Trajetória nos simulados/);
  assert.match(withChart, /abaixo da meta de 80/);
});

test('matriz prioriza alta incidência com baixo domínio e ignora baixa confiança', () => {
  const { matrix } = buildOverviewStanding({
    matrixRows: [
      row('a', 90, 40),
      row('b', 70, 30),
      row('c', 90, 40, 'low'),
      row('d', 20, 20),
      row('e', 80, 90),
      { ...row('f', 60, null) },
    ],
  });
  assert.equal(matrix.total, 6);
  assert.equal(matrix.positioned, 4);
  assert.deepEqual(
    matrix.priority.map(item => item.topicId),
    ['a', 'b']
  );
  assert.equal(matrix.dots.find(dot => dot.topicId === 'a').rank, 1);
});

test('matriz sem tópicos posicionáveis declara a falta de evidência', () => {
  const html = renderOverviewStanding(
    buildOverviewStanding({ matrixRows: [row('x', 90, 40, 'low')] })
  );
  assert.match(html, /evidência suficiente/);
});

test('evidência soma fatores disponíveis e ausentes e nomeia o que falta', () => {
  const { evidence } = buildOverviewStanding({
    readiness: { availableFactors: ['coverage', 'mastery'], missingFactors: ['simulations'] },
  });
  assert.deepEqual(evidence, { available: 2, total: 3, missing: ['simulados'] });
  assert.equal(buildOverviewStanding({ readiness: {} }).evidence, null);
});
