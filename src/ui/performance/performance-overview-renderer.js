import {renderReadinessHistory} from '../renderers/readiness-history-renderer.js';
import {renderPerformanceComparison} from './performance-comparison-renderer.js';

const shown=value=>value==null?'—':String(Math.round(value*10)/10);
const change=value=>value==null?'Sem base comparável':`${value>0?'+':''}${shown(value)}`;
const card=(label,value,unit,detail)=>`<article class="performance-kpi"><span>${label}</span><strong>${shown(value)}${value==null?'':unit}</strong><small>${detail}</small></article>`;

export function renderPerformanceOverview(model,{range,today,activeExamTags,formatDate,escapeHtml,comparisonModel=null}={}){
  const current=model.current||{},previous=model.previous;
  const comparisonLabel=range.comparePrevious?'Comparação com período anterior':'Sem comparação';
  const kpis=`<section class="performance-kpis" aria-label="Indicadores de desempenho">
    ${card('Índice de Prontidão',model.readiness?.value,'/100',model.readinessDelta==null?'Histórico comparável indisponível':`${change(model.readinessDelta)} pontos entre registros salvos`)}
    ${card('Precisão em questões',current.accuracy,'%',`${current.resolved||0} questões${previous&&previous.accuracy!=null&&current.accuracy!=null?' · '+change(current.accuracy-previous.accuracy)+' p.p.':''}`)}
    ${card('Tempo estudado',current.studiedMinutes,' min',`${current.sessionCount||0} sessões${previous?' · '+change(current.studiedMinutes-previous.studiedMinutes)+' min':''}`)}
    ${card('Aderência de carga',current.adherence,'%',current.adherence==null?'Sem plano no período':`${shown(current.studiedMinutes)} de ${shown(current.plannedMinutes)} min planejados`)}
  </section>`;
  const history=renderReadinessHistory(model.history,{formatDate,escapeHtml,current:model.readiness,today,activeExamTags});
  const weekRows=model.weekly.map(row=>{
    const maximum=Math.max(1,row.plannedMinutes,row.studiedMinutes);
    return `<tr><th scope="row">${escapeHtml(formatDate(row.start))}${row.inProgress?' · em andamento':''}</th><td><span class="performance-week-bar planned" style="width:${Math.round(row.plannedMinutes/maximum*100)}%"></span>${shown(row.plannedMinutes)} min</td><td><span class="performance-week-bar actual" style="width:${Math.round(row.studiedMinutes/maximum*100)}%"></span>${shown(row.studiedMinutes)} min</td><td>${row.plannedMinutes?shown(row.studiedMinutes/row.plannedMinutes*100)+'%':'—'}</td></tr>`;
  }).join('');
  const plan=`<section class="performance-block"><h3>Planejado × realizado</h3><p class="analytics-note">Aderência de carga compara minutos estudados com minutos planejados. Pode superar 100%.</p>${weekRows?`<div class="performance-table-scroll"><table><caption>Semanas com plano ou estudo no período</caption><thead><tr><th scope="col">Semana de</th><th scope="col">Planejado</th><th scope="col">Realizado</th><th scope="col">Aderência</th></tr></thead><tbody>${weekRows}</tbody></table></div>`:'<p class="empty-state empty-state--compact">Nenhum plano ou estudo registrado neste período.</p>'}${model.strategic?.strategicAdherence!=null?`<p class="context-note context-note--info">Aderência estratégica: ${model.strategic.strategicAdherence}% do tempo prioritário planejado foi executado em sessões vinculadas.</p>`:''}</section>`;
  const changes=model.changes.length?`<ul class="performance-changes">${model.changes.map(item=>`<li><strong>${escapeHtml(item.label)}</strong><span>${item.delta>0?'+':''}${shown(item.delta)} ${escapeHtml(item.unit)}</span></li>`).join('')}</ul>`:'<p class="empty-state empty-state--compact">Ainda não há mudanças mensuráveis com base comparável neste período.</p>';
  return `${kpis}<p class="performance-method-note">${comparisonLabel}. Precisão usa apenas questões respondidas por você. O índice atual não é uma probabilidade de aprovação.</p>${renderPerformanceComparison(comparisonModel||{state:'disabled'}, {escapeHtml})}<section class="performance-block"><h3>Prontidão ao longo do tempo</h3>${history}</section>${plan}<section class="performance-block"><h3>Principais mudanças</h3>${changes}</section>`;
}
