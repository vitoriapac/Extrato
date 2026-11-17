import type { JSX } from 'preact';
import { formatDateBR } from '../../core/format-date.js';
import {
  LEARNING_JOURNAL_TAGS,
  LEARNING_JOURNAL_TAG_LABELS,
} from '../../domain/journal/learning-journal-engine.js';
import type { LearningJournalEntry } from '../../core/types.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Card } from '../primitives/card.js';
import { Icon } from '../primitives/icon.js';
import type { JournalFormState } from './TodayStudyAssistantBar.js';

export interface TodayJournalSidebarCardProps {
  subjects: Array<{ id: string; name: string; archived?: boolean; topics?: any[] }>;
  entries: LearningJournalEntry[];
  totalEntriesCount: number;
  filters: {
    subjectId: string;
    tag: string;
    query: string;
  };
  form: JournalFormState;
  formOpen: boolean;
  onToggleForm: (open: boolean) => void;
  onChangeFilter: (patch: Partial<{ subjectId: string; tag: string; query: string }>) => void;
  onChangeForm: (patch: Partial<JournalFormState>) => void;
  onSaveEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  onCreateReviewFromEntry: (entry: LearningJournalEntry) => void;
}

export function TodayJournalSidebarCard(props: TodayJournalSidebarCardProps): JSX.Element {
  const { subjects, entries, totalEntriesCount, filters, form, formOpen } = props;
  const activeSubjects = subjects.filter(s => s && !s.archived);
  const selectedFormSubject = activeSubjects.find(s => s.id === form.subjectId) || null;
  const hasActiveFilters = Boolean(filters.subjectId || filters.tag || filters.query.trim());
  const showFilters = totalEntriesCount > 0 || hasActiveFilters;

  return (
    <Card
      as="section"
      variant="default"
      className="chart-card space-y-4 min-w-0"
      aria-labelledby="todayJournalSidebarTitle"
      data-today-journal-sidebar="true"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <Icon name="book" size={16} class="icon-inline text-accent shrink-0" />
          <h3 id="todayJournalSidebarTitle" class="module-heading__title m-0 text-content-primary">
            Diário de Aprendizagem
          </h3>
          <Badge variant="default" icon={false} className="font-data">
            {totalEntriesCount}
          </Badge>
        </div>

        <Button
          variant="secondary"
          size="small"
          aria-expanded={formOpen}
          onClick={() => props.onToggleForm(!formOpen)}
        >
          <Icon name={formOpen ? 'x' : 'plus'} size={13} class="icon-inline shrink-0" />
          <span>{formOpen ? 'Fechar registro' : 'Registrar aprendizado ou dúvida'}</span>
        </Button>
      </div>

      <p class="m-0 text-xs text-content-secondary">
        Opcional · anotações qualitativas com recorte da sessão sem impacto nas metas.
      </p>

      {formOpen && (
        <div class="pt-4 border-t border-border-subtle space-y-4 text-xs">
          {form.sessionId && (
            <p class="m-0 text-content-primary font-medium">
              Anotação vinculada à sessão selecionada (1 entrada editável por sessão).
            </p>
          )}

          <div class="grid grid-cols-1 gap-2">
            <select
              class="select-control"
              aria-label="Disciplina da anotação lateral do diário"
              value={form.subjectId}
              onChange={e => props.onChangeForm({ subjectId: e.currentTarget.value, topicId: '' })}
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
              aria-label="Tópico da anotação lateral do diário"
              value={form.topicId}
              onChange={e => props.onChangeForm({ topicId: e.currentTarget.value })}
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

          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Etiquetas do diário">
            {LEARNING_JOURNAL_TAGS.map(tag => {
              const selected = form.tags.includes(tag);
              return (
                <Button
                  key={tag}
                  variant={selected ? 'tonal' : 'secondary'}
                  size="small"
                  aria-pressed={selected}
                  onClick={() =>
                    props.onChangeForm({
                      tags: selected ? form.tags.filter(t => t !== tag) : [...form.tags, tag],
                    })
                  }
                >
                  {LEARNING_JOURNAL_TAG_LABELS[tag]}
                </Button>
              );
            })}
          </div>

          <textarea
            class="select-control w-full"
            rows={2}
            maxLength={1000}
            aria-label="O que aprendeu, dúvida ou pegadinha"
            placeholder="O que aprendeu, dúvida ou pegadinha (até 1.000 caracteres)..."
            value={form.note}
            onInput={e => props.onChangeForm({ note: e.currentTarget.value })}
          />

          <details class="text-xs">
            <summary class="cursor-pointer text-content-secondary font-medium py-1">
              Detalhes opcionais (dificuldade, energia, próximo passo)
            </summary>
            <div class="space-y-2 pt-2">
              <div class="grid grid-cols-2 gap-2">
                <select
                  class="select-control"
                  aria-label="Dificuldade percebida no registro"
                  value={form.difficultyRating}
                  onChange={e =>
                    props.onChangeForm({ difficultyRating: e.currentTarget.value as any })
                  }
                >
                  <option value="">Dificuldade</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Média</option>
                  <option value="hard">Difícil</option>
                </select>

                <select
                  class="select-control"
                  aria-label="Energia percebida no registro"
                  value={form.energyRating}
                  onChange={e =>
                    props.onChangeForm({ energyRating: e.currentTarget.value as any })
                  }
                >
                  <option value="">Energia</option>
                  <option value="high">Alta</option>
                  <option value="normal">Normal</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <input
                type="text"
                class="select-control w-full"
                maxLength={500}
                aria-label="Próximo passo da anotação"
                placeholder="Próximo passo (ex.: revisar Súmula 331)"
                value={form.nextStep}
                onInput={e => props.onChangeForm({ nextStep: e.currentTarget.value })}
              />
            </div>
          </details>

          <div class="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="small" onClick={props.onSaveEntry}>
              <Icon name="check" size={13} class="icon-inline" />
              <span>Salvar no Diário</span>
            </Button>
            <Button variant="ghost" size="small" onClick={() => props.onToggleForm(false)}>
              <span>Cancelar</span>
            </Button>
          </div>
        </div>
      )}

      {showFilters && (
        <div class="pt-3 border-t border-border-subtle grid grid-cols-1 gap-2 text-xs">
          <select
            class="select-control w-full"
            aria-label="Filtrar diário lateral por disciplina"
            value={filters.subjectId}
            onChange={e => props.onChangeFilter({ subjectId: e.currentTarget.value })}
          >
            <option value="">Todas as disciplinas</option>
            {activeSubjects.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <select
            class="select-control w-full"
            aria-label="Filtrar diário lateral por etiqueta"
            value={filters.tag}
            onChange={e => props.onChangeFilter({ tag: e.currentTarget.value })}
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
            class="select-control w-full"
            aria-label="Buscar nas anotações do diário lateral"
            placeholder="Buscar por disciplina, assunto ou etiqueta..."
            value={filters.query}
            onInput={e => props.onChangeFilter({ query: e.currentTarget.value })}
          />
        </div>
      )}

      {entries.length === 0 ? (
        <div class="space-y-2 text-xs text-content-secondary">
          <p class="m-0">
            {hasActiveFilters
              ? 'Nenhuma anotação visível para o filtro atual.'
              : 'Nenhuma anotação registrada ainda. Use o botão acima para guardar ideias ou dúvidas.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="tertiary"
              size="small"
              onClick={() => props.onChangeFilter({ subjectId: '', tag: '', query: '' })}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <ul class="m-0 p-0 list-none max-h-64 overflow-y-auto divide-y divide-border-subtle border-t border-border-subtle">
          {entries.slice(0, 8).map(entry => (
            <li key={entry.id} class="py-2 text-xs space-y-2">
              <div class="flex items-start justify-between gap-2">
                <span class="font-medium text-content-primary leading-snug">
                  <span class="font-data">{formatDateBR(entry.localDate)}</span> ·{' '}
                  {entry.subjectNameSnapshot || 'Estudo livre'}
                  {entry.topicNameSnapshot ? ` — ${entry.topicNameSnapshot}` : ''}
                </span>
                <div class="flex items-center gap-1 shrink-0">
                  {entry.topicId &&
                    (entry.tags.includes('duvida') ||
                      entry.tags.includes('revisar') ||
                      entry.tags.includes('pegadinha')) && (
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => props.onCreateReviewFromEntry(entry)}
                      >
                        <span>Transformar em revisão</span>
                      </Button>
                    )}
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label="Excluir anotação do diário lateral"
                    onClick={() => props.onDeleteEntry(entry.id)}
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
                <div class="flex flex-wrap gap-2">
                  {entry.tags.map(t => (
                    <span key={t} class="status-pill status-pill--default px-2 py-0.5 rounded">
                      {LEARNING_JOURNAL_TAG_LABELS[t] || t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
