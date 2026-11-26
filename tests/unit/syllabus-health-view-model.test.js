import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSyllabusHealthViewModel } from '../../src/application/analytics/build-syllabus-health-view-model.js';

test('buildSyllabusHealthViewModel: lida com estado vazio de forma segura', () => {
  const result = buildSyllabusHealthViewModel(null);
  assert.deepEqual(result, { subjects: [] });

  const resultEmpty = buildSyllabusHealthViewModel({ subjects: [] });
  assert.deepEqual(resultEmpty, { subjects: [] });
});

test('buildSyllabusHealthViewModel: calcula progresso empilhado e acerto por disciplina', () => {
  const state = {
    subjects: [
      {
        id: 'sub-admin',
        name: 'Direito Administrativo',
        topics: [
          { id: 'top-1', status: 'Concluído' },
          { id: 'top-2', status: 'Concluído' },
          { id: 'top-3', status: 'Em andamento' },
          { id: 'top-4', status: 'Não iniciado' },
        ],
      },
      {
        id: 'sub-rlm',
        name: 'Raciocínio Lógico',
        topics: [
          { id: 'top-5', status: 'Em andamento' },
          { id: 'top-6', status: 'Não iniciado' },
        ],
      },
    ],
    questoes: [
      { subjectId: 'sub-admin', resolved: 40, correct: 34 }, // 85%
      { subjectId: 'sub-rlm', resolved: 20, correct: 12 }, // 60%
    ],
    metas: {
      metaAprovacao: 80,
    },
  };

  const result = buildSyllabusHealthViewModel(state);
  assert.equal(result.subjects.length, 2);

  // RLM should be first because status is 'attention' (60% < 80%)
  const rlm = result.subjects.find(s => s.id === 'sub-rlm');
  assert.ok(rlm);
  assert.equal(rlm.concludedPct, 0);
  assert.equal(rlm.inProgressPct, 50);
  assert.equal(rlm.accuracy, 60);
  assert.equal(rlm.status, 'attention');
  assert.equal(rlm.gap, -20);

  const admin = result.subjects.find(s => s.id === 'sub-admin');
  assert.ok(admin);
  assert.equal(admin.concludedPct, 50); // 2/4
  assert.equal(admin.inProgressPct, 25); // 1/4
  assert.equal(admin.accuracy, 85);
  assert.equal(admin.status, 'ok');
  assert.equal(admin.gap, 5);
});

test('buildSyllabusHealthViewModel: informa a origem do acerto (questões ou simulados) e o histórico inteiro', () => {
  const state = {
    subjects: [
      { id: 'a', name: 'Com questões', topics: [] },
      { id: 'b', name: 'Só simulado', topics: [] },
      { id: 'c', name: 'Sem dados', topics: [] },
    ],
    // Datas antigas de propósito: o card usa todo o histórico, não só as últimas 4 semanas.
    questoes: [{ subjectId: 'a', date: '2020-01-01', resolved: 20, correct: 10 }],
    simulados: [{ breakdown: [{ subjectId: 'b', total: 20, correct: 15 }] }],
    metas: { metaAprovacao: 80 },
  };
  const bySubject = Object.fromEntries(
    buildSyllabusHealthViewModel(state).subjects.map(s => [s.id, s])
  );
  assert.equal(bySubject.a.accuracy, 50);
  assert.equal(bySubject.a.accuracySource, 'questions');
  assert.equal(bySubject.b.accuracySource, 'simulations');
  assert.equal(bySubject.c.accuracySource, null);
});

test('buildSyllabusHealthViewModel: "abaixo da meta" exige 10 questões, como no Desempenho', () => {
  const state = {
    subjects: [
      { id: 'a', name: 'Amostra suficiente', topics: [] },
      { id: 'b', name: 'Amostra pequena', topics: [] },
    ],
    questoes: [
      { subjectId: 'a', date: '2026-01-01', resolved: 10, correct: 7 },
      { subjectId: 'b', date: '2026-01-01', resolved: 9, correct: 2 },
    ],
    metas: { metaAprovacao: 80 },
  };
  const by = Object.fromEntries(buildSyllabusHealthViewModel(state).subjects.map(s => [s.id, s]));
  assert.equal(by.a.status, 'attention');
  assert.equal(by.b.status, 'insufficient');
  assert.equal(by.b.accuracy, 22.2);
});

test('buildSyllabusHealthViewModel: abaixo da meta ordena por pontos em jogo, não por distância', () => {
  const subject = id => ({ id, name: id, topics: [{ id: id + '-t', status: 'Concluído' }] });
  const state = {
    subjects: [subject('ingles'), subject('especificos')],
    questoes: [
      { subjectId: 'ingles', resolved: 20, correct: 10 }, // 50%: 30 p.p. abaixo
      { subjectId: 'especificos', resolved: 20, correct: 14 }, // 70%: 10 p.p. abaixo
    ],
    metas: { metaAprovacao: 80 },
    examBlueprint: {
      subjects: [
        { subjectId: 'ingles', expectedQuestions: 5, questionWeight: 1 },
        { subjectId: 'especificos', expectedQuestions: 30, questionWeight: 1.5 },
      ],
    },
  };
  const { subjects } = buildSyllabusHealthViewModel(state);
  assert.deepEqual(
    subjects.map(s => s.id),
    ['especificos', 'ingles']
  );
  assert.equal(subjects[0].pointsAtStake, 4.5); // 45 pts × 10%
  assert.equal(subjects[1].pointsAtStake, 1.5); // 5 pts × 30%
});
