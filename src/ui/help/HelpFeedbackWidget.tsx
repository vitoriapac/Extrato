import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  getTopicFeedback,
  saveTopicFeedback,
  clearTopicFeedback,
} from '../../domain/help/help-feedback.js';

export interface HelpFeedbackWidgetProps {
  topicId: string;
  topicTitle?: string;
  storage?: Storage;
}

export function HelpFeedbackWidget({
  topicId,
  topicTitle,
  storage,
}: HelpFeedbackWidgetProps): JSX.Element {
  const effectiveStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  useEffect(() => {
    if (effectiveStorage && topicId) {
      setFeedback(getTopicFeedback(effectiveStorage, topicId));
    }
  }, [topicId, effectiveStorage]);

  const handleVote = (helpful: boolean) => {
    setFeedback(helpful);
    if (effectiveStorage && topicId) {
      saveTopicFeedback(effectiveStorage, topicId, helpful);
    }
  };

  const handleReset = () => {
    setFeedback(null);
    if (effectiveStorage && topicId) {
      clearTopicFeedback(effectiveStorage, topicId);
    }
  };

  if (feedback !== null) {
    return (
      <div
        class="mt-3 flex items-center justify-between rounded-default border border-border/60 bg-surface-subtle/50 px-3 py-2 text-xs text-text-muted"
        role="status"
        aria-live="polite"
      >
        <span class="flex items-center gap-1.5 font-medium text-text">
          <span>✓</span>
          <span>
            {feedback
              ? 'Obrigado! Ficamos felizes que esta explicação ajudou.'
              : 'Obrigado pelo retorno. Vamos aprimorar esta explicação.'}
          </span>
        </span>
        <button
          type="button"
          onClick={handleReset}
          class="text-xs text-text-muted hover:text-text underline ml-2 transition-colors cursor-pointer"
          aria-label={`Alterar avaliação de ${topicTitle || topicId}`}
        >
          Desfazer
        </button>
      </div>
    );
  }

  return (
    <div
      class="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-text-muted"
      data-testid={`help-feedback-${topicId}`}
    >
      <span class="font-medium text-text-muted">Esta explicação foi útil?</span>
      <div
        class="inline-flex items-center gap-1.5"
        role="group"
        aria-label="Avaliar utilidade da instrução"
      >
        <button
          type="button"
          onClick={() => handleVote(true)}
          class="inline-flex items-center gap-1 rounded-default border border-border bg-surface px-2 py-1 pointer-coarse:min-h-11 pointer-coarse:px-3 text-xs font-medium text-text transition-colors hover:bg-surface-muted hover:border-primary/40 cursor-pointer"
          aria-label={`Sim, a explicação sobre ${topicTitle || topicId} foi útil`}
        >
          <span>👍</span>
          <span>Sim</span>
        </button>
        <button
          type="button"
          onClick={() => handleVote(false)}
          class="inline-flex items-center gap-1 rounded-default border border-border bg-surface px-2 py-1 pointer-coarse:min-h-11 pointer-coarse:px-3 text-xs font-medium text-text transition-colors hover:bg-surface-muted hover:border-danger/40 cursor-pointer"
          aria-label={`Não, a explicação sobre ${topicTitle || topicId} precisa melhorar`}
        >
          <span>👎</span>
          <span>Não</span>
        </button>
      </div>
    </div>
  );
}
