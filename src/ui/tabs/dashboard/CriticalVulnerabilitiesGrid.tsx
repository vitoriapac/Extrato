import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { Badge } from '../../primitives/badge.js';
import type { CriticalVulnerabilitiesViewModel } from '../../../application/analytics/build-critical-vulnerabilities-view-model.js';

export interface CriticalVulnerabilitiesGridProps {
  model: CriticalVulnerabilitiesViewModel;
  onTrainTopic?: (topicId: string, subjectId: string) => void;
  onViewIntelligence?: () => void;
}

export function CriticalVulnerabilitiesGrid({
  model,
  onTrainTopic,
  onViewIntelligence,
}: CriticalVulnerabilitiesGridProps): JSX.Element {
  const { vulnerabilities, summary, measuredTopicsCount } = model;

  return (
    <article class="chart-card cockpit-analytics-card flex flex-col justify-between h-full" aria-labelledby="vulnerabilitiesGridTitle">
      <header class="section-head mb-3 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded bg-surface-subtle text-amber">
            <Icon name="shield-alert" size={20} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 id="vulnerabilitiesGridTitle" class="text-base font-semibold text-content-primary m-0">
                Radar de Vulnerabilidades Críticas
              </h3>
              {vulnerabilities.length > 0 && (
                <Badge variant="warning">
                  {vulnerabilities.length} {vulnerabilities.length === 1 ? 'maior risco' : 'maiores riscos'}
                </Badge>
              )}
            </div>
            <p class="text-xs text-content-secondary m-0 mt-0.5">
              Tópicos mais cobrados no concurso com domínio abaixo da meta
            </p>
          </div>
        </div>
        {onViewIntelligence && (
          <button
            type="button"
            class="btn ghost small flex items-center gap-1 text-xs"
            onClick={onViewIntelligence}
            title="Explorar matriz completa de incidência e domínio"
          >
            <span>Matriz completa</span>
            <Icon name="arrow-right" size={14} />
          </button>
        )}
      </header>

      {vulnerabilities.length === 0 ? (
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-md">
          <div class="inline-flex p-2 rounded-full bg-surface-card text-content-secondary mb-2">
            <Icon name="info-circle" size={24} />
          </div>
          <p class="m-0 font-medium text-content-primary">
            {measuredTopicsCount > 0
              ? 'Nenhuma vulnerabilidade crítica no escopo'
              : 'Sem tópicos com domínio medido'}
          </p>
          <p class="m-0 mt-1 text-xs">
            {measuredTopicsCount > 0
              ? `Os ${measuredTopicsCount} ${measuredTopicsCount === 1 ? 'tópico medido está' : 'tópicos medidos estão'} acima da meta.`
              : 'O radar compara com a meta só os tópicos que têm questões registradas.'}
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {vulnerabilities.map(item => (
            <div
              key={item.topicId}
              class="p-3 rounded-default border border-border-subtle bg-surface-elevated hover:border-border-strong transition-all flex flex-col justify-between"
            >
              <div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <span class="text-xs font-medium text-content-primary truncate max-w-[65%]">
                    {item.subjectName}
                  </span>
                  <Badge variant={item.urgencyVariant}>
                    {item.incidence}
                  </Badge>
                </div>
                <h4 class="text-sm font-semibold text-content-primary m-0 mb-2 line-clamp-2" title={item.topicName}>
                  {item.topicName}
                </h4>

                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="text-content-secondary">Domínio pessoal:</span>
                  <span class="font-bold font-mono text-amber">
                    {item.mastery}%
                    <span class="text-content-tertiary font-normal ml-1">
                      (Meta: {item.target}%)
                    </span>
                  </span>
                </div>

                <div class="w-full h-2 bg-surface-subtle rounded overflow-hidden mb-3">
                  <div
                    class="h-full bg-amber rounded"
                    style={{ width: `${Math.min(100, item.mastery)}%` }}
                  />
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span class="text-xs text-red font-medium">
                  Faltam {item.gap} p.p. para a meta
                </span>
                {onTrainTopic && (
                  <button
                    type="button"
                    class="btn small primary flex items-center gap-1 text-xs py-1 px-2.5"
                    onClick={() => onTrainTopic(item.topicId, item.subjectId)}
                    aria-label={`${item.actionText}: ${item.topicName}`}
                    title={`Registrar treino de questões em ${item.topicName}`}
                  >
                    <Icon name="target" size={14} />
                    <span>{item.actionText}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {vulnerabilities.length > 0 && (
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
