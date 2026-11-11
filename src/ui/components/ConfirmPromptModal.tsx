import type { JSX } from 'preact';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export interface ConfirmPromptModalProps {
  open: boolean;
  title?: string;
  message: string;
  hasPrompt: boolean;
  promptLabel?: string;
  promptValue: string;
  promptPlaceholder?: string;
  promptError?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onPromptChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPromptModal({
  open,
  title = 'Confirmar ação',
  message,
  hasPrompt,
  promptLabel = 'Nome',
  promptValue,
  promptPlaceholder = '',
  promptError = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  onPromptChange,
  onConfirm,
  onCancel,
}: ConfirmPromptModalProps): JSX.Element {
  return (
    <Dialog
      id="modalOverlay"
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth="sm"
      className={open ? 'show' : ''}
      aria-labelledby="modalMessage"
    >
      <div class="flex flex-col text-text-primary">
        <p id="modalMessage" class="text-sm text-text-primary leading-relaxed m-0">
          {message}
        </p>

        <div id="modalPromptGroup" hidden={!hasPrompt} class="flex flex-col gap-1.5 mt-4">
          <label
            htmlFor="modalPromptInput"
            id="modalPromptLabel"
            class="text-xs font-semibold text-text-primary"
          >
            {promptLabel}
          </label>
          <input
            id="modalPromptInput"
            type="text"
            maxLength={80}
            autoComplete="off"
            value={promptValue}
            placeholder={promptPlaceholder}
            aria-describedby="modalPromptError"
            aria-invalid={promptError ? 'true' : undefined}
            class="w-full box-border px-3 py-2 border border-border-control rounded bg-paper text-text-primary text-sm font-body focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            onInput={event => onPromptChange?.((event.currentTarget as HTMLInputElement).value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onConfirm();
              }
            }}
          />
          <span id="modalPromptError" role="alert" class="block min-h-[17px] text-red text-xs">
            {promptError}
          </span>
        </div>

        <div class="flex flex-wrap justify-end gap-2.5 mt-5">
          <Button id="modalCancelBtn" variant="ghost" size="small" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button id="modalConfirmBtn" variant={confirmVariant} size="small" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
