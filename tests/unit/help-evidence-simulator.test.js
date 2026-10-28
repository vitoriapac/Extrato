import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEvidenceConfidence } from '../../src/domain/help/evidence-simulator.js';

test('calculateEvidenceConfidence — amostra < 10 gera status insuficiente e alerta de volatilidade', () => {
  const result = calculateEvidenceConfidence(5, 80);
  assert.equal(result.sampleSize, 5);
  assert.equal(result.evidenceLevel, 'insufficient');
  assert.equal(result.badgeTone, 'danger');
  assert.ok(
    result.marginOfErrorPct >= 30,
    `Margem de erro deve ser alta: ${result.marginOfErrorPct}%`
  );
  assert.match(result.explanation, /Menos de 10 questões/);
  assert.match(result.recommendationDecision, /não altera o planejamento/);
});

test('calculateEvidenceConfidence — amostra 10 a 29 gera status em observação', () => {
  const result = calculateEvidenceConfidence(20, 75);
  assert.equal(result.sampleSize, 20);
  assert.equal(result.evidenceLevel, 'emerging');
  assert.equal(result.badgeTone, 'warning');
  assert.equal(result.levelLabel, 'Em Observação');
  assert.ok(result.marginOfErrorPct < 30);
  assert.match(result.explanation, /Entre 10 e 29 questões/);
});

test('calculateEvidenceConfidence — amostra 30 a 79 consolida evidência sólida', () => {
  const result = calculateEvidenceConfidence(45, 85);
  assert.equal(result.sampleSize, 45);
  assert.equal(result.evidenceLevel, 'solid');
  assert.equal(result.badgeTone, 'info');
  assert.equal(result.levelLabel, 'Evidência Sólida');
  assert.match(result.recommendationDecision, /consolida métricas/);
});

test('calculateEvidenceConfidence — amostra 80+ confere máxima confiança estatística', () => {
  const result = calculateEvidenceConfidence(100, 80);
  assert.equal(result.sampleSize, 100);
  assert.equal(result.evidenceLevel, 'robust');
  assert.equal(result.badgeTone, 'success');
  assert.equal(result.levelLabel, 'Evidência Robusta');
  assert.ok(
    result.marginOfErrorPct <= 10,
    `Margem deve ser <= 10%, obtido ${result.marginOfErrorPct}%`
  );
  assert.match(result.recommendationDecision, /máxima confiança/);
});

test('calculateEvidenceConfidence — normaliza entradas fora dos limites esperados', () => {
  const underflow = calculateEvidenceConfidence(-10, -5);
  assert.equal(underflow.sampleSize, 1);
  assert.equal(underflow.observedAccuracy, 10);

  const overflow = calculateEvidenceConfidence(999, 150);
  assert.equal(overflow.sampleSize, 250);
  assert.equal(overflow.observedAccuracy, 100);
});

test('calculateEvidenceConfidence — margem de erro diminui com o aumento da amostra', () => {
  const small = calculateEvidenceConfidence(10, 80);
  const medium = calculateEvidenceConfidence(50, 80);
  const large = calculateEvidenceConfidence(120, 80);

  assert.ok(small.marginOfErrorPct > medium.marginOfErrorPct);
  assert.ok(medium.marginOfErrorPct > large.marginOfErrorPct);
  assert.ok(large.confidenceRange[0] <= 80 && 80 <= large.confidenceRange[1]);
});
