export interface DiagnosticsTabControllerOptions {
  document: any;
  getState: () => any;
  scheduleSave: () => void;
  todayISO: () => string;
  addDays: (iso: string, days: number) => string;
  startOfWeek: (iso: string) => string;
  formatPlanMinutes: (mins: number) => string;
  escapeHtml: (s: string) => string;
  escapeAttr: (s: string) => string;
  pluralize: (count: number, singular: string, plural?: string) => string;
  diasParaRevisao: (dateStr: string) => number | null;
  computeAlertasInteligentes: () => Array<any>;
  computeApprovalMetrics: () => any;
  readinessResult: (metrics: any) => any;
  computeRitmo: () => any;
  computeStudyPriorities: () => Array<any>;
  motivoPrioridade: (priority: any) => string;
  examScopedTopics: () => Array<any>;
  examScopedSubjects: () => Array<any>;
  uniqueTopicsCompletedBetween: (start: string, end: string) => number;
  buildExecutiveSummary: (opts: any) => any;
  renderExecutiveSummaryView: (opts: any) => string;
  reconcileAlerts: (alerts: any[], states: any, today: string) => any;
  renderIntelligentAlerts: (opts: any) => { list: string; overview: string };
  dismissAlert: (states: any, id: string, today: string, addDays: any, days: number) => any;
  refreshStudyRecommendationItems: () => { candidates: any[] };
  examEvidenceContext: () => any;
  getStudyPlanPreview: () => any;
  currentAchievementProjection: (target?: any, date?: any, candidates?: any) => { model: any };
  buildDiagnosisPageModel: (opts: any) => any;
  renderDiagnosisCenterView: (opts: any) => string;
  renderRecoveryReviewDebt: (opts: any, viewOpts: any) => string;
  analyzeFocusAndEnergy: (sessions: any[]) => any;
  analysisContextBanner: (context: string) => string;
  renderNextBestAction: (action: any, opts: any) => string;
  getDailyPriority: (action: any) => any;
  renderPreparationSignals: (signals: any) => string;
  buildDecisionCoherenceReport: (opts: any) => any;
  renderDecisionCoherenceDebug: (report: any, opts: any) => string;
  buildStudyAction: (recommendation: any, opts: any) => any;
  recommendationActionLabel: (action: any) => string;
  getCurrentStudyRecommendations: () => any[];
  setCurrentConsolidatedDiagnosis: (diag: any) => void;
  latestStudyPlan: () => any;
  weeklyStrategyCapacity: () => number;
  locationSearch?: () => string;
}

export function createDiagnosticsTabController(opts: DiagnosticsTabControllerOptions) {
  function renderAlertasInteligentes(): void {
    const container = opts.document.getElementById('alertasInteligentesList');
    const overview = opts.document.getElementById('overviewAttention');
    if (!container && !overview) return;

    const state = opts.getState();
    const reconciliation = opts.reconcileAlerts(
      opts.computeAlertasInteligentes(),
      state.alertStates,
      opts.todayISO()
    );

    if (JSON.stringify(reconciliation.states) !== JSON.stringify(state.alertStates)) {
      state.alertStates = reconciliation.states;
      opts.scheduleSave();
    }

    const alertas = reconciliation.visible;
    const recommendations = opts.getCurrentStudyRecommendations();
    const presentation = opts.renderIntelligentAlerts({
      alerts: alertas,
      additional: reconciliation.additional,
      currentAction: recommendations[0],
      escapeHtml: opts.escapeHtml,
      escapeAttr: opts.escapeAttr,
    });

    if (container) container.innerHTML = presentation.list;
    if (overview) overview.innerHTML = presentation.overview;
  }

  function dismissIntelligentAlert(id: string): void {
    const state = opts.getState();
    state.alertStates = opts.dismissAlert(state.alertStates, id, opts.todayISO(), opts.addDays, 7);
    opts.scheduleSave();
    renderAlertasInteligentes();
  }

  function renderExecutiveSummary(): void {
    const container = opts.document.getElementById('executiveSummary');
    if (!container) return;

    const state = opts.getState();
    const metrics = opts.computeApprovalMetrics();
    const readiness = opts.readinessResult(metrics);
    const pace = opts.computeRitmo();
    const priorities = opts.computeStudyPriorities();
    const topPriority = priorities[0]
      ? { ...priorities[0], reason: opts.motivoPrioridade(priorities[0]) }
      : null;
    const risks = opts.computeAlertasInteligentes();
    const configuredTopics = opts.examScopedTopics().filter(
      topic =>
        (topic.examImportance !== null || Object.keys(topic.examImportanceEstimates || {}).length) &&
        topic.estimatedStudyMinutes !== null
    );
    const opportunityCount = configuredTopics.filter(topic =>
      priorities.some(priority => priority.topicId === topic.id)
    ).length;

    const weekStart = opts.startOfWeek(opts.todayISO());
    const weeklyGoal = {
      achieved: opts.uniqueTopicsCompletedBetween(weekStart, opts.addDays(weekStart, 6)),
      target: state.metas?.semanal ?? 0,
    };

    const summary = opts.buildExecutiveSummary({
      readiness,
      daysToExam: state.examDate ? (opts.diasParaRevisao(state.examDate) ?? null) : null,
      pace,
      topPriority,
      riskCount: risks.length,
      weeklyGoal,
      opportunityCount,
    });

    container.innerHTML = opts.renderExecutiveSummaryView({
      summary,
      formatMinutes: opts.formatPlanMinutes,
      escapeHtml: opts.escapeHtml,
    });
  }

  function renderDiagnosisCenter(): void {
    const container = opts.document.getElementById('diagnosisCenter');
    if (!container) return;

    const state = opts.getState();
    const { candidates } = opts.refreshStudyRecommendationItems();
    const scoped = opts.examEvidenceContext();
    const studyPlanPreview = opts.getStudyPlanPreview();

    const opportunityCosts =
      studyPlanPreview?.adaptiveAdvice?.state === 'proposal' &&
      !studyPlanPreview.adaptiveAdvice.applied
        ? [studyPlanPreview.adaptiveAdvice]
        : [];

    const projection = opts.currentAchievementProjection(undefined, undefined, candidates).model;
    const currentStudyRecommendations = opts.getCurrentStudyRecommendations();

    const { diagnosis, consolidated, preparationSignals, nextAction, debt } =
      opts.buildDiagnosisPageModel({
        candidates,
        subjects: opts.examScopedSubjects(),
        scope: scoped,
        blueprint: state.examBlueprint,
        globalTarget: state.metas?.metaAprovacao,
        today: opts.todayISO(),
        activeExamTags: state.examBlueprint?.activeExamTags || [],
        recommendations: currentStudyRecommendations,
        opportunityCosts,
        activePlan: opts.latestStudyPlan(),
        weeklyCapacityMinutes: opts.weeklyStrategyCapacity(),
        hoursByDay: state.metas?.horasPorDia || {},
        projection,
      });

    opts.setCurrentConsolidatedDiagnosis(consolidated);

    const diagnosisHtml = opts.renderDiagnosisCenterView({
      model: diagnosis,
      studyActionForItem: (item: Record<string, any>) => {
        const recommendation = currentStudyRecommendations.find(
          candidate => candidate.subjectId === item.subjectId && candidate.topicId === item.topicId
        );
        const action = opts.buildStudyAction(recommendation, { source: 'diagnosis' });
        return action ? { ...action, label: opts.recommendationActionLabel(action) } : null;
      },
      escapeHtml: opts.escapeHtml,
      escapeAttr: opts.escapeAttr,
    });

    const secondaryHtml = opts.renderRecoveryReviewDebt(
      { recoveries: preparationSignals.rows.filter((item: any) => item.type === 'recovery'), debt },
      { escapeHtml: opts.escapeHtml }
    );

    const energyAnalysis = opts.analyzeFocusAndEnergy(state.studySessions || []);
    let energyAlertHtml = '';
    if (energyAnalysis.fatigueAlert) {
      energyAlertHtml = `<div class="banner banner--warning" style="margin-top: 1rem; border-left: 4px solid #f59e0b; padding: 0.75rem 1rem; background: var(--bg-surface-elevated, #fff); border-radius: 6px;">
        <strong>⚠️ Alerta Cronobiológico:</strong> ${opts.escapeHtml(energyAnalysis.fatigueAlert)}
      </div>`;
    }

    container.innerHTML =
      opts.analysisContextBanner('hoje') +
      opts.renderNextBestAction(nextAction, {
        escapeHtml: opts.escapeHtml,
        escapeAttr: opts.escapeAttr,
        dailyPriority: opts.getDailyPriority(nextAction),
      }) +
      energyAlertHtml +
      diagnosisHtml +
      `<details class="diagnosis-secondary"><summary>Recuperação e revisões · ${opts.pluralize(debt.count, 'vencida')}</summary>${secondaryHtml}</details>`;

    container.innerHTML += `<details class="diagnosis-method-details"><summary>Examinar sinais de preparação e critérios</summary>${opts.renderPreparationSignals(preparationSignals)}</details>`;

    const search = opts.locationSearch ? opts.locationSearch() : '';
    if (search.includes('debug=decisions')) {
      container.innerHTML += opts.renderDecisionCoherenceDebug(
        opts.buildDecisionCoherenceReport({
          trajectory: projection,
          nextBestAction: nextAction,
          examIntelligence: candidates,
          adaptivePlan: opts.latestStudyPlan(),
        }),
        { escapeHtml: opts.escapeHtml }
      );
    }
  }

  return {
    renderAlertasInteligentes,
    dismissIntelligentAlert,
    renderExecutiveSummary,
    renderDiagnosisCenter,
  };
}
