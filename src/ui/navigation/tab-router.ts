import { TAB_HASHES, createNavigationController } from '../controllers/navigation-controller.js';

export interface TabRouterOptions {
  document: Document;
  window: Window;
  onRenderTab: (tab: string) => void;
  onResetLists?: () => void;
  trapModalTab?: (event: KeyboardEvent) => boolean | void;
  onCancelReview?: () => void;
}

export function createTabRouter(options: TabRouterOptions) {
  const { document, window, onRenderTab, onResetLists, trapModalTab, onCancelReview } = options;

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

  function activateInitialTab(): void {
    const initialHash = window.location.hash.replace('#', '');
    const tabFromHash = Object.keys(TAB_HASHES).find(
      tab => (TAB_HASHES as Record<string, string>)[tab] === initialHash
    );
    const initialTab = tabFromHash || initialHash || 'dashboard';

    if (document.querySelector(`.tab-btn[data-tab="${initialTab}"]`)) {
      activateTab(initialTab, false);
    } else {
      activateTab('dashboard', false);
    }
  }

  return {
    activateTab,
    activeTabName,
    registerShortcuts,
    activateInitialTab,
    navigation,
  };
}
