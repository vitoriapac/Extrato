/**
 * Controlador de interface do cronômetro de estudos.
 *
 * Gerencia a renderização do display de tempo, indicador de meta e progresso,
 * contexto em foco (disciplina, tópico, bookmark), etapas da estratégia guiada,
 * sincronização de seletores e estado visual dos botões de controle.
 *
 * Camada: UI Controller.
 */

import { h } from 'preact';
import { formatDuration, formatPlanMinutes } from '../../core/format-duration.js';
import { formatTimerTitle } from './pip-timer-controller.js';
import { renderGuidedStrategyHtml } from './timer-controller.js';
import { mountPreact } from '../preact-mount.js';
import { SubjectCombobox } from '../components/SubjectCombobox.js';
import type { ComboboxOption } from '../primitives/select-field.js';
import type { ActiveTimerState } from '../../core/types.js';

export interface TimerViewDocumentLike {
  title: string;
  body: any;
  getElementById(id: string): any;
}

export interface StudyTimerViewControllerOptions {
  document: TimerViewDocumentLike | Document;
  formatTimer: (seconds: number) => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  getSubjectName: (subjectId: string) => string;
  getTopicName: (topicId: string) => string;
  getSubjectById: (subjectId: string) => any;
  subjectsForSelection: (
    currentSubjectId: string | null | undefined
  ) => Array<{ id: string; name: string; archived?: boolean }>;
  topicsForSelection: (subject: any, currentTopicId: any) => Array<{ id: string; name: string }>;
  topicResumeLabel: (topicId: string) => string;
  findDailyPlanItem: (itemId: string) => any;
  getActiveTimer: () => Partial<ActiveTimerState>;
  onPipRender?: () => void;
}

export function createStudyTimerViewController(opts: StudyTimerViewControllerOptions) {
  const {
    document,
    formatTimer,
    escapeHtml,
    escapeAttr,
    getSubjectName,
    getTopicName,
    getSubjectById,
    subjectsForSelection,
    topicsForSelection,
    topicResumeLabel,
    findDailyPlanItem,
    getActiveTimer,
    onPipRender,
  } = opts;

  const BASE_DOCUMENT_TITLE = document.title;

  const getRealMount = (id: string): Element | null => {
    if (typeof globalThis.document === 'undefined') return null;
    const mount = document.getElementById(id);
    return mount && mount.ownerDocument === globalThis.document ? mount : null;
  };

  let currentSubjectOptions: ComboboxOption[] = [{ value: '', label: 'Sem disciplina específica' }];
  let selectedSubjectId = '';
  let controlsDisabled = false;
  let subjectChangeHandler: ((subjectId: string) => void) | null = null;

  function renderSubjectCombobox() {
    const mount = getRealMount('timerSubjectMount');
    if (!mount) return;
    mountPreact(
      h(SubjectCombobox, {
        id: 'timerSubjectSelect',
        label: 'Disciplina da sessão',
        hideLabel: true,
        placeholder: 'Sem disciplina específica',
        options: currentSubjectOptions,
        value: selectedSubjectId,
        disabled: controlsDisabled,
        onChange: (nextSubjectId: string) => {
          selectedSubjectId = nextSubjectId;
          renderSubjectCombobox();
          subjectChangeHandler?.(nextSubjectId);
        },
      }),
      mount
    );
  }

  function getSelectedSubjectId(): string {
    if (getRealMount('timerSubjectMount')) {
      return selectedSubjectId;
    }
    return (document.getElementById('timerSubjectSelect') as HTMLSelectElement | null)?.value || '';
  }

  function onSubjectChange(handler: (subjectId: string) => void) {
    subjectChangeHandler = handler;
  }

  renderSubjectCombobox();

  function renderTimerFocusContext() {
    const section = document.getElementById('timerFocusContext');
    if (!section) return;
    section.hidden = !document.body.classList.contains('timer-focus-active');
    if (section.hidden) return;

    const active = getActiveTimer();
    const subject = active.subjectId
      ? getSubjectName(active.subjectId)
      : 'Disciplina não selecionada';
    const topic = active.topicId ? getTopicName(active.topicId) : 'Tópico não selecionado';
    const activityLabels: Record<string, string> = {
      study: 'Estudo teórico',
      review: 'Revisão',
      questions: 'Questões',
      simulation: 'Simulado',
    };
    const minutes = Math.max(0, Number(active.targetMinutes) || 0);

    const titleEl = document.getElementById('timerFocusTitle');
    if (titleEl) titleEl.textContent = `${subject} — ${topic}`;

    const subtitleEl = document.getElementById('timerFocusSubtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `${activityLabels[active.type || 'study'] || activityLabels.study} · ${minutes ? `Meta de ${formatPlanMinutes(minutes)}` : 'Sem meta de tempo'}`;
    }

    const resumeEl = document.getElementById('timerFocusResume');
    if (resumeEl) {
      const resumeLabel = active.topicId ? topicResumeLabel(active.topicId) : '';
      resumeEl.textContent = resumeLabel ? `Continuar de: ${resumeLabel}` : '';
      resumeEl.hidden = !resumeLabel;
    }
  }

  function renderGuidedStrategy() {
    const el = document.getElementById('guidedStrategy') as HTMLElement | null;
    if (!el) return;
    const active = getActiveTimer();
    const strategy = active.strategy;
    el.hidden = !strategy;
    if (!strategy) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = renderGuidedStrategyHtml(strategy, active.strategyStep || 0, escapeHtml);
  }

  function updateTimerDisplay(timerSeconds: number, isRunning: boolean) {
    const el = document.getElementById('studyTimerDisplay');
    if (el) el.textContent = formatTimer(timerSeconds);

    const active = getActiveTimer();
    const targetEl = document.getElementById('studyTimerTarget');
    const progressEl = document.getElementById('studyTimerProgress') as HTMLProgressElement | null;

    if (targetEl) {
      const targetMinutes = Math.max(0, Number(active.targetMinutes) || 0);
      if (targetMinutes > 0) {
        const targetSeconds = targetMinutes * 60;
        const difference = targetSeconds - timerSeconds;
        const planItem = active.planItemId ? findDailyPlanItem(active.planItemId)?.item : null;
        const context = planItem
          ? `${[planItem.subjectId && getSubjectName(planItem.subjectId), planItem.topicId && getTopicName(planItem.topicId)].filter(Boolean).join(' — ') || 'Sessão livre'} · `
          : '';
        targetEl.textContent =
          context +
          `meta ${formatPlanMinutes(targetMinutes)} · ${difference >= 0 ? formatDuration(difference) + ' restantes' : formatDuration(Math.abs(difference)) + ' além da meta'}`;
        targetEl.hidden = false;

        if (progressEl) {
          progressEl.value = Math.min(100, Math.round((timerSeconds / targetSeconds) * 100));
          progressEl.setAttribute(
            'aria-valuetext',
            `${formatDuration(timerSeconds)} de ${formatPlanMinutes(targetMinutes)}`
          );
          progressEl.hidden = false;
        }
      } else {
        targetEl.textContent = '';
        targetEl.hidden = true;
        if (progressEl) {
          progressEl.value = 0;
          progressEl.removeAttribute('aria-valuetext');
          progressEl.hidden = true;
        }
      }
    }

    const hasStarted = Boolean(
      active.startedAt || active.isRunning || (Number(active.accumulatedSeconds) || 0) > 0
    );
    const title = formatTimerTitle({
      started: hasStarted,
      running: isRunning,
      time: formatTimer(timerSeconds),
      subjectName: active.subjectId ? getSubjectName(active.subjectId) : '',
      baseTitle: BASE_DOCUMENT_TITLE,
    });
    if (document.title !== title) document.title = title;

    onPipRender?.();
    renderTimerFocusContext();
    renderGuidedStrategy();
  }

  function updateTimerControls(timerSeconds: number, isRunning: boolean) {
    const hasTime = timerSeconds > 0;
    const startBtn = document.getElementById('timerStartBtn');
    if (startBtn) startBtn.style.display = isRunning ? 'none' : 'inline-block';

    const pauseBtn = document.getElementById('timerPauseBtn');
    if (pauseBtn) pauseBtn.style.display = isRunning ? 'inline-block' : 'none';

    ['timerResetBtn', 'timerFinishBtn'].forEach(id => {
      const el = document.getElementById(id) as HTMLButtonElement | null;
      if (el) el.disabled = !hasTime && !isRunning;
    });

    const hasSubjectMount = Boolean(getRealMount('timerSubjectMount'));
    if (hasSubjectMount && controlsDisabled !== hasTime) {
      controlsDisabled = hasTime;
      renderSubjectCombobox();
    }

    (hasSubjectMount
      ? ['timerTopicSelect', 'timerTypeSelect']
      : ['timerSubjectSelect', 'timerTopicSelect', 'timerTypeSelect']
    ).forEach(id => {
      const el = document.getElementById(id) as HTMLSelectElement | null;
      if (el) el.disabled = hasTime;
    });

    // Parado, o cartão é só uma "Sessão livre"; relógio e controles de sessão aparecem ao começar.
    const idle = !hasTime && !isRunning;
    document.getElementById('study-timer')?.classList?.toggle('is-idle', idle);
    const title = document.getElementById('studyTimerTitle');
    if (title) title.textContent = idle ? 'Sessão livre' : 'Cronômetro de estudo';
  }

  function populateTimerTopicSelect(subjectId: string, selectedTopicId: string | null) {
    const select = document.getElementById('timerTopicSelect') as HTMLSelectElement | null;
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
    select.value = selectedTopicId || '';
  }

  function populateTimerContextControls() {
    const active = getActiveTimer();
    const subjectMount = getRealMount('timerSubjectMount');
    const subjectSelect = subjectMount
      ? null
      : (document.getElementById('timerSubjectSelect') as HTMLSelectElement | null);
    const typeSelect = document.getElementById('timerTypeSelect') as HTMLSelectElement | null;
    if ((!subjectMount && !subjectSelect) || !typeSelect) return;

    if (subjectMount) {
      const options: ComboboxOption[] = [
        { value: '', label: 'Sem disciplina específica' },
        ...subjectsForSelection(active.subjectId).map(subject => ({
          value: String(subject.id),
          label: `${subject.name}${subject.archived ? ' (arquivada)' : ''}`,
        })),
      ];
      currentSubjectOptions = options;
      const desired = active.subjectId || '';
      const valid = options.some(opt => opt.value === desired) ? desired : '';
      selectedSubjectId = valid;
      if (valid !== desired) {
        active.subjectId = null;
      }
      renderSubjectCombobox();
    } else if (subjectSelect) {
      subjectSelect.innerHTML =
        `<option value="">Sem disciplina específica</option>` +
        subjectsForSelection(active.subjectId)
          .map(
            subject =>
              `<option value="${escapeAttr(subject.id)}">${escapeHtml(subject.name)}${subject.archived ? ' (arquivada)' : ''}</option>`
          )
          .join('');
      subjectSelect.value = active.subjectId || '';
      if (subjectSelect.value !== (active.subjectId || '')) {
        active.subjectId = null;
      }
    }
    populateTimerTopicSelect(active.subjectId || '', active.topicId || null);
    typeSelect.value = active.type || 'study';
    renderTimerFocusContext();
  }

  return {
    getSelectedSubjectId,
    onSubjectChange,
    renderTimerFocusContext,
    renderGuidedStrategy,
    updateTimerDisplay,
    updateTimerControls,
    populateTimerTopicSelect,
    populateTimerContextControls,
  };
}
