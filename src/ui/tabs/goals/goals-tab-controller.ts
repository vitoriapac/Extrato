import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { WeeklyAvailabilityGrid } from './WeeklyAvailabilityGrid.js';
import { PlanExecutionCard } from './PlanExecutionCard.js';

export interface GoalsTabControllerContext {
  state?: any;
  getState?: () => any;
  document?: Document | any;
  parseLocalDate: (iso: string) => any;
  todayISO: () => string;
  buildWeeklyAvailability: (hoursByDay: any) => any;
  formatPlanMinutes: (mins: number) => string;
  formatDecimal?: (val: number) => string;
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
  computeRitmo?: () => any;
}

export function createGoalsTabController(ctx: GoalsTabControllerContext) {
  const resolveState = () => (ctx.getState ? ctx.getState() : ctx.state);

  function createWeeklyAvailabilityVNode() {
    const state = resolveState();
    const today = ctx.todayISO();
    const todayDay = ctx.parseLocalDate(today).getDay();
    const availability = ctx.buildWeeklyAvailability(state.metas?.horasPorDia);

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

    const state = resolveState();
    const today = ctx.todayISO();
    const model = ctx.buildPlanExecution({
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

    const distribution = ctx.buildStudyDistribution
      ? ctx.buildStudyDistribution({
          today,
          dailyPlans: state.dailyPlans,
          sessions: (state.studySessions || []).map((item: any) => ({
            ...item,
            subjectId: ctx.entitySubjectId ? ctx.entitySubjectId(item) : item.subjectId,
          })),
          subjects: state.subjects,
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
                      subjectConfig: (state.examBlueprint?.subjects || []).find(
                        (item: any) => item.subjectId === topic.subjectId
                      ),
                      activeExamTags: state.examBlueprint?.activeExamTags || [],
                      exams: state.exams,
                      examQuestions: state.examQuestions,
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

    const state = resolveState();
    const m = state.metas;
    const resultGoals = ctx.buildResultGoalsViewModel({
      goals: m,
      achieved,
    });

    const hasActivity =
      (state.studySessions || []).length > 0 ||
      (state.questoes || []).length > 0 ||
      (state.simulados || []).length > 0 ||
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
    const state = resolveState();
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
            <td>${w.topicsConcl}/${state.metas?.semanal ?? 0} ${badge(w.semanalOk, w.current)}</td>
            <td>${w.questoesResolved}/${state.metas?.questoesSemanal ?? 0} ${badge(w.questoesOk, w.current)}</td>
            <td>${w.simuladosCount}/${state.metas?.simuladosSemanal ?? 0} ${badge(w.simuladosOk, w.current)}</td>
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

    const state = resolveState();
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

    const reviews = (state.reviewAgenda || []).map((item: any) => ({
      ...item,
      date: item.completedAt && ctx.localDateFromTimestamp
        ? ctx.localDateFromTimestamp(item.completedAt)
        : item.date,
    }));

    const model = ctx.buildPeriodComparisonViewModel({
      sessions: state.studySessions || [],
      questions: state.questoes || [],
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
      container.innerHTML = `<div class="pace-block"><div class="pace-status ok">🎉 Todos os tópicos cadastrados já foram concluídos!</div></div>`;
      return;
    }
    if (r.status === 'sem-dados') {
      container.innerHTML = `<div class="pace-block">
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? '' : 's'} pra concluir o plano.</div>
      <div class="pace-status neutral">Ainda sem tópicos concluídos nos últimos 14 dias — sem dados suficientes pra estimar o ritmo ainda.</div>
    </div>`;
      return;
    }

    const ritmoTxt =
      r.ratePerDay! >= 1
        ? `${r.ratePerDay!.toFixed(1)} tópicos por dia`
        : `${formatDecimal(r.ratePerDay! * 7)} tópicos por semana`;

    let statusHtml = '';
    if (r.comparativo === 'no-prazo') {
      const folga = r.daysToExam! - r.daysNeeded!;
      statusHtml = `<div class="pace-status ok">🟢 No ritmo atual, você termina com ${folga} dia${folga === 1 ? '' : 's'} de folga antes da prova.</div>`;
    } else if (r.comparativo === 'atrasado') {
      const atraso = r.daysNeeded! - r.daysToExam!;
      statusHtml = `<div class="pace-status warn">🔴 No ritmo atual, você terminaria ${atraso} dia${atraso === 1 ? '' : 's'} depois da prova. Considere acelerar ou rever o plano.</div>`;
    } else {
      statusHtml = `<div class="pace-status neutral">Defina a data da prova na Visão Geral pra comparar com o prazo.</div>`;
    }

    container.innerHTML = `
    <div class="pace-block">
      <div class="pace-line">Nos últimos 14 dias você concluiu em média <strong>${ritmoTxt}</strong>.</div>
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining === 1 ? '' : 's'} — no ritmo atual, você termina em <strong>${r.daysNeeded} dia${r.daysNeeded === 1 ? '' : 's'}</strong> (${formatDatePt(r.finishDate!)}).</div>
      ${statusHtml}
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
    renderHistoricoMetas,
    renderSelectedPeriodComparison,
    renderRitmo,
  };
}
