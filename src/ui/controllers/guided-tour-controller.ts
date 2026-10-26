import { h } from 'preact';
import {
  createGuidedTourState,
  nextTourStep,
  prevTourStep,
  closeTour,
  type GuidedTourState,
} from '../../domain/onboarding/guided-tour-steps.js';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import { GuidedTourPopover } from '../components/GuidedTourPopover.js';

export interface GuidedTourControllerOptions {
  document?: Document;
  window?: Window;
  activateTab: (tab: string) => void;
  showToast?: (message: string) => void;
}

export function createGuidedTourController({
  document = globalThis.document,
  window = globalThis.window,
  activateTab,
  showToast = () => {},
}: GuidedTourControllerOptions) {
  let tourState: GuidedTourState = Object.freeze({
    active: false,
    currentIndex: -1,
    steps: Object.freeze([]),
    currentStep: null,
    totalSteps: 0,
    isFirst: true,
    isLast: true,
  });

  let previousFocusedElement: HTMLElement | null = null;
  let currentHighlightedElement: HTMLElement | null = null;
  let overlayContainer: HTMLElement | null = null;

  function ensureOverlayContainer(): HTMLElement {
    let container = document.getElementById('guidedTourContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'guidedTourContainer';
      document.body.appendChild(container);
    }
    return container;
  }

  function removeHighlight() {
    if (currentHighlightedElement) {
      currentHighlightedElement.classList.remove('is-tour-highlighted');
      currentHighlightedElement = null;
    }
  }

  function calculatePosition(target: HTMLElement): Record<string, string> {
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popoverWidth = Math.min(380, vw - 24);

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    if (left < 12) left = 12;
    if (left + popoverWidth > vw - 12) left = vw - popoverWidth - 12;

    // Prefer positioning below the target, or above if there isn't enough space
    let top = rect.bottom + 12;
    if (top + 220 > vh && rect.top > 240) {
      top = Math.max(12, rect.top - 230);
    }

    return {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      maxWidth: `${popoverWidth}px`,
    };
  }

  function renderCurrentStep() {
    if (!tourState.active || !tourState.currentStep) {
      teardown();
      return;
    }

    const step = tourState.currentStep;
    activateTab(step.tab);

    // Wait a brief tick for tab rendering and element availability
    setTimeout(() => {
      removeHighlight();

      const target = document.querySelector<HTMLElement>(step.selector);
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
        target.classList.add('is-tour-highlighted');
        currentHighlightedElement = target;
      }

      const positionStyle = target
        ? calculatePosition(target)
        : {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          };

      const container = ensureOverlayContainer();

      const vnode = h(GuidedTourPopover, {
        step,
        currentIndex: tourState.currentIndex,
        totalSteps: tourState.totalSteps,
        isFirst: tourState.isFirst,
        isLast: tourState.isLast,
        positionStyle,
        onNext: next,
        onPrev: prev,
        onClose: close,
      });

      mountPreact(vnode, container);

      // Focus the primary action button inside popover
      const nextBtn = container.querySelector<HTMLElement>('[data-guided-tour-next="true"]');
      nextBtn?.focus();
    }, 100);
  }

  function start() {
    previousFocusedElement = (document.activeElement as HTMLElement) || null;
    tourState = createGuidedTourState(0);
    document.addEventListener('keydown', handleKeyDown);
    renderCurrentStep();
  }

  function next() {
    if (tourState.isLast) {
      close();
      showToast('Tour concluído! Comece agora pela sua recomendação prioritária.');
      return;
    }
    tourState = nextTourStep(tourState);
    renderCurrentStep();
  }

  function prev() {
    tourState = prevTourStep(tourState);
    renderCurrentStep();
  }

  function teardown() {
    removeHighlight();
    document.removeEventListener('keydown', handleKeyDown);
    if (overlayContainer) {
      unmountPreact(overlayContainer);
      overlayContainer.remove();
      overlayContainer = null;
    } else {
      const container = document.getElementById('guidedTourContainer');
      if (container) {
        unmountPreact(container);
        container.remove();
      }
    }
    if (previousFocusedElement) {
      previousFocusedElement.focus();
      previousFocusedElement = null;
    }
  }

  function close() {
    tourState = closeTour(tourState);
    teardown();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!tourState.active) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowRight' && !tourState.isLast) {
      event.preventDefault();
      next();
      return;
    }
    if (event.key === 'ArrowLeft' && !tourState.isFirst) {
      event.preventDefault();
      prev();
    }
  }

  return {
    start,
    next,
    prev,
    close,
    getState: () => tourState,
  };
}
