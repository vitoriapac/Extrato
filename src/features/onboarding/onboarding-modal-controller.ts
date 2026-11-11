import {
  buildOnboardingViewModel,
  isValidOnboardingTopic,
  applyOnboardingDateShortcut,
  AVAILABILITY_PRESETS,
} from '../../application/onboarding/build-onboarding-view-model.js';
import { findStarterPackById, type StarterPack } from '../../domain/onboarding/starter-packs.js';
import { applySundayRestDay } from '../../domain/onboarding/routine-sustainability.js';
import { syncOnboardingPhase } from '../../ui/controllers/onboarding-phase-controller.js';
import { h } from 'preact';
import { mountPreact, unmountPreact } from '../../ui/preact-mount.js';
import { GuidedOnboardingModal } from '../../ui/modals/GuidedOnboardingModal.js';
import { syncDialogOpen } from '../../ui/primitives/dialog.js';
import { ManualSubjects } from './ManualSubjects.js';
import { validateManualSubjects, type ManualSubjectDraft } from '../../application/onboarding/manual-subject-drafts.js';
import {
  renderOnboardingEntry,
  renderOnboardingProgress,
  renderOnboardingContent,
  renderOnboardingHelp,
  renderOnboardingActions,
  onboardingBlockedReason,
} from './onboarding-renderer.js';
import { parseRawSyllabusText } from '../../application/subjects/raw-syllabus-parser.js';

export interface DocumentLike {
  getElementById(id: string): any;
  querySelector<T extends Element = Element>(selector: string): T | any;
  querySelectorAll(selector: string): any;
  createElement(tag: string): any;
  body: any;
  activeElement: any;
}

export interface OnboardingModalControllerDependencies {
  document: DocumentLike;
  getState: () => any;
  getUiState: () => any;
  isDemoMode: () => boolean;
  ensureExamCatalog: () => Promise<void>;
  showToast: (msg: string) => void;
  escapeHtml: (s: string) => string;
  escapeAttr: (s: string) => string;
  formatPlanMinutes: (mins: number) => string;
  todayISO: () => string;
  examPresets: any[];
  difficultyOptions: readonly string[];
  subjectService: {
    updateTopic: (subjectId: string, topicId: string, topic: any) => void;
    create?: (name: string) => any;
    addTopic?: (subjectId: string, input: any) => any;
    remove?: (subjectId: string) => any;
  };
  getSubjectById: (id: string) => any;
  activeSubjects: () => any[];
  scheduleSave: () => void;
  persistAndRender: () => void;
  buildStudyPlanProposal: (opts?: any) => any;
  calculateStudyPlanPreview: () => void;
  getStudyPlanPreview: () => any;
  confirmStudyPlan: () => void;
  calculateDailyPlanPreview: () => void;
  getDailyPlanPreview: () => any;
  confirmDailyPlanPreview: () => void;
  render: () => void;
  activateTab: (tabId: string) => void;
  syncModalShell: () => void;
  requestFrame?: (cb: () => void) => void;
  openExamImport?: (presetId: string, source: string) => void;
  onStructuredImport?: () => void;
  updateExamBlueprint?: (field: string, val: any, opts?: any) => void;
  updateMetaHoursDay?: (day: string, hours: string, opts?: any) => void;
}

export function createOnboardingModalController(deps: OnboardingModalControllerDependencies) {
  const {
    document,
    getState,
    getUiState,
    isDemoMode,
    ensureExamCatalog,
    showToast,
    escapeHtml,
    escapeAttr,
    formatPlanMinutes,
    todayISO,
    examPresets,
    difficultyOptions,
    subjectService,
    getSubjectById,
    activeSubjects,
    scheduleSave,
    persistAndRender,
    buildStudyPlanProposal,
    calculateStudyPlanPreview,
    getStudyPlanPreview,
    confirmStudyPlan,
    calculateDailyPlanPreview,
    getDailyPlanPreview,
    confirmDailyPlanPreview,
    render,
    activateTab,
    syncModalShell,
    requestFrame = (cb: () => void) =>
      typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : cb(),
  } = deps;

  const mountNode =
    typeof globalThis.document !== 'undefined' &&
    document === (globalThis.document as unknown) &&
    typeof document?.createElement === 'function'
      ? document.getElementById('guidedOnboardingMount')
      : null;

  let manualDrafts: ManualSubjectDraft[] = [];
  let manualOpen = false;
  let pasteSyllabusOpen = false;
  let lastModalOpen: boolean | null = null;

  function onboardingModel() {
    const state = getState();
    const uiState = getUiState();
    const canPreview =
      Boolean(state.examDate) &&
      Object.values(state.metas.horasPorDia || {}).some(value => Number(value) > 0) &&
      (state.subjects || []).some(
        (subject: any) => !subject.archived && subject.topics?.some(isValidOnboardingTopic)
      );
    const model = buildOnboardingViewModel({
      examDate: state.examDate,
      hoursByDay: state.metas?.horasPorDia || {},
      subjects: [...(state.subjects || []), ...manualDrafts.map((draft, index) => ({
        id: `manual-draft-${index}`, name: draft.name, topics: draft.topics.map((name, topicIndex) => ({ id: `draft-${topicIndex}`, name })),
      }))],
      sessions: state.studySessions || [],
      questions: state.questoes || [],
      dailyPlans: state.dailyPlans || [],
      studyPlans: state.studyPlans || [],
      planPreview: canPreview ? buildStudyPlanProposal({ guidedDefaults: true }) : null,
      currentStep: uiState.onboarding.currentStep,
      today: todayISO(),
      presets: examPresets,
      presetId: uiState.onboarding.presetId,
      customExamName: state.examBlueprint?.customTitle || null,
    });
    return { ...model, manualDraftError: validateManualSubjects(manualDrafts, (state.subjects || []).map((subject: any) => subject.name || '')) };
  }

  function syncGuidedNext(model?: Record<string, any>) {
    const effectiveModel = model || onboardingModel();
    const actions = document.getElementById('guidedOnboardingActions');
    const next = actions?.querySelector?.(
      '[data-guided-action="next"]'
    ) as HTMLButtonElement | null;
    if (!next) return;
    const reason = onboardingBlockedReason(effectiveModel);
    next.disabled = Boolean(reason);
    let hint = actions!.querySelector('#guidedActionHint');
    if (!reason) {
      hint?.remove();
      next.removeAttribute('aria-describedby');
      return;
    }
    if (!hint) {
      hint = document.createElement('p');
      hint.className = 'guided-action-hint';
      hint.id = 'guidedActionHint';
      actions!.prepend(hint);
    }
    hint.textContent = reason;
    next.setAttribute('aria-describedby', 'guidedActionHint');
  }

  function syncGuidedModal(open: boolean) {
    if (!mountNode) return;
    if (lastModalOpen === open) return;
    lastModalOpen = open;
    mountPreact(
      h(GuidedOnboardingModal, {
        open,
        onClose: () => closeGuidedOnboarding(),
      }),
      mountNode
    );
    syncDialogOpen(document as unknown as Document, 'guidedOnboardingOverlay', open);
  }

  function renderGuidedOnboarding() {
    const entry = document.getElementById('guidedOnboarding');
    if (mountNode && lastModalOpen === null) {
      syncGuidedModal(false);
    }
    const overlay = document.getElementById('guidedOnboardingOverlay');
    if (!entry || !overlay) return;
    const uiState = getUiState();
    const model = onboardingModel();
    if (!uiState.onboarding.currentStep) uiState.onboarding.currentStep = model.current.id;
    const visible = model.visible && !isDemoMode();
    const overview = document.querySelector('#panel-dashboard .overview-now');
    if (overview) overview.after(entry);
    // Automatic modal launch on first use with empty base (item 4.4)
    const inTest = typeof window !== 'undefined' && Boolean((window as any).__EXTRATO_TEST__);
    if (!inTest && visible && uiState.onboarding.open === undefined && !uiState.onboarding.completed) {
      uiState.onboarding.open = true;
    }
    // Keep entry hidden as static card when modal mode is preferred
    entry.hidden = inTest ? !visible : (!visible || uiState.onboarding.open);
    // Sem etapa concluída, as boas-vindas já oferecem a ação; o roteiro de 4 etapas vive no assistente.
    entry.setAttribute?.('data-fresh', String(!model.completed));
    const entryInner = document.getElementById('guidedOnboardingEntry');
    if (entryInner) {
      entryInner.innerHTML = visible ? renderOnboardingEntry(model, { escapeHtml }) : '';
    }
    syncOnboardingPhase(document, { visible });
    const modalOpen = Boolean(visible && uiState.onboarding.open);
    if (!mountNode) {
      overlay.hidden = !modalOpen;
      overlay.classList.toggle('show', modalOpen);
    }
    if (!visible) {
      uiState.onboarding.open = false;
      syncGuidedModal(false);
      return;
    }
    syncGuidedModal(modalOpen);
    const progressEl = document.getElementById('guidedOnboardingProgress');
    if (progressEl) progressEl.innerHTML = renderOnboardingProgress(model);

    const contentEl = document.getElementById('guidedOnboardingContent');
    if (contentEl) {
      const previousManual = contentEl.querySelector?.('[data-manual-subjects-mount]');
      if (previousManual) unmountPreact(previousManual);
      contentEl.innerHTML = renderOnboardingContent(model, {
        escapeHtml,
        escapeAttr,
        formatMinutes: formatPlanMinutes,
      });
      if (model.current.id === 'content' && manualOpen) {
        const mount = document.createElement('div');
        mount.setAttribute('data-manual-subjects-mount', '');
        contentEl.appendChild(mount);
        const renderManual = () => mountPreact(h(ManualSubjects, {
          drafts: manualDrafts,
          onChange: (drafts: ManualSubjectDraft[]) => {
            manualDrafts = drafts;
            renderManual();
            syncGuidedNext(onboardingModel());
          },
        }), mount);
        renderManual();
      }
      if (model.current.id === 'content' && pasteSyllabusOpen) {
        const mount = document.createElement('div');
        mount.className = 'guided-paste-syllabus-box grid gap-3 border-t border-border-default pt-3 mt-3';
        mount.innerHTML = `
          <label for="guidedPasteSyllabusText" class="font-medium text-sm text-content-primary">
            Cole o texto do edital copiado do PDF:
          </label>
          <textarea id="guidedPasteSyllabusText" rows="6" class="w-full text-xs p-2.5 rounded-default border border-border-default bg-surface-card text-content-primary font-mono focus:border-brand focus:ring-1 focus:ring-brand" placeholder="Exemplo:&#10;LÍNGUA PORTUGUESA:&#10;1. Compreensão de texto.&#10;2. Ortografia.&#10;DIREITO CONSTITUCIONAL:&#10;1. Direitos Fundamentais..."></textarea>
          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="btn small" data-guided-action="parse-syllabus-submit">Interpretar e Carregar</button>
            <button type="button" class="btn ghost small" data-guided-action="parse-syllabus-cancel">Cancelar</button>
          </div>
        `;
        contentEl.appendChild(mount);
      }
    }
    const helpEl = document.getElementById('guidedOnboardingHelp');
    if (helpEl) {
      helpEl.innerHTML = renderOnboardingHelp(model, {
        escapeHtml,
      });
    }
    const actionsEl = document.getElementById('guidedOnboardingActions');
    if (actionsEl) {
      actionsEl.innerHTML = renderOnboardingActions(model);
    }
    const manualBanner = document.getElementById('guidedManualReturn');
    if (manualBanner) {
      manualBanner.hidden = !uiState.onboarding.manualReturn;
      const returnBtn = manualBanner.querySelector?.(
        '[data-guided-manual-return]'
      ) as HTMLButtonElement | null;
      if (returnBtn) returnBtn.disabled = !model.hasContent;
    }
  }

  function moveOnboarding(direction: number) {
    const uiState = getUiState();
    const model = onboardingModel();
    const index = Math.max(0, Math.min(model.steps.length - 1, model.currentIndex + direction));
    uiState.onboarding.currentStep = model.steps[index].id;
    renderGuidedOnboarding();
  }

  async function openGuidedOnboarding({ step = null }: { step?: string | null } = {}) {
    try {
      await ensureExamCatalog();
      const uiState = getUiState();
      const model = onboardingModel();
      uiState.onboarding.previousFocus = document.activeElement as HTMLElement;
      uiState.onboarding.open = true;
      uiState.onboarding.manualReturn = false;
      uiState.onboarding.currentStep = step || model.next?.id || model.current.id;
      document.body.classList.add('onboarding-open');
      renderGuidedOnboarding();
      requestFrame(() => document.getElementById('guidedOnboardingClose')?.focus());
    } catch (error: any) {
      showToast(error.message || 'Não foi possível abrir a configuração inicial.');
    }
  }

  function suspendGuidedOnboarding() {
    const uiState = getUiState();
    uiState.onboarding.open = false;
    renderGuidedOnboarding();
  }

  function resumeGuidedOnboarding(step = 'content') {
    const uiState = getUiState();
    const model = onboardingModel();
    uiState.onboarding.currentStep = step === 'plan' && !model.hasContent ? 'content' : step;
    uiState.onboarding.open = true;
    document.body.classList.add('onboarding-open');
    renderGuidedOnboarding();
    requestFrame(() => document.getElementById('guidedOnboardingClose')?.focus());
  }

  function closeGuidedOnboarding({ manual = false }: { manual?: boolean } = {}) {
    const uiState = getUiState();
    const previousFocus = uiState.onboarding.previousFocus;
    uiState.onboarding.open = false;
    uiState.onboarding.dismissedForSession = !manual;
    uiState.onboarding.manualReturn = manual;
    document.body.classList.remove('onboarding-open');
    renderGuidedOnboarding();
    syncModalShell();
    const focusTarget = previousFocus?.isConnected
      ? previousFocus
      : document.querySelector<HTMLElement>('#overviewNextAction [data-guided-action="open"], #guidedOnboarding [data-guided-action="open"]');
    (focusTarget?.getClientRects?.().length
      ? focusTarget
      : document.getElementById('tab-dashboard')
    )?.focus?.();
    uiState.onboarding.previousFocus = null;
  }

  function setGuidedSubjectLevel(
    subjectId: string,
    level: string,
    { refresh = true }: { refresh?: boolean } = {}
  ) {
    if (!difficultyOptions.includes(level)) return;
    const subject = getSubjectById(subjectId);
    if (!subject) return;
    for (const topic of (subject.topics || []).filter((item: any) => !item.archived)) {
      subjectService.updateTopic(subjectId, topic.id, {
        ...topic,
        difficulty: level,
        estimatedStudyMinutes:
          topic.estimatedStudyMinutes ?? (level === 'Difícil' ? 120 : level === 'Fácil' ? 45 : 75),
        fieldOrigins: { ...(topic.fieldOrigins || {}), difficulty: 'manual' },
      });
    }
    if (refresh) persistAndRender();
    else scheduleSave();
  }

  function applyGuidedEffortDefaults() {
    for (const subject of activeSubjects()) {
      for (const topic of (subject.topics || []).filter((item: any) => !item.archived)) {
        if (topic.estimatedStudyMinutes == null) {
          topic.estimatedStudyMinutes =
            topic.difficulty === 'Difícil' ? 120 : topic.difficulty === 'Fácil' ? 45 : 75;
        }
      }
    }
  }

  function loadStarterPack(pack: StarterPack) {
    const state = getState();
    const newSubjects = pack.subjects.map((subj, sIdx) => {
      const subjectId = `subj-${Date.now()}-${sIdx}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        id: subjectId,
        name: subj.name,
        archived: false,
        topics: subj.topics.map((top, tIdx) => ({
          id: `top-${Date.now()}-${sIdx}-${tIdx}-${Math.random().toString(36).slice(2, 7)}`,
          name: top.name,
          difficulty: top.difficulty || 'Médio',
          estimatedStudyMinutes: top.estimatedStudyMinutes || 60,
          status: 'Não iniciado',
          archived: false,
        })),
      };
    });

    state.subjects = [...(state.subjects || []), ...newSubjects];
    calculateStudyPlanPreview();
    persistAndRender();
    renderGuidedOnboarding();
    showToast(`Pacote "${pack.name}" carregado com sucesso!`);
  }

  function createGuidedInitialPlan() {
    if (!onboardingModel().canCreatePlan) return;
    const uiState = getUiState();
    applyGuidedEffortDefaults();
    calculateStudyPlanPreview();
    const preview = getStudyPlanPreview();
    if (!preview || preview.state === 'insufficient' || !preview.items?.length) {
      uiState.onboarding.currentStep = 'plan';
      renderGuidedOnboarding();
      showToast('Confira os dados indicados antes de confirmar o plano.');
      return;
    }
    confirmStudyPlan();
    calculateDailyPlanPreview();
    const dailyPreview = getDailyPlanPreview();
    if (dailyPreview?.state === 'proposal') confirmDailyPlanPreview();
    uiState.onboarding.currentStep = 'plan';
    uiState.onboarding.open = false;
    document.body.classList.remove('onboarding-open');
    renderGuidedOnboarding();
    render();
    activateTab('hoje');
    showToast(
      'Parabéns! Seu plano semanal está pronto. Demos o pontapé inicial na sua meta de hoje.'
    );
    requestFrame(() => document.querySelector<HTMLElement>('#planoHojeContent .btn')?.focus());
  }

  function handleOverlayClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const dateOffsetBtn = target.closest<HTMLElement>('[data-guided-date-offset]');
    if (dateOffsetBtn) {
      const offset = Number(dateOffsetBtn.dataset.guidedDateOffset) || 0;
      const input = document.getElementById('guidedExamDate') as HTMLInputElement | null;
      if (input) {
        const today = input.min || todayISO();
        input.value = applyOnboardingDateShortcut(today, offset);
        deps.updateExamBlueprint?.('examDate', input.value, { refresh: false });
        const buttons = document.querySelectorAll('[data-guided-date-offset]');
        buttons.forEach((b: any) => {
          const active = (b as HTMLElement).dataset.guidedDateOffset === String(offset);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        syncGuidedNext(onboardingModel());
      }
      return;
    }

    const routinePresetBtn = target.closest<HTMLElement>('[data-guided-availability-preset]');
    if (routinePresetBtn) {
      const presetId = routinePresetBtn.dataset.guidedAvailabilityPreset;
      const preset = AVAILABILITY_PRESETS.find(p => p.id === presetId);
      if (preset) {
        for (let day = 0; day <= 6; day++) {
          const hours = preset.hoursByDay[String(day)] ?? 0;
          deps.updateMetaHoursDay?.(String(day), String(hours), { refresh: false });
          const input = document.querySelector<HTMLInputElement>(`[data-guided-day="${day}"]`);
          if (input) input.value = String(hours);
        }
        const customization = document.getElementById(
          'guidedAvailabilityDetails'
        ) as HTMLDetailsElement | null;
        if (customization) customization.open = false;
        const buttons = document.querySelectorAll('[data-guided-availability-preset]');
        buttons.forEach((b: any) => {
          const active = (b as HTMLElement).dataset.guidedAvailabilityPreset === presetId;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        const model = onboardingModel();
        syncGuidedNext(model);
        const cap = document.querySelector('#guidedOnboardingContent .guided-capacity strong');
        if (cap) cap.textContent = formatPlanMinutes(model.availableMinutes);
      }
      return;
    }

    const bulkLevelBtn = target.closest<HTMLElement>('[data-guided-bulk-level]');
    if (bulkLevelBtn) {
      const level = bulkLevelBtn.dataset.guidedBulkLevel;
      if (level) {
        const selects = document.querySelectorAll('[data-guided-level]');
        selects.forEach((select: any) => {
          select.value = level;
          const subjectId = select.dataset.guidedLevel;
          if (subjectId) {
            setGuidedSubjectLevel(subjectId, level, { refresh: false });
          }
        });
        showToast(`Todas as disciplinas definidas como ${level}.`);
      }
      return;
    }

    const starterPackBtn = target.closest<HTMLElement>('[data-guided-starter-pack]');
    if (starterPackBtn) {
      const packId = starterPackBtn.dataset.guidedStarterPack;
      const pack = findStarterPackById(packId || '');
      if (pack) {
        loadStarterPack(pack);
      }
      return;
    }

    const action = target.closest<HTMLElement>('[data-guided-action]')?.dataset.guidedAction;
    if (!action) return;
    if (action === 'cancel') closeGuidedOnboarding();
    if (action === 'back') moveOnboarding(-1);
    if (action === 'next') {
      const model = onboardingModel();
      if (onboardingBlockedReason(model)) return;
      if (model.current.id === 'content' && manualDrafts.length) {
        if (!subjectService.create || !subjectService.addTopic || !subjectService.remove) {
          showToast('Não foi possível adicionar as disciplinas.');
          return;
        }
        const created: string[] = [];
        try {
          for (const draft of manualDrafts) {
            const subject = subjectService.create(draft.name.trim());
            if (!subject?.id) throw new Error('Disciplina não criada.');
            created.push(subject.id);
            for (const name of draft.topics)
              if (!subjectService.addTopic(subject.id, { name: name.trim() }))
                throw new Error('Tópico não criado.');
          }
        } catch {
          created.forEach(id => subjectService.remove?.(id));
          showToast('Não foi possível adicionar as matérias. Revise e tente novamente.');
          return;
        }
        manualDrafts = [];
        manualOpen = false;
        scheduleSave();
      }
      moveOnboarding(1);
    }
    if (action === 'rest-sunday') {
      const state = getState();
      const currentHours = state.metas?.horasPorDia || {};
      const newHours = applySundayRestDay(currentHours);
      for (let day = 0; day <= 6; day++) {
        const h = newHours[String(day)] ?? 0;
        deps.updateMetaHoursDay?.(String(day), String(h), { refresh: false });
        const input = document.querySelector<HTMLInputElement>(`[data-guided-day="${day}"]`);
        if (input) input.value = String(h);
      }
      const model = onboardingModel();
      syncGuidedNext(model);
      renderGuidedOnboarding();
      showToast('Domingo definido como dia de folga.');
      return;
    }
    if (action === 'import' && deps.openExamImport) {
      deps.openExamImport(getUiState().onboarding.presetId, 'onboarding');
    }
    if (action === 'paste-syllabus') {
      pasteSyllabusOpen = true;
      manualOpen = false;
      renderGuidedOnboarding();
      document.getElementById('guidedPasteSyllabusText')?.focus();
      return;
    }
    if (action === 'parse-syllabus-submit') {
      const textarea = document.getElementById('guidedPasteSyllabusText') as HTMLTextAreaElement | null;
      const text = textarea?.value || '';
      if (!text.trim()) {
        showToast('Cole o texto do edital antes de interpretar.');
        return;
      }
      const parsed = parseRawSyllabusText(text);
      if (!parsed.subjects.length) {
        showToast('Nenhuma disciplina identificada. Verifique se os títulos de matérias estão no texto.');
        return;
      }
      manualDrafts = parsed.subjects.map(s => ({
        name: s.name,
        topics: s.topics.map(t => t.name),
      }));
      pasteSyllabusOpen = false;
      manualOpen = true;
      renderGuidedOnboarding();
      showToast(`${parsed.totalSubjects} disciplinas e ${parsed.totalTopics} tópicos extraídos! Revise abaixo.`);
      return;
    }
    if (action === 'parse-syllabus-cancel') {
      pasteSyllabusOpen = false;
      renderGuidedOnboarding();
      return;
    }
    if (action === 'structured' && deps.onStructuredImport) {
      deps.onStructuredImport();
    }
    if (action === 'manual') {
      if (onboardingModel().current.id === 'content') {
        manualOpen = true;
        if (!manualDrafts.length) manualDrafts = [{ name: '', topics: [''] }];
        renderGuidedOnboarding();
        document.querySelector<HTMLElement>('[data-manual-subjects-mount] input')?.focus();
      } else {
        closeGuidedOnboarding({ manual: true });
        activateTab('disciplinas');
        document.getElementById('addSubjectBtn')?.focus();
      }
    }
    if (action === 'availability') {
      getUiState().onboarding.currentStep = 'availability';
      renderGuidedOnboarding();
    }
    if (action === 'create-plan') createGuidedInitialPlan();
    if (action === 'explore-no-plan') {
      closeGuidedOnboarding();
      activateTab('hoje');
      showToast('Você pode informar a data depois em Planejamento. Nenhum plano foi criado.');
      return;
    }
    if (['back', 'next', 'availability'].includes(action)) {
      document.getElementById('guidedOnboardingClose')?.focus();
    }
  }

  function handleOverlayKeydown(event: KeyboardEvent | any) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeGuidedOnboarding();
    }
  }

  function bindEvents() {
    if (mountNode) {
      syncGuidedModal(false);
    }
    const overlay = document.getElementById('guidedOnboardingOverlay');
    if (overlay) {
      overlay.addEventListener('click', handleOverlayClick);
      if (!mountNode) {
        overlay.addEventListener('keydown', handleOverlayKeydown);
      }
      overlay.addEventListener('change', (event: any) => {
        const target = event.target as HTMLElement;
        if (target?.id === 'guidedExamPreset') {
          const ui = getUiState();
          if (ui.onboarding) {
            ui.onboarding.presetId = (target as HTMLInputElement).value;
            renderGuidedOnboarding();
          }
          return;
        }
        if (target?.id === 'guidedCustomExamName') {
          const customName = (target as HTMLInputElement).value;
          deps.updateExamBlueprint?.('customTitle', customName, { refresh: false });
          return;
        }
        if (target?.id === 'guidedExamDate') {
          deps.updateExamBlueprint?.('examDate', (target as HTMLInputElement).value, {
            refresh: false,
          });
          syncGuidedNext(onboardingModel());
          return;
        }
        if (target?.dataset?.guidedDay !== undefined) {
          deps.updateMetaHoursDay?.(target.dataset.guidedDay, (target as HTMLInputElement).value, {
            refresh: false,
          });
          const model = onboardingModel();
          syncGuidedNext(model);
          const cap = document.querySelector('#guidedOnboardingContent .guided-capacity strong');
          if (cap) cap.textContent = formatPlanMinutes(model.availableMinutes);
          return;
        }
        if (target?.dataset?.guidedLevel) {
          setGuidedSubjectLevel(target.dataset.guidedLevel, (target as HTMLInputElement).value, {
            refresh: false,
          });
        }
      });
    }
    if (!mountNode) {
      document
        .getElementById('guidedOnboardingClose')
        ?.addEventListener('click', () => closeGuidedOnboarding());
    }
    // Boas-vindas (Visão geral) e cartão de configuração abrem o mesmo assistente.
    for (const id of ['overviewNextAction', 'guidedOnboarding'])
      document.getElementById(id)?.addEventListener('click', (event: any) => {
        if ((event.target as HTMLElement)?.closest('[data-guided-action="open"]'))
          openGuidedOnboarding();
      });
  }

  return {
    onboardingModel,
    syncGuidedNext,
    renderGuidedOnboarding,
    moveOnboarding,
    openGuidedOnboarding,
    suspendGuidedOnboarding,
    resumeGuidedOnboarding,
    closeGuidedOnboarding,
    setGuidedSubjectLevel,
    applyGuidedEffortDefaults,
    createGuidedInitialPlan,
    handleOverlayClick,
    handleOverlayKeydown,
    bindEvents,
  };
}
