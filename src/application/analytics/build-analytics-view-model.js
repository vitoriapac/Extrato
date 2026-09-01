import {HEATMAP_METRICS,heatmapMetricLevel} from '../../domain/analytics/heatmap.js';

export function buildHeatmapViewModel({summaries=[],metric='hours',selectedDate=null}={}){
  const normalizedMetric=HEATMAP_METRICS.includes(metric)?metric:'hours';
  const cells=summaries.map(summary=>({...summary,level:heatmapMetricLevel(summary,normalizedMetric),selected:summary.date===selectedDate}));
  return {metric:normalizedMetric,cells,hasActivity:cells.some(item=>item.level>0),selected:cells.find(item=>item.selected)||null};
}

export function buildDiagnosisViewModel(diagnosis,{limit=4}={}){
  if(!diagnosis||diagnosis.state==='insufficient')return {state:'insufficient',sections:[]};
  return {state:'estimated',sections:[
    {key:'bottlenecks',title:'Gargalos',items:(diagnosis.bottlenecks||[]).slice(0,limit)},
    {key:'opportunities',title:'Oportunidades',items:(diagnosis.opportunities||[]).slice(0,limit)},
    {key:'risk',title:'Revisões críticas e risco',items:((diagnosis.criticalReviews||[]).length?diagnosis.criticalReviews:diagnosis.topicsAtRisk||[]).slice(0,limit)},
    {key:'focus',title:'Foco da semana',items:(diagnosis.weeklyFocus||[]).slice(0,limit)}
  ]};
}

export function buildApprovalSignals(metrics,{target=70}={}){
  const signals=[];
  if(metrics.simulados?.available&&metrics.simulados.raw>=75)signals.push({level:'positive',text:'Boa média nos simulados'});
  if(metrics.revisoes?.available&&metrics.revisoes.raw>=90)signals.push({level:'positive',text:'Revisões em dia'});
  if(metrics.tendencia?.available&&metrics.tendencia.score>=60)signals.push({level:'positive',text:'Evolução positiva recente'});
  if(metrics.edital?.available&&metrics.edital.raw<60)signals.push({level:'warning',text:'Edital com baixa cobertura'});
  if(metrics.dominio?.available&&metrics.dominio.raw<50)signals.push({level:'warning',text:'Domínio médio dos tópicos ainda baixo'});
  if(metrics.dominio?.available&&metrics.dominio.raw>=75)signals.push({level:'positive',text:'Bom domínio médio dos tópicos'});
  if(metrics.acertos?.available&&metrics.acertos.raw<target)signals.push({level:'warning',text:`Taxa de acerto abaixo da meta (${target}%)`});
  if(metrics.prazo?.available&&metrics.prazo.score<60)signals.push({level:'warning',text:'Ritmo atual abaixo do necessário até a prova'});
  if(!metrics.simulados?.available)signals.push({level:'info',text:'Registre simulados para aumentar a confiança do índice'});
  if((metrics.acertos?.confidence||0)<.34)signals.push({level:'info',text:'Ainda há poucas questões para uma estimativa estável'});
  return signals.length?signals:[{level:'positive',text:'Indicadores equilibrados no momento'}];
}
