import { h } from 'preact';
import { revealAdvanced } from '../../essential-mode.js';
import { mountPreact } from '../../preact-mount.js';
import {
  createPerformanceViewState,
  resolvePerformanceRange,
  updatePerformanceViewState,
} from '../../../application/performance/performance-view-state.js';
import { buildPerformancePageModel } from '../../../application/performance/build-performance-page-model.js';
import {
  renderPerformanceChromeHtml,
  renderPerformanceDefaultBody,
  renderPerformancePage,
} from '../../performance/performance-page.js';
import { PerformancePageNav } from '../../performance/PerformancePageNav.js';
import { renderPerformanceSection } from '../../performance/render-performance-section.js';
import { createPerformanceController } from '../../controllers/performance-controller.js';
import { createPerformanceAnalyticsController } from '../../controllers/performance-analytics-controller.js';
import { renderProgressChart as renderProgressChartView } from '../../renderers/study-charts-renderer.js';
import { ShiftEnergyCard } from './ShiftEnergyCard.js';
import { NARROW_CHART_BREAKPOINT } from '../../primitives/charts/chart-size.js';
import { fitCharts, watchCharts } from '../../performance/chart-fit.js';
import { buildShiftEnergyViewModel } from '../../../application/analytics/build-shift-energy-view-model.js';
import { CareerBenchmarkCard } from '../../components/CareerBenchmarkCard.js';
import {
  detectCareerCluster,
  aggregateRecentActivity,
  calculateCareerBenchmarkComparison,
  type CareerClusterId,
} from '../../../domain/analytics/career-benchmarks.js';

export interface PerformanceTabControllerDeps {
  document?: any;
  window?: any;
  getState: () => any;
  todayISO: () => string;
  formatDatePt: (dateStr: string) => string;
  formatDecimal?: (val: number | null | undefined) => string;
  escapeHtml: (text: any) => string;
  escapeAttr: (text: any) => string;
  examEvidenceContext: () => any;
  examScopedSubjects: () => any[];
  examScopedSimulations: () => any[];
  currentAchievementProjection?: () => {
    model: any;
    weeklyCapacityMinutes?: number;
    adherenceContext?: any;
  };
  achievementProjectionHistory?: (snapshots: any[], tags: string[], today: string) => any[];
  recoveryController?: { preview: (model: any) => any; revert?: (id: string) => Promise<any> };
  readinessResult?: (metrics: any) => any;
  computeApprovalMetrics?: () => any;
  intelligenceCandidates?: () => any[];
  /** A mesma próxima melhor ação de Hoje, para a leitura da preparação. */
  nextBestAction?: () => any;
  entitySubjectId?: (item: any) => string | null;
  simuladoEffectiveCounts?: (simulado: any) => any;
  localDateFromTimestamp?: (timestamp: any) => string;
  topicMasteryIndex?: (subjectId: string, topicId: string) => any;
  topicRetentionScore?: (subjectId: string, topicId: string) => any;
  buildTopicExamProfile?: (options: any) => any;
  topicHistoryService?: { list: (options: any) => any[] };
  analysisContextBanner?: (section: string) => string;
  renderExamIntelligenceSection?: () => void;
  projectionController?: { simulate: (scenario: any) => any };
  renderProjectionScenarioResult?: (result: any, options: any) => string;
  applyConfirmedRecoveryPlan?: (sig: string) => void;
  render?: (tab: string) => void;
  activateTab?: (tab: string) => void;
  activeSubjects?: () => any[];
  subjectRadarModel?: (subject: any) => any;
}

export function createPerformanceTabController(deps: PerformanceTabControllerDeps) {
  const doc = deps.document || (typeof document !== 'undefined' ? document : null);
  const escapeHtml = deps.escapeHtml;
  const escapeAttr = deps.escapeAttr;
  const formatDatePt = deps.formatDatePt;
  const todayISO = deps.todayISO;

  // URL por subaba: "#desempenho/diagnosis" abre a subaba direto; "#desempenho" abre a Visão geral.
  const PERFORMANCE_SECTIONS = [
    'overview',
    'subjects',
    'diagnosis',
    'questions',
    'simulations',
    'exam',
    'consistency',
  ];
  let performanceViewState = createPerformanceViewState();
  // Cruzar o ponto de quebra (celular × desktop) muda a geometria dos gráficos: desenha de novo.
  doc?.defaultView
    ?.matchMedia?.(`(max-width: ${NARROW_CHART_BREAKPOINT - 1}px)`)
    ?.addEventListener?.('change', () => {
      if ((doc.querySelector('.tab-btn.active') as HTMLElement | null)?.dataset.tab === 'desempenho')
        renderPerformance();
    });
  const hashSection = /^#desempenho\/([a-z]+)/.exec(doc?.defaultView?.location?.hash || '')?.[1];
  // Voltar e URLs coladas mudam o hash sem recarregar: a seção acompanha.
  doc?.defaultView?.addEventListener?.('hashchange', () => {
    const hash = doc?.defaultView?.location?.hash || '';
    if (!/^#desempenho(\/|$)/.test(hash)) return;
    const next = /^#desempenho\/([a-z]+)/.exec(hash)?.[1] ?? 'overview';
    if (!PERFORMANCE_SECTIONS.includes(next) || next === performanceViewState.section) return;
    performanceViewState = updatePerformanceViewState(performanceViewState, { section: next });
    if ((doc.querySelector('.tab-btn.active') as HTMLElement | null)?.dataset.tab === 'desempenho')
      renderPerformance();
  });
  if (hashSection && PERFORMANCE_SECTIONS.includes(hashSection)) {
    performanceViewState = updatePerformanceViewState(performanceViewState, {
      section: hashSection,
    });
  }
  // Dobras lembram se estavam abertas ao redesenhar (trocar período, filtro ou semana não as fecha).
  const foldMemory = new Map<string, boolean>();
  const foldKey = (section: string, fold: Element) =>
    `${section}|${(fold as HTMLElement).dataset?.foldKey ?? fold.querySelector(':scope > summary')?.textContent?.trim().slice(0, 80) ?? ''}`;
  let selectedCareerClusterId: CareerClusterId | null = null;

  function recordProgressSnapshot(pct: number) {
    const state = deps.getState();
    const today = todayISO();
    if (!state.progressHistory) state.progressHistory = [];
    const existing = state.progressHistory.find((p: any) => p.date === today);
    if (existing) {
      existing.pct = pct;
    } else {
      state.progressHistory.push({ date: today, pct });
    }
    state.progressHistory.sort((a: any, b: any) => a.date.localeCompare(b.date));
    if (state.progressHistory.length > 180) {
      state.progressHistory = state.progressHistory.slice(-180);
    }
  }

  function renderProgressChart() {
    if (!doc) return;
    const container = doc.getElementById('progressChart');
    if (!container) return;
    const state = deps.getState();
    container.innerHTML = renderProgressChartView({
      data: state.progressHistory || [],
      formatDate: formatDatePt,
    });
  }

  function renderRadarDisciplinas() {
    if (!doc) return;
    const container = doc.getElementById('radarChart');
    if (!container) return;
    container.innerHTML = performanceAnalyticsController.renderRadarHtml();
  }

  const performanceAnalyticsController = createPerformanceAnalyticsController({
    getSubjects: () => (deps.activeSubjects ? deps.activeSubjects() : []),
    getSubjectRadarModel: deps.subjectRadarModel ? deps.subjectRadarModel : () => ({}),
    onRender: renderRadarDisciplinas,
    escapeHtml,
    escapeAttr,
  });

  function setRadarSubject(slot: string, value: any) {
    performanceAnalyticsController.setRadarSubject(slot, value);
  }

  function performanceScopedPlans(scope: any) {
    const state = deps.getState();
    if (!(state.examBlueprint?.activeExamTags || []).length) return state.dailyPlans || [];
    const eligible = new Set(scope.content.eligibleTopics.map((item: any) => item.id));
    return (state.dailyPlans || [])
      .map((plan: any) => ({
        ...plan,
        items: (plan.items || []).filter((item: any) => item.topicId && eligible.has(item.topicId)),
      }))
      .filter((plan: any) => plan.items.length);
  }

  function renderPerformance() {
    if (!doc) return;
    const target = doc.getElementById('performancePage');
    if (!target) return;

    const panel = doc.getElementById('panel-desempenho');
    const examHub = doc.getElementById('examIntelligenceHub');
    const parking = doc.getElementById('examIntelligenceParking');
    if (examHub && parking && examHub.parentElement !== parking) parking.append(examHub);

    const readinessCard = doc.getElementById('performanceReadinessCard');
    const decisionDetails = doc.getElementById('performanceDecisionDetails');
    const todayAnalysisDetails = panel?.querySelector?.('.today-analysis-details') || null;
    const gapsDetails = doc.getElementById('desempenho-gaps');
    const progressSection = doc.getElementById('performance-progress');
    const studyDetails = doc.getElementById('desempenho-study');
    const consistencyMural = doc.getElementById('performanceConsistencyMural');
    if (panel && typeof panel.append === 'function') {
      for (const node of [
        consistencyMural,
        readinessCard,
        decisionDetails,
        todayAnalysisDetails,
        gapsDetails,
        progressSection,
        studyDetails,
      ]) {
        if (node && node.parentElement && node.parentElement !== panel) {
          panel.append(node);
        }
      }
    }

    const state = deps.getState();
    const today = todayISO();
    const range = resolvePerformanceRange({ today, ...performanceViewState });
    const scope = deps.examEvidenceContext();
    const activeExamTags = state.examBlueprint?.activeExamTags || [];
    const examSection = performanceViewState.section === 'exam';
    const achievement =
      ['overview', 'simulations'].includes(performanceViewState.section) &&
      deps.currentAchievementProjection
        ? deps.currentAchievementProjection()
        : null;

    const pageModel = examSection
      ? null
      : buildPerformancePageModel({
          viewState: performanceViewState,
          range,
          today,
          activeExamTags,
          scope,
          subjects: deps.examScopedSubjects ? deps.examScopedSubjects() : [],
          simulations:
            performanceViewState.section === 'overview' ||
            performanceViewState.section === 'subjects' ||
            performanceViewState.section === 'simulations'
              ? deps.examScopedSimulations
                ? deps.examScopedSimulations()
                : []
              : [],
          achievementProjection: achievement?.model || null,
          achievementHistory: deps.achievementProjectionHistory
            ? deps.achievementProjectionHistory(
                state.projectionSnapshots || [],
                activeExamTags,
                today
              )
            : [],
          achievementCapacityMinutes: achievement?.weeklyCapacityMinutes || 0,
          adherenceContext: achievement?.adherenceContext || null,
          recoveryPlan:
            achievement && deps.recoveryController
              ? deps.recoveryController.preview(achievement.model)
              : null,
          projectionSnapshots: state.projectionSnapshots || [],
          readinessSnapshots: state.readinessSnapshots || [],
          readiness:
            performanceViewState.section === 'overview' &&
            deps.readinessResult &&
            deps.computeApprovalMetrics
              ? deps.readinessResult(deps.computeApprovalMetrics())
              : null,
          blueprint: state.examBlueprint,
          globalTarget: state.metas?.metaAprovacao,
          recommendationFeedback: state.recommendationFeedback || [],
          allSessions: state.studySessions || [],
          nextBestAction:
            performanceViewState.section === 'overview' && deps.nextBestAction
              ? deps.nextBestAction()
              : null,
          candidates:
            ['subjects', 'overview'].includes(performanceViewState.section) &&
            deps.intelligenceCandidates
              ? deps.intelligenceCandidates()
              : [],
          dailyPlans: performanceScopedPlans(scope),
          executionSource: {
            dailyPlans: state.dailyPlans || [],
            sessions: state.studySessions || [],
            subjects: state.subjects || [],
            capacityHistory: state.planningCapacityHistory || [],
            adherenceTarget: state.metas?.aderenciaSemanal,
          },
          subjectIdFor: deps.entitySubjectId || ((item: any) => item.subjectId),
          simulationCountsFor:
            deps.simuladoEffectiveCounts || ((s: any) => ({ total: s.total, correct: s.correct })),
          reviewCompletedDateFor: (item: Record<string, any>) =>
            deps.localDateFromTimestamp
              ? deps.localDateFromTimestamp(item.completedAt)
              : item.completedAt,
          topicMetricsFor: (subjectId: string, topicId: string) => {
            const mastery = deps.topicMasteryIndex
              ? deps.topicMasteryIndex(subjectId, topicId)
              : null;
            const retention = deps.topicRetentionScore
              ? deps.topicRetentionScore(subjectId, topicId)
              : null;
            return {
              mastery: mastery?.confidence > 0 ? mastery.score : null,
              retention: retention?.available ? retention.score : null,
              evidence: mastery?.confidence || 0,
            };
          },
          topicProfileFor: (topic: Record<string, any>, subject: Record<string, any>) =>
            deps.buildTopicExamProfile
              ? deps.buildTopicExamProfile({
                  topic,
                  subjectConfig: (state.examBlueprint?.subjects || []).find(
                    (item: any) => item.subjectId === subject.id
                  ),
                  activeExamTags,
                  exams: state.exams || [],
                  examQuestions: state.examQuestions || [],
                })
              : {},
          topicHistoryFor: (topicId: string) =>
            deps.topicHistoryService
              ? deps.topicHistoryService.list({ topicId, includeLifecycle: false })
              : [],
        });

    const sectionHtml = examSection
      ? '<div id="examIntelligenceMount"></div>'
      : renderPerformanceSection(pageModel!, {
          range,
          today,
          activeExamTags,
          formatDate: formatDatePt,
          escapeHtml,
          escapeAttr,
          targetScore: state.examBlueprint?.configuredAt ? state.examBlueprint.targetScore : null,
        });

    if ((target as HTMLElement).dataset && !(target as HTMLElement).dataset.foldMemory) {
      (target as HTMLElement).dataset.foldMemory = 'true';
      target.addEventListener?.(
        'toggle',
        (event: Event) => {
          const fold = event.target as HTMLDetailsElement;
          if (fold?.tagName !== 'DETAILS' || !fold.closest('#performanceSectionContent')) return;
          foldMemory.set(foldKey(performanceViewState.section, fold), fold.open);
        },
        true
      );
    }
    const fullSectionHtml =
      (deps.analysisContextBanner ? deps.analysisContextBanner('desempenho') : '') + sectionHtml;
    const isRealDomTarget =
      typeof globalThis.document !== 'undefined' &&
      (target as Element).ownerDocument === globalThis.document &&
      typeof (target as Element).querySelector === 'function';

    if (isRealDomTarget) {
      let navMount = target.querySelector('#performanceNavMount') as Element | null;
      if (!navMount) {
        target.innerHTML = `<div class="performance-page"><header class="page-header"><div class="page-header__text"><h2>Desempenho</h2><p>Acompanhe sua evolução, compare períodos e identifique mudanças na sua preparação.</p></div></header><div id="performanceNavMount"></div><div id="performanceChromeArea" class="contents"></div><div id="performanceSectionContent" role="tabpanel"></div></div>`;
        navMount = target.querySelector('#performanceNavMount') as Element | null;
      }

      if (navMount) {
        mountPreact(
          h(PerformancePageNav, {
            activeSection: performanceViewState.section,
            onSelectSection: (nextSection: string) => {
              performanceViewState = updatePerformanceViewState(performanceViewState, {
                section: nextSection,
              });
              if (deps.render) deps.render('desempenho-visao');
              else renderPerformance();
            },
          }),
          navMount
        );
      }

      const chromeArea = target.querySelector('#performanceChromeArea');
      if (chromeArea) {
        chromeArea.innerHTML = renderPerformanceChromeHtml({
          viewState: performanceViewState,
          range,
          activeExamCount: (state.examBlueprint?.activeExamTags || []).length,
          escapeHtml,
        });
      }

      const sectionContent = target.querySelector('#performanceSectionContent');
      if (sectionContent) {
        sectionContent.setAttribute(
          'aria-labelledby',
          `performanceTab-${performanceViewState.section}`
        );
        sectionContent.innerHTML =
          fullSectionHtml ||
          renderPerformanceDefaultBody({
            viewState: performanceViewState,
            escapeHtml,
            escapeAttr,
          });
        // Radar e progresso moram em painéis do mesmo painel de Desempenho, fora do conteúdo da subaba.
        const panel = (target as Element).closest?.('#panel-desempenho') || target;
        fitCharts(panel as Element);
        watchCharts(panel as Element);
      }
    } else {
      target.innerHTML = renderPerformancePage({
        viewState: performanceViewState,
        range,
        sectionHtml: fullSectionHtml,
        activeExamCount: (state.examBlueprint?.activeExamTags || []).length,
        escapeHtml,
        escapeAttr,
      });
    }

    if (examSection) {
      target.querySelector('#examIntelligenceMount')?.append(examHub!);
      if (deps.renderExamIntelligenceSection) deps.renderExamIntelligenceSection();
    } else if (performanceViewState.section === 'overview') {
      const readinessMount = target.querySelector('#performanceReadinessMount');
      if (readinessMount && readinessCard) readinessMount.append(readinessCard);
    } else if (performanceViewState.section === 'subjects') {
      // Matriz, Balanço, Radar e Queda de retenção moraram aqui; agora ficam em Diagnóstico.
      // Evolução e progresso por disciplina saíram de Conquistas e esperam virar modos da Comparação.
      if (progressSection) target.append(progressSection);
    } else if (performanceViewState.section === 'diagnosis') {
      const diagnosisMount = target.querySelector('#performanceDiagnosisMount');
      if (diagnosisMount && todayAnalysisDetails) {
        // A subaba já é o disclosure: o bloco fica aberto e o resumo é ocultado por CSS.
        todayAnalysisDetails.setAttribute('open', '');
        revealAdvanced(todayAnalysisDetails as HTMLElement, false);
        diagnosisMount.append(todayAnalysisDetails);
      }
      const gapsMount = target.querySelector('#performanceDiagnosisGapsMount');
      if (gapsMount) {
        // Nasce fechada: Diagnóstico já traz a matriz e o diagnóstico consolidado; a dobra lembra se foi aberta.
        if (decisionDetails && !foldMemory.has(foldKey('diagnosis', decisionDetails)))
          (decisionDetails as HTMLDetailsElement).open = false;
        for (const node of [decisionDetails, gapsDetails]) {
          if (node) gapsMount.append(node);
        }
      }
    } else if (performanceViewState.section === 'consistency') {
      const muralMount = target.querySelector('#performanceConsistencyMuralMount');
      if (muralMount && consistencyMural) muralMount.append(consistencyMural);
      // Tempo de estudo e extrato de sessões são registro de execução: moram em Ritmo e aderência.
      if (studyDetails) target.append(studyDetails);
    }

    for (const fold of (target.querySelectorAll?.('#performanceSectionContent details') ??
      []) as any) {
      const remembered = foldMemory.get(foldKey(performanceViewState.section, fold));
      if (remembered !== undefined && fold.open !== remembered) fold.open = remembered;
    }

    doc
      .getElementById('panel-desempenho')
      ?.setAttribute?.('data-performance-view', performanceViewState.section);
    const win = doc.defaultView;
    if (win && /^#desempenho(\/|$)/.test(win.location.hash)) {
      // Âncora de bloco ("#desempenho/subjects/comparacao"): vale só na seção a que pertence.
      const anchored = /^#desempenho\/([a-z]+)\/([a-z0-9-]+)/.exec(win.location.hash);
      const block = anchored && anchored[1] === performanceViewState.section ? anchored[2] : '';
      const base =
        performanceViewState.section === 'overview'
          ? '#desempenho'
          : `#desempenho/${performanceViewState.section}`;
      const next = block
        ? `${base === '#desempenho' ? '#desempenho/overview' : base}/${block}`
        : base;
      if (win.location.hash !== next) win.history.replaceState(null, '', next);
      if (block) doc.getElementById(`bloco-${block}`)?.scrollIntoView?.({ block: 'start' });
    }
    const status = doc.getElementById('performanceStatus');
    const section = target
      .querySelector('.performance-section-button.active[data-performance-section]')
      ?.textContent?.trim();
    const statusText = section
      ? `Mostrando ${section}${examSection || performanceViewState.section === 'diagnosis' ? '' : ` · ${range.label}`}.`
      : '';
    if (status && status.textContent !== statusText) status.textContent = statusText;

    const dialog = target.querySelector('#performanceTopicDialog') as any;
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.addEventListener(
        'close',
        () => {
          performanceViewState = updatePerformanceViewState(performanceViewState, {
            topicId: null,
          });
        },
        { once: true }
      );
      dialog.showModal();
    }

    const shiftEnergyMount = doc.getElementById('shiftEnergyMount');
    if (shiftEnergyMount) {
      const shiftModel = buildShiftEnergyViewModel({
        sessions: state.studySessions || [],
      });
      const focus = (pageModel?.model as any)?.focusByShift;
      const periodFocus =
        performanceViewState.section === 'consistency' && focus?.shifts
          ? {
              label: range.label,
              byShift: Object.fromEntries(
                (['morning', 'afternoon', 'night'] as const).map(key => [
                  key,
                  {
                    rated: focus.shifts[key].focusRatedCount || 0,
                    percent: focus.shifts[key].focusRatedCount
                      ? focus.shifts[key].deepFocusPercent
                      : null,
                  },
                ])
              ),
            }
          : null;
      mountPreact(h(ShiftEnergyCard, { model: shiftModel, periodFocus }), shiftEnergyMount);
    }

    const careerBenchmarkMount =
      target.querySelector('#performanceCareerBenchmarkMount') ||
      doc.getElementById('performanceCareerBenchmarkMount');
    if (careerBenchmarkMount) {
      const detected = detectCareerCluster(state);
      const activeCareerId = selectedCareerClusterId || detected;
      const aggregates = aggregateRecentActivity(state.studySessions || [], state.questoes || [], {
        todayISO: today,
        daysWindow: 7,
      });
      const comparison = calculateCareerBenchmarkComparison(aggregates, activeCareerId);

      mountPreact(
        h(CareerBenchmarkCard, {
          comparison,
          selectedCareerId: activeCareerId,
          onSelectCareer: (newId: CareerClusterId) => {
            selectedCareerClusterId = newId;
            renderPerformance();
          },
        }),
        careerBenchmarkMount
      );
    }
  }

  function getViewState() {
    return performanceViewState;
  }

  function setViewState(next: any) {
    performanceViewState = next;
  }

  function registerController() {
    if (!doc) return;
    createPerformanceController({
      document: doc,
      getViewState,
      setViewState,
      render: () => {
        if (deps.render) deps.render('desempenho-visao');
        else renderPerformance();
      },
      activateTab: deps.activateTab || (() => {}),
      simulateScenario: (scenario: Record<string, any>) =>
        deps.projectionController ? deps.projectionController.simulate(scenario) : null,
      renderScenarioResult: (result: Record<string, any>) =>
        deps.renderProjectionScenarioResult
          ? deps.renderProjectionScenarioResult(result, { escapeHtml })
          : '',
      applyRecovery: (signature: string) =>
        deps.applyConfirmedRecoveryPlan ? deps.applyConfirmedRecoveryPlan(signature) : undefined,
    }).register();
  }

  return {
    recordProgressSnapshot,
    renderProgressChart,
    renderRadarDisciplinas,
    setRadarSubject,
    renderPerformance,
    performanceScopedPlans,
    getViewState,
    setViewState,
    registerController,
    performanceAnalyticsController,
  };
}
