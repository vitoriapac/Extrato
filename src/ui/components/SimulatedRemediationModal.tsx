import { useState } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
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
            <p class="text-xs text-content-secondary mt-0.5">
              Data: {diagnostic.simulationDate} · Total: {diagnostic.totalQuestions} questões
            </p>
          </div>

          <div class="flex items-center gap-4 flex-wrap">
            <div class="text-right">
              <span class="text-xs text-content-secondary block">Aproveitamento</span>
              <strong class="text-xl font-bold text-content-primary">
                {diagnostic.scorePercent}%
              </strong>
            </div>

            {diagnostic.passingScorePercent != null && (
              <div class="text-right pl-3 border-l border-border-subtle">
                <span class="text-xs text-content-secondary block">
                  Ponto de Corte ({diagnostic.passingScorePercent}%)
                </span>
                <span
                  class={`text-sm font-semibold ${
                    isBelowCutoff ? 'text-status-danger' : 'text-status-success'
                  }`}
                >
                  {diagnostic.gapToCutoff! >= 0
                    ? `+${diagnostic.gapToCutoff}`
                    : diagnostic.gapToCutoff}{' '}
                  pts
                </span>
              </div>
            )}

            {diagnostic.historicalAverageScore != null && (
              <div class="text-right pl-3 border-l border-border-subtle">
                <span class="text-xs text-content-secondary block">Média Histórica</span>
                <span
                  class={`text-sm font-semibold ${
                    diagnostic.deltaVsHistoricalAverage! >= 0
                      ? 'text-status-success'
                      : 'text-status-danger'
                  }`}
                >
                  {diagnostic.deltaVsHistoricalAverage! >= 0
                    ? `+${diagnostic.deltaVsHistoricalAverage}`
                    : diagnostic.deltaVsHistoricalAverage}{' '}
                  pts
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top 3 Vulnerabilidades (Sangria de Pontos) */}
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-content-secondary mb-3">
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
                      <span class="text-[10px] font-bold text-status-danger uppercase tracking-wider">
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
              <h4 class="text-xs font-bold uppercase tracking-wider text-content-secondary">
                Plano de Remediação — 7 Dias
              </h4>
              <p class="text-xs text-content-muted mt-0.5">
                Realocação estratégica de 60% da carga horária para estancar os tópicos com maior
                sangria.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="info">
                60% Foco Crítico ({diagnostic.remediationPlan7Days.bleedAllocationHours}h)
              </Badge>
              <Badge variant="default">
                40% Manutenção ({diagnostic.remediationPlan7Days.maintenanceAllocationHours}h)
              </Badge>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {diagnostic.remediationPlan7Days.dailySchedule.map((item: RemediationDailyAction) => (
              <div
                key={item.day}
                class={`p-2.5 rounded border text-xs flex flex-col justify-between gap-1.5 ${
                  item.day <= 5
                    ? 'border-status-info/30 bg-surface-subtle'
                    : 'border-border-subtle bg-surface-elevated'
                }`}
              >
                <div class="flex justify-between items-center">
                  <span class="font-bold text-content-primary">{item.dayLabel}</span>
                  <Badge variant={item.activityType === 'statute' ? 'warning' : 'info'}>
                    {item.activityType === 'statute'
                      ? 'Lei Seca'
                      : item.activityType === 'questions'
                        ? 'Questões'
                        : 'Revisão'}
                  </Badge>
                </div>
                <p class="text-content-secondary font-medium leading-snug">{item.focusHeadline}</p>
                <span class="text-[11px] text-content-muted block mt-auto">
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
              aria-label="Criar 7 dias de Remediação"
            >
              {appliedPlan ? '✓ Plano Criado na Agenda' : 'Criar 7 dias de Remediação'}
            </Button>

            <Button
              variant="secondary"
              size="small"
              onClick={handleGenerateCards}
              disabled={generatedCards || diagnostic.errorCardDrafts.length === 0}
              aria-label="Gerar rascunhos para o Caderno de Erros"
            >
              {generatedCards
                ? '✓ Rascunhos Gerados'
                : `Gerar ${diagnostic.errorCardDrafts.length} rascunhos p/ Caderno de Erros`}
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
