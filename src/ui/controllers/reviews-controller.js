export function createReviewsController({root=document,actions}={}){
  if(!root||!actions)throw new TypeError('Controlador de revisões requer interface e ações.');
  const listen=(selector,event,handler)=>root.querySelector(selector)?.addEventListener(event,handler);
  return Object.freeze({
    register(){
      root.querySelectorAll('[data-review-rating]').forEach(button=>button.addEventListener('click',()=>actions.rate(button.dataset.reviewRating)));
      listen('#reviewRatingCancelBtn','click',actions.cancelRating);
      for(const id of ['#agendaFilterSubject','#agendaFilterStatus','#agendaFilterMes','#agendaFilterTipo'])listen(id,'change',actions.filtersChanged);
      listen('#addAgendaRowBtn','click',actions.createManual);
      listen('#autoGenBtn','click',actions.generateAutomatic);
    }
  });
}
