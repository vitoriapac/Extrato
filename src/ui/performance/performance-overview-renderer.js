import {presentEvidence} from '../evidence-state.js';
import {formatStudyMinutes,formatStudyMinuteDelta} from '../format-study-time.js';
import {renderReadinessHistory} from '../renderers/readiness-history-renderer.js';
import {renderPerformanceComparison} from './performance-comparison-renderer.js';
import {renderPerformanceStory,renderPerformanceSummary,renderPerformanceDetails} from './performance-story.js';
import {renderReadinessChangeExplanation} from './readiness-change-explanation-renderer.js';
import {renderMetricCard,renderEmptyState} from '../components/presentation.js';
import {renderAchievementProjection} from './achievement-projection-renderer.js';

const shown=value=>value==null?'—':String(Math.round(value*10)/10);
const change=value=>value==null?'Sem base comparável':`${value>0?'+':''}${shown(value)}`;
const card=(label,value,unit,detail)=>renderMetricCard({label,value:presentEvidence({value,unit,format:shown}).text,detail});

export function renderPerformanceOverview(model,{range,today,activeExamTags,formatDate,escapeHtml,escapeAttr=escapeHtml,comparisonModel=null,readinessChange=null,achievementProjection=null,achievementHistory=[],achievementCapacityMinutes=0,adherenceContext=null,recoveryPlan=null}={}){
  const current=model.current||{},previous=model.previous;
  const comparisonLabel=range.comparePrevious?'Comparação com período anterior':'Sem comparação';
  const kpis=`<section class="performance-kpis ui-metric-group" aria-label="Indicadores de desempenho">
    ${card('Índice de Prontidão',model.readiness?.value,'/100',model.readinessDelta==null?'Histórico comparável indisponível':`${change(model.readinessDelta)} pontos entre registros salvos`)}
    ${card('Precisão em questões',current.accuracy,'%',`${current.resolved||0} questões${previous&&previous.accuracy!=null&&current.accuracy!=null?' · '+change(current.accuracy-previous.accuracy)+' p.p.':''}`)}
    ${renderMetricCard({label:'Tempo estudado',value:formatStudyMinutes(current.studiedMinutes),detail:`${current.sessionCount||0} sessões${previous?' · '+formatStudyMinuteDelta(current.studiedMinutes-previous.studiedMinutes):''}`})}
    ${card('Volume de carga',current.adherence,'%',current.adherence==null?'Sem plano no período':`${formatStudyMinutes(current.studiedMinutes)} de ${formatStudyMinutes(current.plannedMinutes)} planejados`)}
  </section>`;
  const history=renderReadinessHistory(model.history,{formatDate,escapeHtml,current:model.readiness,today,activeExamTags,showComparisonDetails:false});
  const weekRows=model.weekly.map(row=>{
    const maximum=Math.max(1,row.plannedMinutes,row.studiedMinutes);
    return `<tr><th scope="row">${escapeHtml(formatDate(row.start))}${row.inProgress?' · em andamento':''}</th><td><span class="performance-week-bar planned" style="width:${Math.round(row.plannedMinutes/maximum*100)}%"></span>${formatStudyMinutes(row.plannedMinutes)}</td><td><span class="performance-week-bar actual" style="width:${Math.round(row.studiedMinutes/maximum*100)}%"></span>${formatStudyMinutes(row.studiedMinutes)}</td><td>${row.plannedMinutes?shown(row.studiedMinutes/row.plannedMinutes*100)+'%':'—'}</td></tr>`;
  }).join('');
  const plan=`<section class="performance-block"><h3>Planejado × realizado</h3><p class="analytics-note">Volume de carga compara minutos estudados com minutos planejados. Pode superar 100%.</p>${weekRows?`<div class="performance-table-scroll ui-data-table" tabindex="0" role="region" aria-label="Tabela semanal de planejado e realizado"><table><caption>Semanas com plano ou estudo no período</caption><thead><tr><th scope="col">Semana de</th><th scope="col">Planejado</th><th scope="col">Realizado</th><th scope="col">Volume</th></tr></thead><tbody>${weekRows}</tbody></table></div>`:renderEmptyState({title:'Sem plano ou estudo no período',message:'Distribua um plano ou registre uma sessão para comparar planejado e realizado.'})}${model.strategic?.strategicAdherence!=null?`<p class="context-note context-note--info">Aderência estratégica: ${model.strategic.strategicAdherence}% do tempo prioritário planejado foi executado em sessões vinculadas.</p>`:''}</section>`;
  const changes=model.changes.length?`<ul class="performance-changes">${model.changes.map(item=>`<li><strong>${escapeHtml(item.label)}</strong><span>${item.delta>0?'+':''}${shown(item.delta)} ${escapeHtml(item.unit)}</span></li>`).join('')}</ul>`:'<p class="empty-state empty-state--compact">Ainda não há mudanças mensuráveis com base comparável neste período.</p>';
  const insights=(comparisonModel?.insights||[]).slice(0,3);
  const summary=model.changes[0]?`${model.changes[0].label}: ${change(model.changes[0].delta)} ${model.changes[0].unit} frente ao período anterior.`:'Ainda não há mudança mensurável com base comparável. Continue registrando estudo e questões.';
  const method=`<p class="performance-method-note">${comparisonLabel}. Precisão usa apenas questões respondidas por você. O índice atual não é uma probabilidade de aprovação.</p>`;
  return `${renderPerformanceSummary(renderPerformanceStory({title:'Sua evolução no período',summary,details:insights},escapeHtml),kpis,method)}${renderAchievementProjection(achievementProjection,{history:achievementHistory,escapeHtml,escapeAttr,weeklyCapacityMinutes:achievementCapacityMinutes,adherenceContext,recoveryPlan})}${readinessChange?renderReadinessChangeExplanation(readinessChange,{formatDate,escapeHtml}):''}<section class="performance-block"><h3>Prontidão ao longo do tempo</h3>${history}</section>${renderPerformanceDetails('Comparação, plano e outras mudanças',`${renderPerformanceComparison(comparisonModel||{state:'disabled'}, {escapeHtml})}${plan}<section class="performance-block"><h3>Principais mudanças</h3>${changes}</section>`)}`;
}
