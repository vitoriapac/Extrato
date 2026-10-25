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
  entitySubjectId?: (item: any) => string | null;
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

  function mountWeeklyAvailability(container: Element): void {
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

  function mountPlanExecution(container: Element): void {
    const vnode = createPlanExecutionVNode();
    if (vnode) {
      mountPreact(vnode, container);
    } else {
      container.innerHTML = '';
    }
  }

  return {
    renderWeeklyAvailabilityHtml,
    mountWeeklyAvailability,
    renderPlanExecutionHtml,
    mountPlanExecution,
  };
}
