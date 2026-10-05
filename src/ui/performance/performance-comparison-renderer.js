import {renderInsightCard,renderTrendIndicator} from '../components/analytical-presentation.js';
const labels={improved:'Melhorou',worsened:'Piorou',stable:'Estável',insufficient:'Amostra insuficiente'};
const shown=(row,value)=>value==null?'—':row.unit==='min'?`${Math.floor(value/60)}h ${Math.round(value%60)}min`:row.unit==='questões'?String(value):`${value}%`;
const delta=row=>row.delta==null?'—':`${row.delta>0?'+':''}${row.delta} ${row.unit}`;

export function renderPerformanceComparison(model,{escapeHtml}={}){
  if(model.state==='disabled')return '<section class="performance-block"><h3>Comparação de períodos</h3><p class="analytics-note">Escolha 7, 30 ou 90 dias e ative a comparação para ver dois intervalos de mesma duração.</p></section>';
  const rows=model.rows.map(row=>`<tr><th scope="row">${escapeHtml(row.label)}</th><td>${shown(row,row.before)}</td><td>${shown(row,row.after)}</td><td>${row.state==='insufficient'?'—':delta(row)}</td><td>${renderTrendIndicator({label:labels[row.state],state:row.state,className:'performance-comparison-state'})}</td></tr>`).join('');
  return `<section class="performance-block"><h3>Período atual × anterior</h3><p class="analytics-note">Períodos de mesma duração. Indicadores sem base suficiente ficam sem classificação.</p><details class="performance-comparison-method"><summary>Critérios da comparação</summary><p>A precisão exige 30 questões em cada período; a aderência exige ao menos 60 minutos planejados em cada um.</p></details><div class="performance-table-scroll"><table class="performance-comparison-table"><caption>Indicadores dos dois períodos de mesma duração</caption><thead><tr><th>Indicador</th><th>Anterior</th><th>Atual</th><th>Diferença</th><th>Leitura</th></tr></thead><tbody>${rows}</tbody></table></div><h4>O que os dados sugerem</h4><ul class="performance-insights">${model.insights.map(text=>renderInsightCard({text,tag:'li'})).join('')}</ul></section>`;
}
