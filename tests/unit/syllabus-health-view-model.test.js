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
      { subjectId: 'sub-rlm', resolved: 20, correct: 12 },   // 60%
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
