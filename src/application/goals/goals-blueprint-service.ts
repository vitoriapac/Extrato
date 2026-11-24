import { parseLocalDate } from '../../core/date-utils.js';
import type { AppState } from '../../core/types.js';
import { resolveExamPhase } from '../../domain/planning/adaptive-planning.js';
import { EXAM_PRIORITIES } from '../../state/strategic.js';
import { runUndoable } from '../../ui/undoable.js';
import { normalizeBanca, normalizeQuestionMinutes } from '../../domain/questions/bancas.js';
import { normalizeExamCutoff } from '../../domain/analytics/cutoff-reference.js';

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
    update: (field: string, value: any) => any;
    applyHoursToEveryDay?: (hours: number) => void;
    clearWeekend?: () => void;
  };
  subjectGoalService: {
    create: (payload: { subjectId: string; meta: number }) => any;
    update?: (id: string, patch: { meta: number }) => any;
    remove?: (id: string) => any;
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
    // Modo Essencial: um só campo de meta preenche nota-alvo e meta geral de domínio.
    if (field === 'allTargets') {
      updateExamBlueprint('targetScore', value, { refresh: false });
      return updateExamBlueprint('masteryTarget', value, { refresh });
    }
    const state = getState();
    if (field === 'cutoffScore' || field === 'cutoffMax' || field === 'cutoffYear') {
      // Referência para ler a nota projetada; não altera meta, prioridades nem prontidão.
      const key = { cutoffScore: 'score', cutoffMax: 'maxScore', cutoffYear: 'year' }[field];
      const current: Record<string, unknown> = { ...(state.examBlueprint.cutoff || {}) };
      current[key] = value;
      // Sem nota não há corte: limpar a nota apaga a referência inteira.
      state.examBlueprint.cutoff =
        field === 'cutoffScore' && !String(value ?? '').trim()
          ? undefined
          : normalizeExamCutoff(current) || state.examBlueprint.cutoff || undefined;
      if (refresh) persistAndRender();
      else scheduleSave();
      return;
    }
    if (field === 'banca' || field === 'durationMinutes') {
      // Só alimentam a leitura de banca e ritmo das questões: não mudam prioridade nem prontidão.
      if (field === 'banca') state.examBlueprint.banca = normalizeBanca(value) || undefined;
      else state.examBlueprint.durationMinutes = normalizeQuestionMinutes(value) || undefined;
      if (refresh) persistAndRender();
      else scheduleSave();
      return;
    }
    if (field === 'preEdital' || field === 'essayMinPercent') {
      if (field === 'preEdital') {
        const preEdital = value === true || value === 'true';
        if (preEdital) {
          // Sem edital não há data oficial: a data antiga deixaria fases e prazo cobrando o que não existe.
          captureReadinessBeforeStrategy('Antes de voltar ao pré-edital');
          state.examBlueprint.examDate = null;
          state.examDate = '';
        }
        state.examBlueprint.preEdital = preEdital ? true : undefined;
      } else {
        const min = Number(String(value).replace(',', '.'));
        state.examBlueprint.essayMinPercent = min > 0 && min <= 100 ? min : null;
      }
      if (refresh) persistAndRender();
      else scheduleSave();
      return;
    }
    if (field === 'scoringMode') {
      const mode = value === 'certo-errado' ? 'certo-errado' : undefined;
      if (state.examBlueprint.scoringMode === mode) return;
      captureReadinessBeforeStrategy('Antes de alterar o tipo de prova');
      state.examBlueprint.scoringMode = mode;
      state.examBlueprint.configuredAt = nowISO();
      if (refresh) persistAndRender();
      else scheduleSave();
      return;
    }
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
      // Data definida: o edital saiu.
      if (value) state.examBlueprint.preEdital = undefined;
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
      showToast('Já existe uma meta para essa disciplina.');
      return;
    }
    subjectGoalService.create({ subjectId, meta });
    persistAndRender();
  }

  function updateMeta(key: string, value: any) {
    const state = getState();
    if (
      key === 'metaAprovacao' &&
      (state.metas as Record<string, any>)[key] !== Math.max(0, Math.min(100, Number(value) || 0))
    )
      captureReadinessBeforeStrategy('Antes de alterar a meta de nota');
    if (goalsService.update(key, value) === false) {
      showToast('Informe uma meta de aderência entre 50 e 100%.');
      return;
    }
    persistAndRender();
  }

  function applyTodayGoalToAllDays() {
    const value = metaHoursToday();
    if (
      Array.from({ length: 7 }, (_, day) => goalsService.hoursForDay(day)).some(
        hours => hours !== value
      )
    )
      captureReadinessBeforeStrategy('Antes de redistribuir a disponibilidade semanal');
    goalsService.applyHoursToEveryDay?.(value);
    persistAndRender();
    showToast(`Meta de ${value}h aplicada a todos os dias.`);
  }

  function clearWeekendGoals() {
    if (goalsService.hoursForDay(0) || goalsService.hoursForDay(6))
      captureReadinessBeforeStrategy('Antes de remover a disponibilidade do fim de semana');
    goalsService.clearWeekend?.();
    persistAndRender();
    showToast('Metas do fim de semana removidas.');
  }

  function updateMetaDisciplina(id: string, value: any) {
    subjectGoalService.update?.(id, { meta: Number(value) || 1 });
    persistAndRender();
  }

  function deleteMetaDisciplina(id: string) {
    runUndoable('Meta de questões removida.', () => {
      subjectGoalService.remove?.(id);
    });
  }

  return {
    metaHoursForDate,
    metaHoursToday,
    updateMetaHoursDay,
    updateExamBlueprint,
    updateExamSubject,
    addMetaDisciplina,
    updateMeta,
    applyTodayGoalToAllDays,
    clearWeekendGoals,
    updateMetaDisciplina,
    deleteMetaDisciplina,
  };
}
