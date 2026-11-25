import type { JSX } from 'preact';
import { ESSAY_CRITERIA } from '../../../domain/calendar/calendar-projection.js';
import { useEffect, useState } from 'preact/hooks';
import type {
  CalendarActivityKind,
  CalendarRecurrenceRule,
  EssayKind,
  EssayScoringMode,
} from '../../../core/types.js';
import {
  CALENDAR_ACTIVITY_KINDS,
  CALENDAR_ACTIVITY_LABELS,
  CALENDAR_RECURRENCE_OPTIONS,
  ESSAY_KIND_OPTIONS,
  ESSAY_SCORING_MODE_OPTIONS,
  ESSAY_STATUS_OPTIONS,
  STATUS_OPTIONS,
} from '../../../state/schema.js';
import { calculateCebraspeEssayScore } from '../../../domain/exams/essay-scoring.js';
import { Dialog } from '../../primitives/dialog.js';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';
import { formatPlanMinutes } from '../../../core/format-duration.js';
import type { DraftOverloadPreview } from '../../../domain/calendar/calendar-projection.js';

export interface CalendarActivityDraft {
  id?: string | null;
  title: string;
  kind: CalendarActivityKind;
  date: string;
  status: string;
  startTime: string;
  endTime: string;
  estimatedMinutes: string;
  recurrence: CalendarRecurrenceRule;
  subjectId: string;
  topicId?: string;
  location: string;
  externalUrl: string;
  description: string;
  essayTheme: string;
  essayKind?: EssayKind;
  essayScoringMode?: EssayScoringMode;
  essayLinesWritten?: string;
  essayGrammarErrors?: string;
  essayErrorWeight?: string;
  essayScore: string;
  essayMaxScore: string;
  essayStatus: 'draft' | 'written' | 'graded';
  essayContent: string;
  essayStructure: string;
  essayLanguage: string;
}

export interface CalendarActivityModalProps {
  open: boolean;
  isNew: boolean;
  initialDraft: CalendarActivityDraft | null;
  subjects: Array<{ id: string; name: string; topics?: Array<{ id: string; name: string }> }>;
  getDayLoadPreview?: (draft: CalendarActivityDraft) => DraftOverloadPreview;
  onSave: (draft: CalendarActivityDraft) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const EMPTY_DRAFT: CalendarActivityDraft = {
  id: null,
  title: '',
  kind: 'task',
  date: '',
  status: 'Não iniciado',
  startTime: '',
  endTime: '',
  estimatedMinutes: '',
  recurrence: 'none',
  subjectId: '',
  topicId: '',
  location: '',
  externalUrl: '',
  description: '',
  essayTheme: '',
  essayKind: 'redacao',
  essayScoringMode: 'padrao',
  essayLinesWritten: '',
  essayGrammarErrors: '',
  essayErrorWeight: '2',
  essayScore: '',
  essayMaxScore: '',
  essayStatus: 'draft',
  essayContent: '',
  essayStructure: '',
  essayLanguage: '',
};

const LABEL_CLASS =
  'block text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary mb-1';
const CONTROL_CLASS =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand/40';

export function CalendarActivityModal({
  open,
  isNew,
  initialDraft,
  subjects,
  getDayLoadPreview,
  onSave,
  onDelete,
  onClose,
}: CalendarActivityModalProps): JSX.Element {
  const [draft, setDraft] = useState<CalendarActivityDraft>(initialDraft || EMPTY_DRAFT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'title' | 'date' | 'endTime' | null>(null);

  useEffect(() => {
    const next = initialDraft || EMPTY_DRAFT;
    setDraft(next);
    setConfirmDelete(false);
    setError(null);
    setErrorField(null);
    const hasAdvancedData = Boolean(
      next.startTime ||
      next.endTime ||
      next.estimatedMinutes ||
      (next.recurrence && next.recurrence !== 'none') ||
      next.subjectId ||
      next.location ||
      next.externalUrl ||
      next.description ||
      (!isNew && next.status && next.status !== 'Não iniciado')
    );
    setShowAdvanced(hasAdvancedData);
  }, [initialDraft, open, isNew]);

  const updateField = <K extends keyof CalendarActivityDraft>(
    key: K,
    value: CalendarActivityDraft[K]
  ) => {
    setDraft(prev => ({ ...prev, [key]: value }));
    if (error) {
      setError(null);
      setErrorField(null);
    }
  };

  const focusField = (id: string) => {
    if (typeof document !== 'undefined') {
      document.getElementById(id)?.focus();
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Informe um título para a atividade.');
      setErrorField('title');
      focusField('calActivityTitle');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
      setError('Informe uma data válida.');
      setErrorField('date');
      focusField('calActivityDate');
      return;
    }
    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
      setError('O horário de término deve ser posterior ao horário de início.');
      setErrorField('endTime');
      setShowAdvanced(true);
      setTimeout(() => focusField('calActivityEnd'), 0);
      return;
    }
    onSave({
      ...draft,
      title: draft.title.trim(),
    });
  };

  const titlePlaceholder: Record<CalendarActivityKind, string> = {
    task: 'Ex: Resolver 30 questões de Direito Administrativo',
    mock_exam: 'Ex: Simulado Completo #3',
    essay: 'Ex: Redação sobre tecnologia e trabalho',
    event: 'Ex: Dia da prova / Prazo de inscrição',
    manual_review: 'Ex: Revisar Controle de Constitucionalidade',
  };

  const overloadPreview = getDayLoadPreview ? getDayLoadPreview(draft) : null;

  return (
    <Dialog
      id="calendarActivityModal"
      open={open}
      onClose={onClose}
      title={isNew ? 'Nova atividade na Agenda' : 'Editar atividade'}
      description="Cadastre tarefas de estudo, simulados, redações, revisões ou eventos com data."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} class="space-y-4">
        {error && (
          <div
            role="alert"
            class="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
          >
            {error}
          </div>
        )}
        {overloadPreview?.isOverloaded && (
          <div
            role="status"
            class="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content-primary flex items-start gap-2"
          >
            <Icon name="alert-triangle" size={14} class="text-warning shrink-0 mt-0.5" />
            <span>
              Você reservou <strong>{formatPlanMinutes(overloadPreview.projectedMinutes)}</strong>{' '}
              para atividades neste dia, mas sua disponibilidade configurada é de{' '}
              <strong>{formatPlanMinutes(overloadPreview.availableMinutes)}</strong>. Você pode
              ajustar a duração, escolher outra data ou salvar mesmo assim.
            </span>
          </div>
        )}

        <div class="space-y-3">
          <div>
            <label for="calActivityTitle" class={LABEL_CLASS}>
              Título
            </label>
            <input
              id="calActivityTitle"
              type="text"
              required
              aria-invalid={errorField === 'title'}
              placeholder={titlePlaceholder[draft.kind] || titlePlaceholder.task}
              value={draft.title}
              onInput={e => updateField('title', (e.currentTarget as HTMLInputElement).value)}
              class={CONTROL_CLASS}
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="calActivityKind" class={LABEL_CLASS}>
                Tipo
              </label>
              <select
                id="calActivityKind"
                value={draft.kind}
                onChange={e =>
                  updateField(
                    'kind',
                    (e.currentTarget as HTMLSelectElement).value as CalendarActivityKind
                  )
                }
                class={CONTROL_CLASS}
              >
                {CALENDAR_ACTIVITY_KINDS.map(kind => (
                  <option key={kind} value={kind}>
                    {CALENDAR_ACTIVITY_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label for="calActivityDate" class={LABEL_CLASS}>
                Data
              </label>
              <input
                id="calActivityDate"
                type="date"
                required
                aria-invalid={errorField === 'date'}
                value={draft.date}
                onChange={e => updateField('date', (e.currentTarget as HTMLInputElement).value)}
                class={`${CONTROL_CLASS} font-mono tabular-nums`}
              />
            </div>
          </div>
        </div>

        {draft.kind === 'essay' && (
          <div class="rounded-lg border border-border bg-surface-elevated p-3 space-y-3">
            <div class="text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary">
              Dados da redação / discursiva
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="calEssayKind" class={LABEL_CLASS}>
                  Modalidade
                </label>
                <select
                  id="calEssayKind"
                  value={draft.essayKind || 'redacao'}
                  onChange={e =>
                    updateField('essayKind', (e.currentTarget as HTMLSelectElement).value as EssayKind)
                  }
                  class={CONTROL_CLASS}
                >
                  {ESSAY_KIND_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label for="calEssayScoringMode" class={LABEL_CLASS}>
                  Critério gramatical
                </label>
                <select
                  id="calEssayScoringMode"
                  value={draft.essayScoringMode || 'padrao'}
                  onChange={e =>
                    updateField(
                      'essayScoringMode',
                      (e.currentTarget as HTMLSelectElement).value as EssayScoringMode
                    )
                  }
                  class={CONTROL_CLASS}
                >
                  {ESSAY_SCORING_MODE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="calEssaySubject" class={LABEL_CLASS}>
                  Disciplina (opcional)
                </label>
                <select
                  id="calEssaySubject"
                  value={draft.subjectId}
                  onChange={e => {
                    const nextSub = (e.currentTarget as HTMLSelectElement).value;
                    setDraft(prev => ({ ...prev, subjectId: nextSub, topicId: '' }));
                  }}
                  class={CONTROL_CLASS}
                >
                  <option value="">Sem disciplina específica</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label for="calEssayTopic" class={LABEL_CLASS}>
                  Tópico (opcional)
                </label>
                <select
                  id="calEssayTopic"
                  value={draft.topicId || ''}
                  onChange={e =>
                    updateField('topicId', (e.currentTarget as HTMLSelectElement).value)
                  }
                  class={CONTROL_CLASS}
                >
                  <option value="">Sem tópico específico</option>
                  {(subjects.find(s => s.id === draft.subjectId)?.topics || []).map(top => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label for="calEssayTheme" class={LABEL_CLASS}>
                Tema / Questão
              </label>
              <input
                id="calEssayTheme"
                type="text"
                placeholder="Ex: Desafios da segurança pública digital no Brasil"
                value={draft.essayTheme || ''}
                onInput={e =>
                  updateField('essayTheme', (e.currentTarget as HTMLInputElement).value)
                }
                class={CONTROL_CLASS}
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label for="calEssayStatus" class={LABEL_CLASS}>
                  Etapa
                </label>
                <select
                  id="calEssayStatus"
                  value={draft.essayStatus || 'draft'}
                  onChange={e =>
                    updateField(
                      'essayStatus',
                      (e.currentTarget as HTMLSelectElement).value as 'draft' | 'written' | 'graded'
                    )
                  }
                  class={CONTROL_CLASS}
                >
                  {ESSAY_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label for="calEssayScore" class={LABEL_CLASS}>
                  {draft.essayScoringMode === 'cebraspe_linhas'
                    ? 'Nota de conteúdo (NC)'
                    : 'Nota obtida'}
                </label>
                <input
                  id="calEssayScore"
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="Ex: 18"
                  value={draft.essayScore || ''}
                  onInput={e =>
                    updateField('essayScore', (e.currentTarget as HTMLInputElement).value)
                  }
                  class={`${CONTROL_CLASS} font-mono tabular-nums`}
                />
              </div>
              <div>
                <label for="calEssayMaxScore" class={LABEL_CLASS}>
                  Nota máxima
                </label>
                <input
                  id="calEssayMaxScore"
                  type="number"
                  min={1}
                  step="1"
                  placeholder="Ex: 20"
                  value={draft.essayMaxScore || ''}
                  onInput={e =>
                    updateField('essayMaxScore', (e.currentTarget as HTMLInputElement).value)
                  }
                  class={`${CONTROL_CLASS} font-mono tabular-nums`}
                />
              </div>
            </div>
            {draft.essayScoringMode === 'cebraspe_linhas' && (
              <div class="rounded border border-border-subtle bg-surface-subtle p-2.5 space-y-2">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label for="calEssayLinesWritten" class={LABEL_CLASS}>
                      Linhas escritas (TL)
                    </label>
                    <input
                      id="calEssayLinesWritten"
                      type="number"
                      min={1}
                      max={120}
                      step="1"
                      placeholder="Ex: 30"
                      value={draft.essayLinesWritten || ''}
                      onInput={e =>
                        updateField(
                          'essayLinesWritten',
                          (e.currentTarget as HTMLInputElement).value
                        )
                      }
                      class={`${CONTROL_CLASS} font-mono tabular-nums`}
                    />
                  </div>
                  <div>
                    <label for="calEssayGrammarErrors" class={LABEL_CLASS}>
                      Erros gramaticais (NE)
                    </label>
                    <input
                      id="calEssayGrammarErrors"
                      type="number"
                      min={0}
                      step="1"
                      placeholder="Ex: 6"
                      value={draft.essayGrammarErrors || ''}
                      onInput={e =>
                        updateField(
                          'essayGrammarErrors',
                          (e.currentTarget as HTMLInputElement).value
                        )
                      }
                      class={`${CONTROL_CLASS} font-mono tabular-nums`}
                    />
                  </div>
                  <div>
                    <label for="calEssayErrorWeight" class={LABEL_CLASS}>
                      Peso do erro (w)
                    </label>
                    <input
                      id="calEssayErrorWeight"
                      type="number"
                      min={0.5}
                      step="0.5"
                      placeholder="2"
                      value={draft.essayErrorWeight || ''}
                      onInput={e =>
                        updateField(
                          'essayErrorWeight',
                          (e.currentTarget as HTMLInputElement).value
                        )
                      }
                      class={`${CONTROL_CLASS} font-mono tabular-nums`}
                    />
                  </div>
                </div>
                {Number(draft.essayLinesWritten) > 0 && draft.essayScore !== '' && (
                  <p
                    class="text-xs text-content-primary m-0"
                    role="status"
                    data-testid="cebraspe-essay-preview"
                  >
                    {(() => {
                      const calc = calculateCebraspeEssayScore({
                        contentScore: Number(draft.essayScore) || 0,
                        maxScore: Number(draft.essayMaxScore) || 20,
                        linesWritten: Number(draft.essayLinesWritten),
                        grammarErrors: Number(draft.essayGrammarErrors) || 0,
                        errorWeight: Number(draft.essayErrorWeight) || 2,
                      });
                      return `Desconto gramatical: −${calc.deduction} (${calc.errorsPerLine} erros/linha) · Nota líquida final: ${calc.netScore}/${calc.maxScore} (${calc.netPercent}%)`;
                    })()}
                  </p>
                )}
              </div>
            )}
            <fieldset class="grid grid-cols-1 sm:grid-cols-3 gap-3 border-0 p-0 m-0 min-w-0">
              <legend class={`${LABEL_CLASS} col-span-full`}>
                Nota por critério (%), opcional: mostra onde a discursiva perde ponto
              </legend>
              {ESSAY_CRITERIA.map(({ key, label }) => {
                const field = (
                  {
                    content: 'essayContent',
                    structure: 'essayStructure',
                    language: 'essayLanguage',
                  } as const
                )[key];
                return (
                  <div key={key}>
                    <label for={`calEssay-${key}`} class={LABEL_CLASS}>
                      {label}
                    </label>
                    <input
                      id={`calEssay-${key}`}
                      type="number"
                      min={0}
                      max={100}
                      step="1"
                      value={draft[field] || ''}
                      onInput={e => updateField(field, (e.currentTarget as HTMLInputElement).value)}
                      class={`${CONTROL_CLASS} font-mono tabular-nums`}
                    />
                  </div>
                );
              })}
            </fieldset>
          </div>
        )}

        <div class="border-t border-border pt-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced(prev => !prev)}
          >
            <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} />
            <span>
              {showAdvanced
                ? 'Ocultar detalhes opcionais'
                : 'Mais detalhes (horário, duração, disciplina, local)'}
            </span>
          </button>

          {showAdvanced && (
            <div class="mt-3 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label for="calActivityStart" class={LABEL_CLASS}>
                    Início
                  </label>
                  <input
                    id="calActivityStart"
                    type="time"
                    value={draft.startTime}
                    onChange={e =>
                      updateField('startTime', (e.currentTarget as HTMLInputElement).value)
                    }
                    class={`${CONTROL_CLASS} font-mono tabular-nums`}
                  />
                </div>
                <div>
                  <label for="calActivityEnd" class={LABEL_CLASS}>
                    Término
                  </label>
                  <input
                    id="calActivityEnd"
                    type="time"
                    aria-invalid={errorField === 'endTime'}
                    value={draft.endTime}
                    onChange={e =>
                      updateField('endTime', (e.currentTarget as HTMLInputElement).value)
                    }
                    class={`${CONTROL_CLASS} font-mono tabular-nums`}
                  />
                </div>
                <div>
                  <label for="calActivityMinutes" class={LABEL_CLASS}>
                    Duração (min)
                  </label>
                  <input
                    id="calActivityMinutes"
                    type="number"
                    min="0"
                    step="5"
                    placeholder="Ex: 60"
                    value={draft.estimatedMinutes}
                    onInput={e =>
                      updateField('estimatedMinutes', (e.currentTarget as HTMLInputElement).value)
                    }
                    class={`${CONTROL_CLASS} font-mono tabular-nums`}
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="calActivitySubject" class={LABEL_CLASS}>
                    Disciplina
                  </label>
                  <select
                    id="calActivitySubject"
                    value={draft.subjectId}
                    onChange={e =>
                      updateField('subjectId', (e.currentTarget as HTMLSelectElement).value)
                    }
                    class={CONTROL_CLASS}
                  >
                    <option value="">Sem disciplina específica</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label for="calActivityStatus" class={LABEL_CLASS}>
                    Status
                  </label>
                  <select
                    id="calActivityStatus"
                    value={draft.status}
                    onChange={e =>
                      updateField('status', (e.currentTarget as HTMLSelectElement).value)
                    }
                    class={CONTROL_CLASS}
                  >
                    {STATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="calActivityLocation" class={LABEL_CLASS}>
                    Local
                  </label>
                  <input
                    id="calActivityLocation"
                    type="text"
                    placeholder="Ex: Escola Municipal, Sala 12"
                    value={draft.location}
                    onInput={e =>
                      updateField('location', (e.currentTarget as HTMLInputElement).value)
                    }
                    class={CONTROL_CLASS}
                  />
                </div>
                <div>
                  <label for="calActivityUrl" class={LABEL_CLASS}>
                    {draft.kind === 'essay' ? 'Link da proposta / material' : 'Link de referência'}
                  </label>
                  <input
                    id="calActivityUrl"
                    type="url"
                    placeholder="https://..."
                    value={draft.externalUrl}
                    onInput={e =>
                      updateField('externalUrl', (e.currentTarget as HTMLInputElement).value)
                    }
                    class={CONTROL_CLASS}
                  />
                </div>
              </div>

              <div>
                <label for="calActivityRecurrence" class={LABEL_CLASS}>
                  Recorrência
                </label>
                <select
                  id="calActivityRecurrence"
                  value={draft.recurrence || 'none'}
                  onChange={e =>
                    updateField(
                      'recurrence',
                      (e.currentTarget as HTMLSelectElement).value as CalendarRecurrenceRule
                    )
                  }
                  class={CONTROL_CLASS}
                >
                  {CALENDAR_RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label for="calActivityDesc" class={LABEL_CLASS}>
                  Observações
                </label>
                <textarea
                  id="calActivityDesc"
                  rows={2}
                  placeholder="Tema, banca, documentos necessários ou detalhes..."
                  value={draft.description}
                  onInput={e =>
                    updateField('description', (e.currentTarget as HTMLTextAreaElement).value)
                  }
                  class={CONTROL_CLASS}
                />
              </div>
            </div>
          )}
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div>
            {!isNew && draft.id && onDelete && !confirmDelete && (
              <Button
                type="button"
                variant="ghost"
                size="small"
                className="text-danger hover:bg-danger/10 inline-flex items-center gap-1"
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={14} />
                <span>Excluir</span>
              </Button>
            )}
            {!isNew && draft.id && onDelete && confirmDelete && (
              <div class="inline-flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  className="border border-danger bg-surface text-danger hover:bg-danger/10"
                  onClick={() => onDelete(draft.id!)}
                >
                  Confirmar exclusão
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={() => setConfirmDelete(false)}
                >
                  Manter
                </Button>
              </div>
            )}
          </div>
          <div class="flex items-center gap-2">
            <Button type="button" variant="ghost" size="small" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="small" className="inline-flex items-center gap-1.5">
              <Icon name="check" size={14} />
              <span>{isNew ? 'Adicionar atividade' : 'Salvar alterações'}</span>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
