import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { JurisprudenceKind, JurisprudenceRecord } from '../../../core/types.js';
import { formatDateBR } from '../../../core/format-date.js';
import {
  JURISPRUDENCE_KIND_LABELS,
  JURISPRUDENCE_KINDS,
  jurisprudenceStatus,
  sortJurisprudenceForReview,
  type JurisprudenceStatusKey,
} from '../../../domain/jurisprudence-notebook.js';
import { Badge, type BadgeVariant } from '../../primitives/badge.js';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';

export interface JurisprudenceNotebookCardProps {
  records: JurisprudenceRecord[];
  subjects: Array<{ id: string; name: string }>;
  today: string;
  onAdd: (entry: {
    kind: JurisprudenceKind;
    code: string;
    title: string;
    thesisSummary: string;
    subjectId: string | null;
  }) => void;
  onReview: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_BADGE: Record<JurisprudenceStatusKey, BadgeVariant> = {
  due: 'warning',
  new: 'default',
  resting: 'success',
};

export function JurisprudenceNotebookCard({
  records,
  subjects,
  today,
  onAdd,
  onReview,
  onDelete,
}: JurisprudenceNotebookCardProps): JSX.Element {
  const [kind, setKind] = useState<JurisprudenceKind>('informativo_stf');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [thesisSummary, setThesisSummary] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [filterKind, setFilterKind] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState('');

  const subjectNames = new Map(subjects.map(s => [s.id, s.name]));
  const dueCount = records.filter(r =>
    ['due', 'new'].includes(jurisprudenceStatus(r, today).key)
  ).length;

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    if (!code.trim() || !title.trim()) {
      setFormError('Informe o código e o título do julgado.');
      return;
    }
    setFormError('');
    onAdd({
      kind,
      code: code.trim(),
      title: title.trim(),
      thesisSummary: thesisSummary.trim(),
      subjectId: subjectId || null,
    });
    setCode('');
    setTitle('');
    setThesisSummary('');
  };

  const normalizedQuery = searchQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const filtered = sortJurisprudenceForReview(records, today).filter(r => {
    if (filterKind && r.kind !== filterKind) return false;
    if (filterSubject && r.subjectId !== filterSubject) return false;
    if (!normalizedQuery) return true;
    const subName = r.subjectId ? subjectNames.get(r.subjectId) || '' : '';
    const haystack = `${r.code} ${r.title} ${r.thesisSummary || ''} ${subName}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return (
    <div class="law-notebook space-y-3" data-testid="jurisprudence-notebook">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-base font-medium m-0">Informativos STF/STJ &amp; Súmulas</h3>
        {dueCount > 0 && <Badge variant="warning">{dueCount} para revisar</Badge>}
      </div>
      <p class="text-xs text-content-secondary m-0">
        Caderno de Informativos STF/STJ, Súmulas e Temas Repetitivos com revisões espaçadas em 7, 21
        e 45 dias.
        {dueCount > 0 && ` ${dueCount} ${dueCount === 1 ? 'julgado pede' : 'julgados pedem'} revisão.`}
      </p>

      <details class="decision-fold" open={records.length === 0}>
        <summary class="text-xs font-medium inline-flex items-center gap-1">
          <Icon name="plus" size={13} class="icon-inline" />
          Adicionar julgado
        </summary>
        <form class="law-notebook__add mt-2" id="jurisAddForm" onSubmit={handleSubmit}>
        <label htmlFor="jurisKindSelect">
          Tipo
          <select
            id="jurisKindSelect"
            value={kind}
            onChange={e => setKind((e.currentTarget as HTMLSelectElement).value as JurisprudenceKind)}
          >
            {JURISPRUDENCE_KINDS.map(k => (
              <option key={k} value={k}>
                {JURISPRUDENCE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="jurisCodeInput">
          Número / Referência
          <input
            id="jurisCodeInput"
            type="text"
            maxLength={60}
            placeholder="Ex.: Info 1152 STF / SV 13"
            required
            value={code}
            onInput={e => setCode((e.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label htmlFor="jurisTitleInput">
          Tema
          <input
            id="jurisTitleInput"
            type="text"
            maxLength={120}
            placeholder="Ex.: Responsabilidade do Estado"
            required
            value={title}
            onInput={e => setTitle((e.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label htmlFor="jurisSubjectSelect">
          Disciplina
          <select
            id="jurisSubjectSelect"
            value={subjectId}
            onChange={e => setSubjectId((e.currentTarget as HTMLSelectElement).value)}
          >
            <option value="">Sem disciplina</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="jurisThesisInput" class="flex-1 min-w-[200px]">
          Tese resumida (opcional)
          <input
            id="jurisThesisInput"
            type="text"
            maxLength={320}
            placeholder="Síntese objetiva cobrada em prova"
            value={thesisSummary}
            onInput={e => setThesisSummary((e.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <button type="submit" id="jurisAddBtn" class="btn small">
          Adicionar julgado
        </button>
      </form>
      </details>

      {formError && (
        <p class="text-xs text-status-danger m-0" role="alert">
          {formError}
        </p>
      )}

      {records.length > 0 && (
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="search"
            class="min-h-control flex-1 min-w-[180px] px-3 py-1 text-xs rounded border border-border-default bg-surface-card text-content-primary"
            value={searchQuery}
            placeholder="Buscar código, título ou tese..."
            aria-label="Buscar no caderno de jurisprudência"
            onInput={e => setSearchQuery((e.currentTarget as HTMLInputElement).value)}
          />
          <select
            aria-label="Filtrar jurisprudência por tipo"
            class="select-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
            value={filterKind}
            onChange={e => setFilterKind((e.currentTarget as HTMLSelectElement).value)}
          >
            <option value="">Todos os tipos</option>
            {JURISPRUDENCE_KINDS.map(k => (
              <option key={k} value={k}>
                {JURISPRUDENCE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar jurisprudência por disciplina"
            class="select-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
            value={filterSubject}
            onChange={e => setFilterSubject((e.currentTarget as HTMLSelectElement).value)}
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div class="flex flex-wrap items-center gap-2">
          <p class="m-0 text-xs text-content-secondary">
            {records.length === 0
              ? 'Nenhum informativo ou súmula cadastrado ainda.'
              : 'Nenhum registro para os filtros selecionados.'}
          </p>
          {records.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={() => {
                setFilterKind('');
                setFilterSubject('');
                setSearchQuery('');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <ul class="law-notebook__list">
          {filtered.map(item => {
            const st = jurisprudenceStatus(item, today);
            const subName = item.subjectId ? subjectNames.get(item.subjectId) || null : null;
            return (
              <li key={item.id} class="law-row">
                <div class="law-row__head">
                  <div>
                    <span class="text-xs font-medium text-content-secondary">
                      {JURISPRUDENCE_KIND_LABELS[item.kind]} ·{' '}
                    </span>
                    <strong>{item.code}</strong> — {item.title}
                    {subName && <span class="law-row__subject"> · {subName}</span>}
                  </div>
                  <Badge variant={STATUS_BADGE[st.key]}>{st.label}</Badge>
                </div>
                {item.thesisSummary && (
                  <p class="text-xs text-content-primary m-0">{item.thesisSummary}</p>
                )}
                <p class="law-row__meta">
                  {[
                    item.laps > 0
                      ? `${item.laps} ${item.laps === 1 ? 'revisão' : 'revisões'}`
                      : 'Sem revisões ainda',
                    item.lastReadAt ? `lido em ${formatDateBR(item.lastReadAt)}` : null,
                    item.nextReviewDate ? `próxima em ${formatDateBR(item.nextReviewDate)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div class="law-row__actions">
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    data-testid={`juris-review-${item.id}`}
                    onClick={() => onReview(item.id)}
                  >
                    <Icon name="check" size={14} class="icon-inline" />
                    Registrar revisão
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    aria-label={`Excluir ${item.code}`}
                    onClick={() => onDelete(item.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
