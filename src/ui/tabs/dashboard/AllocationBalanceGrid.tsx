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
  // Sem pesos ou sem horas toda linha seria "Sem evidência": uma linha diz isso uma vez só.
  const noEvidence = rows.length > 0 && rows.every(row => row.status === 'insufficient');

  return (
    <article class="chart-card cockpit-analytics-card" aria-labelledby="allocationGridTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded bg-surface-subtle text-accent">
            <Icon name="scale" size={20} />
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 id="allocationGridTitle" class="text-base font-semibold text-content-primary m-0">
                Balanço: Tempo Investido vs. Peso no Edital
              </h3>
              <Badge variant="default">Janela fixa · 30 dias</Badge>
            </div>
            <p class="text-xs text-content-secondary m-0 mt-0.5">
              Últimos 30 dias ({totalHours.toLocaleString('pt-BR')}h) comparados com a relevância na prova (independente do filtro de período acima)
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
            <span>{hasBlueprint ? 'Ajustar pesos' : 'Configurar pesos'}</span>
            <Icon name="arrow-right" size={14} />
          </button>
        )}
      </header>

      {rows.length === 0 ? (
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-md">
          <p class="m-0">Cadastre disciplinas e registre suas horas de estudo para ver o balanço.</p>
        </div>
      ) : noEvidence ? (
        <div class="p-4 text-sm text-content-secondary bg-surface-subtle rounded-md">
          <p class="m-0">
            {hasBlueprint
              ? 'Sem horas de estudo registradas nos últimos 30 dias.'
              : 'Sem pesos do edital configurados: não há base para comparar o seu tempo com a prova.'}
          </p>
        </div>
      ) : (
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-border-subtle text-content-secondary uppercase tracking-wider font-semibold">
                <th class="py-2 px-3">Disciplina</th>
                <th class="py-2 px-3 text-right hidden sm:table-cell">Horas (30d)</th>
                <th class="py-2 px-3 text-right">% Tempo</th>
                <th class="py-2 px-3 text-right">Peso Prova</th>
                <th class="py-2 px-3 w-32 hidden sm:table-cell">Comparativo</th>
                <th class="py-2 px-3 text-center hidden sm:table-cell">Diagnóstico</th>
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
                      <div class="sm:hidden mt-1 font-normal">
                        <Badge variant={row.statusVariant}>{row.statusLabel}</Badge>
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-right text-content-secondary font-mono hidden sm:table-cell">
                      {row.hoursSpent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}h
                    </td>
                    <td class="py-2.5 px-3 text-right font-medium text-content-primary font-mono">
                      {row.timePercent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                    </td>
                    <td class="py-2.5 px-3 text-right text-content-secondary font-mono">
                      {row.examWeightPercent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                    </td>
                    <td class="py-2.5 px-3 hidden sm:table-cell">
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
                          class="absolute top-0 bottom-0 w-0.5 bg-warning-emphasis"
                          style={{ left: `${weightMarker}%` }}
                          title={`Alvo (Peso): ${row.examWeightPercent}%`}
                        />
                      </div>
                    </td>
                    <td class="py-2.5 px-3 text-center hidden sm:table-cell">
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

      {rows.length > 0 && !noEvidence && (
        <footer class="mt-3 pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-content-secondary">
          <span class="flex items-center gap-1.5">
            <Icon name="info-circle" size={14} />
            <span>{summary}</span>
          </span>
        </footer>
      )}
    </article>
  );
}
