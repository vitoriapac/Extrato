import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { formatPlanMinutes } from '../../core/format-duration.js';
import type { StudyCycleMode, StudyCycleQueue } from '../../domain/planning/study-cycle-engine.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Card } from '../primitives/card.js';
import { Icon } from '../primitives/icon.js';
import { StudyCycleBlockList } from './StudyCycleBlockList.js';
import { StudyCycleDonut } from './StudyCycleDonut.js';
import type { CycleDraftState } from './TodayStudyAssistantBar.js';

export interface StudyCycleCenterCardProps {
  executionMode: 'agenda' | 'sequence';
  cycle: StudyCycleQueue | null;
  subjects?: Array<{ id?: string; color?: unknown }>;
  copilotHint?: string | null;
  cycleLap: {
    round: number;
    totalBlocks: number;
    completedBlocks: number;
    skippedBlocks: number;
    partialBlocks: number;
    resolvedBlocks: number;
    executedCoveragePct: number;
    actualMinutesInRound: number;
  };
  cycleDraft: CycleDraftState;
  onSetExecutionMode: (mode: 'agenda' | 'sequence') => void;
  onToggleCyclePause: () => void;
  onChangeCycleDraftConfig: (mode: StudyCycleMode, durationMinutes: number) => void;
  onMoveCycleDraftBlock: (fromIndex: number, toIndex: number) => void;
  onConfirmCycleDraft: () => void;
  onGoToTodayCycle: () => void;
}

const DEFAULT_VISIBLE_BLOCKS = 6;

export function StudyCycleCenterCard(props: StudyCycleCenterCardProps): JSX.Element {
  const { executionMode, cycle, cycleLap, cycleDraft, subjects = [], copilotHint = null } = props;
  const [showAllBlocks, setShowAllBlocks] = useState(false);

  const currentBlock =
    cycle && Array.isArray(cycle.blocks) && cycle.blocks.length > 0
      ? cycle.blocks[Math.max(0, Math.min(cycle.blocks.length - 1, cycle.currentBlockIndex))]
      : null;

  const statusBadgeVariant = !cycle
    ? 'default'
    : cycle.status === 'paused'
      ? 'warning'
      : executionMode === 'sequence'
        ? 'success'
        : 'info';

  const versionSuffix = (cycle?.version || 1) > 1 ? ` · revisão ${cycle?.version}` : '';
  const statusBadgeLabel = !cycle
    ? 'Novo ciclo em prévia'
    : cycle.status === 'paused'
      ? `Pausado${versionSuffix}`
      : `Ativo · Volta ${cycleLap.round}${versionSuffix}`;

  const subjectShares = cycleDraft.preview?.subjectShares || [];

  const isManualMode = cycleDraft.mode === 'manual';
  const draftBlocks = cycleDraft.preview?.cycle.blocks || [];

  return (
    <Card
      as="section"
      variant="default"
      className="mt-6 space-y-6 min-w-0"
      aria-labelledby="studyCycleCenterTitle"
      data-study-cycle-center="true"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <Icon name="repeat" size={16} class="icon-inline text-accent shrink-0" />
            <h3 id="studyCycleCenterTitle" class="module-heading__title m-0 text-content-primary">
              Central do Ciclo de Estudos
            </h3>
            <Badge variant={statusBadgeVariant} icon={false} className="font-data">
              {statusBadgeLabel}
            </Badge>
          </div>
          <p class="m-0 text-xs text-content-secondary">
            Alterne entre agenda fixa do dia e sequência contínua sem gerar atraso no calendário.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Modo de execução em Hoje">
          <Button
            variant={executionMode === 'sequence' ? 'tonal' : 'secondary'}
            size="small"
            aria-pressed={executionMode === 'sequence'}
            onClick={() => props.onSetExecutionMode('sequence')}
          >
            <span>Ciclo de estudos</span>
          </Button>
          <Button
            variant={executionMode === 'agenda' ? 'tonal' : 'secondary'}
            size="small"
            aria-pressed={executionMode === 'agenda'}
            onClick={() => props.onSetExecutionMode('agenda')}
          >
            <span>Agenda do dia</span>
          </Button>
        </div>
      </div>

      {cycle && currentBlock && (
        <div class="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
          <div class="space-y-1 min-w-0">
            <div class="text-content-primary font-medium">
              Próximo bloco: <strong>{currentBlock.subjectName}</strong> ·{' '}
              <span class="font-data">
                {formatPlanMinutes(currentBlock.remainingMinutes ?? currentBlock.durationMinutes)}
              </span>
              {currentBlock.remainingMinutes != null ? ' restantes' : ''}
            </div>
            <div class="text-content-secondary font-data">
              {cycleLap.completedBlocks} concluídos · {cycleLap.skippedBlocks} pulados de{' '}
              {cycleLap.totalBlocks} ({cycleLap.executedCoveragePct}% executado ·{' '}
              {formatPlanMinutes(cycleLap.actualMinutesInRound)} na volta)
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="small" onClick={props.onToggleCyclePause}>
              <Icon name={cycle.status === 'paused' ? 'play' : 'pause'} size={13} class="icon-inline" />
              <span>{cycle.status === 'paused' ? 'Retomar ciclo' : 'Pausar ciclo'}</span>
            </Button>
            <Button variant="secondary" size="small" onClick={props.onGoToTodayCycle}>
              <span>Executar em Hoje</span>
              <Icon name="chevron-right" size={13} class="icon-inline" />
            </Button>
          </div>
        </div>
      )}

      <div class="pt-4 border-t border-border-subtle flex flex-wrap items-end gap-4 text-xs">
        <label class="flex flex-col gap-1">
          <span class="text-content-secondary">Distribuição do ciclo</span>
          <select
            class="select-control"
            aria-label="Modo de distribuição na central do ciclo"
            value={cycleDraft.mode}
            onChange={e =>
              props.onChangeCycleDraftConfig(
                e.currentTarget.value as StudyCycleMode,
                cycleDraft.blockDurationMinutes
              )
            }
          >
            <option value="adaptive">Adaptativo (pesos e prioridades)</option>
            <option value="balanced">Equilibrado (igual por disciplina)</option>
            <option value="manual">Manual (ordem personalizada)</option>
          </select>
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-content-secondary">
            Duração do bloco (<span class="font-data">{formatPlanMinutes(cycleDraft.blockDurationMinutes)}</span>)
          </span>
          <input
            type="number"
            class="select-control font-data"
            min={15}
            max={120}
            step={5}
            aria-label="Duração padrão do bloco na central do ciclo em minutos"
            value={cycleDraft.blockDurationMinutes}
            onInput={e =>
              props.onChangeCycleDraftConfig(
                cycleDraft.mode,
                Math.max(15, Math.min(120, Number(e.currentTarget.value) || 60))
              )
            }
          />
        </label>
      </div>

      {cycleDraft.preview && (
        <div class="space-y-4 text-xs">
          <p class="m-0 text-content-secondary">
            Prévia não destrutiva:{' '}
            <strong class="text-content-primary font-data">
              {cycleDraft.preview.blocksCount} blocos
            </strong>{' '}
            · <span class="font-data">{formatPlanMinutes(cycleDraft.preview.totalDurationMinutes)}</span>{' '}
            por volta completa.
          </p>

          {subjectShares.length > 0 && (
            <StudyCycleDonut
              shares={subjectShares}
              subjects={subjects}
              size={160}
              strokeWidth={18}
              centerLabel="por volta"
              maxVisibleLegend={4}
            />
          )}

          {copilotHint && (
            <p
              class="m-0 text-xs text-content-secondary py-1 flex items-start gap-2"
              data-cycle-copilot-hint="true"
            >
              <Icon name="compass" size={14} class="icon-inline text-accent shrink-0 mt-0.5" />
              <span>{copilotHint}</span>
            </p>
          )}

          {draftBlocks.length > 0 && (
            <div class="space-y-2">
              {!isManualMode && !showAllBlocks ? (
                <div class="flex flex-wrap items-center gap-4">
                  <Button
                    variant="tertiary"
                    size="small"
                    aria-expanded={false}
                    onClick={() => setShowAllBlocks(true)}
                  >
                    Ver sequência de {draftBlocks.length} blocos
                  </Button>
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() =>
                      props.onChangeCycleDraftConfig('manual', cycleDraft.blockDurationMinutes)
                    }
                  >
                    Personalizar ordem (modo Manual)
                  </Button>
                </div>
              ) : (
                <StudyCycleBlockList
                  blocks={draftBlocks}
                  isManualMode={isManualMode}
                  onMoveBlock={props.onMoveCycleDraftBlock}
                  onEnableManualMode={() =>
                    props.onChangeCycleDraftConfig('manual', cycleDraft.blockDurationMinutes)
                  }
                  maxVisible={DEFAULT_VISIBLE_BLOCKS}
                  showAll={showAllBlocks}
                  onToggleShowAll={() => setShowAllBlocks(prev => !prev)}
                />
              )}
            </div>
          )}

          {cycleDraft.preview.errors.length > 0 && (
            <p class="m-0 text-red">{cycleDraft.preview.errors[0]}</p>
          )}

          <div class="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={!cycleDraft.preview.valid}
                onClick={props.onConfirmCycleDraft}
              >
                <Icon name="check" size={13} class="icon-inline" />
                <span>Confirmar nova versão do ciclo</span>
              </Button>
              {cycle &&
                (cycleDraft.mode !== (cycle.mode || 'adaptive') ||
                  cycleDraft.blockDurationMinutes !==
                    (cycle.blocks?.[0]?.durationMinutes || 60)) && (
                  <Badge variant="warning" icon={false}>
                    Prévia alterada
                  </Badge>
                )}
            </div>
            <span class="text-xs text-content-secondary">
              Nova versão preserva voltas e sessões anteriores.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
