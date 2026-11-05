import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import type { ErrorParetoVisualModel } from '../../../domain/practice/practice-visual-models.js';

export interface ErrorParetoChartProps {
  visual: ErrorParetoVisualModel;
  label?: string;
  className?: string;
}

export function ErrorParetoChart({
  visual,
  label = 'Perfil de causas de erro e distribuição de Pareto (80/20)',
  className = '',
}: ErrorParetoChartProps): JSX.Element {
  const { items, totalErrors, predominantCause, hasPrevious, vitalCount } = visual;

  if (!items || items.length === 0 || totalErrors === 0) {
    return (
      <div class={`p-4 text-center text-xs text-content-secondary ${className}`}>
        <p>Nenhum erro categorizado no período selecionado.</p>
      </div>
    );
  }

  const maxVal = Math.max(1, ...items.map(it => it.count));
  const vitalSummary =
    vitalCount > 0 && vitalCount < items.length
      ? vitalCount === 1
        ? `A primeira categoria soma ${items[vitalCount - 1].cumulativeShare}% dos erros.`
        : `As ${vitalCount} primeiras categorias somam ${items[vitalCount - 1].cumulativeShare}% dos erros.`
      : null;

  return (
    <div
      class={`chart-error-pareto space-y-3.5 p-4 rounded-xl bg-surface-elevated border border-border-default shadow-xs ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Topo informativo com a Causa Raiz */}
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span class="font-semibold text-content-primary">Distribuição de Falhas (Pareto)</span>
          <div class="text-[11px] text-content-secondary">
            {totalErrors} {totalErrors === 1 ? 'erro categorizado' : 'erros categorizados'} no período
          </div>
        </div>

        {predominantCause && (
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-warning-emphasis bg-warning-subtle border border-warning-subtle">
            <Icon name="alert-triangle" size={13} stroke={2.5} />
            Causa principal: <strong class="font-bold">{predominantCause}</strong>
          </span>
        )}
      </div>

      {vitalSummary && (
        <p class="analytics-note text-xs text-content-secondary">
          Cada barra mostra a parcela dos {totalErrors} erros registrados no recorte; o traço marca o acumulado até aquela categoria.{' '}
          <strong>{vitalSummary}</strong>
        </p>
      )}

      {/* Lista de Barras de Pareto */}
      <div class="space-y-2.5 pt-1">
        {items.map(item => {
          const barWidthPct = Math.min(100, Math.max(2, (item.count / maxVal) * 100));

          return (
            <div
              key={item.id}
              class="group p-2 rounded-lg bg-surface-ground/50 border border-border-subtle transition-colors hover:bg-surface-sunken/40"
            >
              <div class="flex items-center justify-between gap-2 mb-1 text-xs">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-content-secondary flex-shrink-0">
                    <Icon name={item.icon || 'alert-circle'} size={14} stroke={2} />
                  </span>
                  <span class="font-medium text-content-primary truncate error-profile-label">
                    {' '}{item.label}
                  </span>
                  {item.isVital && (
                    <span
                      class="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider text-warning-emphasis bg-warning-subtle"
                      title="Item dentro dos 80% prioritários do Princípio de Pareto"
                    >
                      Vital (80/20)
                    </span>
                  )}
                </div>

                <div class="flex items-center gap-2 flex-shrink-0 text-xs">
                  <span class="font-mono font-semibold text-content-primary">
                    {item.count}
                  </span>
                  <span class="text-content-secondary font-mono text-[11px]">
                    ({item.share}%)
                  </span>
                  {hasPrevious && item.delta !== null && (
                    <span
                      class={`text-[10px] font-mono font-medium ${
                        item.delta > 0
                          ? 'text-warning-emphasis'
                          : item.delta < 0
                            ? 'text-success-emphasis'
                            : 'text-content-secondary'
                      }`}
                      title="Comparação com o período anterior"
                    >
                      {item.delta >= 0 ? `+${item.delta}` : item.delta}
                      {Math.abs(item.delta) === 1 ? ' erro' : ' erros'} vs. período anterior
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de progresso individual + acumulada */}
              <div class="relative h-2 w-full bg-surface-sunken rounded-full overflow-hidden flex">
                <div
                  class={`h-full rounded-full transition-all duration-300 ${
                    item.isVital ? 'bg-warning-emphasis' : 'bg-content-secondary/40'
                  }`}
                  style={{ width: `${barWidthPct}%` }}
                  title={`${item.label}: ${item.count} erros (${item.share}%)`}
                />
                <i
                  class="error-profile-cumulative absolute top-0 bottom-0 w-0.5 bg-content-primary/60"
                  style={`left:${item.cumulativeShare}%`}
                  aria-hidden="true"
                />
              </div>

              <div class="flex justify-between items-center text-[10px] text-content-secondary mt-1">
                <span>Parcela relativa</span>
                <span class="font-mono text-content-secondary">acumulado {item.cumulativeShare}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
