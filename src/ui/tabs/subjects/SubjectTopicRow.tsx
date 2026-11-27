import { useEffect, useRef, useState } from 'preact/hooks';
import { BookmarkBadge } from '../../components/BookmarkBadge.js';
import { Icon } from '../../primitives/icon.js';
import { TopicAnalyticsStateCard, type TopicAnalyticsStateModel } from './TopicAnalyticsStateCard.js';
import { TopicStrategyEditorCard } from './TopicStrategyEditorCard.js';

export interface SubjectTopicRowProps {
  subjectId: string;
  topic: any;
  isOpenNotes: boolean;
  statusOptions: readonly string[];
  statusClasses: Record<string, string>;
  difficultyOptions: readonly string[];
  difficultyClasses: Record<string, string>;
  analyticsStateModel?: TopicAnalyticsStateModel | null;
  strategyEditorModel?: any | null;
}

function ExamBadges({ tags }: { tags?: string[] }) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  const normalized = tags.map(tag => String(tag).toLowerCase());
  const hasBb = normalized.includes('bb');
  const hasCaixa = normalized.includes('caixa');
  const hasCaixaTi = normalized.includes('caixa-ti') || normalized.includes('caixa_ti');
  if (!hasBb && !hasCaixa && !hasCaixaTi) return null;
  return (
    <>
      {hasBb && <span class="exam-tag exam-tag--bb">BB</span>}
      {hasCaixa && <span class="exam-tag exam-tag--caixa">CAIXA</span>}
      {hasCaixaTi && <span class="exam-tag exam-tag--caixa">CAIXA TI</span>}
    </>
  );
}

export function SubjectTopicRow({
  subjectId,
  topic,
  isOpenNotes,
  statusOptions,
  statusClasses,
  difficultyOptions,
  difficultyClasses,
  analyticsStateModel = null,
  strategyEditorModel = null,
}: SubjectTopicRowProps) {
  const statusClass = statusClasses[topic.status] || 'st-nao';
  const difficultyClass = difficultyClasses[topic.difficulty] || 'diff-medio';
  const hasNotes = Boolean(topic.notes || (topic.tags && topic.tags.length));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [linkError, setLinkError] = useState('');
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const markSaved = () => {
    setSaveStatus('saved');
    if (typeof window !== 'undefined') {
      if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current);
      savedTimerRef.current = window.setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const isValidHttpUrl = (raw: string): boolean => {
    const trimmed = raw.trim();
    if (!trimmed) return true;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

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
            onKeyDown={e => {
              const target = e.currentTarget as HTMLInputElement;
              if (e.key === 'Enter') {
                e.preventDefault();
                target.blur();
              } else if (e.key === 'Escape') {
                target.value = topic.name || '';
                target.blur();
              }
            }}
          />
          {((topic.examTags || []).length > 0 ||
            (topic.tags || []).length > 0 ||
            topic.bookmark) && (
            <div class="tag-chips">
              {topic.bookmark && <BookmarkBadge bookmark={topic.bookmark} />}
              <ExamBadges tags={topic.examTags} />
              {(topic.tags || []).map((tag: string, idx: number) => (
                <span key={idx} class="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </td>
        <td>
          <select
            class={`status-select ${statusClass}`}
            aria-label={`Status de ${topic.name || 'tópico sem nome'}`}
            data-delegated-change={`updateTopicStatus('${subjectId}','${topic.id}', this)`}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt} selected={opt === topic.status}>
                {opt}
              </option>
            ))}
          </select>
        </td>
        <td>
          <select
            class={`status-select ${difficultyClass}`}
            aria-label={`Dificuldade de ${topic.name || 'tópico sem nome'}`}
            data-delegated-change={`updateTopic('${subjectId}','${topic.id}','difficulty', this.value)`}
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
            aria-expanded={isOpenNotes}
            aria-controls={`topic-notes-${topic.id}`}
            data-delegated-click={`toggleNotes('${topic.id}')`}
            aria-label={`Detalhes de ${topic.name || 'tópico sem nome'}${hasNotes ? ' (possui anotações)' : ''}`}
            title={hasNotes ? 'Possui anotações ou tags' : undefined}
          >
            Detalhes
            {hasNotes && <span class="sr-only"> (possui anotações)</span>}
          </button>
        </td>
        <td>
          <button
            type="button"
            class="icon-btn text-content-secondary"
            data-delegated-click={`archiveTopic('${subjectId}','${topic.id}')`}
            title="Arquivar tópico"
            aria-label={`Arquivar ${topic.name || 'tópico sem nome'}`}
          >
            <Icon name="archive" size={14} />
          </button>
        </td>
      </tr>
      {isOpenNotes && (
        <tr
          class="notes-row"
          id={`topic-notes-${topic.id}`}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              const toggleBtn =
                typeof document !== 'undefined'
                  ? document.querySelector<HTMLButtonElement>(`#topic-row-${topic.id} .notes-toggle-btn`)
                  : null;
              toggleBtn?.click();
              toggleBtn?.focus();
            }
          }}
        >
          <td colSpan={5}>
            <div class="space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  class="btn tonal small inline-flex items-center gap-1"
                  data-delegated-click={`startTopicStudy('${subjectId}','${topic.id}')`}
                >
                  <Icon name="player-play" size={12} />
                  <span>Estudar este tópico</span>
                </button>
                {saveStatus === 'saved' && (
                  <span class="text-xs font-medium text-status-success" role="status">
                    Salvo
                  </span>
                )}
              </div>
              <label>Link / material
                <input
                  type="url"
                  value={topic.link || ''}
                  placeholder="https://..."
                  aria-label={`Link ou material de ${topic.name || 'tópico sem nome'}`}
                  data-delegated-blur={`updateTopic('${subjectId}','${topic.id}','link', this.value)`}
                  onBlur={e => {
                    const val = (e.target as HTMLInputElement).value;
                    if (!isValidHttpUrl(val)) {
                      setLinkError('Informe uma URL válida iniciando com http:// ou https://.');
                    } else {
                      setLinkError('');
                      markSaved();
                    }
                  }}
                />
                {linkError && (
                  <span class="block text-xs text-status-danger mt-1" role="alert">
                    {linkError}
                  </span>
                )}
              </label>
              <label>Tags
                <input
                  type="text"
                  class="topic-tags-input"
                  aria-label={`Tags de ${topic.name || 'tópico sem nome'}`}
                  placeholder="Tags separadas por vírgula (ex: cai muito, revisar antes da prova)"
                  value={(topic.tags || []).join(', ')}
                  data-delegated-blur={`updateTopicTags('${subjectId}','${topic.id}', this.value)`}
                  onBlur={() => {
                    markSaved();
                  }}
                />
              </label>
              <label>Notas
                <textarea
                  class="topic-notes-textarea"
                  aria-label={`Notas de ${topic.name || 'tópico sem nome'}`}
                  placeholder="Resumo, pegadinha da prova, dúvida para revisar depois..."
                  value={topic.notes || ''}
                  data-delegated-blur={`updateTopic('${subjectId}','${topic.id}','notes', this.value)`}
                  onBlur={() => {
                    markSaved();
                  }}
                />
              </label>
              {(analyticsStateModel || strategyEditorModel) && (
                <div class="pt-3 border-t border-border-subtle space-y-2">
                  <div class="text-xs font-medium text-content-secondary">
                    Estratégia e evidências
                  </div>
                  {analyticsStateModel && <TopicAnalyticsStateCard model={analyticsStateModel} />}
                  {strategyEditorModel && <TopicStrategyEditorCard model={strategyEditorModel} />}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
