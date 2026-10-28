import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { calculateEbbinghausRetention } from '../../domain/help/retention-simulator.js';

export function EbbinghausSimulator(): JSX.Element {
  const [days, setDays] = useState(7);
  const [withReviews, setWithReviews] = useState(true);

  const simulation = calculateEbbinghausRetention(days, withReviews);

  const barColor =
    simulation.decayStage === 'consolidated'
      ? 'bg-emerald-500 text-emerald-950'
      : simulation.decayStage === 'declining'
        ? 'bg-amber-500 text-amber-950'
        : 'bg-rose-500 text-rose-50';

  return (
    <div
      class="mt-4 rounded-xl border border-border bg-surface-subtle p-4 shadow-xs"
      role="region"
      aria-label="Simulador interativo da Curva de Ebbinghaus"
      data-testid="ebbinghaus-simulator"
    >
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            🧠
          </span>
          <h5 class="text-sm font-semibold text-text">
            Simulador de Retenção e Curva de Ebbinghaus
          </h5>
        </div>
        <div class="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
          <button
            type="button"
            class={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              withReviews
                ? 'bg-primary text-primary-contrast shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
            onClick={() => setWithReviews(true)}
            aria-pressed={withReviews}
          >
            Com revisões (24h, 7d, 21d)
          </button>
          <button
            type="button"
            class={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              !withReviews
                ? 'bg-danger text-danger-contrast shadow-xs'
                : 'text-text-muted hover:text-text'
            }`}
            onClick={() => setWithReviews(false)}
            aria-pressed={!withReviews}
          >
            Sem revisões
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between text-xs text-text-muted">
            <label for="ebbinghaus-days-slider" class="font-medium text-text">
              Tempo decorrido desde o 1º estudo:
            </label>
            <span class="font-semibold text-text">
              {days === 0 ? 'Hoje (0 dias)' : days === 1 ? '1 dia' : `${days} dias`}
            </span>
          </div>
          <input
            id="ebbinghaus-days-slider"
            type="range"
            min="0"
            max="30"
            value={days}
            onInput={(e: any) => setDays(Number(e.target.value))}
            class="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-muted accent-primary"
            aria-label="Dias decorridos"
          />
          <div class="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>D+0</span>
            <span class={withReviews ? 'font-bold text-primary' : ''}>D+1 (1ª rev)</span>
            <span class={withReviews ? 'font-bold text-primary' : ''}>D+7 (2ª rev)</span>
            <span class={withReviews ? 'font-bold text-primary' : ''}>D+21 (3ª rev)</span>
            <span>D+30</span>
          </div>
        </div>

        <div class="rounded-lg border border-border bg-surface p-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-text-muted">Retenção estimada na memória:</span>
            <span class="text-base font-bold text-text">{simulation.retentionPct}%</span>
          </div>

          <div class="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              class={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${simulation.retentionPct}%` }}
              role="progressbar"
              aria-valuenow={simulation.retentionPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div class="mt-2.5 flex items-start gap-2">
            <span class="mt-0.5 inline-block text-xs">
              {simulation.decayStage === 'consolidated'
                ? '🟢'
                : simulation.decayStage === 'declining'
                  ? '🟡'
                  : '🔴'}
            </span>
            <div class="text-xs">
              <strong class="font-semibold text-text">{simulation.stageLabel}: </strong>
              <span class="text-text-muted">{simulation.stageDescription}</span>
            </div>
          </div>
        </div>

        <p class="text-[11px] leading-relaxed text-text-muted">
          💡 <strong>Por que isso importa?</strong> Sem revisões programadas, você precisará
          reaprender a matéria do zero perto da prova. O StudyTrack calcula automaticamente esses
          ciclos para você na aba <em>Agenda</em>.
        </p>
      </div>
    </div>
  );
}
