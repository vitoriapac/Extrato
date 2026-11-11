import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';

export interface DataManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export function DataManagementModal({ open, onClose }: DataManagementModalProps): JSX.Element {
  const periodStartRef = useRef<HTMLInputElement | null>(null);
  const periodEndRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Estado inicial oculto definido apenas no mount para não sobrescrever alternância do ReportController.
    if (periodStartRef.current) periodStartRef.current.hidden = true;
    if (periodEndRef.current) periodEndRef.current.hidden = true;
  }, []);

  return (
    <Dialog
      id="dataManagementOverlay"
      open={open}
      onClose={onClose}
      title="Gerenciamento de dados e backup"
      titleId="dataManagementTitle"
      closeButtonId="closeDataManagementBtn"
      closeButtonAriaLabel="Fechar gerenciamento de dados"
      maxWidth="2xl"
      className={`data-management-dialog${open ? ' show' : ''}`}
    >
      <div class="backup-block">
        <div>
          <div class="backup-title">Backup dos dados</div>
          <div class="backup-desc">
            Tudo fica salvo só neste navegador. Exporte de vez em quando para não perder nada e
            importe para restaurar em outro dispositivo.
          </div>
          <p class="backup-export-status" id="backupExportStatus" role="status" />
        </div>

        <div class="backup-actions">
          <label class="backup-period">
            <span>Período do relatório</span>
            <select
              class="select-control select-control--compact"
              id="reportPeriodSelect"
              aria-label="Período do relatório"
              defaultValue="30"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="custom">Período personalizado</option>
            </select>
          </label>
          <input
            ref={periodStartRef}
            type="date"
            id="reportPeriodStart"
            aria-label="Início do período do relatório"
          />
          <input
            ref={periodEndRef}
            type="date"
            id="reportPeriodEnd"
            aria-label="Fim do período do relatório"
          />
          <Button variant="ghost" size="small" id="exportReportBtn" iconLeft="file-type-pdf">
            Exportar relatório PDF
          </Button>
          <Button
            variant="ghost"
            size="small"
            id="exportBackupBtn"
            iconLeft="file-export"
            data-demo-protected
          >
            Exportar backup
          </Button>
          <Button
            variant="ghost"
            size="small"
            id="exportAutomaticBackupBtn"
            iconLeft="download"
            data-demo-protected
          >
            Baixar recuperação
          </Button>
          <Button
            variant="ghost"
            size="small"
            id="importBackupBtn"
            iconLeft="file-import"
            data-demo-protected
          >
            Importar backup
          </Button>
          <Button
            variant="ghost"
            size="small"
            id="openRemoteSyncBtn"
            iconLeft="cloud"
            data-demo-protected
          >
            Sincronização WebDAV (E2EE)
          </Button>
          <input
            type="file"
            id="importBackupFile"
            aria-label="Selecionar arquivo de backup"
            accept="application/json"
            class="hidden"
          />
        </div>

        <section class="backup-danger-zone" aria-labelledby="dangerZoneTitle">
          <div>
            <strong id="dangerZoneTitle">Zona de perigo</strong>
            <span>
              Apaga permanentemente os dados deste navegador. A demonstração permanece isolada.
            </span>
          </div>
          <Button
            variant="danger"
            size="small"
            id="clearAllDataBtn"
            iconLeft="trash"
            data-demo-protected
          >
            Limpar todos os dados
          </Button>
        </section>
      </div>
    </Dialog>
  );
}
