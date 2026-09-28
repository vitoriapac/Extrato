import {buildStrategicExecution} from '../goals/build-strategic-execution.js';
import {compareReadinessSnapshots} from './build-readiness-evolution.js';
import {readinessHistoryForScope} from './readiness-history.js';
import {READINESS_WEIGHTS} from '../../domain/analytics/readiness-score.js';

export function buildWeeklyDecisionCycle({close,start,end,previousStart,previousEnd,sessions=[],dailyPlans=[],recommendations=[],simulations=[],subjects=[],snapshots=[],activeExamTags=[],readiness=null}={}){
  const execution=buildStrategicExecution({start,end,dailyPlans,sessions,subjects});
  const previous=readinessHistoryForScope(snapshots,activeExamTags,null,previousEnd).filter(item=>item.date>=previousStart).at(-1);
  const current=readiness?.value==null?null:{score:readiness.value,factors:readiness.factors,algorithmVersion:readiness.algorithmVersion,weights:READINESS_WEIGHTS};
  const readinessComparison=compareReadinessSnapshots(previous,current);
  const outcomes=recommendations.filter(item=>item.outcome?.measuredAt&&item.outcome.measuredAt.slice(0,10)>=start&&item.outcome.measuredAt.slice(0,10)<=end).map(item=>({topicId:item.topicId,subjectId:item.subjectId,action:item.snapshot?.explanationSnapshot?.suggestedAction?.label||item.explanationSnapshot?.suggestedAction?.label||item.action||'Decisão registrada',state:item.outcome.state,before:item.snapshot?.masteryBefore??item.baseline?.mastery??item.masteryBefore??item.outcome.before?.mastery??null,after:item.outcome.after?.mastery??item.outcome.masteryAfter??null}));
  const worked=[],attention=[];
  if(close.comparison.accuracy.delta>0)worked.push(`Precisão aumentou ${close.comparison.accuracy.delta} p.p.; compare também o volume e a dificuldade das questões.`);
  if(execution.strategicAdherence>=80)worked.push(`Você executou ${execution.strategicAdherence}% do tempo prioritário registrado no plano.`);
  if(outcomes.some(item=>item.state==='positive'))worked.push('Há decisões com melhora posterior medida, sem atribuição de causalidade.');
  if(execution.strategicAdherence!=null&&execution.strategicAdherence<80)attention.push(`Execução prioritária em ${execution.strategicAdherence}%; reveja os blocos não executados.`);
  if(close.mainRisk)attention.push(close.mainRisk.message);
  if(execution.unknownPlannedMinutes)attention.push(`${execution.unknownPlannedMinutes} minutos planejados sem classificação estratégica histórica.`);
  return {version:1,execution,readiness:{current,previous:previous||null,comparison:readinessComparison},simulations:simulations.filter(item=>item.date>=start&&item.date<=end).length,worked:worked.slice(0,3),attention:attention.slice(0,3),outcomes};
}
