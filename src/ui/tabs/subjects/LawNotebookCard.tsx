import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Badge, type BadgeVariant } from '../../primitives/badge.js';
import { ProgressBar } from '../../primitives/progress-bar.js';
import { lawStatus, sortLawsForReview, type LawStatusKey } from '../../../domain/law-notebook.js';
import type { LawRecord } from '../../../core/types.js';

export interface LawNotebookCardProps {
  laws: LawRecord[];
  subjects: Array<{ id: string; name: string }>;
  today: string;
  onAdd: (input: { name: string; subjectId: string | null; totalArticles: number | null }) => void;
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
        </div>
        <Badge variant={STATUS_BADGE[status.key]}>{status.label}</Badge>
      </div>
      {law.totalArticles && law.currentArticle > 0 ? (
        <ProgressBar
          value={law.currentArticle}
          max={law.totalArticles}
          label={`Art. ${law.currentArticle} de ${law.totalArticles}`}
          showValueText
        />
      ) : null}
      <p class="law-row__meta">
        {[
          // Com barra, o artigo atual já aparece nela.
          law.currentArticle > 0
            ? law.totalArticles
              ? null
              : `Art. ${law.currentArticle}`
            : law.totalArticles
              ? `${law.totalArticles} artigos`
              : 'Total de artigos não informado',
          law.laps > 0
            ? `${law.laps} ${law.laps === 1 ? 'volta completa' : 'voltas completas'}`
            : null,
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
          min="1"
          max={law.totalArticles || undefined}
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
  const subjectNames = new Map(subjects.map(subject => [subject.id, subject.name]));
  const due = laws.filter(law => ['due', 'stalled'].includes(lawStatus(law, today).key)).length;

  const add = (event: Event) => {
    event.preventDefault();
    if (!name.trim()) return;
    const totalArticles = Math.floor(Number(total));
    onAdd({
      name: name.trim(),
      subjectId: subjectId || null,
      totalArticles: totalArticles > 0 ? totalArticles : null,
    });
    setName('');
    setTotal('');
  };

  return (
    <div class="law-notebook space-y-3">
      <p class="text-xs text-content-secondary m-0">
        Registre até onde leu cada lei. Ao fechar uma volta, a próxima é sugerida em 7, 15 e depois
        30 dias.
        {due > 0 && ` ${due} ${due === 1 ? 'lei pede' : 'leis pedem'} leitura agora.`}
      </p>
      <form class="law-notebook__add" onSubmit={add}>
        <label>
          Lei
          <input
            type="text"
            value={name}
            maxLength={120}
            placeholder="Ex.: Lei 8.112/1990"
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
