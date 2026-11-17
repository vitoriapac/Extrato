import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { formatPlanMinutes } from '../../core/format-duration.js';
import type { StudyCycleSubjectShare } from '../../domain/planning/study-cycle-engine.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';
import { Button } from '../primitives/button.js';
import { DonutChart, type DonutChartSliceInput } from '../primitives/charts/DonutChart.js';

export interface StudyCycleDonutProps {
  shares: StudyCycleSubjectShare[];
  subjects?: Array<{ id?: string; color?: unknown }>;
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  compact?: boolean;
  maxVisibleLegend?: number;
}

export function StudyCycleDonut({
  shares,
  subjects = [],
  size = 160,
  strokeWidth = 18,
  centerLabel = 'por volta',
  compact = false,
  maxVisibleLegend = 6,
}: StudyCycleDonutProps): JSX.Element | null {
  const [showAll, setShowAll] = useState(false);

  const positiveShares = shares.filter(share => share.minutes > 0);
  if (positiveShares.length === 0) return null;

  const totalMinutes = positiveShares.reduce((sum, share) => sum + share.minutes, 0);
  const totalSeconds = totalMinutes * 60;

  let cursorRatio = 0;
  const slices: DonutChartSliceInput[] = positiveShares.map(share => {
    const ratio = totalMinutes > 0 ? share.minutes / totalMinutes : 0;
    const startRatio = cursorRatio;
    cursorRatio += ratio;
    const matchedSubject = subjects.find(s => s?.id === share.subjectId) || { id: share.subjectId };
    return {
      subjectId: share.subjectId,
      subjectName: share.subjectName,
      colorSlot: subjectColorOf(matchedSubject, subjects),
      seconds: share.minutes * 60,
      percentage: share.sharePct,
      ratio,
      startRatio,
    };
  });

  const visibleShares = showAll
    ? positiveShares
    : positiveShares.slice(0, maxVisibleLegend);

  return (
    <div
      class={
        compact
          ? 'grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center gap-3'
          : 'grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-5'
      }
      data-study-cycle-donut="true"
    >
      <div class="flex justify-center shrink-0">
        <DonutChart
          slices={slices}
          totalSeconds={totalSeconds}
          centerLabel={centerLabel}
          size={size}
          strokeWidth={strokeWidth}
          label="Divisão de tempo do ciclo por disciplina"
        />
      </div>

      <div class="space-y-1.5 min-w-0">
        <div
          class="divide-y divide-border-subtle border-t border-b border-border-subtle"
          aria-label="Participação das disciplinas no ciclo"
        >
          {visibleShares.map(share => {
            const matchedSubject = subjects.find(s => s?.id === share.subjectId) || {
              id: share.subjectId,
            };
            const slot = subjectColorOf(matchedSubject, subjects);
            return (
              <div
                key={share.subjectId}
                class="flex items-center justify-between gap-3 py-1.5 text-xs text-content-secondary"
              >
                <span class="flex items-center gap-2 min-w-0">
                  <span
                    class={`subject-color-swatch subject-color-${slot} shrink-0`}
                    aria-hidden="true"
                  />
                  <strong class="text-content-primary font-medium truncate">
                    {share.subjectName}
                  </strong>
                </span>
                <span class="font-data shrink-0">
                  {formatPlanMinutes(share.minutes)} · {share.sharePct}%
                  {!compact && share.blocks > 0
                    ? ` (${share.blocks} ${share.blocks === 1 ? 'bloco' : 'blocos'})`
                    : ''}
                </span>
              </div>
            );
          })}
        </div>

        {positiveShares.length > maxVisibleLegend && (
          <Button
            variant="tertiary"
            size="small"
            aria-expanded={showAll}
            onClick={() => setShowAll(prev => !prev)}
          >
            {showAll
              ? 'Recolher disciplinas'
              : `Mostrar todas as ${positiveShares.length} disciplinas`}
          </Button>
        )}
      </div>
    </div>
  );
}
