import type { JSX } from 'preact';
import type { FirstStepsMissionModel } from '../../application/onboarding/build-first-steps-mission.js';
import { Card } from '../primitives/card.js';
import { Button } from '../primitives/button.js';
import { ProgressBar } from '../primitives/progress-bar.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';

export interface FirstStepsMissionProps {
  model: FirstStepsMissionModel;
  onDismiss?: () => void;
  onRestore?: () => void;
  onStartTour?: () => void;
  onExecuteMission?: (action: string) => void;
}

export function FirstStepsMission({
  model,
  onDismiss,
  onRestore,
  onStartTour,
  onExecuteMission,
}: FirstStepsMissionProps): JSX.Element | null {
  if (model.canRestore) {
    return (
      <div
        id="firstStepsRestoreBar"
        className="first-steps-restore-bar flex flex-wrap items-center justify-between gap-2 p-2 mb-4 rounded bg-surface-subtle/50 border border-border-default text-xs text-secondary"
      >
        <span>Checklist de primeiros passos pausado</span>
        <Button
          variant="ghost"
          size="small"
          data-first-steps-restore="true"
          onClick={onRestore}
          aria-label="Reexibir checklist de primeiros passos"
          className="text-xs font-medium text-navy hover:text-primary"
        >
          ↺ Reexibir guia de ativação
        </Button>
      </div>
    );
  }

  if (!model.visible) return null;

  return (
    <Card
      as="section"
      variant="insight"
      className="first-steps-mission mb-4"
      id="firstStepsMissionCard"
      aria-labelledby="firstStepsMissionTitle"
    >
      <div className="flex flex-col gap-3">
        {/* Cabeçalho do Card */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-secondary">
              PRIMEIROS PASSOS NA PRÁTICA
            </span>
            <Badge variant="info">
              {model.completedCount} de {model.totalCount} concluídos
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="small"
              data-guided-tour-start="true"
              onClick={onStartTour}
              aria-label="Iniciar tour rápido pelas áreas do aplicativo"
            >
              <Icon name="compass" size={14} class="mr-1 inline-block shrink-0" />
              <span>Tour rápido</span>
            </Button>
            <Button
              variant="ghost"
              size="small"
              data-first-steps-dismiss="true"
              onClick={onDismiss}
              aria-label="Dispensar guia de primeiros passos"
              className="text-muted hover:text-primary"
            >
              <Icon name="x" size={14} class="mr-1 inline-block shrink-0" />
              <span>Dispensar</span>
            </Button>
          </div>
        </div>

        {/* Título e Barra de Progresso */}
        <div className="flex flex-col gap-1">
          <h3 id="firstStepsMissionTitle" className="text-base font-semibold text-primary m-0">
            Comece a estudar hoje
          </h3>
          <p className="text-xs text-secondary m-0">
            Seu plano semanal está pronto. Realize suas primeiras atividades práticas para alimentar
            os diagnósticos de prontidão e retenção.
          </p>
          <div className="mt-1">
            <ProgressBar
              value={model.progressPercent}
              max={100}
              label="Progresso da ativação prática"
              variant="default"
            />
          </div>
        </div>

        {/* Lista de Missões */}
        <ul className="list-none p-0 m-0 flex flex-col gap-2 mt-1" role="list">
          {model.missions.map(mission => {
            const isDone = mission.done;
            const isActive = !isDone && mission.id === model.activeMission?.id;

            return (
              <li
                key={mission.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-2.5 rounded border transition-colors ${
                  isDone
                    ? 'bg-surface-subtle/50 border-border-default/60 opacity-80'
                    : isActive
                      ? 'bg-surface-highlight border-amber shadow-xs'
                      : 'bg-surface-card border-border-default'
                }`}
                data-mission-id={mission.id}
                data-mission-done={String(isDone)}
              >
                <div className="flex items-start gap-2.5 min-w-[200px] flex-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold mt-0.5 shrink-0 ${
                      isDone
                        ? 'bg-green text-white'
                        : isActive
                          ? 'bg-amber text-navy'
                          : 'bg-surface-subtle text-secondary border border-border-default'
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? <Icon name="check" size={12} stroke={3} /> : ''}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm ${
                        isDone
                          ? 'line-through text-secondary font-medium'
                          : 'font-semibold text-primary'
                      }`}
                    >
                      {mission.label}
                    </span>
                    <span className="text-xs text-secondary">{mission.description}</span>
                  </div>
                </div>

                {!isDone && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Boolean(mission.quickAction && mission.quickActionLabel) && (
                      <Button
                        variant="secondary"
                        size="small"
                        data-first-steps-action={mission.quickAction!}
                        onClick={() => onExecuteMission?.(mission.quickAction!)}
                        aria-label="Iniciar aquecimento rápido de 15 minutos"
                      >
                        {mission.quickActionLabel}
                      </Button>
                    )}
                    <Button
                      variant={isActive ? 'primary' : 'secondary'}
                      size="small"
                      data-first-steps-action={mission.ctaAction}
                      onClick={() => onExecuteMission?.(mission.ctaAction)}
                    >
                      {mission.ctaLabel} →
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
