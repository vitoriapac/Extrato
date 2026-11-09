import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';
import { Icon } from '../primitives/icon.js';

export interface AccountMergeConflictModalProps {
  open: boolean;
  onClose: () => void;
  localUpdatedAt?: string | null;
  remoteUpdatedAt?: string | null;
  onChooseRemote: () => void;
  onChooseLocal: () => void;
  onDownloadBackup: () => void;
}

export function AccountMergeConflictModal({
  open,
  onClose,
  localUpdatedAt,
  remoteUpdatedAt,
  onChooseRemote,
  onChooseLocal,
  onDownloadBackup,
}: AccountMergeConflictModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Conflito de Sincronização Encontrado"
      maxWidth="md"
      aria-label="Escolher versão dos dados entre este dispositivo e a nuvem"
    >
      <div class="flex flex-col gap-4 text-text">
        <p class="text-xs text-secondary m-0 leading-relaxed">
          Encontramos dados de estudo salvos neste navegador e também na sua conta da nuvem.
          Para garantir a integridade dos seus registros, escolha como deseja prosseguir:
        </p>

        {/* Comparativo de Versões */}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Este Dispositivo */}
          <div class="p-3.5 rounded-default border border-border-default bg-surface-subtle flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Icon name="device-laptop" size={16} class="text-secondary shrink-0" />
              <strong class="text-xs font-semibold text-text">Este Dispositivo (Navegador)</strong>
            </div>
            <p class="text-[11px] text-secondary m-0">
              {localUpdatedAt ? `Última alteração: ${localUpdatedAt}` : 'Contém registros recentes deste navegador'}
            </p>
            <div class="pt-2 mt-auto">
              <Button
                variant="secondary"
                size="small"
                onClick={onChooseLocal}
                className="w-full"
              >
                Substituir nuvem por este dispositivo
              </Button>
            </div>
          </div>

          {/* Card Nuvem */}
          <div class="p-3.5 rounded-default border border-border-default bg-surface-subtle flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Icon name="cloud" size={16} class="text-accent shrink-0" />
              <strong class="text-xs font-semibold text-text">Dados na Nuvem</strong>
            </div>
            <p class="text-[11px] text-secondary m-0">
              {remoteUpdatedAt ? `Última alteração: ${remoteUpdatedAt}` : 'Sincronizado a partir de outro aparelho'}
            </p>
            <div class="pt-2 mt-auto">
              <Button
                variant="primary"
                size="small"
                onClick={onChooseRemote}
                className="w-full"
              >
                Manter dados da nuvem
              </Button>
            </div>
          </div>
        </div>

        {/* Zona de Segurança / Backup */}
        <div class="p-3 rounded-default border border-border-default bg-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <Icon name="shield-check" size={18} class="text-accent shrink-0" />
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-text">Prefere se prevenir?</span>
              <span class="text-[11px] text-secondary">
                Baixe um arquivo JSON com todos os dados deste dispositivo antes de sincronizar.
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="small"
            iconLeft="download"
            onClick={onDownloadBackup}
            className="shrink-0"
          >
            Baixar backup JSON
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
