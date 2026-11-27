import type { JSX } from 'preact';
import { Button } from '../../primitives/button.js';
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
    <section
      class="mt-6 pt-4 border-t border-border-subtle plateau-detector-card"
      aria-labelledby="plateauDetectorTitle"
    >
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <Icon name="trending-down" size={18} class="text-amber shrink-0" />
          <div>
            <div class="flex items-center gap-2">
              <h3 id="plateauDetectorTitle" class="text-base font-semibold text-content-primary m-0">
                Tópicos estagnados
              </h3>
              {hasPlateauDetected && (
                <Badge variant="warning">{stagnantTopics.length} em estagnação</Badge>
              )}
            </div>
            <p class="text-xs text-content-secondary m-0 mt-1">
              Assuntos com alto volume de questões sem ganho recente de precisão — momento de isolar dificuldades conceituais no Caderno de Erros.
            </p>
          </div>
        </div>
        {onOpenErrorNotebook && (
          <Button
            type="button"
            variant="ghost"
            size="small"
            className="flex items-center gap-1 text-xs"
            onClick={onOpenErrorNotebook}
            title="Abrir Caderno de Erros para isolar dificuldades conceituais"
          >
            <span>Caderno de Erros</span>
            <Icon name="arrow-right" size={14} />
          </Button>
        )}
      </header>

      {!hasPlateauDetected ? (
        <div class="py-4 text-sm text-content-secondary border-t border-border-subtle">
          <p class="m-0 font-medium text-content-primary flex items-center gap-2">
            <Icon name="circle-check" size={16} class="text-green shrink-0" />
            <span>Rendimento em evolução constante.</span>
          </p>
          <p class="m-0 mt-1 text-xs">
            Nenhum tópico em platô. As questões investidas estão se convertendo em ganho perceptível na precisão.
          </p>
        </div>
      ) : (
        <ul class="divide-y divide-border-subtle border-t border-border-subtle m-0 p-0 list-none">
          {stagnantTopics.map(item => (
            <li
              key={item.topicId}
              class="py-3 flex flex-col gap-2"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-medium text-content-secondary">
                      {item.subjectName}
                    </span>
                    <Badge variant={item.strategyVariant}>
                      {item.strategyLabel}
                    </Badge>
                    <span class="font-mono tabular-nums text-xs text-amber font-semibold">
                      {formatDecimal(item.averageAccuracy)}%
                    </span>
                    <span class="font-mono tabular-nums text-xs text-content-secondary">
                      {item.questionCount} q · {item.weeksStagnant} sem
                    </span>
                  </div>
                  <h4 class="text-sm font-semibold text-content-primary m-0 mt-1">
                    {item.topicName}
                  </h4>
                </div>
                {onScheduleReview && (
                  <Button
                    type="button"
                    variant="tonal"
                    size="small"
                    className="inline-flex items-center gap-1 text-xs"
                    onClick={() => onScheduleReview(item.topicId)}
                    title={`Agendar revisão focada de ${item.topicName}`}
                  >
                    <Icon name="target" size={14} />
                    <span>Agendar revisão</span>
                  </Button>
                )}
              </div>

              <div class="text-xs text-content-secondary">
                <strong class="text-content-primary">{item.headline}:</strong> {item.rationale}{' '}
                <span class="text-content-tertiary">({item.confidenceLabel})</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer class="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
        <span class="flex items-center gap-2">
          <Icon name="info-circle" size={14} />
          <span>{summary}</span>
        </span>
      </footer>
    </section>
  );
}
