import {
  TAB_ALIASES,
  TAB_HASHES,
  createNavigationController,
} from '../controllers/navigation-controller.js';

export interface TabRouterOptions {
  document: Document;
  window: Window;
  onRenderTab: (tab: string) => void;
  onResetLists?: () => void;
  trapModalTab?: (event: KeyboardEvent) => boolean | void;
  onCancelReview?: () => void;
  /** Chamado depois que o roteador reescreve o hash (ex.: endereço antigo das conquistas). */
  onHashRewrite?: () => void;
}

export function createTabRouter(options: TabRouterOptions) {
  const {
    document,
    window,
    onRenderTab,
    onResetLists,
    trapModalTab,
    onCancelReview,
    onHashRewrite,
  } = options;

  const navigation = createNavigationController({
    document,
    window,
    render: (tab: string) => onRenderTab(tab),
    trapModalTab: (event: KeyboardEvent) => {
      if (trapModalTab) {
        return trapModalTab(event);
      }
    },
    closeReview: onCancelReview || (() => {}),
  });

  function activeTabName(): string {
    const activeBtn = document.querySelector('.tab-btn.active') as HTMLElement | null;
    return activeBtn?.dataset.tab || 'dashboard';
  }

  function activateTab(tabName: string, updateHash = true): boolean {
    if (typeof (globalThis as any).studytrackProgressiveLists?.reset === 'function') {
      (globalThis as any).studytrackProgressiveLists.reset();
    }
    if (onResetLists) {
      onResetLists();
    }
    return navigation.activate(tabName, updateHash);
  }

  function registerShortcuts(): void {
    navigation.registerShortcuts();
  }

  // "#instrucoes/topico?x" aponta para a aba "instrucoes"; âncoras internas não são abas.
  function tabFromHash(hash: string): string | null {
    const base = hash.replace('#', '').split(/[/?]/)[0];
    const named =
      Object.keys(TAB_HASHES).find(name => (TAB_HASHES as Record<string, string>)[name] === base) ||
      base;
    const tab = TAB_ALIASES[named] || named;
    return tab && document.querySelector(`.tab-btn[data-tab="${tab}"]`) ? tab : null;
  }

  // Endereço antigo das conquistas (subaba Histórico de Desempenho) leva à subaba de Hoje.
  function redirectLegacyHash(): void {
    if (!/^#desempenho\/history(?:[/?]|$)/.test(window.location.hash)) return;
    window.history.replaceState(null, '', '#hoje/conquistas');
    // replaceState não dispara hashchange: quem guarda estado no hash é avisado direto.
    onHashRewrite?.();
  }

  function activateInitialTab(): void {
    redirectLegacyHash();
    activateTab(tabFromHash(window.location.hash) || 'dashboard', false);
    // Links internos e hash editado na barra trocam de aba sem recarregar.
    window.addEventListener?.('hashchange', () => {
      redirectLegacyHash();
      const tab = tabFromHash(window.location.hash);
      if (tab && tab !== activeTabName()) activateTab(tab, false);
    });
  }

  return {
    activateTab,
    activeTabName,
    registerShortcuts,
    activateInitialTab,
    navigation,
  };
}
