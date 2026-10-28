import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { calculateEvidenceConfidence } from '../../domain/help/evidence-simulator.js';

export function EvidenceConfidenceSimulator(): JSX.Element {
  const [sampleSize, setSampleSize] = useState(25);
  const [accuracy, setAccuracy] = useState(75);

  const simulation = calculateEvidenceConfidence(sampleSize, accuracy);

  const badgeStyle =
    simulation.badgeTone === 'success'
      ? 'status-badge status-badge--success !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold'
      : simulation.badgeTone === 'info'
        ? 'status-badge status-badge--info !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold'
        : simulation.badgeTone === 'warning'
          ? 'status-badge status-badge--warning !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold'
          : 'status-badge status-badge--danger !rounded-full !px-2.5 !py-0.5 !text-xs !font-semibold';

  return (
    <div
      class="mt-4 rounded-xl border border-border bg-surface-subtle p-4 shadow-xs"
      role="region"
      aria-label="Simulador interativo de Confiabilidade da Evidência"
      data-testid="evidence-confidence-simulator"
    >
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            📊
          </span>
          <h5 class="text-sm font-semibold text-text">
            Simulador de Força da Evidência & Margem de Erro
          </h5>
        </div>
        <span class={badgeStyle} aria-live="polite">
          {simulation.levelLabel}
        </span>
      </div>

      <div class="space-y-4">
        {/* Sliders de controle */}
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div class="flex items-center justify-between text-xs text-text-muted">
              <label for="evidence-sample-slider" class="font-medium text-text">
                Volume de questões resolvidas:
              </label>
              <span class="font-semibold text-text">{sampleSize} questões</span>
            </div>
            <input
              id="evidence-sample-slider"
              type="range"
              min="1"
              max="150"
              value={sampleSize}
              onInput={(e: any) => setSampleSize(Number(e.target.value))}
              class="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-muted accent-primary"
              aria-label="Volume de questões resolvidas"
            />
            <div class="mt-1 flex justify-between text-[10px] text-text-muted">
              <span>1</span>
              <span>10 (Mínimo)</span>
              <span>30 (Sólido)</span>
              <span>80+ (Robusto)</span>
              <span>150</span>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-text-muted">
              <label for="evidence-accuracy-slider" class="font-medium text-text">
                Taxa de acerto observada:
              </label>
              <span class="font-semibold text-text">{accuracy}%</span>
            </div>
            <input
              id="evidence-accuracy-slider"
              type="range"
              min="40"
              max="100"
              step="5"
              value={accuracy}
              onInput={(e: any) => setAccuracy(Number(e.target.value))}
              class="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-muted accent-primary"
              aria-label="Taxa de acerto observada"
            />
            <div class="mt-1 flex justify-between text-[10px] text-text-muted">
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Painel de Resultados */}
        <div class="rounded-lg border border-border bg-surface p-3 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="text-xs font-medium text-text-muted">
                Margem de incerteza estatística:
              </span>
              <div class="text-sm font-bold text-text">
                ±{simulation.marginOfErrorPct}% de margem
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-medium text-text-muted">
                Intervalo real plausível (95% CI):
              </span>
              <div class="text-sm font-bold text-text">
                {simulation.confidenceRange[0]}% a {simulation.confidenceRange[1]}%
              </div>
            </div>
          </div>

          {/* Barra visual do intervalo de confiança */}
          <div class="relative h-4 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              class="absolute top-0 bottom-0 bg-primary/25 rounded-sm transition-all duration-300"
              style={{
                left: `${simulation.confidenceRange[0]}%`,
                width: `${simulation.confidenceRange[1] - simulation.confidenceRange[0]}%`,
              }}
              title={`Intervalo: ${simulation.confidenceRange[0]}% a ${simulation.confidenceRange[1]}%`}
            />
            <div
              class="absolute top-0 bottom-0 w-1 bg-primary rounded-full transition-all duration-300 -translate-x-1/2"
              style={{ left: `${accuracy}%` }}
              title={`Taxa observada: ${accuracy}%`}
            />
          </div>

          <div class="text-xs leading-relaxed text-text">
            <strong>Interpretação pedagógica: </strong>
            <span class="text-text-muted">{simulation.explanation}</span>
          </div>

          <div class="rounded-md bg-surface-subtle p-2 text-xs leading-relaxed text-text-muted">
            ⚖️ <strong>Como o algoritmo age: </strong>
            {simulation.recommendationDecision}
          </div>
        </div>

        <p class="text-[11px] leading-relaxed text-text-muted">
          💡 <strong>Princípio da Amostragem:</strong> Uma taxa de 100% com apenas 2 questões não
          prova maestria; assim como 0% em 1 questão não significa que você deve desistir do tópico.
          O StudyTrack exige massa crítica para consolidar a Prontidão.
        </p>
      </div>
    </div>
  );
}
