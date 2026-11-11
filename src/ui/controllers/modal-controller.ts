import { h } from 'preact';
import { mountPreact } from '../preact-mount.js';
import { ConfirmPromptModal } from '../components/ConfirmPromptModal.js';
import { syncDialogOpen } from '../primitives/dialog.js';

export function createModalController({ document, window }: any = {}) {
  if (!document || !window) throw new TypeError('Controlador de modal requer documento e janela.');
  let activeCleanup: any = null;

  const mountNode =
    typeof globalThis.document !== 'undefined' &&
    document === globalThis.document &&
    typeof document.createElement === 'function'
      ? document.getElementById('confirmModalMount')
      : null;

  const viewState: {
    open: boolean;
    title: string;
    message: string;
    hasPrompt: boolean;
    promptLabel: string;
    promptValue: string;
    promptPlaceholder: string;
    promptError: string;
    confirmLabel: string;
    confirmVariant: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
  } = {
    open: false,
    title: 'Confirmar ação',
    message: 'Tem certeza?',
    hasPrompt: false,
    promptLabel: 'Nome',
    promptValue: '',
    promptPlaceholder: '',
    promptError: '',
    confirmLabel: 'Confirmar',
    confirmVariant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  };

  function renderDeclarativeModal(): void {
    if (!mountNode) return;
    mountPreact(
      h(ConfirmPromptModal, {
        open: viewState.open,
        title: viewState.title,
        message: viewState.message,
        hasPrompt: viewState.hasPrompt,
        promptLabel: viewState.promptLabel,
        promptValue: viewState.promptValue,
        promptPlaceholder: viewState.promptPlaceholder,
        promptError: viewState.promptError,
        confirmLabel: viewState.confirmLabel,
        confirmVariant: viewState.confirmVariant,
        onPromptChange: value => {
          viewState.promptValue = value;
        },
        onConfirm: () => viewState.onConfirm(),
        onCancel: () => viewState.onCancel(),
      }),
      mountNode
    );
    syncDialogOpen(document, 'modalOverlay', viewState.open);
  }

  if (mountNode) {
    renderDeclarativeModal();
  }

  const confirm = (message: any, onConfirm: any = () => {}, onCancel?: any, options: any = {}) => {
    if (activeCleanup) activeCleanup(false);

    if (mountNode) {
      const previous = document.activeElement;
      const hasPrompt = Boolean(options.prompt);
      const confirmLabel = options.confirmLabel || 'Confirmar';
      const defaultVariant: 'primary' | 'danger' =
        hasPrompt && !/limpar|excluir|apagar/i.test(String(confirmLabel)) ? 'primary' : 'danger';
      const confirmVariant: 'primary' | 'danger' = options.confirmVariant || defaultVariant;
      let closed = false;
      let frame = 0;

      const focusInitial = () => {
        const target = document.getElementById(hasPrompt ? 'modalPromptInput' : 'modalCancelBtn');
        target?.focus();
      };

      const cleanup = (restore = true) => {
        if (closed) return;
        closed = true;
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        activeCleanup = null;
        viewState.open = false;
        viewState.promptError = '';
        renderDeclarativeModal();
        if (
          !document.querySelector?.('.modal-overlay.show,.onboarding-overlay.show,dialog[open]')
        ) {
          document.getElementById('mainContent')?.removeAttribute('inert');
        }
        if (restore && previous?.isConnected && typeof previous.focus === 'function') {
          previous.focus();
        }
      };

      const accept = () => {
        if (closed) return;
        const inputEl = document.getElementById('modalPromptInput') as HTMLInputElement | null;
        const rawValue = inputEl ? inputEl.value : viewState.promptValue;
        const value = hasPrompt ? rawValue.trim() : undefined;
        const validation =
          hasPrompt && typeof options.prompt.validate === 'function'
            ? options.prompt.validate(value)
            : '';
        if (validation) {
          viewState.promptValue = rawValue;
          viewState.promptError = validation;
          renderDeclarativeModal();
          document.getElementById('modalPromptInput')?.focus();
          return;
        }
        cleanup(true);
        onConfirm(value);
      };

      const cancel = () => {
        if (closed) return;
        cleanup(true);
        if (typeof onCancel === 'function') onCancel();
      };

      viewState.open = true;
      viewState.title = options.title || (hasPrompt ? 'Informar dado' : 'Confirmar ação');
      viewState.message = String(message ?? '');
      viewState.hasPrompt = hasPrompt;
      viewState.promptLabel = options.prompt?.label || 'Nome';
      viewState.promptValue = options.prompt?.value || '';
      viewState.promptPlaceholder = options.prompt?.placeholder || '';
      viewState.promptError = '';
      viewState.confirmLabel = confirmLabel;
      viewState.confirmVariant = confirmVariant;
      viewState.onConfirm = accept;
      viewState.onCancel = cancel;

      activeCleanup = cleanup;
      renderDeclarativeModal();
      focusInitial();
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (!closed) focusInitial();
      });
      return;
    }

    const overlay = document.getElementById('modalOverlay');
    const previous = document.activeElement,
      messageNode = document.getElementById('modalMessage'),
      group = document.getElementById('modalPromptGroup'),
      input = document.getElementById('modalPromptInput'),
      label = document.getElementById('modalPromptLabel'),
      error = document.getElementById('modalPromptError'),
      confirmButton = document.getElementById('modalConfirmBtn'),
      cancelButton = document.getElementById('modalCancelBtn'),
      hasPrompt = Boolean(options.prompt),
      originalLabel = confirmButton.textContent;
    messageNode.textContent = message;
    group.hidden = !hasPrompt;
    error.textContent = '';
    if (hasPrompt) {
      label.textContent = options.prompt.label || 'Nome';
      input.value = options.prompt.value || '';
      input.placeholder = options.prompt.placeholder || '';
    }
    if (options.confirmLabel) confirmButton.textContent = options.confirmLabel;
    overlay.classList.add('show');
    let frame = 0;
    const cleanup = (restore = true) => {
      if (frame) window.cancelAnimationFrame(frame);
      overlay.classList.remove('show');
      confirmButton.removeEventListener('click', accept);
      cancelButton.removeEventListener('click', cancel);
      overlay.removeEventListener('click', outside);
      input.removeEventListener('keydown', enter);
      confirmButton.textContent = originalLabel;
      activeCleanup = null;
      if (!document.querySelector('.modal-overlay.show,.onboarding-overlay.show'))
        document.getElementById('mainContent')?.removeAttribute('inert');
      if (restore && previous?.isConnected) previous.focus();
    };
    const accept = () => {
      const value = hasPrompt ? input.value.trim() : undefined,
        validation =
          hasPrompt && typeof options.prompt.validate === 'function'
            ? options.prompt.validate(value)
            : '';
      if (validation) {
        error.textContent = validation;
        input.focus();
        return;
      }
      cleanup();
      onConfirm(value);
    };
    const cancel = () => {
      cleanup();
      if (typeof onCancel === 'function') onCancel();
    };
    const outside = (event: Event) => {
      if (event.target === overlay) cancel();
    };
    const enter = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        accept();
      }
    };
    confirmButton.addEventListener('click', accept);
    cancelButton.addEventListener('click', cancel);
    overlay.addEventListener('click', outside);
    if (hasPrompt) input.addEventListener('keydown', enter);
    activeCleanup = cleanup;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      (hasPrompt ? input : cancelButton).focus();
    });
  };
  return Object.freeze({
    confirm,
    prompt: (
      message: string,
      options: Record<string, any>,
      onConfirm: (value: string) => void,
      onCancel?: () => void
    ) =>
      confirm(message, onConfirm, onCancel, {
        confirmLabel: options.confirmLabel || 'Criar',
        prompt: options,
      }),
    close: () => activeCleanup?.(),
  });
}
