import type { buildTodayReviewLoad } from '../../application/reviews/build-today-review-load.js';
import { Button } from '../primitives/button.js';

type Load = ReturnType<typeof buildTodayReviewLoad>;

/** One review queue on Today: topic reviews and flashcards in minutes, against a daily cap. */
export function TodayReviewQueueCard({
  load,
  formatMinutes,
  onTopics,
  onFlashcards,
}: {
  load: Load;
  formatMinutes: (minutes: number) => string;
  onTopics: () => void;
  onFlashcards: () => void;
}) {
  if (!load.topicCount && !load.flashcardCount) return null;
  return (
    <section
      aria-label="Revisão de hoje"
      class="today-review-queue rounded-default border border-border-default bg-surface-card px-3 py-2 text-xs space-y-2"
      data-over-cap={load.overCap ? 'true' : 'false'}
    >
      <p class="m-0 text-content-primary">
        <strong>Revisão de hoje: {formatMinutes(load.totalMinutes)}</strong>
        {load.capMinutes != null && (
          <span class="text-content-secondary">
            {' '}
            · teto {formatMinutes(load.capMinutes)} ({load.budgetPct}% da meta do dia)
          </span>
        )}
      </p>
      {load.topicCount > 0 && (
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span>
            {load.topicCount === 1
              ? '1 revisão de tópico'
              : `${load.topicCount} revisões de tópico`}{' '}
            · {formatMinutes(load.topicMinutes)}
            {load.overdueTopics > 0 &&
              ` · ${load.overdueTopics} atrasada${load.overdueTopics === 1 ? '' : 's'}`}
          </span>
          <Button variant="secondary" size="small" onClick={onTopics}>
            Ver na Agenda
          </Button>
        </div>
      )}
      {load.flashcardCount > 0 && (
        <div
          class="flex flex-wrap items-center justify-between gap-2"
          data-testid="error-notebook-due"
        >
          <span>
            {load.flashcardCount === 1 ? '1 flashcard' : `${load.flashcardCount} flashcards`} ·{' '}
            {formatMinutes(load.flashcardMinutes)}
          </span>
          <Button variant="secondary" size="small" onClick={onFlashcards}>
            Revisar agora
          </Button>
        </div>
      )}
      {load.overCap && (
        <p class="text-content-secondary m-0" role="status">
          Hoje cabem {formatMinutes(load.capMinutes!)} de revisão. Comece pelas de maior peso; o
          resto entra nos próximos dias.
        </p>
      )}
    </section>
  );
}
