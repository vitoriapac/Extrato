/**
 * Controlador de interface do cronômetro de estudos.
 *
 * Gerencia a renderização do display de tempo, indicador de meta e progresso,
 * contexto em foco (disciplina, tópico, bookmark), etapas da estratégia guiada,
 * sincronização de seletores e estado visual dos botões de controle.
 *
 * Camada: UI Controller.
 */

import { formatDuration, formatPlanMinutes } from '../../core/format-duration.js';
import { formatTimerTitle } from './pip-timer-controller.js';
import { renderGuidedStrategyHtml } from './timer-controller.js';
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

    ['timerSubjectSelect', 'timerTopicSelect', 'timerTypeSelect'].forEach(id => {
      const el = document.getElementById(id) as HTMLSelectElement | null;
      if (el) el.disabled = hasTime;
    });
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
    const subjectSelect = document.getElementById('timerSubjectSelect') as HTMLSelectElement | null;
    const typeSelect = document.getElementById('timerTypeSelect') as HTMLSelectElement | null;
    if (!subjectSelect || !typeSelect) return;

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
    populateTimerTopicSelect(active.subjectId || '', active.topicId || null);
    typeSelect.value = active.type || 'study';
    renderTimerFocusContext();
  }

  return {
    renderTimerFocusContext,
    renderGuidedStrategy,
    updateTimerDisplay,
    updateTimerControls,
    populateTimerTopicSelect,
    populateTimerContextControls,
  };
}
