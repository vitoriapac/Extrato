import { useState } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import {
  simulateWhatIfScenario,
  type WhatIfSimulationInput,
} from '../../domain/forecasts/what-if-simulator.js';

export interface WhatIfSimulatorModalProps {
  open: boolean;
  onClose: () => void;
  rawState?: unknown;
  currentMetrics?: WhatIfSimulationInput['currentMetrics'];
}

const MINUTES_PRESETS = [-30, 0, 15, 30, 45, 60, 90];
const HORIZON_PRESETS = [15, 30, 60, 90];
const TARGET_PRESETS = [70, 75, 80, 85, 90];

export function WhatIfSimulatorModal({
  open,
  onClose,
  rawState,
  currentMetrics,
}: WhatIfSimulatorModalProps) {
  const [dailyMinutesDelta, setDailyMinutesDelta] = useState<number>(30);
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [targetScore, setTargetScore] = useState<number>(80);

  const result = simulateWhatIfScenario(
    {
      dailyMinutesDelta,
      horizonDays,
      targetScore,
      currentMetrics,
    },
    rawState
  );

  const { baseline, simulated, delta, insights } = result;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Simulador de Cenários — E se?"
      maxWidth="lg"
      className="what-if-modal"
    >
      <div class="space-y-6 text-sm">
        {/* Intro / Context */}
        <p class="text-secondary leading-relaxed">
          Explore o impacto de ajustes na sua rotina diária no <strong>Índice de Prontidão</strong>{' '}
          e na data estimada para alcançar sua meta.
        </p>

        {/* Controles de Simulação */}
        <div class="space-y-4 rounded-default bg-surface-subtle p-4 border border-border-subtle">
          {/* Ajuste de Minutos Diários */}
          <div>
            <label class="block font-medium text-primary mb-2">
              Ajuste de Tempo Diário de Estudo:
            </label>
            <div class="flex flex-wrap gap-2">
              {MINUTES_PRESETS.map(mins => {
                const isSelected = dailyMinutesDelta === mins;
                const label =
                  mins > 0 ? `+${mins} min` : mins === 0 ? 'Sem alteração' : `${mins} min`;
                return (
                  <button
                    key={mins}
                    type="button"
                    class={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-card text-secondary border-border-default hover:border-primary'
                    }`}
                    onClick={() => setDailyMinutesDelta(mins)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horizonte de Projeção */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block font-medium text-primary mb-2">Horizonte da Simulação:</label>
              <div class="flex flex-wrap gap-2">
                {HORIZON_PRESETS.map(days => (
                  <button
                    key={days}
                    type="button"
                    class={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                      horizonDays === days
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-card text-secondary border-border-default hover:border-primary'
                    }`}
                    onClick={() => setHorizonDays(days)}
                  >
                    {days} dias
                  </button>
                ))}
              </div>
            </div>

            {/* Meta de Acerto Alvo */}
            <div>
              <label class="block font-medium text-primary mb-2">Meta Alvo de Acerto:</label>
              <div class="flex flex-wrap gap-2">
                {TARGET_PRESETS.map(score => (
                  <button
                    key={score}
                    type="button"
                    class={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                      targetScore === score
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-card text-secondary border-border-default hover:border-primary'
                    }`}
                    onClick={() => setTargetScore(score)}
                  >
                    {score}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quadro Comparativo: Atual vs. Simulado */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {/* Card Prontidão */}
          <div class="rounded-default border border-border-default bg-surface-card p-3 shadow-xs">
            <span class="text-xs text-muted block mb-1">Prontidão Geral</span>
            <div class="text-xl font-semibold text-primary">{simulated.readinessScore}%</div>
            <div class="text-xs text-secondary mt-1">Atual: {baseline.readinessScore}%</div>
            {delta.readinessScoreDelta !== 0 && (
              <Badge
                variant={delta.readinessScoreDelta > 0 ? 'success' : 'default'}
                className="mt-1"
              >
                {delta.readinessScoreDelta > 0
                  ? `+${delta.readinessScoreDelta} pts`
                  : `${delta.readinessScoreDelta} pts`}
              </Badge>
            )}
          </div>

          {/* Card Carga Semanal */}
          <div class="rounded-default border border-border-default bg-surface-card p-3 shadow-xs">
            <span class="text-xs text-muted block mb-1">Carga Semanal</span>
            <div class="text-xl font-semibold text-primary">{simulated.weeklyStudyHours}h</div>
            <div class="text-xs text-secondary mt-1">Atual: {baseline.weeklyStudyHours}h</div>
            {delta.weeklyStudyHoursDelta !== 0 && (
              <Badge
                variant={delta.weeklyStudyHoursDelta > 0 ? 'success' : 'default'}
                className="mt-1"
              >
                {delta.weeklyStudyHoursDelta > 0
                  ? `+${delta.weeklyStudyHoursDelta}h`
                  : `${delta.weeklyStudyHoursDelta}h`}
              </Badge>
            )}
          </div>

          {/* Card Cobertura do Edital */}
          <div class="rounded-default border border-border-default bg-surface-card p-3 shadow-xs">
            <span class="text-xs text-muted block mb-1">Cobertura do Edital</span>
            <div class="text-xl font-semibold text-primary">{simulated.coveragePercent}%</div>
            <div class="text-xs text-secondary mt-1">Atual: {baseline.coveragePercent}%</div>
            {delta.coveragePercentDelta !== 0 && (
              <Badge
                variant={delta.coveragePercentDelta > 0 ? 'success' : 'default'}
                className="mt-1"
              >
                {delta.coveragePercentDelta > 0
                  ? `+${delta.coveragePercentDelta}%`
                  : `${delta.coveragePercentDelta}%`}
              </Badge>
            )}
          </div>

          {/* Card Dias até a Meta */}
          <div class="rounded-default border border-border-default bg-surface-card p-3 shadow-xs">
            <span class="text-xs text-muted block mb-1">Prazo para a Meta</span>
            <div class="text-xl font-semibold text-primary">
              {simulated.estimatedDaysToTarget != null
                ? `${simulated.estimatedDaysToTarget} d`
                : '—'}
            </div>
            <div class="text-xs text-secondary mt-1">
              {baseline.estimatedDaysToTarget != null
                ? `Atual: ${baseline.estimatedDaysToTarget} d`
                : '—'}
            </div>
            {delta.daysSavedEstimate != null && delta.daysSavedEstimate > 0 ? (
              <Badge variant="success" className="mt-1">
                -{delta.daysSavedEstimate} dias!
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Lista de Insights da Simulação */}
        {insights.length > 0 && (
          <div class="rounded-default bg-navy/5 dark:bg-navy/20 p-4 border border-navy/10 dark:border-navy/30">
            <h4 class="font-semibold text-primary mb-2 flex items-center gap-1.5">
              <Icon name="bulb" size={16} class="shrink-0" />
              <span>Conclusões da Simulação:</span>
            </h4>
            <ul class="space-y-1.5 text-secondary pl-5 list-disc">
              {insights.map((insight, idx) => (
                <li key={idx} class="leading-relaxed">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Garantia de Não-Mutação */}
        <div class="flex items-center gap-2 text-xs text-muted border-t border-border-subtle pt-3">
          <Icon name="lock" size={14} class="shrink-0" />
          <span>
            Simulação 100% isolada em memória. Seu histórico real e planos persistidos permanecem
            inalterados.
          </span>
        </div>

        {/* Rodapé / Ações */}
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
