import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { Badge } from '../../primitives/badge.js';
import { formatDecimal } from '../../../core/format-number.js';
import type { PlateauDetectorViewModel } from '../../../application/analytics/build-plateau-detector-view-model.js';

export interface PlateauDetectorCardProps {
  model: PlateauDetectorViewModel;
  onOpenErrorNotebook?: () => void;
  onScheduleReview?: (topicId: string) => void;
}

export function PlateauDetectorCard({
  model,
  onOpenErrorNotebook,
  onScheduleReview,
}: PlateauDetectorCardProps): JSX.Element {
  const { stagnantTopics, hasPlateauDetected, summary } = model;

  return (
    <article class="chart-card plateau-detector-card" aria-labelledby="plateauDetectorTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded bg-surface-subtle text-amber">
            <Icon name="trending-down" size={20} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="plateauDetectorTitle" class="text-base font-semibold text-content-primary m-0">
                Detector de Platô &amp; Inflexão Metodológica
              </h3>
              {hasPlateauDetected && (
                <Badge variant="warning">{stagnantTopics.length} em estagnação</Badge>
              )}
            </div>
            <p class="text-xs text-content-secondary m-0 mt-0.5">
              Assuntos com alto volume de questões sem ganho recente de precisão — momento de isolar dificuldades conceituais no Caderno de Erros.
            </p>
          </div>
        </div>
        {onOpenErrorNotebook && (
          <button
            type="button"
            class="btn ghost small flex items-center gap-1 text-xs"
            onClick={onOpenErrorNotebook}
            title="Abrir Caderno de Erros para isolar dificuldades conceituais"
          >
            <span>Caderno de Erros</span>
            <Icon name="arrow-right" size={14} />
          </button>
        )}
      </header>

      {!hasPlateauDetected ? (
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-md">
          <div class="inline-flex p-2 rounded-full bg-green-bg text-green mb-2">
            <Icon name="circle-check" size={24} />
          </div>
          <p class="m-0 font-medium text-content-primary">Rendimento em evolução constante!</p>
          <p class="m-0 mt-1 text-xs">
            Nenhum tópico em platô. As questões investidas estão se convertendo em ganho perceptível na precisão.
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stagnantTopics.map(item => (
            <div
              key={item.topicId}
              class="p-3.5 rounded-lg border border-border-subtle bg-surface-elevated hover:border-border-strong transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <span class="text-xs font-medium text-content-primary truncate max-w-[65%]">
                    {item.subjectName}
                  </span>
                  <Badge variant={item.strategyVariant}>
                    {item.strategyLabel}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-content-primary m-0 mb-2 line-clamp-2" title={item.topicName}>
                  {item.topicName}
                </h4>

                <div class="grid grid-cols-2 gap-2 p-2 rounded bg-surface-subtle text-xs mb-2.5">
                  <div>
                    <span class="text-xs text-content-secondary block uppercase">Precisão Estagnada</span>
                    <span class="font-bold font-mono text-amber text-sm">{formatDecimal(item.averageAccuracy)}%</span>
                  </div>
                  <div class="border-l border-border-subtle pl-2">
                    <span class="text-xs text-content-secondary block uppercase">Volume / Janelas</span>
                    <span class="font-bold font-mono text-content-primary text-sm">
                      {item.questionCount} q · {item.weeksStagnant} sem
                    </span>
                  </div>
                </div>

                <div class="p-2 rounded bg-surface-card-muted border border-border-subtle mb-3 text-xs">
                  <div class="font-semibold text-content-primary mb-0.5">{item.headline}</div>
                  <div class="text-xs text-content-secondary leading-relaxed">{item.rationale}</div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span class="text-xs text-content-tertiary">
                  {item.confidenceLabel}
                </span>
                {onScheduleReview && (
                  <button
                    type="button"
                    class="btn small primary flex items-center gap-1 text-xs py-1 px-2.5"
                    onClick={() => onScheduleReview(item.topicId)}
                    title={`Agendar revisão focada de ${item.topicName}`}
                  >
                    <Icon name="target" size={14} />
                    <span>Aplicar estratégia</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <footer class="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
        <span class="flex items-center gap-1.5">
          <Icon name="info-circle" size={14} />
          <span>{summary}</span>
        </span>
      </footer>
    </article>
  );
}
