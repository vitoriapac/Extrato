import type { JSX } from 'preact';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export interface ExamImportModalProps {
  open: boolean;
  backHidden?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  onClose: () => void;
}

export function ExamImportModal({
  open,
  backHidden = true,
  nextLabel = 'Continuar',
  nextDisabled = false,
  onClose,
}: ExamImportModalProps): JSX.Element {
  return (
    <Dialog
      id="examImportOverlay"
      open={open}
      onClose={onClose}
      maxWidth="3xl"
      showHeader={false}
      showCloseButton={false}
      className={open ? 'show' : ''}
      innerClassName="exam-import-box"
      bodyClassName="exam-import-body"
      aria-labelledby="examImportTitle"
    >
      <h3 id="examImportTitle">Carregar edital</h3>
      <div id="examImportContent" />
      <div class="modal-actions">
        <Button variant="ghost" size="small" id="examImportCancelBtn">
          Cancelar
        </Button>
        <Button variant="ghost" size="small" id="examImportBackBtn" hidden={backHidden}>
          Voltar
        </Button>
        <Button
          variant="primary"
          id="examImportNextBtn"
          disabled={nextDisabled}
          data-testid="confirm-exam-import"
        >
          {nextLabel}
        </Button>
      </div>
    </Dialog>
  );
}
