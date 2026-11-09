import type { SyncStatus } from '../../storage/cloud-saas-provider.js';
import { Icon } from '../primitives/icon.js';

export interface CloudSyncBadgeProps {
  status: SyncStatus;
  lastSyncedAt?: string | null;
  errorMessage?: string | null;
  onSyncNow?: () => void;
  className?: string;
  isCompact?: boolean;
}

function formatRelativeSyncTime(isoString?: string | null): string {
  if (!isoString) return 'Nunca sincronizado';
  try {
    const timestamp = Date.parse(isoString);
    if (Number.isNaN(timestamp)) return 'Horário desconhecido';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 30) return 'Agora mesmo';
    if (diffSec < 120) return 'Há 1 minuto';
    if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)} min`;
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Horário desconhecido';
  }
}

export function CloudSyncBadge({
  status,
  lastSyncedAt,
  errorMessage,
  onSyncNow,
  className = '',
  isCompact = false,
}: CloudSyncBadgeProps) {
  const formattedTime = formatRelativeSyncTime(lastSyncedAt);

  let iconName: 'cloud-check' | 'refresh' | 'cloud-off' | 'alert-circle' | 'cloud' = 'cloud-check';
  let iconClass = 'text-green';
  let label = 'Nuvem em dia';
  let ariaLabel = `Sincronização na nuvem em dia. Última sincronização: ${formattedTime}`;

  switch (status) {
    case 'syncing':
      iconName = 'refresh';
      iconClass = 'text-accent animate-spin';
      label = 'Sincronizando...';
      ariaLabel = 'Sincronizando seus dados com a nuvem...';
      break;
    case 'pending':
    case 'offline':
      iconName = 'cloud-off';
      iconClass = 'text-amber';
      label = status === 'offline' ? 'Offline (salvo localmente)' : 'Alterações pendentes';
      ariaLabel = 'Alterações gravadas no navegador e aguardando conexão para envio na nuvem.';
      break;
    case 'error':
      iconName = 'alert-circle';
      iconClass = 'text-red';
      label = 'Erro de sincronização';
      ariaLabel = errorMessage
        ? `Falha na sincronização: ${errorMessage}. Clique para tentar novamente.`
        : 'Falha na sincronização na nuvem. Clique para tentar novamente.';
      break;
    case 'synced':
    case 'idle':
    default:
      iconName = 'cloud-check';
      iconClass = 'text-green';
      label = 'Nuvem em dia';
      ariaLabel = `Sincronização na nuvem em dia. Última sincronização: ${formattedTime}`;
      break;
  }

  const content = (
    <>
      <Icon name={iconName} size={14} class={`${iconClass} shrink-0`} />
      {!isCompact && (
        <span class="text-xs font-medium text-secondary truncate max-w-[130px]">
          {label}
        </span>
      )}
    </>
  );

  if (onSyncNow) {
    return (
      <button
        type="button"
        onClick={onSyncNow}
        title={ariaLabel}
        aria-label={ariaLabel}
        class={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer bg-surface-subtle hover:bg-surface-elevated border border-border-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${className}`.trim()}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      role="status"
      title={ariaLabel}
      aria-label={ariaLabel}
      class={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-surface-subtle border border-border-default select-none ${className}`.trim()}
    >
      {content}
    </div>
  );
}
