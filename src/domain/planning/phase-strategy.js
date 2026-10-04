import {PHASE_ACTIVITY_RATIOS as ratios,PHASE_ACTIVITY_KEYS as keys} from './phase-strategy-policy.js';
import {resolveExamPhase,ADAPTIVE_COOLDOWN_DAYS} from './adaptive-planning.js';
import {localDateFromTimestamp} from '../sessions/study-session.js';
import {parseLocalDate,addLocalDays} from '../../core/date-utils.js';
const excluded=new Set(['skipped','replaced','discarded','deferred']);
const mix=(minutes,weights)=>{const values=weights.map(value=>Math.floor(minutes*value));values[weights.indexOf(Math.max(...weights))]+=minutes-values.reduce((a,b)=>a+b,0);return Object.fromEntries(keys.map((key,index)=>[key,values[index]]))};

export function buildPhaseStrategyProposal({plan,candidates=[],daysToExam,today,history=[],readiness=null,weeklyCapacityMinutes=null}={}){
  const phase=resolveExamPhase(daysToExam);
  const unavailable=reason=>({state:'insufficient',reason,phase,version:1});
  if(!parseLocalDate(today)||daysToExam==null||daysToExam===''||!Number.isFinite(Number(daysToExam))||Number(daysToExam)<0)return unavailable('Defina uma data futura de prova para propor a estratégia.');
  if(!plan?.id||!plan.items?.length||!ratios[phase.state])return unavailable('Confirme um plano semanal antes de ajustar sua estratégia.');
  const budget=Number(plan.weeklyPlannedMinutes),capacity=Number(weeklyCapacityMinutes??plan.weeklyAvailableMinutes);
  if(!Number.isFinite(budget)||budget<=0||!Number.isFinite(capacity)||budget>capacity||plan.items.some(item=>!Number.isInteger(item.minutes)||item.minutes<0||excluded.has(item.status)||!item.activityMix||keys.some(key=>!Number.isInteger(item.activityMix[key])||item.activityMix[key]<0)||keys.reduce((sum,key)=>sum+item.activityMix[key],0)!==item.minutes)||plan.items.reduce((sum,item)=>sum+item.minutes,0)!==budget)return unavailable('O plano precisa ter carga consistente e capacidade válida.');
  const cutoff=addLocalDays(today,-ADAPTIVE_COOLDOWN_DAYS);
  const recent=[plan.phaseStrategy?.appliedAt,...history.filter(item=>['applied','reverted'].includes(item.status)).map(item=>item.decidedAt||item.createdAt)].map(localDateFromTimestamp).filter(date=>date&&date<=today).some(date=>date>cutoff);
  if(recent)return {state:'cooldown',reason:`Um ajuste estratégico foi confirmado recentemente. Aguarde ${ADAPTIVE_COOLDOWN_DAYS} dias antes de outro.`,phase,version:1};
  const plannedIds=new Set(plan.items.map(item=>item.topicId||item.id));
  const measured=[...new Map(candidates.filter(item=>plannedIds.has(item.topicId)&&item.mastery!=null&&Number.isFinite(Number(item.mastery))&&Number(item.evidenceStrength)>=.35).map(item=>[item.topicId,item])).values()];
  if(measured.length<2)return unavailable('Registre evidências suficientes em pelo menos dois tópicos antes de adaptar a divisão das atividades.');
  const byTopic=new Map(candidates.map(item=>[item.topicId,item]));
  const changes=[];
  const items=plan.items.map(item=>{
    const candidate=byTopic.get(item.topicId||item.id);
    // Preserve the activity split of topics whose personal evidence is limited.
    if(!candidate||candidate.mastery==null||Number(candidate.evidenceStrength)<.35)return structuredClone(item);
    let weights=[...ratios[phase.state]];
    const reasons=[phase.strategy];
    const critical=candidate.mastery<50&&candidate.examImpact>=70;
    const lowCoverage=candidate.coverage!=null&&Number.isFinite(Number(candidate.coverage))&&candidate.coverage<50;
    if(critical||lowCoverage){
      weights=[Math.max(critical?.35:.4,weights[0]),Math.min(.4,weights[1]),0];weights[2]=1-weights[0]-weights[1];
      reasons.push(critical?'Lacuna de alto impacto: preservar teoria de base.':'Cobertura baixa: preservar aprendizagem e teoria.');
    }else if(item.covered&&candidate.mastery>=70){weights=[0,.55,.45];reasons.push('Conteúdo coberto e domínio adequado: manutenção com questões e revisão.');}
    if(candidate.retention!=null&&candidate.retention<60){const transfer=Math.min(.15,Math.max(0,weights[1]-.2));weights[1]-=transfer;weights[2]+=transfer;reasons.push('Retenção baixa: ampliar a parcela de revisão.');}
    const after=mix(item.minutes,weights),before=item.activityMix;
    if(!before||keys.some(key=>!Number.isFinite(before[key])||before[key]<0)||keys.reduce((sum,key)=>sum+before[key],0)!==item.minutes)return structuredClone(item);
    if(keys.some(key=>after[key]!==before[key]))changes.push({topicId:item.topicId,topicName:item.topicName,subjectName:item.subjectName,before:structuredClone(before),after,reasons,mastery:candidate.mastery,retention:candidate.retention,examImpact:candidate.examImpact,evidenceStrength:candidate.evidenceStrength});
    return {...structuredClone(item),activityMix:after};
  });
  if(!changes.length)return {state:'stable',phase,version:1,reason:'A divisão atual já é adequada à fase ou não há evidência para modificá-la.'};
  return {state:'proposal',version:1,phase,basePlanId:plan.id,budget,capacity,changes,readiness:readiness?structuredClone(readiness):null,candidateEvidence:measured.map(item=>({topicId:item.topicId,coverage:item.coverage,mastery:item.mastery,retention:item.retention,examImpact:item.examImpact,score:item.score,evidenceStrength:item.evidenceStrength})),plan:{...structuredClone(plan),items,weeklyAvailableMinutes:capacity,examPhase:phase}};
}
