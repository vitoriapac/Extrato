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

test('sem evidência vira contagem e caminho para o Diagnóstico, sem lista', () => {
  const rows = Array.from({ length: 9 }, (_, index) =>
    row(index, { mastery: null, presencePercent: 20, confidence: 'low' })
  );
  const html = renderIncidenceQuadrants(rows);
  assert.match(html, /<h5>Sem evidência para posicionar \(9\)<\/h5>/);
  assert.match(html, /9 tópicos ainda não têm evidência/);
  assert.match(html, /data-performance-jump="diagnosis"/);
  assert.doesNotMatch(html, /Mostrar mais|exam-matrix-topic/);
});

test('grupos pequenos continuam sem disclosure', () => {
  const html = renderIncidenceQuadrants([row(1, strong), row(2, strong)]);
  assert.doesNotMatch(html, /Mostrar mais/);
  assert.match(html, /Alta incidência · desenvolver domínio \(2\)/);
});

test('grupos longos mostram 5 + 10 e mandam o resto para o Diagnóstico', () => {
  const html = renderIncidenceQuadrants(Array.from({ length: 40 }, (_, index) => row(index, strong)));
  assert.match(html, /Mostrar mais · \+10/);
  assert.match(html, /Mais 25 tópicos neste grupo/);
  assert.equal((html.match(/data-exam-matrix-topic/g) || []).length, 15);
});
