import { createExamImportState, resetExamImportState } from './exam-import-state.js';
import { buildExamImportViewModel } from './exam-import-view-model.js';
import {
  renderExamImport as renderExamImportView,
  syncExamSubjectCheckboxes as syncExamSubjectCheckboxesView,
} from './exam-import-renderer.js';
import { createEditalImportFacade } from '../../application/subjects/edital-import-facade.js';
import { createExamImportController } from './exam-import-controller.js';

export interface ExamImportModalControllerContext {
  document: Document;
  state: any;
  uiState?: any;
  examImportService: any;
  EXAM_PRESETS: readonly any[];
  EXAM_SOURCES: Record<string, any>;
  EXAM_TAGS: Record<string, string>;
  ensureExamCatalog: () => Promise<void>;
  topicExamScopeLabel?: (topic: any) => string;
  isCommonTopic: (topic: any, tags: string[]) => boolean;
  normalizeExamTags: (tags: string[]) => string[];
  setActiveExamTags: (state: any, tags: string[], opts?: any) => void;
  suspendGuidedOnboarding?: () => void;
  resumeGuidedOnboarding?: (step: string) => void;
  activateTab?: (tab: string) => void;
  persistAndRender: () => void;
  showToast: (msg: string) => void;
  pluralize: (count: number, singular: string, plural?: string) => string;
  nowISO?: () => string;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
  examBadges?: (topic: Record<string, any>) => string;
}

export function createExamImportModalController(ctx: ExamImportModalControllerContext) {
  const editalImportFacade = createEditalImportFacade({
    catalog: ctx.EXAM_PRESETS,
    importService: ctx.examImportService,
  });

  const examImportState = createExamImportState(ctx.EXAM_PRESETS[0]);
  let examImportOrigin: string | null = null;

  const nowISO = ctx.nowISO || (() => new Date().toISOString());
  const escapeHtml =
    ctx.escapeHtml ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[c] || c
      ));
  const escapeAttr =
    ctx.escapeAttr ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[c] || c
      ));

  function selectedExamPreset() {
    return (
      ctx.EXAM_PRESETS.find(item => item.id === examImportState.presetId) || ctx.EXAM_PRESETS[0]
    );
  }

  function applyPresetBlueprintDefaults(preset: Record<string, any>) {
    const source = (preset.sources || []).length === 1 ? preset.sources[0] : null;
    if (!source || !(ctx.EXAM_SOURCES as Record<string, any>)[source]?.official) return;
    for (const subject of ctx.state.subjects || []) {
      if ((ctx.state.examBlueprint?.subjects || []).some((item: any) => item.subjectId === subject.id)) {
        continue;
      }
      const metric = subject.examMetrics?.[source];
      if (!metric || metric.mappingType !== 'direct' || metric.expectedQuestions == null) continue;
      if (!ctx.state.examBlueprint) ctx.state.examBlueprint = { subjects: [], activeExamTags: [] };
      if (!ctx.state.examBlueprint.subjects) ctx.state.examBlueprint.subjects = [];
      ctx.state.examBlueprint.subjects.push({
        subjectId: subject.id,
        expectedQuestions: metric.expectedQuestions,
        questionWeight: metric.questionWeight!,
        priority: 'normal',
        masteryTarget: null,
        sourceRef: source,
        official: Boolean(metric.official),
        mappingType: metric.mappingType,
      });
    }
    ctx.setActiveExamTags(
      ctx.state,
      ctx.normalizeExamTags(preset.examTags || []),
      { configuredAt: nowISO() }
    );
  }

  function syncExamSubjectCheckboxes() {
    syncExamSubjectCheckboxesView(ctx.document, examImportState, selectedExamPreset());
  }

  function renderExamImport() {
    const content = ctx.document.getElementById('examImportContent');
    const back = ctx.document.getElementById('examImportBackBtn');
    const next = ctx.document.getElementById('examImportNextBtn') as HTMLButtonElement | null;
    const preset = selectedExamPreset();
    const preview =
      examImportState.step === 3
        ? editalImportFacade.preview(examImportState.subjectIds, examImportState.topicIds)
        : null;
    const model = buildExamImportViewModel({
      state: examImportState,
      preset,
      presets: ctx.EXAM_PRESETS,
      topicLabel: ctx.topicExamScopeLabel,
      preview,
    });
    if (back) back.hidden = model.step === 1;
    if (next) {
      next.textContent = model.step === 3 ? 'Importar' : 'Continuar';
      next.disabled =
        model.step === 3
          ? preview.addedSubjects + preview.addedTopics + preview.metadataUpdates === 0
          : !model.canContinue;
    }
    if (content) {
      content.innerHTML = renderExamImportView(model, {
        escapeHtml,
        escapeAttr,
        renderBadges: ctx.examBadges || (() => ''),
        sourceLabel: (source: string) =>
          (ctx.EXAM_SOURCES as Record<string, any>)[source]?.label || source,
      });
    }
    if (model.step === 2) syncExamSubjectCheckboxes();
  }

  async function openExamImport(
    initialPreset: string | Record<string, any> | null = null,
    origin: string | null = null
  ) {
    try {
      await ctx.ensureExamCatalog();
      const requestedId = typeof initialPreset === 'string' ? initialPreset : initialPreset?.id;
      const preset = ctx.EXAM_PRESETS.find(item => item.id === requestedId) || ctx.EXAM_PRESETS[0];
      examImportOrigin = origin;
      resetExamImportState(
        examImportState,
        preset,
        ctx.document.activeElement as HTMLElement | null
      );
      if (origin === 'onboarding' && ctx.suspendGuidedOnboarding) {
        ctx.suspendGuidedOnboarding();
      }
      editalImportFacade.begin(examImportState.presetId!);
      ctx.document.getElementById('examImportOverlay')?.classList.add('show');
      renderExamImport();
      ctx.document.querySelector<HTMLElement>('[name="examPreset"]')?.focus();
    } catch (error: any) {
      ctx.showToast(error.message || 'Não foi possível abrir a importação de edital.');
    }
  }

  function closeExamImport({ completed = false }: { completed?: boolean } = {}) {
    const origin = examImportOrigin;
    editalImportFacade.cancel();
    ctx.document.getElementById('examImportOverlay')?.classList.remove('show');
    if (origin === 'onboarding') {
      if (ctx.resumeGuidedOnboarding) {
        ctx.resumeGuidedOnboarding(completed ? 'plan' : 'content');
      }
    } else {
      examImportState.previousFocus?.focus();
    }
    examImportOrigin = null;
  }

  const innerController = createExamImportController({
    document: ctx.document,
    state: examImportState,
    getPreset: selectedExamPreset,
    facade: editalImportFacade,
    render: renderExamImport,
    close: () => closeExamImport(),
    includeTopic: (action: string, topic: Record<string, any>) => {
      const tags = topic.examTags || [];
      return (
        action === 'all' ||
        (action === 'bb' && tags.includes(ctx.EXAM_TAGS.BB)) ||
        (action === 'caixa' && tags.includes(ctx.EXAM_TAGS.CAIXA)) ||
        (action === 'caixa-ti' && tags.includes(ctx.EXAM_TAGS.CAIXA_TI)) ||
        (action === 'common' && ctx.isCommonTopic(topic, [ctx.EXAM_TAGS.BB, ctx.EXAM_TAGS.CAIXA]))
      );
    },
    confirm: () => {
      const inOnboarding = examImportOrigin === 'onboarding';
      const preset = selectedExamPreset();
      const result = editalImportFacade.confirm(examImportState.subjectIds, examImportState.topicIds);
      applyPresetBlueprintDefaults(preset);
      if (ctx.uiState?.onboarding) {
        ctx.uiState.onboarding.presetId = preset.id;
      }
      ctx.persistAndRender();
      closeExamImport({ completed: true });
      if (inOnboarding && ctx.activateTab) {
        ctx.activateTab('dashboard');
      }
      ctx.showToast(
        `${ctx.pluralize(result.addedSubjects, 'disciplina')}, ${ctx.pluralize(result.addedTopics, 'tópico')} e ${ctx.pluralize(result.metadataUpdates, 'vínculo')} atualizados.`
      );
    },
  });

  return {
    state: examImportState,
    facade: editalImportFacade,
    selectedExamPreset,
    applyPresetBlueprintDefaults,
    syncExamSubjectCheckboxes,
    renderExamImport,
    openExamImport,
    closeExamImport,
    mount() {
      innerController.mount();
    },
  };
}
