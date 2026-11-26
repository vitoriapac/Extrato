import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import { OptionalModulesDialog } from '../components/OptionalModulesDialog.js';
import type { AppState } from '../../core/types.js';

const KEY = 'studytrack.modules';

export type OptionalModuleKey = 'energy' | 'achievements' | 'journal';

// Extras that most experienced students skip. Hidden by default, except for whoever already has
// records in them; the choice is per browser and never deletes data. Selectors live in app.css.
export const OPTIONAL_MODULES: ReadonlyArray<{
  key: OptionalModuleKey;
  label: string;
  description: string;
  hasData: (state: AppState) => boolean;
}> = [
  {
    key: 'energy',
    label: 'Sono e energia',
    description: 'Pergunta do sono em Hoje e o cartão de turnos, energia e sono em Desempenho.',
    hasData: state =>
      (state.sleepLog?.length || 0) > 0 ||
      (state.studySessions || []).some(session => session.energyLevel || session.focusLevel),
  },
  {
    key: 'achievements',
    label: 'Conquistas',
    description: 'Subaba Conquistas em Hoje e os avisos de conquista desbloqueada.',
    hasData: state => Object.keys(state.achievementUnlocks || {}).length > 0,
  },
  {
    key: 'journal',
    label: 'Diário de aprendizagem',
    description: 'Anotações rápidas de dúvidas e pegadinhas na lateral de Hoje.',
    hasData: state => (state.learningJournal?.length || 0) > 0,
  },
];

type Choices = Partial<Record<OptionalModuleKey, boolean>>;

export function resolveModules(state: AppState, choices: Choices) {
  return Object.fromEntries(
    OPTIONAL_MODULES.map(module => [module.key, choices[module.key] ?? module.hasData(state)])
  ) as Record<OptionalModuleKey, boolean>;
}

export function createOptionalModulesController({
  document,
  storage,
  getState,
}: {
  document: Document;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  getState: () => AppState;
}) {
  const read = (): Choices => {
    try {
      return JSON.parse(storage?.getItem(KEY) || '{}') || {};
    } catch {
      return {};
    }
  };
  const write = (choices: Choices) => {
    try {
      storage?.setItem(KEY, JSON.stringify(choices));
    } catch {
      // Modo privado: vale só nesta sessão.
    }
  };
  let open = false;

  const isOn = (key: OptionalModuleKey) => resolveModules(getState(), read())[key];

  function apply() {
    const modules = resolveModules(getState(), read());
    for (const [key, on] of Object.entries(modules))
      document.documentElement.setAttribute(`data-module-${key}`, on ? 'on' : 'off');
    // A hidden subtab must not leave Hoje blank.
    if (
      !modules.achievements &&
      /^#hoje\/conquistas/.test(document.defaultView?.location.hash || '')
    )
      document.defaultView!.location.hash = '#hoje';
  }

  function render() {
    let mount = document.getElementById('optionalModulesMount');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'optionalModulesMount';
      document.body?.appendChild?.(mount);
    }
    if (!open) {
      unmountPreact(mount);
      return;
    }
    mountPreact(
      h(OptionalModulesDialog, {
        modules: OPTIONAL_MODULES,
        values: resolveModules(getState(), read()),
        onChange: (key: OptionalModuleKey, on: boolean) => {
          write({ ...read(), [key]: on });
          apply();
          render();
        },
        onClose: () => {
          open = false;
          render();
        },
      }),
      mount
    );
  }

  function init() {
    apply();
    document.getElementById('optionalModulesBtn')?.addEventListener('click', () => {
      open = true;
      render();
    });
  }

  return { init, apply, isOn };
}
