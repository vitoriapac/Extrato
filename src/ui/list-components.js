export function renderCollectionFooter({total,visible,step=0,showMoreAction='',showAllAction='',showLessAction='',colspan=1,label='itens',variant='table'}){
  if(total<=visible&&visible<=0)return '';
  const shown=Math.min(total,visible);
  if(total<=shown&&shown<=0)return '';
  if(step>0&&total<=shown&&shown<=step)return '';
  const controls=`<div class="list-view-controls">
    <span class="list-view-count">Exibindo ${shown} de ${total} ${label}</span>
    ${shown<total&&(showAllAction||showMoreAction)?`<button class="progressive-list-toggle" type="button" aria-expanded="false" data-progressive-legacy data-delegated-click="${showAllAction||showMoreAction}">Mostrar mais · +${total-shown} ↓</button>`:''}
    ${shown>=total&&showLessAction?`<button class="progressive-list-toggle" type="button" aria-expanded="true" data-progressive-legacy data-delegated-click="${showLessAction}">Mostrar menos ↑</button>`:''}
  </div>`;
  return variant==='block'?`<div class="list-summary-footer">${controls}</div>`:`<tr class="list-view-footer"><td colspan="${colspan}">${controls}</td></tr>`;
}

export function renderGroupHeader({title,count,tone='neutral',expanded=true,toggleAction='',colspan=8}){
  const content=`<span class="review-group-title">${title}</span><span class="review-group-meta"><span class="count-badge">${count}</span>${toggleAction?`<span class="review-group-chevron" aria-hidden="true">›</span>`:''}</span>`;
  return `<tr class="review-group-row ${tone}"><td colspan="${colspan}">${toggleAction?`<button type="button" class="review-group-header" aria-expanded="${expanded}" data-delegated-click="${toggleAction}">${content}</button>`:`<div class="review-group-header static">${content}</div>`}</td></tr>`;
}
