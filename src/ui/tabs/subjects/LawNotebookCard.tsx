import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Badge, type BadgeVariant } from '../../primitives/badge.js';
import { ProgressBar } from '../../primitives/progress-bar.js';
import {
  lawEffectiveRange,
  lawLapProgress,
  lawStatus,
  sortLawsForReview,
  type LawStatusKey,
} from '../../../domain/law-notebook.js';
import type { LawRecord } from '../../../core/types.js';

export interface LawNotebookCardProps {
  laws: LawRecord[];
  subjects: Array<{ id: string; name: string }>;
  today: string;
  onAdd: (input: {
    name: string;
    subjectId: string | null;
    totalArticles: number | null;
    startArticle?: number | null;
    endArticle?: number | null;
    hotArticles?: string | null;
  }) => void;
  onRead: (id: string, article: number) => void;
  onCompleteLap: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_BADGE: Record<LawStatusKey, BadgeVariant> = {
  due: 'warning',
  stalled: 'danger',
  reading: 'info',
  new: 'default',
  resting: 'success',
};

const dateBR = (iso: string) => iso.split('-').reverse().join('/');

function LawRow({
  law,
  subjectName,
  today,
  onRead,
  onCompleteLap,
  onDelete,
}: {
  law: LawRecord;
  subjectName: string | null;
  today: string;
  onRead: LawNotebookCardProps['onRead'];
  onCompleteLap: LawNotebookCardProps['onCompleteLap'];
  onDelete: LawNotebookCardProps['onDelete'];
}) {
  const [article, setArticle] = useState('');
  const status = lawStatus(law, today);
  const range = lawEffectiveRange(law);
  const progress = lawLapProgress(law);
  const inputId = `lawRead-${law.id}`;
  const submit = (event: Event) => {
    event.preventDefault();
    const value = Math.floor(Number(article));
    if (!Number.isFinite(value) || value <= 0) return;
    onRead(law.id, value);
    setArticle('');
  };
  return (
    <li class="law-row">
      <div class="law-row__head">
        <div>
          <strong>{law.name}</strong>
          {subjectName && <span class="law-row__subject"> · {subjectName}</span>}
          {range.isRange && (
            <span class="law-row__subject">
              {' '}
              · {range.end != null ? `Arts. ${range.start}–${range.end}` : `A partir do art. ${range.start}`}
            </span>
          )}
        </div>
        <Badge variant={STATUS_BADGE[status.key]}>{status.label}</Badge>
      </div>
      {progress.total != null && progress.total > 0 && law.currentArticle > 0 ? (
        <ProgressBar
          value={progress.done}
          max={progress.total}
          label={progress.label || `Art. ${law.currentArticle}`}
          showValueText
        />
      ) : null}
      <p class="law-row__meta">
        {[
          // Com barra, o artigo atual já aparece nela.
          law.currentArticle > 0
            ? progress.total != null
              ? null
              : `Art. ${law.currentArticle}`
            : range.end != null && range.span != null
              ? range.isRange
                ? `Recorte: ${range.span} artigos`
                : `${range.end} artigos`
              : 'Total de artigos não informado',
          law.laps > 0
            ? `${law.laps} ${law.laps === 1 ? 'volta completa' : 'voltas completas'}`
            : null,
          law.hotArticles ? `Artigos quentes: ${law.hotArticles}` : null,
          law.lastReadAt ? `última leitura ${dateBR(law.lastReadAt)}` : null,
          status.key === 'resting' && status.nextLapDate
            ? `próxima volta ${dateBR(status.nextLapDate)}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <form class="law-row__actions" onSubmit={submit}>
        <label for={inputId}>Li até o art.</label>
        <input
          id={inputId}
          type="number"
          min={range.isRange ? range.start : 1}
          max={range.end ?? undefined}
          inputMode="numeric"
          value={article}
          onInput={event => setArticle((event.target as HTMLInputElement).value)}
        />
        <button type="submit" class="btn small">
          Registrar
        </button>
        {law.currentArticle > 0 && (
          <button type="button" class="btn ghost small" onClick={() => onCompleteLap(law.id)}>
            Concluir volta
          </button>
        )}
        <button
          type="button"
          class="btn ghost small"
          aria-label={`Excluir ${law.name}`}
          onClick={() => onDelete(law.id)}
        >
          Excluir
        </button>
      </form>
    </li>
  );
}

export function LawNotebookCard({
  laws,
  subjects,
  today,
  onAdd,
  onRead,
  onCompleteLap,
  onDelete,
}: LawNotebookCardProps): JSX.Element {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [total, setTotal] = useState('');
  const [startArt, setStartArt] = useState('');
  const [endArt, setEndArt] = useState('');
  const [hotArticles, setHotArticles] = useState('');
  const subjectNames = new Map(subjects.map(subject => [subject.id, subject.name]));
  const due = laws.filter(law => ['due', 'stalled'].includes(lawStatus(law, today).key)).length;

  const add = (event: Event) => {
    event.preventDefault();
    if (!name.trim()) return;
    const totalArticles = Math.floor(Number(total));
    const startArticle = Math.floor(Number(startArt));
    const endArticle = Math.floor(Number(endArt));
    onAdd({
      name: name.trim(),
      subjectId: subjectId || null,
      totalArticles: totalArticles > 0 ? totalArticles : null,
      startArticle: startArticle > 0 ? startArticle : null,
      endArticle: endArticle > 0 ? endArticle : null,
      hotArticles: hotArticles.trim() || null,
    });
    setName('');
    setTotal('');
    setStartArt('');
    setEndArt('');
    setHotArticles('');
  };

  return (
    <div class="law-notebook space-y-3">
      <p class="text-xs text-content-secondary m-0">
        Registre até onde leu cada lei ou recorte de artigos do edital. Ao fechar uma volta, a
        próxima é sugerida em 7, 15 e depois 30 dias.
        {due > 0 && ` ${due} ${due === 1 ? 'lei pede' : 'leis pedem'} leitura agora.`}
      </p>
      <form class="law-notebook__add" onSubmit={add}>
        <label>
          Lei
          <input
            type="text"
            value={name}
            maxLength={120}
            placeholder="Ex.: CF/88 ou Lei 8.112/1990"
            required
            onInput={event => setName((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Disciplina
          <select
            value={subjectId}
            onChange={event => setSubjectId((event.target as HTMLSelectElement).value)}
          >
            <option value="">Sem disciplina</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Total de artigos
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={total}
            placeholder="Opcional"
            onInput={event => setTotal((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Do art. (recorte)
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={startArt}
            placeholder="Ex.: 37"
            aria-label="Artigo inicial do recorte"
            onInput={event => setStartArt((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Até o art. (recorte)
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={endArt}
            placeholder="Ex.: 41"
            aria-label="Artigo final do recorte"
            onInput={event => setEndArt((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Artigos quentes
          <input
            type="text"
            maxLength={120}
            value={hotArticles}
            placeholder="Ex.: Arts. 37 §6º, 41"
            aria-label="Artigos quentes mais cobrados"
            onInput={event => setHotArticles((event.target as HTMLInputElement).value)}
          />
        </label>
        <button type="submit" class="btn small">
          Adicionar lei
        </button>
      </form>
      {laws.length === 0 ? (
        <p class="m-0">Nenhuma lei no caderno ainda.</p>
      ) : (
        <ul class="law-notebook__list">
          {sortLawsForReview(laws, today).map(law => (
            <LawRow
              key={law.id}
              law={law}
              subjectName={law.subjectId ? subjectNames.get(law.subjectId) || null : null}
              today={today}
              onRead={onRead}
              onCompleteLap={onCompleteLap}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
