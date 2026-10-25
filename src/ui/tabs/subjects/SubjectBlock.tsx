import type { JSX } from 'preact';
import { SubjectTopicRow } from './SubjectTopicRow.js';

export interface SubjectBlockProps {
  subject: any;
  index: number;
  totalSubjects: number;
  progressPercent: number;
  subjectTopics: any[];
  visibleTopics: any[];
  allVisibleTopicsCount: number;
  archivedTopics: any[];
  collapsed: boolean;
  topicFilter: { status: string; difficulty: string };
  openNotesIds: Set<string>;
  statusOptions: readonly string[];
  statusClasses: Record<string, string>;
  difficultyOptions: readonly string[];
  difficultyClasses: Record<string, string>;
  searchQuery?: string;
  footerHtml?: string;
  getExamBadgesHtml?: (topic: any) => string;
  getAnalyticsStateHtml?: (subject: any, topic: any) => string;
  getStrategyEditorHtml?: (subject: any, topic: any) => string;
}

export function SubjectBlock({
  subject,
  index,
  totalSubjects,
  progressPercent,
  subjectTopics,
  visibleTopics,
  allVisibleTopicsCount,
  archivedTopics,
  collapsed,
  topicFilter,
  openNotesIds,
  statusOptions,
  statusClasses,
  difficultyOptions,
  difficultyClasses,
  searchQuery = '',
  footerHtml = '',
  getExamBadgesHtml,
  getAnalyticsStateHtml,
  getStrategyEditorHtml,
}: SubjectBlockProps) {
  const isFirst = index === 0;
  const isLast = index === totalSubjects - 1;

  return (
    <div class="subject-block" data-subject-id={subject.id}>
      <div class="subject-header" data-delegated-click={`toggleSubject('${subject.id}')`}>
        <div class="subject-header-left">
          <div class="subject-order-btns" data-delegated-click="event.stopPropagation()">
            <button
              type="button"
              class="icon-btn-nav"
              data-delegated-click={`moveSubject('${subject.id}', -1)`}
              disabled={isFirst}
              title="Mover para cima"
              aria-label={`Mover ${subject.name} para cima`}
            >
              ▲
            </button>
            <button
              type="button"
              class="icon-btn-nav"
              data-delegated-click={`moveSubject('${subject.id}', 1)`}
              disabled={isLast}
              title="Mover para baixo"
              aria-label={`Mover ${subject.name} para baixo`}
            >
              ▼
            </button>
          </div>
          <button
            type="button"
            class="subject-toggle btn ghost small"
            aria-expanded={!collapsed}
            disabled={Boolean(searchQuery)}
            title={searchQuery ? 'A busca mantém os resultados abertos' : undefined}
            aria-controls={`subject-body-${subject.id}`}
            aria-label={`Expandir ou recolher ${subject.name}`}
            data-delegated-click={`event.stopPropagation();toggleSubject('${subject.id}')`}
          >
            {collapsed ? '▸' : '▾'}
          </button>
          <span
            class="subject-name"
            contentEditable={true}
            data-delegated-click="event.stopPropagation()"
            data-delegated-blur={`renameSubject('${subject.id}', this.textContent)`}
          >
            {subject.name}
          </span>
        </div>
        <div class="subject-header-actions">
          <span class="subject-progress-pill">
            {progressPercent}% · {allVisibleTopicsCount} de {subjectTopics.length} tópico
            {subjectTopics.length === 1 ? '' : 's'}
          </span>
          <details
            class="action-menu subject-action-menu"
            data-delegated-click="event.stopPropagation()"
          >
            <summary
              class="btn ghost small"
              aria-label={`Ações de ${subject.name}`}
              data-delegated-click="event.stopPropagation()"
            >
              ⋯
            </summary>
            <div class="action-menu__items">
              <button
                type="button"
                data-delegated-click={`event.stopPropagation();duplicateSubject('${subject.id}')`}
              >
                Duplicar disciplina
              </button>
              <button
                type="button"
                data-delegated-click={`event.stopPropagation();archiveSubject('${subject.id}')`}
              >
                Arquivar disciplina
              </button>
              <span class="action-menu__hint">
                Para excluir definitivamente, arquive primeiro e use a seção de disciplinas
                arquivadas.
              </span>
            </div>
          </details>
        </div>
      </div>

      <div id={`subject-body-${subject.id}`} class={`subject-body ${collapsed ? 'collapsed' : ''}`}>
        <div class="subject-topic-filters">
          <select
            aria-label={`Filtrar tópicos de ${subject.name} por status`}
            data-delegated-change={`setSubjectTopicFilter('${subject.id}','status',this.value)`}
          >
            <option value="">Todos os status</option>
            {statusOptions.map(opt => (
              <option key={opt} value={opt} selected={topicFilter.status === opt}>
                {opt}
              </option>
            ))}
          </select>
          <select
            aria-label={`Filtrar tópicos de ${subject.name} por dificuldade`}
            data-delegated-change={`setSubjectTopicFilter('${subject.id}','difficulty',this.value)`}
          >
            <option value="">Todas as dificuldades</option>
            {difficultyOptions.map(opt => (
              <option key={opt} value={opt} selected={topicFilter.difficulty === opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div class="ledger-scroll">
          <table class="ledger">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Tópico</th>
                <th style={{ width: '15%' }}>Link / material</th>
                <th style={{ width: '13%' }}>Status</th>
                <th style={{ width: '13%' }}>Dificuldade</th>
                <th style={{ width: '9%' }}>Notas</th>
                <th style={{ width: '6%' }}>
                  <span class="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTopics.map(topic => (
                <SubjectTopicRow
                  key={topic.id}
                  subjectId={subject.id}
                  topic={topic}
                  isOpenNotes={openNotesIds.has(topic.id)}
                  statusOptions={statusOptions}
                  statusClasses={statusClasses}
                  difficultyOptions={difficultyOptions}
                  difficultyClasses={difficultyClasses}
                  examBadgesHtml={getExamBadgesHtml?.(topic)}
                  analyticsStateHtml={getAnalyticsStateHtml?.(subject, topic)}
                  strategyEditorHtml={getStrategyEditorHtml?.(subject, topic)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {footerHtml && <div dangerouslySetInnerHTML={{ __html: footerHtml }} />}

        <div class="add-topic-row">
          <button
            type="button"
            class="btn ghost small"
            data-delegated-click={`addTopic('${subject.id}')`}
          >
            + Adicionar tópico
          </button>
        </div>

        {archivedTopics.length > 0 && (
          <div class="archived-section">
            <div class="archived-section-title">Tópicos arquivados</div>
            {archivedTopics.map(t => (
              <div key={t.id} class="archived-item">
                <div>
                  <div class="archived-item-name">{t.name || 'Tópico sem nome'}</div>
                  <div class="archived-item-date">
                    Arquivado em{' '}
                    {t.archivedAt ? new Date(t.archivedAt).toLocaleDateString('pt-BR') : '—'}
                  </div>
                </div>
                <div class="archived-item-actions">
                  <button
                    type="button"
                    class="btn ghost small"
                    data-delegated-click={`restoreTopic('${subject.id}','${t.id}')`}
                  >
                    Restaurar
                  </button>
                  <button
                    type="button"
                    class="btn danger"
                    data-delegated-click={`requestPermanentTopicDelete('${subject.id}','${t.id}')`}
                  >
                    Excluir definitivamente
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
