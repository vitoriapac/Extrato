import { formatStudyMinutes } from '../../format-study-time.js';
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
    totalStudyMinutes,
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
              filtro de período ({formatStudyMinutes(totalStudyMinutes ?? totalStudyHours * 60)} no total).
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

      <div class="shift-bands" role="list" aria-label="Horas e precisão por turno">
        {shifts.map(shift => {
          const iconName = SHIFT_ICONS[shift.shift] || 'clock';
          const accuracy = shift.averageAccuracy;
          const deepFocus = periodFocus
            ? periodFocus.byShift[shift.shift]?.percent
            : shift.deepFocusPercent;
          return (
            <div key={shift.shift} role="listitem" class={`shift-band${shift.isPeak ? ' is-peak' : ''}`}>
              <div class="shift-band__head">
                <span class="shift-band__icon">
                  <Icon name={iconName} size={16} />
                </span>
                <span class="text-xs font-semibold text-content-primary">{shift.shiftLabel}</span>
                {shift.isPeak && <Badge variant="success">Melhor</Badge>}
              </div>
              <div class="shift-band__metric">
                <div class="flex justify-between items-center text-xs text-content-secondary">
                  <span>Horas de estudo:</span>
                  <span class="font-mono font-medium text-content-primary">
                    {formatStudyMinutes(shift.hoursSpent * 60)} ({shift.timePercent}%)
                  </span>
                </div>
                <div class="shift-band__track" role="img" aria-label={`${shift.shiftLabel}: ${shift.timePercent}% do tempo de estudo`}>
                  <i class="shift-band__fill is-hours" style={{ width: `${Math.max(0, Math.min(100, shift.timePercent))}%` }} />
                </div>
              </div>
              <div class="shift-band__metric">
                <div class="flex justify-between items-center text-xs text-content-secondary">
                  <span>Precisão em questões:</span>
                  <span class="font-mono font-semibold text-content-primary">
                    {accuracy !== null ? `${accuracy}%` : '—'}
                  </span>
                </div>
                <div class="shift-band__track" role="img" aria-label={accuracy !== null ? `${shift.shiftLabel}: precisão de ${accuracy}%` : `${shift.shiftLabel}: sem questões registradas`}>
                  {accuracy !== null && (
                    <i class="shift-band__fill is-accuracy" style={{ width: `${Math.max(0, Math.min(100, accuracy))}%` }} />
                  )}
                </div>
              </div>
              <div class="shift-band__focus text-xs text-content-secondary">
                <span>Foco profundo{periodFocus ? ' (período)' : ''}:</span>{' '}
                <span class="font-mono text-content-primary">{deepFocus != null ? `${deepFocus}%` : '—'}</span>
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
