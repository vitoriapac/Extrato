export const escapePresentationText=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const escape=escapePresentationText;

// Shared HTML for editorial headings and empty states. Data stays with the caller.
export function renderSectionHeader({title,description='',eyebrow='',level=3,compact=false,className='',period=''}={}){
  const heading=`h${Math.max(2,Math.min(6,Number(level)||3))}`;
  return `<header class="module-heading${compact?' module-heading--compact':''}${className?' '+escape(className):''}">${eyebrow?`<span class="module-heading__eyebrow">${escape(eyebrow)}</span>`:''}<${heading} class="module-heading__title">${escape(title)}</${heading}>${description?`<p class="module-heading__description">${escape(description)}</p>`:''}${period?`<p class="chart-frame__period">Período: ${escape(period)}</p>`:''}</header>`;
}

export function renderEmptyState({title,message='',className=''}={}){
  return `<div class="empty-state empty-state--compact${className?' '+escape(className):''}" role="status"><strong>${escape(title)}</strong>${message?`<p>${escape(message)}</p>`:''}</div>`;
}

export function renderMetricCard({label,value,detail=''}={}){
  return `<article class="performance-kpi ui-metric"><span>${escape(label)}</span><strong>${escape(value)}</strong>${detail?`<small>${escape(detail)}</small>`:''}</article>`;
}
