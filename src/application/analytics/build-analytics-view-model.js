import {HEATMAP_METRICS,heatmapMetricLevel} from '../../domain/analytics/heatmap.js';

export function buildHeatmapViewModel({summaries=[],metric='hours',selectedDate=null}={}){
  const normalizedMetric=HEATMAP_METRICS.includes(metric)?metric:'hours';
  const cells=summaries.map(summary=>({...summary,level:heatmapMetricLevel(summary,normalizedMetric),selected:summary.date===selectedDate}));
  return {metric:normalizedMetric,cells,hasActivity:cells.some(item=>item.level>0),selected:cells.find(item=>item.selected)||null};
}

const severityFor=(score,insufficient=false)=>insufficient?'insufficient':score>=70?'high':score>=45?'medium':'low';
const titleFor=item=>[item.subjectName,item.topicName].filter(Boolean).join(' — ')||'Tópico sem nome';
const evidenceRow=(label,value)=>value==null||value===''?null:{label,value:String(value)};
const numericValue=value=>value==null||value===''?null:Number.isFinite(Number(value))?Number(value):null;

function presentDiagnosisItem(item,{type,reason,action,confidence=null,insufficient=false,evidence=[],explanation=[],secondaryReasons=[]}={}){
  const confidenceValue=numericValue(confidence);
  const normalizedConfidence=confidenceValue==null?null:Math.max(0,Math.min(1,confidenceValue));
  const limited=insufficient||(normalizedConfidence!=null&&normalizedConfidence<.35);
  const score=Number(item.risk?.value??item.severity??item.opportunityScore??item.reviewUrgency);
  const severity=type==='focus'?'info':severityFor(Number.isFinite(score)?score:0,limited);
  const signalLabel=limited?'Evidência limitada':type==='focus'?'Distribuição sugerida':type==='review'?'Revisão prioritária':type==='opportunity'
    ?score>=70?'Retorno alto':score>=45?'Retorno moderado':'Retorno potencial'
    :severity==='high'?'Risco alto':severity==='medium'?'Risco moderado':'Risco baixo';
  const validEvidence=evidence.filter(Boolean),validExplanation=[...evidence,...explanation].filter(Boolean);
  const explanationSummary={
    bottleneck:'A leitura combina domínio, retenção, tendência, recência e impacto na prova quando esses dados estão disponíveis.',
    opportunity:'O potencial considera a lacuna de domínio, a relevância na prova e o esforço estimado quando configurados.',
    review:'A urgência considera o tempo sem contato, a retenção e o domínio disponíveis para este tópico.',
    focus:'A distribuição usa a prioridade das disciplinas e a disponibilidade semanal informada.'
  }[type];
  return {...item,diagnosisExplanation:validExplanation,diagnosisExplanationSummary:explanationSummary,signalLabel,signalTone:severity==='insufficient'?'neutral':severity==='high'?'high':severity==='medium'?'medium':'low',presentation:{
    type,severity,confidence:normalizedConfidence,title:titleFor(item),summary:reason,primaryReason:reason,
    secondaryReasons:secondaryReasons.filter(Boolean).slice(0,2),evidence:validEvidence.slice(0,2),
    recommendedAction:{label:action.label,type:'navigate',targetId:action.tab}
  }};
}

export function buildDiagnosisViewModel(diagnosis,{limit=4,hasTopics=true,weeklyCapacityMinutes=null}={}){
  if(!diagnosis||diagnosis.state==='insufficient'){
    const action=hasTopics
      ?{label:'Abrir o Modo Hoje',tab:'hoje'}
      :{label:'Cadastrar disciplinas e tópicos',tab:'disciplinas'};
    return {state:'insufficient',title:'O diagnóstico ainda não pode ser calculado',message:hasTopics
      ?'Há tópicos cadastrados, mas ainda faltam registros de estudo ou questões para formar uma leitura confiável.'
      :'Cadastre disciplinas e tópicos para o StudyTrack identificar prioridades e revisões.',action,sections:[]};
  }
  const bottlenecks=(diagnosis.bottlenecks||[]).map(item=>{
    const completeness=numericValue(item.risk?.evidence?.completeness);
    const confidence=numericValue(item.evidenceStrength??item.risk?.evidence?.evidenceStrength)??completeness;
    const evidenceLabel=item.risk?.evidence?.evidenceLabel;
    const reason=item.reason||`${item.factor||'Os indicadores atuais'} requerem atenção neste tópico.`;
    const insufficient=completeness==null&&/baixa|insuficiente/i.test(evidenceLabel||'');
    return presentDiagnosisItem(item,{type:'bottleneck',reason,confidence,insufficient,action:{label:'Abrir Questões',tab:'questoes'},evidence:[
      evidenceRow('Cobertura dos dados',Number.isFinite(completeness)?`${Math.round(completeness*100)}%`:null),
      evidenceRow('Força da evidência',evidenceLabel?String(evidenceLabel).toLowerCase():null)
    ],explanation:[
      evidenceRow('Domínio',item.mastery==null?null:`${Math.round(item.mastery)}/100`),
      evidenceRow('Retenção',item.retention==null?null:`${Math.round(item.retention)}/100`),
      evidenceRow('Impacto na prova',item.examImpact==null?null:`${Math.round(item.examImpact)}/100`),
      evidenceRow('Questões consideradas',item.questionVolume??item.resolved),
      evidenceRow('Tempo sem contato',item.daysSinceContact==null?null:`${Math.max(0,Math.round(item.daysSinceContact))} dias`)
    ],secondaryReasons:[item.risk?.missingFactors?.length?`${item.risk.missingFactors.length} indicadores ainda sem dados.`:null]});
  });
  const opportunities=(diagnosis.opportunities||[]).map(item=>{
    const reason=item.missingFactors?.includes('examImpact')?'O impacto desta matéria na prova ainda não foi configurado.':'Este tópico combina potencial de melhora, relevância e esforço estimado.';
    return presentDiagnosisItem(item,{type:'opportunity',reason,confidence:item.evidenceStrength??item.confidence,action:{label:'Ver tópico em Disciplinas',tab:'disciplinas'},evidence:[
      evidenceRow('Força da evidência',numericValue(item.evidenceStrength)==null?null:`${Math.round(Number(item.evidenceStrength)*100)}%`),
      evidenceRow('Esforço estimado',numericValue(item.estimatedMinutes)==null?null:`${Math.round(Number(item.estimatedMinutes))} min`),
      evidenceRow('Impacto na prova',item.examImpact==null?null:`${Math.round(item.examImpact)}/100`)
    ],explanation:[
      evidenceRow('Domínio',item.mastery==null?null:`${Math.round(item.mastery)}/100`),
      evidenceRow('Retenção',item.retention==null?null:`${Math.round(item.retention)}/100`),
      evidenceRow('Questões consideradas',item.questionVolume??item.resolved),
      evidenceRow('Cobertura dos dados',numericValue(item.confidence)==null?null:`${Math.round(Number(item.confidence)*100)}%`)
    ],secondaryReasons:item.missingFactors?.includes('examImpact')?['Configure o impacto da prova para aumentar a confiança da estimativa.']:[]});
  });
  const reviewItems=((diagnosis.criticalReviews||[]).length?diagnosis.criticalReviews:diagnosis.topicsAtRisk||[]).map(item=>{
    const urgency=numericValue(item.reviewUrgency),days=numericValue(item.daysSinceContact);
    const reason=item.reason||item.reasons?.[0]||'Uma revisão vencida ou um intervalo longo sem contato pede atenção.';
    return presentDiagnosisItem(item,{type:'review',reason,confidence:item.evidenceStrength,action:{label:'Abrir Agenda',tab:'agenda'},evidence:[
      evidenceRow('Urgência da revisão',urgency>0?`${Math.round(urgency)}/100`:null),
      evidenceRow('Tempo sem contato',Number.isFinite(days)?`${Math.max(0,Math.round(days))} dias`:null)
    ],explanation:[
      evidenceRow('Retenção',item.retention==null?null:`${Math.round(item.retention)}/100`),
      evidenceRow('Domínio',item.mastery==null?null:`${Math.round(item.mastery)}/100`),
      evidenceRow('Impacto na prova',item.examImpact==null?null:`${Math.round(item.examImpact)}/100`),
      evidenceRow('Força da evidência',item.evidenceStrength==null?null:`${Math.round(Number(item.evidenceStrength)*100)}%`)
    ]});
  });
  const weeklyFocus=(diagnosis.weeklyFocus||[]).map(item=>{
    const percentage=Math.max(0,Number(item.percentage)||0);
    const capacity=numericValue(weeklyCapacityMinutes);
    const allocated=capacity==null?null:Math.round(Math.max(0,capacity)*percentage/100);
    return presentDiagnosisItem(item,{type:'focus',reason:'Esta é a parcela sugerida do foco semanal para a disciplina.',confidence:null,action:{label:'Rever planejamento',tab:'metas'},evidence:[
      evidenceRow('Parte do foco semanal',`${Math.round(percentage)}%`),
      evidenceRow('Tempo estimado',allocated==null?null:`${allocated} min`)
    ],explanation:[evidenceRow('Capacidade semanal',capacity==null?null:`${Math.round(capacity)} min`)]});
  });
  const sections=[
    {key:'bottlenecks',title:'Gargalos',items:bottlenecks.slice(0,limit),empty:{title:'Nenhum gargalo prioritário',message:'Os sinais disponíveis não indicam um tópico que precise de atenção imediata.'}},
    {key:'opportunities',title:'Oportunidades',items:opportunities.slice(0,limit),empty:{title:'Ainda não há oportunidade priorizada',message:'Registre sessões e questões ou configure impacto e esforço dos tópicos para melhorar esta estimativa.',action:{label:'Configurar edital e esforço',tab:'metas'}}},
    {key:'risk',title:'Revisões críticas e risco',items:reviewItems.slice(0,limit),empty:{title:'Nenhuma revisão crítica identificada',message:'As revisões disponíveis não apresentam atraso ou risco que exija ação agora.'}},
    {key:'focus',title:'Foco da semana',items:weeklyFocus.slice(0,limit),empty:{title:'Sem distribuição semanal confiável',message:'Defina sua disponibilidade e configure o esforço dos tópicos para estimar uma divisão semanal.',action:{label:'Revisar planejamento',tab:'metas'}}}
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
