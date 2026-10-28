/**
 * Utilitários e serviços de diálogo e notificação da aplicação.
 *
 * Gerencia a exibição de avisos temporários (toast), indicador de salvamento (flashSaved),
 * modais de confirmação (confirm) e prompt de entrada de texto.
 *
 * Camada: UI Primitives.
 */

export interface ModalControllerInterface {
  confirm(
    message: string,
    onConfirm?: (value?: any) => void,
    onCancel?: () => void,
    options?: any
  ): void;
  prompt(
    message: string,
    options: Record<string, any>,
    onConfirm: (value?: any) => void,
    onCancel?: () => void
  ): void;
  close?: () => void;
}

export interface DialogFeedbackDocumentLike {
  getElementById(id: string): any;
}

export interface DialogFeedbackOptions {
  document: DialogFeedbackDocumentLike | Document;
  modalController?: ModalControllerInterface;
}

export function createDialogFeedback(opts: DialogFeedbackOptions) {
  const { document, modalController } = opts;
  let toastTimer: any = null;
  let flashTimer: any = null;

  function showToast(message: string, durationMs = 2600): void {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), durationMs);
  }

  function flashSaved(durationMs = 1200): void {
    const el = document.getElementById('saveIndicator');
    if (!el) return;
    el.classList.add('show');
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove('show'), durationMs);
  }

  function showConfirm(
    message: string,
    onConfirm: (value?: any) => void,
    onCancel?: () => void,
    options: any = {}
  ): void {
    if (modalController) {
      modalController.confirm(message, onConfirm, onCancel, options);
    }
  }

  function showPrompt(
    message: string,
    options: Record<string, any>,
    onConfirm: (value?: any) => void,
    onCancel?: () => void
  ): void {
    if (modalController) {
      modalController.prompt(message, options, onConfirm, onCancel);
    }
  }

  return {
    showToast,
    flashSaved,
    showConfirm,
    showPrompt,
  };
}
