import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewsTabController } from '../../src/ui/tabs/reviews/reviews-tab-controller.js';

test('createReviewsTabController — agrupa, filtra e ordena revisões por data e dificuldade', () => {
  const state = {
    reviewAgenda: [
      {
        id: 'r1',
        date: '2026-03-08',
        status: 'Não iniciado',
        subjectId: 's1',
        topicId: 't1',
        tipo: 'D+1',
      },
      {
        id: 'r2',
        date: '2026-03-10',
        status: 'Não iniciado',
        subjectId: 's1',
        topicId: 't2',
        tipo: 'D+7',
      },
      {
        id: 'r3',
        date: '2026-03-15',
        status: 'Não iniciado',
        subjectId: 's2',
        topicId: 't3',
        tipo: 'D+30',
      },
      {
        id: 'r4',
        date: '2026-03-01',
        status: 'Concluído',
        subjectId: 's1',
        topicId: 't1',
        tipo: 'D+1',
        completedAt: '2026-03-01',
      },
    ],
    subjects: [
      {
        id: 's1',
        name: 'Constitucional',
        topics: [
          { id: 't1', name: 'Direitos Fundamentais', difficulty: 'Difícil' },
          { id: 't2', name: 'Poder Executivo', difficulty: 'Fácil' },
        ],
      },
    ],
  };

  const controller = createReviewsTabController({
    state,
    todayISO: () => '2026-03-10',
    entitySubjectId: item => item.subjectId,
    getTopicDifficulty: () => 'Médio',
  });

  const rows = controller.getFilteredAndSortedReviews();
  assert.equal(rows.length, 4);

  const groups = controller.getGroupedReviews(rows);
  assert.equal(groups.overdue.length, 1);
  assert.equal(groups.overdue[0].id, 'r1');
  assert.equal(groups.today.length, 1);
  assert.equal(groups.today[0].id, 'r2');
  assert.equal(groups.upcoming.length, 1);
  assert.equal(groups.upcoming[0].id, 'r3');
  assert.equal(groups.completed.length, 1);
  assert.equal(groups.completed[0].id, 'r4');
});

test('createReviewsTabController — CRUD de revisões manuais e edição de rascunho', () => {
  let saved = false;
  let toasted = '';
  let confirmed = false;

  const state = {
    reviewAgenda: [
      { id: 'r1', date: '2026-03-10', status: 'Não iniciado', subjectId: 's1', tipo: 'Manual' },
    ],
    subjects: [{ id: 's1', name: 'Constitucional', topics: [] }],
  };

  const controller = createReviewsTabController({
    state,
    todayISO: () => '2026-03-10',
    nowISO: () => '2026-03-10T10:00:00Z',
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
  });

  // Criar revisão manual
  controller.addAgendaRow();
  assert.ok(controller.agendaUiState.editingId);
  assert.equal(controller.agendaUiState.editingIsNew, true);

  // Cancelar criação
  controller.cancelAgendaEdit();
  assert.equal(controller.agendaUiState.editingId, null);

  // Editar existente
  controller.editAgenda('r1');
  assert.equal(controller.agendaUiState.editingId, 'r1');
  controller.updateAgendaDraft('tipo', 'D+1');
  controller.saveAgendaEdit();
  assert.equal(saved, true);
  assert.equal(state.reviewAgenda[0].tipo, 'D+1');
  assert.match(toasted, /Revisão atualizada/);

  // Deletar
  controller.deleteAgendaRow('r1');
  assert.equal(confirmed, true);
  assert.equal(state.reviewAgenda.length, 0);
});

test('createReviewsTabController — geração automática e avaliação adaptativa SM-2', () => {
  let saved = false;
  let toasted = '';

  const state = {
    reviewAgenda: [],
    subjects: [
      {
        id: 's1',
        name: 'Constitucional',
        topics: [
          {
            id: 't1',
            name: 'Artigo 5º',
            status: 'Concluído',
            completedAt: '2026-03-01',
            difficulty: 'Médio',
          },
        ],
      },
    ],
  };

  /** @type {Record<string, any>} */
  const elements = {};
  const mockDoc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          classList: {
            add(cls) {
              this[cls] = true;
            },
            remove(cls) {
              this[cls] = false;
            },
          },
          setAttribute() {},
          removeAttribute() {},
          querySelector() {
            return { focus() {} };
          },
        };
      }
      return elements[id];
    },
  };

  const mockReviewService = {
    rateReview(id, rating, opts) {
      return {
        adaptiveState: { nextReviewDate: '2026-03-15' },
        rating,
        label: opts.label,
      };
    },
    restoreAdaptiveSchedule(id, suggestion) {
      return suggestion;
    },
  };

  const controller = createReviewsTabController({
    state,
    document: mockDoc,
    todayISO: () => '2026-03-10',
    nowISO: () => '2026-03-10T12:00:00Z',
    activeTopics: () => state.subjects[0].topics,
    getTopicById: id => ({ subject: state.subjects[0], topic: state.subjects[0].topics[0] }),
    diagnoseTopic: () => ({ performance: { accuracy: 85, resolved: 30 } }),
    subjectAccuracyTarget: () => 80,
    reviewService: mockReviewService,
    persistAndRender: () => {
      saved = true;
    },
    showToast: msg => {
      toasted = msg;
    },
    formatDatePt: d => d,
  });

  // Geração automática
  controller.gerarAgendaAutomatica();
  assert.ok(state.reviewAgenda.length > 0);
  assert.match(toasted, /adicionada/);

  const reviewItem = state.reviewAgenda[0];

  // Concluir revisão via modal SM-2
  controller.completeAgendaReview(reviewItem.id);
  assert.equal(elements.reviewRatingOverlay.classList.show, true);

  // Avaliar com rating 'good' (Bom)
  controller.rateCompletedReview('good');
  assert.equal(elements.reviewRatingOverlay.classList.show, false);
  assert.match(toasted, /Próxima em 2026-03-15/);
});
