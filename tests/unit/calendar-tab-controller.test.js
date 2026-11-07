import test from 'node:test';
import assert from 'node:assert/strict';
import { configureUndo } from '../../src/ui/undoable.js';
import { createCalendarTabController } from '../../src/ui/tabs/calendar/calendar-tab-controller.js';

test('createCalendarTabController — unifica revisões e filtra por status/disciplina', () => {
  const state = {
    calendar: [
      {
        id: 'c1',
        date: '2026-03-10',
        week: 'Semana 1',
        subjectId: 's1',
        status: 'Não iniciado',
        reviewType: 'Teoria',
      },
      {
        id: 'c2',
        date: '2026-03-12',
        week: 'Semana 1',
        subjectId: 's2',
        status: 'Concluído',
        reviewType: 'Exercício',
      },
    ],
    reviewAgenda: [
      { id: 'r1', date: '2026-03-09', status: 'Pendente', subjectId: 's1', tipo: 'D+1' },
    ],
    subjects: [
      { id: 's1', name: 'Direito Constitucional', topics: [] },
      { id: 's2', name: 'Direito Administrativo', topics: [] },
    ],
  };

  const controller = createCalendarTabController({
    state,
    filters: { subjectId: '', status: '', month: '', type: '' },
    clock: { today: () => '2026-03-10' },
    entitySubjectId: item => item.subjectId,
    entitySubjectName: item => (item.subjectId === 's1' ? 'Constitucional' : 'Administrativo'),
    getSubjectName: id => (id === 's1' ? 'Constitucional' : 'Administrativo'),
    getTopicName: () => '',
  });

  const unificadas = controller.getRevisoesUnificadas();
  assert.equal(unificadas.length, 3);
  assert.ok(unificadas.some(u => u.id === 'c1' && u.origem === 'Calendário'));
  assert.ok(unificadas.some(u => u.id === 'r1' && u.origem === 'Agenda de Revisões'));

  const rows = controller.getFilteredAndSortedRows();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, 'c1');
  assert.equal(rows[1].id, 'c2');
});

test('createCalendarTabController — gerencia atrasadas agrupadas e paginação', () => {
  const state = {
    calendar: [
      { id: 'c1', date: '2026-03-05', subjectId: 's1', status: 'Não iniciado' },
      { id: 'c2', date: '2026-03-05', subjectId: 's2', status: 'Em andamento' },
      { id: 'c3', date: '2026-03-07', subjectId: 's1', status: 'Não iniciado' },
    ],
    reviewAgenda: [],
    subjects: [{ id: 's1', name: 'Constitucional' }],
  };

  /** @type {Record<string, any>} */
  const elements = {};
  const mockDoc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = { innerHTML: '', id };
      }
      return elements[id];
    },
    querySelectorAll() {
      return [];
    },
  };

  const controller = createCalendarTabController({
    state,
    clock: { today: () => '2026-03-10' },
    document: mockDoc,
    diasParaRevisao: () => -3,
    formatDatePt: d => d,
  });

  controller.renderCalAtrasadas('calAtrasadas');
  assert.ok(elements.calAtrasadas);
  assert.match(elements.calAtrasadas.innerHTML, /3 revisões atrasadas/);
  assert.match(elements.calAtrasadas.innerHTML, /2026-03-05/);

  // Toggle da data expandida
  controller.toggleOverdueDate('calAtrasadas', '2026-03-05');
  assert.ok(elements.calAtrasadas.innerHTML.length > 0);

  // Expansão e reset de limite
  controller.showAllOverdueGroups('calAtrasadas');
  controller.resetOverdueGroupLimit('calAtrasadas');
});

test('lista de hoje mostra somente itens pendentes e preserva concluídos no estado', () => {
  const element = { innerHTML: '' };
  const state = { calendar: [
    { id: 'pending', date: '2026-03-10', status: 'Não iniciado', subjectId: 's1' },
    { id: 'done', date: '2026-03-10', status: 'Concluído', subjectId: 's2' },
  ], reviewAgenda: [] };
  const controller = createCalendarTabController({ state, clock: { today: () => '2026-03-10' }, document: { getElementById: () => element }, entitySubjectName: item => item.subjectId });
  controller.renderCalTarefasHoje();
  assert.match(element.innerHTML, /s1/);
  assert.doesNotMatch(element.innerHTML, /s2/);
  assert.equal(state.calendar.length, 2);
});

test('createCalendarTabController — CRUD e conclusões integradas', () => {
  let saved = false;
  let toasted = '';
  let confirmed = false;

  const state = {
    calendar: [{ id: 'c1', date: '2026-03-10', subjectId: 's1', status: 'Não iniciado' }],
    reviewAgenda: [{ id: 'r1', status: 'Não iniciado' }],
    subjects: [{ id: 's1', name: 'Constitucional' }],
  };

  const mockCalendarService = {
    create(data) {
      const item = { id: 'c_new', ...data };
      state.calendar.push(item);
      return item;
    },
    getById(id) {
      return state.calendar.find(c => c.id === id);
    },
    update(id, patch) {
      const item = state.calendar.find(c => c.id === id);
      if (item) Object.assign(item, patch);
      return item;
    },
    remove(id) {
      state.calendar = state.calendar.filter(c => c.id !== id);
      return true;
    },
  };

  let agendaCompletedId = '';

  const controller = createCalendarTabController({
    state,
    calendarService: mockCalendarService,
    clock: { today: () => '2026-03-10' },
    activeSubjects: () => [{ id: 's1', name: 'Constitucional' }],
    persistAndRender: () => {
      saved = true;
    },
    showToast: msg => {
      toasted = msg;
    },
    showConfirm: (_msg, onConfirm) => {
      confirmed = true;
      onConfirm();
    },
    onCompleteAgendaReview: id => {
      agendaCompletedId = id;
    },
  });

  // addCalRow
  controller.addCalRow();
  assert.equal(state.calendar.length, 2);
  assert.equal(controller.calendarUiState.editingId, 'c_new');

  // updateCalendarDraft & save
  controller.updateCalendarDraft('status', 'Em andamento');
  controller.saveCalendarEdit();
  assert.equal(saved, true);
  assert.match(toasted, /Item do calendário atualizado/);

  // completeCalendarItem
  controller.completeCalendarItem('c1');
  assert.equal(state.calendar.find(c => c.id === 'c1').status, 'Concluído');

  // completeUnifiedReview delegando para agenda
  controller.completeUnifiedReview('r1', 'Agenda de Revisões');
  assert.equal(agendaCompletedId, 'r1');

  // deleteCalRow: apaga na hora e o Desfazer devolve o estado exato (F6)
  const undoToasts = [];
  configureUndo({
    getState: () => state,
    persistAndRender: () => {},
    showToast: () => {},
    showUndoToast: (message, onUndo) => undoToasts.push({ message, onUndo }),
  });
  const calendarBefore = structuredClone(state.calendar);
  controller.deleteCalRow('c1');
  assert.equal(confirmed, false);
  assert.ok(!state.calendar.some(c => c.id === 'c1'));
  assert.equal(undoToasts[0].message, 'Item excluído.');
  undoToasts[0].onUndo();
  assert.deepEqual(state.calendar, calendarBefore);
  configureUndo(null);
});
