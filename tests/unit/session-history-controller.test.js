import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionHistoryController } from '../../src/ui/tabs/today/session-history-controller.js';

test('createSessionHistoryController — calcula tempos acumulados e filtra sessões', () => {
  const state = {
    studySessions: [
      { id: 's1', date: '2026-03-10', durationSeconds: 3600, subjectId: 'sub1', topicId: 'top1', type: 'study' },
      { id: 's2', date: '2026-03-10', durationSeconds: 1800, subjectId: 'sub2', topicId: 'top2', type: 'questions', questionsResolved: 20, correctAnswers: 16 },
      { id: 's3', date: '2026-03-05', durationSeconds: 5400, subjectId: 'sub1', topicId: 'top1', type: 'study' },
    ],
    subjects: [
      { id: 'sub1', name: 'Constitucional', topics: [{ id: 'top1', name: 'Artigo 5º' }] },
      { id: 'sub2', name: 'Administrativo', topics: [{ id: 'top2', name: 'Atos' }] },
    ],
  };

  const controller = createSessionHistoryController({
    state,
    todayISO: () => '2026-03-10',
    entitySubjectId: s => s.subjectId,
    getSubjectName: id => (id === 'sub1' ? 'Constitucional' : 'Administrativo'),
    getTopicName: id => (id === 'top1' ? 'Artigo 5º' : 'Atos'),
  });

  // Tempos
  assert.equal(controller.totalStudySeconds(), 10800);
  assert.equal(controller.segundosEstudadosHoje(), 5400);
  assert.equal(controller.studyTimeByTopic('top1'), 9000);

  // Filtros
  const filtered = controller.filteredStudySessions();
  assert.equal(filtered.length, 3);

  // ViewModel
  const vm = controller.sessionViewModel(state.studySessions[1]);
  assert.equal(vm.subject, 'Administrativo');
  assert.equal(vm.questions, 20);
  assert.equal(vm.correct, 16);
  assert.equal(vm.accuracy, 80);
});

test('createSessionHistoryController — CRUD de sessões inline e exclusão', () => {
  let saved = false;
  let toasted = '';
  let confirmed = false;

  const state = {
    studySessions: [
      { id: 's1', date: '2026-03-10', durationSeconds: 3600, subjectId: 'sub1', topicId: 'top1', type: 'study' },
    ],
    subjects: [
      { id: 'sub1', name: 'Constitucional', topics: [{ id: 'top1', name: 'Artigo 5º' }] },
    ],
  };

  const mockSessionService = {
    edit(id, patch) {
      const s = state.studySessions.find(item => item.id === id);
      if (s) Object.assign(s, patch);
      return s;
    },
    remove(id) {
      state.studySessions = state.studySessions.filter(item => item.id !== id);
      return true;
    },
  };

  const controller = createSessionHistoryController({
    state,
    sessionService: mockSessionService,
    todayISO: () => '2026-03-10',
    persistAndRender: () => { saved = true; },
    showToast: msg => { toasted = msg; },
    showConfirm: (_msg, onConfirm) => { confirmed = true; onConfirm(); },
  });

  // Iniciar edição
  controller.editStudySession('s1');
  assert.equal(controller.historyEditState.sessionId, 's1');
  assert.ok(controller.historyEditDraft.session);

  // Atualizar rascunho (converter minutos em segundos)
  controller.updateStudySessionDraft('durationMinutes', 90);
  assert.equal(controller.historyEditDraft.session.durationSeconds, 5400);

  // Salvar
  controller.saveStudySessionEdit();
  assert.equal(saved, true);
  assert.equal(state.studySessions[0].durationSeconds, 5400);
  assert.match(toasted, /Sessão atualizada/);
  assert.equal(controller.historyEditState.sessionId, null);

  // Excluir
  controller.deleteStudySession('s1');
  assert.equal(confirmed, true);
  assert.equal(state.studySessions.length, 0);
});

test('createSessionHistoryController — expansão de dias e filtros dinâmicos', () => {
  const state = {
    studySessions: [
      { id: 's1', date: '2026-03-10', durationSeconds: 3600, subjectId: 'sub1', topicId: 'top1', type: 'study' },
      { id: 's2', date: '2026-03-09', durationSeconds: 1800, subjectId: 'sub1', topicId: 'top1', type: 'study' },
    ],
    subjects: [{ id: 'sub1', name: 'Constitucional', topics: [] }],
  };

  let filterChanged = false;

  const controller = createSessionHistoryController({
    state,
    todayISO: () => '2026-03-10',
    onFilterChange: () => { filterChanged = true; },
  });

  // Atualiza filtro de tipo
  controller.updateSessionHistoryFilter('type', 'study');
  assert.equal(controller.sessionHistoryFilters.type, 'study');
  assert.equal(filterChanged, true);

  // Seleciona data específica
  controller.selectSessionHistoryDate('2026-03-10');
  assert.equal(controller.sessionHistoryFilters.date, '2026-03-10');
  assert.equal(controller.sessionHistoryFilters.period, 'all');

  // Limpa filtros
  controller.clearSessionHistoryFilters();
  assert.equal(controller.sessionHistoryFilters.date, '');
  assert.equal(controller.sessionHistoryFilters.period, '30');

  // Expansão de dia e detalhes
  controller.toggleSessionDay('2026-03-10');
  controller.toggleSessionDetails('s1');
  controller.changeSessionDaysLimit(10);
});
