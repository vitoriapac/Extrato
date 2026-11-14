import { buildPerformanceSubjectComparison } from '../../../application/performance/build-performance-subject-comparison.js';
import { resolvePerformanceRange } from '../../../application/performance/performance-view-state.js';
import { updateSubjectAccuracyTargets } from '../../../application/goals/update-subject-accuracy-targets.js';
import { splitQuestionGoal } from '../../../application/goals/split-question-goal.js';
import { renderSubjectTargetEditor as renderSubjectTargetEditorView } from '../../renderers/subject-target-editor-renderer.js';
import { runUndoable } from '../../undoable.js';

export interface SubjectTargetEditorContext {
  document: Document;
  getState: () => any;
  examEvidenceContext: () => { questions: { included: any[] }; [key: string]: any };
  examScopedSubjects: () => any[];
  entitySubjectId: (item: any) => string | null;
  todayISO: () => string;
  nowISO: () => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  showToast: (message: string) => void;
  persistAndRender: () => void;
  captureReadinessBeforeStrategy: (reason: string) => void;
  invalidatePlanPreview: () => void;
  somarQuestoesDisciplinaNaSemana?: (subjectId: string | null) => number;
  subjectGoalService?: {
    create: (payload: { subjectId: string; meta: number }) => any;
    update?: (id: string, patch: { meta: number }) => any;
    remove?: (id: string) => any;
  };
}

export function createSubjectTargetEditorController(ctx: SubjectTargetEditorContext) {
  const draftAccuracy = new Map<string, string>();
  const draftWeeklyGoals = new Map<string, string>();
  // Prévia da repartição da meta global: nada é gravado antes de "Confirmar".
  let splitPreview:
    { id: string; subjectId: string; name: string; before: number; after: number }[] | null = null;

  function renderSubjectTargetEditor() {
    const container = ctx.document.getElementById('subjectTargetEditor');
    if (!container) return;

    const scope = ctx.examEvidenceContext();
    const subjects = ctx.examScopedSubjects();
    const questions = scope.questions.included.map((item: any) => ({
      ...item,
      subjectId: ctx.entitySubjectId(item),
    }));

    const state = ctx.getState();
    const comparison = buildPerformanceSubjectComparison({
      subjects,
      questions,
      range: resolvePerformanceRange({
        today: ctx.todayISO(),
        period: '30',
        comparePrevious: true,
      }),
      blueprint: state.examBlueprint,
      globalTarget: state.metas?.metaAprovacao,
    });

    const weeklyGoalsBySubject = new Map<string, { id: string; meta: number; solved: number }>();
    for (const md of state.metasPorDisciplina || []) {
      const subjectId = ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId;
      if (!subjectId) continue;
      weeklyGoalsBySubject.set(subjectId, {
        id: md.id,
        meta: Number(md.meta) || 0,
        solved: ctx.somarQuestoesDisciplinaNaSemana
          ? ctx.somarQuestoesDisciplinaNaSemana(subjectId)
          : 0,
      });
    }

    container.innerHTML = renderSubjectTargetEditorView({
      rows: comparison.rows,
      globalTarget: state.metas?.metaAprovacao,
      globalWeeklyQuestions: state.metas?.questoesSemanal,
      blueprint: state.examBlueprint,
      weeklyGoalsBySubject,
      draftAccuracy,
      draftWeeklyGoals,
      splitPreview,
    });
  }

  function previewQuestionGoalSplit() {
    const state = ctx.getState();
    if (draftAccuracy.size || draftWeeklyGoals.size) {
      ctx.showToast('Salve ou descarte as alterações pendentes antes de repartir a meta.');
      return;
    }
    const scoped = new Map(ctx.examScopedSubjects().map((item: any) => [item.id, item.name]));
    const goals = (state.metasPorDisciplina || [])
      .map((md: any) => ({
        id: md.id as string,
        subjectId: (ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId) as string,
        meta: Number(md.meta) || 0,
      }))
      .filter((goal: any) => scoped.has(goal.subjectId) && goal.meta > 0);
    const shares = splitQuestionGoal(goals, Number(state.metas?.questoesSemanal));
    if (!shares) {
      ctx.showToast(
        'Não foi possível repartir: a meta global é menor que o número de metas por disciplina.'
      );
      return;
    }
    splitPreview = goals.map((goal: any) => ({
      id: goal.id,
      subjectId: goal.subjectId,
      name: String(scoped.get(goal.subjectId)),
      before: goal.meta,
      after: shares.get(goal.id) as number,
    }));
    renderSubjectTargetEditor();
  }

  function cancelQuestionGoalSplit() {
    splitPreview = null;
    renderSubjectTargetEditor();
  }

  function confirmQuestionGoalSplit() {
    const preview = splitPreview;
    splitPreview = null;
    if (!preview) return;
    const state = ctx.getState();
    runUndoable('Meta de questões repartida entre as disciplinas.', () => {
      for (const item of preview) {
        if (ctx.subjectGoalService?.update) {
          ctx.subjectGoalService.update(item.id, { meta: item.after });
        } else {
          const existing = (state.metasPorDisciplina || []).find((md: any) => md.id === item.id);
          if (existing) existing.meta = item.after;
        }
      }
    });
  }

  function saveSubjectAccuracyTargets(subjectIds: string[], rawValue: any) {
    const eligible = new Set(ctx.examScopedSubjects().map((item: any) => item.id));
    const ids = [...new Set(subjectIds)].filter(id => eligible.has(id));

    if (!ids.length) {
      ctx.showToast('Selecione ao menos uma disciplina do concurso ativo.');
      return;
    }

    const value = rawValue === '' ? null : Number(rawValue);
    const state = ctx.getState();
    const updated = updateSubjectAccuracyTargets(state.examBlueprint, ids, value);

    if (!updated) {
      ctx.showToast('Informe uma meta entre 0% e 100%.');
      return;
    }

    if (JSON.stringify(updated.subjects) === JSON.stringify(state.examBlueprint?.subjects)) {
      ctx.showToast('As metas selecionadas já estão atualizadas.');
      return;
    }

    for (const id of ids) draftAccuracy.delete(id);
    ctx.captureReadinessBeforeStrategy('Antes de alterar metas de acerto por disciplina');
    Object.assign(state.examBlueprint, updated, { configuredAt: ctx.nowISO() });
    ctx.invalidatePlanPreview();
    ctx.persistAndRender();
    ctx.showToast('Metas de acerto atualizadas.');
  }

  function saveWeeklyQuestionGoal(subjectId: string, rawValue: any) {
    const state = ctx.getState();
    const trimmed = String(rawValue ?? '').trim();
    const existing = (state.metasPorDisciplina || []).find(
      (md: any) => (ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId) === subjectId
    );
    draftWeeklyGoals.delete(subjectId);

    if (trimmed === '' || Number(trimmed) <= 0) {
      if (existing) {
        removeWeeklyQuestionGoal(subjectId);
      } else {
        ctx.persistAndRender();
      }
      return;
    }

    const meta = Math.max(1, Math.round(Number(trimmed) || 1));
    if (existing) {
      if (ctx.subjectGoalService?.update) {
        ctx.subjectGoalService.update(existing.id, { meta });
      } else {
        existing.meta = meta;
      }
    } else if (ctx.subjectGoalService?.create) {
      ctx.subjectGoalService.create({ subjectId, meta });
    } else {
      state.metasPorDisciplina = state.metasPorDisciplina || [];
      state.metasPorDisciplina.push({ id: `md-${subjectId}`, subjectId, meta });
    }
    ctx.persistAndRender();
    ctx.showToast('Meta semanal de questões atualizada.');
  }

  function removeWeeklyQuestionGoal(subjectId: string) {
    const state = ctx.getState();
    const existing = (state.metasPorDisciplina || []).find(
      (md: any) => (ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId) === subjectId
    );
    draftWeeklyGoals.delete(subjectId);
    if (!existing) return;
    runUndoable('Meta de questões removida.', () => {
      if (ctx.subjectGoalService?.remove) {
        ctx.subjectGoalService.remove(existing.id);
      } else {
        state.metasPorDisciplina = (state.metasPorDisciplina || []).filter(
          (md: any) => md.id !== existing.id
        );
      }
    });
  }

  function commitAllPendingDrafts() {
    const state = ctx.getState();
    let changed = false;

    for (const [subjectId, rawAcc] of [...draftAccuracy.entries()]) {
      const val = rawAcc.trim() === '' ? null : Number(rawAcc);
      const updated = updateSubjectAccuracyTargets(state.examBlueprint, [subjectId], val);
      if (!updated) {
        ctx.showToast('Informe uma meta entre 0% e 100%.');
        return;
      }
      if (JSON.stringify(updated.subjects) !== JSON.stringify(state.examBlueprint?.subjects)) {
        if (!changed) {
          ctx.captureReadinessBeforeStrategy('Antes de alterar metas de acerto por disciplina');
        }
        Object.assign(state.examBlueprint, updated, { configuredAt: ctx.nowISO() });
        ctx.invalidatePlanPreview();
        changed = true;
      }
      draftAccuracy.delete(subjectId);
    }

    for (const [subjectId, rawWk] of [...draftWeeklyGoals.entries()]) {
      const trimmed = rawWk.trim();
      const existing = (state.metasPorDisciplina || []).find(
        (md: any) => (ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId) === subjectId
      );
      if (trimmed === '' || Number(trimmed) <= 0) {
        if (existing) {
          if (ctx.subjectGoalService?.remove) {
            ctx.subjectGoalService.remove(existing.id);
          } else {
            state.metasPorDisciplina = (state.metasPorDisciplina || []).filter(
              (md: any) => md.id !== existing.id
            );
          }
          changed = true;
        }
      } else {
        const meta = Math.max(1, Math.round(Number(trimmed) || 1));
        if (existing) {
          if (existing.meta !== meta) {
            if (ctx.subjectGoalService?.update) {
              ctx.subjectGoalService.update(existing.id, { meta });
            } else {
              existing.meta = meta;
            }
            changed = true;
          }
        } else {
          if (ctx.subjectGoalService?.create) {
            ctx.subjectGoalService.create({ subjectId, meta });
          } else {
            state.metasPorDisciplina = state.metasPorDisciplina || [];
            state.metasPorDisciplina.push({ id: `md-${subjectId}`, subjectId, meta });
          }
          changed = true;
        }
      }
      draftWeeklyGoals.delete(subjectId);
    }

    ctx.persistAndRender();
    if (changed) {
      ctx.showToast('Metas por disciplina atualizadas.');
    }
  }

  function bindEvents() {
    const container = ctx.document.getElementById('subjectTargetEditor');
    if (!container) return;

    const syncPendingBar = () => {
      const bar = container.querySelector<HTMLElement>('[data-targets-pending-bar]');
      if (bar) {
        bar.hidden = draftAccuracy.size === 0 && draftWeeklyGoals.size === 0;
      }
    };

    container.addEventListener('input', event => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-accuracy-value]')) {
        const input = target as HTMLInputElement;
        const subjectId = input.dataset.accuracyValue!;
        draftAccuracy.set(subjectId, input.value);
        syncPendingBar();
      } else if (target.matches('[data-weekly-goal-value]')) {
        const input = target as HTMLInputElement;
        const subjectId = input.dataset.weeklyGoalValue!;
        draftWeeklyGoals.set(subjectId, input.value);
        syncPendingBar();
      }
    });

    container.addEventListener('keydown', event => {
      const keyEvent = event as KeyboardEvent;
      if (keyEvent.key !== 'Enter') return;
      const target = keyEvent.target as HTMLElement;
      if (target.matches('[data-accuracy-value]')) {
        keyEvent.preventDefault();
        const input = target as HTMLInputElement;
        saveSubjectAccuracyTargets([input.dataset.accuracyValue!], input.value);
      } else if (target.matches('[data-weekly-goal-value]')) {
        keyEvent.preventDefault();
        const input = target as HTMLInputElement;
        saveWeeklyQuestionGoal(input.dataset.weeklyGoalValue!, input.value);
      }
    });

    container.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      const getSelected = () =>
        [...container.querySelectorAll<HTMLInputElement>('[data-accuracy-select]:checked')].map(
          item => item.value
        );

      const save = target.closest<HTMLElement>('[data-accuracy-save]');
      if (save) {
        const id = save.dataset.accuracySave!;
        const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
        const val =
          container.querySelector<HTMLInputElement>(`[data-accuracy-value="${escaped}"]`)?.value ??
          '';
        saveSubjectAccuracyTargets([id], val);
        return;
      }

      const restore = target.closest<HTMLElement>('[data-accuracy-restore]');
      if (restore) {
        saveSubjectAccuracyTargets([restore.dataset.accuracyRestore!], '');
        return;
      }

      const saveWeekly = target.closest<HTMLElement>('[data-weekly-goal-save]');
      if (saveWeekly) {
        const input = saveWeekly
          .closest('details')
          ?.querySelector<HTMLInputElement>('[data-weekly-goal-value]');
        if (input) saveWeeklyQuestionGoal(input.dataset.weeklyGoalValue!, input.value);
        return;
      }

      const removeWeekly = target.closest<HTMLElement>('[data-weekly-goal-remove]');
      if (removeWeekly) {
        removeWeeklyQuestionGoal(removeWeekly.dataset.weeklyGoalRemove!);
        return;
      }

      if (target.closest('[data-questions-split-preview]')) {
        previewQuestionGoalSplit();
        return;
      }

      if (target.closest('[data-questions-split-confirm]')) {
        confirmQuestionGoalSplit();
        return;
      }

      if (target.closest('[data-questions-split-cancel]')) {
        cancelQuestionGoalSplit();
        return;
      }

      if (target.closest('[data-targets-save-all]')) {
        commitAllPendingDrafts();
        return;
      }

      if (target.closest('[data-targets-discard]')) {
        draftAccuracy.clear();
        draftWeeklyGoals.clear();
        renderSubjectTargetEditor();
        return;
      }

      if (target.closest('[data-accuracy-apply]')) {
        const val =
          container.querySelector<HTMLInputElement>('[data-accuracy-bulk-value]')?.value ?? '';
        if (val === '') {
          ctx.showToast('Informe o valor a aplicar.');
          return;
        }
        saveSubjectAccuracyTargets(getSelected(), val);
        return;
      }

      if (target.closest('[data-accuracy-restore-selected]')) {
        saveSubjectAccuracyTargets(getSelected(), '');
      }
    });

    container.addEventListener('change', event => {
      const target = event.target as HTMLElement;
      if (target.matches('[data-accuracy-select-all]')) {
        const checked = (target as HTMLInputElement).checked;
        container.querySelectorAll<HTMLInputElement>('[data-accuracy-select]').forEach(input => {
          input.checked = checked;
        });
      }
    });
  }

  return {
    renderSubjectTargetEditor,
    saveSubjectAccuracyTargets,
    saveWeeklyQuestionGoal,
    removeWeeklyQuestionGoal,
    previewQuestionGoalSplit,
    confirmQuestionGoalSplit,
    cancelQuestionGoalSplit,
    bindEvents,
  };
}
