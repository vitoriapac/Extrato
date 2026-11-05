import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import { FirstAccessModal } from '../components/FirstAccessModal.js';
import { SalesLandingPage } from '../components/SalesLandingPage.js';
import { PaywallModal } from '../components/PaywallModal.js';
import { AuthAccountModal } from '../components/AuthAccountModal.js';
import {
  isFirstAccessSession,
  markFirstAccessDismissed,
} from '../../features/onboarding/first-access-detector.js';
import type { BillingCycle } from '../../domain/billing/entitlements.js';

export type FirstAccessViewMode = 'closed' | 'welcome' | 'landing' | 'paywall' | 'auth';

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
  let activeView: FirstAccessViewMode = 'closed';
  let paywallCycle: BillingCycle = 'annual';
  let paywallFeatureTitle: string | undefined;
  let paywallFeatureDescription: string | undefined;
  let triggersBound = false;

  function renderModal() {
    const container = context.getContainer();
    if (!container) return;

    if (activeView === 'closed') {
      unmountPreact(container);
      return;
    }

    if (activeView === 'landing') {
      mountPreact(
        h(
          'div',
          {
            className: 'fixed inset-0 z-50 overflow-y-auto bg-surface-page',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Apresentação do StudyTrack — Extrato de Estudos',
          },
          h(SalesLandingPage, {
            onStartFreeApp: () => {
              markFirstAccessDismissed(context.storage);
              close();
              context.onStartGuidedPlan();
            },
            onStartLiveDemo: () => {
              markFirstAccessDismissed(context.storage);
              close();
              context.onStartDemo();
            },
            onSelectProPlan: (cycle: BillingCycle) => {
              openPaywall(
                cycle,
                'Acesso Ilimitado & Sincronização na Nuvem',
                'Desbloqueie editais completos, sincronização entre PC e celular e simuladores preditivos.'
              );
            },
            onToggleTheme: () => {
              const win = context.window || (typeof window !== 'undefined' ? window : null);
              const themeBtn = win?.document?.getElementById?.('themeToggleBtn');
              themeBtn?.click?.();
            },
          })
        ),
        container
      );
      return;
    }

    if (activeView === 'paywall') {
      mountPreact(
        h(PaywallModal, {
          open: true,
          onClose: close,
          defaultCycle: paywallCycle,
          featureTitle: paywallFeatureTitle,
          featureDescription: paywallFeatureDescription,
          onExploreDemo: () => {
            markFirstAccessDismissed(context.storage);
            close();
            context.onStartDemo();
          },
          onSelectCheckout: () => {
            openAuthModal();
          },
        }),
        container
      );
      return;
    }

    if (activeView === 'auth') {
      mountPreact(
        h(AuthAccountModal, {
          open: true,
          onClose: close,
          onRequestMagicLink: async (email: string) => {
            if (!email || !email.includes('@')) {
              return { success: false, error: 'Informe um endereço de e-mail válido.' };
            }
            return {
              success: true,
            };
          },
          onOpenUpgrade: () => openPaywall('annual'),
        }),
        container
      );
      return;
    }

    mountPreact(
      h(FirstAccessModal, {
        open: true,
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
        onOpenSalesLanding: () => {
          openSalesLanding();
        },
      }),
      container
    );
  }

  function open() {
    activeView = 'welcome';
    renderModal();
  }

  function openSalesLanding() {
    activeView = 'landing';
    renderModal();
  }

  function openPaywall(
    cycle: BillingCycle = 'annual',
    featureTitle?: string,
    featureDescription?: string
  ) {
    paywallCycle = cycle;
    paywallFeatureTitle = featureTitle;
    paywallFeatureDescription = featureDescription;
    activeView = 'paywall';
    renderModal();
  }

  function openAuthModal() {
    activeView = 'auth';
    renderModal();
  }

  function close() {
    activeView = 'closed';
    renderModal();
  }

  function bindGlobalTriggers(win: any) {
    if (triggersBound || !win?.document) return;
    triggersBound = true;

    const plansBtn = win.document.getElementById?.('openSaasPlansBtn');
    plansBtn?.addEventListener?.('click', () => openPaywall('annual'));

    const landingBtn = win.document.getElementById?.('openSalesLandingBtn');
    landingBtn?.addEventListener?.('click', () => openSalesLanding());
  }

  function checkAndTrigger() {
    const state = context.getState();
    const win = context.window || (typeof window !== 'undefined' ? window : null);
    let forceFirstAccess = false;
    let forceLanding = false;
    let isAutomation = false;
    let isTest = context.isTestMode();

    bindGlobalTriggers(win);

    try {
      if (win?.location?.search) {
        const params = new URLSearchParams(win.location.search);
        if (params.get('firstAccess') === '1' || params.get('welcome') === '1') {
          forceFirstAccess = true;
        }
        if (params.get('landing') === '1' || params.get('vendas') === '1') {
          forceLanding = true;
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

    if (forceLanding && !isTest && !isAutomation) {
      openSalesLanding();
      return true;
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
    openSalesLanding,
    openPaywall,
    openAuthModal,
    close,
    isOpen: () => activeView !== 'closed',
    getActiveView: () => activeView,
    checkAndTrigger,
  };
}
