import { useEffect, useRef } from 'preact/hooks';
import { BottomSheet } from '../primitives/bottom-sheet.js';
import { Button } from '../primitives/button.js';
import { Icon, type IconName } from '../primitives/icon.js';

export type ReviewRatingKey = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewRatingSheetProps {
  open: boolean;
  topicLabel?: string;
  restoreFocusOnClose?: boolean;
  onRate: (rating: ReviewRatingKey) => void;
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
  onRate,
  onCancel,
}: ReviewRatingSheetProps) {
  const goodButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    goodButtonRef.current?.focus();
  }, [open]);

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
            variant={option.primary ? 'primary' : 'secondary'}
            data-review-rating={option.key}
            onClick={() => onRate(option.key)}
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
