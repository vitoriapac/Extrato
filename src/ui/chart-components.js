const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

export function renderChartTooltip(text){return `<title>${escape(text)}</title>`}

export function renderChartLegend(items=[]){
  return items.length?`<ul class="chart-frame__legend" aria-label="Legenda">${items.map(item=>`<li><span class="chart-frame__swatch chart-frame__swatch--${['primary','secondary','target'].includes(item.tone)?item.tone:'primary'}" aria-hidden="true"></span>${escape(item.label)}</li>`).join('')}</ul>`:'';
}

export function renderChartEmptyState(message='Ainda não há dados suficientes para este gráfico.'){
  return `<div class="empty-state empty-state--compact chart-frame__empty" role="status"><strong>Gráfico aguardando dados</strong><p>${escape(message)}</p></div>`;
}

// Only chart and records contain renderer-owned HTML; all metadata is escaped here.
// Keep existing filter controls outside the frame: they own the query and its events.
export function renderChartFrame({title,description='',period='',evidence='',legend=[],chart='',records='',emptyMessage=''}={}){
  return `<section class="chart-frame" aria-label="${escape(title)}"><header class="module-heading module-heading--compact chart-frame__header"><h4 class="module-heading__title">${escape(title)}</h4>${description?`<p class="module-heading__description">${escape(description)}</p>`:''}${period?`<p class="chart-frame__period">Período: ${escape(period)}</p>`:''}</header>${renderChartLegend(legend)}<div class="chart-frame__plot">${chart||renderChartEmptyState(emptyMessage)}</div>${evidence?`<p class="chart-frame__evidence">${escape(evidence)}</p>`:''}${records?`<div class="chart-frame__records">${records}</div>`:''}</section>`;
}
