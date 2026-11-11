import { h } from 'preact';
import { scrollBehavior } from '../accessibility.js';
import { mountPreact } from '../preact-mount.js';
import { MobileMoreMenu } from '../components/MobileMoreMenu.js';
// Public URL names for tabs whose internal id predates their label; the old hash still works on load.
export const TAB_HASHES: Readonly<Record<string, string>> = Object.freeze({
  metas: 'planejamento',
});
// O Calendário virou a visão Mês da Agenda: o hash e os atalhos antigos continuam abrindo a Agenda.
export const TAB_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  calendario: 'agenda',
});
export const MAIN_TABS = Object.freeze([
  'dashboard',
  'desempenho',
  'hoje',
  'disciplinas',
  'agenda',
  'questoes',
  'metas',
  'instrucoes',
]);
export function nextNavigationIndex(current: number, length: number, key: string) {
  if (!length) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  const delta = ['ArrowRight', 'ArrowDown'].includes(key) ? 1 : -1;
  return (current + delta + length) % length;
}
export function shortcutTabIndex(event: any = {}) {
  const modifier = Boolean(event.ctrlKey || event.metaKey);
  if (!modifier || !event.shiftKey || event.altKey) return -1;
  const match = /^Digit([1-9])$/.exec(event.code || '');
  return match ? Number(match[1]) - 1 : -1;
}

export function createNavigationController({
  document,
  window,
  render = () => {},
  trapModalTab = () => {},
  closeReview = () => {},
}: any = {}) {
  if (!document || !window)
    throw new TypeError('Controlador de navegação requer documento e janela.');
  const mobileMoreMount = document.getElementById?.('mobileMoreMenuMount') as Element | null;
  const usePreactMobileMore = Boolean(
    mobileMoreMount &&
    typeof globalThis.document !== 'undefined' &&
    mobileMoreMount.ownerDocument === globalThis.document
  );
  const moreButton = usePreactMobileMore ? null : document.getElementById('moreTabButton'),
    moreMenu = usePreactMobileMore ? null : document.getElementById('mobileMoreMenu');
  let activeMoreTab = 'dashboard';
  let mobileMoreOpen = false;
  let activateTabRef: (requestedTab: string, updateHash?: boolean) => boolean = () => false;

  const renderMobileMore = () => {
    if (!usePreactMobileMore || !mobileMoreMount) return;
    mountPreact(
      h(MobileMoreMenu, {
        activeTab: activeMoreTab,
        open: mobileMoreOpen,
        onOpenChange: (nextOpen: boolean) => {
          mobileMoreOpen = nextOpen;
          renderMobileMore();
        },
        onSelectTab: (tabName: string) => {
          mobileMoreOpen = false;
          activateTabRef(tabName);
        },
      }),
      mobileMoreMount
    );
  };

  const syncMore = (tabName: string) => {
    activeMoreTab = tabName;
    if (usePreactMobileMore) {
      renderMobileMore();
      return;
    }
    const secondary = ['agenda', 'questoes', 'metas', 'instrucoes'].includes(tabName);
    moreButton?.classList.toggle('active', secondary);
    moreMenu?.querySelectorAll('[data-more-tab]').forEach((item: any) => {
      const active = item.dataset.moreTab === tabName;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  };
  const closeMore = ({ restoreFocus = false } = {}) => {
    if (usePreactMobileMore) {
      if (mobileMoreOpen) {
        mobileMoreOpen = false;
        renderMobileMore();
      }
      if (restoreFocus) {
        document.getElementById?.('moreTabButton')?.focus();
      }
      return;
    }
    if (!moreMenu) return;
    moreMenu.hidden = true;
    moreButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) moreButton?.focus();
  };
  const activate = (requestedTab: string, updateHash = true) => {
    const tabName = TAB_ALIASES[requestedTab] || requestedTab;
    const button = document.querySelector(`.tab-btn[data-tab="${tabName}"]`),
      panel = document.getElementById(`panel-${tabName}`);
    if (!button || !panel) return false;
    const changed = !panel.classList?.contains('active');
    // Only real tabs carry tab state; "Mais" is a menu button, where aria-selected is invalid.
    document.querySelectorAll('.tab-btn[data-tab]').forEach((item: any) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      if (active) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
      item.tabIndex = active ? 0 : -1;
    });
    document
      .querySelectorAll('.panel')
      .forEach((item: any) => item.classList.toggle('active', item === panel));
    syncMore(tabName);
    if (document.body?.dataset) document.body.dataset.activeTab = tabName;
    // A new area opens at its top; callers that target a section scroll to it afterwards.
    if (changed) window.scrollTo?.({ top: 0, left: 0 });
    button.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: scrollBehavior() });
    document.dispatchEvent(new window.Event('studytrack:navigate'));
    render(tabName);
    if (updateHash) window.history.replaceState(null, '', `#${TAB_HASHES[tabName] || tabName}`);
    return true;
  };
  activateTabRef = activate;
  if (usePreactMobileMore) {
    renderMobileMore();
  }
  moreButton?.addEventListener('click', () => {
    const open = moreMenu?.hidden;
    if (!moreMenu) return;
    moreMenu.hidden = !open;
    moreButton.setAttribute('aria-expanded', String(open));
    if (open) moreMenu.querySelector('[role="menuitem"]')?.focus();
  });
  moreMenu?.addEventListener('click', (event: any) => {
    const item = event.target.closest('[data-more-tab]');
    if (item) {
      activate(item.dataset.moreTab);
      closeMore();
    }
  });
  moreMenu?.addEventListener('keydown', (event: any) => {
    const items = [...moreMenu.querySelectorAll('[role="menuitem"]')],
      index = items.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMore({ restoreFocus: true });
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    items[nextNavigationIndex(index, items.length, event.key)]?.focus();
  });
  if (!usePreactMobileMore) {
    document.addEventListener('click', (event: any) => {
      if (
        !moreMenu?.hidden &&
        !moreMenu.contains(event.target) &&
        !moreButton?.contains(event.target)
      )
        closeMore();
    });
  }
  document.querySelectorAll('.tab-btn[data-tab]').forEach((button: any) => {
    button.addEventListener('click', () => activate(button.dataset.tab));
    button.addEventListener('keydown', (event: any) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...document.querySelectorAll('.tab-btn[data-tab]')].filter(
          item => window.getComputedStyle(item).display !== 'none'
        ),
        next = nextNavigationIndex(tabs.indexOf(button), tabs.length, event.key);
      tabs[next]?.focus();
      activate(tabs[next]?.dataset.tab);
    });
  });
  const registerShortcuts = () =>
    document.addEventListener('keydown', (event: any) => {
      trapModalTab(event);
      if (event.defaultPrevented) return;
      const active = document.activeElement;
      const typing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(active?.tagName) ||
        active?.isContentEditable;
      if (event.key === 'Escape') {
        const modalOverlay = document.getElementById('modalOverlay') as
          (HTMLElement & { open?: boolean }) | null;
        if (modalOverlay?.classList.contains('show') || modalOverlay?.open) {
          event.preventDefault();
          document.getElementById('modalCancelBtn')?.click();
          return;
        }
        if (document.querySelector?.('dialog[open]')) {
          return;
        }
        if (document.getElementById('reviewRatingOverlay')?.classList.contains('show')) {
          event.preventDefault();
          closeReview();
          return;
        }
        if (document.getElementById('sessionModalOverlay')?.classList.contains('show')) {
          event.preventDefault();
          document
            .getElementById('sessionModalOverlay')
            .dispatchEvent(new window.CustomEvent('session-modal-dismiss'));
        }
        return;
      }
      if (
        document.querySelector?.(
          '.modal-overlay.show, dialog[open], #guidedOnboardingOverlay.show, .overlay.show, #sessionModalOverlay.show'
        )
      ) {
        return;
      }
      const shortcut = shortcutTabIndex(event);
      if (!typing && shortcut >= 0) {
        event.preventDefault();
        activate(MAIN_TABS[shortcut]);
        return;
      }
      if (!typing && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (event.key.toLowerCase() === 's') {
          const dashboardHasPrimaryAction = document.querySelector?.(
            '#panel-dashboard.active .overview-now-action .overview-action-card button:not([disabled]), #panel-dashboard.active .overview-now-action button[data-daily-start]:not([disabled]), #panel-dashboard.active .overview-now-action button[data-daily-resume]:not([disabled])'
          );
          if (dashboardHasPrimaryAction) return;
          event.preventDefault();
          activate('hoje');
          const startBtn = document.getElementById('timerStartBtn');
          const pauseBtn = document.getElementById('timerPauseBtn');
          if (startBtn && window.getComputedStyle(startBtn).display !== 'none') {
            startBtn.click();
          } else if (pauseBtn && window.getComputedStyle(pauseBtn).display !== 'none') {
            pauseBtn.click();
          }
          return;
        }
        if (event.key.toLowerCase() === 'q') {
          event.preventDefault();
          activate('questoes');
          const addBtn = document.getElementById('addQuestaoRowBtn');
          addBtn?.click();
          return;
        }
      }
    });
  return Object.freeze({ activate, closeMore, registerShortcuts });
}
