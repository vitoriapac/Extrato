import {recommendationActionKind,recommendationActionLabel} from './recommendation-action.js';
const number=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
const row=(label,value,unit='')=>number(value)===null?null:{label,value:number(value)+unit};

export function buildRecommendationExplanation(item={}, {createdAt=null,weeklyPlannedMinutes=null,weeklyAvailableMinutes=null}={}){
  const redistribution=Boolean(item.from&&item.to&&item.transferMinutes);
  const historical=item.examIntelligence||{};
  const evidence=redistribution?[
    row('Domínio na origem',item.from.mastery,'/100'),row('Domínio no destino',item.to.mastery,'/100'),row('Impacto no destino',item.to.impact,'/100')
  ]:[
    row('Domínio',item.mastery,'/100'),row('Meta de domínio',item.masteryTarget??item.targetMastery,'/100'),row('Retenção',item.retention,'/100'),
    row('Impacto na prova',item.examImpact,'/100'),row('Incidência histórica',historical.presencePercent,'%'),
    row('Provas com presença',historical.presentExamCount),row('Provas analisadas',historical.analyzedExamCount),
    row('Precisão recente',item.accuracy??item.diagnosis?.performance?.accuracy,'%'),row('Força da evidência',number(item.evidence?.evidenceStrength)===null?null:item.evidence.evidenceStrength*100,'%')
  ];
  if(!redistribution&&historical.confidenceLabel)evidence.push({label:'Confiança do histórico',value:historical.confidenceLabel});
  if(!redistribution&&historical.impactSourceType)evidence.push({label:'Origem do impacto',value:({official:'Oficial',manual:'Manual',historical:'Histórica',estimated:'Estimada'})[historical.impactSourceType]||historical.impactSourceType});
  const reasons=redistribution?[item.reason,...(item.rationale||[])]:[...(item.reasons||[])];
  const kind=redistribution?'redistribution':recommendationActionKind(item);
  const action=redistribution?{type:kind,label:'Redistribuir tempo semanal',minutes:number(item.transferMinutes),from:structuredClone(item.from),to:structuredClone(item.to)}:{type:kind,label:recommendationActionLabel(item),minutes:number(item.estimatedMinutes),questions:number(item.recommendedQuestions),subjectId:item.subjectId||null,topicId:item.topicId||null};
  const effect=redistribution?{
    kind:'operational',weeklyPlannedMinutes:number(weeklyPlannedMinutes),weeklyAvailableMinutes:number(weeklyAvailableMinutes),capacityChangeMinutes:0,
    description:'Aplicar altera somente a prévia. O plano será salvo após confirmação, com a mesma carga semanal distribuída e a mesma disponibilidade.'
  }:{kind:'operational',capacityChangeMinutes:0,description:kind==='review'?'Abre a revisão do tópico para registrar sua execução.':kind==='prerequisite'?'Abre o pré-requisito indicado para estudar a base necessária.':'Prepara o cronômetro e vincula a atividade ao plano de hoje, criando um item quando necessário. A disponibilidade semanal permanece igual.'};
  return {version:1,createdAt:createdAt||item.shownAt||null,algorithmVersion:item.algorithmVersion??null,
    reasons:reasons.filter(value=>typeof value==='string'&&value.trim()),evidence:evidence.filter(Boolean),
    evidenceSnapshot:{mastery:number(item.mastery),retention:number(item.retention),factors:item.factors?structuredClone(item.factors):null,confidence:item.evidence?structuredClone(item.evidence):null,examIntelligence:item.examIntelligence?structuredClone(item.examIntelligence):null,from:redistribution?structuredClone(item.from):null,to:redistribution?structuredClone(item.to):null},
    suggestedAction:action,expectedImpact:effect,limitation:'A ação proposta não garante melhora de desempenho, aumento de prontidão ou aprovação.'};
}
