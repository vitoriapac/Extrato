import { EXAM_TAGS, EXAM_SOURCES } from '../domain/exams/exam-constants.js';
import {
  isCommonTopic,
  topicExamScopeLabel,
  normalizeExamTags,
} from '../domain/exams/exam-scope.js';
import { setActiveExamTags } from '../application/exams/exam-scope-transition.js';
import { createExamImportService } from '../application/subjects/exam-import-service.js';
import { createExamImportModalController } from '../features/exam-import/exam-import-modal-controller.js';
import {
  parseStructuredStudyContent,
  createStructuredContentImportService,
} from '../application/subjects/structured-content-import.js';
import { createStructuredImportController } from '../features/structured-import/structured-import-controller.js';
import { renderStructuredImport } from '../features/structured-import/structured-import-renderer.js';
import { createHistoricalExamImportController } from '../features/exam-intelligence-import/exam-import-controller.js';
import { createQuestionImportService } from '../application/questions/question-import-service.js';
import { createQuestionImportController } from '../features/question-import/question-import-controller.js';
import { renderQuestionImport } from '../features/question-import/question-import-renderer.js';
import {
  buildQuestionImportTemplate,
  QUESTION_IMPORT_TEMPLATE_FILE_NAME,
} from '../features/question-import/question-import-template.js';
import { pickPersistentState } from '../state/state-boundaries.js';
import { ERROR_CATEGORIES } from '../domain/diagnostics/error-categories.js';

export interface WireImportControllersDeps {
  document: Document;
  window: Window;
  getState: () => any;
  uiState: any;
  subjectService: any;
  questionService: any;
  examPresets: any[];
  ensureExamCatalog: () => Promise<any>;
  suspendGuidedOnboarding: () => void;
  resumeGuidedOnboarding: (step?: string) => void;
  examBadges: (topic: any) => string;
  invalidatePlanPreviews: () => void;
  persistAndRender: () => void;
  activateTab: (tabName: string, updateHash?: boolean) => void;
  showToast: (message: string) => void;
  pluralize: (count: number, singular: string, plural?: string) => string;
  nowISO: () => string;
  todayISO: () => string;
  escapeHtml: (value: any) => string;
  escapeAttr: (value: any) => string;
}

export function wireImportControllers(deps: WireImportControllersDeps) {
  const examImportService = createExamImportService({
    subjectService: deps.subjectService,
    getSubjects: () => deps.getState().subjects,
  });

  const structuredContentImportService = createStructuredContentImportService({
    subjectService: deps.subjectService,
    getSubjects: () => deps.getState().subjects,
  });

  let structuredImportOrigin: string | null = null;
  const structuredImportController = createStructuredImportController({
    document: deps.document,
    window: deps.window,
    parse: parseStructuredStudyContent,
    service: structuredContentImportService,
    render: renderStructuredImport,
    notify: deps.showToast,
    onOpen: () => {
      if (structuredImportOrigin === 'onboarding') deps.suspendGuidedOnboarding();
    },
    onCancel: ({ completed }: any) => {
      if (structuredImportOrigin === 'onboarding') {
        deps.resumeGuidedOnboarding(completed ? 'plan' : 'content');
        structuredImportOrigin = null;
      }
    },
    onImported: (result: Record<string, any>) => {
      deps.invalidatePlanPreviews();
      deps.persistAndRender();
      deps.showToast(
        `${deps.pluralize(result.addedSubjects, 'disciplina')} e ${deps.pluralize(result.addedTopics, 'tópico')} adicionados; ${deps.pluralize(result.updatedTopics, 'tópico')} atualizados.`
      );
    },
  });

  deps.document.getElementById('structuredContentImportBtn')?.addEventListener('click', () => {
    structuredImportOrigin = null;
  });

  createHistoricalExamImportController({
    document: deps.document,
    getState: deps.getState,
    notify: deps.showToast,
    onImported: (result: Record<string, any>) => {
      const state = deps.getState();
      state.subjects = result.subjects;
      state.exams = result.exams;
      state.examQuestions = result.examQuestions;
      deps.invalidatePlanPreviews();
      deps.persistAndRender();
    },
  }).mount();

  deps.document.getElementById('downloadStructuredCsvBtn')?.addEventListener('click', () => {
    const csv =
        'disciplina,topico,dificuldade,importancia,esforco,tags\nPortuguês,Interpretação de texto,Médio,80,120,leitura|prioridade\n',
      blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
      url = URL.createObjectURL(blob),
      link = deps.document.createElement('a');
    link.href = url;
    link.download = 'modelo-studytrack.csv';
    link.click();
    URL.revokeObjectURL(url);
  });

  const examImportModalController = createExamImportModalController({
    document: deps.document,
    get state() {
      return deps.getState();
    },
    uiState: deps.uiState,
    examImportService,
    EXAM_PRESETS: deps.examPresets,
    EXAM_SOURCES,
    EXAM_TAGS,
    ensureExamCatalog: deps.ensureExamCatalog,
    topicExamScopeLabel,
    isCommonTopic,
    normalizeExamTags,
    setActiveExamTags,
    suspendGuidedOnboarding: deps.suspendGuidedOnboarding,
    resumeGuidedOnboarding: deps.resumeGuidedOnboarding,
    activateTab: deps.activateTab,
    persistAndRender: deps.persistAndRender,
    showToast: deps.showToast,
    pluralize: deps.pluralize,
    nowISO: deps.nowISO,
    escapeHtml: deps.escapeHtml,
    escapeAttr: deps.escapeAttr,
    examBadges: deps.examBadges,
  });
  examImportModalController.mount();

  const questionImportService = createQuestionImportService({
    subjectService: deps.subjectService,
    questionService: deps.questionService,
    getSubjects: () => deps.getState().subjects,
    getQuestions: () => deps.getState().questoes,
    errorCategoryKeys: Object.keys(ERROR_CATEGORIES),
    today: deps.todayISO,
    atomic: (task: () => any) => {
      const state = deps.getState();
      const snapshot = structuredClone(pickPersistentState(state));
      try {
        return task();
      } catch (error: any) {
        Object.assign(state, snapshot);
        throw error;
      }
    },
  });

  createQuestionImportController({
    document: deps.document,
    window: deps.window,
    service: questionImportService,
    render: renderQuestionImport,
    notify: deps.showToast,
    onImported: (result: Record<string, any>) => {
      deps.invalidatePlanPreviews();
      deps.persistAndRender();
      deps.showToast(
        `${deps.pluralize(result.addedQuestionsCount, 'questão')} em ${deps.pluralize(result.addedSessions, 'sessão')} importadas com sucesso.`
      );
    },
  });

  deps.document.getElementById('downloadQuestionsCsvBtn')?.addEventListener('click', () => {
    const blob = new Blob(['\uFEFF' + buildQuestionImportTemplate(deps.todayISO())], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = deps.document.createElement('a');
    link.href = url;
    link.download = QUESTION_IMPORT_TEMPLATE_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  });

  return {
    examImportModalController,
    structuredImportController,
    openStructuredImportFromOnboarding: () => {
      structuredImportOrigin = 'onboarding';
      structuredImportController.choose();
    },
  };
}
