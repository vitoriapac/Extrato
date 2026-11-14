import test from 'node:test';
import assert from 'node:assert/strict';
import { volumeLabel, priorityMinutesLabel } from '../../src/ui/renderers/adherence-labels.js';

test('volume usa percentual até 2× e "N,N×" acima, sem percentuais de três algarismos', () => {
  assert.equal(volumeLabel(null), '—');
  assert.equal(volumeLabel(86), '86% do previsto');
  assert.equal(volumeLabel(200), '200% do previsto');
  assert.equal(volumeLabel(778.8), '7,8× o previsto');
});

test('tempo prioritário diz o recorte e usa o formato único de duração', () => {
  assert.equal(
    priorityMinutesLabel(0, 45, '2026-11-14'),
    '0 min de 45 min prioritárias (dias até 14/11)'
  );
  assert.equal(priorityMinutesLabel(90, 90), '1 h 30 min de 1 h 30 min prioritárias (período avaliado)');
});

test('Fechamento e Desempenho exibem o mesmo recorte e o mesmo formato de excesso', async () => {
  const { renderAdherenceMetrics } = await import('../../src/ui/renderers/adherence-renderer.js');
  const model = {
    period: { start: '2026-11-09', end: '2026-11-15', evaluatedEnd: '2026-11-14' },
    summary: {
      plannedMinutes: 80,
      executedMinutes: 623,
      matchedMinutes: 0,
      temporalAdherence: 0,
      volumeRatio: 778.8,
    },
    priority: { plannedMinutes: 45, executedMinutes: 0, adherence: 0, classifiedCoverage: 100 },
  };
  const out = renderAdherenceMetrics(model, { escapeHtml: s => s });
  assert.match(out, /0 min de 45 min prioritárias \(dias até 14\/11\)/);
  assert.match(out, /7,8× o previsto/);
  assert.doesNotMatch(out, /778,8%/);
});

test('duração e variação usam o formato único, com ausência explícita', async () => {
  const { planMin, planMinDelta } = await import('../../src/ui/renderers/adherence-labels.js');
  assert.equal(planMin(null), '—');
  assert.equal(planMin(0), '0 min');
  assert.equal(planMin(80), '1 h 20 min');
  assert.equal(planMin(120), '2 h');
  assert.equal(planMinDelta(-45), '−45 min');
  assert.equal(planMinDelta(80), '+1 h 20 min');
  assert.equal(planMinDelta(0), '0 min');
  assert.equal(planMinDelta(null), 'Sem base comparável');
});
