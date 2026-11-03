import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import { FirstAccessModal } from '../components/FirstAccessModal.js';
import {
  isFirstAccessSession,
  markFirstAccessDismissed,
} from '../../features/onboarding/first-access-detector.js';

export interface FirstAccessModalControllerContext {
  getContainer: () => HTMLElement | null | any;
  getState: () => any;
  isDemoMode: () => boolean;
  isTestMode: () => boolean;
  onStartGuidedPlan: () => void;
  onStartDemo: () => void;
  storage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, val: string) => void;
  } | null;
}

export function createFirstAccessModalController(context: FirstAccessModalControllerContext) {
  let isOpen = false;

  function renderModal() {
    const container = context.getContainer();
    if (!container) return;

    if (!isOpen) {
      unmountPreact(container);
      return;
    }

    mountPreact(
      h(FirstAccessModal, {
        open: isOpen,
        onClose: close,
        onStartGuidedPlan: () => {
          markFirstAccessDismissed(context.storage);
          close();
          context.onStartGuidedPlan();
        },
        onStartDemo: () => {
          markFirstAccessDismissed(context.storage);
          close();
          context.onStartDemo();
        },
        onExploreManually: () => {
          markFirstAccessDismissed(context.storage);
          close();
        },
      }),
      container
    );
  }

  function open() {
    isOpen = true;
    renderModal();
  }

  function close() {
    isOpen = false;
    renderModal();
  }

  function checkAndTrigger() {
    const state = context.getState();
    const shouldOpen = isFirstAccessSession(state, {
      isDemoMode: context.isDemoMode(),
      isTestMode: context.isTestMode(),
      storage: context.storage,
    });
    if (shouldOpen) {
      open();
      return true;
    }
    return false;
  }

  return {
    open,
    close,
    isOpen: () => isOpen,
    checkAndTrigger,
  };
}
