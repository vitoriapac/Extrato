import { useState } from 'preact/hooks';
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
}

export function SimulatedRemediationModal({
  open,
  onClose,
  diagnostic,
  onApplyRemediationPlan,
  onGenerateErrorCards,
}: SimulatedRemediationModalProps) {
  const [appliedPlan, setAppliedPlan] = useState<boolean>(false);
  const [generatedCards, setGeneratedCards] = useState<boolean>(false);

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
              <strong class="text-xl font-semibold text-content-primary">
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
                  {formatDecimal(Math.round(pace.minutesPerQuestion * 10) / 10)} min por questão.
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

        {/* Top 3 Vulnerabilidades (Sangria de Pontos) */}
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-content-secondary mb-3">
            Top 3 Vulnerabilidades — Maior Sangria de Pontos
          </h4>
          {diagnostic.topBleedingTopics.length === 0 ? (
            <p class="text-xs text-content-muted">Nenhum detalhamento por disciplina disponível.</p>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              {diagnostic.topBleedingTopics.map((topic, index) => (
                <div
                  key={topic.id}
                  class="rounded-default border border-border-subtle bg-surface-elevated p-3 relative flex flex-col justify-between"
                >
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-semibold text-status-danger uppercase tracking-wider">
                        #{index + 1} Maior Perda
                      </span>
                      <Badge variant={topic.accuracy < 50 ? 'danger' : 'warning'}>
                        {topic.accuracy}% acerto
                      </Badge>
                    </div>
                    <strong class="text-sm block text-content-primary leading-tight">
                      {topic.name}
                    </strong>
                    <small class="text-xs text-content-secondary block">{topic.subjectName}</small>
                  </div>

                  <div class="mt-3 pt-2 border-t border-border-subtle flex justify-between items-center text-xs">
                    <span class="text-status-danger font-medium">
                      -{topic.lostPoints} pontos perdidos
                    </span>
                    <span class="text-content-muted">{topic.shareOfLostPoints}% das falhas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plano de Ação: 7 Dias de Remediação */}
        <div>
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h4 class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Plano de Remediação — 7 Dias
              </h4>
              <p class="text-xs text-content-muted mt-1">
                Realocação estratégica de 60% da carga horária para estancar os tópicos com maior
                sangria.
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

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {diagnostic.remediationPlan7Days.dailySchedule.map((item: RemediationDailyAction) => (
              <div
                key={item.day}
                class={`p-3 rounded border text-xs flex flex-col justify-between gap-2 ${
                  item.day <= 5
                    ? 'border-status-info/30 bg-surface-subtle'
                    : 'border-border-subtle bg-surface-elevated'
                }`}
              >
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-content-primary">{item.dayLabel}</span>
                  <Badge variant={item.activityType === 'statute' ? 'warning' : 'info'}>
                    {item.activityType === 'statute'
                      ? 'Lei Seca'
                      : item.activityType === 'questions'
                        ? 'Questões'
                        : 'Revisão'}
                  </Badge>
                </div>
                <p class="text-content-secondary font-medium leading-snug">{item.focusHeadline}</p>
                <span class="text-xs text-content-muted block mt-auto">
                  {item.allocatedMinutes} min alocados
                </span>
              </div>
            ))}
          </div>
        </div>

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
