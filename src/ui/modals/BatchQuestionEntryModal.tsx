import type { JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import { ERROR_CATEGORIES } from '../../domain/diagnostics/error-categories.js';
import { KNOWN_BANCAS } from '../../domain/questions/bancas.js';
import {
  buildBatchQuestionRecords,
  type BatchQuestionBuildResult,
} from '../../domain/questions/batch-question-entry.js';

export interface BatchQuestionEntryModalProps {
  open: boolean;
  onClose: () => void;
  subjects: Array<{ id: string; name: string }>;
  topicsForSubject: (subjectId: string) => Array<{ id: string; name: string }>;
  defaultSubjectId?: string | null;
  defaultBanca?: string | null;
  todayDate: string;
  scoringMode?: 'padrao' | 'certo-errado';
  onSaveBatch: (records: BatchQuestionBuildResult['records']) => void;
}

interface RowDraft {
  resolved: string;
  correct: string;
  blank: string;
  errorCategory: string;
}

const EMPTY_ROW: RowDraft = { resolved: '', correct: '', blank: '', errorCategory: '' };

export function BatchQuestionEntryModal({
  open,
  onClose,
  subjects,
  topicsForSubject,
  defaultSubjectId = null,
  defaultBanca = null,
  todayDate,
  scoringMode = 'padrao',
  onSaveBatch,
}: BatchQuestionEntryModalProps): JSX.Element | null {
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || subjects[0]?.id || '');
  const [date, setDate] = useState<string>(todayDate);
  const [banca, setBanca] = useState<string>(defaultBanca || '');
  const [retry, setRetry] = useState<boolean>(false);
  const [rowsByTopic, setRowsByTopic] = useState<Record<string, RowDraft>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSubjectId(prev =>
        prev && subjects.some(s => s.id === prev) ? prev : defaultSubjectId || subjects[0]?.id || ''
      );
      setDate(todayDate);
      setBanca(defaultBanca || '');
      setRetry(false);
      setRowsByTopic({});
      setErrorMsg(null);
    }
  }, [open, defaultSubjectId, defaultBanca, todayDate]);

  const topics = useMemo(
    () => (subjectId ? topicsForSubject(subjectId) : []),
    [subjectId, topicsForSubject]
  );

  const rowKeys = useMemo(() => {
    const items = topics.map(t => ({ key: t.id, topicId: t.id, label: t.name }));
    items.push({ key: '__general__', topicId: '', label: 'Geral da disciplina (sem tópico)' });
    return items;
  }, [topics]);

  const preview = useMemo(() => {
    const rows = rowKeys.map(item => {
      const draft = rowsByTopic[item.key] || EMPTY_ROW;
      return {
        topicId: item.topicId || null,
        topicName: item.label,
        resolved: draft.resolved,
        correct: draft.correct,
        blank: scoringMode === 'certo-errado' ? draft.blank : null,
        errorCategory: draft.errorCategory || null,
      };
    });
    return buildBatchQuestionRecords({
      date,
      subjectId,
      banca: banca || null,
      retry,
      scoringMode,
      rows,
    });
  }, [rowKeys, rowsByTopic, date, subjectId, banca, retry, scoringMode]);

  const updateRow = (key: string, field: keyof RowDraft, value: string) => {
    setRowsByTopic(prev => ({
      ...prev,
      [key]: { ...(prev[key] || EMPTY_ROW), [field]: value },
    }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = (event: Event) => {
    event.preventDefault();
    if (!preview.ok) {
      setErrorMsg(preview.error || 'Verifique os valores informados.');
      return;
    }
    onSaveBatch(preview.records);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Lançamento em Lote — Caderno Misto"
      maxWidth="lg"
      className="batch-question-entry-modal"
    >
      <form class="space-y-4 text-sm text-content-primary" onSubmit={handleSubmit} novalidate>
        <p class="text-xs text-content-secondary">
          Registre de uma só vez questões de vários tópicos feitas no mesmo caderno do TEC ou
          QConcursos, preservando a precisão por tópico.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="batchQuestionSubject" class="text-xs font-medium text-content-secondary">
              Disciplina
            </label>
            <select
              id="batchQuestionSubject"
              class="select-control min-h-control text-xs py-1.5 px-2.5 rounded border border-border-default bg-surface-card text-content-primary"
              value={subjectId}
              onChange={e => {
                setSubjectId(e.currentTarget.value);
                setRowsByTopic({});
                setErrorMsg(null);
              }}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label htmlFor="batchQuestionDate" class="text-xs font-medium text-content-secondary">
              Data
            </label>
            <input
              id="batchQuestionDate"
              type="date"
              class="min-h-control text-xs py-1.5 px-2.5 rounded border border-border-default bg-surface-card text-content-primary"
              value={date}
              onInput={e => setDate(e.currentTarget.value)}
            />
          </div>

          <div class="flex flex-col gap-1">
            <label htmlFor="batchQuestionBanca" class="text-xs font-medium text-content-secondary">
              Banca (opcional)
            </label>
            <input
              id="batchQuestionBanca"
              type="text"
              list="batchQuestionBancasList"
              placeholder="Ex.: FGV, Cebraspe"
              class="min-h-control text-xs py-1.5 px-2.5 rounded border border-border-default bg-surface-card text-content-primary"
              value={banca}
              onInput={e => setBanca(e.currentTarget.value)}
            />
            <datalist id="batchQuestionBancasList">
              {KNOWN_BANCAS.map(b => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        </div>

        <label class="inline-flex items-center gap-2 text-xs text-content-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={retry}
            onChange={e => setRetry(e.currentTarget.checked)}
          />
          <span>Questões refeitas (bateria de repetição — conta meio peso no domínio)</span>
        </label>

        <div class="max-h-72 overflow-y-auto border border-border-subtle rounded-default">
          <table class="w-full text-xs border-collapse">
            <thead class="bg-surface-subtle sticky top-0 z-10">
              <tr class="text-left text-content-secondary border-b border-border-subtle">
                <th class="py-2 px-2.5 font-medium">Tópico</th>
                <th class="py-2 px-2 font-medium w-20">Total</th>
                <th class="py-2 px-2 font-medium w-20">Acertos</th>
                {scoringMode === 'certo-errado' && (
                  <th class="py-2 px-2 font-medium w-20">Brancas</th>
                )}
                <th class="py-2 px-2 font-medium w-40">Erro predominante</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              {rowKeys.map(item => {
                const draft = rowsByTopic[item.key] || EMPTY_ROW;
                return (
                  <tr key={item.key} class="hover:bg-surface-subtle/50">
                    <td class="py-1.5 px-2.5 text-content-primary font-medium">{item.label}</td>
                    <td class="py-1.5 px-2">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`Total de questões em ${item.label}`}
                        placeholder="0"
                        class="w-full min-h-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
                        value={draft.resolved}
                        onInput={e => updateRow(item.key, 'resolved', e.currentTarget.value)}
                      />
                    </td>
                    <td class="py-1.5 px-2">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        aria-label={`Acertos em ${item.label}`}
                        placeholder="0"
                        class="w-full min-h-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
                        value={draft.correct}
                        onInput={e => updateRow(item.key, 'correct', e.currentTarget.value)}
                      />
                    </td>
                    {scoringMode === 'certo-errado' && (
                      <td class="py-1.5 px-2">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`Questões em branco em ${item.label}`}
                          placeholder="0"
                          class="w-full min-h-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
                          value={draft.blank}
                          onInput={e => updateRow(item.key, 'blank', e.currentTarget.value)}
                        />
                      </td>
                    )}
                    <td class="py-1.5 px-2">
                      <select
                        aria-label={`Erro predominante em ${item.label}`}
                        class="w-full min-h-control text-xs py-1 px-1.5 rounded border border-border-default bg-surface-card text-content-primary"
                        value={draft.errorCategory}
                        onChange={e => updateRow(item.key, 'errorCategory', e.currentTarget.value)}
                      >
                        <option value="">Opcional</option>
                        {Object.entries(ERROR_CATEGORIES).map(([key, meta]) => (
                          <option key={key} value={key}>
                            {meta.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {errorMsg && (
          <p class="text-xs text-status-danger" role="alert">
            {errorMsg}
          </p>
        )}

        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          <div class="flex items-center gap-2 text-xs text-content-secondary">
            <Badge variant={preview.ok ? 'info' : 'default'}>
              {preview.summary.topicCount} tópico(s) · {preview.summary.totalCorrect}/
              {preview.summary.totalResolved} acertos
            </Badge>
          </div>
          <div class="flex items-center gap-2">
            <Button type="button" variant="ghost" size="small" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="small">
              <Icon name="check" size={14} class="icon-inline" />
              Salvar lote
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
