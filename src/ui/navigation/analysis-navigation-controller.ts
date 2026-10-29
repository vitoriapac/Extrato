import {
  analysisContextInScope,
  createAnalysisContext,
} from '../../application/navigation/analysis-context.js';
import { updatePerformanceViewState } from '../../application/performance/performance-view-state.js';
import type { AppState } from '../../core/types.js';

export interface AnalysisNavigationControllerOptions {
  document: Document;
  getState: () => AppState;
  getTopicName: (id: string) => string;
  getSubjectName: (id: string) => string;
  escapeHtml: (text: any) => string;
  activeTabName: () => string;
  activateTab: (tabName: string) => void;
  getPerformanceViewState: () => any;
  setPerformanceViewState: (next: any) => void;
  calculateStudyPlanPreview: () => void;
}

export function createAnalysisNavigationController(options: AnalysisNavigationControllerOptions) {
  const {
    document,
    getState,
    getTopicName,
    getSubjectName,
    escapeHtml,
    activeTabName,
    activateTab,
    getPerformanceViewState,
    setPerformanceViewState,
    calculateStudyPlanPreview,
  } = options;

  let analysisNavigationContext: any = null;

  function analysisContextBanner(destination: string) {
    const state = getState();
    if (
      !analysisContextInScope(
        analysisNavigationContext,
        state.examBlueprint?.activeExamTags || []
      ) ||
      analysisNavigationContext.origin === destination
    )
      return '';
    const label = analysisNavigationContext.topicId
      ? getTopicName(analysisNavigationContext.topicId)
      : analysisNavigationContext.subjectId
        ? getSubjectName(analysisNavigationContext.subjectId)
        : 'análise';
    return `<div class="analysis-context-banner"><span>Contexto: ${escapeHtml(label || 'análise')} · ${analysisNavigationContext.period === 'all' ? 'todo o histórico' : `período de ${escapeHtml(analysisNavigationContext.period)} dias`}</span><button type="button" class="btn ghost small" data-analysis-return>Voltar à origem</button></div>`;
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const state = getState();
      const back = (event.target as HTMLElement).closest('[data-analysis-return]');
      if (back) {
        const previous = analysisNavigationContext;
        if (!analysisContextInScope(previous, state.examBlueprint?.activeExamTags || [])) return;
        analysisNavigationContext = null;
        if (previous.origin === 'desempenho')
          setPerformanceViewState(
            updatePerformanceViewState(getPerformanceViewState(), {
              section: 'subjects',
              period: previous.period,
              subjectId: previous.subjectId,
              topicId: previous.topicId,
            })
          );
        activateTab(previous.origin);
        return;
      }
      const button = (event.target as HTMLElement).closest<HTMLElement>('[data-analysis-nav]');
      if (!button) return;
      const destination = button.dataset.analysisNav,
        subjectId = button.dataset.subjectId || null,
        topicId = button.dataset.topicId || null;
      if (!['hoje', 'desempenho', 'metas'].includes(destination!)) return;
      analysisNavigationContext = createAnalysisContext({
        origin: activeTabName(),
        subjectId,
        topicId,
        period: getPerformanceViewState().period,
        activeExamTags: state.examBlueprint?.activeExamTags || [],
      });
      const topicDialog = document.getElementById('performanceTopicDialog') as HTMLDialogElement;
      if (topicDialog?.open) topicDialog.close();
      if (destination === 'desempenho')
        setPerformanceViewState(
          updatePerformanceViewState(getPerformanceViewState(), {
            section: 'subjects',
            subjectId,
            topicId,
          })
        );
      if (destination === 'metas') calculateStudyPlanPreview();
      activateTab(destination!);
      requestAnimationFrame(() => {
        if (destination === 'hoje')
          document.querySelector('.today-analysis-details')?.setAttribute('open', '');
        if (destination === 'metas')
          document.querySelector('#examStudyPlan .study-plan-details')?.setAttribute('open', '');
        const targets: HTMLElement[] | NodeListOf<HTMLElement> =
          destination === 'hoje'
            ? document.querySelectorAll<HTMLElement>(
                '#diagnosisCenter [data-diagnosis-subject-id]'
              )
            : destination === 'metas'
              ? document.querySelectorAll<HTMLElement>('#examStudyPlan [data-plan-topic-id]')
              : [];
        const selected = [...targets].find(
          node =>
            (destination === 'hoje' &&
              node.dataset.diagnosisTopicId === topicId &&
              node.dataset.diagnosisSubjectId === subjectId) ||
            (destination === 'metas' && node.dataset.planTopicId === topicId)
        );
        const fallback =
          destination === 'desempenho'
            ? document.getElementById('performancePage')
            : destination === 'metas'
              ? document.getElementById('examStudyPlan')
              : document.getElementById('diagnosisCenter');
        (selected || fallback)?.scrollIntoView({ block: 'start' });
        selected?.focus({ preventScroll: true });
      });
    });
  }

  return {
    analysisContextBanner,
    bindEvents,
  };
}
