import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import type { PhaseRoadmapVisualModel } from '../../../domain/planning/planning-visual-models.js';

export interface PhaseRoadmapTimelineProps {
  visual: PhaseRoadmapVisualModel;
  label?: string;
  className?: string;
}

function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export function PhaseRoadmapTimeline({
  visual,
  label = 'Linha do tempo e fases de preparação para a prova',
  className = '',
}: PhaseRoadmapTimelineProps): JSX.Element {
  const {
    phase,
    phaseLabel,
    daysRemaining,
    examDate,
    progressPercentage,
    phasesList,
  } = visual;

  if (phase === 'undated' || !examDate) {
    return (
      <div class={`p-4 rounded-default bg-surface-elevated border border-border-default text-center ${className}`}>
        <div class="inline-flex p-2.5 rounded-full bg-surface-sunken text-content-secondary mb-2">
          <Icon name="calendar-event" size={20} stroke={1.5} />
        </div>
        <p class="text-sm font-medium text-content-primary">Data da Prova Não Definida</p>
        <p class="text-xs text-content-secondary mt-1">
          Defina a data prevista do seu concurso para ativar a régua de fases e o Modo Reta Final.
        </p>
      </div>
    );
  }

  return (
    <div
      class={`chart-phase-roadmap p-4 rounded-default bg-surface-elevated border border-border-default space-y-4 ${className}`}
      role="region"
      aria-label={label}
    >
      {/* Top Banner com Dias Restantes e Fase Ativa */}
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-default bg-accent-subtle text-accent-emphasis flex items-center justify-center">
            <Icon name="flag" size={20} stroke={2} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold uppercase tracking-wider text-accent-emphasis">
                Fase Atual
              </span>
              <span class="text-xs font-medium text-content-secondary">
                • Prova em {formatDate(examDate)}
              </span>
            </div>
            <h4 class="text-sm font-bold text-content-primary">
              {phaseLabel}
            </h4>
          </div>
        </div>

        <div class="text-right">
          <div class="text-2xl font-black font-mono tracking-tight text-content-primary">
            {daysRemaining}
            <span class="text-xs font-normal text-content-secondary ml-1">dias</span>
          </div>
          <span class="text-xs text-content-secondary">
            {progressPercentage}% do cronograma decorrido
          </span>
        </div>
      </div>

      {/* Régua de Progresso Visual */}
      <div class="space-y-1.5 pt-1">
        <div class="relative w-full h-3 bg-surface-sunken rounded-full overflow-hidden flex">
          <div
            class="h-full bg-accent-emphasis rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div class="flex justify-between text-xs text-content-secondary px-0.5">
          <span>Início</span>
          <span class="font-medium text-content-primary font-mono">{progressPercentage}%</span>
          <span>Dia da Prova</span>
        </div>
      </div>

      {/* Grid das 4 Fases Pedagógicas */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {phasesList.map(item => {
          const isCurrent = item.isActive;
          const isPassed = item.isPassed;

          let cardClass = 'bg-surface-sunken/40 border-border-subtle text-content-secondary';
          let badgeClass = 'bg-surface-elevated text-content-secondary border border-border-subtle';

          if (isCurrent) {
            cardClass = 'bg-accent-subtle/40 border-accent-emphasis/50 text-content-primary ring-1 ring-accent-emphasis/30';
            badgeClass = 'bg-accent-emphasis text-surface-ground font-semibold';
          } else if (isPassed) {
            cardClass = 'bg-surface-sunken border-border-subtle text-content-secondary';
            badgeClass = 'bg-success-emphasis text-surface-ground';
          }

          return (
            <div
              key={item.key}
              class={`p-2.5 rounded-default border flex flex-col justify-between transition-all ${cardClass}`}
            >
              <div>
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-xs font-semibold truncate">{item.label}</span>
                  {isCurrent && (
                    <span class={`px-1.5 py-0.5 rounded text-xs uppercase tracking-wider ${badgeClass}`}>
                      Agora
                    </span>
                  )}
                  {isPassed && !isCurrent && (
                    <span class="text-success-emphasis" title="Fase concluída">
                      <Icon name="check" size={12} stroke={2.5} />
                    </span>
                  )}
                </div>
                <p class="text-xs leading-snug line-clamp-2 text-content-secondary">
                  {item.description}
                </p>
              </div>

              <div class="mt-2 text-xs font-mono font-medium text-content-secondary">
                {item.minDays === 0 ? 'Última semana' : `${item.minDays}–${item.maxDays} dias`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
