import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { Badge } from '../../primitives/badge.js';
import type { VolatileMasteryViewModel } from '../../../application/analytics/build-volatile-mastery-view-model.js';

export interface VolatileMasteryGridProps {
  model: VolatileMasteryViewModel;
  onScheduleReview?: (topicId: string, subjectId: string) => void;
  onViewRetentionAnalysis?: () => void;
}

export function VolatileMasteryGrid({
  model,
  onScheduleReview,
  onViewRetentionAnalysis,
}: VolatileMasteryGridProps): JSX.Element {
  const { volatileTopics, summary } = model;

  return (
    <article class="chart-card cockpit-analytics-card flex flex-col justify-between h-full" aria-labelledby="volatileGridTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded bg-surface-subtle text-red">
            <Icon name="brain" size={20} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="volatileGridTitle" class="text-base font-semibold text-content-primary m-0">
                Queda de retenção entre avaliações
              </h3>
              {volatileTopics.length > 0 && <Badge variant="danger">Retenção em risco</Badge>}
            </div>
            <p class="text-xs text-content-secondary m-0 mt-0.5">
              Tópicos com acerto alto logo após o estudo e queda depois de 14 dias sem revisão
            </p>
          </div>
        </div>
        {onViewRetentionAnalysis && (
          <button
            type="button"
            class="btn ghost small flex items-center gap-1 text-xs"
            onClick={onViewRetentionAnalysis}
            title="Ver análise completa de retenção e curva de esquecimento"
          >
            <span>Ver retenção</span>
            <Icon name="arrow-right" size={14} />
          </button>
        )}
      </header>

      {volatileTopics.length === 0 ? (
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-md">
          <div class="inline-flex p-2 rounded-full bg-surface-card text-content-secondary mb-2">
            <Icon name="info-circle" size={24} />
          </div>
          <p class="m-0 font-medium text-content-primary">Nenhuma queda de retenção detectada</p>
          <p class="m-0 mt-1 text-xs">
            Nenhum tópico caiu entre avaliações. Sem questões em datas diferentes, não há como medir.
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {volatileTopics.map(item => (
            <div
              key={item.topicId}
              class="p-3 rounded-default border border-border-subtle bg-surface-elevated hover:border-border-strong transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <span class="text-xs font-medium text-content-primary truncate max-w-[65%]">
                    {item.subjectName}
                  </span>
                  <Badge variant={item.statusVariant}>
                    -{item.accuracyDrop} p.p.
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-content-primary m-0 mb-2 line-clamp-2" title={item.topicName}>
                  {item.topicName}
                </h4>

                <div class="grid grid-cols-2 gap-2 p-2 rounded bg-surface-subtle text-xs mb-2">
                  <div>
                    <span class="text-xs text-content-secondary block uppercase">Logo após o estudo</span>
                    <span class="font-bold font-mono text-green text-sm">{item.initialAccuracy}%</span>
                  </div>
                  <div class="border-l border-border-subtle pl-2">
                    <span class="text-xs text-content-secondary block uppercase">Após {item.daysBetweenAssessments} dias</span>
                    <span class="font-bold font-mono text-red text-sm">{item.spacedAccuracy}%</span>
                  </div>
                </div>

                <p class="text-xs text-content-secondary m-0 mb-3 italic">
                  "{item.recommendation}"
                </p>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span class="text-xs text-content-tertiary">
                  {item.sampleQuestionsCount} questões analisadas
                </span>
                {onScheduleReview && (
                  <button
                    type="button"
                    class="btn small ghost flex items-center gap-1 text-xs py-1 px-2.5"
                    onClick={() => onScheduleReview(item.topicId, item.subjectId)}
                    aria-label={`${item.actionText}: ${item.topicName}`}
                    title={`Agendar revisão de ${item.topicName} na Agenda`}
                  >
                    <Icon name="calendar-plus" size={14} />
                    <span>{item.actionText}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {volatileTopics.length > 0 && (
        <footer class="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
          <span class="flex items-center gap-1.5">
            <Icon name="info-circle" size={14} />
            <span>{summary}</span>
          </span>
        </footer>
      )}
    </article>
  );
}
