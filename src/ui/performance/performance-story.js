export function renderPerformanceStory({title,summary,details=[]},escapeHtml){
  return `<section class="performance-story" aria-label="Leitura principal"><span class="performance-story__eyebrow">O que observar</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary)}</p>${details.length?`<ul>${details.slice(0,3).map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`:''}</section>`;
}

export function renderPerformanceSummary(story,metrics,note=''){
  return `<section class="performance-summary" aria-label="Resumo interpretativo">${story}${metrics}${note}</section>`;
}

export function renderPerformanceDetails(title,content){
  return `<details class="performance-details"><summary>${title}</summary><div class="performance-details__body">${content}</div></details>`;
}
