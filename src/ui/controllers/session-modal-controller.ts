/**
 * Controlador de interface do modal de registro e conclusão de sessão de estudo.
 *
 * Gerencia o preenchimento de seletores de disciplinas/tópicos, alternância
 * de campos dinâmicos por tipo de atividade e manipulação visual do ponto de parada (bookmark).
 *
 * Camada: UI Controller.
 */

import { SESSION_BOOKMARK_FIELDS } from '../../application/sessions/timer-coordinator.js';

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
}

export interface SessionModalEventHandlers {
  onSkip?: () => void;
  onDismiss?: () => void;
  onSave?: (formValues: SessionFormValues) => void;
}

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

  function populateSessionTopicSelect(subjectId: string, selectedTopicId: string | null = null) {
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
    const labels: Record<string, string> = {
      study: 'Registre o que você estudou e atualize seus indicadores.',
      questions: 'Informe volume e acertos para atualizar seu desempenho.',
      review: 'Registre como recuperou o conteúdo; esse sinal ajuda a acompanhar a retenção.',
      simulation:
        'O tempo será salvo e, em seguida, você poderá registrar o resultado do simulado.',
    };
    const hint = document.getElementById('sessionModalActivityHint');
    if (hint) {
      hint.textContent = labels[type] || labels.study;
    }
    document.querySelectorAll('[data-session-fields]').forEach((section: any) => {
      section.hidden = !section.dataset.sessionFields!.split(/\s+/).includes(type);
    });
  }

  function show(timerSeconds: number, activeTimer: Record<string, any>) {
    const overlay = document.getElementById('sessionModalOverlay');
    const durationEl = document.getElementById('sessionModalDuration');
    if (durationEl) durationEl.textContent = formatTimer(timerSeconds);

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

  function hide() {
    const overlay = document.getElementById('sessionModalOverlay');
    if (overlay) overlay.classList.remove('show');
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
    };
  }

  function bindEvents(handlers: SessionModalEventHandlers = {}) {
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

    document.getElementById('sessionModalSaveBtn')?.addEventListener('click', () => {
      handlers.onSave?.(readFormValues());
    });
  }

  return {
    populateSessionTopicSelect,
    fillSessionBookmarkFields,
    clearSessionBookmarkFields,
    syncSessionModalActivityFields,
    show,
    hide,
    readFormValues,
    bindEvents,
  };
}
