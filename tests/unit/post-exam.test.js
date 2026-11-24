import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  appealTaskDate,
  buildPostExamModel,
  normalizePostExam,
} from '../../src/domain/planning/post-exam.js';
import { PostExamCard } from '../../src/ui/components/PostExamCard.js';
import { normalizeExamBlueprint } from '../../src/state/strategic.js';

const examDate = '2026-11-15';

test('cartão só aparece de 1 a 60 dias depois da prova', () => {
  const base = { examDate, record: null };
  assert.equal(buildPostExamModel({ ...base, today: '2026-11-15' }), null);
  assert.equal(buildPostExamModel({ ...base, today: '2026-11-16' }).daysSince, 1);
  assert.equal(buildPostExamModel({ ...base, today: '2027-01-14' }).daysSince, 60);
  assert.equal(buildPostExamModel({ ...base, today: '2027-01-15' }), null);
  assert.equal(buildPostExamModel({ examDate: null, today: '2026-11-20' }), null);
});

test('nota estimada pelo gabarito, contra corte e meta, na regra do tipo de prova', () => {
  const record = normalizePostExam({ examDate, total: '100', correct: '72', wrong: '20' });
  const multiple = buildPostExamModel({
    examDate,
    today: '2026-11-20',
    record,
    cutoff: { score: 68 },
    targetScore: 75,
  });
  assert.equal(multiple.estimate, 72);
  assert.equal(multiple.cutoffGap, 4);
  assert.equal(multiple.targetGap, -3);
  const net = buildPostExamModel({
    examDate,
    today: '2026-11-20',
    record,
    scoring: 'certo-errado',
  });
  assert.equal(net.estimate, 52);
  assert.equal(net.net, true);
  // Registro de outra prova é ignorado.
  const other = buildPostExamModel({
    examDate: '2026-11-10',
    today: '2026-11-20',
    record,
  });
  assert.equal(other.estimate, null);
});

test('prazo de recurso: dias restantes e tarefa na véspera, nunca no passado', () => {
  const record = normalizePostExam({ examDate, appealDeadline: '2026-11-25' });
  const model = buildPostExamModel({ examDate, today: '2026-11-20', record });
  assert.equal(model.appealDaysLeft, 5);
  assert.equal(buildPostExamModel({ examDate, today: '2026-11-26', record }).appealDaysLeft, null);
  assert.equal(appealTaskDate('2026-11-25', '2026-11-20'), '2026-11-24');
  assert.equal(appealTaskDate('2026-11-25', '2026-11-25'), '2026-11-25');
});

test('normalização limita acertos e erros ao total e a configuração guarda o registro', () => {
  assert.deepEqual(normalizePostExam({ examDate, total: 10, correct: 15, wrong: 9 }), {
    examDate,
    total: 10,
    correct: 10,
    wrong: 0,
    appealDeadline: null,
  });
  assert.equal(normalizePostExam({ examDate: 'ontem' }), null);
  assert.equal(
    normalizeExamBlueprint({ postExam: { examDate, total: 60, correct: 40 } }).postExam.correct,
    40
  );
});

test('cartão mostra gabarito, recurso e próximo concurso', () => {
  const model = buildPostExamModel({
    examDate,
    today: '2026-11-20',
    record: normalizePostExam({ examDate, total: 100, correct: 72, appealDeadline: '2026-11-22' }),
    cutoff: { score: 68 },
  });
  const html = render(
    h(PostExamCard, {
      model,
      appealScheduled: false,
      onSaveAnswers() {},
      onSaveAppeal() {},
      onScheduleAppeal() {},
    })
  );
  assert.match(html, /Depois da prova/);
  assert.match(html, /Nota estimada: <strong>72%<\/strong> · 4 p\.p\. acima do corte de 68%/);
  assert.match(html, /Faltam 2 dias/);
  assert.doesNotMatch(html, /do meta/);
  assert.match(html, /Pôr na Agenda/);
  assert.match(html, /Próximo concurso/);
});
