import { parseLocalDate } from '../../core/date-utils.js';
import type { AppState } from '../../core/types.js';
import { resolveExamPhase } from '../../domain/planning/adaptive-planning.js';
import { EXAM_PRIORITIES } from '../../state/strategic.js';

export interface GoalsBlueprintServiceDependencies {
  getState: () => AppState;
  todayISO: () => string;
  nowISO: () => string;
  diasParaRevisao: (targetIso: string | null | undefined) => number | null;
  entitySubjectId: (item: Record<string, any>) => string | null;
  goalsService: {
    hoursForDate: (date: string) => number;
    hoursForDay: (day: any) => number;
    updateDailyHours: (day: any, value: any, options?: { isToday?: boolean }) => void;
    update: (field: string, value: any) => void;
  };
  subjectGoalService: {
    create: (payload: { subjectId: string; meta: number }) => any;
  };
  captureReadinessBeforeStrategy: (reason: string) => void;
  invalidatePlanPreview: () => void;
  persistAndRender: () => void;
  scheduleSave: () => void;
  showToast: (message: string) => void;
}

export function createGoalsBlueprintService(deps: GoalsBlueprintServiceDependencies) {
  const {
    getState,
    todayISO,
    nowISO,
    diasParaRevisao,
    entitySubjectId,
    goalsService,
    subjectGoalService,
    captureReadinessBeforeStrategy,
    invalidatePlanPreview,
    persistAndRender,
    scheduleSave,
    showToast,
  } = deps;

  function metaHoursForDate(date = todayISO()) {
    return goalsService.hoursForDate(date);
  }

  function metaHoursToday() {
    return metaHoursForDate(todayISO());
  }

  function updateMetaHoursDay(day: any, value: any, { refresh = true }: any = {}) {
    if (
      Number(day) >= 0 &&
      Number(day) <= 6 &&
      goalsService.hoursForDay(day) !== Math.max(0, Math.min(24, Number(value) || 0))
    )
      captureReadinessBeforeStrategy('Antes de alterar a disponibilidade semanal');
    invalidatePlanPreview();
    goalsService.updateDailyHours(day, value, {
      isToday: Number(day) === parseLocalDate(todayISO())!.getDay(),
    });
    if (refresh) persistAndRender();
    else scheduleSave();
  }

  function updateExamBlueprint(field: string, value: any, { refresh = true }: any = {}) {
    const state = getState();
    const nextValue =
      field === 'examDate'
        ? value || null
        : field === 'targetScore'
          ? Math.max(0, Math.min(100, Number(value) || 0))
          : field === 'masteryTarget'
            ? Math.max(0, Math.min(100, Number(value) || 80))
            : undefined;
    if (
      nextValue !== undefined &&
      (state.examBlueprint as Record<string, any>)[field] !== nextValue
    )
      captureReadinessBeforeStrategy(
        'Antes de alterar ' +
          (
            {
              examDate: 'a data da prova',
              targetScore: 'a meta de nota',
              masteryTarget: 'a meta de domínio',
            } as Record<string, any>
          )[field]
      );
    invalidatePlanPreview();
    const previousPhase =
      field === 'examDate'
        ? resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null)
        : null;
    if (field === 'examDate') {
      state.examBlueprint.examDate = value || null;
      state.examDate = value || '';
    }
    if (field === 'targetScore') {
      const target = Math.max(0, Math.min(100, Number(value) || 0));
      state.examBlueprint.targetScore = target;
      goalsService.update('metaAprovacao', target);
    }
    if (field === 'masteryTarget')
      state.examBlueprint.masteryTarget = Math.max(0, Math.min(100, Number(value) || 80));
    state.examBlueprint.configuredAt = nowISO();
    if (refresh) persistAndRender();
    else scheduleSave();
    if (field === 'examDate' && previousPhase?.state && previousPhase.state !== 'undated') {
      const nextPhase = resolveExamPhase(state.examDate ? diasParaRevisao(state.examDate) : null);
      if (nextPhase.state !== previousPhase.state && nextPhase.state !== 'undated')
        showToast(`Você entrou na fase de ${nextPhase.label}. ${nextPhase.strategy}`);
    }
  }

  function updateExamSubject(subjectId: string, field: string, value: any) {
    const state = getState();
    invalidatePlanPreview();
    let config = state.examBlueprint.subjects.find(item => item.subjectId === subjectId);
    const nextValue =
      field === 'expectedQuestions'
        ? Math.max(0, Math.round(Number(value) || 0))
        : field === 'questionWeight'
          ? Math.max(0.1, Number(value) || 1)
          : field === 'masteryTarget'
            ? value === ''
              ? null
              : Math.max(0, Math.min(100, Number(value) || 0))
            : field === 'priority' && EXAM_PRIORITIES.includes(value)
              ? value
              : undefined;
    if (
      nextValue !== undefined &&
      (!config ||
        (config as Record<string, any>)[field] !== nextValue ||
        (['expectedQuestions', 'questionWeight'].includes(field) && config.official))
    )
      captureReadinessBeforeStrategy('Antes de alterar a configuração estratégica da disciplina');
    if (!config) {
      config = {
        subjectId,
        expectedQuestions: 0,
        questionWeight: 1,
        priority: 'normal',
        masteryTarget: null,
      };
      state.examBlueprint.subjects.push(config);
    }
    if (field === 'expectedQuestions')
      config.expectedQuestions = Math.max(0, Math.round(Number(value) || 0));
    if (field === 'questionWeight') config.questionWeight = Math.max(0.1, Number(value) || 1);
    if (field === 'expectedQuestions' || field === 'questionWeight') {
      config.sourceRef = null;
      config.official = false;
      config.mappingType = null;
    }
    if (field === 'priority' && EXAM_PRIORITIES.includes(value)) config.priority = value;
    if (field === 'masteryTarget')
      config.masteryTarget = value === '' ? null : Math.max(0, Math.min(100, Number(value) || 0));
    state.examBlueprint.configuredAt = nowISO();
    persistAndRender();
  }

  function addMetaDisciplina(subjectId: string, rawMeta: any) {
    const state = getState();
    const meta = Number(rawMeta) || 20;
    if (!subjectId) {
      showToast('Cadastre uma disciplina primeiro.');
      return;
    }
    if (state.metasPorDisciplina.some(md => entitySubjectId(md) === subjectId)) {
      showToast('Já existe uma meta pra essa disciplina.');
      return;
    }
    subjectGoalService.create({ subjectId, meta });
    persistAndRender();
  }

  return {
    metaHoursForDate,
    metaHoursToday,
    updateMetaHoursDay,
    updateExamBlueprint,
    updateExamSubject,
    addMetaDisciplina,
  };
}
