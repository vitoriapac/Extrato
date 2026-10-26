export function createReviewsController({ root = document, actions }: any = {}) {
  if (!root || !actions) throw new TypeError('Controlador de revisões requer interface e ações.');
  const listen = (selector: string, event: string, handler: (event: any) => void) =>
    root.querySelector(selector)?.addEventListener(event, handler);
  return Object.freeze({
    register() {
      root
        .querySelectorAll('[data-review-rating]')
        .forEach((button: any) =>
          button.addEventListener('click', () => actions.rate(button.dataset.reviewRating))
        );
      listen('#reviewRatingCancelBtn', 'click', actions.cancelRating);
      for (const id of [
        '#agendaFilterSubject',
        '#agendaFilterStatus',
        '#agendaFilterMes',
        '#agendaFilterTipo',
      ])
        listen(id, 'change', actions.filtersChanged);
      listen('#addAgendaRowBtn', 'click', actions.createManual);
      listen('#autoGenBtn', 'click', actions.generateAutomatic);
    },
  });
}
