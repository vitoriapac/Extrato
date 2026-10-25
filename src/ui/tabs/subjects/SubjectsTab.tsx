import type { JSX } from 'preact';
import { SubjectBlock } from './SubjectBlock.js';

export interface SubjectsTabProps {
  subjects: any[];
  archivedSubjects: any[];
  totalActiveSubjectsCount: number;
  searchQuery?: string;
  subjectExamFilter?: string;
  subjectProgressFn: (subject: any) => number;
  subjectTopicFilters: Map<string, { status: string; difficulty: string }>;
  subjectTopicLimits: Map<string, number>;
  openNotesIds: Set<string>;
  statusOptions: readonly string[];
  statusClasses: Record<string, string>;
  difficultyOptions: readonly string[];
  difficultyClasses: Record<string, string>;
  topicMatchesExamFn: (topic: any) => boolean;
  matchesSearchFn: (subject: any, topic: any, query: string) => boolean;
  pluralizeFn: (count: number, singular: string, plural?: string) => string;
  renderFooterFn?: (options: any) => string;
  getExamBadgesHtml?: (topic: any) => string;
  getAnalyticsStateHtml?: (subject: any, topic: any) => string;
  getStrategyEditorHtml?: (subject: any, topic: any) => string;
}

export function SubjectsTab({
  subjects,
  archivedSubjects,
  totalActiveSubjectsCount,
  searchQuery = '',
  subjectExamFilter = 'all',
  subjectProgressFn,
  subjectTopicFilters,
  subjectTopicLimits,
  openNotesIds,
  statusOptions,
  statusClasses,
  difficultyOptions,
  difficultyClasses,
  topicMatchesExamFn,
  matchesSearchFn,
  pluralizeFn,
  renderFooterFn,
  getExamBadgesHtml,
  getAnalyticsStateHtml,
  getStrategyEditorHtml,
}: SubjectsTabProps) {
  // Empty state when completely clean
  if (
    subjects.length === 0 &&
    archivedSubjects.length === 0 &&
    !searchQuery &&
    subjectExamFilter === 'all'
  ) {
    return (
      <div class="empty-state">
        <p>Nenhuma disciplina cadastrada ainda.</p>
        <button type="button" class="btn" data-delegated-click="addSubject()">
          + Adicionar primeira disciplina
        </button>
      </div>
    );
  }

  const EXAM_FILTER_BUTTONS = [
    { value: 'all', label: 'Todos' },
    { value: 'bb', label: 'BB' },
    { value: 'caixa', label: 'Caixa' },
    { value: 'caixa-ti', label: 'Caixa TI' },
    { value: 'common', label: 'Comuns' },
  ] as const;

  return (
    <>
      <div class="subject-search">
        <label for="subjectContentSearch">Buscar disciplina ou tópico</label>
        <input
          type="search"
          id="subjectContentSearch"
          value={searchQuery}
          placeholder="Nome da disciplina ou tópico"
        />
        <p role="status">{subjects.length} disciplinas encontradas.</p>
      </div>

      <div class="exam-scope-filter" role="group" aria-label="Filtrar conteúdo por concurso">
        {EXAM_FILTER_BUTTONS.map(item => (
          <button
            key={item.value}
            type="button"
            class={`btn ghost small ${subjectExamFilter === item.value ? 'active' : ''}`}
            data-delegated-click={`setSubjectExamFilter('${item.value}')`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {subjects.length === 0 ? (
        <div class="empty-state">
          <p>Nenhuma disciplina corresponde à busca e aos filtros atuais.</p>
          <button type="button" class="btn" data-delegated-click="addSubject()">
            + Adicionar disciplina
          </button>
        </div>
      ) : (
        subjects.map((subject, idx) => {
          const progress = subjectProgressFn(subject);
          const subjectTopics = (subject.topics || []).filter(
            (t: any) => !t.archived && topicMatchesExamFn(t)
          );
          const topicFilter = subjectTopicFilters.get(subject.id) || {
            status: '',
            difficulty: '',
          };
          const collapsed = Boolean(subject.collapsed && !searchQuery);
          const allVisibleTopics = subjectTopics.filter(
            (topic: any) =>
              matchesSearchFn(subject, topic, searchQuery) &&
              (!topicFilter.status || topic.status === topicFilter.status) &&
              (!topicFilter.difficulty || topic.difficulty === topicFilter.difficulty)
          );
          const topicLimit = subjectTopicLimits.get(subject.id) || 10;
          const visibleTopics = allVisibleTopics.slice(0, topicLimit);
          const archivedTopics = (subject.topics || []).filter((t: any) => t.archived);

          const footerHtml = renderFooterFn
            ? renderFooterFn({
                variant: 'block',
                total: allVisibleTopics.length,
                visible: visibleTopics.length,
                step: 10,
                label: `tópicos filtrados · ${subjectTopics.length} no total`,
                showMoreAction: `changeSubjectTopicLimit('${subject.id}',10)`,
                showAllAction: `showAllSubjectTopics('${subject.id}')`,
                showLessAction: topicLimit > 10 ? `resetSubjectTopicLimit('${subject.id}')` : '',
              })
            : '';

          return (
            <SubjectBlock
              key={subject.id}
              subject={subject}
              index={idx}
              totalSubjects={subjects.length}
              progressPercent={progress}
              subjectTopics={subjectTopics}
              visibleTopics={visibleTopics}
              allVisibleTopicsCount={allVisibleTopics.length}
              archivedTopics={archivedTopics}
              collapsed={collapsed}
              topicFilter={topicFilter}
              openNotesIds={openNotesIds}
              statusOptions={statusOptions}
              statusClasses={statusClasses}
              difficultyOptions={difficultyOptions}
              difficultyClasses={difficultyClasses}
              searchQuery={searchQuery}
              footerHtml={footerHtml}
              getExamBadgesHtml={getExamBadgesHtml}
              getAnalyticsStateHtml={getAnalyticsStateHtml}
              getStrategyEditorHtml={getStrategyEditorHtml}
            />
          );
        })
      )}

      {archivedSubjects.length > 0 && (
        <div class="archived-section">
          <div class="archived-section-title">Disciplinas arquivadas</div>
          {archivedSubjects.map(s => (
            <div key={s.id} class="archived-item">
              <div>
                <div class="archived-item-name">{s.name}</div>
                <div class="archived-item-date">
                  Arquivada em{' '}
                  {s.archivedAt ? new Date(s.archivedAt).toLocaleDateString('pt-BR') : '—'} ·{' '}
                  {pluralizeFn(s.topics.length, 'tópico')}
                </div>
              </div>
              <div class="archived-item-actions">
                <button
                  type="button"
                  class="btn ghost small"
                  data-delegated-click={`restoreSubject('${s.id}')`}
                >
                  Restaurar
                </button>
                <button
                  type="button"
                  class="btn danger"
                  data-delegated-click={`requestPermanentSubjectDelete('${s.id}')`}
                >
                  Excluir definitivamente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
