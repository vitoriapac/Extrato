import test from 'node:test';
import assert from 'node:assert/strict';
import { assessBeginner, BEGINNER_DAYS_LIMIT, BEGINNER_QUESTION_LIMIT } from '../../src/domain/analytics/beginner-gate.js';
import { renderBeginnerState } from '../../src/ui/performance/performance-beginner-state.js';

const today = '2026-11-14';
const q = (date, resolved) => ({ date, resolved });

test('sem nenhum registro é iniciante, com zero questões e zero dias', () => {
  assert.deepEqual(assessBeginner({ today }), { beginner: true, questionCount: 0, recordDays: 0 });
});

test('o limite é de 30 questões OU 14 dias de registro: cada um sozinho já tira do modo iniciante', () => {
  assert.equal(BEGINNER_QUESTION_LIMIT, 30);
  assert.equal(BEGINNER_DAYS_LIMIT, 14);
  assert.equal(assessBeginner({ today, questions: [q('2026-11-10', 29)] }).beginner, true);
  assert.equal(assessBeginner({ today, questions: [q('2026-11-10', 30)] }).beginner, false);
  assert.equal(assessBeginner({ today, questions: [q('2026-11-10', 10), q('2026-11-12', 20)] }).beginner, false);
  // 13 dias desde o primeiro registro ainda é iniciante; 14 não é.
  assert.equal(assessBeginner({ today, sessions: [{ date: '2026-11-01' }] }).beginner, true);
  const twoWeeks = assessBeginner({ today, sessions: [{ date: '2026-10-31' }] });
  assert.equal(twoWeeks.recordDays, 14);
  assert.equal(twoWeeks.beginner, false);
});

test('o primeiro registro vale tanto para sessão quanto para questão, e lixo é ignorado', () => {
  const result = assessBeginner({ today, questions: [q('2026-11-12', 5), { date: 'x', resolved: 'y' }], sessions: [{ startedAt: '2026-11-05T10:00:00Z' }, {}] });
  assert.equal(result.recordDays, 9);
  assert.equal(result.questionCount, 5);
});

test('o estado vazio diz o que a aba faz, quando fica útil e quanto o aluno já tem', () => {
  const html = renderBeginnerState('subjects', { beginner: true, questionCount: 12, recordDays: 1 });
  assert.match(html, /data-beginner-state="subjects"/);
  assert.match(html, /compara a precisão e a tendência de cada disciplina/);
  assert.match(html, /30 questões respondidas ou 2 semanas de registro/);
  assert.match(html, /Você tem 12 questões e 1 dia de registro/);
  assert.match(html, /data-performance-open="questoes"/);
  assert.match(renderBeginnerState('diagnosis', { beginner: true, questionCount: 1, recordDays: 3 }), /Você tem 1 questão e 3 dias/);
  assert.match(renderBeginnerState('questions', { beginner: true, questionCount: 0, recordDays: 0 }), /simulados e a inteligência da prova/);
});
