import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
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

  return (
    <article class="chart-card p-5 flex flex-col justify-between h-full" aria-labelledby="syllabusHealthTitle">
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-3">
        <div>
          <h3 id="syllabusHealthTitle" class="font-semibold text-base text-content-primary m-0">
            Saúde do Edital por Disciplina
          </h3>
          <p class="text-xs text-content-secondary m-0 mt-0.5">
            Progresso de cobertura e taxa de acerto nas últimas 4 semanas
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
        <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-md">
          <p class="m-0">Cadastre disciplinas e tópicos para visualizar a saúde do edital.</p>
        </div>
      ) : (
        <div class="space-y-3">
          {subjects.slice(0, 5).map((subject: SyllabusHealthSubject) => {
            const isAttention = subject.status === 'attention';
            const hasAccuracy = subject.accuracy != null;

            return (
              <div
                key={subject.id}
                class="p-2.5 rounded bg-surface-subtle border border-border-default"
              >
                <div class="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-xs mb-1.5 font-medium">
                  <span class="font-semibold text-content-primary flex items-center gap-1.5">
                    <span>{subject.name}</span>
                    {isAttention && (
                      <span class="text-xs px-1.5 py-0.2 rounded font-data bg-amber-bg text-amber font-semibold">
                        Abaixo da meta
                      </span>
                    )}
                  </span>
                  <span class="font-data text-content-secondary whitespace-nowrap">
                    {hasAccuracy ? (
                      <>
                        <span class={isAttention ? 'text-amber font-semibold' : 'text-content-primary font-medium'}>
                          {subject.accuracy}% acerto
                        </span>{' '}
                        <span class="text-content-secondary font-normal">(meta {subject.target}%)</span>
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
                        class="bg-amber h-full"
                        style={{ width: `${subject.inProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Aproveitamento em Questões (Bullet Bar com marcador de meta) */}
                  <div class="col-span-4 flex items-center gap-1.5">
                    <div class="w-full h-2 bg-surface-card rounded-full overflow-hidden relative">
                      {hasAccuracy && (
                        <div
                          class={`h-full ${isAttention ? 'bg-amber' : 'bg-green'}`}
                          style={{ width: `${Math.min(100, subject.accuracy!)}%` }}
                        />
                      )}
                      <div
                        class="absolute top-0 bottom-0 w-0.5 bg-content-primary opacity-80"
                        style={{ left: `${subject.target}%` }}
                        title={`Meta: ${subject.target}%`}
                      />
                    </div>
                    <span
                      class={`text-xs font-data font-semibold min-w-[28px] shrink-0 whitespace-nowrap text-right ${
                        !hasAccuracy
                          ? 'text-content-secondary'
                          : isAttention
                            ? 'text-amber'
                            : 'text-green'
                      }`}
                    >
                      {!hasAccuracy
                        ? '—'
                        : isAttention
                          ? `${subject.gap}%`
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
