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
      horasPorDia: /** @type {Record<string, number>} */ ({ '2026-10-28': 4 }),
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

test('StudyPlanBuilderController — prévia diária explica o que não coube e oferece ajustar a disponibilidade', () => {
  const { deps, elements } = createMockDeps();
  deps.dailyPlanService.calculate = () => ({
    state: 'proposal',
    plannedMinutes: 140,
    unallocatedMinutes: 730,
    window: { availableMinutes: 720, reserveMinutes: 72, existingMinutes: 560 },
    days: [{ date: '2026-10-28', plannedMinutes: 140, flexMinutes: 12, items: [{}] }],
  });
  const controller = createStudyPlanBuilderController(deps);
  controller.calculateStudyPlanPreview();
  controller.confirmStudyPlan();
  controller.calculateDailyPlanPreview();
  const html = elements['examStudyPlan'].innerHTML;
  assert.match(html, /Cabem 140 min dos 870 min\./);
  assert.match(html, /soma 720 min; 560 min já estão agendados e 72 min ficam de reserva/);
  assert.match(html, /data-delegated-click="openAvailabilityAdjust\(\)"/);
});

test('StudyPlanBuilderController — prévia diária que cabe inteira não mostra a explicação', () => {
  const { deps, elements } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);
  controller.calculateStudyPlanPreview();
  controller.confirmStudyPlan();
  controller.calculateDailyPlanPreview();
  assert.doesNotMatch(elements['examStudyPlan'].innerHTML, /Cabem /);
});

test('StudyPlanBuilderController — Ajustar disponibilidade abre a dobra e leva ao bloco de capacidade', () => {
  const { deps, elements } = createMockDeps();
  const calls = [];
  elements.metasAdjust = { open: false };
  elements.metasCapacity = {
    scrollIntoView: () => calls.push('scroll'),
    querySelector: () => ({ focus: () => calls.push('focus') }),
  };
  createStudyPlanBuilderController(deps).openAvailabilityAdjust();
  assert.equal(elements.metasAdjust.open, true);
  assert.deepEqual(calls, ['scroll', 'focus']);
});

function confirmedCard() {
  const { deps, elements, getState } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);
  controller.calculateStudyPlanPreview();
  controller.confirmStudyPlan();
  return { html: elements['examStudyPlan'].innerHTML, controller, elements, getState };
}

test('plano confirmado mostra a linha de estado com as medidas da semana, sem texto de prévia', () => {
  const { html } = confirmedCard();
  assert.match(html, /Plano 120 min\/semana/);
  assert.match(html, /com tarefa marcada 0 min · falta marcar 120 min/);
  assert.doesNotMatch(html, /divisões de atividades propostas|preservadas|Ver resumo da semana|Distribua o plano/);
});

test('plano confirmado tem uma ação principal e no máximo duas secundárias, com os nomes novos', () => {
  const { html } = confirmedCard();
  const actions = html.match(/<div class="study-plan-actions">([\s\S]*?)<\/div>/)[1];
  const buttons = [...actions.matchAll(/<button class="btn( ghost| tertiary)?"[^>]*>([^<]*)<\/button>/g)];
  assert.equal(buttons.filter(b => !b[1]).length, 1);
  assert.ok(buttons.filter(b => b[1]).length <= 2);
  assert.deepEqual(
    buttons.map(b => b[2]),
    ['Agendar nos próximos 7 dias', 'Recalcular plano', 'Simular "E se?"'.replace('"', '&quot;').replace('"', '&quot;')]
  );
});

test('linha de estado diz "tudo marcado" quando a semana já tem o plano inteiro agendado', () => {
  const { deps, elements, getState } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);
  controller.calculateStudyPlanPreview();
  getState().dailyPlans = [
    { date: '2026-10-28', items: [{ id: 'a', plannedMinutes: 120, status: 'planned' }] },
  ];
  controller.confirmStudyPlan();
  assert.match(elements['examStudyPlan'].innerHTML, /com tarefa marcada 120 min · tudo marcado/);
});

test('plano confirmado rebaixa as ações secundárias a terciárias e não repete a barra de alocação', () => {
  const { html } = confirmedCard();
  assert.match(html, /class="btn tertiary"[^>]*>Recalcular plano/);
  assert.match(html, /class="btn tertiary"[^>]*>Simular &quot;E se\?&quot;/);
  assert.doesNotMatch(html, /chart-allocation-bar|Capacidade semanal alocada/);
});


test('o roteiro avança: com prova e horas o passo atual é calcular a proposta; com plano ele some', () => {
  const { deps, elements } = createMockDeps();
  deps.getState().metas.horasPorDia = { 1: 2 };
  const controller = createStudyPlanBuilderController(deps);
  controller.renderStudyPlanBuilder();
  const before = elements['examStudyPlan'].innerHTML;
  // Sem edital ou matérias, o passo atual é montá-lo (os mesmos 4 passos do assistente).
  assert.match(before, /Montar edital ou matérias/);
  assert.equal((before.match(/is-done/g) || []).length, 2);
  const subjects = deps.getState().subjects;
  deps.getState().subjects = [{ id: 'sx', name: 'X', topics: [{ id: 'tx', name: 'T' }] }];
  controller.renderStudyPlanBuilder();
  assert.match(elements['examStudyPlan'].innerHTML, /Calcular proposta semanal/);
  assert.equal((elements['examStudyPlan'].innerHTML.match(/is-done/g) || []).length, 3);
  deps.getState().subjects = subjects;
  controller.calculateStudyPlanPreview();
  controller.confirmStudyPlan();
  assert.doesNotMatch(elements['examStudyPlan'].innerHTML, /plan-roadmap/);
});

test('perfil sem plano mostra o roteiro de 4 passos; o passo 1 é o campo de data da prova', () => {
  const { deps, elements } = createMockDeps();
  deps.getState().examDate = '';
  createStudyPlanBuilderController(deps).renderStudyPlanBuilder();
  const html = elements['examStudyPlan'].innerHTML;
  assert.match(html, /Monte seu plano em 4 passos/);
  assert.match(html, /aria-current="step"/);
  // O campo do cabeçalho fica oculto fora da Visão geral: a data se define dentro do roteiro.
  assert.match(html, /<input type="date"[^>]*data-delegated-change="setRoadmapExamDate\(this\.value\)"/);
  assert.equal((html.match(/class="btn"/g) || []).length, 0);
});

test('setRoadmapExamDate grava a data pela função do cabeçalho e ignora valor vazio', () => {
  const { deps } = createMockDeps();
  const saved = [];
  deps.updateExamBlueprint = (field, value) => saved.push([field, value]);
  const controller = createStudyPlanBuilderController(deps);
  controller.setRoadmapExamDate('');
  controller.setRoadmapExamDate('2027-03-01');
  assert.deepEqual(saved, [['examDate', '2027-03-01']]);
});

test('o card só é repintado quando o HTML muda (o blur de um campo não troca o botão sob o clique)', () => {
  const { deps, elements } = createMockDeps();
  const controller = createStudyPlanBuilderController(deps);
  controller.renderStudyPlanBuilder();
  const writes = [];
  const el = elements['examStudyPlan'];
  let html = el.innerHTML;
  Object.defineProperty(el, 'innerHTML', { get: () => html, set: value => { writes.push(value); html = value; } });
  el.childNodes = [{}];
  controller.renderStudyPlanBuilder();
  controller.renderStudyPlanBuilder();
  assert.equal(writes.length, 0);
});
