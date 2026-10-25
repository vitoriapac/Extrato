import type { JSX } from 'preact';

export interface SubjectTopicRowProps {
  subjectId: string;
  topic: any;
  isOpenNotes: boolean;
  statusOptions: readonly string[];
  statusClasses: Record<string, string>;
  difficultyOptions: readonly string[];
  difficultyClasses: Record<string, string>;
  examBadgesHtml?: string;
  analyticsStateHtml?: string;
  strategyEditorHtml?: string;
  onUpdateTopic?: (subjectId: string, topicId: string, field: string, value: any) => void;
  onUpdateTopicStatus?: (subjectId: string, topicId: string, status: string) => void;
  onToggleNotes?: (topicId: string) => void;
  onArchiveTopic?: (subjectId: string, topicId: string) => void;
}

export function SubjectTopicRow({
  subjectId,
  topic,
  isOpenNotes,
  statusOptions,
  statusClasses,
  difficultyOptions,
  difficultyClasses,
  examBadgesHtml = '',
  analyticsStateHtml = '',
  strategyEditorHtml = '',
  onUpdateTopic,
  onUpdateTopicStatus,
  onToggleNotes,
  onArchiveTopic,
}: SubjectTopicRowProps) {
  const statusClass = statusClasses[topic.status] || 'st-nao';
  const difficultyClass = difficultyClasses[topic.difficulty] || 'diff-medio';
  const hasNotes = Boolean(topic.notes || (topic.tags && topic.tags.length));

  return (
    <>
      <tr data-status={topic.status} id={`topic-row-${topic.id}`}>
        <td>
          <input
            type="text"
            value={topic.name}
            placeholder="Nome do tópico"
            aria-label="Nome do tópico"
            data-delegated-blur={`updateTopic('${subjectId}','${topic.id}','name', this.value)`}
            onBlur={e =>
              onUpdateTopic?.(subjectId, topic.id, 'name', (e.target as HTMLInputElement).value)
            }
          />
          {((topic.examTags || []).length > 0 || (topic.tags || []).length > 0) && (
            <div class="tag-chips">
              {examBadgesHtml && <span dangerouslySetInnerHTML={{ __html: examBadgesHtml }} />}
              {(topic.tags || []).map((tag: string, idx: number) => (
                <span key={idx} class="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </td>
        <td>
          <input
            type="url"
            value={topic.link || ''}
            placeholder="https://..."
            aria-label={`Link ou material de ${topic.name || 'tópico sem nome'}`}
            data-delegated-blur={`updateTopic('${subjectId}','${topic.id}','link', this.value)`}
            onBlur={e =>
              onUpdateTopic?.(subjectId, topic.id, 'link', (e.target as HTMLInputElement).value)
            }
          />
        </td>
        <td>
          <select
            class={`status-select ${statusClass}`}
            aria-label={`Status de ${topic.name || 'tópico sem nome'}`}
            data-delegated-change={`updateTopicStatus('${subjectId}','${topic.id}', this)`}
            onChange={e =>
              onUpdateTopicStatus?.(subjectId, topic.id, (e.target as HTMLSelectElement).value)
            }
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt} selected={opt === topic.status}>
                {opt}
              </option>
            ))}
          </select>
          <span class="stamp">✓ ok</span>
        </td>
        <td>
          <select
            class={`status-select ${difficultyClass}`}
            aria-label={`Dificuldade de ${topic.name || 'tópico sem nome'}`}
            data-delegated-change={`updateTopic('${subjectId}','${topic.id}','difficulty', this.value)`}
            onChange={e =>
              onUpdateTopic?.(
                subjectId,
                topic.id,
                'difficulty',
                (e.target as HTMLSelectElement).value
              )
            }
          >
            {difficultyOptions.map(opt => (
              <option key={opt} value={opt} selected={opt === topic.difficulty}>
                {opt}
              </option>
            ))}
          </select>
        </td>
        <td>
          <button
            type="button"
            class={`btn ghost small notes-toggle-btn ${hasNotes ? 'has-notes' : ''}`}
            data-delegated-click={`toggleNotes('${topic.id}')`}
            aria-label={`${hasNotes ? 'Ver notas de' : 'Anotar'} ${topic.name || 'tópico sem nome'}`}
            onClick={() => onToggleNotes?.(topic.id)}
          >
            {hasNotes ? 'Ver' : 'Anotar'}
          </button>
        </td>
        <td>
          <button
            type="button"
            class="icon-btn"
            data-delegated-click={`archiveTopic('${subjectId}','${topic.id}')`}
            title="Arquivar tópico"
            aria-label={`Arquivar ${topic.name || 'tópico sem nome'}`}
            onClick={() => onArchiveTopic?.(subjectId, topic.id)}
          >
            ✕
          </button>
        </td>
      </tr>
      {isOpenNotes && (
        <tr class="notes-row">
          <td colSpan={6}>
            {analyticsStateHtml && <div dangerouslySetInnerHTML={{ __html: analyticsStateHtml }} />}
            {strategyEditorHtml && <div dangerouslySetInnerHTML={{ __html: strategyEditorHtml }} />}
            <input
              type="text"
              class="topic-tags-input"
              placeholder="Tags separadas por vírgula (ex: cai muito, revisar antes da prova)"
              value={(topic.tags || []).join(', ')}
              data-delegated-blur={`updateTopicTags('${subjectId}','${topic.id}', this.value)`}
              onBlur={e =>
                onUpdateTopic?.(
                  subjectId,
                  topic.id,
                  'tags',
                  (e.target as HTMLInputElement).value
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean)
                )
              }
            />
            <textarea
              class="topic-notes-textarea"
              placeholder="Resumo, pegadinha da prova, dúvida pra revisar depois..."
              data-delegated-blur={`updateTopic('${subjectId}','${topic.id}','notes', this.value)`}
              onBlur={e =>
                onUpdateTopic?.(
                  subjectId,
                  topic.id,
                  'notes',
                  (e.target as HTMLTextAreaElement).value
                )
              }
            >
              {topic.notes || ''}
            </textarea>
          </td>
        </tr>
      )}
    </>
  );
}
