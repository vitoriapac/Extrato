import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRhythmBurnup } from '../../src/ui/renderers/rhythm-burnup-renderer.js';

const history = Array.from({ length: 9 }, (_, i) => ({ daysAgo: (8 - i) * 7, completed: 10 + i * 2 }));

test('burn-up: sem prova futura ou já concluído não desenha', () => {
  const base = { totalTopics: 100, completedTopics: 26, history, ratePerDay: 0.3 };
  assert.equal(renderRhythmBurnup({ ...base, daysToExam: null }), '');
  assert.equal(renderRhythmBurnup({ ...base, daysToExam: 0 }), '');
  assert.equal(renderRhythmBurnup({ ...base, completedTopics: 100, daysToExam: 30 }), '');
});

test('burn-up: atrás do ritmo necessário fica em atenção e diz a diferença em texto', () => {
  const html = renderRhythmBurnup({ totalTopics: 100, completedTopics: 26, history, ratePerDay: 0.5, daysToExam: 74 });
  assert.match(html, /is-behind/);
  assert.match(html, /Ritmo atual: 3,5 tópicos por semana; necessário para terminar até a prova: 7 por semana\. No ritmo atual, 63 de 100 tópicos na data da prova\./);
  assert.match(html, /role="img" aria-label="Cobertura do edital até a prova: 26 de 100 tópicos concluídos hoje\./);
  assert.match(html, /rhythm-burnup__projection/);
});

test('burn-up: no ritmo, projeção para no total; sem ritmo, só a linha necessária', () => {
  const ok = renderRhythmBurnup({ totalTopics: 30, completedTopics: 26, history, ratePerDay: 1, daysToExam: 40 });
  assert.doesNotMatch(ok, /is-behind/);
  assert.match(ok, /30 de 30 tópicos na data da prova/);
  const none = renderRhythmBurnup({ totalTopics: 100, completedTopics: 26, history, ratePerDay: 0, daysToExam: 74 });
  assert.doesNotMatch(none, /rhythm-burnup__projection/);
  assert.match(none, /Sem conclusões nos últimos 14 dias/);
});
