import { useEffect, useState } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import { formatDecimal } from '../../core/format-number.js';
import type {
  SimulatedRemediationDiagnostic,
  RemediationDailyAction,
} from '../../domain/diagnostics/simulated-remediation.js';

export interface SimulatedRemediationModalProps {
  open: boolean;
  onClose: () => void;
  diagnostic: SimulatedRemediationDiagnostic | null;
  onApplyRemediationPlan?: (plan: SimulatedRemediationDiagnostic['remediationPlan7Days']) => void;
  onGenerateErrorCards?: (drafts: SimulatedRemediationDiagnostic['errorCardDrafts']) => void;
  /** Cria a tarefa de correção dos erros para o dia seguinte; devolve false se já existia. */
  onScheduleErrorCorrection?: () => boolean;
  /** True quando a correção deste simulado já está na Agenda. */
  correctionScheduled?: boolean;
}

export function SimulatedRemediationModal({
  open,
  onClose,
  diagnostic,
  onApplyRemediationPlan,
  onGenerateErrorCards,
  onScheduleErrorCorrection,
  correctionScheduled = false,
}: SimulatedRemediationModalProps) {
  const [appliedPlan, setAppliedPlan] = useState<boolean>(false);
  const [scheduledCorrection, setScheduledCorrection] = useState<boolean>(correctionScheduled);
  const [generatedCards, setGeneratedCards] = useState<boolean>(false);

  useEffect(() => {
    setAppliedPlan(false);
    setGeneratedCards(false);
    setScheduledCorrection(correctionScheduled);
  }, [
    open,
    diagnostic?.simulationId,
    diagnostic?.simulationName,
    diagnostic?.simulationDate,
    correctionScheduled,
  ]);

  if (!diagnostic) return null;

  const handleApplyPlan = () => {
    if (onApplyRemediationPlan && diagnostic) {
      onApplyRemediationPlan(diagnostic.remediationPlan7Days);
      setAppliedPlan(true);
    }
  };

  const handleGenerateCards = () => {
    if (onGenerateErrorCards && diagnostic) {
      onGenerateErrorCards(diagnostic.errorCardDrafts);
      setGeneratedCards(true);
    }
  };

  const isBelowCutoff = diagnostic.gapToCutoff != null && diagnostic.gapToCutoff < 0;
  const signed = (value: number) => `${value > 0 ? '+' : ''}${formatDecimal(value)} p.p.`;
  const { pace } = diagnostic;
  const guessGain = pace.guessGain == null ? null : Math.round(pace.guessGain * 10) / 10;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Raio-X Pós-Simulado e Plano de Remediação"
      maxWidth="lg"
      className="simulated-remediation-modal"
    >
      <div class="space-y-6 text-sm text-content-primary">
        {/* Banner de Contexto e Desempenho */}
        <div class="rounded-default bg-surface-subtle p-4 border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-semibold text-content-primary">
              {diagnostic.simulationName}
            </h3>
            <p class="text-xs text-content-secondary mt-1">
              Data: {diagnostic.simulationDate.split('-').reverse().join('/')} · Total:{' '}
              {diagnostic.totalQuestions} questões
            </p>
          </div>

          <div class="flex items-center gap-4 flex-wrap">
            <div class="text-right">
              <span class="text-xs text-content-secondary block">
                {diagnostic.netScoring ? 'Nota líquida' : 'Nota'}
              </span>
              <strong class="text-xl font-mono tabular-nums font-semibold text-content-primary">
                {formatDecimal(diagnostic.scorePercent)}%
              </strong>
            </div>

            {diagnostic.passingScorePercent != null && (
              <div class="text-right pl-3 border-l border-border-subtle">
                <span class="text-xs text-content-secondary block">
                  Meta de nota ({formatDecimal(diagnostic.passingScorePercent)}%)
                </span>
                <span
                  class={`text-sm font-semibold ${
                    isBelowCutoff ? 'text-status-danger' : 'text-status-success'
                  }`}
                >
                  {signed(diagnostic.gapToCutoff!)}
                </span>
              </div>
            )}

            {diagnostic.historicalAverageScore != null && (
              <div class="text-right pl-3 border-l border-border-subtle">
                <span class="text-xs text-content-secondary block">Média dos outros simulados</span>
                <span
                  class={`text-sm font-semibold ${
                    diagnostic.deltaVsHistoricalAverage! >= 0
                      ? 'text-status-success'
                      : 'text-status-danger'
                  }`}
                >
                  {signed(diagnostic.deltaVsHistoricalAverage!)}
                </span>
              </div>
            )}
          </div>
        </div>

        {diagnostic.minimumMisses.length > 0 && (
          <p class="rounded-default border border-status-danger p-3 text-sm" role="alert">
            <strong class="text-status-danger">Abaixo do mínimo eliminatório: </strong>
            {diagnostic.minimumMisses
              .map(
                miss =>
                  `${miss.name} com ${formatDecimal(Math.round(miss.score * 10) / 10)}% (mínimo ${formatDecimal(miss.minimum)}%)`
              )
              .join('; ')}
            . Na prova, isso elimina mesmo com nota total alta.
          </p>
        )}

        {(pace.minutesPerQuestion != null || guessGain != null) && (
          <div>
            <h4 class="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-2">
              Tempo e chutes
            </h4>
            <ul class="text-sm space-y-1">
              {pace.minutesPerQuestion != null && (
                <li>
                  {formatDecimal(Math.round(pace.minutesPerQuestion * 10) / 10)} min por questão
                  {pace.examMinutesPerQuestion == null ? (
                    '.'
                  ) : pace.minutesPerQuestion > pace.examMinutesPerQuestion ? (
                    <>
                      ; a prova permite {formatDecimal(pace.examMinutesPerQuestion)}.{' '}
                      <strong class="text-status-danger">Nesse ritmo, faltaria tempo.</strong>
                    </>
                  ) : (
                    <>
                      ; a prova permite {formatDecimal(pace.examMinutesPerQuestion)}: cabe no tempo.
                    </>
                  )}
                </li>
              )}
              {guessGain != null && (
                <li>
                  {pace.guessedCorrect} de {pace.guessed} chutes certos:{' '}
                  <strong class={guessGain < 0 ? 'text-status-danger' : undefined}>
                    {signed(guessGain)}
                  </strong>{' '}
                  na nota.{' '}
                  {guessGain < 0
                    ? 'Deixar essas questões em branco teria rendido mais.'
                    : diagnostic.netScoring && pace.guessed > 0
                      ? 'Em Certo ou errado, só chute quando conseguir eliminar a dúvida pela metade ou mais.'
                      : ''}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Passo 1: Top 3 Pontos de Atenção */}
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-3">
            Passo 1 · Top 3 Pontos de Atenção — Maior Perda de Pontos
          </h4>
          {diagnostic.topBleedingTopics.length === 0 ? (
            <p class="text-xs text-content-muted">Nenhum detalhamento por disciplina disponível.</p>
          ) : (
            <ul class="divide-y divide-border-subtle border-t border-border-subtle m-0 p-0 list-none">
              {diagnostic.topBleedingTopics.map((topic, index) => (
                <li
                  key={topic.id}
                  class="py-2.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-mono tabular-nums text-xs font-semibold text-status-danger">
                        #{index + 1}
                      </span>
                      <strong class="text-sm text-content-primary">{topic.name}</strong>
                      <span class="text-xs text-content-secondary">· {topic.subjectName}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 text-xs font-mono tabular-nums">
                    <Badge variant={topic.accuracy < 50 ? 'danger' : 'warning'}>
                      {formatDecimal(topic.accuracy)}% acerto
                    </Badge>
                    <span class="text-status-danger font-medium">
                      -{formatDecimal(topic.lostPoints)} pts
                    </span>
                    <span class="text-content-muted">
                      {formatDecimal(topic.shareOfLostPoints)}% das falhas
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Passo 2: Pontos Recuperáveis de Curto Prazo (Quick Wins) */}
        {(diagnostic.quickWinItems?.length ?? 0) > 0 && (
          <details class="limits-disclosure">
            <summary class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
              Passo 2 · Pontos recuperáveis no curto prazo (Quick Wins)
            </summary>
            <ul class="divide-y divide-border-subtle border-t border-border-subtle m-0 p-0 list-none pt-2">
              {diagnostic.quickWinItems.map(item => (
                <li
                  key={item.id}
                  class="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div class="min-w-0 flex-1">
                    <strong class="text-content-primary">{item.name}</strong>
                    <span class="text-content-secondary"> — {item.reason}</span>
                    <span class="block text-content-muted">{item.actionHint}</span>
                  </div>
                  <Badge variant="success">+{item.recoverablePoints} pts</Badge>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Passo 3: Plano de Ação e Ação Imediata */}
        <details class="limits-disclosure">
          <summary class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
            Passo 3 · Plano de remediação — 7 dias e ação imediata
          </summary>
          <div class="pt-3">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p class="text-xs text-content-muted m-0">
                Realocação estratégica de 60% da carga horária para priorizar os tópicos com maior
                perda de pontos.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="info">
                60% Foco Crítico (
                {formatDecimal(diagnostic.remediationPlan7Days.bleedAllocationHours)}h)
              </Badge>
              <Badge variant="default">
                40% Manutenção (
                {formatDecimal(diagnostic.remediationPlan7Days.maintenanceAllocationHours)}h)
              </Badge>
            </div>
          </div>

          <ul class="divide-y divide-border-subtle border-t border-border-subtle m-0 p-0 list-none">
            {diagnostic.remediationPlan7Days.dailySchedule.map((item: RemediationDailyAction) => (
              <li
                key={item.day}
                class="py-2 text-xs flex flex-wrap items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class="font-semibold text-content-primary shrink-0">{item.dayLabel}</span>
                  <Badge variant={item.activityType === 'statute' ? 'warning' : 'info'}>
                    {item.activityType === 'statute'
                      ? 'Lei Seca'
                      : item.activityType === 'questions'
                        ? 'Questões'
                        : 'Revisão'}
                  </Badge>
                  <span class="text-content-secondary truncate">{item.focusHeadline}</span>
                </div>
                <span class="font-mono tabular-nums text-xs text-content-muted shrink-0">
                  {item.allocatedMinutes} min
                </span>
              </li>
            ))}
          </ul>
          </div>
        </details>

        {/* Ritual pós-simulado: corrigir os erros em até 48 horas, antes que o raciocínio se perca. */}
        {onScheduleErrorCorrection && diagnostic.correctQuestions < diagnostic.totalQuestions && (
          <div class="rounded-default border border-border-subtle p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 class="text-xs font-semibold uppercase tracking-wider text-content-secondary m-0 mb-1">
                Correção dos erros
              </h4>
              <p class="m-0 text-sm">
                Refaça cada questão errada sem olhar o gabarito, leia o comentário e classifique o
                erro, em até 48 horas.
              </p>
            </div>
            <Button
              variant="secondary"
              size="small"
              disabled={scheduledCorrection}
              onClick={() => {
                onScheduleErrorCorrection();
                setScheduledCorrection(true);
              }}
            >
              {scheduledCorrection ? (
                <span class="inline-flex items-center gap-2">
                  <Icon name="check" size={14} />
                  Correção na Agenda
                </span>
              ) : (
                'Agendar para amanhã'
              )}
            </Button>
          </div>
        )}

        {/* Botões de Ação */}
        <div class="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="small"
              onClick={handleApplyPlan}
              disabled={appliedPlan}
              aria-label="Pôr os 7 dias de remediação na Agenda"
            >
              {appliedPlan ? (
                <span class="inline-flex items-center gap-2">
                  <Icon name="check" size={14} />
                  Plano na Agenda
                </span>
              ) : (
                'Pôr os 7 dias na Agenda'
              )}
            </Button>

            <Button
              variant="secondary"
              size="small"
              onClick={handleGenerateCards}
              disabled={generatedCards || diagnostic.errorCardDrafts.length === 0}
              aria-label="Gerar rascunhos para o Caderno de Erros"
            >
              {generatedCards ? (
                <span class="inline-flex items-center gap-2">
                  <Icon name="check" size={14} />
                  Rascunhos Gerados
                </span>
              ) : (
                `Gerar ${diagnostic.errorCardDrafts.length} rascunhos p/ Caderno de Erros`
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            aria-label="Fechar modal de Raio-X"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
