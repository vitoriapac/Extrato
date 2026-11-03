import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { QuickStatsGrid } from '../../src/ui/tabs/dashboard/QuickStatsGrid.js';
import { SubjectProgressList } from '../../src/ui/tabs/dashboard/SubjectProgressList.js';
import { UpcomingReviewsList } from '../../src/ui/tabs/dashboard/UpcomingReviewsList.js';
import { AllocationBalanceGrid } from '../../src/ui/tabs/dashboard/AllocationBalanceGrid.js';
import { CriticalVulnerabilitiesGrid } from '../../src/ui/tabs/dashboard/CriticalVulnerabilitiesGrid.js';
import { VolatileMasteryGrid } from '../../src/ui/tabs/dashboard/VolatileMasteryGrid.js';
import { SyllabusHealthCard } from '../../src/ui/tabs/dashboard/SyllabusHealthCard.js';
import { CockpitSidebarCards } from '../../src/ui/tabs/dashboard/CockpitSidebarCards.js';
import { buildAllocationBalanceViewModel } from '../../src/application/analytics/build-allocation-balance-view-model.js';
import { buildCriticalVulnerabilitiesViewModel } from '../../src/application/analytics/build-critical-vulnerabilities-view-model.js';
import { buildVolatileMasteryViewModel } from '../../src/application/analytics/build-volatile-mastery-view-model.js';
import { buildSyllabusHealthViewModel } from '../../src/application/analytics/build-syllabus-health-view-model.js';
import { buildCockpitSidebarViewModel } from '../../src/application/analytics/build-cockpit-sidebar-view-model.js';
import { createDashboardTabController } from '../../src/ui/tabs/dashboard/dashboard-tab-controller.js';

test('QuickStatsGrid Preact Component — renderiza contadores de tópicos', () => {
  const html = render(
    h(QuickStatsGrid, {
      total: 50,
      naoIniciado: 20,
    })
  );

  assert.match(html, /50/);
  assert.match(html, /Tópicos totais/);
  assert.match(html, /20/);
  assert.match(html, /Não iniciados/);
  // Em andamento e concluídos ficam só no cabeçalho do extrato.
  assert.doesNotMatch(html, /Em andamento|Concluídos/);
});

test('SubjectProgressList Preact Component — renderiza barras de progresso ou vazio', () => {
  const emptyHtml = render(h(SubjectProgressList, { subjects: [] }));
  assert.match(emptyHtml, /Adicione disciplinas na aba/);
  assert.match(emptyHtml, /Disciplinas/);

  const html = render(
    h(SubjectProgressList, {
      subjects: [
        { id: 's1', name: 'Português', percentage: 75 },
        { id: 's2', name: 'Matemática', percentage: 40 },
      ],
    })
  );

  assert.match(html, /Português/);
  assert.match(html, /width:75%/);
  assert.match(html, /75%/);
  assert.match(html, /Matemática/);
  assert.match(html, /width:40%/);
  assert.match(html, /40%/);
});

test('UpcomingReviewsList Preact Component — renderiza itens ou vazio', () => {
  const emptyHtml = render(h(UpcomingReviewsList, { items: [] }));
  assert.match(emptyHtml, /Nenhuma revisão futura cadastrada/);

  const html = render(
    h(UpcomingReviewsList, {
      items: [
        {
          id: 'u1',
          date: '2026-03-20',
          dateFormatted: '20/03/2026',
          subject: 'Direito',
          label: 'Controle de Constitucionalidade · R1',
          status: 'Pendente',
          origem: 'Agenda de Revisões',
        },
      ],
    })
  );

  assert.match(html, /20\/03\/2026/);
  assert.match(html, /Direito/);
  assert.match(html, /Controle de Constitucionalidade/);
  assert.match(html, /Agenda de Revisões/);
  assert.match(html, /Pendente/);
});

test('createDashboardTabController — gera HTML dos 3 blocos da visão geral', () => {
  const controller = createDashboardTabController();

  const statsHtml = controller.renderQuickStatsHtml({
    total: 10,
    naoIniciado: 5,
  });
  assert.match(statsHtml, /Tópicos totais/);

  const barsHtml = controller.renderProgressBarsHtml([{ id: 's1', name: 'TI', percentage: 100 }]);
  assert.match(barsHtml, /TI/);
  assert.match(barsHtml, /100%/);

  const upcomingHtml = controller.renderUpcomingListHtml([]);
  assert.match(upcomingHtml, /Nenhuma revisão futura cadastrada/);
});

test('createDashboardTabController — renderKPIs e navegação de KPI', () => {
  const elements = {};
  function makeEl(id) {
    elements[id] = {
      innerHTML: '',
      scrollIntoView: () => {},
      value: '',
    };
    return elements[id];
  }

  const mockDoc = {
    getElementById: id => elements[id] || makeEl(id),
  };

  let navigatedTab = null;
  let agendaRendered = false;

  const controller = createDashboardTabController({
    document: mockDoc,
    getState: () => ({
      questoes: [{ resolved: 15 }, { resolved: 25 }],
      metas: { metaAprovacao: 85 },
    }),
    recentPerformance: () => ({ current: { accuracy: 88 } }),
    projectPerformance: () => ({ central: 82 }),
    revisoesAtrasadas: () => 3,
    formatDecimal: v => String(v),
    activateTab: tab => {
      navigatedTab = tab;
    },
    renderAgenda: () => {
      agendaRendered = true;
    },
  });

  controller.renderKPIs();
  assert.match(elements['kpiGrid'].innerHTML, /40/);
  assert.match(elements['kpiGrid'].innerHTML, /Questões resolvidas/);
  assert.match(elements['kpiGrid'].innerHTML, /88%/);
  assert.match(elements['kpiGrid'].innerHTML, /3/);
  assert.match(elements['kpiGrid'].innerHTML, /Revisões atrasadas/);
  // O total soma Calendário + Agenda; só a lista do Calendário mostra os dois.
  assert.match(elements['kpiGrid'].innerHTML, /navigateKpi\('agenda','overdue'\)/);

  controller.navigateKpi('agenda', 'overdue');
  assert.equal(navigatedTab, 'agenda');
  assert.equal(elements['agendaFilterStatus'].value, 'Atrasadas');
  assert.equal(agendaRendered, true);
});

test('createDashboardTabController — renderExamCountdown e renderExamProgress', () => {
  const elements = {};
  function makeEl(id) {
    elements[id] = {
      innerHTML: '',
      textContent: '',
      style: {},
      classList: {
        toggle: () => {},
        remove: () => {},
      },
      setAttribute: () => {},
    };
    return elements[id];
  }

  const mockDoc = {
    getElementById: id => elements[id] || makeEl(id),
    activeElement: null,
  };

  const controller = createDashboardTabController({
    document: mockDoc,
    getState: () => ({ examDate: '2026-12-31' }),
    todayISO: () => '2026-10-28',
    planStartDate: () => '2026-01-01',
    parseLocalDate: s => new Date(s + 'T00:00:00'),
    diasParaRevisao: () => 64,
    pluralize: (c, s, p) => `${c} ${c === 1 ? s : p || s + 's'}`,
  });

  controller.renderExamCountdown();
  assert.match(elements['examCountdownFigure'].textContent, /faltam 64 dias para a prova/);
  assert.match(elements['examProgress'].innerHTML, /dias totais/);
  assert.match(elements['examProgress'].innerHTML, /64 faltam/);
});

test('createDashboardTabController — renderHeatmap e filtros', () => {
  const elements = {};
  function makeEl(id) {
    elements[id] = { innerHTML: '' };
    return elements[id];
  }

  const mockDoc = {
    getElementById: id => elements[id] || makeEl(id),
  };

  const controller = createDashboardTabController({
    document: mockDoc,
    todayISO: () => '2026-10-28',
    addDays: (d, n) => '2026-10-28',
    parseLocalDate: s => new Date(s + 'T00:00:00'),
    getActivityDates: () => ['2026-10-28'],
    getDailyStudySummary: date => ({
      date,
      seconds: 3600,
      sessions: [{}],
      questions: 10,
      accuracy: 80,
      reviews: 2,
      simulations: 0,
      subjectNames: ['Português'],
      goalPct: 100,
      targetSeconds: 3600,
    }),
    heatmapMetricLevel: () => 2,
    computeStreak: () => 5,
    getGoalDates: () => ['2026-10-28'],
    activeSubjects: () => [{ id: 's1', name: 'Português' }],
  });

  controller.renderHeatmap();
  assert.ok(elements['heatmapContainer'].innerHTML.length > 0);

  controller.setHeatmapFilter('metric', 'questions');
  assert.equal(controller.getStreakView().metric, 'questions');

  controller.selectHeatmapDay('2026-10-28');
  assert.equal(controller.getStreakView().selectedDate, '2026-10-28');
});

test('AllocationBalanceGrid Preact Component — renderiza linhas de alocação e diagnóstico', () => {
  const model = buildAllocationBalanceViewModel({
    subjects: [
      { id: 's1', name: 'Direito Constitucional', examWeightPercent: 30 },
    ],
    sessions: [
      { subjectId: 's1', durationSeconds: 3600, date: '2026-10-20' },
    ],
    today: '2026-10-20',
  });

  const html = render(h(AllocationBalanceGrid, { model }));
  assert.match(html, /Balanço: Tempo Investido vs\. Peso no Edital/);
  assert.match(html, /Direito Constitucional/);
  assert.match(html, /1,0h|1h/);
  assert.match(html, /100/);
});

test('CriticalVulnerabilitiesGrid Preact Component — renderiza tópicos de alta incidência', () => {
  const model = buildCriticalVulnerabilitiesViewModel({
    subjects: [
      {
        id: 's1',
        name: 'Direito Constitucional',
        topics: [
          { id: 't1', name: 'Controle de Constitucionalidade', incidence: 'Alta' },
        ],
      },
    ],
    metricsByTopic: {
      t1: { mastery: { score: 45 }, coverage: 100 },
    },
    blueprint: { masteryTarget: 80 },
  });

  const html = render(
    h(CriticalVulnerabilitiesGrid, {
      model,
      onTrainTopic: () => {},
    })
  );
  assert.match(html, /Radar de Vulnerabilidades Críticas/);
  assert.match(html, /Controle de Constitucionalidade/);
  assert.match(html, /Alta Incidência/);
  assert.match(html, /45%/);
  assert.match(html, /Treinar questões/);
});

test('VolatileMasteryGrid Preact Component — renderiza tópicos com falsa consolidação', () => {
  const model = buildVolatileMasteryViewModel({
    subjects: [
      {
        id: 's1',
        name: 'Direito Administrativo',
        topics: [{ id: 't1', name: 'Atos Administrativos' }],
      },
    ],
    questoes: [
      { topicId: 't1', date: '2026-09-01', total: 10, correct: 10 },
      { topicId: 't1', date: '2026-09-20', total: 10, correct: 5 },
    ],
  });

  const html = render(
    h(VolatileMasteryGrid, {
      model,
      onScheduleReview: () => {},
    })
  );
  assert.match(html, /Domínio Volátil/);
  assert.match(html, /Atos Administrativos/);
  assert.match(html, /-50 p\.p\./);
  assert.match(html, /100%/);
  assert.match(html, /50%/);
  assert.match(html, /Agendar revisão ativa/);
});

test('SyllabusHealthCard Preact Component — renderiza barras empilhadas e bullet bars', () => {
  const model = buildSyllabusHealthViewModel({
    subjects: [
      {
        id: 's1',
        name: 'Direito Administrativo',
        topics: [
          { id: 't1', status: 'Concluído' },
          { id: 't2', status: 'Em andamento' },
        ],
      },
    ],
    questoes: [
      { subjectId: 's1', resolved: 10, correct: 8 },
    ],
  });

  const html = render(h(SyllabusHealthCard, { model }));
  assert.match(html, /Saúde do Edital por Disciplina/);
  assert.match(html, /Direito Administrativo/);
  assert.match(html, /80% acerto/);
});

test('CockpitSidebarCards Preact Component — renderiza Meta de Hoje, Carga e Mini-Heatmap', () => {
  const model = buildCockpitSidebarViewModel(
    {
      historico: [{ data: '2026-11-02', duracao: 90 }],
      questoes: [{ data: '2026-11-02', resolvidas: 25 }],
    },
    '2026-11-02'
  );

  const html = render(h(CockpitSidebarCards, { model }));
  assert.match(html, /Meta de Hoje/);
  assert.match(html, /Carga de Revisões/);
  assert.match(html, /Consistência \(4 Semanas\)/);
  assert.match(html, /25/);
});


