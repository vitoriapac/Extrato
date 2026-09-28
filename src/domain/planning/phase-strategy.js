import {resolveExamPhase,ADAPTIVE_COOLDOWN_DAYS} from './adaptive-planning.js';
import {parseLocalDate,addLocalDays} from '../../core/date-utils.js';
const excluded=new Set(['skipped','replaced','discarded','deferred']);
const ratios={construction:[.6,.25,.15],consolidation:[.35,.4,.25],final_stretch:[.2,.5,.3],final_review:[.1,.4,.5]};
const keys=['theory','questions','reviews'];
const mix=(minutes,weights)=>{const values=weights.map(value=>Math.floor(minutes*value));values[weights.indexOf(Math.max(...weights))]+=minutes-values.reduce((a,b)=>a+b,0);return Object.fromEntries(keys.map((key,index)=>[key,values[index]]))};

export function buildPhaseStrategyProposal({plan,candidates=[],daysToExam,today,history=[],readiness=null,weeklyCapacityMinutes=null}={}){
  const phase=resolveExamPhase(daysToExam);
  const unavailable=reason=>({state:'insufficient',reason,phase,version:1});
  if(!parseLocalDate(today)||daysToExam==null||Number(daysToExam)<0)return unavailable('Defina uma data futura de prova para propor a estratégia.');
  if(!plan?.id||!plan.items?.length||!ratios[phase.state])return unavailable('Confirme um plano semanal antes de ajustar sua estratégia.');
  const budget=Number(plan.weeklyPlannedMinutes),capacity=Number(weeklyCapacityMinutes??plan.weeklyAvailableMinutes);
  if(!Number.isFinite(budget)||budget<=0||!Number.isFinite(capacity)||budget>capacity||plan.items.some(item=>!Number.isInteger(item.minutes)||item.minutes<0||excluded.has(item.status))||plan.items.reduce((sum,item)=>sum+item.minutes,0)!==budget)return unavailable('O plano precisa ter carga consistente e capacidade válida.');
  const cutoff=addLocalDays(today,-ADAPTIVE_COOLDOWN_DAYS);
  const recent=[plan.phaseStrategy?.appliedAt,...history.filter(item=>['applied','reverted'].includes(item.status)).map(item=>item.decidedAt||item.createdAt)].filter(Boolean).some(date=>String(date).slice(0,10)>cutoff);
  if(recent)return {state:'cooldown',reason:`Um ajuste estratégico foi confirmado recentemente. Aguarde ${ADAPTIVE_COOLDOWN_DAYS} dias antes de outro.`,phase,version:1};
  const measured=candidates.filter(item=>item.mastery!=null&&Number(item.evidenceStrength)>=.35);
  if(measured.length<2)return unavailable('Registre evidências suficientes em pelo menos dois tópicos antes de adaptar a divisão das atividades.');
  const byTopic=new Map(candidates.map(item=>[item.topicId,item]));
  const changes=[];
  const items=plan.items.map(item=>{
    const candidate=byTopic.get(item.topicId||item.id);
    // Preserve the activity split of topics whose personal evidence is limited.
    if(!candidate||candidate.mastery==null||Number(candidate.evidenceStrength)<.35)return structuredClone(item);
    let weights=[...ratios[phase.state]];
    const reasons=[phase.strategy];
    if(item.covered){weights=[0,.55,.45];reasons.push('Conteúdo coberto: manutenção com questões e revisão.');}
    else if(candidate.mastery<50&&candidate.examImpact>=70){weights=[Math.max(.35,weights[0]),.4,0];weights[2]=1-weights[0]-weights[1];reasons.push('Lacuna de alto impacto: preservar teoria de base.');}
    else if(candidate.retention!=null&&candidate.retention<60){weights=[weights[0],Math.max(.2,weights[1]-.1),0];weights[2]=1-weights[0]-weights[1];reasons.push('Retenção baixa: ampliar a parcela de revisão.');}
    const after=mix(item.minutes,weights),before=item.activityMix;
    if(!before||keys.some(key=>!Number.isFinite(before[key])||before[key]<0)||keys.reduce((sum,key)=>sum+before[key],0)!==item.minutes)return structuredClone(item);
    if(keys.some(key=>after[key]!==before[key]))changes.push({topicId:item.topicId,topicName:item.topicName,subjectName:item.subjectName,before:structuredClone(before),after,reasons,mastery:candidate.mastery,retention:candidate.retention,examImpact:candidate.examImpact,evidenceStrength:candidate.evidenceStrength});
    return {...structuredClone(item),activityMix:after};
  });
  if(!changes.length)return {state:'stable',phase,version:1,reason:'A divisão atual já é adequada à fase ou não há evidência para modificá-la.'};
  return {state:'proposal',version:1,phase,basePlanId:plan.id,budget,capacity,changes,readiness:readiness?structuredClone(readiness):null,candidateEvidence:measured.map(item=>({topicId:item.topicId,coverage:item.coverage,mastery:item.mastery,retention:item.retention,examImpact:item.examImpact,score:item.score,evidenceStrength:item.evidenceStrength})),plan:{...structuredClone(plan),items,weeklyAvailableMinutes:capacity,examPhase:phase}};
}
