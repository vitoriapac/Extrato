/**
 * Utilitários e serviços de diálogo e notificação da aplicação.
 *
 * Gerencia a exibição de avisos temporários (Toast + ToastViewport), indicador de salvamento (flashSaved),
 * modais de confirmação (confirm) e prompt de entrada de texto.
 *
 * Camada: UI Primitives.
 */

import { h } from 'preact';
import { mountPreact } from '../preact-mount.js';
import { Toast, ToastViewport } from './toast.js';

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

interface DeclarativeToastState {
  renderSeq: number;
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocusIn?: () => void;
  onFocusOut?: () => void;
}

export function createDialogFeedback(opts: DialogFeedbackOptions) {
  const { document, modalController } = opts;
  let toastTimer: any = null;
  let flashTimer: any = null;
  let endUndo: (() => void) | null = null;

  const docObj = document as Document & DialogFeedbackDocumentLike;
  const mountNode =
    typeof globalThis.document !== 'undefined' &&
    document === globalThis.document &&
    typeof docObj.createElement === 'function'
      ? docObj.getElementById('toastViewportMount')
      : null;

  const toastState: DeclarativeToastState = {
    renderSeq: 0,
    open: false,
    message: '',
  };

  function renderToast(): void {
    if (!mountNode) return;
    mountPreact(
      h(
        ToastViewport,
        { placement: 'centered' },
        h(Toast, {
          key: toastState.renderSeq,
          id: 'toast',
          compact: true,
          idle: true,
          open: toastState.open,
          variant: 'info',
          title: toastState.message,
          actionLabel: toastState.actionLabel,
          onAction: toastState.onAction,
          onMouseEnter: toastState.onMouseEnter,
          onMouseLeave: toastState.onMouseLeave,
          onFocusIn: toastState.onFocusIn,
          onFocusOut: toastState.onFocusOut,
        })
      ),
      mountNode
    );
  }

  renderToast();

  function hideDeclarativeToast(): void {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    endUndo?.();
    toastState.renderSeq += 1;
    toastState.open = false;
    toastState.message = '';
    toastState.actionLabel = undefined;
    toastState.onAction = undefined;
    toastState.onMouseEnter = undefined;
    toastState.onMouseLeave = undefined;
    toastState.onFocusIn = undefined;
    toastState.onFocusOut = undefined;
    renderToast();
  }

  function showToast(message: string, durationMs = 2600): void {
    if (mountNode) {
      endUndo?.();
      toastState.renderSeq += 1;
      toastState.open = true;
      toastState.message = message;
      toastState.actionLabel = undefined;
      toastState.onAction = undefined;
      toastState.onMouseEnter = undefined;
      toastState.onMouseLeave = undefined;
      toastState.onFocusIn = undefined;
      toastState.onFocusOut = undefined;
      renderToast();
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(hideDeclarativeToast, durationMs);
      return;
    }

    const el = document.getElementById('toast');
    if (!el) return;
    endUndo?.();
    el.textContent = message;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), durationMs);
  }

  /**
   * Notice with a "Desfazer" button (F6). It stays 10 s, pauses while pointed at or focused,
   * and Ctrl+Z outside text fields triggers it too.
   */
  function showUndoToast(message: string, onUndo: () => void, durationMs = 10000): void {
    if (mountNode) {
      endUndo?.();
      const hide = () => {
        hideDeclarativeToast();
      };
      const arm = (ms: number) => {
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(hide, ms);
      };
      const pause = () => {
        if (toastTimer) clearTimeout(toastTimer);
      };
      const resume = () => arm(4000);
      const undo = () => {
        hide();
        onUndo();
      };
      const onKey = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        const editing =
          target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '');
        if (
          !(event.ctrlKey || event.metaKey) ||
          event.shiftKey ||
          event.key.toLowerCase() !== 'z' ||
          editing
        )
          return;
        event.preventDefault();
        undo();
      };
      docObj.addEventListener('keydown', onKey);
      endUndo = () => {
        endUndo = null;
        docObj.removeEventListener('keydown', onKey);
      };
      toastState.renderSeq += 1;
      toastState.open = true;
      toastState.message = message;
      toastState.actionLabel = 'Desfazer';
      toastState.onAction = undo;
      toastState.onMouseEnter = pause;
      toastState.onMouseLeave = resume;
      toastState.onFocusIn = pause;
      toastState.onFocusOut = resume;
      renderToast();
      arm(durationMs);
      return;
    }

    const el = document.getElementById('toast');
    if (!el) return;
    endUndo?.();
    const doc = el.ownerDocument as Document;
    const text = doc.createElement('span');
    text.textContent = message;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'toast-action';
    button.textContent = 'Desfazer';
    const hide = () => {
      el.classList.remove('show', 'has-action');
      endUndo?.();
    };
    const arm = (ms: number) => {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(hide, ms);
    };
    const pause = () => clearTimeout(toastTimer);
    const resume = () => arm(4000);
    const undo = () => {
      hide();
      onUndo();
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing =
        target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '');
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.shiftKey ||
        event.key.toLowerCase() !== 'z' ||
        editing
      )
        return;
      event.preventDefault();
      undo();
    };
    button.addEventListener('click', undo);
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('focusin', pause);
    el.addEventListener('focusout', resume);
    doc.addEventListener('keydown', onKey);
    endUndo = () => {
      endUndo = null;
      button.removeEventListener('click', undo);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('focusin', pause);
      el.removeEventListener('focusout', resume);
      doc.removeEventListener('keydown', onKey);
      el.classList.remove('has-action');
    };
    el.replaceChildren(text, button);
    el.classList.add('show', 'has-action');
    arm(durationMs);
  }

  function flashSaved(durationMs = 2000): void {
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
    showUndoToast,
    flashSaved,
    showConfirm,
    showPrompt,
  };
}
