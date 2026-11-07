/**
 * Controlador de Interface para o Caderno de Erros e Flashcards (src/ui/controllers/error-notebook-controller.ts)
 *
 * Responsável por orquestrar a exibição da tela declarativa Preact, a sincronização do toggle de visão
 * na aba de Questões e os avisos de revisões pendentes nas abas Agenda e Hoje.
 */

import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import { ErrorNotebookView } from '../views/ErrorNotebookView.js';
import { ErrorNotebookDueNotice } from '../components/ErrorNotebookDueNotice.js';
import { ReviewQueueSummary } from '../components/ReviewQueueSummary.js';
import { buildReviewQueueSummary } from '../../application/reviews/build-review-queue-summary.js';
import {
  addErrorFlashcard,
  reviewErrorFlashcard,
  findQuestionsAwaitingFlashcard,
  type CreateFlashcardInput,
} from '../../domain/notebook/error-notebook-engine.js';
import type { AppState, FlashcardRating } from '../../core/types.js';

export interface ErrorNotebookControllerContext {
  getState: () => AppState;
  getMount: () => HTMLElement | null;
  getMainContainer: () => HTMLElement | null;
  getToggleBtn: () => HTMLElement | null;
  getDueAgendaMount: () => HTMLElement | null;
  getDueTodayMount: () => HTMLElement | null;
  todayISO: () => string;
  nowISO: () => string;
  persistAndRender: () => void;
  showToast: (message: string) => void;
  activateTab: (tabName: string) => void;
  mount?: (component: any, container: HTMLElement) => void;
  unmount?: (container: HTMLElement) => void;
}

export function createErrorNotebookController(context: ErrorNotebookControllerContext) {
  const mountComponent = context.mount || mountPreact;
  const unmountComponent = context.unmount || unmountPreact;
  let active = false;

  function isActive(): boolean {
    return active;
  }

  function setActive(value: boolean): void {
    active = value;
  }

  function toggle(): void {
    active = !active;
  }

  function open(): void {
    active = true;
    context.activateTab('questoes');
    syncView();
  }

  function renderView(): void {
    const mount = context.getMount();
    if (!mount) return;

    const state = context.getState();
    const subjectsData = (state.subjects || []).map(s => ({
      id: s.id,
      name: s.name,
      topics: (s.topics || []).map(t => ({
        id: t.id,
        name: t.name,
      })),
    }));

    mountComponent(
      h(ErrorNotebookView, {
        flashcards: state.errorFlashcards || [],
        subjects: subjectsData,
        questionDrafts: findQuestionsAwaitingFlashcard(
          state.questoes || [],
          state.errorFlashcards || []
        ),
        todayDate: context.todayISO(),
        onSaveFlashcard: (input: CreateFlashcardInput) => {
          const result = addErrorFlashcard(state.errorFlashcards || [], {
            ...input,
            todayDate: context.todayISO(),
          });
          if (!result.created) {
            context.showToast('Este card já existe no caderno.');
            return;
          }
          state.errorFlashcards = result.cards;
          context.persistAndRender();
          context.showToast('Card de erro salvo no caderno.');
        },
        onReviewFlashcard: (cardId: string, rating: FlashcardRating) => {
          if (!Array.isArray(state.errorFlashcards)) return;
          const index = state.errorFlashcards.findIndex(c => c.id === cardId);
          if (index >= 0) {
            state.errorFlashcards[index] = reviewErrorFlashcard(
              state.errorFlashcards[index],
              rating,
              { todayDate: context.todayISO(), nowISO: context.nowISO() }
            );
            context.persistAndRender();
          }
        },
        onDeleteFlashcard: (cardId: string) => {
          if (!Array.isArray(state.errorFlashcards)) return;
          const index = state.errorFlashcards.findIndex(c => c.id === cardId);
          if (index >= 0) {
            state.errorFlashcards.splice(index, 1);
            context.persistAndRender();
            context.showToast('Card de erro removido.');
          }
        },
      }),
      mount
    );
  }

  function syncView(): boolean {
    const mount = context.getMount();
    const mainContainer = context.getMainContainer();
    const toggleBtn = context.getToggleBtn();

    if (active && mount) {
      if (mainContainer) mainContainer.hidden = true;
      mount.hidden = false;
      if (toggleBtn) {
        toggleBtn.textContent = 'Visão de questões';
        toggleBtn.setAttribute?.('aria-pressed', 'true');
        toggleBtn.classList.add('btn-primary');
      }
      renderView();
      return true;
    }

    if (mount) {
      unmountComponent(mount);
      mount.hidden = true;
    }
    if (mainContainer) mainContainer.hidden = false;
    if (toggleBtn) {
      toggleBtn.textContent = 'Caderno de Erros (Flashcards)';
      toggleBtn.setAttribute?.('aria-pressed', 'false');
      toggleBtn.classList.remove('btn-primary');
    }
    return false;
  }

  function renderDueNotices(): void {
    const state = context.getState();
    const summary = buildReviewQueueSummary({ reviews: state.reviewAgenda || [], flashcards: state.errorFlashcards || [], today: context.todayISO() });
    const agenda = context.getDueAgendaMount();
    if (agenda) mountComponent(h(ReviewQueueSummary, {
      summary, onFlashcards: open,
      onTopics: () => {
        const target = agenda.ownerDocument.getElementById('agendaBody');
        if (!target) return;
        target.tabIndex = -1;
        target.focus();
        target.scrollIntoView({ block: 'start' });
      },
    }), agenda);
    const today = context.getDueTodayMount();
    if (today) mountComponent(h(ErrorNotebookDueNotice, { dueCount: summary.flashcardsDue, onOpen: open }), today);
  }

  return {
    isActive,
    setActive,
    toggle,
    open,
    syncView,
    renderView,
    renderDueNotices,
  };
}
