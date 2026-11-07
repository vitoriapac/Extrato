import type { buildReviewQueueSummary } from '../../application/reviews/build-review-queue-summary.js';
import { Button } from '../primitives/button.js';

type Summary = ReturnType<typeof buildReviewQueueSummary>;
const dateLabel = (date: string | null) => date ? date.split('-').reverse().join('/') : 'nenhuma data futura';

export function ReviewQueueSummary({ summary, onTopics, onFlashcards }: {
  summary: Summary;
  onTopics: () => void;
  onFlashcards: () => void;
}) {
  return (
    <section aria-label="Próximas revisões" class="border border-border-default bg-surface-card rounded-default p-3 mb-3">
      <h3 class="text-content-primary">Próximas revisões</h3>
      <p class="text-content-secondary">Resumo geral, independente dos filtros. Tópicos e flashcards têm agendamentos separados, e as tarefas de estudo não entram aqui.</p>
      <p>Revisões de tópicos: <strong>{summary.topicsDue}</strong> para hoje ou atrasadas · Próxima data futura: {dateLabel(summary.topicsNext)}.</p>
      <Button variant="secondary" size="touch" onClick={onTopics}>Ver revisões de tópicos</Button>
      <div data-testid="error-notebook-due">
        <p>{summary.flashcardsDue} {summary.flashcardsDue === 1 ? 'flashcard para revisar' : 'flashcards para revisar'} hoje ou atrasados · Próxima data futura: {dateLabel(summary.flashcardsNext)}.</p>
        <Button variant="secondary" size="touch" onClick={onFlashcards}>{summary.flashcardsDue ? 'Revisar agora' : 'Abrir Caderno de Erros'}</Button>
      </div>
    </section>
  );
}
