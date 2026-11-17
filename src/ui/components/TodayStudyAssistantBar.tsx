import type { JSX } from 'preact';
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
import type { StudyCycleMode, StudyCycleQueue } from '../../domain/planning/study-cycle-engine.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

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
  onStartQuickStudy: () => void;
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

export function TodayStudyAssistantBar(props: TodayStudyAssistantBarProps): JSX.Element {
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
  const activeSubjects = subjects.filter(s => s && !s.archived);
  const selectedFormSubject = activeSubjects.find(s => s.id === journalForm.subjectId) || null;

  return (
    <div
      class="today-assistant-bar mt-3 pt-3 border-t border-border-subtle space-y-3 min-w-0"
      data-today-assistant-bar="true"
    >
      {/* Linha compacta de atalhos funcionais (recolhida por padrão) */}
      <div
        class="flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label="Ferramentas rápidas de estudo de hoje"
      >
        <Button
          variant={activePanel === 'quick' ? 'primary' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'quick'}
          aria-controls="todayQuickStudyPanel"
          onClick={() => props.onTogglePanel(activePanel === 'quick' ? 'none' : 'quick')}
        >
          <Icon name="clock" size={14} class="icon-inline shrink-0" />
          <span>Tenho X minutos</span>
        </Button>

        <Button
          variant={activePanel === 'copilot' ? 'primary' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'copilot'}
          aria-controls="todayCopilotPanel"
          onClick={() => props.onTogglePanel(activePanel === 'copilot' ? 'none' : 'copilot')}
        >
          <Icon name="compass" size={14} class="icon-inline shrink-0" />
          <span>Orientação guiada</span>
        </Button>

        <Button
          variant={activePanel === 'journal' ? 'primary' : 'secondary'}
          size="small"
          aria-expanded={activePanel === 'journal'}
          aria-controls="todayJournalPanel"
          onClick={() => props.onTogglePanel(activePanel === 'journal' ? 'none' : 'journal')}
        >
          <Icon name="book" size={14} class="icon-inline shrink-0" />
          <span>
            Diário de aprendizagem
            {journalEntries.length > 0 ? ` (${journalEntries.length})` : ''}
          </span>
        </Button>

        <Button
          variant={activePanel === 'weekly_closing' ? 'primary' : 'ghost'}
          size="small"
          aria-expanded={activePanel === 'weekly_closing'}
          aria-controls="todayWeeklyClosingPanel"
          onClick={() =>
            props.onTogglePanel(activePanel === 'weekly_closing' ? 'none' : 'weekly_closing')
          }
        >
          <Icon name="calendar-plus" size={14} class="icon-inline shrink-0" />
          <span>Fechamento da semana</span>
        </Button>
      </div>

      {/* Painel Ciclo de Estudos 2.0 quando modo Sequência flexível estiver ativo */}
      {executionMode === 'sequence' && (
        <section
          class="p-3 rounded-default bg-surface-subtle border border-border-subtle space-y-2 min-w-0"
          aria-label="Ciclo de Estudos"
          data-study-cycle-panel="true"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <Icon name="repeat" size={16} class="text-brand shrink-0" />
              <strong class="text-sm text-content-primary">
                {cycle ? cycle.name : 'Ciclo de Estudos 2.0'}
              </strong>
              {cycle && (
                <span class="text-xs px-2 py-0.5 rounded bg-surface-card border border-border-subtle text-content-secondary">
                  {cycle.status === 'paused' ? 'Pausado' : `Volta ${cycleLap.round}`} · v
                  {cycle.version || 1}
                </span>
              )}
            </div>
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

          {currentBlock ? (
            <div class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-content-secondary">
                <span>
                  Próximo bloco:{' '}
                  <strong class="text-content-primary">{currentBlock.subjectName}</strong> ·{' '}
                  {formatPlanMinutes(currentBlock.remainingMinutes ?? currentBlock.durationMinutes)}
                  {currentBlock.remainingMinutes != null ? ' restantes' : ''}
                </span>
                <span class="font-data">
                  {cycleLap.completedBlocks} concluídos · {cycleLap.skippedBlocks} pulados de{' '}
                  {cycleLap.totalBlocks} ({cycleLap.executedCoveragePct}% executado)
                </span>
              </div>

              {upcomingBlocks.length > 0 && (
                <p class="text-xs text-content-secondary m-0">
                  Depois: {upcomingBlocks.map(b => `${b.subjectName} (${b.durationMinutes} min)`).join(' → ')}
                </p>
              )}

              {cycleDivergence.diverges && (
                <p
                  class="text-xs text-content-secondary bg-surface-card p-2 rounded border border-border-subtle m-0"
                  role="note"
                >
                  <Icon name="alert-circle" size={13} class="icon-inline text-brand" />{' '}
                  {cycleDivergence.explanation}
                </p>
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
            <p class="text-xs text-content-secondary m-0">
              Monte uma fila flexível de blocos de 15 a 120 minutos sem gerar atrasos automáticos em dias sem estudo.
            </p>
          )}
        </section>
      )}

      {/* Configurador do Ciclo 2.0 com prévia obrigatória */}
      {activePanel === 'cycle_config' && (
        <section
          class="p-3 rounded-default bg-surface-card border border-border-subtle space-y-3 min-w-0"
          aria-label="Configurar ciclo de estudos"
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="text-sm text-content-primary">Configuração e prévia do ciclo</strong>
            <Button variant="ghost" size="small" aria-label="Fechar configuração do ciclo" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>
          <div class="flex flex-wrap gap-3 text-xs">
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
                Prévia: <strong>{cycleDraft.preview.blocksCount} blocos</strong> ·{' '}
                {formatPlanMinutes(cycleDraft.preview.totalDurationMinutes)} por volta completa. Alterações criam nova versão sem reescrever voltas passadas.
              </p>
              {cycleDraft.preview.cycle.blocks.length > 0 && (
                <ul class="space-y-1 m-0 p-0 list-none max-h-48 overflow-y-auto">
                  {cycleDraft.preview.cycle.blocks.map((block, index) => (
                    <li
                      key={block.id}
                      class="flex items-center justify-between gap-2 p-1.5 rounded bg-surface-subtle border border-border-subtle"
                    >
                      <span class="truncate">
                        {index + 1}. <strong>{block.subjectName}</strong> · {block.durationMinutes} min
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
          class="p-3 rounded-default bg-surface-card border border-border-subtle space-y-3 min-w-0"
          aria-label="Modo Estudo Rápido"
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="text-sm text-content-primary">Estudo Rápido — escolha o tempo disponível</strong>
            <Button variant="ghost" size="small" aria-label="Fechar Estudo Rápido" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            {QUICK_MINUTES_PRESETS.map(mins => (
              <Button
                key={mins}
                variant={quickMinutes === mins ? 'primary' : 'secondary'}
                size="small"
                onClick={() => props.onChangeQuickConfig(mins, quickFocus)}
              >
                {mins} min
              </Button>
            ))}
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
          </div>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Foco da sessão rápida">
            {QUICK_FOCUS_OPTIONS.filter(opt => opt.key !== 'cycle' || Boolean(currentBlock)).map(opt => (
              <Button
                key={opt.key}
                variant={quickFocus === opt.key ? 'primary' : 'ghost'}
                size="small"
                onClick={() => props.onChangeQuickConfig(quickMinutes, opt.key)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <div class="p-2.5 rounded bg-surface-subtle border border-border-subtle space-y-1 text-xs">
            <div class="font-medium text-content-primary">
              Proposta ({formatPlanMinutes(quickProposal.plannedMinutes)}):{' '}
              {quickProposal.subjectName}
              {quickProposal.topicName ? ` — ${quickProposal.topicName}` : ''}
            </div>
            <p class="text-content-secondary m-0">{quickProposal.reasoning}</p>
            {quickProposal.strategy && (
              <p class="text-content-secondary m-0">
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
          class="p-3 rounded-default bg-surface-card border border-border-subtle space-y-3 min-w-0"
          aria-label="Copiloto de Estudos Guiado"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Icon name="compass" size={16} class="text-brand shrink-0" />
              <strong class="text-sm text-content-primary">Orientação guiada</strong>
              <span class="text-xs px-2 py-0.5 rounded bg-surface-subtle text-content-secondary">
                {copilot.confidence.label}
              </span>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar orientação guiada" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Perguntas rápidas">
            {copilot.questionsList.map(item => (
              <Button
                key={item.key}
                variant={copilotQuestion === item.key ? 'primary' : 'ghost'}
                size="small"
                onClick={() => props.onSelectCopilotQuestion(item.key)}
              >
                {item.question}
              </Button>
            ))}
          </div>

          <div class="p-3 rounded bg-surface-subtle border border-border-subtle space-y-1.5 text-xs">
            <strong class="text-sm text-content-primary block">{activeAnswer.headline}</strong>
            <p class="text-content-primary m-0 leading-relaxed">{activeAnswer.body}</p>
            {activeAnswer.evidenceSummary && (
              <p class="text-content-secondary m-0">{activeAnswer.evidenceSummary}</p>
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

      {/* Funcionalidade C: Diário de Aprendizagem */}
      {activePanel === 'journal' && (
        <section
          id="todayJournalPanel"
          class="p-3 rounded-default bg-surface-card border border-border-subtle space-y-3 min-w-0"
          aria-label="Diário de Aprendizagem"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Icon name="book" size={16} class="text-brand shrink-0" />
              <strong class="text-sm text-content-primary">
                Diário de Aprendizagem (opcional)
              </strong>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar diário" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          <div class="p-2.5 rounded bg-surface-subtle border border-border-subtle space-y-2 text-xs">
            {journalForm.sessionId && (
              <p class="m-0 text-brand font-medium">
                Vinculado à sessão {journalForm.sessionId} (1 entrada editável por sessão).
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
                    variant={selected ? 'primary' : 'ghost'}
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

          <div class="flex flex-wrap gap-2 text-xs">
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
              placeholder="Buscar no diário..."
              value={journalFilters.query}
              onInput={e => props.onChangeJournalFilter({ query: e.currentTarget.value })}
            />
          </div>

          {journalEntries.length === 0 ? (
            <p class="text-xs text-content-secondary m-0">
              Nenhuma anotação encontrada. O diário é totalmente opcional e nunca penaliza suas métricas.
            </p>
          ) : (
            <ul class="space-y-2 m-0 p-0 list-none max-h-56 overflow-y-auto">
              {journalEntries.slice(0, 12).map(entry => (
                <li
                  key={entry.id}
                  class="p-2 rounded bg-surface-subtle border border-border-subtle text-xs space-y-1"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-medium text-content-primary">
                      {formatDateBR(entry.localDate)} ·{' '}
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
                    <div class="flex flex-wrap gap-1">
                      {entry.tags.map(t => (
                        <span
                          key={t}
                          class="px-1.5 py-0.5 rounded bg-surface-card border border-border-subtle text-content-secondary"
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
          class="p-3 rounded-default bg-surface-card border border-border-subtle space-y-2.5 text-xs min-w-0"
          aria-label="Ritual de Fechamento Semanal"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <strong class="text-sm text-content-primary block">
                {weeklyClosing.window.windowLabel} · {weeklyClosing.window.periodLabel}
              </strong>
              <span class="text-content-secondary">
                {weeklyClosing.confidence.label} · {formatPlanMinutes(weeklyClosing.metrics.studiedMinutes)} em{' '}
                {weeklyClosing.metrics.sessionsCount} sessões · {weeklyClosing.metrics.resolved} questões
              </span>
            </div>
            <Button variant="ghost" size="small" aria-label="Fechar fechamento semanal" onClick={() => props.onTogglePanel('none')}>
              <Icon name="x" size={14} />
            </Button>
          </div>

          {weeklyClosing.comparisonWarning && (
            <p class="m-0 text-content-secondary bg-surface-subtle p-2 rounded border border-border-subtle">
              {weeklyClosing.comparisonWarning}
            </p>
          )}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div class="p-2 rounded bg-surface-subtle border border-border-subtle space-y-1">
              <strong class="text-content-primary">O que funcionou</strong>
              {(weeklyClosing.whatWorked || []).map((line: string, i: number) => (
                <p key={i} class="m-0 text-content-secondary">
                  {line}
                </p>
              ))}
            </div>
            <div class="p-2 rounded bg-surface-subtle border border-border-subtle space-y-1">
              <strong class="text-content-primary">O que precisa de atenção</strong>
              {(weeklyClosing.needsAttention || []).map((line: string, i: number) => (
                <p key={i} class="m-0 text-content-secondary">
                  {line}
                </p>
              ))}
            </div>
            <div class="p-2 rounded bg-surface-subtle border border-border-subtle space-y-1">
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
