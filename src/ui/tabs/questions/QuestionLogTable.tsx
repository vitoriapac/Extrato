import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';

export interface QuestionItem {
  id: string;
  date?: string;
  subjectId?: string | null;
  topicId?: string | null;
  resolved: number;
  correct: number;
  errorBreakdown?: Record<string, number>;
  recommendationId?: string | null;
  createdAt?: string;
}

export interface QuestionViewModel {
  date: string;
  subject: string;
  topic: string;
  resolved: number;
  correct: number;
  accuracy: number;
  errors: number;
}

export interface QuestionLogTableProps {
  questions: QuestionItem[];
  visibleLimit: number;
  editingId?: string | null;
  draft?: any;
  openErrorIds: Set<string>;
  isMobile?: boolean;
  errorCategories: Record<string, { icon: string; label: string }>;
  getViewModel: (q: QuestionItem) => QuestionViewModel;
  getCategorizedErrors: (q: QuestionItem) => number;
  getSubjectColorSlot?: (subjectId?: string | null) => number;
  subjectOptionsHtml?: string;
  topicOptionsHtml?: string;
  footerHtml?: string;
}

export function QuestionLogTable({
  questions,
  visibleLimit,
  editingId,
  draft,
  openErrorIds,
  isMobile = false,
  errorCategories,
  getViewModel,
  getCategorizedErrors,
  getSubjectColorSlot,
  subjectOptionsHtml = '',
  topicOptionsHtml = '',
  footerHtml = '',
}: QuestionLogTableProps): JSX.Element {
  if (questions.length === 0) {
    return (
      <tr>
        <td colSpan={8}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p class="font-medium text-content-primary m-0">Nenhuma sessão de questões registrada ainda.</p>
            <p class="text-xs text-content-secondary max-w-md mx-auto leading-relaxed mt-1 mb-3">
              Cadastre os acertos e erros das baterias feitas nos seus bancos favoritos (QConcursos, Tec, Gran) para calibrar seu índice de prontidão e mapa de lacunas.
            </p>
            <button type="button" class="btn ghost small inline-flex items-center gap-2" data-delegated-click="addQuestaoRow()">
              <Icon name="plus" size={14} class="icon-inline" />
              <span>Registrar sessão</span>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const visibleQuestions = questions.slice(0, visibleLimit);

  return (
    <>
      {visibleQuestions.map(q => {
        const isEditing = editingId === q.id;

        if (isEditing && draft) {
          return (
            <tr key={q.id} class="row-editing" data-id={q.id}>
              <td colSpan={8}>
                <div class="inline-edit-form">
                  <label>
                    Data
                    <input
                      type="date"
                      value={draft.date || ''}
                      data-delegated-change="updateQuestionDraft('date',this.value)"
                    />
                  </label>
                  <label>
                    Disciplina
                    <select
                      data-delegated-change="updateQuestionDraft('subjectId',this.value||null)"
                      dangerouslySetInnerHTML={{
                        __html: `<option value="">Sem disciplina</option>${subjectOptionsHtml}`,
                      }}
                    />
                  </label>
                  <label>
                    Tópico
                    <select
                      data-delegated-change="updateQuestionDraft('topicId',this.value||null)"
                      dangerouslySetInnerHTML={{
                        __html: `<option value="">Sem tópico</option>${topicOptionsHtml}`,
                      }}
                    />
                  </label>
                  <div class="stepper-field">
                    <label for="questionDraft-resolved">Resolvidas</label>
                    <div class="number-stepper">
                      <button
                        type="button"
                        class="btn ghost small"
                        aria-label="Resolvidas: menos uma"
                        data-delegated-click="stepQuestionDraft('resolved',-1)"
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <input
                        id="questionDraft-resolved"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={Number(draft.resolved) || 0}
                        data-delegated-input="updateQuestionDraft('resolved',this.value)"
                      />
                      <button
                        type="button"
                        class="btn ghost small"
                        aria-label="Resolvidas: mais uma"
                        data-delegated-click="stepQuestionDraft('resolved',1)"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  </div>
                  <div class="stepper-field">
                    <label for="questionDraft-correct">Acertos</label>
                    <div class="number-stepper">
                      <button
                        type="button"
                        class="btn ghost small"
                        aria-label="Acertos: menos uma"
                        data-delegated-click="stepQuestionDraft('correct',-1)"
                      >
                        <Icon name="minus" size={16} />
                      </button>
                      <input
                        id="questionDraft-correct"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max={Number(draft.resolved) || 0}
                        value={Number(draft.correct) || 0}
                        data-delegated-input="updateQuestionDraft('correct',this.value)"
                      />
                      <button
                        type="button"
                        class="btn ghost small"
                        aria-label="Acertos: mais uma"
                        data-delegated-click="stepQuestionDraft('correct',1)"
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>
                  </div>
                  <div class="inline-edit-actions">
                    <button
                      type="button"
                      class="btn ghost small"
                      data-delegated-click="cancelQuestionEdit()"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="btn small"
                      data-delegated-click="saveQuestionEdit()"
                    >
                      Salvar alterações
                    </button>
                    <button
                      type="button"
                      class="btn ghost small"
                      data-delegated-click={`deleteQuestaoRow('${q.id}')`}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          );
        }

        const vm = getViewModel(q);
        const categorized = getCategorizedErrors(q);
        const expanded = openErrorIds.has(q.id);

        const errorToggle = (
          <button
            type="button"
            class="error-toggle-btn"
            aria-expanded={expanded}
            aria-label={`${categorized} de ${vm.errors} erros categorizados: ${vm.subject}, ${vm.topic}, ${vm.date}`}
            data-delegated-click={`toggleQuestionErrors('${q.id}')`}
          >
            {categorized}/{vm.errors} categorizados
          </button>
        );

        const colorSlot = getSubjectColorSlot ? getSubjectColorSlot(q.subjectId) : null;

        return (
          <>
            {isMobile ? (
              <tr key={q.id} class="mobile-history-row" data-id={q.id}>
                <td colSpan={8}>
                  <article class="mobile-history-card">
                    <div class="mobile-card-head">
                      <div>
                        <div class="mobile-card-date">{vm.date}</div>
                        <div class="mobile-card-title flex items-center gap-2">
                          {colorSlot && (
                            <span
                              class={`w-2 h-2 rounded-full inline-block flex-shrink-0 subject-bg-${colorSlot}`}
                              aria-hidden="true"
                            />
                          )}
                          <span>{vm.subject}</span>
                        </div>
                        <div class="mobile-card-subtitle">{vm.topic}</div>
                      </div>
                      <button
                        type="button"
                        class="btn ghost small"
                        data-delegated-click={`editQuestion('${q.id}')`}
                        aria-label={`Editar registro: ${vm.subject}, ${vm.topic}, ${vm.date}`}
                      >
                        Editar
                      </button>
                    </div>
                    <div class="mobile-card-metrics">
                      <span>{vm.resolved} questões</span>
                      <span>{vm.correct} acertos</span>
                      <strong>{vm.accuracy}%</strong>
                      {errorToggle}
                    </div>
                  </article>
                </td>
              </tr>
            ) : (
              <tr key={q.id} class="history-read-row history-desktop-row" data-id={q.id}>
                <td>{vm.date}</td>
                <td>
                  <div class="row-primary flex items-center gap-2">
                    {colorSlot && (
                      <span
                        class={`w-2 h-2 rounded-full inline-block flex-shrink-0 subject-bg-${colorSlot}`}
                        aria-hidden="true"
                      />
                    )}
                    <span>{vm.subject}</span>
                  </div>
                </td>
                <td>
                  <div class="row-secondary">{vm.topic}</div>
                </td>
                <td class="number-cell">{vm.resolved}</td>
                <td class="number-cell">{vm.correct}</td>
                <td class="number-cell">{vm.accuracy}%</td>
                <td>{errorToggle}</td>
                <td>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="btn ghost small"
                      data-delegated-click={`editQuestion('${q.id}')`}
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {expanded && (
              <tr key={`${q.id}-errors`} class="error-breakdown-row">
                <td colSpan={8}>
                  <div class="error-breakdown-box">
                    <div class="error-breakdown-head">
                      <strong>Categorização opcional dos erros</strong>
                      <span>
                        {categorized} de {vm.errors} erros categorizados
                      </span>
                    </div>
                    <div class="error-breakdown-grid">
                      {Object.entries(errorCategories).map(([key, meta]) => (
                        <label key={key} class="error-breakdown-field">
                          <span>
                            {meta.icon} {meta.label}
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={vm.errors}
                            value={q.errorBreakdown?.[key] || 0}
                            data-delegated-blur={`updateQuestionError('${q.id}','${key}',this.value)`}
                          />
                        </label>
                      ))}
                    </div>
                    <small>
                      As categorias não alteram a taxa de acerto; servem para diagnosticar a origem
                      dos erros.
                    </small>
                  </div>
                </td>
              </tr>
            )}
          </>
        );
      })}

      {footerHtml && <tr dangerouslySetInnerHTML={{ __html: footerHtml }} />}
    </>
  );
}
