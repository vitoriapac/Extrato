import { h } from 'preact';
import { decorateAdvancedReveals, revealAdvanced } from '../../essential-mode.js';
import { isCapacityInformed } from '../../../application/goals/capacity-informed.js';
import { StudyCycleCenterCard } from '../../components/StudyCycleCenterCard.js';
import type { CycleDraftState } from '../../components/TodayStudyAssistantBar.js';
import {
  applyStudyCycleVersion,
  buildStudyCyclePreview,
  computeDefaultCycleWeights,
  computeStudyCycleLapSummary,
  reorderStudyCycleBlocks,
  setStudyCycleStatus,
  type StudyCycleMode,
  type StudyCycleQueue,
} from '../../../domain/planning/study-cycle-engine.js';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { WeeklyAvailabilityGrid } from './WeeklyAvailabilityGrid.js';
import { PlanExecutionCard } from './PlanExecutionCard.js';
import { buildWeeklyAvailability as defaultBuildWeeklyAvailability } from '../../../application/goals/weekly-availability.js';
import { buildPlanExecution as defaultBuildPlanExecution } from '../../../application/goals/build-plan-execution.js';
import { renderPlanExecution as defaultRenderPlanExecutionView } from '../../renderers/plan-execution-renderer.js';
import { buildStudyDistribution as defaultBuildStudyDistribution } from '../../../application/goals/build-study-distribution.js';
import { renderStudyDistribution as defaultRenderStudyDistribution } from '../../renderers/study-distribution-renderer.js';
import { buildPlanImpactAlignment as defaultBuildPlanImpactAlignment } from '../../../application/goals/build-plan-impact-alignment.js';
import { renderPlanImpactAlignment as defaultRenderPlanImpactAlignment } from '../../renderers/plan-impact-alignment-renderer.js';
import { buildTopicExamProfile as defaultBuildTopicExamProfile } from '../../../application/exam-intelligence/build-topic-exam-profile.js';
import { resolveValidatedExamImpact as defaultResolveValidatedExamImpact } from '../../../domain/exam-intelligence/validated-impact.js';
import { buildResultGoalsViewModel as defaultBuildResultGoalsViewModel } from '../../../application/goals/build-result-goals-view-model.js';
import { renderGoals as defaultRenderGoals } from '../../renderers/goals-renderer.js';
import { initialGoalSuggestions as defaultInitialGoalSuggestions } from '../../../domain/goals/initial-goal-guidance.js';
import { buildPeriodComparisonViewModel as defaultBuildPeriodComparisonViewModel } from '../../../application/analytics/build-period-comparison-view-model.js';
import { renderPeriodComparisonDetail as defaultRenderPeriodComparisonDetail } from '../../renderers/period-comparison-detail-renderer.js';
import { countStudyDaysThisWeek } from '../../../application/performance/study-day-count.js';
import { renderIconSvg } from '../../primitives/icon.js';
import { renderRhythmBurnup } from '../../renderers/rhythm-burnup-renderer.js';
import { buildRhythmGoalWarning } from '../../../application/goals/rhythm-goal-warning.js';

const DEFAULT_WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface GoalsTabControllerContext {
  state?: any;
  getState?: () => any;
  document?: Document | any;
  parseLocalDate: (iso: string) => any;
  todayISO: () => string;
  buildWeeklyAvailability?: (hoursByDay: any) => any;
  formatPlanMinutes: (mins: number) => string;
  formatDecimal?: (val: number) => string;
  metaHoursToday: () => number;
  metaHoursForDate: (date: string) => number | string;
  addDays: (iso: string, days: number) => string;
  startOfWeek: (iso: string) => string;
  isSameWeek?: (dateStr: string, refDateStr?: string) => boolean;
  isSameMonth?: (dateStr: string, refDateStr?: string) => boolean;
  WEEKDAY_LABELS?: readonly string[];
  buildPlanExecution?: (opts: any) => any;
  buildStudyDistribution?: (opts: any) => any;
  buildPlanImpactAlignment?: (opts: any) => any;
  examScopedTopics?: () => any[];
  resolveValidatedExamImpact?: (profile: any) => { value: any };
  buildTopicExamProfile?: (opts: any) => any;
  renderPlanExecutionView?: (model: any, opts: any) => string;
  renderStudyDistribution?: (distribution: any, opts: any) => string;
  renderPlanImpactAlignment?: (alignment: any, opts: any) => string;
  formatDatePt?: (date: string) => string;
  escapeHtml?: (text: string) => string;
  escapeAttr?: (text: string) => string;
  entitySubjectId?: (item: any) => string | null;
  buildResultGoalsViewModel?: (opts: any) => any;
  renderGoals?: (model: any, opts: any) => string;
  initialGoalSuggestions?: (metas: any, hasActivity: boolean) => any;
  weeklyStrategyCapacity?: () => number;
  activeSubjects?: () => Array<any>;
  getSubjectName?: (id: string) => string;
  buildPeriodComparisonViewModel?: (opts: any) => any;
  renderPeriodComparisonDetail?: (model: any, opts: any) => string;
  localDateFromTimestamp?: (ts: string) => string;
  somarQuestoesDisciplinaNaSemana?: (subjectId: string | null) => number;
  contarTopicosConcluidosNoPeriodo?: (predicate: (d: string) => boolean) => number;
  somarQuestoesNaSemana?: () => number;
  contarSimuladosNaSemana?: () => number;
  recentPerformance?: () => any;
  addMetaDisciplina?: (subjectId: string, rawMeta: string) => void;
  computeRitmo?: () => any;
  scheduleSave?: () => void;
  persistAndRender?: () => void;
  showToast?: (msg: string) => void;
  nowISO?: () => string;
  activateTab?: (tab: string) => void;
  intelligenceCandidates?: () => any[];
  renderPlanoHoje?: () => void;
}

export function createGoalsTabController(ctx: GoalsTabControllerContext) {
  const resolveState = () => (ctx.getState ? ctx.getState() : ctx.state);
  const buildWeeklyAvailability = ctx.buildWeeklyAvailability || defaultBuildWeeklyAvailability;
  const WEEKDAY_LABELS = ctx.WEEKDAY_LABELS || DEFAULT_WEEKDAY_LABELS;
  const buildPlanExecution = ctx.buildPlanExecution || defaultBuildPlanExecution;
  const renderPlanExecutionView = ctx.renderPlanExecutionView || defaultRenderPlanExecutionView;
  const buildStudyDistribution = ctx.buildStudyDistribution || defaultBuildStudyDistribution;
  const renderStudyDistribution = ctx.renderStudyDistribution || defaultRenderStudyDistribution;
  const buildPlanImpactAlignment = ctx.buildPlanImpactAlignment || defaultBuildPlanImpactAlignment;
  const renderPlanImpactAlignment =
    ctx.renderPlanImpactAlignment || defaultRenderPlanImpactAlignment;
  const buildTopicExamProfile = ctx.buildTopicExamProfile || defaultBuildTopicExamProfile;
  const resolveValidatedExamImpact =
    ctx.resolveValidatedExamImpact || defaultResolveValidatedExamImpact;
  const buildResultGoalsViewModel =
    ctx.buildResultGoalsViewModel || defaultBuildResultGoalsViewModel;
  const renderGoals = ctx.renderGoals || defaultRenderGoals;
  const initialGoalSuggestions = ctx.initialGoalSuggestions || defaultInitialGoalSuggestions;
  const buildPeriodComparisonViewModel =
    ctx.buildPeriodComparisonViewModel || defaultBuildPeriodComparisonViewModel;
  const renderPeriodComparisonDetail =
    ctx.renderPeriodComparisonDetail || defaultRenderPeriodComparisonDetail;

  function createWeeklyAvailabilityVNode() {
    const state = resolveState();
    const today = ctx.todayISO();
    const todayDay = ctx.parseLocalDate(today).getDay();
    const availability = buildWeeklyAvailability(state.metas?.horasPorDia);

    const formattedTotal = ctx.formatPlanMinutes(availability.totalMinutes);
    const formattedAverage = ctx.formatPlanMinutes(Math.round(availability.averageHours * 60));
    const formattedToday = ctx.formatPlanMinutes(Math.round(ctx.metaHoursToday() * 60));

    const weekStart = ctx.startOfWeek(today);
    const days = WEEKDAY_LABELS.map((label, dayIndex) => {
      const dateForDay = ctx.addDays(weekStart, dayIndex === 0 ? 6 : dayIndex - 1);
      return {
        dayIndex,
        label,
        isToday: dayIndex === todayDay,
        hours: ctx.metaHoursForDate(dateForDay),
      };
    });

    return h(WeeklyAvailabilityGrid, {
      summary: availability,
      formattedTotal,
      formattedAverage,
      formattedToday,
      days,
      informed: isCapacityInformed(state),
    });
  }

  function renderWeeklyAvailabilityHtml(): string {
    return render(createWeeklyAvailabilityVNode());
  }

  function mountWeeklyAvailability(container: any): void {
    mountPreact(createWeeklyAvailabilityVNode(), container);
  }

  function createPlanExecutionVNode() {
    if (!buildPlanExecution || !renderPlanExecutionView) return null;

    const state = resolveState();
    const today = ctx.todayISO();
    const model = buildPlanExecution({
      today,
      dailyPlans: state.dailyPlans,
      sessions: (state.studySessions || []).map((item: any) => ({
        ...item,
        subjectId: ctx.entitySubjectId ? ctx.entitySubjectId(item) : item.subjectId,
      })),
      hoursByDay: state.metas?.horasPorDia,
      subjects: state.subjects,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
    });
    // Antes de a pessoa informar as horas, a capacidade é só o padrão do app e não deve aparecer como número.
    model.capacityInformed = isCapacityInformed(state);

    const distribution = buildStudyDistribution({
      today,
      dailyPlans: state.dailyPlans,
      sessions: (state.studySessions || []).map((item: any) => ({
        ...item,
        subjectId: ctx.entitySubjectId ? ctx.entitySubjectId(item) : item.subjectId,
      })),
      subjects: state.subjects,
    });

    const alignment =
      distribution && ctx.examScopedTopics
        ? buildPlanImpactAlignment({
            distribution,
            topics: ctx.examScopedTopics(),
            impactForTopic: (topic: any) =>
              resolveValidatedExamImpact(
                buildTopicExamProfile({
                  topic,
                  subjectConfig: (state.examBlueprint?.subjects || []).find(
                    (item: any) => item.subjectId === topic.subjectId
                  ),
                  activeExamTags: state.examBlueprint?.activeExamTags || [],
                  exams: state.exams,
                  examQuestions: state.examQuestions,
                })
              ).value,
          })
        : null;

    const executionViewHtml = renderPlanExecutionView(model, {
      formatDate: ctx.formatDatePt,
    });
    // Sem dados prontos não há o que abrir: o bloco some em vez de oferecer um disclosure vazio.
    const distributionHtml =
      distribution?.state === 'ready' && distribution.rows?.length
        ? renderStudyDistribution(distribution, {
            escapeHtml: ctx.escapeHtml,
            subjects: state.subjects,
          })
        : '';
    const alignmentHtml =
      alignment?.state === 'ready' && alignment.rows?.length
        ? renderPlanImpactAlignment(alignment, {
            escapeHtml: ctx.escapeHtml,
            subjects: state.subjects,
          })
        : '';

    return h(PlanExecutionCard, {
      executionViewHtml,
      distributionHtml,
      alignmentHtml,
    });
  }

  function renderPlanExecutionHtml(): string {
    const vnode = createPlanExecutionVNode();
    return vnode ? render(vnode) : '';
  }

  function mountPlanExecution(container: any): void {
    const vnode = createPlanExecutionVNode();
    if (vnode) {
      mountPreact(vnode, container);
      // Blocos avançados da Semana nascem depois da carga: o modo Essencial precisa do "Mostrar …".
      if (typeof container.querySelectorAll === 'function') decorateAdvancedReveals(container);
    } else {
      container.innerHTML = '';
    }
  }

  function renderMetas(
    container: any,
    achieved: {
      weeklyTopics: number;
      monthlyTopics: number;
      questions: number;
      simulations: number;
      accuracy: number | null;
      studyDays: number;
    }
  ): void {
    if (!buildResultGoalsViewModel || !renderGoals) return;

    const state = resolveState();
    const m = state.metas;
    const resultGoals = buildResultGoalsViewModel({
      goals: m,
      achieved,
    });

    const hasActivity =
      (state.studySessions || []).length > 0 ||
      (state.questoes || []).length > 0 ||
      (state.simulados || []).length > 0 ||
      achieved.weeklyTopics > 0 ||
      achieved.monthlyTopics > 0;

    const initialSuggestions = initialGoalSuggestions
      ? initialGoalSuggestions(m, hasActivity)
      : null;

    const weeklyCapacityMinutes = ctx.weeklyStrategyCapacity ? ctx.weeklyStrategyCapacity() : 0;

    container.innerHTML = renderGoals(resultGoals, {
      adherenceTarget: m?.aderenciaSemanal,
      escapeHtml: ctx.escapeHtml,
      initialSuggestions,
      weeklyCapacityMinutes,
    });
  }

  function renderMetasPorDisciplina(container: any, selectEl?: any): void {
    const state = resolveState();
    const escapeHtml = ctx.escapeHtml || (s => s);
    const escapeAttr = ctx.escapeAttr || (s => s);

    if (selectEl && ctx.activeSubjects) {
      const current = selectEl.value;
      selectEl.innerHTML =
        ctx
          .activeSubjects()
          .map(s => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`)
          .join('') || `<option value="">Nenhuma disciplina cadastrada</option>`;
      if (current) selectEl.value = current;
    }

    const metas = state.metasPorDisciplina || [];
    if (metas.length === 0) {
      container.innerHTML = `<div class="upcoming-empty">Nenhuma meta por disciplina ainda. Escolha uma disciplina acima e adicione.</div>`;
      return;
    }

    container.innerHTML = metas
      .map((md: any) => {
        const subjectId = ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId;
        const atingido = ctx.somarQuestoesDisciplinaNaSemana
          ? ctx.somarQuestoesDisciplinaNaSemana(subjectId)
          : 0;
        const pct = md.meta > 0 ? Math.round((atingido / md.meta) * 100) : 0;
        const pctDisplay = Math.min(pct, 100);
        const name =
          subjectId && ctx.getSubjectName ? ctx.getSubjectName(subjectId) : '(sem disciplina)';
        return `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">${escapeHtml(name)}</div>
        <div class="meta-formula">Questões resolvidas nesta semana</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${pct >= 100 ? 'over' : ''}" style="width:${pctDisplay}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>${atingido} / ${md.meta}</span>
          <span>${pct}% da meta</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="1" value="${md.meta}" data-delegated-blur="updateMetaDisciplina('${md.id}', this.value)">
        <button class="icon-btn" data-delegated-click="deleteMetaDisciplina('${md.id}')" title="Remover meta" aria-label="Remover meta de questões">${renderIconSvg('x', { size: 14 })}</button>
      </div>
    </div>`;
      })
      .join('');
  }

  function renderSelectedPeriodComparison(
    container?: any,
    presetEl?: any,
    startInput?: any,
    endInput?: any,
    startWrap?: any,
    endWrap?: any
  ): void {
    if (!buildPeriodComparisonViewModel || !renderPeriodComparisonDetail) return;

    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const resolvedContainer = container || doc?.getElementById('periodComparisonResults');
    const resolvedPreset = presetEl || doc?.getElementById('periodComparisonPreset');
    if (!resolvedContainer || !resolvedPreset) return;

    const resolvedStartInput =
      startInput !== undefined ? startInput : doc?.getElementById('periodComparisonStart');
    const resolvedEndInput =
      endInput !== undefined ? endInput : doc?.getElementById('periodComparisonEnd');
    const resolvedStartWrap =
      startWrap !== undefined ? startWrap : doc?.getElementById('periodComparisonStartWrap');
    const resolvedEndWrap =
      endWrap !== undefined ? endWrap : doc?.getElementById('periodComparisonEndWrap');

    const state = resolveState();
    const custom = resolvedPreset.value === 'custom';
    if (resolvedStartWrap) resolvedStartWrap.hidden = !custom;
    if (resolvedEndWrap) resolvedEndWrap.hidden = !custom;

    const start = resolvedStartInput?.value || null;
    const end = resolvedEndInput?.value || null;

    if (custom && (!start || !end || start > end)) {
      resolvedContainer.innerHTML =
        '<p class="diagnosis-empty">Escolha um intervalo válido para comparar os períodos.</p>';
      return;
    }

    const reviews = (state.reviewAgenda || []).map((item: any) => ({
      ...item,
      date:
        item.completedAt && ctx.localDateFromTimestamp
          ? ctx.localDateFromTimestamp(item.completedAt)
          : item.date,
    }));

    const model = buildPeriodComparisonViewModel({
      sessions: state.studySessions || [],
      questions: state.questoes || [],
      reviews,
      today: ctx.todayISO(),
      preset: resolvedPreset.value,
      start,
      end,
    });

    resolvedContainer.innerHTML = renderPeriodComparisonDetail(model, {
      escapeHtml: ctx.escapeHtml,
    });
  }

  function renderMetasSection(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const container = doc?.getElementById('metasContainer');
    if (
      container &&
      ctx.contarTopicosConcluidosNoPeriodo &&
      ctx.isSameWeek &&
      ctx.isSameMonth &&
      ctx.somarQuestoesNaSemana &&
      ctx.contarSimuladosNaSemana &&
      ctx.recentPerformance
    ) {
      const state = resolveState();
      const hasAccuracyEvidence =
        (state.questoes || []).some((item: any) => Number(item.resolved) > 0) ||
        (state.simulados || []).some((item: any) => Number(item.total) > 0);
      renderMetas(container, {
        weeklyTopics: ctx.contarTopicosConcluidosNoPeriodo(ctx.isSameWeek),
        monthlyTopics: ctx.contarTopicosConcluidosNoPeriodo(ctx.isSameMonth),
        questions: ctx.somarQuestoesNaSemana(),
        simulations: ctx.contarSimuladosNaSemana(),
        accuracy: hasAccuracyEvidence ? ctx.recentPerformance().current!.accuracy : null,
        studyDays: countStudyDaysThisWeek(state.studySessions, ctx.todayISO()),
      });
      // As metas nascem depois da carga: o modo Essencial precisa do "Mostrar …" de cada uma.
      if (typeof container.querySelectorAll === 'function') decorateAdvancedReveals(container);
    }
    renderSelectedPeriodComparison();
  }

  let lastCycleDraftSignature = '';
  const cycleDraftState: CycleDraftState = {
    mode: 'adaptive',
    blockDurationMinutes: 60,
    preview: null,
  };

  function syncCycleDraftFromState(force = false): void {
    const state = resolveState() || {};
    const activeSubs = (state.subjects || []).filter((s: any) => s && !s.archived);
    if (!lastCycleDraftSignature && state.studyCycle) {
      cycleDraftState.mode = state.studyCycle.mode || 'adaptive';
      const firstDuration = Number(state.studyCycle.blocks?.[0]?.durationMinutes);
      if (Number.isFinite(firstDuration) && firstDuration >= 15 && firstDuration <= 120) {
        cycleDraftState.blockDurationMinutes = Math.round(firstDuration);
      }
    }
    const sig = `${cycleDraftState.mode}|${cycleDraftState.blockDurationMinutes}|${activeSubs.map((s: any) => s.id).join(',')}`;
    if (!force && cycleDraftState.preview && lastCycleDraftSignature === sig) return;
    lastCycleDraftSignature = sig;
    const candidates = ctx.intelligenceCandidates ? ctx.intelligenceCandidates() : [];
    const customBlocks =
      cycleDraftState.mode === 'manual' && state.studyCycle?.blocks?.length
        ? state.studyCycle.blocks
        : activeSubs.map((s: any, idx: number) => ({
            id: `block-${s.id}-${idx + 1}`,
            subjectId: s.id,
            subjectName: s.name,
            durationMinutes: cycleDraftState.blockDurationMinutes,
            order: idx + 1,
          }));
    cycleDraftState.preview = buildStudyCyclePreview({
      id: state.studyCycle?.id || 'default-cycle',
      name: state.studyCycle?.name || 'Ciclo de Estudos Principal',
      examId: state.examBlueprint?.activeExamTags?.[0] || null,
      mode: cycleDraftState.mode,
      subjects: activeSubs,
      subjectWeights: computeDefaultCycleWeights(state?.examBlueprint?.subjects, candidates),
      blockDurationMinutes: cycleDraftState.blockDurationMinutes,
      customBlocks,
      activeSubjectIds: activeSubs.map((s: any) => s.id),
      nowISO: ctx.nowISO ? ctx.nowISO() : new Date().toISOString(),
    });
  }

  function renderStudyCycleCenterSection(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    if (!doc || typeof globalThis.document === 'undefined') return;
    const subSemana = doc.getElementById('metasSub-semana') as HTMLElement | null;
    if (!subSemana || subSemana.ownerDocument !== globalThis.document) return;

    const replanSection =
      (doc.getElementById('weeklyReplan')?.closest?.('section') as HTMLElement | null) || null;
    let mount = doc.getElementById('metasCycleCenterMount') as HTMLElement | null;
    if (!mount) {
      const created = doc.createElement('div') as HTMLElement;
      created.id = 'metasCycleCenterMount';
      created.dataset.advanced = 'Central do Ciclo de Estudos';
      if (replanSection && replanSection.parentNode === subSemana) {
        subSemana.insertBefore(created, replanSection.nextSibling);
      } else {
        subSemana.appendChild(created);
      }
      mount = created;
    }
    if (!mount || mount.ownerDocument !== globalThis.document) return;

    const state = resolveState() || {};
    const activeSubs = (state.subjects || []).filter((s: any) => s && !s.archived);
    if (activeSubs.length === 0) {
      mount.hidden = true;
      const before = mount.previousElementSibling as HTMLElement | null;
      if (before?.classList?.contains('advanced-reveal')) before.hidden = true;
      return;
    }

    mount.hidden = false;
    decorateAdvancedReveals(subSemana);
    const before = mount.previousElementSibling as HTMLElement | null;
    if (before?.classList?.contains('advanced-reveal')) {
      before.hidden = mount.classList.contains('is-advanced-open');
    }

    syncCycleDraftFromState();
    const cycle = (state.studyCycle || null) as StudyCycleQueue | null;
    const executionMode = state.executionMode === 'sequence' ? 'sequence' : 'agenda';

    mountPreact(
      h(StudyCycleCenterCard, {
        executionMode,
        cycle,
        cycleLap: computeStudyCycleLapSummary(cycle),
        cycleDraft: cycleDraftState,
        onSetExecutionMode: mode => {
          state.executionMode = mode === 'sequence' ? 'sequence' : 'agenda';
          ctx.scheduleSave?.();
          renderStudyCycleCenterSection();
          ctx.renderPlanoHoje?.();
        },
        onToggleCyclePause: () => {
          if (!state.studyCycle) return;
          const now = ctx.nowISO ? ctx.nowISO() : new Date().toISOString();
          state.studyCycle = setStudyCycleStatus(
            state.studyCycle,
            state.studyCycle.status === 'paused' ? 'active' : 'paused',
            now
          );
          ctx.scheduleSave?.();
          renderStudyCycleCenterSection();
          ctx.renderPlanoHoje?.();
        },
        onChangeCycleDraftConfig: (mode: StudyCycleMode, duration: number) => {
          cycleDraftState.mode = mode;
          cycleDraftState.blockDurationMinutes = duration;
          syncCycleDraftFromState(true);
          renderStudyCycleCenterSection();
        },
        onMoveCycleDraftBlock: (fromIdx: number, toIdx: number) => {
          if (!cycleDraftState.preview?.cycle) return;
          const now = ctx.nowISO ? ctx.nowISO() : new Date().toISOString();
          cycleDraftState.preview = {
            ...cycleDraftState.preview,
            cycle: reorderStudyCycleBlocks(cycleDraftState.preview.cycle, fromIdx, toIdx, now),
          };
          renderStudyCycleCenterSection();
        },
        onConfirmCycleDraft: () => {
          if (!cycleDraftState.preview?.valid) return;
          const now = ctx.nowISO ? ctx.nowISO() : new Date().toISOString();
          state.studyCycle = applyStudyCycleVersion(
            state.studyCycle,
            cycleDraftState.preview.cycle,
            now
          );
          state.executionMode = 'sequence';
          ctx.scheduleSave?.();
          ctx.showToast?.('Nova versão do ciclo confirmada sem reescrever o histórico.');
          renderStudyCycleCenterSection();
          ctx.renderPlanoHoje?.();
        },
        onGoToTodayCycle: () => {
          ctx.activateTab?.('hoje');
          (doc.getElementById('todayTab-hoje') as HTMLElement | null)?.click?.();
        },
      }),
      mount
    );
  }

  function openPlanningCycle(): void {
    ctx.activateTab?.('metas');
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    (doc?.getElementById('metasTab-semana') as HTMLElement | null)?.click?.();
    renderStudyCycleCenterSection();
    const mount = doc?.getElementById('metasCycleCenterMount') as HTMLElement | null;
    if (mount && !mount.hidden) {
      revealAdvanced(mount);
      mount.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderPlanExecutionSection(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const container = doc?.getElementById('planExecutionResults');
    if (container) mountPlanExecution(container);
    renderStudyCycleCenterSection();
  }

  function renderWeeklyHoursGoalsSection(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const container = doc?.getElementById('weeklyHoursGoals');
    if (container) mountWeeklyAvailability(container);
    placeCapacityBlock();
  }

  let capacityPlaced = false;

  /** Sem capacidade informada, a disponibilidade fica fora da dobra, logo abaixo do plano; depois volta para "Ajustar". */
  function placeCapacityBlock(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const block = doc?.getElementById('metasCapacity');
    const plan = doc?.getElementById('metasPlanning');
    const fold = doc?.getElementById('metasAdjust');
    if (!block || !plan || !fold || block.parentElement == null || plan.parentElement == null)
      return;
    // Só na primeira renderização: ao digitar a primeira hora o bloco não pode sumir para dentro da dobra.
    if (capacityPlaced) return;
    capacityPlaced = true;
    if (!isCapacityInformed(resolveState())) {
      if (plan.nextElementSibling !== block) plan.after(block);
    } else if (block.parentElement !== fold) {
      fold.append(block);
    }
  }

  function renderMetasPorDisciplinaSection(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const container = doc?.getElementById('metasPorDisciplinaContainer');
    if (!container) return;
    const sel = doc?.getElementById('novaMetaDisciplinaSelect');
    renderMetasPorDisciplina(container, sel);
  }

  function bindEvents(): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    if (!doc) return;
    doc
      .getElementById('periodComparisonPreset')
      ?.addEventListener('change', () => renderSelectedPeriodComparison());
    doc
      .getElementById('periodComparisonStart')
      ?.addEventListener('change', () => renderSelectedPeriodComparison());
    doc
      .getElementById('periodComparisonEnd')
      ?.addEventListener('change', () => renderSelectedPeriodComparison());
    const submitMetaDisciplina = () => {
      const subjectId =
        (doc.getElementById('novaMetaDisciplinaSelect') as HTMLSelectElement)?.value || '';
      const rawMeta =
        (doc.getElementById('novaMetaDisciplinaValor') as HTMLInputElement)?.value || '';
      ctx.addMetaDisciplina?.(subjectId, rawMeta);
    };
    const metaForm = doc.getElementById('metaDisciplinaForm');
    if (metaForm) {
      metaForm.addEventListener('submit', (event: Event) => {
        event.preventDefault();
        submitMetaDisciplina();
      });
    } else {
      doc.getElementById('addMetaDisciplinaBtn')?.addEventListener('click', submitMetaDisciplina);
    }
  }

  function renderRitmo(containerEl?: any): void {
    const doc = ctx.document || (typeof document !== 'undefined' ? document : null);
    const container = containerEl || doc?.getElementById('ritmoContainer');
    if (!container || !ctx.computeRitmo) return;

    const r = ctx.computeRitmo();
    const formatDecimal = ctx.formatDecimal || ((v: number) => String(v));
    const formatDatePt = ctx.formatDatePt || ((d: string) => d);

    if (r.status === 'sem-topicos') {
      container.innerHTML = `<div class="upcoming-empty">Adicione disciplinas e tópicos para ver a estimativa de ritmo aqui.</div>`;
      return;
    }
    if (r.status === 'completo') {
      container.innerHTML = `<div class="pace-block"><div class="pace-status ok">Todos os tópicos cadastrados foram concluídos.</div></div>`;
      return;
    }
    if (r.status === 'sem-dados') {
      container.innerHTML = `<div class="pace-block">
      <div class="pace-line">${r.remaining === 1 ? 'Falta' : 'Faltam'} <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? '' : 's'} para concluir o plano.</div>
      <div class="pace-status neutral">Ainda sem tópicos concluídos nos últimos 14 dias — sem dados suficientes para estimar o ritmo.</div>
      ${renderRhythmBurnup({ ...r, ratePerDay: 0 })}
    </div>`;
      return;
    }

    const ritmoTxt =
      r.ratePerDay! >= 1
        ? `${formatDecimal(r.ratePerDay!)} tópicos por dia`
        : `${formatDecimal(r.ratePerDay! * 7)} tópicos por semana`;

    let statusHtml = '';
    if (r.comparativo === 'no-prazo') {
      const folga = r.daysToExam! - r.daysNeeded!;
      statusHtml = `<div class="pace-status ok">${renderIconSvg('circle-check', { size: 14, className: 'inline-block align-middle mr-1' })}No ritmo atual, você termina com ${folga} dia${folga === 1 ? '' : 's'} de folga antes da prova.</div>`;
    } else if (r.comparativo === 'atrasado') {
      const atraso = r.daysNeeded! - r.daysToExam!;
      statusHtml = `<div class="pace-status warn">${renderIconSvg('alert-triangle', { size: 14, className: 'inline-block align-middle mr-1' })}No ritmo atual, você terminaria ${atraso} dia${atraso === 1 ? '' : 's'} depois da prova. Considere acelerar ou rever o plano.</div>`;
    } else {
      statusHtml = `<div class="pace-status neutral">Defina a data da prova na Visão geral para comparar com o prazo.</div>`;
    }

    const warning = buildRhythmGoalWarning({
      goal: resolveState().metas?.semanal,
      remaining: r.remaining,
      daysToExam: r.daysToExam,
      comparativo: r.comparativo,
    });
    const nextStep = warning
      ? `<div class="pace-next" role="note"><p>${
          warning.kind === 'goal-below'
            ? `Sua meta é de <strong>${formatDecimal(warning.goal!)}</strong> tópicos por semana; para chegar à prova são necessários <strong>${formatDecimal(warning.needed!)}</strong>.`
            : 'No ritmo atual você termina depois da prova. Aumente a meta de tópicos ou veja o efeito de estudar mais.'
        }</p><div class="pace-next__actions"><button class="btn tertiary" type="button" data-delegated-click="openGoalsAdjust()">Ajustar meta</button><button class="btn tertiary" type="button" data-delegated-click="openWhatIfSimulator()">Simular &quot;E se?&quot;</button></div></div>`
      : '';

    container.innerHTML = `
    <div class="pace-block">
      <div class="pace-line">Nos últimos 14 dias você concluiu em média <strong>${ritmoTxt}</strong>.</div>
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? '' : 's'} — no ritmo atual, você termina em <strong>${r.daysNeeded} dia${r.daysNeeded === 1 ? '' : 's'}</strong> (${formatDatePt(r.finishDate!)}).</div>
      ${statusHtml}
      ${nextStep}
      ${renderRhythmBurnup(r)}
    </div>
  `;
  }

  return {
    renderWeeklyAvailabilityHtml,
    mountWeeklyAvailability,
    renderPlanExecutionHtml,
    mountPlanExecution,
    renderMetas,
    renderMetasPorDisciplina,
    renderSelectedPeriodComparison,
    renderMetasSection,
    renderPlanExecutionSection,
    openPlanningCycle,
    renderWeeklyHoursGoalsSection,
    renderMetasPorDisciplinaSection,
    renderRitmo,
    bindEvents,
  };
}
