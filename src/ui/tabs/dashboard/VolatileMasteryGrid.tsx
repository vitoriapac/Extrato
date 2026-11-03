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
    <article class="chart-card cockpit-analytics-card" aria-labelledby="volatileGridTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded bg-surface-subtle text-red">
            <Icon name="brain" size={20} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="volatileGridTitle" class="text-base font-semibold text-content-primary m-0">
                Domínio Volátil & Ilusão de Competência
              </h3>
              <Badge variant="danger">Retenção em Risco</Badge>
            </div>
            <p class="text-xs text-content-secondary m-0 mt-0.5">
              Assuntos com acerto pós-aula elevado que desabaram após 14 dias sem revisão
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
          <div class="inline-flex p-2 rounded-full bg-green-bg text-green mb-2">
            <Icon name="circle-check" size={24} />
          </div>
          <p class="m-0 font-medium text-content-primary">Memória consolidada de longo prazo!</p>
          <p class="m-0 mt-1 text-xs">
            Nenhum tópico com queda abrupta de retenção após o período de repouso sináptico.
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {volatileTopics.map(item => (
            <div
              key={item.topicId}
              class="p-3 rounded-lg border border-border-subtle bg-surface-elevated hover:border-border-strong transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <span class="text-[11px] font-medium text-brand truncate max-w-[65%]">
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
                    <span class="text-[10px] text-content-secondary block uppercase">Pós-estudo (D0)</span>
                    <span class="font-bold font-mono text-green text-sm">{item.initialAccuracy}%</span>
                  </div>
                  <div class="border-l border-border-subtle pl-2">
                    <span class="text-[10px] text-content-secondary block uppercase">Espaçado ({item.daysBetweenAssessments}d)</span>
                    <span class="font-bold font-mono text-red text-sm">{item.spacedAccuracy}%</span>
                  </div>
                </div>

                <p class="text-xs text-content-secondary m-0 mb-3 italic">
                  "{item.recommendation}"
                </p>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span class="text-[11px] text-content-tertiary">
                  {item.sampleQuestionsCount} questões analisadas
                </span>
                {onScheduleReview && (
                  <button
                    type="button"
                    class="btn small ghost flex items-center gap-1 text-xs py-1 px-2.5 text-brand"
                    onClick={() => onScheduleReview(item.topicId, item.subjectId)}
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

      <footer class="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-content-secondary">
        <span class="flex items-center gap-1.5">
          <Icon name="info-circle" size={14} />
          <span>{summary}</span>
        </span>
      </footer>
    </article>
  );
}
