export function renderCollectionFooter({total,visible,showMoreAction,showLessAction,colspan,label}){
  if(total<=visible&&visible<=0)return '';
  const shown=Math.min(total,visible);
  if(total<=shown&&shown<=0)return '';
  return `<tr class="list-view-footer"><td colspan="${colspan}"><div class="list-view-controls">
    <span class="list-view-count">Exibindo ${shown} de ${total} ${label}</span>
    ${shown<total?`<button class="btn ghost small" type="button" data-delegated-click="${showMoreAction}">Mostrar mais</button>`:''}
    ${shown>0&&showLessAction?`<button class="btn ghost small" type="button" data-delegated-click="${showLessAction}">Mostrar menos</button>`:''}
  </div></td></tr>`;
}

export function renderGroupHeader({title,count,tone='neutral',expanded=true,toggleAction='',colspan=8}){
  const content=`<span class="review-group-title">${title}</span><span class="review-group-meta"><span class="count-badge">${count}</span>${toggleAction?`<span class="review-group-chevron" aria-hidden="true">›</span>`:''}</span>`;
  return `<tr class="review-group-row ${tone}"><td colspan="${colspan}">${toggleAction?`<button type="button" class="review-group-header" aria-expanded="${expanded}" data-delegated-click="${toggleAction}">${content}</button>`:`<div class="review-group-header static">${content}</div>`}</td></tr>`;
}
