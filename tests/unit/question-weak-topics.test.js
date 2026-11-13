import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectWeakTopics,
  renderWeakTopics,
  MIN_TOPIC_EVIDENCE_QUESTIONS,
} from '../../src/ui/tabs/questions/question-weak-topics.js';

const topic = (id, resolved, correct, name = id) => ({
  id,
  name,
  subjectName: 'Direito',
  resolved,
  correct,
  accuracy: resolved ? Math.round((correct / resolved) * 1000) / 10 : null,
});
const records = [
  { topicId: 'a', date: '2026-10-01' },
  { topicId: 'a', date: '2026-11-02' },
  { topicId: 'b', date: '2026-10-10' },
];

test('ordena por menor acerto, limita a 3 e ignora tópicos sem questões', () => {
  const topics = [topic('x', 100, 90), topic('a', 40, 10), topic('b', 50, 20), topic('c', 60, 30), topic('z', 0, 0), topic('d', 70, 60)];
  const result = selectWeakTopics({ topics, records });
  assert.deepEqual(result.map(t => t.topicId), ['a', 'b', 'c']);
});

test('traz sampleSize e período de cada tópico', () => {
  const [first] = selectWeakTopics({ topics: [topic('a', 40, 10)], records });
  assert.equal(first.sampleSize, 40);
  assert.equal(first.accuracy, 25);
  assert.equal(first.periodStart, '2026-10-01');
  assert.equal(first.periodEnd, '2026-11-02');
});

test('amostra abaixo do limiar existente fica marcada como evidência insuficiente', () => {
  assert.equal(MIN_TOPIC_EVIDENCE_QUESTIONS, 30);
  const result = selectWeakTopics({ topics: [topic('a', 3, 0), topic('b', 30, 10)], records });
  assert.equal(result.find(row => row.topicId === 'a').insufficient, true);
  assert.equal(result.find(row => row.topicId === 'b').insufficient, false);
  const html = renderWeakTopics({ topics: result, formatDate: d => d, escapeHtml: s => s });
  assert.match(html, /Evidência insuficiente/);
  assert.equal(html.match(/Evidência insuficiente/g).length, 1);
});

test('lista vazia vira estado vazio útil, não texto mudo', () => {
  assert.deepEqual(selectWeakTopics({ topics: [], records: [] }), []);
  const html = renderWeakTopics({ topics: [], formatDate: d => d, escapeHtml: s => s });
  assert.match(html, /Registre questões/);
  assert.doesNotMatch(html, /Nenhum resultado/);
});

test('empates de acerto mantêm a ordem de entrada', () => {
  const topics = [topic('p', 40, 20), topic('q', 40, 20), topic('r', 40, 20), topic('s', 40, 20)];
  assert.deepEqual(selectWeakTopics({ topics, records: [] }).map(t => t.topicId), ['p', 'q', 'r']);
});

test('prioriza tópicos com amostra suficiente antes dos sinais provisórios', () => {
  const result = selectWeakTopics({ topics: [topic('small', 2, 0), topic('enough', 40, 16)], records });
  assert.deepEqual(result.map(t => t.topicId), ['enough', 'small']);
  const html = renderWeakTopics({ topics: result, formatDate: d => d, escapeHtml: s => s });
  assert.match(html, /Amostra a ampliar/);
  assert.match(html, /Período não informado/);
});
