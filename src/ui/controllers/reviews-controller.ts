export function createReviewsController({ root = document, actions }: any = {}) {
  if (!root || !actions) throw new TypeError('Controlador de revisões requer interface e ações.');
  const listen = (selector: string, event: string, handler: (event: any) => void) =>
    root.querySelector(selector)?.addEventListener(event, handler);
  return Object.freeze({
    register() {
      if (!root.querySelector?.('#reviewRatingMount')) {
        root
          .querySelectorAll('[data-review-rating]')
          .forEach((button: any) =>
            button.addEventListener('click', () => actions.rate(button.dataset.reviewRating))
          );
        listen('#reviewRatingCancelBtn', 'click', actions.cancelRating);
      }
      const filterIds = root.querySelector?.('#agendaFilterSubjectMount')
        ? ['#agendaFilterStatus', '#agendaFilterMes', '#agendaFilterTipo']
        : ['#agendaFilterSubject', '#agendaFilterStatus', '#agendaFilterMes', '#agendaFilterTipo'];
      for (const id of filterIds) listen(id, 'change', actions.filtersChanged);
      listen('#addAgendaRowBtn', 'click', actions.createManual);
      listen('#autoGenBtn', 'click', actions.generateAutomatic);
    },
  });
}
