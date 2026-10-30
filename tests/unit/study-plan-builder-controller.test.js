import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyPlanBuilderController } from '../../src/ui/tabs/goals/study-plan-builder-controller.js';

function createMockDeps() {
  const elements = {};
  function makeEl(id) {
    elements[id] = {
      innerHTML: '',
      insertAdjacentHTML: (_pos, html) => {
        elements[id].innerHTML = html + elements[id].innerHTML;
      },
    };
    return elements[id];
  }

  const mockDoc = {
    getElementById: id => elements[id] || makeEl(id),
  };

  let saved = false;
  let toasted = '';
  let activePlan = null;
  const plans = [];

  const state = {
    examDate: '2026-12-31',
    metas: {
      horasPorDia: { '2026-10-28': 4 },
    },
    studyPlans: plans,
    adaptivePlanningHistory: [],
    reviewAgenda: [],
    examBlueprint: { activeExamTags: [] },
  };

  const deps = {
    document: mockDoc,
    getState: () => state,
    studyPlanService: {
      calculate: () => ({
        subjects: [{ subjectName: 'Direito Constitucional', minutes: 120 }],
        items: [
          {
            subjectId: 's1',
            topicId: 't1',
            subjectName: 'Direito',
            topicName: 'Controle',
            minutes: 60,
            score: 90,
            activityMix: { theory: 30, questions: 20, reviews: 10 },
          },
        ],
        weeklyAvailableMinutes: 240,
        weeklyNeedMinutes: 180,
        weeklyBalanceMinutes: 60,
        weeklyPlannedMinutes: 120,
        paceState: 'surplus',
        confidence: 0.95,
      }),
      confirm: proposal => {
        activePlan = { id: 'plan-1', ...proposal, confirmedAt: '2026-10-28T10:00:00Z' };
        plans.push(activePlan);
        return activePlan;
      },
      getActive: () => activePlan,
    },
    dailyPlanService: {
      calculate: () => ({
        state: 'proposal',
        plannedMinutes: 120,
        unallocatedMinutes: 0,
        days: [{ date: '2026-10-28', plannedMinutes: 120, flexMinutes: 30, items: [{}] }],
      }),
      confirm: () => ({ createdItems: 2 }),
      undo: () => ({ removedItems: 2, protectedItems: [] }),
    },
    intelligenceCandidates: () => [{ subjectId: 's1', topicId: 't1', remainingMinutes: 60 }],
    getTopicName: id => (id === 't1' ? 'Controle' : id),
    getSubjectName: id => (id === 's1' ? 'Direito' : id),
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T12:00:00Z',
    addDays: (d, n) => `2026-10-${28 + n}`,
    diasParaRevisao: () => 64,
    formatDatePt: d => d,
    formatPlanMinutes: m => `${m} min`,
    pluralize: (c, s, p) => `${c} ${c === 1 ? s : p || s + 's'}`,
    escapeHtml: s => String(s ?? ''),
    escapeAttr: s => String(s ?? ''),
    metaHoursForDate: () => 4,
    uid: prefix => `${prefix}-1`,
    showToast: msg => {
      toasted = msg;
    },
    scheduleSave: () => {
      saved = true;
    },
  };

  return { deps, elements, getState: () => state, getToasted: () => toasted, isSaved: () => saved };
}

test('StudyPlanBuilderController — calcula e renderiza proposta de plano semanal', () => {
  const { deps, elements } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);

  controller.calculateStudyPlanPreview();
  const preview = controller.getStudyPlanPreview();
  assert.ok(preview);
  assert.equal(preview.weeklyPlannedMinutes, 120);

  const html = elements['examStudyPlan'].innerHTML;
  assert.match(html, /Direito Constitucional/);
  assert.match(html, /120 min por semana/);
  assert.match(html, /Confirmar e salvar plano/);
});

test('StudyPlanBuilderController — confirma plano semanal e limpa preview', () => {
  const { deps, getToasted } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);

  controller.calculateStudyPlanPreview();
  assert.ok(controller.getStudyPlanPreview());

  controller.confirmStudyPlan();
  assert.equal(controller.getStudyPlanPreview(), null);
  assert.match(getToasted(), /Plano semanal confirmado e salvo/);
  assert.ok(controller.latestStudyPlan());
});

test('StudyPlanBuilderController — calcula e confirma distribuição diária para 7 dias', () => {
  const { deps, elements, getToasted } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);

  controller.calculateStudyPlanPreview();
  controller.confirmStudyPlan();

  controller.calculateDailyPlanPreview();
  const dailyPreview = controller.getDailyPlanPreview();
  assert.ok(dailyPreview);
  assert.equal(dailyPreview.plannedMinutes, 120);
  assert.match(elements['examStudyPlan'].innerHTML, /Distribuição proposta/);

  controller.confirmDailyPlanPreview();
  assert.equal(controller.getDailyPlanPreview(), null);
  assert.match(getToasted(), /2 atividades criadas no plano diário/);
});
