import {renderPerformanceDetails} from './performance-story.js';
import {renderAdherenceAnalysis} from '../renderers/adherence-renderer.js';

export function renderPerformanceConsistency(model,{range,formatDate,escapeHtml}={}){
  const cells=model.heatmap.map(day=>{const level=day.minutes===0?0:day.minutes<30?1:day.minutes<90?2:3;return `<span class="performance-heatmap-day level-${level}" role="img" title="${escapeHtml(formatDate(day.date))}: ${day.minutes} min" aria-label="${escapeHtml(formatDate(day.date))}: ${day.minutes} minutos estudados">${day.minutes>0?'●':'·'}</span>`}).join('');
  const heatmap=`<section class="performance-block"><h3>Calendário de estudo</h3><p class="analytics-note">${model.heatmapLimited?'Últimos 90 dias do período.':'Dias do período.'} Cada dia informa os minutos em texto acessível.</p><div class="performance-heatmap" role="group" aria-label="Minutos estudados por dia">${cells}</div></section>`;
  return `${renderAdherenceAnalysis(model.adherenceAnalysis,{formatDate,escapeHtml})}${renderPerformanceDetails('Calendário de estudo',heatmap)}`;
}
