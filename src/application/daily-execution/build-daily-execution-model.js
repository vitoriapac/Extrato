import {parseLocalDate} from '../../core/date-utils.js';
import {reconcileDailyExecution} from './reconcile-daily-execution.js';
import {buildDailyProgress} from './build-daily-progress.js';
import {buildDailyPriority} from './build-daily-priority.js';

export function buildDailyExecutionModel({today,dailyPlans=[],sessions=[],subjects=[],activeExamTags=[],nextBestAction=null,activePlan=null,availableMinutes=0}={}){
  if(typeof today!=='string'||!parseLocalDate(today))return {state:'invalid_date',reason:'Informe uma data local válida para acompanhar a execução.'};
  const reconciled=reconcileDailyExecution({today,dailyPlans,sessions,subjects,activeExamTags});
  const progress=buildDailyProgress(reconciled),priority=buildDailyPriority({...reconciled,nextBestAction,subjects,activeExamTags});
  const stalePlanItemCount=activePlan?.id?reconciled.items.filter(item=>item.studyPlanId&&item.studyPlanId!==activePlan.id).length:0;
  return {state:reconciled.hasPlan?'ready':'unplanned',date:today,activeExamTags:[...activeExamTags],activePlanId:activePlan?.id||null,
    availableMinutes:Math.max(0,Number(availableMinutes)||0),items:reconciled.items,progress,priority,
    ambiguousItemCount:reconciled.ambiguousItemCount,stalePlanItemCount,needsPlanReview:stalePlanItemCount>0,
    guidance:!reconciled.hasPlan?'Confirme um planejamento para organizar as atividades de hoje.':!reconciled.items.length?'Não há atividade elegível no plano de hoje. Confira o concurso ativo e os conteúdos arquivados.':null};
}
