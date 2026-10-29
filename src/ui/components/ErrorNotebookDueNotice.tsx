import { Button } from '../primitives/button.js';

export interface ErrorNotebookDueNoticeProps {
  /** Cartões do Caderno de Erros vencidos ou ainda não revisados na data atual. */
  dueCount: number;
  onOpen?: () => void;
}

/**
 * Aviso secundário de revisão do Caderno de Erros. Não compete com a próxima ação principal:
 * some quando não há cartões e leva ao deck com um único clique.
 */
export function ErrorNotebookDueNotice({ dueCount, onOpen }: ErrorNotebookDueNoticeProps) {
  if (!Number.isFinite(dueCount) || dueCount <= 0) return null;
  const label = dueCount === 1 ? '1 flashcard para revisar' : `${dueCount} flashcards para revisar`;
  return (
    <div
      class="error-notebook-due flex flex-wrap items-center justify-between gap-2 rounded-default border border-border-default bg-surface-card px-3 py-2 text-xs"
      role="status"
      data-testid="error-notebook-due"
    >
      <span class="text-primary">
        <strong>Caderno de Erros:</strong> {label}
      </span>
      <Button variant="secondary" size="small" onClick={onOpen}>
        Revisar agora
      </Button>
    </div>
  );
}
