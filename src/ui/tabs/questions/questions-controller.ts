import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { QuestionLogTable, type QuestionItem, type QuestionViewModel } from './QuestionLogTable.js';
import {
  SimulationLogTable,
  type SimulationItem,
  type SimulationViewModel,
} from './SimulationLogTable.js';
import { subjectColorOf } from '../../../domain/subjects/subject-color.js';
import { createProgressiveList } from '../../progressive-list.js';
import { renderCollectionFooter } from '../../list-components.js';

export interface QuestionsControllerOptions {
  state: {
    questoes: QuestionItem[];
    simulados: SimulationItem[];
    subjects?: any[];
  };
  listViewState: {
    questionsPage: number;
    simulationsPage: number;
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
  getSubjectOptionsHtml?: (selectedId?: string | null) => string;
  getTopicOptionsHtml?: (subjectId?: string | null, selectedTopicId?: string | null) => string;
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

  // Página da lista (10 por vez) e rodapé. Grava a página já limitada: apagar o último
  // item da última página cai na anterior.
  function pageOf<T>(items: T[], key: 'questions' | 'simulations', colspan: number, label: string) {
    const stateKey = `${key}Page` as const;
    const list = createProgressiveList({
      items,
      mode: 'pages',
      page: opts.listViewState[stateKey],
    });
    opts.listViewState[stateKey] = list.page;
    const footerHtml = renderCollectionFooter({
      total: list.totalItems,
      page: list.page,
      pageSize: list.pageSize,
      pageAction: (n: number) => `goToListPage('${key}',${n})`,
      colspan,
      label,
    });
    return { visibleItems: list.visibleItems as T[], footerHtml };
  }

  function renderQuestionsHtml(): string {
    const { visibleItems: questions, footerHtml } = pageOf(
      getSortedQuestions(),
      'questions',
      8,
      'registros'
    );
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

    return render(
      h(QuestionLogTable, {
        questions,
        editingId,
        draft,
        openErrorIds,
        isMobile,
        errorCategories: opts.errorCategories,
        getViewModel: opts.questionViewModel,
        getCategorizedErrors: opts.questionCategorizedErrors,
        getSubjectColorSlot: (subId?: string | null) =>
          subjectColorOf({ id: subId || '' }, opts.state.subjects || []),
        subjectOptionsHtml,
        topicOptionsHtml,
        footerHtml,
      })
    );
  }

  function renderSimulationsHtml(): string {
    const { visibleItems: simulations, footerHtml } = pageOf(
      getSortedSimulations(),
      'simulations',
      7,
      'simulados'
    );
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

    return render(
      h(SimulationLogTable, {
        simulations,
        editingId,
        draft,
        openBreakdownIds,
        isMobile,
        getViewModel,
        getSubjectOptionsHtml: opts.getSubjectOptionsHtml || (() => ''),
        subjects: opts.state.subjects || [],
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
