import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { WeeklyAvailabilityGrid } from './WeeklyAvailabilityGrid.js';
import { PlanExecutionCard } from './PlanExecutionCard.js';

export interface GoalsTabControllerContext {
  state: any;
  parseLocalDate: (iso: string) => any;
  todayISO: () => string;
  buildWeeklyAvailability: (hoursByDay: any) => any;
  formatPlanMinutes: (mins: number) => string;
  metaHoursToday: () => number;
  metaHoursForDate: (date: string) => number | string;
  addDays: (iso: string, days: number) => string;
  startOfWeek: (iso: string) => string;
  WEEKDAY_LABELS: readonly string[];
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
}

export function createGoalsTabController(ctx: GoalsTabControllerContext) {
  function createWeeklyAvailabilityVNode() {
    const today = ctx.todayISO();
    const todayDay = ctx.parseLocalDate(today).getDay();
    const availability = ctx.buildWeeklyAvailability(ctx.state.metas?.horasPorDia);

    const formattedTotal = ctx.formatPlanMinutes(availability.totalMinutes);
    const formattedAverage = ctx.formatPlanMinutes(Math.round(availability.averageHours * 60));
    const formattedToday = ctx.formatPlanMinutes(Math.round(ctx.metaHoursToday() * 60));

    const weekStart = ctx.startOfWeek(today);
    const days = ctx.WEEKDAY_LABELS.map((label, dayIndex) => {
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
    });
  }

  function renderWeeklyAvailabilityHtml(): string {
    return render(createWeeklyAvailabilityVNode());
  }

  function mountWeeklyAvailability(container: any): void {
    mountPreact(createWeeklyAvailabilityVNode(), container);
  }

  function createPlanExecutionVNode() {
    if (!ctx.buildPlanExecution || !ctx.renderPlanExecutionView) return null;

    const today = ctx.todayISO();
    const model = ctx.buildPlanExecution({
      today,
      dailyPlans: ctx.state.dailyPlans,
      sessions: (ctx.state.studySessions || []).map((item: any) => ({
        ...item,
        subjectId: ctx.entitySubjectId ? ctx.entitySubjectId(item) : item.subjectId,
      })),
      hoursByDay: ctx.state.metas?.horasPorDia,
      subjects: ctx.state.subjects,
      activeExamTags: ctx.state.examBlueprint?.activeExamTags || [],
    });

    const distribution = ctx.buildStudyDistribution
      ? ctx.buildStudyDistribution({
          today,
          dailyPlans: ctx.state.dailyPlans,
          sessions: (ctx.state.studySessions || []).map((item: any) => ({
            ...item,
            subjectId: ctx.entitySubjectId ? ctx.entitySubjectId(item) : item.subjectId,
          })),
          subjects: ctx.state.subjects,
        })
      : null;

    const alignment =
      ctx.buildPlanImpactAlignment && distribution && ctx.examScopedTopics
        ? ctx.buildPlanImpactAlignment({
            distribution,
            topics: ctx.examScopedTopics(),
            impactForTopic: (topic: any) =>
              ctx.resolveValidatedExamImpact && ctx.buildTopicExamProfile
                ? ctx.resolveValidatedExamImpact(
                    ctx.buildTopicExamProfile({
                      topic,
                      subjectConfig: (ctx.state.examBlueprint?.subjects || []).find(
                        (item: any) => item.subjectId === topic.subjectId
                      ),
                      activeExamTags: ctx.state.examBlueprint?.activeExamTags || [],
                      exams: ctx.state.exams,
                      examQuestions: ctx.state.examQuestions,
                    })
                  ).value
                : 1,
          })
        : null;

    const executionViewHtml = ctx.renderPlanExecutionView(model, {
      formatDate: ctx.formatDatePt,
    });
    const distributionHtml =
      distribution && ctx.renderStudyDistribution
        ? ctx.renderStudyDistribution(distribution, { escapeHtml: ctx.escapeHtml })
        : '';
    const alignmentHtml =
      alignment && ctx.renderPlanImpactAlignment
        ? ctx.renderPlanImpactAlignment(alignment, { escapeHtml: ctx.escapeHtml })
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
    if (!ctx.buildResultGoalsViewModel || !ctx.renderGoals) return;

    const m = ctx.state.metas;
    const resultGoals = ctx.buildResultGoalsViewModel({
      goals: m,
      achieved,
    });

    const hasActivity =
      (ctx.state.studySessions || []).length > 0 ||
      (ctx.state.questoes || []).length > 0 ||
      (ctx.state.simulados || []).length > 0 ||
      achieved.weeklyTopics > 0 ||
      achieved.monthlyTopics > 0;

    const initialSuggestions = ctx.initialGoalSuggestions
      ? ctx.initialGoalSuggestions(m, hasActivity)
      : null;

    const weeklyCapacityMinutes = ctx.weeklyStrategyCapacity ? ctx.weeklyStrategyCapacity() : 0;

    container.innerHTML = ctx.renderGoals(resultGoals, {
      adherenceTarget: m?.aderenciaSemanal,
      escapeHtml: ctx.escapeHtml,
      initialSuggestions,
      weeklyCapacityMinutes,
    });
  }

  function renderMetasPorDisciplina(
    container: any,
    selectEl?: any
  ): void {
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

    const metas = ctx.state.metasPorDisciplina || [];
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
        const name = subjectId && ctx.getSubjectName ? ctx.getSubjectName(subjectId) : '(sem disciplina)';
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
        <button class="icon-btn" data-delegated-click="deleteMetaDisciplina('${md.id}')" title="Remover meta" aria-label="Remover meta de questões">✕</button>
      </div>
    </div>`;
      })
      .join('');
  }

  function renderHistoricoMetas(container: any, weeks: any[]): void {
    const formatDate = ctx.formatDatePt || (d => d);
    const badge = (ok: boolean, current: any) =>
      current
        ? `<span class="wk-current">em andamento</span>`
        : ok
          ? `<span class="wk-ok">✓ cumprida</span>`
          : `<span class="wk-fail">✗ não cumprida</span>`;

    container.innerHTML = `
    <div class="weekly-history-table-wrap">
    <table class="weekly-history-table">
      <thead>
        <tr>
          <th>Semana</th>
          <th>Tópicos</th>
          <th>Questões</th>
          <th>Simulados</th>
        </tr>
      </thead>
      <tbody>
        ${weeks
          .map(
            w => `
          <tr>
            <td>${formatDate(w.weekStart)} – ${formatDate(w.weekEnd)}</td>
            <td>${w.topicsConcl}/${ctx.state.metas?.semanal ?? 0} ${badge(w.semanalOk, w.current)}</td>
            <td>${w.questoesResolved}/${ctx.state.metas?.questoesSemanal ?? 0} ${badge(w.questoesOk, w.current)}</td>
            <td>${w.simuladosCount}/${ctx.state.metas?.simuladosSemanal ?? 0} ${badge(w.simuladosOk, w.current)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    </div>
  `;
  }

  function renderSelectedPeriodComparison(
    container: any,
    presetEl: any,
    startInput?: any,
    endInput?: any,
    startWrap?: any,
    endWrap?: any
  ): void {
    if (!ctx.buildPeriodComparisonViewModel || !ctx.renderPeriodComparisonDetail) return;

    const custom = presetEl.value === 'custom';
    if (startWrap) startWrap.hidden = !custom;
    if (endWrap) endWrap.hidden = !custom;

    const start = startInput?.value || null;
    const end = endInput?.value || null;

    if (custom && (!start || !end || start > end)) {
      container.innerHTML =
        '<p class="diagnosis-empty">Escolha um intervalo válido para comparar os períodos.</p>';
      return;
    }

    const reviews = (ctx.state.reviewAgenda || []).map((item: any) => ({
      ...item,
      date: item.completedAt && ctx.localDateFromTimestamp
        ? ctx.localDateFromTimestamp(item.completedAt)
        : item.date,
    }));

    const model = ctx.buildPeriodComparisonViewModel({
      sessions: ctx.state.studySessions || [],
      questions: ctx.state.questoes || [],
      reviews,
      today: ctx.todayISO(),
      preset: presetEl.value,
      start,
      end,
    });

    container.innerHTML = ctx.renderPeriodComparisonDetail(model, {
      escapeHtml: ctx.escapeHtml,
    });
  }

  return {
    renderWeeklyAvailabilityHtml,
    mountWeeklyAvailability,
    renderPlanExecutionHtml,
    mountPlanExecution,
    renderMetas,
    renderMetasPorDisciplina,
    renderHistoricoMetas,
    renderSelectedPeriodComparison,
  };
}
