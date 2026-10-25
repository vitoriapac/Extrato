import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { QuestionLogTable } from '../../src/ui/tabs/questions/QuestionLogTable.js';
import { SimulationLogTable } from '../../src/ui/tabs/questions/SimulationLogTable.js';
import { createQuestionsController } from '../../src/ui/tabs/questions/questions-controller.js';

test('QuestionLogTable Preact Component — exibe estado vazio quando sem questões', () => {
  const html = render(
    h(QuestionLogTable, {
      questions: [],
      visibleLimit: 10,
      openErrorIds: new Set(),
      errorCategories: { attention: { icon: '⚠️', label: 'Atenção' } },
      getViewModel: () => ({
        date: '',
        subject: '',
        topic: '',
        resolved: 0,
        correct: 0,
        accuracy: 0,
        errors: 0,
      }),
      getCategorizedErrors: () => 0,
    })
  );

  assert.match(html, /Nenhuma sessão de questões registrada ainda/);
  assert.match(html, /addQuestaoRow\(\)/);
});

test('QuestionLogTable Preact Component — renderiza linhas de questões e categorização de erros', () => {
  const dummyQuestions = [
    {
      id: 'q1',
      date: '2026-03-01',
      subjectId: 'sub-1',
      topicId: 'top-1',
      resolved: 20,
      correct: 16,
      errorBreakdown: { attention: 2, interpretation: 2 },
    },
  ];

  const html = render(
    h(QuestionLogTable, {
      questions: dummyQuestions,
      visibleLimit: 10,
      openErrorIds: new Set(['q1']),
      errorCategories: {
        attention: { icon: '⚠️', label: 'Falta de atenção' },
        interpretation: { icon: '🔍', label: 'Interpretação' },
      },
      getViewModel: q => ({
        date: q.date,
        subject: 'Direito Constitucional',
        topic: 'Direitos Fundamentais',
        resolved: q.resolved,
        correct: q.correct,
        accuracy: 80,
        errors: 4,
      }),
      getCategorizedErrors: () => 4,
    })
  );

  assert.match(html, /Direito Constitucional/);
  assert.match(html, /Direitos Fundamentais/);
  assert.match(html, /80%/);
  assert.match(html, /4\/4/); // Erros categorizados
  assert.match(html, /Falta de atenção/);
  assert.match(html, /Interpretação/);
});

test('SimulationLogTable Preact Component — renderiza simulados e breakdown expansível', () => {
  const dummySims = [
    {
      id: 'sim1',
      date: '2026-03-05',
      nome: 'Simulado Geral 1',
      correct: 70,
      total: 100,
      breakdown: [{ id: 'b1', subjectId: 'sub-1', correct: 25, total: 30 }],
    },
  ];

  const html = render(
    h(SimulationLogTable, {
      simulations: dummySims,
      visibleLimit: 10,
      openBreakdownIds: new Set(['sim1']),
      getViewModel: s => ({
        date: s.date,
        name: s.nome,
        correct: s.correct,
        total: s.total,
        score: 70.0,
      }),
      getSubjectOptionsHtml: () => '<option value="sub-1" selected>Português</option>',
    })
  );

  assert.match(html, /Simulado Geral 1/);
  assert.match(html, /70\.0%/);
  assert.match(html, /Desempenho por disciplina/);
  assert.match(html, /Português/);
});

test('createQuestionsController — coordena a renderização de questões e simulados', () => {
  const state = {
    questoes: [{ id: 'q1', date: '2026-03-01', resolved: 10, correct: 9, errorBreakdown: {} }],
    simulados: [{ id: 's1', date: '2026-03-02', nome: 'Simulado Alpha', correct: 80, total: 100 }],
  };

  const controller = createQuestionsController({
    state,
    listViewState: { questionsVisible: 10, simulationsVisible: 10 },
    questionEditController: { state: { editingId: null, draft: null } },
    simulationEditController: { state: { editingId: null, draft: null } },
    errorCategories: {},
    questionViewModel: q => ({
      date: q.date,
      subject: 'Geral',
      topic: 'Tópico',
      resolved: q.resolved,
      correct: q.correct,
      accuracy: 90,
      errors: 1,
    }),
    questionCategorizedErrors: () => 0,
  });

  const questionsHtml = controller.renderQuestionsHtml();
  const simulationsHtml = controller.renderSimulationsHtml();

  assert.match(questionsHtml, /90%/);
  assert.match(simulationsHtml, /Simulado Alpha/);
  assert.match(simulationsHtml, /80\.0%/);
});
