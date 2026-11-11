import type { JSX } from 'preact';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export interface StructuredImportModalProps {
  open: boolean;
  canConfirm?: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export function StructuredImportModal({
  open,
  canConfirm = false,
  onClose,
  onCancel = onClose,
  onConfirm = () => {},
}: StructuredImportModalProps): JSX.Element {
  return (
    <Dialog
      id="structuredImportOverlay"
      open={open}
      onClose={onClose}
      title="Prévia da importação"
      titleId="structuredImportTitle"
      showCloseButton={false}
      maxWidth="2xl"
      className={open ? 'show' : ''}
      footer={
        <div class="modal-actions">
          <Button variant="ghost" id="structuredImportCancelBtn" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            id="structuredImportConfirmBtn"
            hidden={!canConfirm}
            onClick={onConfirm}
          >
            Confirmar importação
          </Button>
        </div>
      }
    >
      <div id="structuredImportContent" />
    </Dialog>
  );
}
