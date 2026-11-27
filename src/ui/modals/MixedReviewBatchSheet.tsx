import { useEffect, useState } from 'preact/hooks';
import type {
  MixedReviewBatch,
  WeeklyReviewBudgetEvaluation,
} from '../../domain/reviews/mixed-review-batch.js';
import { suggestReviewRating } from '../../domain/reviews.js';
import { BottomSheet } from '../primitives/bottom-sheet.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';
import type { ReviewRatingKey } from './ReviewRatingSheet.js';

export interface MixedReviewBudgetPanelProps {
  batches: MixedReviewBatch[];
  budget: WeeklyReviewBudgetEvaluation;
  orcamentoRevisaoPct: number | null | undefined;
  onChangeBudgetPct: (value: string) => void;
  onOpenBatch: (batch: MixedReviewBatch) => void;
}

export function MixedReviewBudgetPanel({
  batches,
  budget,
  orcamentoRevisaoPct,
  onChangeBudgetPct,
  onOpenBatch,
}: MixedReviewBudgetPanelProps) {
  return (
    <div class="space-y-2" data-testid="mixed-review-budget-panel">
      <div class="p-3 rounded-default border border-border-default bg-surface-card flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <Icon name="clock" size={14} class="text-content-secondary shrink-0" />
          <span>
            Orçamento semanal de revisão:{' '}
            {budget.budgetMinutes > 0 ? (
              <>
                <strong class="font-mono tabular-nums">{budget.usedMinutes}</strong> de{' '}
                <strong class="font-mono tabular-nums">{budget.budgetMinutes} min</strong>{' '}
                (teto <span class="font-mono tabular-nums">{budget.budgetPct}%</span>)
              </>
            ) : (
              <>
                teto <strong class="font-mono tabular-nums">{budget.budgetPct}%</strong> da carga semanal
              </>
            )}
          </span>
          {budget.exceeded && (
            <span class="status-badge status-badge--warning" role="status">
              Acima do teto — prefira bateria mista por questões
            </span>
          )}
        </div>
        <label htmlFor="weeklyReviewBudgetSelect" class="flex items-center gap-1.5">
          <span class="text-content-secondary">Teto:</span>
          <select
            id="weeklyReviewBudgetSelect"
            aria-label="Teto semanal de revisão em porcentagem"
            class="select-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
            value={orcamentoRevisaoPct != null ? String(orcamentoRevisaoPct) : ''}
            onChange={e => onChangeBudgetPct(e.currentTarget.value)}
          >
            <option value="">Padrão (25%)</option>
            <option value="15">15%</option>
            <option value="20">20%</option>
            <option value="25">25%</option>
            <option value="30">30%</option>
            <option value="35">35%</option>
            <option value="40">40%</option>
          </select>
        </label>
      </div>

      {batches.length > 0 && (
        <div class="space-y-2" data-testid="mixed-review-batches">
          {batches.map(batch => (
            <div
              key={batch.subjectId}
              class="p-3 rounded-default border border-border-default bg-surface-subtle flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <Icon name="cards" size={16} class="shrink-0 text-content-secondary" />
                <span>
                  Você tem <strong class="font-mono tabular-nums">{batch.count} revisões</strong> de{' '}
                  <strong>{batch.subjectName}</strong> — Quitar em 1 bateria mista (
                  <span class="font-mono tabular-nums">{batch.recommendedQuestions} questões · ~{batch.estimatedMinutes} min</span>)
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="small"
                data-testid={`open-mixed-review-batch-${batch.subjectId}`}
                onClick={() => onOpenBatch(batch)}
              >
                Quitar em bateria mista
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface MixedReviewBatchSheetProps {
  open: boolean;
  batch: MixedReviewBatch | null;
  accuracyTarget?: number;
  onConfirm: (payload: {
    batch: MixedReviewBatch;
    resolved: number;
    correct: number;
    ratingsByReviewId: Record<string, ReviewRatingKey>;
  }) => void;
  onCancel: () => void;
}

const RATING_LABELS: Record<ReviewRatingKey, string> = {
  again: 'Errei (rever amanhã)',
  hard: 'Difícil',
  good: 'Bom',
  easy: 'Fácil',
};

export function MixedReviewBatchSheet({
  open,
  batch,
  accuracyTarget = 70,
  onConfirm,
  onCancel,
}: MixedReviewBatchSheetProps) {
  const [resolved, setResolved] = useState('');
  const [correct, setCorrect] = useState('');
  const [batchRating, setBatchRating] = useState<ReviewRatingKey>('good');
  const [overrides, setOverrides] = useState<Record<string, ReviewRatingKey | ''>>({});

  useEffect(() => {
    if (!open || !batch) return;
    setResolved('');
    setCorrect('');
    setBatchRating('good');
    setOverrides({});
  }, [open, batch?.subjectId, batch?.count]);

  const resolvedCount = Math.max(0, Math.floor(Number(resolved) || 0));
  const correctCount = Math.min(resolvedCount, Math.max(0, Math.floor(Number(correct) || 0)));
  const suggestion = suggestReviewRating(resolvedCount, correctCount, accuracyTarget);
  const effectiveDefaultRating: ReviewRatingKey = suggestion?.rating || batchRating;

  const handleConfirm = () => {
    if (!batch) return;
    const ratingsByReviewId: Record<string, ReviewRatingKey> = {};
    for (const item of batch.items) {
      const custom = overrides[item.id];
      ratingsByReviewId[item.id] = custom || effectiveDefaultRating;
    }
    onConfirm({
      batch,
      resolved: resolvedCount,
      correct: correctCount,
      ratingsByReviewId,
    });
  };

  return (
    <BottomSheet
      id="mixedReviewBatchOverlay"
      open={open}
      onClose={onCancel}
      maxWidth="lg"
      className={open ? 'show' : ''}
      title={batch ? `Bateria mista — ${batch.subjectName}` : 'Bateria mista de revisão'}
      titleId="mixedReviewBatchTitle"
      description={
        batch
          ? `${batch.count} revisões pendentes reunidas em uma bateria sugerida de ${batch.recommendedQuestions} questões (~${batch.estimatedMinutes} min).`
          : ''
      }
      descriptionId="mixedReviewBatchDesc"
      footer={
        <>
          <Button variant="ghost" id="mixedBatchCancelBtn" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" id="mixedBatchConfirmBtn" onClick={handleConfirm}>
            <Icon name="check" size={14} class="icon-inline" />
            Quitar lote ({batch?.count || 0})
          </Button>
        </>
      }
    >
      {batch && (
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label htmlFor="mixedBatchResolved" class="flex flex-col gap-1 text-xs">
              <span>Questões na bateria mista (opcional)</span>
              <input
                id="mixedBatchResolved"
                type="number"
                min={0}
                inputMode="numeric"
                class="min-h-control px-2.5 py-1.5 rounded border border-border-default bg-surface-card text-content-primary text-sm"
                placeholder={`Ex.: ${batch.recommendedQuestions}`}
                value={resolved}
                onInput={e => setResolved(e.currentTarget.value)}
              />
            </label>
            <label htmlFor="mixedBatchCorrect" class="flex flex-col gap-1 text-xs">
              <span>Acertos</span>
              <input
                id="mixedBatchCorrect"
                type="number"
                min={0}
                max={resolvedCount || undefined}
                inputMode="numeric"
                class="min-h-control px-2.5 py-1.5 rounded border border-border-default bg-surface-card text-content-primary text-sm"
                placeholder="Quantidade"
                disabled={!resolvedCount}
                value={correct}
                onInput={e => setCorrect(e.currentTarget.value)}
              />
            </label>
          </div>

          <div class="p-3 rounded-default border border-border-subtle bg-surface-subtle text-xs flex flex-wrap items-center justify-between gap-2">
            {suggestion ? (
              <span>
                Aproveitamento do lote: <strong>{suggestion.accuracy}%</strong> · Avaliação sugerida:{' '}
                <strong>{RATING_LABELS[suggestion.rating]}</strong>
              </span>
            ) : (
              <label htmlFor="mixedBatchDefaultRating" class="flex items-center gap-2">
                <span>Avaliação padrão para o lote:</span>
                <select
                  id="mixedBatchDefaultRating"
                  class="select-control min-h-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
                  value={batchRating}
                  onChange={e => setBatchRating(e.currentTarget.value as ReviewRatingKey)}
                >
                  {Object.entries(RATING_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div class="space-y-2">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-content-secondary m-0">
              Tópicos incluídos no lote
            </h4>
            <ul class="space-y-1.5 m-0 p-0 list-none max-h-60 overflow-y-auto">
              {batch.items.map(item => (
                <li
                  key={item.id}
                  class="flex flex-wrap items-center justify-between gap-2 p-2 rounded border border-border-subtle bg-surface-card text-xs"
                >
                  <div class="min-w-0 flex-1">
                    <strong class="block truncate text-content-primary">{item.topicName}</strong>
                    <span class="text-content-secondary">
                      {item.type} · {item.isOverdue ? 'Atrasada' : 'Para hoje'} ({item.date})
                    </span>
                  </div>
                  <select
                    aria-label={`Avaliação para ${item.topicName}`}
                    data-batch-topic-rating={item.id}
                    class="select-control text-xs py-1 px-2 rounded border border-border-default bg-surface-card text-content-primary"
                    value={overrides[item.id] || ''}
                    onChange={e =>
                      setOverrides({
                        ...overrides,
                        [item.id]: e.currentTarget.value as ReviewRatingKey | '',
                      })
                    }
                  >
                    <option value="">Padrão ({RATING_LABELS[effectiveDefaultRating]})</option>
                    {Object.entries(RATING_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
