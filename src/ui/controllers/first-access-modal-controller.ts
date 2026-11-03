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
  window?: any;
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
    const win = context.window || (typeof window !== 'undefined' ? window : null);
    let forceFirstAccess = false;
    let isAutomation = false;
    let isTest = context.isTestMode();

    try {
      if (win?.location?.search) {
        const params = new URLSearchParams(win.location.search);
        if (params.get('firstAccess') === '1' || params.get('welcome') === '1') {
          forceFirstAccess = true;
        }
        if (params.get('test') === '1') {
          isTest = true;
        }
      }
      if (win?.navigator?.webdriver) {
        isAutomation = true;
      }
      if (Boolean(win?.__EXTRATO_TEST__)) {
        isTest = true;
      }
    } catch {
      // Falha silenciosa caso location ou navigator não estejam acessíveis
    }

    const shouldOpen = isFirstAccessSession(state, {
      isDemoMode: context.isDemoMode(),
      isTestMode: isTest,
      isAutomation,
      forceFirstAccess,
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
