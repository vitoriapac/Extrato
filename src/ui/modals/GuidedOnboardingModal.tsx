import type { JSX } from 'preact';
import { Dialog } from '../primitives/dialog.js';
import { Icon } from '../primitives/icon.js';

export interface GuidedOnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuidedOnboardingModal({
  open,
  onClose,
}: GuidedOnboardingModalProps): JSX.Element {
  return (
    <Dialog
      id="guidedOnboardingOverlay"
      unstyled
      showHeader={false}
      showCloseButton={false}
      closeOnBackdropClick={false}
      restoreFocusOnClose={false}
      open={open}
      onClose={onClose}
      className={`onboarding-overlay${open ? ' show' : ''}`}
      aria-labelledby="guidedOnboardingTitle"
      aria-describedby="guidedOnboardingSubtitle"
    >
      <div class="onboarding-modal" role="document">
        <header class="onboarding-modal-header">
          <div>
            <h2 id="guidedOnboardingTitle">Vamos montar o seu plano</h2>
            <p id="guidedOnboardingSubtitle">
              Em quatro passos, seu edital vira um plano que cabe na rotina.
            </p>
          </div>
          <button
            class="onboarding-close inline-flex items-center justify-center"
            id="guidedOnboardingClose"
            type="button"
            aria-label="Fechar configuração"
            onClick={onClose}
          >
            <Icon name="x" size={18} />
          </button>
        </header>
        <div
          class="guided-onboarding-steps"
          id="guidedOnboardingProgress"
          aria-label="Progresso da configuração"
        />
        <div class="onboarding-modal-body">
          <main id="guidedOnboardingContent" />
          <aside
            id="guidedOnboardingHelp"
            class="onboarding-help"
            aria-label="Como esta etapa será usada"
          />
        </div>
        <footer class="onboarding-modal-actions" id="guidedOnboardingActions" />
      </div>
    </Dialog>
  );
}
