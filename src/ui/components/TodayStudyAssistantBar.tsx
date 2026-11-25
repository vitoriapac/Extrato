import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { formatPlanMinutes } from '../../core/format-duration.js';
import type {
  CopilotAnswer,
  CopilotQuestionKey,
  CopilotViewModel,
} from '../../application/copilot/study-copilot-service.js';
import type { QuickStudyFocusMode, QuickStudyProposal } from '../../domain/quick-study/quick-study-engine.js';
import type { LearningJournalEntry, LearningJournalTag } from '../../core/types.js';
import {
  type StudyCycleMode,
  type StudyCycleQueue,
} from '../../domain/planning/study-cycle-engine.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export type AssistantPanelKind =
  | 'none'
  | 'quick'
  | 'copilot'
  | 'weekly_closing';

export interface CycleDraftState {
  mode: StudyCycleMode;
  blockDurationMinutes: number;
  preview: {
    valid: boolean;
    errors: string[];
    cycle: StudyCycleQueue;
    subjectShares: Array<{ subjectId: string; subjectName: string; minutes: number; blocks: number; sharePct: number }>;
    blocksCount: number;
    totalDurationMinutes: number;
  } | null;
}

export interface JournalFormState {
  sessionId: string | null;
  subjectId: string;
  topicId: string;
  difficultyRating: '' | 'easy' | 'medium' | 'hard';
  energyRating: '' | 'high' | 'normal' | 'low';
  tags: LearningJournalTag[];
  note: string;
  nextStep: string;
}

export interface TodayStudyAssistantBarProps {
  activePanel: AssistantPanelKind;
  executionMode: 'agenda' | 'sequence';
  subjects: Array<{ id: string; name: string; archived?: boolean; topics?: any[] }>;
  cycle: StudyCycleQueue | null;
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
  cycleDivergence: {
    diverges: boolean;
    currentBlockSubject: string | null;
    recommendedSubject: string | null;
    urgentReview: boolean;
    explanation: string;
  };
  cycleSkipReason: string;
  cycleDraft: CycleDraftState;
  quickMinutes: number;
  quickFocus: QuickStudyFocusMode;
  quickProposal: QuickStudyProposal;
  copilot: CopilotViewModel;
  copilotQuestion: CopilotQuestionKey;
  journalEntries: LearningJournalEntry[];
  journalFilters: {
    subjectId: string;
    tag: string;
    query: string;
  };
  journalForm: JournalFormState;
  weeklyClosing: Record<string, any> | null;
  onTogglePanel: (panel: AssistantPanelKind) => void;
  onStartCycleBlock: () => void;
  onToggleCyclePause: () => void;
  onSkipReasonChange: (value: string) => void;
  onSkipCycleBlock: () => void;
  onChangeCycleDraftConfig: (mode: StudyCycleMode, durationMinutes: number) => void;
  onMoveCycleDraftBlock: (fromIndex: number, toIndex: number) => void;
  onConfirmCycleDraft: () => void;
  onChangeQuickConfig: (minutes: number, focus: QuickStudyFocusMode) => void;
  onOpenQuickPreset?: (minutes: number) => void;
  onStartQuickStudy: () => void;
  onOpenPlanningCycle?: () => void;
  onOpenJournalSidebar?: () => void;
  onSelectCopilotQuestion: (key: CopilotQuestionKey) => void;
  onExecuteCopilotAnswer: (answer: CopilotAnswer) => void;
  onChangeJournalFilter: (patch: Partial<{ subjectId: string; tag: string; query: string }>) => void;
  onChangeJournalForm: (patch: Partial<JournalFormState>) => void;
  onSaveJournalEntry: () => void;
  onDeleteJournalEntry: (entryId: string) => void;
  onCreateReviewFromJournal: (entry: LearningJournalEntry) => void;
  onConfirmWeeklyClosingSnapshot: () => void;
  onTestWeeklyImprovement: () => void;
}

const QUICK_MINUTES_PRESETS = [15, 30, 45, 60];
const QUICK_FOCUS_OPTIONS: Array<{ key: QuickStudyFocusMode; label: string }> = [
  { key: 'priority', label: 'Próxima prioridade' },
  { key: 'review', label: 'Revisão' },
  { key: 'questions', label: 'Questões' },
  { key: 'law', label: 'Lei seca / Juris' },
  { key: 'resume', label: 'Retomar assunto' },
  { key: 'cycle', label: 'Bloco do ciclo' },
];
const PRIMARY_COPILOT_KEYS = new Set<CopilotQuestionKey>([
  'what_now',
  'why_this',
  'quick_30',
  'week_status',
]);

export function TodayStudyAssistantBar(props: TodayStudyAssistantBarProps): JSX.Element {
  const [showAllCopilotQuestions, setShowAllCopilotQuestions] = useState(false);
  const {
    activePanel,
    executionMode,
    cycle,
    cycleLap,
    cycleDivergence,
    cycleSkipReason,
    quickMinutes,
    quickFocus,
    quickProposal,
    copilot,
    copilotQuestion,
    journalEntries,
    weeklyClosing,
  } = props;

  const currentBlock =
    cycle && Array.isArray(cycle.blocks) && cycle.blocks.length > 0
      ? cycle.blocks[Math.max(0, Math.min(cycle.blocks.length - 1, cycle.currentBlockIndex))]
      : null;
  const upcomingBlocks =
    cycle && Array.isArray(cycle.blocks) && cycle.blocks.length > 1
      ? [1, 2]
          .filter(offset => offset < cycle.blocks.length)
          .map(offset => cycle.blocks[(cycle.currentBlockIndex + offset) % cycle.blocks.length])
      : [];

  const activeAnswer = copilot.answers[copilotQuestion] || copilot.answers.what_now;
  const primaryCopilotQuestions = copilot.questionsList.filter(item =>
    PRIMARY_COPILOT_KEYS.has(item.key)
  );
  const secondaryCopilotQuestions = copilot.questionsList.filter(
    item => !PRIMARY_COPILOT_KEYS.has(item.key)
  );
  const visibleCopilotQuestions = showAllCopilotQuestions
    ? copilot.questionsList
    : [
        ...primaryCopilotQuestions,
        ...secondaryCopilotQuestions.filter(item => item.key === copilotQuestion),
      ];

  const cyclePanelNode =
    executionMode === 'sequence' ? (
      <section
        class="space-y-4 min-w-0 pb-4 border-b border-border-subtle"
        aria-label="Ciclo de Estudos"
        data-study-cycle-panel="true"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <Icon name="repeat" size={16} class="text-accent shrink-0" />
            <strong class="module-heading__title text-content-primary">
              {cycle ? cycle.name : 'Ciclo de Estudos'}
            </strong>
            {cycle && (
              <Badge variant={cycle.status === 'paused' ? 'warning' : 'default'} icon={false} className="font-data">
                {cycle.status === 'paused' ? 'Pausado' : `Volta ${cycleLap.round}`}
                {(cycle.version || 1) > 1 ? ` · revisão ${cycle.version}` : ''}
              </Badge>
            )}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            {props.onOpenPlanningCycle && cycle && (
              <Button variant="ghost" size="small" onClick={props.onOpenPlanningCycle}>
                <Icon name="settings" size={14} class="icon-inline shrink-0" />
                <span>Ajustar na Central do Ciclo</span>
                <Icon name="chevron-right" size={13} class="icon-inline" />
              </Button>
            )}
          </div>
        </div>

        {currentBlock ? (
          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-content-secondary">
              <span>
                Próximo bloco:{' '}
                <strong class="text-content-primary">{currentBlock.subjectName}</strong> ·{' '}
                <span class="font-data">
                  {formatPlanMinutes(currentBlock.remainingMinutes ?? currentBlock.durationMinutes)}
                </span>
                {currentBlock.remainingMinutes != null ? ' restantes' : ''}
              </span>
              <span class="font-data">
                {cycleLap.completedBlocks} concluídos · {cycleLap.skippedBlocks} pulados de{' '}
                {cycleLap.totalBlocks} ({cycleLap.executedCoveragePct}% executado)
              </span>
            </div>

            {upcomingBlocks.length > 0 && (
              <p class="text-xs text-content-secondary m-0">
                Depois:{' '}
                <span class="font-data">
                  {upcomingBlocks
                    .map(b => `${b.subjectName} (${formatPlanMinutes(b.durationMinutes)})`)
                    .join(' → ')}
                </span>
              </p>
            )}

            {cycleDivergence.diverges ? (
              <div
                class="text-xs text-content-secondary border-l-3 border-l-accent pl-4 py-1 space-y-2"
                role="note"
              >
                <p class="m-0">
                  <Icon name="alert-circle" size={13} class="icon-inline text-accent" />{' '}
                  {cycleDivergence.explanation}
                </p>
                {copilot.answers.cycle_vs_diagnosis?.actionKind === 'execute_action' &&
                  copilot.answers.cycle_vs_diagnosis?.actionLabel && (
                    <Button
                      variant="tertiary"
                      size="small"
                      onClick={() =>
                        props.onExecuteCopilotAnswer(copilot.answers.cycle_vs_diagnosis)
                      }
                    >
                      <Icon name="compass" size={13} class="icon-inline" />
                      <span>{copilot.answers.cycle_vs_diagnosis.actionLabel}</span>
                    </Button>
                  )}
              </div>
            ) : (
              copilot.cycleInsight && (
                <p
                  class="text-xs text-content-secondary border-l-3 border-l-accent pl-4 py-1 m-0 flex items-start gap-2"
                  role="note"
                  data-cycle-copilot-insight="true"
                >
                  <Icon name="compass" size={13} class="icon-inline text-accent shrink-0 mt-0.5" />
                  <span>{copilot.cycleInsight}</span>
                </p>
              )
            )}

            <div class="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="small"
                disabled={cycle?.status === 'paused'}
                onClick={props.onStartCycleBlock}
              >
                <Icon name="play" size={13} class="icon-inline" />
                <span>Iniciar bloco</span>
              </Button>
              <Button variant="secondary" size="small" onClick={props.onToggleCyclePause}>
                <Icon name={cycle?.status === 'paused' ? 'play' : 'pause'} size={13} class="icon-inline" />
                <span>{cycle?.status === 'paused' ? 'Retomar ciclo' : 'Pausar ciclo'}</span>
              </Button>
              <div class="flex items-center gap-1 flex-wrap">
                <input
                  type="text"
                  class="select-control text-xs py-1 px-2"
                  style="max-width: 11rem;"
                  aria-label="Motivo opcional para pular bloco"
                  placeholder="Motivo opcional"
                  value={cycleSkipReason}
                  onInput={e => props.onSkipReasonChange(e.currentTarget.value)}
                />
                <Button variant="ghost" size="small" onClick={props.onSkipCycleBlock}>
                  <span>Pular bloco</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div class="space-y-3">
            <p class="text-xs text-content-secondary m-0">
              Estude em fila rotativa por blocos de 15 a 120 minutos sem gerar atrasos automáticos em dias sem estudo.
            </p>
            {props.onOpenPlanningCycle && (
              <Button variant="primary" size="small" onClick={props.onOpenPlanningCycle}>
                <Icon name="settings" size={13} class="icon-inline" />
                <span>Montar o ciclo na Central do Ciclo</span>
              </Button>
            )}
          </div>
        )}
      </section>
    ) : null;

  return (
    <div
      class="today-assistant-bar mt-6 pt-4 border-t border-border-subtle space-y-4 min-w-0"
      data-today-assistant-bar="true"
    >
      {cyclePanelNode}

      {/* Linha compacta de atalhos funcionais (3 gatilhos principais) */}
      <div
        class="flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label="Ferramentas rápidas de estudo de hoje"
      >
        <Button
          variant={activePanel === 'quick' ? 'tonal' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'quick'}
          aria-controls="todayQuickStudyPanel"
          onClick={() => props.onTogglePanel(activePanel === 'quick' ? 'none' : 'quick')}
        >
          <Icon name="clock" size={14} class="icon-inline shrink-0" />
          <span>Estudo rápido</span>
        </Button>

        <Button
          variant={activePanel === 'copilot' ? 'tonal' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'copilot'}
          aria-controls="todayCopilotPanel"
          onClick={() => props.onTogglePanel(activePanel === 'copilot' ? 'none' : 'copilot')}
        >
          <Icon name="compass" size={14} class="icon-inline shrink-0" />
          <span>Leitura do Extrato</span>
        </Button>

        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            if (props.onOpenJournalSidebar) {
              props.onOpenJournalSidebar();
            } else {
              props.onTogglePanel('none');
            }
          }}
        >
          <Icon name="book" size={14} class="icon-inline shrink-0" />
          <span>
            Diário de aprendizagem
            {journalEntries.length > 0 ? (
              <span class="font-data">{` (${journalEntries.length})`}</span>
            ) : null}
          </span>
        </Button>
      </div>

      {/* Funcionalidade B: Modo Estudo Rápido */}
      {activePanel === 'quick' && (
        <section
          id="todayQuickStudyPanel"
          class="pt-4 border-t border-border-subtle space-y-4 min-w-0"
          aria-label="Modo Estudo Rápido"
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="module-heading__title text-content-primary">
              Estudo Rápido — <span class="font-data">{formatPlanMinutes(quickMinutes)}</span>
            </strong>
            <Button variant="ghost" size="small" aria-label="Fechar Estudo Rápido" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs">
            <div
              class="inline-flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Atalhos de duração do Estudo Rápido"
            >
              {QUICK_MINUTES_PRESETS.map(mins => {
                const selected = quickMinutes === mins;
                return (
                  <Button
                    key={`quick-chip-${mins}`}
                    variant={selected ? 'tonal' : 'secondary'}
                    size="small"
                    aria-pressed={selected}
                    aria-label={`Estudo rápido de ${mins} minutos`}
                    onClick={() => props.onChangeQuickConfig(mins, quickFocus)}
                  >
                    <span class="font-data">{mins} min</span>
                  </Button>
                );
              })}
            </div>
            <label class="inline-flex items-center gap-2 text-content-secondary">
              <span>Tempo personalizado (10–180 min):</span>
              <input
                type="number"
                class="select-control font-data text-xs py-1 px-2"
                style="width: 5.5rem;"
                min={10}
                max={180}
                aria-label="Tempo personalizado em minutos"
                value={quickMinutes}
                onInput={e =>
                  props.onChangeQuickConfig(
                    Math.max(10, Math.min(180, Number(e.currentTarget.value) || 30)),
                    quickFocus
                  )
                }
              />
            </label>
          </div>

          <div class="flex flex-wrap gap-2" role="group" aria-label="Foco da sessão rápida">
            {QUICK_FOCUS_OPTIONS.filter(opt => opt.key !== 'cycle' || Boolean(currentBlock)).map(opt => {
              const selected = quickFocus === opt.key;
              return (
                <Button
                  key={opt.key}
                  variant={selected ? 'tonal' : 'secondary'}
                  size="small"
                  aria-pressed={selected}
                  onClick={() => props.onChangeQuickConfig(quickMinutes, opt.key)}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>

          <div class="pt-2.5 border-t border-border-subtle border-l-3 border-l-accent pl-3 space-y-1 text-xs">
            <div class="font-medium text-content-primary">
              Proposta (<span class="font-data">{formatPlanMinutes(quickProposal.plannedMinutes)}</span>):{' '}
              {quickProposal.subjectName}
              {quickProposal.topicName ? ` — ${quickProposal.topicName}` : ''}
            </div>
            <p class="text-content-secondary m-0">{quickProposal.reasoning}</p>
            {quickProposal.strategy && (
              <p class="text-content-secondary m-0 font-data">
                Etapas no cronômetro:{' '}
                {quickProposal.strategy.steps.map(s => `${s.label} (${s.minutes} min)`).join(' · ')}
              </p>
            )}
          </div>

          <div class="flex flex-wrap gap-2">
            <Button variant="primary" size="small" onClick={props.onStartQuickStudy}>
              <Icon name="play" size={13} class="icon-inline" />
              <span>Iniciar no cronômetro único</span>
            </Button>
          </div>
        </section>
      )}

      {/* Funcionalidade E: Leitura do Extrato */}
      {activePanel === 'copilot' && (
        <section
          id="todayCopilotPanel"
          class="pt-4 border-t border-border-subtle space-y-4 min-w-0"
          aria-label="Leitura do Extrato"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <Icon name="compass" size={16} class="text-accent shrink-0" />
              <strong class="module-heading__title text-content-primary">
                Leitura do Extrato
              </strong>
              <Badge variant="info" icon={false}>
                {copilot.confidence.label}
              </Badge>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar Leitura do Extrato" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          <p class="m-0 text-xs text-content-secondary">
            Orientação atual: <strong class="text-content-primary">{copilot.title}</strong>
          </p>

          <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Perguntas rápidas">
            {visibleCopilotQuestions.map(item => {
              const selected = copilotQuestion === item.key;
              return (
                <Button
                  key={item.key}
                  variant={selected ? 'tonal' : 'secondary'}
                  size="small"
                  aria-pressed={selected}
                  onClick={() => props.onSelectCopilotQuestion(item.key)}
                >
                  {item.question}
                </Button>
              );
            })}
            {secondaryCopilotQuestions.length > 0 && (
              <Button
                variant="tertiary"
                size="small"
                aria-expanded={showAllCopilotQuestions}
                onClick={() => setShowAllCopilotQuestions(prev => !prev)}
              >
                {showAllCopilotQuestions
                  ? 'Menos perguntas'
                  : `Mais perguntas (${secondaryCopilotQuestions.length})`}
              </Button>
            )}
          </div>

          <div class="pt-4 border-t border-border-subtle border-l-3 border-l-accent pl-4 space-y-2 text-xs">
            <strong class="text-sm text-content-primary block">{activeAnswer.headline}</strong>
            <p class="text-content-primary m-0 leading-relaxed">{activeAnswer.body}</p>
            {activeAnswer.evidenceSummary && (
              <p class="text-content-secondary m-0 font-data">{activeAnswer.evidenceSummary}</p>
            )}
            {activeAnswer.limitations.length > 0 && (
              <p class="text-content-secondary m-0">
                <Icon name="bulb" size={12} class="icon-inline" /> {activeAnswer.limitations[0]}
              </p>
            )}
            {activeAnswer.actionLabel && activeAnswer.actionKind !== 'none' && (
              <div class="pt-1">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => props.onExecuteCopilotAnswer(activeAnswer)}
                >
                  <span>{activeAnswer.actionLabel}</span>
                  <Icon name="chevron-right" size={13} class="icon-inline" />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Funcionalidade D: Fechamento Semanal Inteligente */}
      {activePanel === 'weekly_closing' && weeklyClosing && (
        <section
          id="todayWeeklyClosingPanel"
          class="pt-4 border-t border-border-subtle space-y-4 text-xs min-w-0"
          aria-label="Ritual de Fechamento Semanal"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <strong class="module-heading__title text-content-primary block">
                {weeklyClosing.window.windowLabel} ·{' '}
                <span class="font-data">{weeklyClosing.window.periodLabel}</span>
              </strong>
              <span class="text-content-secondary">
                {weeklyClosing.confidence.label} ·{' '}
                <span class="font-data">
                  {formatPlanMinutes(weeklyClosing.metrics.studiedMinutes)} em{' '}
                  {weeklyClosing.metrics.sessionsCount} sessões · {weeklyClosing.metrics.resolved}{' '}
                  questões
                </span>
              </span>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar fechamento semanal" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          {weeklyClosing.comparisonWarning && (
            <p class="m-0 text-content-secondary border-l-3 border-l-accent pl-4 py-1">
              {weeklyClosing.comparisonWarning}
            </p>
          )}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border-subtle">
            <div class="space-y-1">
              <strong class="text-content-primary">O que funcionou</strong>
              {(weeklyClosing.whatWorked || []).map((line: string, i: number) => (
                <p key={i} class="m-0 text-content-secondary">
                  {line}
                </p>
              ))}
            </div>
            <div class="space-y-1">
              <strong class="text-content-primary">O que precisa de atenção</strong>
              {(weeklyClosing.needsAttention || []).map((line: string, i: number) => (
                <p key={i} class="m-0 text-content-secondary">
                  {line}
                </p>
              ))}
            </div>
            <div class="space-y-1">
              <strong class="text-content-primary">Uma melhoria para testar</strong>
              <p class="m-0 text-content-secondary">
                {weeklyClosing.improvementToTest?.detail ||
                  'Registre mais sessões para sugerir um foco concreto para a próxima semana.'}
              </p>
            </div>
          </div>

          {weeklyClosing.journalReflections?.entriesCount > 0 && (
            <p class="m-0 text-content-secondary">
              Diário na semana: {weeklyClosing.journalReflections.entriesCount} anotações.{' '}
              {weeklyClosing.journalReflections.caveat}
            </p>
          )}

          <div class="flex flex-wrap gap-2 pt-1">
            {!weeklyClosing.isPartialCurrentWeek &&
              weeklyClosing.windowStatus !== 'insufficient_data' && (
                <Button variant="primary" size="small" onClick={props.onConfirmWeeklyClosingSnapshot}>
                  <span>
                    {weeklyClosing.windowStatus === 'already_finalized'
                      ? 'Fechamento já registrado'
                      : 'Confirmar fechamento semanal'}
                  </span>
                </Button>
              )}
            {weeklyClosing.improvementToTest && (
              <Button variant="secondary" size="small" onClick={props.onTestWeeklyImprovement}>
                <span>Testar melhoria na semana seguinte</span>
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
