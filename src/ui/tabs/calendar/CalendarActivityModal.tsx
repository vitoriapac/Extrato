import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { CalendarActivityKind, CalendarRecurrenceRule } from '../../../core/types.js';
import {
  CALENDAR_ACTIVITY_KINDS,
  CALENDAR_ACTIVITY_LABELS,
  CALENDAR_RECURRENCE_OPTIONS,
  STATUS_OPTIONS,
} from '../../../state/schema.js';
import { Dialog } from '../../primitives/dialog.js';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';

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
  location: string;
  externalUrl: string;
  description: string;
}

export interface CalendarActivityModalProps {
  open: boolean;
  isNew: boolean;
  initialDraft: CalendarActivityDraft | null;
  subjects: Array<{ id: string; name: string }>;
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
  location: '',
  externalUrl: '',
  description: '',
};

export function CalendarActivityModal({
  open,
  isNew,
  initialDraft,
  subjects,
  onSave,
  onDelete,
  onClose,
}: CalendarActivityModalProps): JSX.Element {
  const [draft, setDraft] = useState<CalendarActivityDraft>(initialDraft || EMPTY_DRAFT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = initialDraft || EMPTY_DRAFT;
    setDraft(next);
    setConfirmDelete(false);
    setError(null);
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
    if (error) setError(null);
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError('Informe um título para a atividade.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
      setError('Informe uma data válida.');
      return;
    }
    if (draft.startTime && draft.endTime && draft.endTime <= draft.startTime) {
      setError('O horário de término deve ser posterior ao horário de início.');
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

        <div class="space-y-3">
          <div>
            <label
              for="calActivityTitle"
              class="block text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary mb-1"
            >
              Título
            </label>
            <input
              id="calActivityTitle"
              type="text"
              required
              placeholder={titlePlaceholder[draft.kind] || titlePlaceholder.task}
              value={draft.title}
              onInput={e => updateField('title', (e.currentTarget as HTMLInputElement).value)}
              class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                for="calActivityKind"
                class="block text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary mb-1"
              >
                Tipo
              </label>
              <select
                id="calActivityKind"
                value={draft.kind}
                onChange={e =>
                  updateField('kind', (e.currentTarget as HTMLSelectElement).value as CalendarActivityKind)
                }
                class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {CALENDAR_ACTIVITY_KINDS.map(kind => (
                  <option key={kind} value={kind}>
                    {CALENDAR_ACTIVITY_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                for="calActivityDate"
                class="block text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary mb-1"
              >
                Data
              </label>
              <input
                id="calActivityDate"
                type="date"
                required
                value={draft.date}
                onChange={e => updateField('date', (e.currentTarget as HTMLInputElement).value)}
                class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-mono tabular-nums text-content-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
          </div>
        </div>

        <div class="border-t border-border pt-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary hover:text-content-primary"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced(prev => !prev)}
          >
            <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} />
            <span>{showAdvanced ? 'Ocultar detalhes opcionais' : 'Mais detalhes (horário, duração, disciplina, local)'}</span>
          </button>

          {showAdvanced && (
            <div class="mt-3 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label for="calActivityStart" class="block text-xs font-medium text-content-secondary mb-1">
                    Início
                  </label>
                  <input
                    id="calActivityStart"
                    type="time"
                    value={draft.startTime}
                    onChange={e => updateField('startTime', (e.currentTarget as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
                  />
                </div>
                <div>
                  <label for="calActivityEnd" class="block text-xs font-medium text-content-secondary mb-1">
                    Término
                  </label>
                  <input
                    id="calActivityEnd"
                    type="time"
                    value={draft.endTime}
                    onChange={e => updateField('endTime', (e.currentTarget as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
                  />
                </div>
                <div>
                  <label for="calActivityMinutes" class="block text-xs font-medium text-content-secondary mb-1">
                    Duração (min)
                  </label>
                  <input
                    id="calActivityMinutes"
                    type="number"
                    min="0"
                    step="5"
                    placeholder="Ex: 60"
                    value={draft.estimatedMinutes}
                    onInput={e => updateField('estimatedMinutes', (e.currentTarget as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="calActivitySubject" class="block text-xs font-medium text-content-secondary mb-1">
                    Disciplina
                  </label>
                  <select
                    id="calActivitySubject"
                    value={draft.subjectId}
                    onChange={e => updateField('subjectId', (e.currentTarget as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
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
                  <label for="calActivityStatus" class="block text-xs font-medium text-content-secondary mb-1">
                    Status
                  </label>
                  <select
                    id="calActivityStatus"
                    value={draft.status}
                    onChange={e => updateField('status', (e.currentTarget as HTMLSelectElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
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
                  <label for="calActivityLocation" class="block text-xs font-medium text-content-secondary mb-1">
                    Local
                  </label>
                  <input
                    id="calActivityLocation"
                    type="text"
                    placeholder="Ex: Escola Municipal, Sala 12"
                    value={draft.location}
                    onInput={e => updateField('location', (e.currentTarget as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
                  />
                </div>
                <div>
                  <label for="calActivityUrl" class="block text-xs font-medium text-content-secondary mb-1">
                    Link de referência
                  </label>
                  <input
                    id="calActivityUrl"
                    type="url"
                    placeholder="https://..."
                    value={draft.externalUrl}
                    onInput={e => updateField('externalUrl', (e.currentTarget as HTMLInputElement).value)}
                    class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
                  />
                </div>
              </div>

              <div>
                <label for="calActivityRecurrence" class="block text-xs font-medium text-content-secondary mb-1">
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
                  class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
                >
                  {CALENDAR_RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label for="calActivityDesc" class="block text-xs font-medium text-content-secondary mb-1">
                  Observações
                </label>
                <textarea
                  id="calActivityDesc"
                  rows={2}
                  placeholder="Tema, banca, documentos necessários ou detalhes..."
                  value={draft.description}
                  onInput={e => updateField('description', (e.currentTarget as HTMLTextAreaElement).value)}
                  class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content-primary"
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
                  size="small"
                  className="bg-danger text-on-brand hover:opacity-90"
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
