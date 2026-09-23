import {HEATMAP_METRICS,heatmapMetricLevel} from '../../domain/analytics/heatmap.js';

export function buildHeatmapViewModel({summaries=[],metric='hours',selectedDate=null}={}){
  const normalizedMetric=HEATMAP_METRICS.includes(metric)?metric:'hours';
  const cells=summaries.map(summary=>({...summary,level:heatmapMetricLevel(summary,normalizedMetric),selected:summary.date===selectedDate}));
  return {metric:normalizedMetric,cells,hasActivity:cells.some(item=>item.level>0),selected:cells.find(item=>item.selected)||null};
}

export function buildDiagnosisViewModel(diagnosis,{limit=4,hasTopics=true}={}){
  if(!diagnosis||diagnosis.state==='insufficient'){
    const action=hasTopics
      ?{label:'Abrir o Modo Hoje',tab:'hoje'}
      :{label:'Cadastrar disciplinas e tópicos',tab:'disciplinas'};
    return {state:'insufficient',title:'O diagnóstico ainda não pode ser calculado',message:hasTopics
      ?'Há tópicos cadastrados, mas ainda faltam registros de estudo ou questões para formar uma leitura confiável.'
      :'Cadastre disciplinas e tópicos para o StudyTrack identificar prioridades e revisões.',action,sections:[]};
  }
  const bottlenecks=(diagnosis.bottlenecks||[]).map(item=>{
    const completeness=Number(item.risk?.evidence?.completeness);
    const evidenceLimited=Number.isFinite(completeness)?completeness<.35:/baixa|insuficiente/i.test(item.risk?.evidence?.evidenceLabel||'');
    const score=Number(item.risk?.value??item.severity);
    return {...item,signalLabel:evidenceLimited?'Evidência limitada':score>=70?'Risco alto':score>=45?'Risco moderado':'Risco baixo',signalTone:evidenceLimited?'neutral':score>=70?'high':score>=45?'medium':'low'};
  });
  const opportunities=(diagnosis.opportunities||[]).map(item=>({...item,signalLabel:item.confidence<.35?'Dados limitados':item.opportunityScore>=70?'Retorno alto':item.opportunityScore>=45?'Retorno moderado':'Retorno potencial',signalTone:item.confidence<.35?'neutral':item.opportunityScore>=70?'high':item.opportunityScore>=45?'medium':'low'}));
  const sections=[
    {key:'bottlenecks',title:'Gargalos',items:bottlenecks.slice(0,limit),empty:{title:'Nenhum gargalo prioritário',message:'Os sinais disponíveis não indicam um tópico que precise de atenção imediata.'}},
    {key:'opportunities',title:'Oportunidades',items:opportunities.slice(0,limit),empty:{title:'Ainda não há oportunidade priorizada',message:'Registre sessões e questões ou configure impacto e esforço dos tópicos para melhorar esta estimativa.',action:{label:'Configurar edital e esforço',tab:'metas'}}},
    {key:'risk',title:'Revisões críticas e risco',items:((diagnosis.criticalReviews||[]).length?diagnosis.criticalReviews:diagnosis.topicsAtRisk||[]).slice(0,limit),empty:{title:'Nenhuma revisão crítica identificada',message:'As revisões disponíveis não apresentam atraso ou risco que exija ação agora.'}},
    {key:'focus',title:'Foco da semana',items:(diagnosis.weeklyFocus||[]).slice(0,limit),empty:{title:'Sem distribuição semanal confiável',message:'Defina sua disponibilidade e configure o esforço dos tópicos para estimar uma divisão semanal.',action:{label:'Revisar planejamento',tab:'metas'}}}
  ];
  return {state:'estimated',sections};
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
