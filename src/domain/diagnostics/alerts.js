export const ALERT_TYPES=Object.freeze([
  'performance_decline','review_critical','subject_neglected','weekly_deficit',
  'low_mastery_high_exam_impact','insufficient_evidence'
]);

const presentation={high:{level:'alta',icon:'🔴'},medium:{level:'media',icon:'🟠'},low:{level:'baixa',icon:'🟡'}};

export function createDiagnosticAlert({type,severity='medium',subjectId=null,topicId=null,reason,recommendedAction,createdAt=null,id}={}){
  if(!ALERT_TYPES.includes(type))throw new TypeError('Tipo de alerta inválido.');
  if(!reason||!recommendedAction)throw new TypeError('Alerta exige motivo e ação recomendada.');
  const normalizedSeverity=presentation[severity]?severity:'medium',view=presentation[normalizedSeverity];
  return {id:id||[type,topicId||subjectId||'global'].join(':'),type,severity:normalizedSeverity,subjectId,topicId,reason:String(reason),recommendedAction:String(recommendedAction),createdAt:createdAt||null,resolvedAt:null,nivel:view.level,icon:view.icon,texto:String(reason)};
}

export function buildIntelligentAlerts({today=null,overdueReviews=0,subjects=[],topics=[],weeklyBalanceMinutes=null,hardTopicsWithoutReview=0,weeklyGoalGap=null}={}){
  const alerts=[];
  if(overdueReviews>0)alerts.push(createDiagnosticAlert({id:'reviews-overdue',type:'review_critical',severity:'high',createdAt:today,reason:overdueReviews+' revisão'+(overdueReviews===1?'':'ões')+' atrasada'+(overdueReviews===1?'':'s')+'.',recommendedAction:'Conclua primeiro as revisões vencidas.'}));
  subjects.forEach(subject=>{
    if(subject.trend?.direction==='down')alerts.push(createDiagnosticAlert({type:'performance_decline',severity:subject.trend.state==='strong_down'?'high':'medium',subjectId:subject.subjectId,createdAt:today,reason:subject.name+' caiu '+Math.abs(subject.trend.delta||0)+' pontos no período analisado.',recommendedAction:'Revise os erros recentes e reduza conteúdo novo nesta disciplina.'}));
    if(Number(subject.daysSinceStudy)>=14)alerts.push(createDiagnosticAlert({type:'subject_neglected',severity:Number(subject.daysSinceStudy)>=28?'high':'medium',subjectId:subject.subjectId,createdAt:today,reason:subject.name+' está há '+subject.daysSinceStudy+' dias sem estudo registrado.',recommendedAction:'Reserve uma sessão curta para retomar a disciplina.'}));
  });
  if(Number.isFinite(weeklyBalanceMinutes)&&weeklyBalanceMinutes<0)alerts.push(createDiagnosticAlert({type:'weekly_deficit',severity:weeklyBalanceMinutes<=-120?'high':'medium',createdAt:today,reason:'A necessidade semanal excede a capacidade em '+Math.abs(weeklyBalanceMinutes)+' minutos.',recommendedAction:'Aumente a disponibilidade ou reduza a carga antes da prova.'}));
  if(Number.isFinite(weeklyGoalGap)&&weeklyGoalGap>0)alerts.push(createDiagnosticAlert({id:'weekly-goal-risk',type:'weekly_deficit',severity:'medium',createdAt:today,reason:'A meta semanal está '+weeklyGoalGap+'% abaixo do esperado para hoje.',recommendedAction:'Realoque uma sessão nesta semana para recuperar o ritmo.'}));
  topics.filter(topic=>Number(topic.mastery)<50&&Number(topic.examImpact)>=70).slice(0,3).forEach(topic=>alerts.push(createDiagnosticAlert({type:'low_mastery_high_exam_impact',severity:'high',subjectId:topic.subjectId,topicId:topic.topicId,createdAt:today,reason:topic.name+' combina baixo domínio com alto impacto na prova.',recommendedAction:'Priorize teoria dirigida, questões e uma revisão curta.'})));
  if(hardTopicsWithoutReview>0)alerts.push(createDiagnosticAlert({id:'hard-topics-no-review',type:'review_critical',severity:'low',createdAt:today,reason:hardTopicsWithoutReview+' tópico'+(hardTopicsWithoutReview===1?'':'s')+' '+(hardTopicsWithoutReview===1?'difícil':'difíceis')+' sem revisão agendada.',recommendedAction:'Agende revisões para os tópicos difíceis.'}));
  topics.filter(topic=>topic.evidenceStrength!=null&&Number(topic.evidenceStrength)<.25).slice(0,1).forEach(topic=>alerts.push(createDiagnosticAlert({type:'insufficient_evidence',severity:'low',subjectId:topic.subjectId,topicId:topic.topicId,createdAt:today,reason:'Ainda há pouca evidência para avaliar '+topic.name+'.',recommendedAction:'Registre uma sessão com questões para melhorar a confiança da análise.'})));
  return alerts;
}
