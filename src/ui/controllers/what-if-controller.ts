import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import {
  WhatIfSimulatorModal,
  type WhatIfSimulatorModalProps,
} from '../forecasts/WhatIfSimulatorModal.js';

export interface WhatIfControllerContext {
  getContainer: () => HTMLElement | null;
  getState: () => unknown;
  getCurrentMetrics?: () => WhatIfSimulatorModalProps['currentMetrics'];
}

export function createWhatIfController(context: WhatIfControllerContext) {
  let isOpen = false;

  function renderModal() {
    const container = context.getContainer();
    if (!container) return;

    if (!isOpen) {
      unmountPreact(container);
      return;
    }

    mountPreact(
      h(WhatIfSimulatorModal, {
        open: isOpen,
        onClose: close,
        rawState: context.getState(),
        currentMetrics: context.getCurrentMetrics?.(),
      }),
      container
    );
  }

  function open() {
    isOpen = true;
    renderModal();
  }

  function close() {
    isOpen = false;
    renderModal();
  }

  return {
    open,
    close,
    isOpen: () => isOpen,
  };
}
