import { buildPerformanceSubjectComparison } from '../../../application/performance/build-performance-subject-comparison.js';
import { resolvePerformanceRange } from '../../../application/performance/performance-view-state.js';
import { updateSubjectAccuracyTargets } from '../../../application/goals/update-subject-accuracy-targets.js';
import { splitQuestionGoal } from '../../../application/goals/split-question-goal.js';
import { renderSubjectTargetEditor as renderSubjectTargetEditorView } from '../../renderers/subject-target-editor-renderer.js';
import { runUndoable } from '../../undoable.js';
import { buildSavedSubjectConfig } from '../../../application/exams/save-subject-config.js';

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
  // Rascunhos por disciplina e campo (priority, weight, expected, accuracy, weekly, mastery): nada é gravado antes de Salvar.
  const drafts = new Map<string, Record<string, string>>();
  let sort: { key: string; dir: 'asc' | 'desc' } = { key: 'edital', dir: 'asc' };
  const setDraft = (subjectId: string, field: string, value: string) => {
    drafts.set(subjectId, { ...(drafts.get(subjectId) || {}), [field]: value });
  };
  const deleteDraft = (subjectId: string, field?: string) => {
    if (!field) return void drafts.delete(subjectId);
    const next = { ...(drafts.get(subjectId) || {}) };
    delete next[field];
    if (Object.keys(next).length) drafts.set(subjectId, next);
    else drafts.delete(subjectId);
  };
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

    const configOf = (id: string) =>
      (state.examBlueprint?.subjects || []).find((item: any) => item.subjectId === id) || {};
    const sortValue = (row: any): number | string => {
      const config = configOf(row.subjectId);
      if (sort.key === 'priority')
        return (
          ({ high: 0, normal: 1, low: 2 } as Record<string, number>)[config.priority || 'normal'] ??
          1
        );
      if (sort.key === 'weight') return Number(config.questionWeight ?? 1);
      if (sort.key === 'expected') return Number(config.expectedQuestions) || 0;
      if (sort.key === 'accuracy') return row.state === 'insufficient' ? -1 : Number(row.accuracy);
      if (sort.key === 'weekly') return weeklyGoalsBySubject.get(row.subjectId)?.meta || 0;
      return 0;
    };
    const rows =
      sort.key === 'edital'
        ? comparison.rows
        : [...comparison.rows].sort(
            (a: any, b: any) =>
              (Number(sortValue(a)) - Number(sortValue(b))) * (sort.dir === 'desc' ? -1 : 1)
          );

    container.innerHTML = renderSubjectTargetEditorView({
      rows,
      globalTarget: state.metas?.metaAprovacao,
      globalWeeklyQuestions: state.metas?.questoesSemanal,
      blueprint: state.examBlueprint,
      weeklyGoalsBySubject,
      drafts,
      masteryGlobal: state.examBlueprint?.masteryTarget,
      sort,
      splitPreview,
    });
  }

  function previewQuestionGoalSplit() {
    const state = ctx.getState();
    if (drafts.size) {
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

    for (const id of ids) deleteDraft(id, 'accuracy');
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
    deleteDraft(subjectId, 'weekly');

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
    deleteDraft(subjectId, 'weekly');
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

  /** Valida tudo antes de gravar; se algo estiver inválido nada muda e os rascunhos ficam. */
  function commitAllPendingDrafts() {
    if (!drafts.size) return;
    const state = ctx.getState();
    const eligible = new Set(ctx.examScopedSubjects().map((item: any) => item.id));
    const configChanges: { subjectId: string; config: any }[] = [];
    const weeklyChanges: { subjectId: string; raw: string }[] = [];
    for (const [subjectId, fields] of drafts) {
      if (!eligible.has(subjectId)) continue;
      const existing = (state.examBlueprint?.subjects || []).find(
        (item: any) => item.subjectId === subjectId
      );
      const configFields = ['priority', 'weight', 'expected', 'accuracy', 'mastery'];
      if (configFields.some(key => fields[key] !== undefined)) {
        const saved = (value: unknown) => (value == null ? '' : String(value));
        const config = buildSavedSubjectConfig(subjectId, existing, {
          priority: fields.priority ?? existing?.priority ?? 'normal',
          masteryTarget: fields.mastery ?? saved(existing?.masteryTarget),
          expectedQuestions:
            fields.expected ??
            (existing?.expectedQuestions > 0 ? saved(existing.expectedQuestions) : ''),
          questionWeight: fields.weight ?? saved(existing?.questionWeight),
          accuracyTarget: fields.accuracy ?? saved(existing?.accuracyTarget),
        });
        if (!config) {
          ctx.showToast('Revise as metas, a quantidade de questões e o peso antes de salvar.');
          return;
        }
        configChanges.push({ subjectId, config });
      }
      if (fields.weekly !== undefined) weeklyChanges.push({ subjectId, raw: fields.weekly });
    }
    const changedConfig = configChanges.filter(({ subjectId, config }) => {
      const existing = (state.examBlueprint?.subjects || []).find(
        (item: any) => item.subjectId === subjectId
      );
      return (
        !existing ||
        ['priority', 'masteryTarget', 'accuracyTarget', 'expectedQuestions', 'questionWeight'].some(
          key => JSON.stringify(existing[key]) !== JSON.stringify(config[key])
        )
      );
    });
    if (changedConfig.length)
      ctx.captureReadinessBeforeStrategy('Antes de alterar a configuração das disciplinas');
    drafts.clear();
    runUndoable('Metas por disciplina atualizadas.', () => {
      for (const { subjectId, config } of changedConfig) {
        const existing = (state.examBlueprint.subjects || []).find(
          (item: any) => item.subjectId === subjectId
        );
        if (existing) Object.assign(existing, config);
        else state.examBlueprint.subjects.push(config);
      }
      if (changedConfig.length) {
        state.examBlueprint.configuredAt = ctx.nowISO();
        ctx.invalidatePlanPreview();
      }
      for (const { subjectId, raw } of weeklyChanges) {
        const trimmed = raw.trim();
        const existing = (state.metasPorDisciplina || []).find(
          (md: any) => (ctx.entitySubjectId ? ctx.entitySubjectId(md) : md.subjectId) === subjectId
        );
        if (trimmed === '' || Number(trimmed) <= 0) {
          if (existing) {
            if (ctx.subjectGoalService?.remove) ctx.subjectGoalService.remove(existing.id);
            else
              state.metasPorDisciplina = (state.metasPorDisciplina || []).filter(
                (md: any) => md.id !== existing.id
              );
          }
          continue;
        }
        const meta = Math.max(1, Math.round(Number(trimmed) || 1));
        if (existing) {
          if (existing.meta === meta) continue;
          if (ctx.subjectGoalService?.update) ctx.subjectGoalService.update(existing.id, { meta });
          else existing.meta = meta;
        } else if (ctx.subjectGoalService?.create) {
          ctx.subjectGoalService.create({ subjectId, meta });
        } else {
          state.metasPorDisciplina = state.metasPorDisciplina || [];
          state.metasPorDisciplina.push({ id: `md-${subjectId}`, subjectId, meta });
        }
      }
    });
  }

  function bindEvents() {
    const container = ctx.document.getElementById('subjectTargetEditor');
    if (!container) return;

    const syncPendingBar = () => {
      const bar = container.querySelector<HTMLElement>('[data-targets-pending-bar]');
      if (bar) bar.hidden = drafts.size === 0;
    };
    let justCommitted = false;
    const selectedIds = () =>
      [...container.querySelectorAll<HTMLInputElement>('[data-row-select]:checked')].map(
        item => item.value
      );

    // Sair com alterações não salvas avisa (recarregar ou fechar a aba).
    ctx.document.defaultView?.addEventListener('beforeunload', event => {
      if (!drafts.size) return;
      event.preventDefault();
      (event as any).returnValue = '';
    });

    const record = (target: HTMLElement) => {
      const field = target.dataset.field;
      const subjectId = target.dataset.subject;
      if (!field || !subjectId) return false;
      // O Enter salva e, na sequência, o navegador ainda dispara 'change' no campo: não recriar o rascunho.
      if (justCommitted) return true;
      setDraft(subjectId, field, (target as HTMLInputElement | HTMLSelectElement).value);
      syncPendingBar();
      return true;
    };
    container.addEventListener('input', event => void record(event.target as HTMLElement));
    container.addEventListener('change', event => {
      const target = event.target as HTMLElement;
      if (record(target)) return;
      if (target.matches('[data-row-select-all]')) {
        const checked = (target as HTMLInputElement).checked;
        container.querySelectorAll<HTMLInputElement>('[data-row-select]').forEach(input => {
          input.checked = checked;
        });
      }
    });

    container.addEventListener('keydown', event => {
      const keyEvent = event as KeyboardEvent;
      if (keyEvent.key !== 'Enter') return;
      if (!(keyEvent.target as HTMLElement).matches('[data-field]')) return;
      keyEvent.preventDefault();
      // A troca do campo durante o redesenho dispara "change": não recriar o rascunho já salvo.
      justCommitted = true;
      commitAllPendingDrafts();
      setTimeout(() => (justCommitted = false), 300);
    });

    container.addEventListener('click', event => {
      const target = event.target as HTMLElement;

      const sorter = target.closest<HTMLElement>('[data-sort]');
      if (sorter) {
        const key = sorter.dataset.sort!;
        sort =
          sort.key === key
            ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
            : { key, dir: key === 'accuracy' ? 'asc' : 'asc' };
        renderSubjectTargetEditor();
        return;
      }

      if (target.closest('[data-bulk-apply]')) {
        const ids = selectedIds();
        if (!ids.length) {
          ctx.showToast('Selecione ao menos uma disciplina.');
          return;
        }
        const read = (name: string) =>
          container.querySelector<HTMLInputElement | HTMLSelectElement>(
            `[data-bulk-field="${name}"]`
          )?.value ?? '';
        const values: [string, string][] = [
          ['priority', read('priority')],
          ['weight', read('weight')],
          ['accuracy', read('accuracy')],
          ['weekly', read('weekly')],
        ];
        const filled = values.filter(([, value]) => value !== '');
        if (!filled.length) {
          ctx.showToast('Escolha ou informe ao menos um valor para aplicar.');
          return;
        }
        for (const id of ids) for (const [field, value] of filled) setDraft(id, field, value);
        renderSubjectTargetEditor();
        return;
      }

      if (target.closest('[data-bulk-use-global]')) {
        const ids = selectedIds();
        if (!ids.length) {
          ctx.showToast('Selecione ao menos uma disciplina.');
          return;
        }
        for (const id of ids) setDraft(id, 'accuracy', '');
        renderSubjectTargetEditor();
        return;
      }

      if (target.closest('[data-questions-split-preview]')) return void previewQuestionGoalSplit();
      if (target.closest('[data-questions-split-confirm]')) return void confirmQuestionGoalSplit();
      if (target.closest('[data-questions-split-cancel]')) return void cancelQuestionGoalSplit();
      if (target.closest('[data-targets-save-all]')) return void commitAllPendingDrafts();
      if (target.closest('[data-targets-discard]')) {
        drafts.clear();
        renderSubjectTargetEditor();
      }
    });
  }

  return {
    renderSubjectTargetEditor,
    saveSubjectAccuracyTargets,
    saveWeeklyQuestionGoal,
    commitAllPendingDrafts,
    getDrafts: () => drafts,
    removeWeeklyQuestionGoal,
    previewQuestionGoalSplit,
    confirmQuestionGoalSplit,
    cancelQuestionGoalSplit,
    bindEvents,
  };
}
