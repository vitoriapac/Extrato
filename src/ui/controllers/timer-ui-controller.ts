/**
 * Controlador de interface para o modo foco do cronômetro,
 * atalhos de teclado de foco e sincronização do ponto de parada (bookmarks de sessão).
 *
 * Camada: UI Controller.
 */

import {
  topicResumeLabel as topicResumeLabelCoordinator,
  resolveSessionBookmark,
  SESSION_BOOKMARK_FIELDS,
} from '../../application/sessions/timer-coordinator.js';
import { createKeyboardShortcutsController } from '../events/keyboard-shortcuts.js';

export interface TimerUiControllerOptions {
  document: any;
  activeTabName: () => string;
  activateTab: (tab: string) => void;
  renderTimerFocusContext: () => void;
  isTimerRunning: () => boolean;
  getTopicById: (topicId: string) => { subject: any; topic: any } | null;
  subjectService?: any;
  requestAnimationFrame?: (cb: () => void) => any;
}

export function createTimerUiController(options: TimerUiControllerOptions) {
  const {
    document,
    activeTabName,
    activateTab,
    renderTimerFocusContext,
    isTimerRunning,
    getTopicById,
    subjectService,
  } = options;

  const rAF =
    options.requestAnimationFrame ||
    (typeof window !== 'undefined' && window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : (cb: () => void) => cb());

  let timerFocusReturnTab: string | null = null;

  function focusStudyTimer() {
    activateTab('dashboard');
    document.getElementById('timerStartBtn')?.focus?.();
  }

  function openStudyTimerFocus() {
    const origin = activeTabName();
    timerFocusReturnTab = origin === 'dashboard' ? null : origin;
    activateTab('dashboard');
    toggleTimerFocus(true);
  }

  function toggleTimerFocus(force: boolean | null = null): boolean {
    const body = document.body;
    const active =
      force == null ? !body.classList.contains('timer-focus-active') : Boolean(force);
    body.classList.toggle('timer-focus-active', active);
    renderTimerFocusContext();

    const toggle = document.getElementById('timerFocusToggle');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(active));
      toggle.textContent = active ? 'Sair do modo foco' : '⛶ Modo foco';
    }

    if (active) {
      document
        .querySelector?.('#panel-dashboard .timer-block')
        ?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      rAF(() =>
        document
          .getElementById(isTimerRunning() ? 'timerPauseBtn' : 'timerStartBtn')
          ?.focus?.()
      );
    } else if (timerFocusReturnTab) {
      const tab = timerFocusReturnTab;
      timerFocusReturnTab = null;
      activateTab(tab);
      rAF(() =>
        (
          document.querySelector(
            `#panel-${tab} [data-delegated-click="openStudyTimerFocus()"]`
          ) || document.getElementById(`tab-${tab}`)
        )?.focus?.()
      );
    } else {
      rAF(() => toggle?.focus?.());
    }

    return active;
  }

  function getTimerFocusReturnTab(): string | null {
    return timerFocusReturnTab;
  }

  function clearTimerFocusReturnTab(): void {
    timerFocusReturnTab = null;
  }

  function topicResumeLabel(topicId: string): string {
    return topicResumeLabelCoordinator(topicId, getTopicById);
  }

  function saveSessionBookmark(topicId: string, endedAt: string) {
    const found = topicId ? getTopicById(topicId) : null;
    if (!found) return;

    const bookmarkSection = document.getElementById('sessionBookmarkSection');
    const isCleared = bookmarkSection?.dataset?.clear === '1';

    const fieldValues = Object.fromEntries(
      Object.entries(SESSION_BOOKMARK_FIELDS).map(([field, id]) => [
        field,
        document.getElementById(id as string)?.value || '',
      ])
    );

    const { shouldUpdate, nextBookmark } = resolveSessionBookmark({
      topicId,
      endedAt,
      isCleared,
      fieldValues,
      currentBookmark: found.topic.bookmark,
    });

    if (shouldUpdate && subjectService?.updateTopic) {
      subjectService.updateTopic(found.subject.id, topicId, { bookmark: nextBookmark });
    }
  }

  function bindKeyboardShortcuts() {
    const keyboardShortcuts = createKeyboardShortcutsController({
      document,
      onExitTimerFocus: () => toggleTimerFocus(false),
    });
    keyboardShortcuts.register();
    return keyboardShortcuts;
  }

  return {
    focusStudyTimer,
    openStudyTimerFocus,
    toggleTimerFocus,
    getTimerFocusReturnTab,
    clearTimerFocusReturnTab,
    topicResumeLabel,
    saveSessionBookmark,
    bindKeyboardShortcuts,
  };
}
