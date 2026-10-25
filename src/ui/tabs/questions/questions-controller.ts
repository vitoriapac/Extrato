import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { QuestionLogTable, type QuestionItem, type QuestionViewModel } from './QuestionLogTable.js';
import {
  SimulationLogTable,
  type SimulationItem,
  type SimulationViewModel,
} from './SimulationLogTable.js';

export interface QuestionsControllerOptions {
  state: {
    questoes: QuestionItem[];
    simulados: SimulationItem[];
    subjects?: any[];
  };
  listViewState: {
    questionsVisible: number;
    simulationsVisible: number;
  };
  questionEditController: {
    state: {
      editingId: string | null;
      draft: any;
    };
  };
  simulationEditController: {
    state: {
      editingId: string | null;
      draft: any;
    };
  };
  openQuestionErrorIds?: Set<string>;
  openBreakdownIds?: Set<string>;
  errorCategories: Record<string, { icon: string; label: string }>;
  isMobileLayout?: () => boolean;
  questionViewModel: (q: QuestionItem) => QuestionViewModel;
  questionCategorizedErrors: (q: QuestionItem) => number;
  simulationViewModel?: (sim: SimulationItem) => SimulationViewModel;
  renderListViewFooter?: (
    total: number,
    visible: number,
    step: number,
    moreAction: string,
    lessAction: string,
    colSpan: number,
    label: string
  ) => string;
  getSubjectOptionsHtml?: (selectedId?: string | null) => string;
  getTopicOptionsHtml?: (subjectId?: string | null, selectedTopicId?: string | null) => string;
  LIST_VIEW_STEPS?: {
    questions: number;
    simulations: number;
  };
}

export function createQuestionsController(opts: QuestionsControllerOptions) {
  const openErrorIds = opts.openQuestionErrorIds || new Set<string>();
  const openBreakdownIds = opts.openBreakdownIds || new Set<string>();

  function getSortedQuestions(): QuestionItem[] {
    return [...(opts.state.questoes || [])].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );
  }

  function getSortedSimulations(): SimulationItem[] {
    return [...(opts.state.simulados || [])].sort((a, b) =>
      (b.date || '').localeCompare(a.date || '')
    );
  }

  function renderQuestionsHtml(): string {
    const questions = getSortedQuestions();
    const visibleLimit = opts.listViewState.questionsVisible;
    const editingId = opts.questionEditController.state.editingId;
    const draft = opts.questionEditController.state.draft;
    const isMobile = opts.isMobileLayout ? opts.isMobileLayout() : false;

    let subjectOptionsHtml = '';
    let topicOptionsHtml = '';
    if (editingId && draft) {
      const subjectId = draft.subjectId;
      if (opts.getSubjectOptionsHtml) {
        subjectOptionsHtml = opts.getSubjectOptionsHtml(subjectId);
      }
      if (opts.getTopicOptionsHtml) {
        topicOptionsHtml = opts.getTopicOptionsHtml(subjectId, draft.topicId);
      }
    }

    let footerHtml = '';
    if (opts.renderListViewFooter && questions.length > 0) {
      const step = opts.LIST_VIEW_STEPS?.questions || 10;
      footerHtml = opts.renderListViewFooter(
        questions.length,
        visibleLimit,
        step,
        "changeListLimit('questions',LIST_VIEW_STEPS.questions,renderQuestoes)",
        "changeListLimit('questions',-listViewState.questionsVisible,renderQuestoes)",
        8,
        'registros'
      );
    }

    return render(
      h(QuestionLogTable, {
        questions,
        visibleLimit,
        editingId,
        draft,
        openErrorIds,
        isMobile,
        errorCategories: opts.errorCategories,
        getViewModel: opts.questionViewModel,
        getCategorizedErrors: opts.questionCategorizedErrors,
        subjectOptionsHtml,
        topicOptionsHtml,
        footerHtml,
      })
    );
  }

  function renderSimulationsHtml(): string {
    const simulations = getSortedSimulations();
    const visibleLimit = opts.listViewState.simulationsVisible;
    const editingId = opts.simulationEditController.state.editingId;
    const draft = opts.simulationEditController.state.draft;
    const isMobile = opts.isMobileLayout ? opts.isMobileLayout() : false;

    const defaultSimViewModel = (sim: SimulationItem): SimulationViewModel => {
      const correct = Number(sim.correct) || 0;
      const total = Number(sim.total) || 0;
      const score = total > 0 ? (correct / total) * 100 : 0;
      return {
        date: sim.date || '—',
        name: sim.nome || 'Simulado sem nome',
        correct,
        total,
        score,
      };
    };

    const getViewModel = opts.simulationViewModel || defaultSimViewModel;

    let footerHtml = '';
    if (opts.renderListViewFooter && simulations.length > 0) {
      const step = opts.LIST_VIEW_STEPS?.simulations || 5;
      footerHtml = opts.renderListViewFooter(
        simulations.length,
        visibleLimit,
        step,
        "changeListLimit('simulations',LIST_VIEW_STEPS.simulations,renderSimulados)",
        "changeListLimit('simulations',-listViewState.simulationsVisible,renderSimulados)",
        7,
        'simulados'
      );
    }

    return render(
      h(SimulationLogTable, {
        simulations,
        visibleLimit,
        editingId,
        draft,
        openBreakdownIds,
        isMobile,
        getViewModel,
        getSubjectOptionsHtml: opts.getSubjectOptionsHtml || (() => ''),
        footerHtml,
      })
    );
  }

  return {
    getSortedQuestions,
    getSortedSimulations,
    renderQuestionsHtml,
    renderSimulationsHtml,
    openErrorIds,
    openBreakdownIds,
  };
}
