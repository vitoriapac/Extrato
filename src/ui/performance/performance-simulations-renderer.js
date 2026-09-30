import {renderSimulationTrendChart} from '../renderers/simulations-renderer.js';
import {renderSimulationComparison} from '../renderers/simulation-comparison-renderer.js';
import {renderProjectionCalibration} from '../renderers/projection-calibration-renderer.js';
import {renderPerformanceStory,renderPerformanceDetails} from './performance-story.js';

const percent=value=>value==null?'—':`${value}%`;
const signed=value=>value==null?'Sem comparação':`${value>0?'+':''}${value} p.p.`;

export function renderPerformanceSimulations(model,{range,targetScore,formatDate,escapeHtml}={}){
  if(!model.count)return '<div class="empty-state empty-state--compact" role="status"><strong>Sem simulados neste período</strong><p>Registre simulados para acompanhar as notas. Duas provas com disciplinas detalhadas em comum permitem a comparação por disciplina.</p><button type="button" class="btn ghost small" data-performance-open="questoes">Registrar simulado</button></div>';
  const kpis=`<section class="performance-kpis" aria-label="Indicadores de simulados">
    <article class="performance-kpi"><span>Último simulado</span><strong>${percent(model.latest)}</strong><small>${model.count} simulados no período</small></article>
    <article class="performance-kpi"><span>Média</span><strong>${percent(model.mean)}</strong><small>${range.comparePrevious&&model.previousMean!=null&&model.mean!=null?signed(Math.round((model.mean-model.previousMean)*10)/10)+' frente ao período anterior':'Cada simulado tem o mesmo peso'}</small></article>
    <article class="performance-kpi"><span>Melhor resultado</span><strong>${percent(model.best)}</strong><small>No período selecionado</small></article>
    <article class="performance-kpi"><span>Tendência recente</span><strong>${signed(model.trend)}</strong><small>Último × penúltimo simulado</small></article>
  </section>`;
  const chart=renderSimulationTrendChart({items:model.items.slice(-12),scoreFor:item=>Math.round(item.correct/item.total*1000)/10,formatDate,escapeHtml,targetScore});
  const comparison=renderSimulationComparison(model.comparison,{formatDate,escapeHtml});
  const calibration=renderProjectionCalibration(model.calibration);
  return `${renderPerformanceStory({title:'Resultado dos simulados',summary:`Último resultado: ${percent(model.latest)} em ${model.count} simulado(s) no período.`,details:[model.trend==null?'Tendência recente sem base comparável.':`Variação recente: ${signed(model.trend)}.`]},escapeHtml)}${kpis}<p class="performance-method-note">Resultados de provas com composição ou dificuldade diferentes não são diretamente equivalentes. A comparação por disciplina mostra somente áreas detalhadas em ambas as provas.</p><section class="performance-block"><h3>Evolução dos simulados</h3>${chart}</section>${renderPerformanceDetails('Comparação por disciplina e projeção',`<section class="performance-block"><h3>Comparação por disciplina</h3>${comparison}</section><section class="performance-block"><h3>Projeção × resultado</h3>${calibration}</section>`)}`;
}
