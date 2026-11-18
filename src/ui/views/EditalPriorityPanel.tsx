import { useState } from 'preact/hooks';
import { Badge, type BadgeVariant } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export interface EditalPriorityRow {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  canonicalName?: string | null;
  combinedActionLabel: 'Priorizar' | 'Praticar' | 'Manter' | 'Avaliar';
  externalImpactLabel: string;
  externalSourceLabel?: string | null;
  personalNeedLabel: string;
  explanation: string;
  insufficientEvidence: boolean;
}

export interface EditalPriorityPanelProps {
  rows: EditalPriorityRow[];
  boardLabel?: string | null;
  roleLabel?: string | null;
  onOpenTopic: (subjectId: string, topicId: string) => void;
  onRequestPlanAdjustmentPreview?: (subjectId: string, topicId: string) => void;
}

function actionVariant(label: EditalPriorityRow['combinedActionLabel']): BadgeVariant {
  if (label === 'Priorizar') return 'danger';
  if (label === 'Praticar') return 'warning';
  if (label === 'Manter') return 'success';
  return 'insufficient';
}

export function EditalPriorityPanel({
  rows = [],
  boardLabel,
  roleLabel,
  onOpenTopic,
  onRequestPlanAdjustmentPreview,
}: EditalPriorityPanelProps) {
  const [filter, setFilter] = useState<'all' | 'priority'>('all');

  const visibleRows =
    filter === 'priority'
      ? rows.filter(r => r.combinedActionLabel === 'Priorizar' || r.combinedActionLabel === 'Praticar')
      : rows;

  const contextLabel = [boardLabel, roleLabel].filter(Boolean).join(' · ');

  return (
    <section
      class="rounded-default border border-border-subtle bg-surface-elevated p-4 space-y-4"
      aria-label="Inteligência do Edital"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-heading m-0">Onde concentrar seus estudos</h3>
          {contextLabel && <p class="text-xs text-secondary mt-0.5">{contextLabel}</p>}
        </div>

        <div class="flex items-center gap-2" role="group" aria-label="Filtrar tópicos do edital">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="small"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'priority' ? 'primary' : 'ghost'}
            size="small"
            aria-pressed={filter === 'priority'}
            onClick={() => setFilter('priority')}
          >
            Prioritários
          </Button>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <div class="rounded-default border border-border-subtle bg-surface-subtle p-4 text-sm text-secondary flex items-center gap-2">
          <Icon name="alert-circle" size={16} class="shrink-0 text-muted" />
          <span>Nenhum tópico disponível para este filtro no contexto atual.</span>
        </div>
      ) : (
        <div class="divide-y divide-border-subtle border-t border-border-subtle">
          {visibleRows.map(row => (
            <article
              key={`${row.subjectId}-${row.topicId}`}
              class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-heading text-sm">{row.topicName}</span>
                  <Badge variant={actionVariant(row.combinedActionLabel)}>
                    {row.combinedActionLabel}
                  </Badge>
                </div>
                <div class="text-xs text-muted">
                  {row.subjectName}
                  {row.canonicalName && row.canonicalName !== row.topicName
                    ? ` · Equivale a: ${row.canonicalName}`
                    : ''}
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-secondary pt-0.5">
                  <span>
                    Importância na prova:{' '}
                    <strong class="text-heading">
                      {row.insufficientEvidence ? 'Incidência não estimada' : row.externalImpactLabel}
                    </strong>
                    {row.externalSourceLabel ? ` (${row.externalSourceLabel})` : ''}
                  </span>
                  <span>
                    Necessidade pessoal: <strong class="text-heading">{row.personalNeedLabel}</strong>
                  </span>
                </div>
                <p class="text-xs text-secondary">{row.explanation}</p>
              </div>

              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onOpenTopic(row.subjectId, row.topicId)}
                >
                  Abrir ficha
                </Button>
                {onRequestPlanAdjustmentPreview &&
                  (row.combinedActionLabel === 'Priorizar' ||
                    row.combinedActionLabel === 'Praticar') && (
                    <Button
                      variant="tonal"
                      size="small"
                      onClick={() => onRequestPlanAdjustmentPreview(row.subjectId, row.topicId)}
                    >
                      Prévia de ajuste
                    </Button>
                  )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
