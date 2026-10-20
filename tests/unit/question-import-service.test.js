import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuestionImportService } from '../../src/application/questions/question-import-service.js';

function createMockEnvironment() {
  const state = {
    subjects: [
      {
        id: 's_portugues',
        name: 'Português',
        topics: [
          { id: 't_crase', name: 'Crase' }
        ]
      }
    ],
    questoes: [
      {
        id: 'q1',
        date: '2026-10-10',
        subjectId: 's_portugues',
        topicId: 't_crase',
        resolved: 10,
        correct: 8
      }
    ]
  };

  const subjectService = {
    create(name) {
      const subject = { id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, topics: [] };
      state.subjects.push(subject);
      return subject;
    },
    addTopic(subjectId, input) {
      const subject = state.subjects.find(s => s.id === subjectId);
      const topic = { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: input.name };
      subject.topics.push(topic);
      return topic;
    }
  };

  const questionService = {
    create(input) {
      const record = { id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, ...input };
      state.questoes.push(record);
      return record;
    }
  };

  return { state, subjectService, questionService };
}

test('question-import-service: gera prévia precisa identificando correspondências, novidades e duplicatas', () => {
  const { state, subjectService, questionService } = createMockEnvironment();
  const service = createQuestionImportService({
    subjectService,
    questionService,
    getSubjects: () => state.subjects,
    getQuestions: () => state.questoes,
    errorCategoryKeys: ['naoSabia', 'esqueci', 'interpretacao', 'calculo', 'desatencao', 'chute'],
    today: () => '2026-10-20',
    atomic: task => task()
  });

  const csv = `Data,Disciplina,Tópico,Resolvidas,Acertos
2026-10-10,portugues,Crase,10,8
2026-10-19,Português,Regência Verbal,15,12
2026-10-19,Matemática,Porcentagem,20,18`;

  const preview = service.preview(csv, { fileName: 'historico.csv' });

  assert.equal(preview.totalSessions, 3);
  assert.equal(preview.totalResolved, 45);
  assert.equal(preview.totalCorrect, 38);
  assert.equal(preview.accuracy, 84);

  // Linha 1 é duplicata exata de q1
  assert.equal(preview.duplicateCount, 1);
  assert.equal(preview.records[0].isDuplicate, true);

  // Linha 2 é disciplina existente, tópico novo
  assert.equal(preview.newTopics.length, 2);
  assert.ok(preview.newTopics.some(t => t.topicName === 'Regência Verbal' && t.subjectName === 'Português'));

  // Linha 3 é disciplina nova
  assert.equal(preview.newSubjects.length, 1);
  assert.equal(preview.newSubjects[0], 'Matemática');
});

test('question-import-service: executa importação atômica criando disciplinas e tópicos faltantes', () => {
  const { state, subjectService, questionService } = createMockEnvironment();
  const service = createQuestionImportService({
    subjectService,
    questionService,
    getSubjects: () => state.subjects,
    getQuestions: () => state.questoes,
    errorCategoryKeys: ['naoSabia', 'esqueci', 'interpretacao', 'calculo', 'desatencao', 'chute'],
    today: () => '2026-10-20',
    atomic: task => task()
  });

  const csv = `Data,Disciplina,Tópico,Resolvidas,Acertos
2026-10-10,Português,Crase,10,8
2026-10-19,Português,Regência Verbal,15,12
2026-10-19,Matemática,Porcentagem,20,18`;

  const preview = service.preview(csv, { fileName: 'historico.csv' });
  const result = service.import(preview, { createMissing: true, skipDuplicates: true });

  assert.equal(result.skippedDuplicatesCount, 1);
  assert.equal(result.addedSessions, 2);
  assert.equal(result.addedQuestionsCount, 35);
  assert.equal(result.createdSubjectsCount, 1);
  assert.equal(result.createdTopicsCount, 2);

  // Verifica que Matemática foi criada
  const mat = state.subjects.find(s => s.name === 'Matemática');
  assert.ok(mat);
  assert.equal(mat.topics[0].name, 'Porcentagem');

  // Verifica que Regência Verbal foi adicionada em Português
  const port = state.subjects.find(s => s.name === 'Português');
  assert.ok(port.topics.some(t => t.name === 'Regência Verbal'));

  // Total de questões em state agora é 1 (inicial) + 2 (novas) = 3
  assert.equal(state.questoes.length, 3);
});

test('question-import-service: grava errorBreakdown nas chaves do app e conta categorias desconhecidas na prévia', () => {
  const { state, subjectService, questionService } = createMockEnvironment();
  const errorCategoryKeys = ['naoSabia', 'esqueci', 'interpretacao', 'calculo', 'desatencao', 'chute'];
  assert.throws(
    () => createQuestionImportService({ subjectService, questionService, getSubjects: () => state.subjects, getQuestions: () => state.questoes }),
    /errorCategoryKeys/
  );
  const service = createQuestionImportService({
    subjectService,
    questionService,
    getSubjects: () => state.subjects,
    getQuestions: () => state.questoes,
    errorCategoryKeys,
    today: () => '2026-10-20',
    atomic: task => task()
  });

  const csv = `Data;Disciplina;Tópico;Resolvidas;Acertos;Erros;Motivo
2026-10-19;Português;Crase;10;7;3;atencao
2026-10-20;Português;Crase;4;2;2;sono`;

  const preview = service.preview(csv);
  assert.equal(preview.unknownErrorCategoryCount, 1);

  service.import(preview);
  const imported = state.questoes.filter(q => q.date === '2026-10-19');
  assert.equal(imported.length, 1);
  assert.deepEqual(Object.keys(imported[0].errorBreakdown), errorCategoryKeys);
  assert.equal(imported[0].errorBreakdown.desatencao, 3);
});

test('question-import-service: prévia avisa registros que irão para disciplinas/tópicos arquivados', () => {
  const { state, subjectService, questionService } = createMockEnvironment();
  state.subjects[0].topics.push({ id: 't_regencia', name: 'Regência', archived: true });
  state.subjects.push({ id: 's_historia', name: 'História', archived: true, topics: [] });
  const service = createQuestionImportService({
    subjectService,
    questionService,
    getSubjects: () => state.subjects,
    getQuestions: () => state.questoes,
    errorCategoryKeys: ['naoSabia'],
    today: () => '2026-10-20',
    atomic: task => task()
  });

  const csv = `Data,Disciplina,Tópico,Resolvidas,Acertos
2026-10-19,Português,Regência,10,8
2026-10-20,Português,Regência,5,5
2026-10-19,historia,,6,3
2026-10-10,Português,Crase,10,8
2026-10-19,Português,Crase,4,4`;

  const preview = service.preview(csv);
  assert.equal(preview.archivedRecordCount, 3);
  assert.deepEqual(preview.archivedMatches, ['Português: Regência', 'História']);
  assert.equal(preview.matchedSubjectsCount, 5, 'correspondência com arquivados continua');
  assert.equal(preview.newSubjects.length, 0);
  assert.equal(preview.newTopics.length, 0);

  // Duplicata em tópico arquivado é ignorada na importação, então não entra no aviso.
  state.questoes.push({ id: 'q2', date: '2026-10-19', subjectId: 's_historia', topicId: null, resolved: 6, correct: 3 });
  assert.equal(service.preview(csv).archivedRecordCount, 2);
});

test('question-import-service: falha no meio da importação desfaz disciplinas, tópicos e questões criados', () => {
  const { state, subjectService, questionService } = createMockEnvironment();
  const before = structuredClone(state);
  let calls = 0;
  const failingQuestionService = {
    create(input) {
      if (++calls === 2) throw new Error('falha simulada ao gravar questão');
      return questionService.create(input);
    }
  };
  // Mesmo contrato do atomic de app.js: snapshot antes, restaura as coleções no erro.
  const atomic = task => {
    const snapshot = structuredClone(state);
    try { return task(); } catch (error) { Object.assign(state, snapshot); throw error; }
  };
  const service = createQuestionImportService({
    subjectService,
    questionService: failingQuestionService,
    getSubjects: () => state.subjects,
    getQuestions: () => state.questoes,
    errorCategoryKeys: ['naoSabia'],
    today: () => '2026-10-20',
    atomic
  });

  const preview = service.preview(`Data,Disciplina,Tópico,Resolvidas,Acertos
2026-10-19,Português,Regência Verbal,15,12
2026-10-19,Matemática,Porcentagem,20,18`);

  assert.throws(() => service.import(preview), /falha simulada/);
  assert.equal(calls, 2, 'a 1ª questão foi gravada antes da falha');
  assert.deepEqual(state, before);
});

test('question-import-service: exige atomic e executa a importação dentro dele', () => {
  const { state, subjectService, questionService } = createMockEnvironment();
  const deps = { subjectService, questionService, getSubjects: () => state.subjects, getQuestions: () => state.questoes, errorCategoryKeys: ['naoSabia'], today: () => '2026-10-20' };
  assert.throws(() => createQuestionImportService(deps), /atomic/);

  let insideAtomic = false;
  const service = createQuestionImportService({
    ...deps,
    questionService: { create(input) { assert.ok(insideAtomic, 'questão criada fora de atomic'); return questionService.create(input); } },
    atomic: task => { insideAtomic = true; try { return task(); } finally { insideAtomic = false; } }
  });
  const result = service.import(service.preview('Data,Disciplina,Resolvidas,Acertos\n2026-10-19,Português,5,4'));
  assert.equal(result.addedSessions, 1);
});
