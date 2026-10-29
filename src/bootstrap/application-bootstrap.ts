/**
 * Application Bootstrap & Runtime Orchestration
 *
 * Responsável pelo ponto de entrada de execução do StudyTrack:
 * - Registro do ciclo de vida da aplicação (beforeunload, responsive changes).
 * - Montagem da ponte oficial de testes automatizados (`window.__EXTRATO_TEST__`).
 * - Inicialização do runtime do aplicativo (carregamento de estado persistente ou bootstrap de testes).
 * - Gerenciamento de listas progressivas e navegação por abas.
 *
 * Camada: Bootstrap / Infrastructure (Composition Root Support).
 */

import { bootstrapApplication } from './bootstrap-application.js';
import { registerApplicationLifecycle } from './register-lifecycle.js';
import { registerMobileInputVisibility } from '../ui/mobile-input-visibility.js';
import { mountProgressiveLists } from '../ui/progressive-list.js';

export interface ApplicationLifecycleConfig {
  window: Window | any;
  document: Document | any;
  isTestMode: boolean;
  canSaveBeforeUnload: () => boolean;
  onPersistLocal: () => void;
  onResponsiveChange: () => void;
}

export function setupApplicationLifecycle(config: ApplicationLifecycleConfig): void {
  registerApplicationLifecycle({
    window: config.window,
    onBeforeUnload: () => {
      if (!config.isTestMode && config.canSaveBeforeUnload()) {
        config.onPersistLocal();
      }
    },
    onResponsiveChange: config.onResponsiveChange,
  });

  registerMobileInputVisibility({
    window: config.window,
    document: config.document,
  });
}

export interface TestBridgeConfig {
  window: Window | any;
  document: Document | any;
  api: Record<string, any>;
  activateInitialTab: () => void;
  ensureStateDefaults: () => void;
  restoreTimerFromState: () => void;
  render: () => void;
  testScriptPath?: string;
}

export function mountTestBridge(config: TestBridgeConfig): void {
  const win = config.window as any;
  win.__EXTRATO_TEST__ = config.api;

  config.activateInitialTab();
  config.ensureStateDefaults();
  config.restoreTimerFromState();
  config.render();

  const testScript = config.document.createElement('script');
  testScript.src = config.testScriptPath || 'tests/tests.js';
  config.document.body.appendChild(testScript);
}

export interface AppRuntimeConfig {
  isTestMode: boolean;
  context: any;
  loadState: () => Promise<void>;
  activateInitialTab: () => void;
  testBridgeConfig?: TestBridgeConfig;
  onError?: (error: unknown) => void;
}

export async function bootstrapAppRuntime(config: AppRuntimeConfig): Promise<void> {
  if (config.isTestMode && config.testBridgeConfig) {
    mountTestBridge(config.testBridgeConfig);
    return;
  }

  await bootstrapApplication({
    context: config.context,
    start: async () => {
      await config.loadState();
      config.activateInitialTab();
    },
    onError:
      config.onError ||
      ((error: unknown) => console.error('Falha na inicialização do aplicativo', error)),
  });
}

export interface ProgressiveListsConfig {
  document: Document | any;
  window: Window | any;
  onNavigateReset?: () => void;
}

export function setupProgressiveNavigation(config: ProgressiveListsConfig): any {
  const progressive = mountProgressiveLists({
    document: config.document,
    window: config.window,
  });

  (globalThis as Record<string, any>).studytrackProgressiveLists = progressive;

  config.document.addEventListener('studytrack:navigate', () => {
    (globalThis as Record<string, any>).studytrackProgressiveLists?.reset();
    config.onNavigateReset?.();
  });

  return progressive;
}
