import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import {
  buildRecoveryMissionPlan,
  type OverdueReviewItem,
  type RecoveryMissionBlock,
  type RecoveryMissionPlan,
} from '../../domain/recovery/recovery-mission-engine.js';
import { formatTimer } from '../../application/sessions/timer-coordinator.js';

export interface RecoveryMissionModalProps {
  open: boolean;
  onClose: () => void;
  overdueItems: readonly OverdueReviewItem[];
  criticalTopicIds?: readonly string[];
  onCompleteReview: (reviewId: string, origin: string) => void;
}

export function RecoveryMissionModal({
  open,
  onClose,
  overdueItems = [],
  criticalTopicIds = [],
  onCompleteReview,
}: RecoveryMissionModalProps): JSX.Element | null {
  if (!open) return null;

  const [availableMinutes, setAvailableMinutes] = useState<number>(45);
  const [stage, setStage] = useState<'setup' | 'running' | 'completed'>('setup');
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(0);
  const [completedBlocks, setCompletedBlocks] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Calcula o plano dinâmico
  const plan: RecoveryMissionPlan = buildRecoveryMissionPlan({
    overdueItems,
    availableMinutes,
    blockDurationMinutes: 15,
    criticalTopicIds,
  });

  // Temporizador durante a execução da missão
  useEffect(() => {
    let interval: any = null;
    if (stage === 'running' && isTimerRunning) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, isTimerRunning]);

  function handleStartMission() {
    if (!plan.blocks.length) return;
    setCurrentBlockIndex(0);
    setCompletedBlocks([]);
    const firstDurationSec = (plan.blocks[0]?.durationMinutes || 15) * 60;
    setSecondsRemaining(firstDurationSec);
    setIsTimerRunning(true);
    setStage('running');
  }

  function handleCompleteCurrentBlock() {
    const currentBlock = plan.blocks[currentBlockIndex];
    if (currentBlock) {
      onCompleteReview(currentBlock.reviewId, currentBlock.origin);
      setCompletedBlocks(prev => [...prev, currentBlock.id]);
    }

    if (currentBlockIndex + 1 < plan.blocks.length) {
      const nextIndex = currentBlockIndex + 1;
      setCurrentBlockIndex(nextIndex);
      const nextDurationSec = (plan.blocks[nextIndex]?.durationMinutes || 15) * 60;
      setSecondsRemaining(nextDurationSec);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
      setStage('completed');
    }
  }

  function handleSkipCurrentBlock() {
    if (currentBlockIndex + 1 < plan.blocks.length) {
      const nextIndex = currentBlockIndex + 1;
      setCurrentBlockIndex(nextIndex);
      const nextDurationSec = (plan.blocks[nextIndex]?.durationMinutes || 15) * 60;
      setSecondsRemaining(nextDurationSec);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
      setStage('completed');
    }
  }

  function handleCloseModal() {
    setIsTimerRunning(false);
    setStage('setup');
    onClose();
  }

  const currentBlock: RecoveryMissionBlock | undefined = plan.blocks[currentBlockIndex];
  const debtReductionPercent =
    plan.totalReviewsInDebt > 0
      ? Math.round((completedBlocks.length / plan.totalReviewsInDebt) * 100)
      : 0;

  return (
    <Dialog
      open={open}
      onClose={handleCloseModal}
      title={
        stage === 'setup'
          ? 'Centro de Recuperação — Missão de Resgate'
          : stage === 'running'
            ? `Missão em Andamento · Bloco ${currentBlockIndex + 1} de ${plan.blocks.length}`
            : 'Missão de Resgate Concluída'
      }
      maxWidth="md"
      className="recovery-mission-modal"
    >
      <div className="space-y-5 text-sm text-content-primary">
        {/* ETAPA 1: SETUP E SELEÇÃO DE TEMPO */}
        {stage === 'setup' && (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-content-secondary m-0 leading-relaxed">
                Quanto tempo você pode dedicar agora para recuperar atrasos? O Extrato selecionará
                as revisões de maior urgência e risco de esquecimento que cabem no seu tempo.
              </p>
            </div>

            {/* Seletores rápidos de tempo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1" role="group" aria-label="Opções de tempo disponível">
              {[30, 45, 60, 90].map(mins => {
                const count = Math.min(overdueItems.length, Math.floor(mins / 15));
                const isSelected = availableMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setAvailableMinutes(mins)}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-default border text-left transition-colors flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-brand bg-brand/10 text-brand dark:border-accent dark:bg-accent/15 dark:text-accent font-medium'
                        : 'border-border-default bg-surface-card hover:border-border-hover text-content-primary'
                    }`}
                  >
                    <span className="text-sm font-semibold">{mins} minutos</span>
                    <span className="text-xs text-content-secondary">
                      {count} {count === 1 ? 'revisão' : 'revisões'} (15m cada)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Painel do Plano de Resgate */}
            {plan.blocks.length === 0 ? (
              <div className="p-6 text-center rounded-default border border-border-subtle bg-surface-subtle text-content-secondary">
                <Icon name="circle-check" size={24} class="mx-auto mb-2 text-brand dark:text-accent" />
                <p className="font-medium m-0">Nenhuma revisão atrasada pendente!</p>
                <p className="text-xs mt-1 m-0">
                  Seu cronograma de revisões está 100% em dia.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-content-secondary px-0.5">
                  <span>
                    Ordem de maior impacto pedagógico ({plan.rescuedReviewsCount} de{' '}
                    {plan.totalReviewsInDebt} atrasadas):
                  </span>
                  <span className="font-medium text-brand dark:text-accent">
                    {plan.totalAllocatedMinutes} min planejados
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {plan.blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-default border border-border-default bg-surface-card flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand/10 dark:bg-accent/15 text-brand dark:text-accent text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-content-primary">
                            {block.topicName}
                          </div>
                          <div className="text-xs text-content-secondary">
                            {block.subjectName} · {block.urgencyReason}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default" className="shrink-0 font-medium">
                        {block.durationMinutes} min
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rodapé do Setup */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={plan.blocks.length === 0}
                onClick={handleStartMission}
                className="inline-flex items-center gap-1.5"
                aria-label="Iniciar missão de resgate de atrasos com cronômetro"
              >
                <Icon name="player-play" size={16} class="shrink-0" />
                <span>Iniciar Missão ({plan.rescuedReviewsCount} revisões)</span>
              </Button>
            </div>
          </>
        )}

        {/* ETAPA 2: MISSÃO EM ANDAMENTO */}
        {stage === 'running' && currentBlock && (
          <div className="space-y-6">
            {/* Card do Bloco Ativo */}
            <div className="p-5 rounded-default border-2 border-brand bg-brand/5 dark:border-accent dark:bg-accent/10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand dark:text-accent">
                    Revisão Ativa ({currentBlockIndex + 1} de {plan.blocks.length})
                  </span>
                  <h3 className="text-lg font-bold text-content-primary mt-1 m-0">
                    {currentBlock.topicName}
                  </h3>
                  <p className="text-xs text-content-secondary mt-0.5 m-0">
                    {currentBlock.subjectName} · {currentBlock.urgencyReason}
                  </p>
                </div>
                <Badge variant="default">
                  {currentBlock.origin}
                </Badge>
              </div>

              {/* Timer do Bloco */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-default bg-surface-card border border-border-default">
                <div>
                  <div className="text-3xl font-mono font-bold tracking-tight text-content-primary">
                    {formatTimer(secondsRemaining)}
                  </div>
                  <div className="text-xs text-content-secondary mt-0.5">
                    {secondsRemaining === 0
                      ? 'Tempo esgotado para este bloco!'
                      : 'Tempo recomendado para recall ativo'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setIsTimerRunning(prev => !prev)}
                    aria-label={isTimerRunning ? 'Pausar cronômetro' : 'Retomar cronômetro'}
                  >
                    <Icon name={isTimerRunning ? 'player-pause' : 'player-play'} size={14} />
                    <span>{isTimerRunning ? 'Pausar' : 'Retomar'}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={handleSkipCurrentBlock}
                    aria-label="Pular esta revisão e ir para a próxima"
                  >
                    <span>Pular</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Ação de Conclusão do Bloco */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-subtle">
              <span className="text-xs text-content-secondary">
                {plan.blocks.length - (currentBlockIndex + 1)} blocos restantes nesta missão
              </span>
              <Button
                variant="primary"
                onClick={handleCompleteCurrentBlock}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
                aria-label="Concluir esta revisão e avançar para o próximo bloco"
              >
                <Icon name="check" size={16} class="shrink-0" />
                <span>
                  {currentBlockIndex + 1 === plan.blocks.length
                    ? 'Concluir Última Revisão'
                    : 'Concluir Revisão e Próximo'}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 3: CONCLUSÃO DA MISSÃO */}
        {stage === 'completed' && (
          <div className="py-4 text-center space-y-5">
            <div className="inline-flex p-3 rounded-full bg-brand/10 dark:bg-accent/15 text-brand dark:text-accent">
              <Icon name="circle-check" size={40} />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-content-primary m-0">
                Missão de Resgate Cumprida!
              </h3>
              <p className="text-xs text-content-secondary m-0 leading-relaxed">
                Você investiu tempo focado nas matérias mais vulneráveis e reduziu significativamente
                sua dívida de revisões sem desorganizar o restante do seu cronograma.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-default bg-surface-subtle border border-border-subtle max-w-md mx-auto">
              <div>
                <div className="text-2xl font-bold text-content-primary">
                  {completedBlocks.length}
                </div>
                <div className="text-xs text-content-secondary">Revisões salvas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-brand dark:text-accent">
                  {completedBlocks.length * (plan.blockDurationMinutes || 15)}m
                </div>
                <div className="text-xs text-content-secondary">Tempo investido</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-content-primary">
                  {debtReductionPercent}%
                </div>
                <div className="text-xs text-content-secondary">Déficit aliviado</div>
              </div>
            </div>

            <div className="pt-3">
              <Button variant="primary" onClick={handleCloseModal}>
                Voltar ao Cockpit
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
