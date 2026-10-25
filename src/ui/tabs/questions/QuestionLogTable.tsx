import type { JSX } from 'preact';

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
  subjectOptionsHtml = '',
  topicOptionsHtml = '',
  footerHtml = '',
}: QuestionLogTableProps): JSX.Element {
  if (questions.length === 0) {
    return (
      <tr>
        <td colSpan={8}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p>Nenhuma sessão de questões registrada ainda.</p>
            <button type="button" class="btn small" data-delegated-click="addQuestaoRow()">
              + Registrar sessão
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
                  <label>
                    Resolvidas
                    <input
                      type="number"
                      min="0"
                      value={Number(draft.resolved) || 0}
                      data-delegated-input="updateQuestionDraft('resolved',this.value)"
                    />
                  </label>
                  <label>
                    Acertos
                    <input
                      type="number"
                      min="0"
                      value={Number(draft.correct) || 0}
                      data-delegated-input="updateQuestionDraft('correct',this.value)"
                    />
                  </label>
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
            data-delegated-click={`toggleQuestionErrors('${q.id}')`}
          >
            {isMobile ? 'Erros ' : ''}
            {categorized}/{vm.errors}
          </button>
        );

        return (
          <>
            {isMobile ? (
              <tr key={q.id} class="mobile-history-row" data-id={q.id}>
                <td colSpan={8}>
                  <article class="mobile-history-card">
                    <div class="mobile-card-head">
                      <div>
                        <div class="mobile-card-date">{vm.date}</div>
                        <div class="mobile-card-title">{vm.subject}</div>
                        <div class="mobile-card-subtitle">{vm.topic}</div>
                      </div>
                      <button
                        type="button"
                        class="btn ghost small"
                        data-delegated-click={`editQuestion('${q.id}')`}
                        aria-label="Editar registro"
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
                  <div class="row-primary">{vm.subject}</div>
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
