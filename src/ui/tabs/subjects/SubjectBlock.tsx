import { SubjectTopicRow } from './SubjectTopicRow.js';
import { Icon } from '../../primitives/icon.js';
import { Sparkline, StackedBar } from '../../primitives/charts/charts.js';
import { SUBJECT_COLOR_NAMES } from '../../../domain/subjects/subject-color.js';

export interface SubjectBlockProps {
  subject: any;
  index: number;
  totalSubjects: number;
  progressPercent: number;
  /** Weekly question accuracy, oldest first; missing when the subject has no recent questions. */
  accuracyTrend?: Array<number | null>;
  /** Palette slot 1–8; the swatch always sits next to the name. */
  colorSlot?: number;
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
  accuracyTrend,
  colorSlot = 1,
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
  const isEmptySubject =
    subjectTopics.length === 0 && !topicFilter.status && !topicFilter.difficulty && !searchQuery;
  const recentAccuracy = [...(accuracyTrend || [])].reverse().find(v => typeof v === 'number');
  const statusCount = (status: string) =>
    subjectTopics.filter((topic: any) => (topic.status || 'Não iniciado') === status).length;

  return (
    <div
      class={`subject-block subject-color-${colorSlot}`}
      data-subject-id={subject.id}
      data-subject-color={colorSlot}
    >
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
              <Icon name="chevron-up" size={14} />
            </button>
            <button
              type="button"
              class="icon-btn-nav"
              data-delegated-click={`moveSubject('${subject.id}', 1)`}
              disabled={isLast}
              title="Mover para baixo"
              aria-label={`Mover ${subject.name} para baixo`}
            >
              <Icon name="chevron-down" size={14} />
            </button>
          </div>
          <span
            class={`subject-color-swatch subject-color-${colorSlot}`}
            aria-hidden="true"
          />
          <span
            class="subject-name"
            contentEditable={true}
            role="textbox"
            aria-label={`Nome da disciplina ${subject.name}`}
            title="Clique para editar o nome da disciplina"
            data-delegated-click="event.stopPropagation()"
            data-delegated-blur={`renameSubject('${subject.id}', this.textContent)`}
          >
            {subject.name}
          </span>
        </div>
        <div class="subject-header-actions">
          <span class="subject-progress-pill">
            {progressPercent}% de progresso · {allVisibleTopicsCount === subjectTopics.length
              ? `${subjectTopics.length} ${subjectTopics.length === 1 ? 'tópico' : 'tópicos'}`
              : `${allVisibleTopicsCount} de ${subjectTopics.length} tópicos filtrados`}
          </span>
          <span
            class="subject-progress-bar"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso de ${subject.name}`}
          >
            <span style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
          </span>
          {recentAccuracy !== undefined && (
            <span class="subject-recent-accuracy">
              Acerto · última janela com questões <b>{recentAccuracy}%</b>
            </span>
          )}
          <button
            type="button"
            class="subject-toggle btn ghost small"
            aria-expanded={!collapsed}
            disabled={Boolean(searchQuery)}
            title={searchQuery ? 'A busca mantém os resultados abertos' : undefined}
            aria-controls={`subject-body-${subject.id}`}
            data-delegated-click={`event.stopPropagation();toggleSubject('${subject.id}')`}
          >
            <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={16} />
            {collapsed ? 'Abrir tópicos' : 'Fechar tópicos'}
            <span class="sr-only"> de {subject.name}</span>
          </button>
          <details
            class="action-menu subject-action-menu"
            data-delegated-click="event.stopPropagation()"
          >
            <summary
              class="btn ghost small"
              aria-label={`Ações de ${subject.name}`}
              data-delegated-click="event.stopPropagation()"
            >
              <Icon name="dots" size={16} />
            </summary>
            <div class="action-menu__items">
              <button
                type="button"
                data-delegated-click={`event.stopPropagation();duplicateSubject('${subject.id}')`}
              >
                Duplicar disciplina
              </button>
              <label class="subject-color-field" data-delegated-click="event.stopPropagation()">
                <span>Cor</span>
                <select
                  aria-label={`Cor de ${subject.name}`}
                  data-delegated-change={`setSubjectColor('${subject.id}', this.value)`}
                >
                  {SUBJECT_COLOR_NAMES.map((name, index) => (
                    <option value={index + 1} selected={colorSlot === index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
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

      {!collapsed && subjectTopics.length > 0 && (
        <div class="subject-overview">
          <StackedBar
            className="subject-overview__status"
            label={`Tópicos de ${subject.name} por status`}
            parts={[
              { label: 'Concluído', value: statusCount('Concluído'), tone: 'primary' },
              { label: 'Revisão', value: statusCount('Revisão'), tone: 'primary-soft' },
              { label: 'Em andamento', value: statusCount('Em andamento'), tone: 'primary-faint' },
              { label: 'Não iniciado', value: statusCount('Não iniciado'), tone: 'empty' },
            ]}
          />
          <span class="subject-overview__trend">
            <Sparkline
              values={accuracyTrend || []}
              label={`Acerto semanal em questões de ${subject.name}`}
              unit="%"
              connectGaps
              width={72}
              height={22}
            />
            <small>Acerto por janela de 7 dias · últimas 8 semanas</small>
          </span>
        </div>
      )}

      <div id={`subject-body-${subject.id}`} class={`subject-body ${collapsed ? 'collapsed' : ''}`}>
        {!collapsed && (
        <>
        {isEmptySubject && (
          <p class="helper-text" role="status">
            Nenhum tópico ainda. Adicione o primeiro para começar a acompanhar esta disciplina.
          </p>
        )}
        <div class="add-topic-row">
          <button
            type="button"
            class="btn ghost small"
            data-delegated-click={`addTopic('${subject.id}')`}
          >
            + Adicionar tópico
          </button>
        </div>

        {!isEmptySubject && (
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
        )}

        {!isEmptySubject && (
        <div class="ledger-scroll">
          <table class="ledger">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Tópico</th>
                <th style={{ width: '13%' }}>Status</th>
                <th style={{ width: '13%' }}>Dificuldade</th>
                <th style={{ width: '9%' }}>Detalhes</th>
                <th style={{ width: '6%' }}>
                  <span class="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTopics.map(topic => {
                const isOpenNotes = openNotesIds.has(topic.id);
                // Analytics and the strategy editor are costly per topic and only show in the open notes row.
                return (
                  <SubjectTopicRow
                    key={topic.id}
                    subjectId={subject.id}
                    topic={topic}
                    isOpenNotes={isOpenNotes}
                    statusOptions={statusOptions}
                    statusClasses={statusClasses}
                    difficultyOptions={difficultyOptions}
                    difficultyClasses={difficultyClasses}
                    examBadgesHtml={getExamBadgesHtml?.(topic)}
                    analyticsStateHtml={isOpenNotes ? getAnalyticsStateHtml?.(subject, topic) : ''}
                    strategyEditorHtml={isOpenNotes ? getStrategyEditorHtml?.(subject, topic) : ''}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {footerHtml && <div dangerouslySetInnerHTML={{ __html: footerHtml }} />}

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
        </>
        )}
      </div>
    </div>
  );
}
