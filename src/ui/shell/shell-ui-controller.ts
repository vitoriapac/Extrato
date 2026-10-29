import { scrollBehavior } from '../accessibility.js';
/**
 * Shell UI Controller
 *
 * Responsável pela orquestração de elementos estruturais do shell da aplicação:
 * - Sincronização e acessibilidade de modais/overlays (inert no #mainContent, .modal-open no body).
 * - Navegação Home via botões de branding ([data-go-home]).
 * - Botão flutuante "Voltar ao topo" (backToTopBtn) com scroll suave e foco acessível.
 * - Alternadores de modo de execução diária (agenda vs sequência).
 * - Ações globais do Tour Guiado e Primeiros Passos.
 *
 * Camada: UI Controller / Shell.
 */

export interface ShellUiControllerOptions {
  document: Document | any;
  window: Window | any;
  activateTab: (tab: string) => void;
  state?: {
    executionMode?: string;
    [key: string]: any;
  };
  getState?: () => {
    executionMode?: string;
    subjects?: any[];
    [key: string]: any;
  };
  scheduleSave: () => void;
  persistAndRender?: () => void;
  renderPlanoHoje?: () => void;
  guidedTourController?: {
    start: () => void;
    [key: string]: any;
  };
  dismissFirstSteps?: () => void;
  restoreFirstSteps?: () => void;
  renderFirstStepsMissionCard?: () => void;
  showToast?: (message: string) => void;
  onboardingController?: {
    openGuidedOnboarding?: (opts?: any) => void;
    [key: string]: any;
  };
}

export function createShellUiController(options: ShellUiControllerOptions) {
  const {
    activateTab,
    state: initialState,
    getState,
    scheduleSave,
    persistAndRender,
    renderPlanoHoje,
    guidedTourController,
    dismissFirstSteps,
    restoreFirstSteps,
    renderFirstStepsMissionCard,
    showToast,
    onboardingController,
  } = options;
  const document = options.document as Document;
  const window = options.window as Window;

  const resolveState = () => (getState ? getState() : initialState || {});

  let modalObserver: MutationObserver | null = null;

  function getModalLayers(): HTMLElement[] {
    const overlays = Array.from(document.querySelectorAll<HTMLElement>('.modal-overlay'));
    const guidedOverlay = document.getElementById('guidedOnboardingOverlay');
    if (guidedOverlay && !overlays.includes(guidedOverlay)) {
      overlays.push(guidedOverlay);
    }
    return overlays.filter(Boolean);
  }

  function syncModalShell(): void {
    const layers = getModalLayers();
    const active = layers.some(layer => layer.classList.contains('show') && !layer.hidden);
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.inert = active;
    }
    document.body?.classList.toggle('modal-open', active);
  }

  function initModalObserver(): () => void {
    const layers = getModalLayers();
    if (typeof MutationObserver !== 'undefined') {
      modalObserver = new MutationObserver(syncModalShell);
      layers.forEach(layer =>
        modalObserver?.observe(layer, { attributes: true, attributeFilter: ['class', 'hidden'] })
      );
    }
    syncModalShell();

    return () => {
      modalObserver?.disconnect();
      modalObserver = null;
    };
  }

  function initGoHomeNavigation(): void {
    document.querySelectorAll<HTMLElement>('[data-go-home]').forEach(button => {
      button.addEventListener('click', () => {
        activateTab('dashboard');
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
          top: 0,
          behavior: reducedMotion ? 'auto' : 'smooth',
        });
        document
          .querySelector<HTMLElement>('.statement [data-go-home]')
          ?.focus({ preventScroll: true });
      });
    });
  }

  function initBackToTop(): () => void {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) return () => {};

    const syncBackToTop = () => {
      backToTopBtn.hidden = (window.scrollY || 0) < 600;
    };

    window.addEventListener('scroll', syncBackToTop, { passive: true });
    backToTopBtn.addEventListener('click', () => {
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      document.getElementById('mainContent')?.focus({ preventScroll: true });
    });

    syncBackToTop();

    return () => {
      window.removeEventListener('scroll', syncBackToTop);
    };
  }

  function initExecutionModeSwitchers(): void {
    document.getElementById('executionAgendaBtn')?.addEventListener('click', () => {
      resolveState().executionMode = 'agenda';
      scheduleSave();
      renderPlanoHoje?.();
    });

    document.getElementById('executionSequenceBtn')?.addEventListener('click', () => {
      resolveState().executionMode = 'sequence';
      scheduleSave();
      renderPlanoHoje?.();
    });
  }

  function jumpToTopic(subjectId: string, topicId: string): void {
    const currentState = resolveState();
    const s = (currentState.subjects || []).find((x: any) => x.id === subjectId);
    if (s) s.collapsed = false;
    const input = document.getElementById('globalSearchInput') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.setAttribute('aria-expanded', 'false');
    }
    document.getElementById('globalSearchResults')?.classList.remove('show');
    (document.querySelector('.tab-btn[data-tab="disciplinas"]') as HTMLElement | null)?.click();
    persistAndRender?.();
    setTimeout(() => {
      const row = document.getElementById('topic-row-' + topicId);
      if (row) {
        row.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        row.classList.add('highlight-flash');
        setTimeout(() => row.classList.remove('highlight-flash'), 1700);
      }
    }, 150);
  }

  function initStickyHeaderAndOverviewNav(): void {
    const stickyShell = document.querySelector('.sticky-shell');
    const overviewNav = document.querySelector('.overview-nav');

    const syncStickyMetrics = () => {
      const banner = document.getElementById('demoBanner');
      const bannerHeight =
        banner && !banner.hidden && getComputedStyle(banner).position === 'sticky'
          ? Math.ceil(banner.getBoundingClientRect().height)
          : 0;
      document.documentElement.style.setProperty('--demo-banner-height', `${bannerHeight}px`);
      document.documentElement.style.setProperty(
        '--sticky-stack-height',
        `${Math.ceil(stickyShell?.getBoundingClientRect().height || 0) + bannerHeight}px`
      );
      document.documentElement.style.setProperty(
        '--overview-nav-height',
        `${Math.ceil(overviewNav?.getBoundingClientRect().height || 0)}px`
      );
    };

    if (typeof IntersectionObserver !== 'undefined') {
      const statementEl = document.querySelector('.statement');
      if (statementEl) {
        const headerObserver = new IntersectionObserver(
          entries => {
            const hero = entries[0];
            stickyShell?.classList.toggle(
              'is-compact',
              !hero.isIntersecting && hero.boundingClientRect.bottom < 0
            );
            syncStickyMetrics();
          },
          { threshold: 0 }
        );
        headerObserver.observe(statementEl);
      }
    }

    document.querySelectorAll('.overview-nav-mobile select').forEach((select: Element) =>
      select.addEventListener('change', (event: any) => {
        const target = document.getElementById((event.target as HTMLInputElement).value);
        if (!target) return;
        target.scrollIntoView({
          block: 'start',
          behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        });
        window.history.replaceState(null, '', `#${target.id}`);
      })
    );

    document
      .getElementById('overviewAttentionViewAll')
      ?.addEventListener('click', () => activateTab('hoje'));

    if ('ResizeObserver' in window) {
      const stickyMetricsObserver = new ResizeObserver(syncStickyMetrics);
      if (stickyShell) stickyMetricsObserver.observe(stickyShell);
      const demoBanner = document.getElementById('demoBanner');
      if (demoBanner) stickyMetricsObserver.observe(demoBanner);
      if (overviewNav) stickyMetricsObserver.observe(overviewNav);
    }

    window.addEventListener('resize', syncStickyMetrics, { passive: true });
    window.requestAnimationFrame?.(syncStickyMetrics);
  }

  function initGuidedTourAndFirstSteps(): void {
    document.addEventListener('click', event => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('[data-guided-tour-start]')) {
        guidedTourController?.start();
      }
      if (target.closest('[data-first-steps-dismiss]')) {
        dismissFirstSteps?.();
        renderFirstStepsMissionCard?.();
      }
      if (target.closest('[data-first-steps-restore]')) {
        restoreFirstSteps?.();
        activateTab('hoje');
        renderFirstStepsMissionCard?.();
        showToast?.('Guia de primeiros passos reativado.');
      }
    });

    document.querySelector('[data-guided-manual-return]')?.addEventListener('click', () => {
      activateTab('dashboard');
      onboardingController?.openGuidedOnboarding?.({ step: 'content' });
    });
  }

  function registerShellEvents(): () => void {
    const cleanupModal = initModalObserver();
    initGoHomeNavigation();
    const cleanupBackToTop = initBackToTop();
    initExecutionModeSwitchers();
    initGuidedTourAndFirstSteps();

    return () => {
      cleanupModal();
      cleanupBackToTop();
    };
  }

  return {
    syncModalShell,
    initModalObserver,
    initGoHomeNavigation,
    initBackToTop,
    initExecutionModeSwitchers,
    initGuidedTourAndFirstSteps,
    initStickyHeaderAndOverviewNav,
    jumpToTopic,
    registerShellEvents,
  };
}
