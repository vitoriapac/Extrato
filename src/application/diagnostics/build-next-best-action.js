import {buildStudyAction,recommendationActionLabel} from '../recommendations/recommendation-action.js';
import {diagnosticSignalLabel} from '../../domain/diagnostics/diagnostic-vocabulary.js';
import {decisionReasonCode} from './decision-reason-codes.js';

export const NEXT_BEST_ACTION_STATES=Object.freeze({
  ACTION_REQUIRED:'ACTION_REQUIRED',ACTION_OPTIONAL:'ACTION_OPTIONAL',MAINTAIN_PLAN:'MAINTAIN_PLAN',
  INSUFFICIENT_EVIDENCE:'INSUFFICIENT_EVIDENCE',NO_ELIGIBLE_ACTION:'NO_ELIGIBLE_ACTION'
});

// The recommendation producer owns ordering and eligibility. This adapter only adds context.
export function buildNextBestAction({recommendations=[],diagnosis=null,activePlan=null,weeklyCapacityMinutes=0,projection=null}={}){
  for(const recommendation of recommendations){
    const action=buildStudyAction(recommendation,{source:'diagnosis'});
    if(!action||!action.topicId||recommendation.available===false||recommendation.eligible===false||recommendation.canStudy===false||recommendation.status&&recommendation.status!=='pending')continue;
    const row=diagnosis?.topics?.find(item=>item.subjectId===action.subjectId&&item.topicId===action.topicId)||null;
    const allocation=activePlan?.items?.find(item=>item.topicId===action.topicId);
    const projectionRisk=projection?.status!=='insufficient_data'?(projection?.topicRisks||[]).find(item=>item.subjectId===action.subjectId&&item.topicId===action.topicId):null;
    const projectionReason=projectionRisk?`Esta lacuna de alto impacto também aparece na trajetória ${projection.status==='at_risk'?'em risco':'que exige atenção'} até a prova. Trata-se de evidência adicional, sem alterar a prioridade calculada.`:null;
    const state=row?.state==='attention'&&['critical','important'].includes(row.severity)?NEXT_BEST_ACTION_STATES.ACTION_REQUIRED:NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL;
    const structuredReason=decisionReasonCode(recommendation.decisionReasonCode);
    return {state,action,decisionReasonCode:structuredReason!=='unknown'?structuredReason:action.activityType==='review'?'scheduled_review':'unknown',
      label:recommendationActionLabel(action),subjectName:recommendation.subjectName||row?.subjectName||'Disciplina',topicName:recommendation.topicName||row?.name||'Tópico',
      diagnosis:row?diagnosticSignalLabel(row.primarySignal):null,evidence:row?.evidence?.label||action.evidence.label||'Não avaliada',
      reasons:[...(action.reasons||[])].slice(0,3),projectionReason,weeklyCapacityMinutes,weeklyPlannedMinutes:activePlan?.weeklyPlannedMinutes??null,
      currentAllocationMinutes:allocation?.minutes??null,activePlanId:activePlan?.id||null};
  }
  const rows=diagnosis?.rows||[...(diagnosis?.topics||[]),...(diagnosis?.subjects||[])];
  if(rows.some(item=>item.state==='attention'))return {state:NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION,reason:'Há um ponto de atenção, mas nenhuma ação está elegível agora. Confira disponibilidade, pré-requisitos e o plano.'};
  if(rows.some(item=>['controlled','progress'].includes(item.state)))return {state:NEXT_BEST_ACTION_STATES.MAINTAIN_PLAN,reason:activePlan?.id?'Nenhuma intervenção prioritária agora. Continue executando o plano atual e acompanhe as revisões.':'Nenhuma intervenção prioritária agora. Mantenha sua rotina e acompanhe as revisões.'};
  if(recommendations.length)return {state:NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION,reason:'As recomendações atuais não estão elegíveis para execução. Revise disponibilidade e pré-requisitos.'};
  return {state:NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE,reason:'Ainda não há evidência suficiente para indicar uma ação. Registre sessões, questões e revisões vinculadas a tópicos.'};
}
