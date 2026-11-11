import type { JSX } from 'preact';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export interface QuestionsImportModalProps {
  open: boolean;
  canConfirm?: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export function QuestionsImportModal({
  open,
  canConfirm = false,
  onClose,
  onCancel = onClose,
  onConfirm = () => {},
}: QuestionsImportModalProps): JSX.Element {
  return (
    <Dialog
      id="questionsImportOverlay"
      open={open}
      onClose={onClose}
      title="Prévia da importação de questões"
      titleId="questionsImportTitle"
      showCloseButton={false}
      maxWidth="2xl"
      className={open ? 'show' : ''}
      footer={
        <div class="modal-actions">
          <Button variant="ghost" id="questionsImportCancelBtn" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            id="questionsImportConfirmBtn"
            hidden={!canConfirm}
            onClick={onConfirm}
          >
            Confirmar importação
          </Button>
        </div>
      }
    >
      <div id="questionsImportContent" />
    </Dialog>
  );
}
