import type { JSX } from 'preact';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export interface ExamClassificationModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExamClassificationModal({
  open,
  onClose,
}: ExamClassificationModalProps): JSX.Element {
  return (
    <Dialog
      id="examClassificationOverlay"
      open={open}
      onClose={onClose}
      title="Revisar classificações históricas"
      titleId="examClassificationTitle"
      description="Correções atualizam a incidência e as próximas recomendações. Sessões e recomendações anteriores permanecem preservadas."
      showCloseButton={false}
      maxWidth="2xl"
      className={open ? 'show' : ''}
      footer={
        <div class="modal-actions">
          <Button variant="ghost" id="examClassificationClose" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div id="examClassificationContent" />
    </Dialog>
  );
}
