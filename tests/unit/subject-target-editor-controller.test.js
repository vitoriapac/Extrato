import test from 'node:test';
import assert from 'node:assert/strict';
import { configureUndo } from '../../src/ui/undoable.js';
import { createSubjectTargetEditorController } from '../../src/ui/tabs/goals/subject-target-editor-controller.js';

function createMockDom() {
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        dataset: {},
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
      });
    }
    return elements.get(id);
  }

  return {
    getElementById: id => getElement(id),
  };
}

function createBaseContext(doc) {
  let toasts = [];
  let persists = 0;
  let readinessCaptures = [];

  const state = {
    examBlueprint: {
      activeExamTags: ['bb-escriturario'],
      subjects: [
        {
          subjectId: 'sub-1',
          priority: 'Alta',
          expectedQuestions: 10,
          questionWeight: 1.5,
          accuracyTarget: 80,
          masteryTarget: 80,
        },
      ],
      configuredAt: '2026-10-28T00:00:00.000Z',
    },
    metas: {
      metaAprovacao: 80,
    },
  };

  return {
    ctx: {
      document: doc,
      getState: () => state,
      examEvidenceContext: () => ({
        questions: { included: [{ id: 'q-1', subjectId: 'sub-1', resolved: 10, correct: 8 }] },
      }),
      examScopedSubjects: () => [{ id: 'sub-1', name: 'Português' }],
      entitySubjectId: item => item.subjectId,
      todayISO: () => '2026-10-28',
      nowISO: () => '2026-10-28T12:00:00.000Z',
      escapeHtml: s => String(s || ''),
      escapeAttr: s => String(s || ''),
      showToast: msg => toasts.push(msg),
      persistAndRender: () => persists++,
      captureReadinessBeforeStrategy: r => readinessCaptures.push(r),
      invalidatePlanPreview: () => {},
    },
    state,
    toasts,
    persists: () => persists,
    readinessCaptures,
  };
}

test('createSubjectTargetEditorController — renderSubjectTargetEditor preenche HTML no container', () => {
  const doc = createMockDom();
  const { ctx } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.renderSubjectTargetEditor();

  const container = doc.getElementById('subjectTargetEditor');
  assert.ok(container.innerHTML.length > 0);
  assert.ok(container.innerHTML.includes('Português'));
});

test('createSubjectTargetEditorController — saveSubjectAccuracyTargets atualiza meta e persiste', () => {
  const doc = createMockDom();
  const { ctx, state, toasts, persists, readinessCaptures } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.saveSubjectAccuracyTargets(['sub-1'], '85');

  const saved = state.examBlueprint.subjects.find(s => s.subjectId === 'sub-1');
  assert.equal(saved?.accuracyTarget, 85);
  assert.equal(persists(), 1);
  assert.equal(readinessCaptures.length, 1);
  assert.ok(toasts.includes('Metas de acerto atualizadas.'));
});

test('createSubjectTargetEditorController — saveSubjectAccuracyTargets rejeita valor fora de 0-100', () => {
  const doc = createMockDom();
  const { ctx, toasts, persists } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.saveSubjectAccuracyTargets(['sub-1'], '150');

  assert.equal(persists(), 0);
  assert.ok(toasts.includes('Informe uma meta entre 0% e 100%.'));
});

test('createSubjectTargetEditorController — saveSubjectAccuracyTargets rejeita disciplina não elegível', () => {
  const doc = createMockDom();
  const { ctx, toasts, persists } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.saveSubjectAccuracyTargets(['sub-inexistente'], '75');

  assert.equal(persists(), 0);
  assert.ok(toasts.includes('Selecione ao menos uma disciplina do concurso ativo.'));
});

function createSplitContext() {
  const doc = createMockDom();
  const base = createBaseContext(doc);
  base.state.metas.questoesSemanal = 220;
  base.state.metasPorDisciplina = [
    { id: 'g1', subjectId: 'sub-1', meta: 30 },
    { id: 'g2', subjectId: 'sub-2', meta: 90 },
  ];
  base.ctx.examScopedSubjects = () => [
    { id: 'sub-1', name: 'Português' },
    { id: 'sub-2', name: 'Matemática' },
  ];
  base.ctx.somarQuestoesDisciplinaNaSemana = () => 0;
  base.ctx.subjectGoalService = {
    update: (id, patch) =>
      Object.assign(
        base.state.metasPorDisciplina.find(item => item.id === id),
        patch
      ),
  };
  return { ...base, doc };
}

test('renderSubjectTargetEditor usa a meta global de questões salva em metas.questoesSemanal', () => {
  const { ctx, doc } = createSplitContext();
  createSubjectTargetEditorController(ctx).renderSubjectTargetEditor();
  const html = doc.getElementById('subjectTargetEditor').innerHTML;
  assert.ok(html.includes('220 questões/semana'));
  assert.ok(!html.includes('sem meta global de questões'));
  assert.ok(html.includes('somam 120 questões por semana; a meta global é 220 (faltam 100)'));
  assert.match(html, /data-questions-split-preview/);
});

test('a repartição mostra prévia sem gravar e só confirma com a ação explícita', () => {
  const { ctx, state, doc } = createSplitContext();
  const controller = createSubjectTargetEditorController(ctx);
  controller.previewQuestionGoalSplit();
  const html = doc.getElementById('subjectTargetEditor').innerHTML;
  assert.match(html, /Prévia: repartir 220 questões por semana/);
  assert.match(html, /30 → 55/);
  assert.match(html, /90 → 165/);
  assert.deepEqual(
    state.metasPorDisciplina.map(item => item.meta),
    [30, 90]
  );
  controller.cancelQuestionGoalSplit();
  assert.deepEqual(
    state.metasPorDisciplina.map(item => item.meta),
    [30, 90]
  );
  assert.doesNotMatch(doc.getElementById('subjectTargetEditor').innerHTML, /Prévia: repartir/);
});

test('confirmar a repartição fecha na meta global e o Desfazer restaura as metas', () => {
  const { ctx, state } = createSplitContext();
  let undo = null;
  configureUndo({
    getState: ctx.getState,
    persistAndRender: ctx.persistAndRender,
    showToast: ctx.showToast,
    showUndoToast: (_message, onUndo) => (undo = onUndo),
  });
  try {
    const controller = createSubjectTargetEditorController(ctx);
    controller.previewQuestionGoalSplit();
    controller.confirmQuestionGoalSplit();
    assert.deepEqual(
      state.metasPorDisciplina.map(item => item.meta),
      [55, 165]
    );
    assert.equal(
      state.metasPorDisciplina.reduce((sum, item) => sum + item.meta, 0),
      220
    );
    undo();
    assert.deepEqual(
      state.metasPorDisciplina.map(item => item.meta),
      [30, 90]
    );
  } finally {
    configureUndo(null);
  }
});

test('repartir com alterações pendentes avisa e não calcula nada', () => {
  const { ctx, toasts } = createSplitContext();
  const container = ctx.document.getElementById('subjectTargetEditor');
  let onInput;
  container.addEventListener = (type, handler) => {
    if (type === 'input') onInput = handler;
  };
  const controller = createSubjectTargetEditorController(ctx);
  controller.bindEvents();
  onInput({
    target: {
      matches: () => false,
      dataset: { field: 'weekly', subject: 'sub-1' },
      value: '45',
    },
  });
  controller.previewQuestionGoalSplit();
  assert.ok(toasts.includes('Salve ou descarte as alterações pendentes antes de repartir a meta.'));
});

function setupCommit() {
  const { ctx, state, doc, toasts } = createSplitContext();
  state.examBlueprint.subjects[0].priority = 'high';
  const captures = [];
  ctx.captureReadinessBeforeStrategy = reason => captures.push(reason);
  const controller = createSubjectTargetEditorController(ctx);
  return { ctx, state, doc, toasts, captures, controller };
}

test('uma tabela única mostra prioridade, peso, questões na prova, meta de acerto, acerto atual e questões por semana', () => {
  const { doc, controller } = setupCommit();
  controller.renderSubjectTargetEditor();
  const html = doc.getElementById('subjectTargetEditor').innerHTML;
  for (const heading of ['Disciplina', 'Prioridade', 'Peso', 'Questões na prova', 'Meta de acerto', 'Acerto atual', 'Questões por semana'])
    assert.ok(html.includes(heading), heading);
  assert.equal((html.match(/<table/g) || []).length, 1);
  assert.ok(html.includes('Salvar alterações'));
  assert.doesNotMatch(html, /Salvar acerto|Salvar questões|data-accuracy-save|data-weekly-goal-save/);
});

test('Salvar alterações grava tudo de uma vez: configuração da disciplina, meta de acerto e questões por semana', () => {
  const { state, controller, captures } = setupCommit();
  const drafts = controller.getDrafts();
  drafts.set('sub-1', { priority: 'low', weight: '2', expected: '12', accuracy: '70', weekly: '40' });
  drafts.set('sub-2', { weekly: '55' });
  controller.commitAllPendingDrafts();
  const config = state.examBlueprint.subjects.find(item => item.subjectId === 'sub-1');
  assert.equal(config.priority, 'low');
  assert.equal(config.questionWeight, 2);
  assert.equal(config.expectedQuestions, 12);
  assert.equal(config.accuracyTarget, 70);
  assert.equal(state.metasPorDisciplina.find(item => item.id === 'g1').meta, 40);
  assert.equal(state.metasPorDisciplina.find(item => item.id === 'g2').meta, 55);
  assert.equal(captures.length, 1);
  assert.equal(drafts.size, 0);
});

test('valor inválido não grava nada e mantém os rascunhos para corrigir', () => {
  const { state, controller, toasts } = setupCommit();
  const before = JSON.stringify([state.examBlueprint, state.metasPorDisciplina]);
  controller.getDrafts().set('sub-1', { weight: '0', weekly: '99' });
  controller.commitAllPendingDrafts();
  assert.ok(toasts.some(text => text.includes('Revise as metas')));
  assert.equal(JSON.stringify([state.examBlueprint, state.metasPorDisciplina]), before);
  assert.equal(controller.getDrafts().size, 1);
});

test('acerto atual vira BulletBar com texto alternativo, âmbar só abaixo da meta', async () => {
  const { renderSubjectTargetEditor } = await import('../../src/ui/renderers/subject-target-editor-renderer.js');
  const rows = [
    { subjectId: 's1', name: 'Português', state: 'ok', accuracy: 60, gap: -20, evolution: 2 },
    { subjectId: 's2', name: 'Matemática', state: 'ok', accuracy: 90, gap: 10, evolution: 0 },
    { subjectId: 's3', name: 'Direito', state: 'insufficient', accuracy: null, gap: null, evolution: null },
  ];
  const html = renderSubjectTargetEditor({ rows, globalTarget: 80, blueprint: { subjects: [] } });
  assert.match(html, /aria-label="Acerto atual de Português: 60%, meta 80%, abaixo da meta"/);
  assert.match(html, /aria-label="Acerto atual de Matemática: 90%, meta 80%"/);
  assert.equal((html.match(/is-below/g) || []).length, 1);
  assert.match(html, /Dados insuficientes/);
});
