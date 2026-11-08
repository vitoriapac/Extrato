import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIncidenceQuadrants } from '../../src/ui/renderers/incidence-quadrants-renderer.js';

const row = (index, extra) => ({
  topicId: `t${index}`,
  name: `Tópico ${index}`,
  subjectName: 'Disciplina',
  confidenceLabel: 'Alta',
  priority: 10,
  ...extra,
});
const strong = { mastery: 40, presencePercent: 80, confidence: 'high' };

test('cada grupo mostra 5 tópicos e guarda o resto em "Mostrar mais"', () => {
  const rows = Array.from({ length: 12 }, (_, index) => row(index, strong));
  const html = renderIncidenceQuadrants(rows);
  assert.match(html, /Mostrar mais · \+7/);
  assert.equal((html.match(/data-exam-matrix-topic/g) || []).length, 12);
  assert.equal((html.match(/<ul>/g) || []).length, 2);
});

test('evidência insuficiente fica fechada com a contagem à vista', () => {
  const rows = Array.from({ length: 9 }, (_, index) =>
    row(index, { mastery: null, presencePercent: 20, confidence: 'low' })
  );
  const html = renderIncidenceQuadrants(rows);
  assert.match(html, /<summary>Evidência insuficiente para posicionar \(9\)<\/summary>/);
  assert.doesNotMatch(html, /Mostrar mais/);
});

test('grupos pequenos continuam sem disclosure', () => {
  const html = renderIncidenceQuadrants([row(1, strong), row(2, strong)]);
  assert.doesNotMatch(html, /Mostrar mais/);
  assert.match(html, /Alta incidência · desenvolver domínio \(2\)/);
});
