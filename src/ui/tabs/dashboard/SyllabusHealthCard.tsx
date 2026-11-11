import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { formatDecimal } from '../../../core/format-number.js';
import type {
  SyllabusHealthViewModel,
  SyllabusHealthSubject,
} from '../../../application/analytics/build-syllabus-health-view-model.js';

export interface SyllabusHealthCardProps {
  model: SyllabusHealthViewModel;
  onNavigateSubjects?: () => void;
}

export function SyllabusHealthCard({
  model,
  onNavigateSubjects,
}: SyllabusHealthCardProps): JSX.Element {
  const { subjects } = model;
  const attentionCount = subjects.filter(subject => subject.status === 'attention').length;

  return (
    <article class="chart-card p-card flex flex-col justify-between h-full" aria-labelledby="syllabusHealthTitle">
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-3">
        <div>
          <h3 id="syllabusHealthTitle" class="font-semibold text-base text-content-primary m-0">
            Saúde do Edital por Disciplina
          </h3>
          <p class="text-xs text-content-secondary m-0 mt-1">
            Progresso de cobertura e taxa de acerto nas últimas 4 semanas
            {attentionCount > 0 && (
              <>
                {' · '}
                <span class="text-amber font-medium">{attentionCount} abaixo da meta</span>
              </>
            )}
          </p>
        </div>
        {onNavigateSubjects ? (
          <button
            type="button"
            class="btn tertiary"
            onClick={onNavigateSubjects}
          >
            <span>Ver no menu Disciplinas</span>
            <Icon name="arrow-right" size={12} />
          </button>
        ) : (
          <a
            href="#disciplinas"
            class="btn tertiary"
          >
            <span>Ver no menu Disciplinas</span>
            <Icon name="arrow-right" size={12} />
          </a>
        )}
      </div>

      {subjects.length === 0 ? (
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-default">
          <p class="m-0">Cadastre disciplinas e tópicos para visualizar a saúde do edital.</p>
        </div>
      ) : (
        <div class="divide-y divide-border-subtle">
          {subjects.slice(0, 5).map((subject: SyllabusHealthSubject) => {
            const isAttention = subject.status === 'attention';
            const hasAccuracy = subject.accuracy != null;

            return (
              <div
                key={subject.id}
                class="py-3 first:pt-0 last:pb-0"
              >
                <div class="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-xs mb-2 font-medium">
                  <span class="font-semibold text-content-primary flex items-center gap-2">
                    <span>{subject.name}</span>
                  </span>
                  <span class="font-data text-content-secondary whitespace-nowrap">
                    {hasAccuracy ? (
                      <>
                        <span class={isAttention ? 'text-content-primary font-semibold' : 'text-content-primary font-medium'}>
                          {formatDecimal(subject.accuracy)}% acerto
                        </span>{' '}
                        <span class="text-content-secondary font-normal">(meta {formatDecimal(subject.target)}%)</span>
                      </>
                    ) : (
                      <span class="text-content-secondary">Sem questões registradas</span>
                    )}
                  </span>
                </div>

                <div class="grid grid-cols-12 gap-3 items-center">
                  {/* Cobertura de Tópicos (Barra Empilhada: Concluído + Em andamento) */}
                  <div class="col-span-8">
                    <div
                      class="w-full h-2 bg-surface-card rounded-full overflow-hidden flex"
                      title={`Concluído: ${subject.concludedPct}%, Em andamento: ${subject.inProgressPct}%`}
                    >
                      <div
                        class="bg-green h-full"
                        style={{ width: `${subject.concludedPct}%` }}
                      />
                      <div
                        class="bg-green opacity-40 h-full"
                        style={{ width: `${subject.inProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Aproveitamento em Questões (Bullet Bar com marcador de meta) */}
                  <div class="col-span-4 flex items-center gap-2">
                    <div class="w-full h-2 bg-surface-card rounded-full overflow-hidden relative">
                      {hasAccuracy && (
                        <div
                          class={`h-full ${isAttention ? 'bg-amber' : 'bg-green'}`}
                          style={{ width: `${Math.min(100, subject.accuracy!)}%` }}
                        />
                      )}
                      <div
                        class="absolute top-0 bottom-0 w-0.5 bg-warning-emphasis"
                        style={{ left: `${subject.target}%` }}
                        title={`Meta: ${subject.target}%`}
                      />
                    </div>
                    <span
                      class={`text-xs font-data font-semibold min-w-8 shrink-0 whitespace-nowrap text-right ${
                        !hasAccuracy
                          ? 'text-content-secondary'
                          : isAttention
                            ? 'text-content-secondary'
                            : 'text-green'
                      }`}
                    >
                      {!hasAccuracy
                        ? '—'
                        : isAttention
                          ? `${formatDecimal(subject.gap)}%`
                          : 'OK'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
