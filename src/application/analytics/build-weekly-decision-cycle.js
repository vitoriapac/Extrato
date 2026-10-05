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
  const adherence=close.adherence,priority=adherence?(adherence.assessment.status==='insufficient_data'?null:adherence.model.priority.adherence):execution.strategicAdherence;
  const priorityPercent=priority==null?null:Math.round(priority*10)/10;
  if(close.comparison.accuracy.delta>0)worked.push(`Precisão aumentou ${close.comparison.accuracy.delta} p.p.; compare também o volume e a dificuldade das questões.`);
  if(priority>=80&&priority!=null)worked.push(`Você executou ${priorityPercent}% do tempo prioritário registrado no plano.`);
  if(outcomes.some(item=>item.state==='positive'))worked.push('Há decisões com melhora posterior medida, sem atribuição de causalidade.');
  if(priority!=null&&priority<80)attention.push(`Execução prioritária em ${priorityPercent}%; reveja os blocos não executados.`);
  if(close.mainRisk)attention.push(close.mainRisk.message);
  if(execution.unknownPlannedMinutes)attention.push(`${execution.unknownPlannedMinutes} minutos planejados sem classificação estratégica histórica.`);
  return {version:2,execution,readiness:{current,previous:previous||null,comparison:readinessComparison},simulations:simulations.filter(item=>item.date>=start&&item.date<=end).length,worked:worked.slice(0,3),attention:attention.slice(0,3),outcomes};
}

// Síntese transitória: não cria prioridades nem reescreve snapshots.
export function buildWeeklyDecisionGuidance({cycle=null,trajectory=null,sustainability=null}={}){
  if(!cycle)return null;
  const advance=cycle.worked?.[0]||'Ainda não há avanço sustentado por evidência comparável.';
  const risk=cycle.attention?.[0]||'Nenhum risco destacado nesta semana; acompanhe a próxima medição.';
  const structuralAction=sustainability?.state==='ready'?sustainability.assessment?.action:null;
  const decision=structuralAction==='review_capacity'?'Revise a disponibilidade semanal antes de confirmar o próximo plano. Nas semanas encerradas comparáveis, o volume ficou abaixo do planejado de forma recorrente, com prioridades preservadas.':structuralAction==='review_distribution'?'Revise a distribuição dos blocos prioritários antes de confirmar o próximo plano.':cycle.attention?.length
    ? 'Revise as prioridades abaixo, confira a capacidade restante e pré-visualize o próximo plano.'
    : 'Mantenha as prioridades justificadas e confira a capacidade antes de confirmar o próximo plano.';
  const delta=trajectory?.state==='comparable'?trajectory.accuracyDelta:null;
  return {advance,risk,decision,accuracyDelta:delta,comparisonAvailable:delta!=null,
    comparisonNote:delta==null?'Sem comparação de simulados com a mesma meta, prova e escopo.':'Mudança observada nos simulados comparáveis; não representa ganho causado pelo planejamento.'};
}

// Transient presentation contract: never attached to persisted closes.
export function buildWeeklyDecisionSummary({cycle=null,trajectory=null,adherence=null}={}){
 const guidance=buildWeeklyDecisionGuidance({cycle,trajectory,sustainability:adherence?.sustainability});
 if(!guidance)return null;
 const priority=adherence?.assessment?.status==='insufficient_data'?null:adherence?.model?.priority;
 return {priorities:priority?{completed:priority.completedActivities??null,planned:priority.plannedActivities??null,percent:priority.adherence??null}:null,
 trajectory:{state:trajectory?.state||'unavailable',status:trajectory?.current||null,delta:guidance.accuracyDelta,comparisonNote:guidance.comparisonNote},
 advance:guidance.advance,signal:guidance.risk,decision:guidance.decision};
}
