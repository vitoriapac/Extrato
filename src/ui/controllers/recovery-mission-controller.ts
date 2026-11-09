import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import {
  RecoveryMissionModal,
} from '../components/RecoveryMissionModal.js';
import type { OverdueReviewItem } from '../../domain/recovery/recovery-mission-engine.js';

export interface RecoveryMissionControllerContext {
  getContainer: () => HTMLElement | null;
  getOverdueReviews: () => OverdueReviewItem[];
  getCriticalTopicIds?: () => string[];
  onCompleteReview: (reviewId: string, origin: string) => void;
  onMissionFinished?: () => void;
}

export function createRecoveryMissionController(context: RecoveryMissionControllerContext) {
  let isOpen = false;

  function renderModal() {
    const container = context.getContainer();
    if (!container) return;

    if (!isOpen) {
      unmountPreact(container);
      return;
    }

    mountPreact(
      h(RecoveryMissionModal, {
        open: isOpen,
        onClose: close,
        overdueItems: context.getOverdueReviews(),
        criticalTopicIds: context.getCriticalTopicIds?.() || [],
        onCompleteReview: (reviewId, origin) => {
          context.onCompleteReview(reviewId, origin);
        },
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
    context.onMissionFinished?.();
  }

  return {
    open,
    close,
    isOpen: () => isOpen,
  };
}
