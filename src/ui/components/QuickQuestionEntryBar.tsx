import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  parseCopiedPlatformStats,
  parseQuickQuestionShorthand,
} from '../../domain/questions/quick-question-parser.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export interface QuickQuestionEntryPayload {
  subjectId: string;
  topicId: string | null;
  resolved: number;
  correct: number;
  blank: number | null;
  minutes: number | null;
  banca: string | null;
  retry: boolean;
}

export interface QuickQuestionEntryBarProps {
  subjects: Array<{ id: string; name: string }>;
  topicsForSubject: (subjectId: string) => Array<{ id: string; name: string }>;
  defaultSubjectId?: string | null;
  defaultBanca?: string | null;
  onSaveEntry: (entry: QuickQuestionEntryPayload) => void;
}

export function QuickQuestionEntryBar({
  subjects,
  topicsForSubject,
  defaultSubjectId = null,
  defaultBanca = null,
  onSaveEntry,
}: QuickQuestionEntryBarProps): JSX.Element | null {
  const [subjectId, setSubjectId] = useState<string>(
    defaultSubjectId || subjects[0]?.id || ''
  );
  const [topicId, setTopicId] = useState<string>('');
  const [shorthand, setShorthand] = useState<string>('');
  const [pasteOpen, setPasteOpen] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjects.length) return;
    if (!subjectId || !subjects.some(s => s.id === subjectId)) {
      setSubjectId(defaultSubjectId || subjects[0].id);
      setTopicId('');
    }
  }, [subjects, defaultSubjectId]);

  if (!subjects.length) return null;

  const topics = subjectId ? topicsForSubject(subjectId) : [];
  const parsedShorthand = shorthand.trim() ? parseQuickQuestionShorthand(shorthand) : null;
  const parsedPaste = pasteText.trim() ? parseCopiedPlatformStats(pasteText) : null;

  const commitParsed = (parsed: {
    resolved: number;
    correct: number;
    blank: number | null;
    minutes: number | null;
    banca: string | null;
    retry?: boolean;
  }) => {
    if (!subjectId) {
      setSubmitError('Selecione uma disciplina antes de registrar.');
      return;
    }
    onSaveEntry({
      subjectId,
      topicId: topicId || null,
      resolved: parsed.resolved,
      correct: parsed.correct,
      blank: parsed.blank,
      minutes: parsed.minutes,
      banca: parsed.banca || defaultBanca || null,
      retry: Boolean(parsed.retry),
    });
    setShorthand('');
    setPasteText('');
    setPasteOpen(false);
    setSubmitError(null);
  };

  const handleSubmitShorthand = (event: Event) => {
    event.preventDefault();
    const res = parseQuickQuestionShorthand(shorthand);
    if (!res.ok) {
      setSubmitError(res.error || 'Formato não reconhecido.');
      return;
    }
    commitParsed(res);
  };

  const handleConfirmPaste = () => {
    const res = parseCopiedPlatformStats(pasteText);
    if (!res.ok) {
      setSubmitError(res.error || 'Não foi possível ler as estatísticas coladas.');
      return;
    }
    commitParsed(res);
  };

  return (
    <section
      class="p-card rounded-default border border-border-default bg-surface-card space-y-2"
      aria-label="Registro expresso de questões"
      data-testid="quick-question-entry-bar"
    >
      <form
        class="flex flex-wrap items-end gap-2"
        onSubmit={handleSubmitShorthand}
        novalidate
      >
        <div class="flex flex-col gap-1 min-w-[160px] flex-1">
          <label
            htmlFor="quickQuestionSubject"
            class="text-xs font-medium text-content-secondary"
          >
            Disciplina
          </label>
          <select
            id="quickQuestionSubject"
            class="select-control min-h-control text-xs py-1.5 px-2.5 rounded border border-border-default bg-surface-card text-content-primary"
            aria-label="Disciplina do registro expresso"
            value={subjectId}
            onChange={e => {
              setSubjectId(e.currentTarget.value);
              setTopicId('');
            }}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div class="flex flex-col gap-1 min-w-[160px] flex-1">
          <label
            htmlFor="quickQuestionTopic"
            class="text-xs font-medium text-content-secondary"
          >
            Tópico (opcional)
          </label>
          <select
            id="quickQuestionTopic"
            class="select-control min-h-control text-xs py-1.5 px-2.5 rounded border border-border-default bg-surface-card text-content-primary"
            aria-label="Tópico do registro expresso"
            value={topicId}
            onChange={e => setTopicId(e.currentTarget.value)}
          >
            <option value="">Sem tópico específico</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div class="flex flex-col gap-1 min-w-[220px] flex-[2]">
          <label
            htmlFor="quickQuestionShorthandInput"
            class="text-xs font-medium text-content-secondary"
          >
            Lançamento expresso (Enter para salvar)
          </label>
          <input
            id="quickQuestionShorthandInput"
            type="text"
            class="min-h-control text-xs py-1.5 px-2.5 rounded border border-border-default bg-surface-card text-content-primary"
            placeholder="Ex.: 30q 25c 2b fgv 35m ref ou 25/21 cebraspe"
            aria-label="Entrada rápida de questões"
            value={shorthand}
            onInput={e => {
              setShorthand(e.currentTarget.value);
              if (submitError) setSubmitError(null);
            }}
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button id="quickQuestionSubmitBtn" type="submit" variant="primary" size="small">
            <Icon name="bolt" size={14} class="icon-inline" />
            Registrar
          </Button>
          <Button
            id="quickQuestionPasteToggleBtn"
            type="button"
            variant="ghost"
            size="small"
            aria-expanded={pasteOpen}
            onClick={() => {
              setPasteOpen(!pasteOpen);
              setSubmitError(null);
            }}
          >
            <Icon name="clipboard-text" size={14} class="icon-inline" />
            Colar TEC/QConcursos
          </Button>
        </div>
      </form>

      {parsedShorthand && parsedShorthand.ok && (
        <div
          class="flex flex-wrap items-center gap-2 text-xs text-content-secondary"
          role="status"
          data-testid="quick-question-preview"
        >
          <span>
            Prévia: <strong>{parsedShorthand.resolved}</strong> resolvidas ·{' '}
            <strong>{parsedShorthand.correct}</strong> acertos (
            {Math.round((parsedShorthand.correct / parsedShorthand.resolved) * 100)}%)
          </span>
          {parsedShorthand.blank != null && (
            <span>· {parsedShorthand.blank} em branco</span>
          )}
          {(parsedShorthand.banca || defaultBanca) && (
            <span>· Banca: {parsedShorthand.banca || defaultBanca}</span>
          )}
          {parsedShorthand.minutes != null && <span>· {parsedShorthand.minutes} min</span>}
          {parsedShorthand.retry && <span>· Refeitas</span>}
        </div>
      )}

      {submitError && (
        <p class="text-xs text-feedback-danger m-0" role="alert">
          {submitError}
        </p>
      )}

      {pasteOpen && (
        <div
          class="pt-2 border-t border-border-subtle space-y-2"
          data-testid="quick-question-paste-box"
        >
          <label
            htmlFor="quickQuestionPasteTextarea"
            class="block text-xs font-medium text-content-secondary"
          >
            Cole o resumo copiado da tela de caderno/estatísticas do TEC Concursos ou QConcursos
          </label>
          <textarea
            id="quickQuestionPasteTextarea"
            class="w-full h-20 p-2 rounded border border-border-default bg-surface-subtle text-content-primary text-xs"
            placeholder={'Ex.:\nQuestões resolvidas: 40\nCertas: 32\nErradas: 6\nEm branco: 2\nBanca: Cebraspe\nTempo: 48 min'}
            aria-label="Texto colado do TEC ou QConcursos"
            value={pasteText}
            onInput={e => {
              setPasteText(e.currentTarget.value);
              if (submitError) setSubmitError(null);
            }}
          />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs text-content-secondary">
              {parsedPaste
                ? parsedPaste.ok
                  ? `Detectado: ${parsedPaste.resolved} questões · ${parsedPaste.correct} acertos${parsedPaste.blank != null ? ` · ${parsedPaste.blank} brancas` : ''}${parsedPaste.banca ? ` · ${parsedPaste.banca}` : ''}`
                  : parsedPaste.error
                : 'Aguardando estatísticas coladas.'}
            </span>
            <Button
              id="quickQuestionPasteConfirmBtn"
              type="button"
              variant="secondary"
              size="small"
              disabled={!parsedPaste?.ok}
              onClick={handleConfirmPaste}
            >
              <Icon name="check" size={14} class="icon-inline" />
              Importar estatísticas
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
