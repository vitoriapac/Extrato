import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { Badge } from '../../primitives/badge.js';
import type { AllocationBalanceViewModel } from '../../../application/analytics/build-allocation-balance-view-model.js';

export interface AllocationBalanceGridProps {
  model: AllocationBalanceViewModel;
  onNavigatePlanning?: () => void;
}

export function AllocationBalanceGrid({
  model,
  onNavigatePlanning,
}: AllocationBalanceGridProps): JSX.Element {
  const { rows, totalHours, hasBlueprint, summary } = model;
  const [expanded, setExpanded] = useState(false);

  const visibleRows = expanded ? rows : rows.slice(0, 5);

  return (
    <article class="chart-card cockpit-analytics-card" aria-labelledby="allocationGridTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded bg-surface-subtle text-brand">
            <Icon name="scale" size={20} />
          </div>
          <div>
            <h3 id="allocationGridTitle" class="text-base font-semibold text-content-primary m-0">
              Balanço: Tempo Investido vs. Peso no Edital
            </h3>
            <p class="text-xs text-content-secondary m-0 mt-0.5">
              Últimos 30 dias ({totalHours.toLocaleString('pt-BR')}h) comparados com a relevância na prova
            </p>
          </div>
        </div>
        {onNavigatePlanning && (
          <button
            type="button"
            class="btn ghost small flex items-center gap-1 text-xs"
            onClick={onNavigatePlanning}
            title="Ajustar pesos e metas no planejamento"
          >
            <span>Ajustar pesos</span>
            <Icon name="arrow-right" size={14} />
          </button>
        )}
      </header>

      {rows.length === 0 ? (
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-md">
          <p class="m-0">Cadastre disciplinas e registre suas horas de estudo para ver o balanço.</p>
        </div>
      ) : (
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-border-subtle text-content-secondary uppercase tracking-wider font-semibold">
                <th class="py-2 px-3">Disciplina</th>
                <th class="py-2 px-3 text-right">Horas (30d)</th>
                <th class="py-2 px-3 text-right">% Tempo</th>
                <th class="py-2 px-3 text-right">Peso Prova</th>
                <th class="py-2 px-3 w-32">Comparativo</th>
                <th class="py-2 px-3 text-center">Diagnóstico</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              {visibleRows.map(row => {
                // Cálculo da largura visual da barra (proporção tempo vs peso)
                const maxVal = Math.max(row.timePercent, row.examWeightPercent, 10);
                const timeWidth = Math.min(100, Math.round((row.timePercent / maxVal) * 100));
                const weightMarker = Math.min(100, Math.round((row.examWeightPercent / maxVal) * 100));

                return (
                  <tr key={row.subjectId} class="hover:bg-surface-hover transition-colors">
                    <td class="py-2.5 px-3 font-medium text-content-primary">
                      {row.subjectName}
                    </td>
                    <td class="py-2.5 px-3 text-right text-content-secondary font-mono">
                      {row.hoursSpent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}h
                    </td>
                    <td class="py-2.5 px-3 text-right font-medium text-content-primary font-mono">
                      {row.timePercent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                    </td>
                    <td class="py-2.5 px-3 text-right text-content-secondary font-mono">
                      {row.examWeightPercent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="relative w-full h-3 bg-surface-subtle rounded overflow-hidden" title={`Tempo: ${row.timePercent}% | Peso: ${row.examWeightPercent}%`}>
                        <div
                          class={`h-full rounded ${
                            row.status === 'suballocated'
                              ? 'bg-amber'
                              : row.status === 'overallocated'
                              ? 'bg-brand-secondary'
                              : 'bg-green'
                          }`}
                          style={{ width: `${timeWidth}%` }}
                        />
                        <div
                          class="absolute top-0 bottom-0 w-0.5 bg-content-primary"
                          style={{ left: `${weightMarker}%` }}
                          title={`Alvo (Peso): ${row.examWeightPercent}%`}
                        />
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      <Badge variant={row.statusVariant}>
                        {row.statusLabel}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > 5 && (
            <div class="mt-2.5 flex justify-center">
              <button
                type="button"
                class="btn ghost small flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} />
                <span>
                  {expanded ? 'Mostrar menos' : `Mostrar mais (+${rows.length - 5} disciplinas)`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <footer class="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
        <span class="flex items-center gap-1.5">
          <Icon name="info-circle" size={14} />
          <span>{summary}</span>
        </span>
        {!hasBlueprint && (
          <span class="text-amber italic text-[11px]">
            Distribuição uniforme (edital não configurado)
          </span>
        )}
      </footer>
    </article>
  );
}
