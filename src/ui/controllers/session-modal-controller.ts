/**
 * Controlador de interface do modal de registro e conclusão de sessão de estudo.
 *
 * Gerencia o preenchimento de seletores de disciplinas/tópicos, alternância
 * de campos dinâmicos por tipo de atividade e manipulação visual do ponto de parada (bookmark).
 *
 * Camada: UI Controller.
 */

import { h } from 'preact';
import { SESSION_BOOKMARK_FIELDS } from '../../application/sessions/timer-coordinator.js';
import { mountPreact } from '../preact-mount.js';
import type { SelectOption } from '../primitives/select-field.js';
import { SessionModalSheet, type SessionBookmarkViewState } from '../modals/SessionModalSheet.js';

export interface ModalDocumentLike {
  getElementById(id: string): any;
  querySelectorAll(selector: string): any;
}

export interface SessionModalControllerOptions {
  document: ModalDocumentLike | Document;
  formatTimer: (seconds: number) => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  getSubjectById: (id: string) => any;
  getTopicById: (id: string) => any;
  subjectsForSelection: (
    currentSubjectId: string | null | undefined
  ) => Array<{ id: string; name: string; archived?: boolean }>;
  topicsForSelection: (subject: any, currentTopicId: any) => Array<{ id: string; name: string }>;
  onDismiss?: () => void;
  onDiscard?: () => void;
  onSave?: (formValues: SessionFormValues) => void;
}

export interface SessionFormValues {
  subjectId: string | null;
  topicId: string | null;
  type: string;
  resolved: number;
  correct: number;
  perceivedRetention: string | null;
  perceivedDifficulty: string | null;
  focusLevel: string | null;
  energyLevel: string | null;
  notes: string;
  durationMinutes?: number | null;
  pagesRead?: number | null;
  videoBlocksCompleted?: number | null;
  endUnit?: number | null;
}

export interface SessionModalEventHandlers {
  onSkip?: () => void;
  onDismiss?: () => void;
  onSave?: (formValues: SessionFormValues) => void;
}

export interface SessionModalShowOptions {
  durationMinutes?: string;
}

export interface SessionModalHideOptions {
  restoreFocus?: boolean;
}

const ACTIVITY_HINTS: Record<string, string> = {
  study: 'Registre o que você estudou e atualize seus indicadores.',
  questions: 'Informe volume e acertos para atualizar seu desempenho.',
  review: 'Registre como recuperou o conteúdo; esse sinal ajuda a acompanhar a retenção.',
  simulation: 'O tempo será salvo e, em seguida, você poderá registrar o resultado do simulado.',
};

export function createSessionModalController(opts: SessionModalControllerOptions) {
  const {
    document,
    formatTimer,
    escapeHtml,
    escapeAttr,
    getSubjectById,
    getTopicById,
    subjectsForSelection,
    topicsForSelection,
  } = opts;

  const mountNode =
    typeof globalThis.document !== 'undefined' &&
    document === globalThis.document &&
    typeof (document as Document).createElement === 'function'
      ? document.getElementById('sessionModalMount')
      : null;

  let boundHandlers: SessionModalEventHandlers = {};

  function emptyBookmarkState(): SessionBookmarkViewState {
    return {
      hidden: true,
      open: false,
      clearMarked: false,
      clearBtnHidden: true,
      resourceType: 'pdf',
      label: '',
      currentUnit: '',
      totalUnits: '',
      positionText: '',
    };
  }

  const viewState = {
    open: false,
    sessionKey: 0,
    restoreFocusOnClose: true,
    activityHint: 'Confira a disciplina, o tópico e a duração calculada para salvar o lançamento.',
    durationFormatted: '00:00',
    durationMinutesValue: '',
    durationMinutesPlaceholder: 'Min',
    subjectOptions: [{ value: '', label: 'Sem disciplina específica' }] as SelectOption[],
    topicOptions: [{ value: '', label: 'Sem tópico específico' }] as SelectOption[],
    subjectId: '',
    topicId: '',
    activityType: 'study',
    resolvedValue: '',
    correctValue: '',
    pagesReadValue: '',
    videoBlocksValue: '',
    difficultyValue: '',
    retentionValue: '',
    focusValue: '',
    energyValue: '',
    optionalOpen: false,
    notesValue: '',
    bookmark: emptyBookmarkState(),
  };

  function buildSubjectOptions(currentSubjectId: string): SelectOption[] {
    return [
      { value: '', label: 'Sem disciplina específica' },
      ...subjectsForSelection(currentSubjectId).map(s => ({
        value: s.id,
        label: `${s.name}${s.archived ? ' (arquivada)' : ''}`,
      })),
    ];
  }

  function buildTopicOptions(
    subjectId: string,
    selectedTopicId: string | null = null
  ): SelectOption[] {
    const subject = getSubjectById(subjectId);
    return [
      { value: '', label: 'Sem tópico específico' },
      ...(subject
        ? topicsForSelection(subject, selectedTopicId).map((topic: any) => ({
            value: topic.id,
            label: topic.name || '(tópico sem nome)',
          }))
        : []),
    ];
  }

  function buildBookmarkState(topicId: string): SessionBookmarkViewState {
    const bookmark = topicId ? getTopicById(topicId)?.topic?.bookmark : null;
    return {
      hidden: !topicId,
      open: Boolean(bookmark),
      clearMarked: false,
      clearBtnHidden: !bookmark,
      resourceType: String((bookmark as Record<string, any> | null)?.resourceType ?? 'pdf'),
      label: String((bookmark as Record<string, any> | null)?.label ?? ''),
      currentUnit:
        (bookmark as Record<string, any> | null)?.currentUnit != null
          ? String((bookmark as Record<string, any>).currentUnit)
          : '',
      totalUnits:
        (bookmark as Record<string, any> | null)?.totalUnits != null
          ? String((bookmark as Record<string, any>).totalUnits)
          : '',
      positionText: String((bookmark as Record<string, any> | null)?.positionText ?? ''),
    };
  }

  function syncDialogElement(isOpen: boolean): void {
    if (!mountNode) return;
    const dialog = document.getElementById('sessionModalOverlay') as HTMLDialogElement | null;
    if (!dialog) return;
    if (isOpen && !dialog.open && typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else if (!isOpen && dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    }
  }

  function syncDomInputsToViewState(): void {
    if (!mountNode) return;
    const readVal = (id: string) =>
      (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value;
    const durMin = readVal('sessionModalDurationMinutes');
    if (durMin !== undefined) viewState.durationMinutesValue = durMin;
    const resolved = readVal('sessionModalResolved');
    if (resolved !== undefined) viewState.resolvedValue = resolved;
    const correct = readVal('sessionModalCorrect');
    if (correct !== undefined) viewState.correctValue = correct;
    const pagesRead = readVal('sessionModalPagesRead');
    if (pagesRead !== undefined) viewState.pagesReadValue = pagesRead;
    const videoBlocks = readVal('sessionModalVideoBlocks');
    if (videoBlocks !== undefined) viewState.videoBlocksValue = videoBlocks;
    const notes = readVal('sessionModalNotes');
    if (notes !== undefined) viewState.notesValue = notes;
    const bmLabel = readVal('sessionBookmarkLabel');
    if (bmLabel !== undefined) viewState.bookmark.label = bmLabel;
    const bmCurrent = readVal('sessionBookmarkCurrent');
    if (bmCurrent !== undefined) viewState.bookmark.currentUnit = bmCurrent;
    const bmTotal = readVal('sessionBookmarkTotal');
    if (bmTotal !== undefined) viewState.bookmark.totalUnits = bmTotal;
    const bmPos = readVal('sessionBookmarkPosition');
    if (bmPos !== undefined) viewState.bookmark.positionText = bmPos;
  }

  function renderDeclarativeSheet(): void {
    if (!mountNode) return;
    mountPreact(
      h(SessionModalSheet, {
        open: viewState.open,
        sessionKey: viewState.sessionKey,
        restoreFocusOnClose: viewState.restoreFocusOnClose,
        activityHint: viewState.activityHint,
        durationFormatted: viewState.durationFormatted,
        durationMinutesValue: viewState.durationMinutesValue,
        durationMinutesPlaceholder: viewState.durationMinutesPlaceholder,
        subjectOptions: viewState.subjectOptions,
        topicOptions: viewState.topicOptions,
        subjectId: viewState.subjectId,
        topicId: viewState.topicId,
        activityType: viewState.activityType,
        resolvedValue: viewState.resolvedValue,
        correctValue: viewState.correctValue,
        pagesReadValue: viewState.pagesReadValue,
        videoBlocksValue: viewState.videoBlocksValue,
        difficultyValue: viewState.difficultyValue,
        retentionValue: viewState.retentionValue,
        focusValue: viewState.focusValue,
        energyValue: viewState.energyValue,
        optionalOpen: viewState.optionalOpen,
        notesValue: viewState.notesValue,
        bookmark: { ...viewState.bookmark },
        onDurationMinutesChange: value => {
          viewState.durationMinutesValue = value;
          const numericVal = Number(value);
          if (Number.isFinite(numericVal) && numericVal > 0) {
            viewState.durationFormatted = formatTimer(Math.min(720, Math.round(numericVal)) * 60);
          }
          renderDeclarativeSheet();
        },
        onSubjectChange: nextSubjectId => {
          viewState.subjectId = nextSubjectId;
          viewState.topicId = '';
          viewState.topicOptions = buildTopicOptions(nextSubjectId, null);
          viewState.bookmark = buildBookmarkState('');
          renderDeclarativeSheet();
        },
        onTopicChange: nextTopicId => {
          viewState.topicId = nextTopicId;
          viewState.bookmark = buildBookmarkState(nextTopicId);
          renderDeclarativeSheet();
        },
        onActivityTypeChange: nextType => {
          viewState.activityType = nextType || 'study';
          viewState.activityHint = ACTIVITY_HINTS[viewState.activityType] || ACTIVITY_HINTS.study;
          renderDeclarativeSheet();
        },
        onResolvedChange: value => {
          viewState.resolvedValue = value;
        },
        onCorrectChange: value => {
          viewState.correctValue = value;
        },
        onPagesReadChange: value => {
          viewState.pagesReadValue = value;
        },
        onVideoBlocksChange: value => {
          viewState.videoBlocksValue = value;
        },
        onDifficultyChange: value => {
          viewState.difficultyValue = value;
          renderDeclarativeSheet();
        },
        onRetentionChange: value => {
          viewState.retentionValue = value;
          renderDeclarativeSheet();
        },
        onFocusChange: value => {
          viewState.focusValue = value;
          renderDeclarativeSheet();
        },
        onEnergyChange: value => {
          viewState.energyValue = value;
          renderDeclarativeSheet();
        },
        onOptionalToggle: isOpen => {
          viewState.optionalOpen = isOpen;
        },
        onNotesChange: value => {
          viewState.notesValue = value;
        },
        onBookmarkFieldChange: (field, value) => {
          viewState.bookmark[field] = value;
          if (field === 'resourceType') renderDeclarativeSheet();
        },
        onBookmarkToggle: isOpen => {
          viewState.bookmark.open = isOpen;
        },
        onBookmarkClear: () => {
          clearSessionBookmarkFields();
        },
        onSkip: () => boundHandlers.onSkip?.(),
        onDismiss: () => boundHandlers.onDismiss?.(),
        onSave: () => boundHandlers.onSave?.(readFormValues()),
      }),
      mountNode
    );
    syncDialogElement(viewState.open);
  }

  function populateSessionTopicSelect(subjectId: string, selectedTopicId: string | null = null) {
    if (mountNode) {
      viewState.topicOptions = buildTopicOptions(subjectId, selectedTopicId);
      if (selectedTopicId !== null) {
        viewState.topicId = selectedTopicId;
      }
      renderDeclarativeSheet();
      return;
    }
    const select = document.getElementById('sessionModalTopic') as HTMLSelectElement | null;
    if (!select) return;
    const subject = getSubjectById(subjectId);
    select.innerHTML =
      `<option value="">Sem tópico específico</option>` +
      (subject
        ? topicsForSelection(subject, selectedTopicId)
            .map(
              (topic: any) =>
                `<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name || '(tópico sem nome)')}</option>`
            )
            .join('')
        : '');
  }

  function fillSessionBookmarkFields(topicId: string) {
    if (mountNode) {
      viewState.bookmark = buildBookmarkState(topicId);
      renderDeclarativeSheet();
      return;
    }
    const section = document.getElementById('sessionBookmarkSection') as HTMLDetailsElement | null;
    if (!section) return;
    const bookmark = topicId ? getTopicById(topicId)?.topic?.bookmark : null;
    section.hidden = !topicId;
    section.open = Boolean(bookmark);
    delete section.dataset.clear;
    for (const [field, id] of Object.entries(SESSION_BOOKMARK_FIELDS)) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) {
        el.value =
          (bookmark as Record<string, any> | null)?.[field] ??
          (field === 'resourceType' ? 'pdf' : '');
      }
    }
    const clear = document.getElementById('sessionBookmarkClearBtn') as HTMLButtonElement | null;
    if (clear) {
      clear.hidden = !bookmark;
      clear.disabled = false;
      clear.textContent = 'Limpar ponto de parada';
    }
  }

  function clearSessionBookmarkFields() {
    if (mountNode) {
      viewState.bookmark.clearMarked = true;
      viewState.bookmark.label = '';
      viewState.bookmark.currentUnit = '';
      viewState.bookmark.totalUnits = '';
      viewState.bookmark.positionText = '';
      renderDeclarativeSheet();
      return;
    }
    const section = document.getElementById('sessionBookmarkSection') as HTMLDetailsElement | null;
    const clear = document.getElementById('sessionBookmarkClearBtn') as HTMLButtonElement | null;
    if (section) section.dataset.clear = '1';
    for (const [field, id] of Object.entries(SESSION_BOOKMARK_FIELDS)) {
      if (field !== 'resourceType') {
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) el.value = '';
      }
    }
    if (clear) {
      clear.disabled = true;
      clear.textContent = 'Será removido ao salvar';
    }
  }

  function syncSessionModalActivityFields(type = 'study') {
    if (mountNode) {
      viewState.activityType = type || 'study';
      viewState.activityHint = ACTIVITY_HINTS[viewState.activityType] || ACTIVITY_HINTS.study;
      renderDeclarativeSheet();
      return;
    }
    const hint = document.getElementById('sessionModalActivityHint');
    if (hint) {
      hint.textContent = ACTIVITY_HINTS[type] || ACTIVITY_HINTS.study;
    }
    document.querySelectorAll('[data-session-fields]').forEach((section: any) => {
      section.hidden = !section.dataset.sessionFields!.split(/\s+/).includes(type);
    });
  }

  function show(
    timerSeconds: number,
    activeTimer: Record<string, any>,
    showOptions: SessionModalShowOptions = {}
  ) {
    if (mountNode) {
      viewState.sessionKey += 1;
      viewState.open = true;
      viewState.restoreFocusOnClose = true;
      viewState.durationFormatted = formatTimer(timerSeconds);
      viewState.durationMinutesPlaceholder = String(Math.max(1, Math.round(timerSeconds / 60)));
      viewState.durationMinutesValue = showOptions.durationMinutes ?? '';
      const subjectId = String(activeTimer.subjectId || '');
      const topicId = String(activeTimer.topicId || '');
      viewState.subjectOptions = buildSubjectOptions(subjectId);
      viewState.subjectId = subjectId;
      viewState.topicOptions = buildTopicOptions(subjectId, activeTimer.topicId || null);
      viewState.topicId = topicId;
      viewState.activityType = String(activeTimer.type || 'study');
      viewState.activityHint = ACTIVITY_HINTS[viewState.activityType] || ACTIVITY_HINTS.study;
      viewState.resolvedValue = '';
      viewState.correctValue = '';
      viewState.pagesReadValue = '';
      viewState.videoBlocksValue = '';
      viewState.difficultyValue = '';
      viewState.retentionValue = '';
      viewState.focusValue = '';
      viewState.energyValue = '';
      viewState.optionalOpen = false;
      viewState.notesValue = '';
      viewState.bookmark = buildBookmarkState(topicId);
      renderDeclarativeSheet();
      return;
    }

    const overlay = document.getElementById('sessionModalOverlay');
    const durationEl = document.getElementById('sessionModalDuration');
    if (durationEl) durationEl.textContent = formatTimer(timerSeconds);
    const durationMinutesInput = document.getElementById(
      'sessionModalDurationMinutes'
    ) as HTMLInputElement | null;
    if (durationMinutesInput) {
      durationMinutesInput.value = showOptions.durationMinutes ?? '';
      durationMinutesInput.placeholder = String(Math.max(1, Math.round(timerSeconds / 60)));
    }

    const sel = document.getElementById('sessionModalSubject') as HTMLSelectElement | null;
    if (sel) {
      sel.innerHTML =
        `<option value="">Sem disciplina específica</option>` +
        subjectsForSelection(activeTimer.subjectId)
          .map(
            s =>
              `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}${s.archived ? ' (arquivada)' : ''}</option>`
          )
          .join('');
      sel.value = activeTimer.subjectId || '';
    }

    const currentSubjectId = sel ? sel.value : activeTimer.subjectId || '';
    populateSessionTopicSelect(currentSubjectId, activeTimer.topicId);

    const topicSel = document.getElementById('sessionModalTopic') as HTMLSelectElement | null;
    if (topicSel) topicSel.value = activeTimer.topicId || '';

    const typeSel = document.getElementById('sessionModalType') as HTMLSelectElement | null;
    if (typeSel) typeSel.value = activeTimer.type || 'study';

    const resolvedInput = document.getElementById(
      'sessionModalResolved'
    ) as HTMLInputElement | null;
    if (resolvedInput) resolvedInput.value = '';

    const correctInput = document.getElementById('sessionModalCorrect') as HTMLInputElement | null;
    if (correctInput) correctInput.value = '';

    const pagesInput = document.getElementById('sessionModalPagesRead') as HTMLInputElement | null;
    if (pagesInput) pagesInput.value = '';

    const videoInput = document.getElementById(
      'sessionModalVideoBlocks'
    ) as HTMLInputElement | null;
    if (videoInput) videoInput.value = '';

    const retSel = document.getElementById('sessionModalRetention') as HTMLSelectElement | null;
    if (retSel) retSel.value = '';

    const diffSel = document.getElementById('sessionModalDifficulty') as HTMLSelectElement | null;
    if (diffSel) diffSel.value = '';

    const focusSel = document.getElementById('sessionModalFocus') as HTMLSelectElement | null;
    if (focusSel) focusSel.value = '';

    const energySel = document.getElementById('sessionModalEnergy') as HTMLSelectElement | null;
    if (energySel) energySel.value = '';

    const notesArea = document.getElementById('sessionModalNotes') as HTMLTextAreaElement | null;
    if (notesArea) notesArea.value = '';

    syncSessionModalActivityFields(typeSel ? typeSel.value : 'study');
    fillSessionBookmarkFields(topicSel ? topicSel.value : '');

    if (overlay) overlay.classList.add('show');
  }

  function hide(hideOptions: SessionModalHideOptions = {}) {
    if (mountNode) {
      syncDomInputsToViewState();
      viewState.restoreFocusOnClose = hideOptions.restoreFocus ?? true;
      viewState.open = false;
      renderDeclarativeSheet();
      return;
    }
    const overlay = document.getElementById('sessionModalOverlay');
    if (overlay) overlay.classList.remove('show');
  }

  function reopen() {
    if (mountNode) {
      syncDomInputsToViewState();
      viewState.restoreFocusOnClose = true;
      viewState.open = true;
      renderDeclarativeSheet();
      return;
    }
    const overlay = document.getElementById('sessionModalOverlay');
    if (overlay) overlay.classList.add('show');
  }

  function readFormValues(): SessionFormValues {
    const subjectId =
      (document.getElementById('sessionModalSubject') as HTMLSelectElement | null)?.value || null;
    const topicId =
      (document.getElementById('sessionModalTopic') as HTMLSelectElement | null)?.value || null;
    const type =
      (document.getElementById('sessionModalType') as HTMLSelectElement | null)?.value || 'study';
    const resolved =
      Number((document.getElementById('sessionModalResolved') as HTMLInputElement | null)?.value) ||
      0;
    const correct =
      Number((document.getElementById('sessionModalCorrect') as HTMLInputElement | null)?.value) ||
      0;
    const perceivedRetention =
      (document.getElementById('sessionModalRetention') as HTMLSelectElement | null)?.value || null;
    const perceivedDifficulty =
      (document.getElementById('sessionModalDifficulty') as HTMLSelectElement | null)?.value ||
      null;
    const focusLevel =
      ((document.getElementById('sessionModalFocus') as HTMLSelectElement | null)?.value as any) ||
      null;
    const energyLevel =
      ((document.getElementById('sessionModalEnergy') as HTMLSelectElement | null)?.value as any) ||
      null;
    const notes = (
      (document.getElementById('sessionModalNotes') as HTMLTextAreaElement | null)?.value || ''
    ).trim();
    const rawDurationMinutes = Number(
      (document.getElementById('sessionModalDurationMinutes') as HTMLInputElement | null)?.value
    );
    const durationMinutes =
      Number.isFinite(rawDurationMinutes) && rawDurationMinutes > 0
        ? Math.min(720, Math.round(rawDurationMinutes))
        : null;

    const rawPagesRead = Number(
      (document.getElementById('sessionModalPagesRead') as HTMLInputElement | null)?.value
    );
    const pagesRead =
      Number.isFinite(rawPagesRead) && rawPagesRead > 0 ? Math.floor(rawPagesRead) : null;

    const rawVideoBlocks = Number(
      (document.getElementById('sessionModalVideoBlocks') as HTMLInputElement | null)?.value
    );
    const videoBlocksCompleted =
      Number.isFinite(rawVideoBlocks) && rawVideoBlocks > 0 ? Math.floor(rawVideoBlocks) : null;

    const rawEndUnit = Number(
      (document.getElementById('sessionBookmarkCurrent') as HTMLInputElement | null)?.value
    );
    const endUnit = Number.isFinite(rawEndUnit) && rawEndUnit > 0 ? Math.floor(rawEndUnit) : null;

    return {
      subjectId,
      topicId,
      type,
      resolved,
      correct,
      perceivedRetention,
      perceivedDifficulty,
      focusLevel,
      energyLevel,
      notes,
      durationMinutes,
      pagesRead,
      videoBlocksCompleted,
      endUnit,
    };
  }

  function bindEvents(handlers: SessionModalEventHandlers = {}) {
    if (mountNode) {
      boundHandlers = handlers;
      renderDeclarativeSheet();
      const overlay = document.getElementById('sessionModalOverlay');
      if (overlay && overlay.dataset && !overlay.dataset.dismissBound) {
        overlay.dataset.dismissBound = 'true';
        overlay.addEventListener('session-modal-dismiss', () => {
          boundHandlers.onDismiss?.();
        });
      }
      return;
    }

    document.getElementById('sessionModalSkipBtn')?.addEventListener('click', () => {
      handlers.onSkip?.();
    });

    document
      .getElementById('sessionModalOverlay')
      ?.addEventListener('session-modal-dismiss', () => {
        handlers.onDismiss?.();
      });

    document
      .getElementById('sessionModalSubject')
      ?.addEventListener('change', function (this: any) {
        const val =
          this?.value ??
          (document.getElementById('sessionModalSubject') as HTMLSelectElement | null)?.value ??
          '';
        populateSessionTopicSelect(val);
        fillSessionBookmarkFields('');
      });

    document.getElementById('sessionModalTopic')?.addEventListener('change', function (this: any) {
      const val =
        this?.value ??
        (document.getElementById('sessionModalTopic') as HTMLSelectElement | null)?.value ??
        '';
      fillSessionBookmarkFields(val);
    });

    document.getElementById('sessionBookmarkClearBtn')?.addEventListener('click', () => {
      clearSessionBookmarkFields();
    });

    document.getElementById('sessionModalType')?.addEventListener('change', function (this: any) {
      const val =
        this?.value ??
        (document.getElementById('sessionModalType') as HTMLSelectElement | null)?.value ??
        'study';
      syncSessionModalActivityFields(val);
    });

    document
      .getElementById('sessionModalDurationMinutes')
      ?.addEventListener('input', function (this: any) {
        const val = Number(
          this?.value ??
            (document.getElementById('sessionModalDurationMinutes') as HTMLInputElement | null)
              ?.value
        );
        const durationEl = document.getElementById('sessionModalDuration');
        if (durationEl && Number.isFinite(val) && val > 0) {
          durationEl.textContent = formatTimer(Math.min(720, Math.round(val)) * 60);
        }
      });

    document.getElementById('sessionModalSaveBtn')?.addEventListener('click', () => {
      handlers.onSave?.(readFormValues());
    });

    document
      .getElementById('sessionModalOverlay')
      ?.addEventListener('keydown', (e: KeyboardEvent) => {
        if (
          e.key === 'Enter' &&
          !['TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement)?.tagName)
        ) {
          e.preventDefault();
          handlers.onSave?.(readFormValues());
        }
      });
  }

  return {
    populateSessionTopicSelect,
    fillSessionBookmarkFields,
    clearSessionBookmarkFields,
    syncSessionModalActivityFields,
    show,
    hide,
    reopen,
    readFormValues,
    bindEvents,
  };
}
