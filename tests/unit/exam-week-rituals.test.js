import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { examMinutesPerQuestion, paceAndGuess } from '../../src/domain/exams/simulation-score.js';
import { paceSummary } from '../../src/ui/tabs/questions/SimulationLogTable.js';
import { buildSimulatedRemediationDiagnostic } from '../../src/domain/diagnostics/simulated-remediation.js';
import { SimulatedRemediationModal } from '../../src/ui/components/SimulatedRemediationModal.js';
import {
  buildExamProtocol,
  toggleExamProtocolCheck,
} from '../../src/domain/planning/exam-protocol.js';
import { ExamProtocolCard } from '../../src/ui/components/ExamProtocolCard.js';

const blueprint = {
  durationMinutes: 300,
  subjects: [{ expectedQuestions: 60 }, { expectedQuestions: 40 }],
};

test('7: tempo da prova por questão e comparação no simulado', () => {
  assert.equal(examMinutesPerQuestion(blueprint), 3);
  assert.equal(examMinutesPerQuestion({ subjects: blueprint.subjects }), null);
  assert.equal(examMinutesPerQuestion({ durationMinutes: 300, subjects: [] }), null);
  const pace = paceAndGuess({ correct: 70, total: 100, durationMinutes: 350 }, 3);
  assert.equal(pace.minutesPerQuestion, 3.5);
  assert.equal(pace.examMinutesPerQuestion, 3);
  assert.match(paceSummary(pace), /3,5 min por questão \(prova: 3\)/);
  assert.doesNotMatch(
    paceSummary(paceAndGuess({ correct: 1, total: 2, durationMinutes: 4 })),
    /prova/
  );
});

const diagnostic = (examPace = null) =>
  buildSimulatedRemediationDiagnostic({
    simulation: {
      id: 's1',
      nome: 'Simulado 1',
      date: '2026-11-20',
      correct: 70,
      total: 100,
      durationMinutes: 350,
    },
    examMinutesPerQuestion: examPace,
  });

test('7 e 8: Raio-X compara o ritmo e oferece agendar a correção dos erros', () => {
  const html = render(
    h(SimulatedRemediationModal, {
      open: true,
      onClose() {},
      diagnostic: diagnostic(3),
      onScheduleErrorCorrection: () => true,
    })
  );
  assert.match(html, /a prova permite 3/);
  assert.match(html, /Nesse ritmo, faltaria tempo/);
  assert.match(html, /Correção dos erros/);
  assert.match(html, /Agendar para amanhã/);
  const done = render(
    h(SimulatedRemediationModal, {
      open: true,
      onClose() {},
      diagnostic: diagnostic(),
      onScheduleErrorCorrection: () => true,
      correctionScheduled: true,
    })
  );
  assert.match(done, /Correção na Agenda/);
  assert.doesNotMatch(done, /a prova permite/);
});

test('9: protocolo muda por fase e só existe nos 7 dias finais', () => {
  const base = { examDate: '2026-12-01' };
  assert.equal(buildExamProtocol({ ...base, daysToExam: 8 }), null);
  assert.equal(buildExamProtocol({ ...base, daysToExam: -1 }), null);
  assert.equal(buildExamProtocol({ ...base, daysToExam: null }), null);
  const week = buildExamProtocol({ ...base, daysToExam: 5, examMinutesPerQuestion: 2.5 });
  assert.equal(week.phase, 'week');
  assert.match(week.note, /Faltam 5 dias.*2,5 min por questão/);
  assert.equal(buildExamProtocol({ ...base, daysToExam: 1 }).phase, 'eve');
  const day = buildExamProtocol({ ...base, daysToExam: 0, netScoring: true });
  assert.equal(day.title, 'Dia da prova');
  assert.match(day.note, /cada erro anula um acerto/);
});

test('9: marcações valem para a data da prova em que foram feitas', () => {
  let checks = toggleExamProtocolCheck(null, '2026-12-01', 'eve-pen');
  assert.deepEqual(checks, { examDate: '2026-12-01', keys: ['eve-pen'] });
  const eve = buildExamProtocol({ examDate: '2026-12-01', daysToExam: 1, checks });
  assert.equal(eve.items.find(item => item.key === 'eve-pen').checked, true);
  checks = toggleExamProtocolCheck(checks, '2026-12-01', 'eve-pen');
  assert.deepEqual(checks.keys, []);
  const moved = buildExamProtocol({
    examDate: '2026-12-15',
    daysToExam: 1,
    checks: { examDate: '2026-12-01', keys: ['eve-pen'] },
  });
  assert.equal(
    moved.items.some(item => item.checked),
    false
  );
  assert.deepEqual(
    toggleExamProtocolCheck({ examDate: '2026-12-01', keys: ['a'] }, '2026-12-15', 'b').keys,
    ['b']
  );
  const html = render(h(ExamProtocolCard, { protocol: eve, onToggle() {} }));
  assert.match(html, /Véspera da prova/);
  assert.match(html, /1 de 6/);
  assert.match(html, /caneta esferográfica preta/);
});
