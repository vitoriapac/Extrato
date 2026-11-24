import { useEffect, useRef, useState } from 'preact/hooks';
import { suggestReviewRating } from '../../domain/reviews.js';
import { BottomSheet } from '../primitives/bottom-sheet.js';
import { Button } from '../primitives/button.js';
import { Icon, type IconName } from '../primitives/icon.js';

export type ReviewRatingKey = 'again' | 'hard' | 'good' | 'easy';

/** Questões resolvidas durante a revisão; viram um registro de questões do tópico. */
export interface ReviewPractice {
  resolved: number;
  correct: number;
  retry: boolean;
}

export interface ReviewRatingSheetProps {
  open: boolean;
  topicLabel?: string;
  restoreFocusOnClose?: boolean;
  /** Meta de acerto da disciplina, usada para sugerir a avaliação. */
  accuracyTarget?: number;
  onRate: (rating: ReviewRatingKey, practice: ReviewPractice | null) => void;
  onCancel: () => void;
}

const RATING_OPTIONS: ReadonlyArray<{
  key: ReviewRatingKey;
  label: string;
  hint: string;
  icon: IconName;
  primary?: boolean;
}> = [
  { key: 'again', label: 'Errei', hint: 'rever amanhã', icon: 'circle-x' },
  { key: 'hard', label: 'Difícil', hint: 'intervalo menor', icon: 'alert-triangle' },
  { key: 'good', label: 'Bom', hint: 'intervalo normal', icon: 'circle-check', primary: true },
  { key: 'easy', label: 'Fácil', hint: 'intervalo maior', icon: 'bolt' },
];

export function ReviewRatingSheet({
  open,
  topicLabel = '',
  restoreFocusOnClose = true,
  accuracyTarget = 70,
  onRate,
  onCancel,
}: ReviewRatingSheetProps) {
  const goodButtonRef = useRef<HTMLButtonElement | null>(null);
  const [resolved, setResolved] = useState('');
  const [correct, setCorrect] = useState('');
  const [retry, setRetry] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Cada revisão começa sem questões: o bloco é opcional.
    setResolved('');
    setCorrect('');
    setRetry(false);
    goodButtonRef.current?.focus();
  }, [open]);

  const resolvedCount = Math.max(0, Math.floor(Number(resolved) || 0));
  const correctCount = Math.min(resolvedCount, Math.max(0, Math.floor(Number(correct) || 0)));
  const suggestion = suggestReviewRating(resolvedCount, correctCount, accuracyTarget);
  const practice: ReviewPractice | null = resolvedCount
    ? { resolved: resolvedCount, correct: correctCount, retry }
    : null;
  const suggestedLabel = suggestion
    ? RATING_OPTIONS.find(option => option.key === suggestion.rating)?.label
    : null;

  const description = topicLabel
    ? `Tópico: ${topicLabel}. Seu resultado define quando este tópico deve aparecer novamente.`
    : 'Seu resultado define quando este tópico deve aparecer novamente.';

  return (
    <BottomSheet
      id="reviewRatingOverlay"
      open={open}
      onClose={onCancel}
      restoreFocusOnClose={restoreFocusOnClose}
      maxWidth="md"
      title="Como foi esta revisão?"
      description={description}
      footer={
        <Button id="reviewRatingCancelBtn" variant="ghost" size="small" onClick={onCancel}>
          Cancelar
        </Button>
      }
    >
      <fieldset class="review-practice">
        <legend>Revisou resolvendo questões? (opcional)</legend>
        <label>
          Resolvidas
          <input
            id="reviewPracticeResolved"
            type="number"
            min="0"
            inputMode="numeric"
            value={resolved}
            onInput={event => setResolved((event.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Acertos
          <input
            id="reviewPracticeCorrect"
            type="number"
            min="0"
            max={resolvedCount || undefined}
            inputMode="numeric"
            value={correct}
            onInput={event => setCorrect((event.target as HTMLInputElement).value)}
          />
        </label>
        <label class="review-practice__check">
          <input
            type="checkbox"
            checked={retry}
            onChange={event => setRetry((event.target as HTMLInputElement).checked)}
          />{' '}
          Já resolvidas antes
        </label>
        <small aria-live="polite">
          {suggestion
            ? `Acerto de ${suggestion.accuracy}%: sugestão ${suggestedLabel}. As questões entram no tópico.`
            : 'As questões entram no tópico e alimentam Domínio e Retenção.'}
        </small>
      </fieldset>
      <div class="review-rating-actions grid grid-cols-2 sm:grid-cols-4 gap-2 m-0">
        {RATING_OPTIONS.map(option => (
          <Button
            key={option.key}
            ref={
              option.key === 'good'
                ? el => {
                    goodButtonRef.current = el;
                  }
                : undefined
            }
            variant={
              (suggestion ? suggestion.rating === option.key : option.primary)
                ? 'primary'
                : 'secondary'
            }
            data-review-rating={option.key}
            onClick={() => onRate(option.key, practice)}
            className="flex-col items-center justify-center gap-1 py-3 px-2 h-auto text-center"
          >
            <Icon name={option.icon} size={16} class="shrink-0" />
            <span>{option.label}</span>
            <small class="text-xs opacity-75">{option.hint}</small>
          </Button>
        ))}
      </div>
    </BottomSheet>
  );
}
