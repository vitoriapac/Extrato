import { WindowBadge } from '../../performance/window-badge.js';
import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { Badge } from '../../primitives/badge.js';
import type { ShiftEnergyViewModel } from '../../../application/analytics/build-shift-energy-view-model.js';

/** Foco profundo por turno no período escolhido (outra janela que as horas e a precisão do cartão). */
export interface PeriodFocusByShift {
  label: string;
  byShift: Record<string, { percent: number | null; rated: number }>;
}

export interface ShiftEnergyCardProps {
  model: ShiftEnergyViewModel;
  periodFocus?: PeriodFocusByShift | null;
}

export function ShiftEnergyCard({ model, periodFocus = null }: ShiftEnergyCardProps): JSX.Element {
  const {
    shifts,
    peakShift,
    totalStudyHours,
    isSampleSufficient,
    fatigueAlert,
    recommendations,
    summary,
  } = model;

  // Uma frase de leitura: o alerta de queda, senão a primeira sugestão, senão o resumo.
  const reading = isSampleSufficient
    ? (fatigueAlert ?? recommendations[0] ?? summary)
    : summary;

  const SHIFT_ICONS: Record<string, string> = {
    morning: 'sun',
    afternoon: 'sun-low',
    night: 'moon',
  };

  return (
    <article class="chart-card shift-energy-card" aria-labelledby="shiftEnergyTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded bg-surface-subtle text-accent">
            <Icon name="sun" size={20} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 id="shiftEnergyTitle" class="text-base font-semibold text-content-primary m-0">
                Turno de estudo
              </h4>
              {peakShift && <Badge variant="success">Melhor rendimento observado</Badge>}
            </div>
            <p class="text-xs text-content-secondary m-0 mt-1">
              <WindowBadge kind="history" title="Todo o histórico registrado" /> Horas e precisão, sem o
              filtro de período ({totalStudyHours.toLocaleString('pt-BR')}h no total).
              {periodFocus && (
                <>
                  {' '}
                  <WindowBadge kind="period" title={periodFocus.label} /> Foco profundo, só no período
                  escolhido.
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {shifts.map(shift => {
          const iconName = SHIFT_ICONS[shift.shift] || 'clock';
          return (
            <div
              key={shift.shift}
              class={`p-card rounded-default border-t transition-all ${
                shift.isPeak
                  ? 'border-brand bg-surface-subtle/60 ring-1 ring-brand/20'
                  : 'border-border-subtle bg-surface-subtle/30'
              }`}
            >
              <div class="flex items-center justify-between gap-1 mb-2">
                <div class="flex items-center gap-2">
                  <div
                    class={`p-1 rounded ${shift.isPeak ? 'text-accent bg-accent/10' : 'text-content-secondary bg-surface-subtle'}`}
                  >
                    <Icon name={iconName} size={16} />
                  </div>
                  <span class="text-xs font-semibold text-content-primary">{shift.shiftLabel}</span>
                </div>
                {shift.isPeak && <Badge variant="success">Melhor</Badge>}
              </div>

              <div class="space-y-2 text-xs">
                <div class="flex justify-between items-center text-content-secondary">
                  <span>Horas de estudo:</span>
                  <span class="font-mono font-medium text-content-primary">
                    {shift.hoursSpent.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}h (
                    {shift.timePercent}%)
                  </span>
                </div>

                <div class="w-full h-2 bg-surface-subtle rounded overflow-hidden">
                  <div
                    class={`h-full rounded ${shift.isPeak ? 'bg-brand' : 'bg-brand-secondary/60'}`}
                    style={{ width: `${shift.timePercent}%` }}
                  />
                </div>

                <div class="flex justify-between items-center text-content-secondary pt-1">
                  <span>Precisão em questões:</span>
                  <span class="font-mono font-semibold text-content-primary">
                    {shift.averageAccuracy !== null ? `${shift.averageAccuracy}%` : '—'}
                  </span>
                </div>

                <div class="flex justify-between items-center text-content-secondary">
                  <span>Foco profundo{periodFocus ? ' (período)' : ''}:</span>
                  <span class="font-mono text-content-primary">
                    {periodFocus
                      ? periodFocus.byShift[shift.shift]?.percent != null
                        ? `${periodFocus.byShift[shift.shift].percent}%`
                        : '—'
                      : `${shift.deepFocusPercent}%`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p class="shift-energy-card__reading mt-3 pt-2 border-t border-border-subtle flex items-start gap-2 text-xs text-content-secondary m-0">
        <span class="inline-flex h-4 items-center shrink-0">
          <Icon name={fatigueAlert && isSampleSufficient ? 'alert-triangle' : 'info-circle'} size={14} />
        </span>
        <span>{reading}</span>
      </p>
    </article>
  );
}
