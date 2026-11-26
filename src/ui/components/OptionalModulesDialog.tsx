import type { JSX } from 'preact';
import { Dialog } from '../primitives/dialog.js';
import type { OptionalModuleKey } from '../controllers/optional-modules-controller.js';

export function OptionalModulesDialog({
  modules,
  values,
  onChange,
  onClose,
}: {
  modules: ReadonlyArray<{ key: OptionalModuleKey; label: string; description: string }>;
  values: Record<OptionalModuleKey, boolean>;
  onChange: (key: OptionalModuleKey, on: boolean) => void;
  onClose: () => void;
}): JSX.Element {
  return (
    <Dialog open onClose={onClose} title="Módulos opcionais" maxWidth="sm">
      <div class="space-y-3 text-sm text-content-primary">
        <p class="m-0 text-content-secondary">
          Mostre só o que você usa. Desligar um módulo esconde a tela, não apaga registros.
        </p>
        <ul class="m-0 p-0 list-none space-y-3">
          {modules.map(module => (
            <li key={module.key}>
              <label class="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={values[module.key]}
                  onChange={event => onChange(module.key, event.currentTarget.checked)}
                />
                <span>
                  <strong>{module.label}</strong>
                  <span class="block text-xs text-content-secondary">{module.description}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  );
}
