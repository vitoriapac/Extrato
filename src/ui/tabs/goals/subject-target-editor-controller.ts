import { buildPerformanceSubjectComparison } from '../../../application/performance/build-performance-subject-comparison.js';
import { resolvePerformanceRange } from '../../../application/performance/performance-view-state.js';
import { updateSubjectAccuracyTargets } from '../../../application/goals/update-subject-accuracy-targets.js';
import { renderSubjectTargetEditor as renderSubjectTargetEditorView } from '../../renderers/subject-target-editor-renderer.js';

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
}

export function createSubjectTargetEditorController(ctx: SubjectTargetEditorContext) {
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

    container.innerHTML = renderSubjectTargetEditorView(
      {
        rows: comparison.rows,
        globalTarget: state.metas?.metaAprovacao,
        blueprint: state.examBlueprint,
      },
      { escapeHtml: ctx.escapeHtml, escapeAttr: ctx.escapeAttr }
    );
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

    ctx.captureReadinessBeforeStrategy('Antes de alterar metas de acerto por disciplina');
    Object.assign(state.examBlueprint, updated, { configuredAt: ctx.nowISO() });
    ctx.invalidatePlanPreview();
    ctx.persistAndRender();
    ctx.showToast('Metas de acerto atualizadas.');
  }

  function bindEvents() {
    const container = ctx.document.getElementById('subjectTargetEditor');
    if (!container) return;

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
    bindEvents,
  };
}
