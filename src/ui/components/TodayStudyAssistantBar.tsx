import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { formatPlanMinutes } from '../../core/format-duration.js';
import { formatDateBR } from '../../core/format-date.js';
import type {
  CopilotAnswer,
  CopilotQuestionKey,
  CopilotViewModel,
} from '../../application/copilot/study-copilot-service.js';
import type { QuickStudyFocusMode, QuickStudyProposal } from '../../domain/quick-study/quick-study-engine.js';
import {
  LEARNING_JOURNAL_TAGS,
  LEARNING_JOURNAL_TAG_LABELS,
} from '../../domain/journal/learning-journal-engine.js';
import type { LearningJournalEntry, LearningJournalTag } from '../../core/types.js';
import {
  computeStudyCycleSubjectShares,
  type StudyCycleMode,
  type StudyCycleQueue,
} from '../../domain/planning/study-cycle-engine.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';
import { StudyCycleDonut } from './StudyCycleDonut.js';

export type AssistantPanelKind =
  | 'none'
  | 'quick'
  | 'copilot'
  | 'journal'
  | 'cycle_config'
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
    subjects,
    cycle,
    cycleLap,
    cycleDivergence,
    cycleSkipReason,
    cycleDraft,
    quickMinutes,
    quickFocus,
    quickProposal,
    copilot,
    copilotQuestion,
    journalEntries,
    journalFilters,
    journalForm,
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
  const hasActiveJournalFilters = Boolean(
    journalFilters.subjectId || journalFilters.tag || journalFilters.query.trim()
  );
  const showJournalFilters = journalEntries.length > 0 || hasActiveJournalFilters;
  const activeSubjects = subjects.filter(s => s && !s.archived);
  const selectedFormSubject = activeSubjects.find(s => s.id === journalForm.subjectId) || null;
  const activeCycleShares =
    cycle && Array.isArray(cycle.blocks) && cycle.blocks.length > 0
      ? computeStudyCycleSubjectShares(cycle.blocks)
      : cycleDraft.preview?.subjectShares || [];

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
              {cycle ? cycle.name : 'Ciclo de Estudos 2.0'}
            </strong>
            {cycle && (
              <span class="status-pill status-pill--default font-data">
                {cycle.status === 'paused' ? 'Pausado' : `Volta ${cycleLap.round}`}
                {(cycle.version || 1) > 1 ? ` · revisão ${cycle.version}` : ''}
              </span>
            )}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            {props.onOpenPlanningCycle && (
              <Button variant="ghost" size="small" onClick={props.onOpenPlanningCycle}>
                <span>Central em Planejamento</span>
                <Icon name="chevron-right" size={13} class="icon-inline" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="small"
              onClick={() =>
                props.onTogglePanel(activePanel === 'cycle_config' ? 'none' : 'cycle_config')
              }
            >
              <Icon name="settings" size={14} class="icon-inline shrink-0" />
              <span>{cycle ? 'Configurar ciclo' : 'Montar ciclo'}</span>
            </Button>
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

            {activePanel !== 'cycle_config' && activeCycleShares.length > 0 && (
              <StudyCycleDonut
                shares={activeCycleShares}
                subjects={activeSubjects}
                size={116}
                strokeWidth={14}
                centerLabel="por volta"
                compact
                maxVisibleLegend={4}
              />
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
            {activePanel !== 'cycle_config' && activeCycleShares.length > 0 && (
              <StudyCycleDonut
                shares={activeCycleShares}
                subjects={activeSubjects}
                size={116}
                strokeWidth={14}
                centerLabel="prévia"
                compact
                maxVisibleLegend={4}
              />
            )}
            {cycleDraft.preview?.valid && (
              <div class="flex flex-wrap items-center gap-2">
                <Button variant="primary" size="small" onClick={props.onConfirmCycleDraft}>
                  <Icon name="play" size={13} class="icon-inline" />
                  <span>Ativar ciclo recomendado</span>
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => props.onTogglePanel('cycle_config')}
                >
                  <span>Ajustar blocos</span>
                </Button>
              </div>
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

      {/* Linha compacta de atalhos funcionais (3 gatilhos principais + presets de duração) */}
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
          <span>Tenho X minutos</span>
        </Button>

        <div
          class="inline-flex flex-wrap items-center gap-1"
          role="group"
          aria-label="Atalhos diretos de Estudo Rápido"
        >
          {QUICK_MINUTES_PRESETS.map(mins => {
            const selected = activePanel === 'quick' && quickMinutes === mins;
            return (
              <Button
                key={`quick-chip-${mins}`}
                variant={selected ? 'tonal' : 'ghost'}
                size="small"
                aria-pressed={selected}
                aria-label={`Estudo rápido de ${mins} minutos`}
                onClick={() => {
                  if (props.onOpenQuickPreset) {
                    props.onOpenQuickPreset(mins);
                  } else {
                    props.onChangeQuickConfig(mins, quickFocus);
                    props.onTogglePanel('quick');
                  }
                }}
              >
                <span class="font-data">{mins} min</span>
              </Button>
            );
          })}
        </div>

        <Button
          variant={activePanel === 'copilot' ? 'tonal' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'copilot'}
          aria-controls="todayCopilotPanel"
          onClick={() => props.onTogglePanel(activePanel === 'copilot' ? 'none' : 'copilot')}
        >
          <Icon name="compass" size={14} class="icon-inline shrink-0" />
          <span>Orientação guiada</span>
        </Button>

        <Button
          variant={activePanel === 'journal' ? 'tonal' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'journal'}
          aria-controls="todayJournalPanel"
          onClick={() => props.onTogglePanel(activePanel === 'journal' ? 'none' : 'journal')}
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

      {/* Configurador do Ciclo 2.0 com prévia obrigatória */}
      {activePanel === 'cycle_config' && (
        <section
          class="pt-4 border-t border-border-subtle space-y-4 min-w-0"
          aria-label="Configurar ciclo de estudos"
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="module-heading__title text-content-primary">Configuração e prévia do ciclo</strong>
            <Button variant="ghost" size="small" aria-label="Fechar configuração do ciclo" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>
          <div class="flex flex-wrap gap-4 text-xs">
            <label class="flex flex-col gap-1">
              <span class="text-content-secondary">Modo</span>
              <select
                class="select-control"
                aria-label="Modo de distribuição do ciclo"
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
                <option value="manual">Manual</option>
              </select>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-content-secondary">Duração do bloco (15–120 min)</span>
              <input
                type="number"
                class="select-control font-data"
                min={15}
                max={120}
                step={5}
                aria-label="Duração padrão do bloco em minutos"
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
            <div class="space-y-2 text-xs">
              <p class="m-0 text-content-secondary">
                Prévia: <strong class="font-data text-content-primary">{cycleDraft.preview.blocksCount} blocos</strong> ·{' '}
                <span class="font-data">{formatPlanMinutes(cycleDraft.preview.totalDurationMinutes)}</span> por volta completa. Alterações criam nova versão sem reescrever voltas passadas.
              </p>
              {cycleDraft.preview.subjectShares.length > 0 && (
                <StudyCycleDonut
                  shares={cycleDraft.preview.subjectShares}
                  subjects={activeSubjects}
                  size={136}
                  strokeWidth={16}
                  centerLabel="por volta"
                  maxVisibleLegend={5}
                />
              )}
              {cycleDraft.preview.cycle.blocks.length > 0 && (
                <ul class="divide-y divide-border-subtle border-t border-b border-border-subtle m-0 p-0 list-none max-h-48 overflow-y-auto">
                  {cycleDraft.preview.cycle.blocks.map((block, index) => (
                    <li
                      key={block.id}
                      class="flex items-center justify-between gap-2 py-1.5"
                    >
                      <span class="truncate">
                        <span class="font-data text-content-secondary">{index + 1}.</span>{' '}
                        <strong>{block.subjectName}</strong> ·{' '}
                        <span class="font-data">{formatPlanMinutes(block.durationMinutes)}</span>
                      </span>
                      <span class="inline-flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="small"
                          disabled={index === 0}
                          aria-label={`Mover bloco ${block.subjectName} para cima`}
                          onClick={() => props.onMoveCycleDraftBlock(index, index - 1)}
                        >
                          <Icon name="arrow-up" size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          disabled={index === cycleDraft.preview!.cycle.blocks.length - 1}
                          aria-label={`Mover bloco ${block.subjectName} para baixo`}
                          onClick={() => props.onMoveCycleDraftBlock(index, index + 1)}
                        >
                          <Icon name="arrow-down" size={12} />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {cycleDraft.preview.errors.length > 0 && (
                <p class="text-red m-0">{cycleDraft.preview.errors[0]}</p>
              )}
              <div class="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="small"
                  disabled={!cycleDraft.preview.valid}
                  onClick={props.onConfirmCycleDraft}
                >
                  <Icon name="check" size={13} class="icon-inline" />
                  <span>Confirmar nova versão do ciclo</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Funcionalidade B: Modo Estudo Rápido */}
      {activePanel === 'quick' && (
        <section
          id="todayQuickStudyPanel"
          class="pt-3 border-t border-border-subtle space-y-3 min-w-0"
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

          <div class="flex flex-wrap items-center gap-3 text-xs">
            <label class="inline-flex items-center gap-2 text-content-secondary">
              <span>Tempo personalizado (min):</span>
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

          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Foco da sessão rápida">
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

      {/* Funcionalidade E: Copiloto de Estudos Guiado */}
      {activePanel === 'copilot' && (
        <section
          id="todayCopilotPanel"
          class="pt-3 border-t border-border-subtle space-y-3 min-w-0"
          aria-label="Copiloto de Estudos Guiado"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <Icon name="compass" size={16} class="text-accent shrink-0" />
              <strong class="module-heading__title text-content-primary">
                Copiloto de Estudos Guiado
              </strong>
              <span class="status-pill status-pill--info">
                {copilot.confidence.label}
              </span>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar orientação guiada" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Perguntas rápidas">
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

          <div class="pt-2.5 border-t border-border-subtle border-l-3 border-l-accent pl-3 space-y-1.5 text-xs">
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
                  variant="primary"
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

      {/* Funcionalidade C: Diário de Aprendizagem */}
      {activePanel === 'journal' && (
        <section
          id="todayJournalPanel"
          class="pt-3 border-t border-border-subtle space-y-3 min-w-0"
          aria-label="Diário de Aprendizagem"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Icon name="book" size={16} class="text-accent shrink-0" />
              <strong class="module-heading__title text-content-primary">
                Diário de Aprendizagem (opcional)
              </strong>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar diário" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          <div class="pt-2.5 border-t border-border-subtle space-y-2 text-xs">
            {journalForm.sessionId && (
              <p class="m-0 text-content-primary font-medium">
                Anotação vinculada à sessão selecionada (1 entrada editável por sessão).
              </p>
            )}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                class="select-control"
                aria-label="Disciplina da anotação"
                value={journalForm.subjectId}
                onChange={e =>
                  props.onChangeJournalForm({ subjectId: e.currentTarget.value, topicId: '' })
                }
              >
                <option value="">Sem disciplina vinculada</option>
                {activeSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <select
                class="select-control"
                aria-label="Tópico da anotação"
                value={journalForm.topicId}
                onChange={e => props.onChangeJournalForm({ topicId: e.currentTarget.value })}
              >
                <option value="">Sem tópico específico</option>
                {(selectedFormSubject?.topics || [])
                  .filter((t: any) => !t.archived)
                  .map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <div class="flex flex-wrap gap-1.5" role="group" aria-label="Etiquetas do aprendizado">
              {LEARNING_JOURNAL_TAGS.map(tag => {
                const selected = journalForm.tags.includes(tag);
                return (
                  <Button
                    key={tag}
                    variant={selected ? 'tonal' : 'secondary'}
                    size="small"
                    aria-pressed={selected}
                    onClick={() =>
                      props.onChangeJournalForm({
                        tags: selected
                          ? journalForm.tags.filter(t => t !== tag)
                          : [...journalForm.tags, tag],
                      })
                    }
                  >
                    {LEARNING_JOURNAL_TAG_LABELS[tag]}
                  </Button>
                );
              })}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                class="select-control"
                aria-label="Dificuldade percebida no diário"
                value={journalForm.difficultyRating}
                onChange={e =>
                  props.onChangeJournalForm({ difficultyRating: e.currentTarget.value as any })
                }
              >
                <option value="">Dificuldade (opcional)</option>
                <option value="easy">Fácil</option>
                <option value="medium">Média</option>
                <option value="hard">Difícil</option>
              </select>
              <select
                class="select-control"
                aria-label="Energia na sessão"
                value={journalForm.energyRating}
                onChange={e =>
                  props.onChangeJournalForm({ energyRating: e.currentTarget.value as any })
                }
              >
                <option value="">Energia (opcional)</option>
                <option value="high">Alta</option>
                <option value="normal">Normal</option>
                <option value="low">Baixa</option>
              </select>
            </div>

            <textarea
              class="select-control w-full"
              rows={2}
              maxLength={1000}
              aria-label="Registrar o que aprendeu, dúvida ou pegadinha"
              placeholder="Registrar o que aprendeu, dúvida ou pegadinha (até 1.000 caracteres)..."
              value={journalForm.note}
              onInput={e => props.onChangeJournalForm({ note: e.currentTarget.value })}
            />
            <input
              type="text"
              class="select-control w-full"
              maxLength={500}
              aria-label="Próximo passo opcional"
              placeholder="Próximo passo (ex.: resolver 10 questões de prazo)"
              value={journalForm.nextStep}
              onInput={e => props.onChangeJournalForm({ nextStep: e.currentTarget.value })}
            />
            <div class="flex flex-wrap gap-2">
              <Button variant="primary" size="small" onClick={props.onSaveJournalEntry}>
                <Icon name="check" size={13} class="icon-inline" />
                <span>Salvar anotação</span>
              </Button>
            </div>
          </div>

          {showJournalFilters && (
            <div class="pt-2.5 border-t border-border-subtle flex flex-wrap gap-2 text-xs">
              <select
                class="select-control"
                aria-label="Filtrar diário por disciplina"
                value={journalFilters.subjectId}
                onChange={e => props.onChangeJournalFilter({ subjectId: e.currentTarget.value })}
              >
                <option value="">Todas as disciplinas</option>
                {activeSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <select
                class="select-control"
                aria-label="Filtrar diário por etiqueta"
                value={journalFilters.tag}
                onChange={e => props.onChangeJournalFilter({ tag: e.currentTarget.value })}
              >
                <option value="">Todas as etiquetas</option>
                {LEARNING_JOURNAL_TAGS.map(tag => (
                  <option key={tag} value={tag}>
                    {LEARNING_JOURNAL_TAG_LABELS[tag]}
                  </option>
                ))}
              </select>
              <input
                type="search"
                class="select-control"
                aria-label="Buscar nas anotações do diário"
                placeholder="Buscar por disciplina, assunto ou etiqueta..."
                value={journalFilters.query}
                onInput={e => props.onChangeJournalFilter({ query: e.currentTarget.value })}
              />
            </div>
          )}

          {journalEntries.length === 0 ? (
            <div class="space-y-2 text-xs text-content-secondary">
              <p class="m-0">
                {hasActiveJournalFilters
                  ? 'Nenhuma anotação encontrada para o filtro atual.'
                  : 'Nenhuma anotação encontrada. O diário é totalmente opcional e nunca penaliza suas métricas.'}
              </p>
              {hasActiveJournalFilters && (
                <Button
                  variant="tertiary"
                  size="small"
                  onClick={() => props.onChangeJournalFilter({ subjectId: '', tag: '', query: '' })}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <ul class="m-0 p-0 list-none max-h-56 overflow-y-auto divide-y divide-border-subtle border-t border-border-subtle">
              {journalEntries.slice(0, 12).map(entry => (
                <li
                  key={entry.id}
                  class="py-2 text-xs space-y-1"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-medium text-content-primary">
                      <span class="font-data">{formatDateBR(entry.localDate)}</span> ·{' '}
                      {entry.subjectNameSnapshot || 'Estudo livre'}
                      {entry.topicNameSnapshot ? ` — ${entry.topicNameSnapshot}` : ''}
                    </span>
                    <div class="flex items-center gap-1">
                      {entry.topicId &&
                        (entry.tags.includes('duvida') ||
                          entry.tags.includes('revisar') ||
                          entry.tags.includes('pegadinha')) && (
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => props.onCreateReviewFromJournal(entry)}
                          >
                            <span>Transformar em revisão</span>
                          </Button>
                        )}
                      <Button
                        variant="ghost"
                        size="small"
                        aria-label="Excluir anotação do diário"
                        onClick={() => props.onDeleteJournalEntry(entry.id)}
                      >
                        <Icon name="trash" size={12} />
                      </Button>
                    </div>
                  </div>
                  {entry.note && <p class="m-0 text-content-primary">{entry.note}</p>}
                  {entry.nextStep && (
                    <p class="m-0 text-content-secondary">Próximo passo: {entry.nextStep}</p>
                  )}
                  {entry.tags.length > 0 && (
                    <div class="flex flex-wrap gap-1.5">
                      {entry.tags.map(t => (
                        <span
                          key={t}
                          class="status-pill status-pill--default px-1.5 py-0.5 rounded"
                        >
                          {LEARNING_JOURNAL_TAG_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Funcionalidade D: Fechamento Semanal Inteligente */}
      {activePanel === 'weekly_closing' && weeklyClosing && (
        <section
          id="todayWeeklyClosingPanel"
          class="pt-3 border-t border-border-subtle space-y-2.5 text-xs min-w-0"
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
            <p class="m-0 text-content-secondary border-l-3 border-l-accent pl-3 py-0.5">
              {weeklyClosing.comparisonWarning}
            </p>
          )}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2.5 border-t border-border-subtle">
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
