/**
 * Gerenciador de atalhos de teclado e comportamento de foco acessível.
 *
 * Gerencia o confinamento de foco e escape do modo foco do cronômetro,
 * e o fechamento acessível de menus de ação (`.action-menu`) via tecla Escape e clique fora.
 *
 * Camada: UI Events.
 */

export interface KeyboardShortcutsDocumentLike {
  body?: any;
  activeElement?: any;
  addEventListener?(type: string, listener: (event: any) => void): void;
  removeEventListener?(type: string, listener: (event: any) => void): void;
  querySelector?(selector: string): any;
  querySelectorAll?(selector: string): any;
}

export interface KeyboardShortcutsOptions {
  document: KeyboardShortcutsDocumentLike | Document;
  onExitTimerFocus?: () => void;
}

export function createKeyboardShortcutsController(opts: KeyboardShortcutsOptions) {
  const { document, onExitTimerFocus } = opts;

  function handleTimerFocusKeydown(event: KeyboardEvent | any): void {
    if (!document.body?.classList?.contains?.('timer-focus-active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onExitTimerFocus?.();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusSurface = document.querySelector?.(
      'body.timer-focus-active #panel-dashboard .chart-card:has(.timer-block)'
    );
    const focusable = [
      ...(focusSurface?.querySelectorAll?.(
        'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ) || []),
    ].filter(
      (element: any) =>
        (element.getClientRects ? element.getClientRects().length > 0 : true) &&
        (typeof getComputedStyle === 'function' ? getComputedStyle(element).visibility !== 'hidden' : true)
    );
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first || !focusSurface?.contains?.(document.activeElement))
    ) {
      event.preventDefault();
      last?.focus?.();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !focusSurface?.contains?.(document.activeElement))
    ) {
      event.preventDefault();
      first?.focus?.();
    }
  }

  function handleActionMenuKeydown(event: KeyboardEvent | any): void {
    if (event.key !== 'Escape') return;
    const menus = [...(document.querySelectorAll?.('.action-menu[open]') || [])];
    if (!menus.length) return;
    event.preventDefault();
    menus.forEach((menu: any) => {
      menu.open = false;
    });
    const lastMenu = menus[menus.length - 1];
    lastMenu?.querySelector?.('summary')?.focus?.();
  }

  function handleActionMenuClick(event: MouseEvent | any): void {
    const target = event.target as HTMLElement | null;
    const current = target?.closest?.('.action-menu');
    const openMenus = document.querySelectorAll?.('.action-menu[open]') || [];
    openMenus.forEach((menu: any) => {
      if (menu !== current || target?.closest?.('.action-menu__items button')) {
        menu.open = false;
      }
    });
  }

  function register(): () => void {
    const onKeydown = (event: KeyboardEvent) => {
      handleTimerFocusKeydown(event);
      handleActionMenuKeydown(event);
    };
    const onClick = (event: MouseEvent) => {
      handleActionMenuClick(event);
    };

    document.addEventListener?.('keydown', onKeydown);
    document.addEventListener?.('click', onClick);

    return () => {
      document.removeEventListener?.('keydown', onKeydown);
      document.removeEventListener?.('click', onClick);
    };
  }

  return {
    handleTimerFocusKeydown,
    handleActionMenuKeydown,
    handleActionMenuClick,
    register,
  };
}
