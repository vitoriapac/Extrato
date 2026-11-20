import type { JSX } from 'preact';
import { formatPlanMinutes } from '../../core/format-duration.js';
import { Icon } from '../primitives/icon.js';
import { Button } from '../primitives/button.js';

export interface RealWeekBannerProps {
  overdueCount: number;
  deficitMinutes?: number;
  onOpenRecoveryMission?: () => void;
  onRecalibrateWeek?: () => void;
  onDismiss?: () => void;
}

export function RealWeekBanner({
  overdueCount,
  deficitMinutes = 0,
  onOpenRecoveryMission,
  onRecalibrateWeek,
  onDismiss,
}: RealWeekBannerProps): JSX.Element | null {
  const hasOverdue = overdueCount > 0;
  const hasDeficit = deficitMinutes > 0;

  if (!hasOverdue && !hasDeficit) return null;

  return (
    <aside
      class="mb-4 p-4 rounded-default border border-accent/30 bg-surface-elevated shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
      role="region"
      aria-label="Replanejamento da semana"
    >
      <div class="flex items-start gap-4">
        <div class="p-2 rounded-default bg-accent/10 text-accent shrink-0">
          <Icon name="heart-handshake" size={20} class="shrink-0" />
        </div>
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="font-semibold text-sm text-content-primary m-0 tracking-tight">
              Sua semana não saiu como planejada? Tudo bem.
            </h4>
            <span class="text-xs px-2 py-1 rounded font-medium bg-accent/10 text-accent">
              Replanejamento
            </span>
          </div>
          <p class="text-xs text-content-secondary leading-relaxed max-w-2xl m-0">
            {hasOverdue && hasDeficit
              ? `Você tem ${overdueCount} ${overdueCount === 1 ? 'pendência atrasada' : 'pendências atrasadas'} e ${formatPlanMinutes(deficitMinutes)} a redistribuir. A consistência se constrói na adaptação, não na culpa: resgate em blocos curtos ou redistribua o saldo sem perder seu histórico.`
              : hasOverdue
                ? `Você tem ${overdueCount} ${overdueCount === 1 ? 'pendência aguardando resgate' : 'pendências aguardando resgate'}. Em vez de acumular ansiedade, recupere os tópicos essenciais em uma missão rápida e guiada de até 30 minutos.`
                : `Você tem ${formatPlanMinutes(deficitMinutes)} de tarefas marcadas ainda por fazer nesta semana. Redistribua nos próximos dias, respeitando sua disponibilidade.`}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
        {hasOverdue && onOpenRecoveryMission && (
          <Button
            variant="secondary"
            size="small"
            className="inline-flex items-center gap-2 text-xs text-heading font-medium hover:border-border-hover"
            onClick={onOpenRecoveryMission}
            aria-label="Abrir missão guiada de até 30 minutos para recuperar as revisões atrasadas"
            title="Missão guiada de até 30 minutos"
          >
            <Icon name="bolt" size={14} class="shrink-0" />
            <span>Resgatar atrasos</span>
          </Button>
        )}
        {onRecalibrateWeek && (
          <Button
            variant="ghost"
            size="small"
            className="inline-flex items-center gap-2 text-xs text-content-secondary hover:text-content-primary"
            onClick={onRecalibrateWeek}
            aria-label="Redistribuir o saldo pendente da semana nos próximos dias"
          >
            <Icon name="refresh" size={14} class="shrink-0" />
            <span>Redistribuir saldo pendente</span>
          </Button>
        )}
        {onDismiss && (
          <button
            type="button"
            class="inline-flex items-center justify-center min-w-7 min-h-7 max-md:min-w-11 max-md:min-h-11 pointer-coarse:min-w-11 pointer-coarse:min-h-11 text-content-muted hover:text-content-secondary p-1 rounded border-0 bg-transparent cursor-pointer transition-colors"
            onClick={onDismiss}
            aria-label="Dispensar aviso de replanejamento"
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
