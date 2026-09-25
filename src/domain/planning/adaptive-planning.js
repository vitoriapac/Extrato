export const ADAPTIVE_PLANNING_VERSION=3;
export const ADAPTIVE_TRANSFER_MINUTES=15;
export const ADAPTIVE_TRANSFER_MAX_MINUTES=40;
export const ADAPTIVE_COOLDOWN_DAYS=14;
export const EXAM_PHASE_THRESHOLDS=Object.freeze({construction:90,consolidation:30,finalStretch:7});

export function resolveExamPhase(daysToExam,thresholds=EXAM_PHASE_THRESHOLDS){
  if(daysToExam==null||!Number.isFinite(Number(daysToExam)))return {state:'undated',label:'Prova sem data',strategy:'Defina a data da prova para ajustar o foco do estudo.'};
  const days=Math.max(0,Math.floor(Number(daysToExam)));
  if(days>thresholds.construction)return {state:'construction',label:'Construção',strategy:'Priorize teoria e cobertura do edital.',days};
  if(days>thresholds.consolidation)return {state:'consolidation',label:'Consolidação',strategy:'Combine questões, revisão e tópicos ainda não cobertos.',days};
  if(days>thresholds.finalStretch)return {state:'final_stretch',label:'Reta final',strategy:'Concentre-se nas lacunas e nas revisões de maior impacto.',days};
  return {state:'final_review',label:'Revisão final',strategy:'Priorize revisões críticas, questões e simulados.',days};
}

const minutesValue=value=>value==null||value===''||!Number.isFinite(Number(value))||Number(value)<0?null:Math.round(Number(value));
const sameMinutes=(left,right)=>Math.abs(left-right)<.001;

function validPlanBudget(plan){
  const budget=minutesValue(plan?.weeklyPlannedMinutes),subjects=Array.isArray(plan?.subjects)?plan.subjects:[],items=Array.isArray(plan?.items)?plan.items:[];
  if(!budget||!subjects.length||!items.length)return false;
  if(plan.weeklyAvailableMinutes!=null){const available=minutesValue(plan.weeklyAvailableMinutes);if(available==null||available===0||budget>available)return false;}
  const subjectIds=subjects.map(item=>item.subjectId).filter(Boolean);
  if(new Set(subjectIds).size<2||subjectIds.length!==subjects.length)return false;
  const subjectTotal=subjects.reduce((sum,item)=>sum+(minutesValue(item.minutes)??NaN),0);
  const itemTotal=items.reduce((sum,item)=>sum+(minutesValue(item.minutes)??NaN),0);
  if(!Number.isFinite(subjectTotal)||!Number.isFinite(itemTotal)||!sameMinutes(subjectTotal,budget)||!sameMinutes(itemTotal,budget))return false;
  const grouped=new Map(subjectIds.map(id=>[id,0]));
  for(const item of items){
    const minutes=minutesValue(item.minutes),capacity=minutesValue(item.capacityMinutes);
    if(!grouped.has(item.subjectId)||minutes==null||capacity==null||minutes>capacity)return false;
    const mix=item.activityMix,activityTotal=['theory','questions','reviews'].reduce((sum,key)=>sum+(minutesValue(mix?.[key])??NaN),0);
    if(!Number.isFinite(activityTotal)||!sameMinutes(activityTotal,minutes))return false;
    grouped.set(item.subjectId,grouped.get(item.subjectId)+minutes);
  }
  return subjects.every(subject=>sameMinutes(grouped.get(subject.subjectId)??-1,subject.minutes));
}

export function buildAdaptivePlanningAdvice({plan=null,candidates=[],history=[],today=new Date().toISOString().slice(0,10),minimumEvidence=.5}={}){
  const budget=Math.max(0,Number(plan?.weeklyPlannedMinutes)||0);
  if(!validPlanBudget(plan))return {state:'insufficient',reason:'É necessário um plano consistente, com disponibilidade e ao menos duas disciplinas.',algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const measured=(Array.isArray(candidates)?candidates:[]).filter(item=>item.subjectId&&item.mastery!=null&&Number(item.evidenceStrength)>=minimumEvidence);
  const groups=plan.subjects.map(subject=>{
    const rows=measured.filter(item=>item.subjectId===subject.subjectId),weight=rows.reduce((sum,item)=>sum+Math.max(.1,Number(item.evidenceStrength)||0),0);
    const mastery=weight?Math.round(rows.reduce((sum,item)=>sum+item.mastery*Math.max(.1,Number(item.evidenceStrength)||0),0)/weight):null;
    const impact=rows.length?Math.max(...rows.map(item=>Number(item.examImpact)||0)):null;
    return {...subject,mastery,impact,falling:rows.some(item=>item.trend?.direction==='down'||item.trend?.key==='down'),severeDeterioration:rows.some(item=>(item.trend?.direction==='down'||item.trend?.key==='down')&&(item.trend?.state==='strong_down'||Number(item.trend?.delta)<=-12)&&Number(item.evidenceStrength)>=.7),measuredTopics:rows.length};
  });
  const source=groups.filter(item=>item.mastery>=80&&!item.falling&&item.minutes>=45).sort((a,b)=>b.mastery-a.mastery)[0];
  const target=groups.filter(item=>item.subjectId!==source?.subjectId&&item.impact>=50&&(item.mastery<=60||item.falling)).sort((a,b)=>(a.mastery??100)-(b.mastery??100))[0];
  if(!source||!target)return groups.filter(item=>item.measuredTopics).length<2
    ?{state:'insufficient',reason:'Ainda não há evidência comparável em pelo menos duas disciplinas.',algorithmVersion:ADAPTIVE_PLANNING_VERSION}
    :{state:'stable',reason:'Seu plano continua adequado. Os indicadores atuais não justificam retirar tempo de uma disciplina consolidada para uma lacuna prioritária.',algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const sourceItem=plan.items.filter(item=>item.subjectId===source.subjectId&&item.minutes>15).sort((a,b)=>b.minutes-a.minutes)[0];
  const targetItem=plan.items.filter(item=>item.subjectId===target.subjectId&&item.capacityMinutes>item.minutes).sort((a,b)=>(b.capacityMinutes-b.minutes)-(a.capacityMinutes-a.minutes))[0];
  const transferMinutes=Math.min(ADAPTIVE_TRANSFER_MAX_MINUTES,Math.floor(source.minutes*.25),source.minutes-30,(sourceItem?.minutes??0)-15,(targetItem?.capacityMinutes??0)-(targetItem?.minutes??0));
  if(transferMinutes<ADAPTIVE_TRANSFER_MINUTES)return {state:'stable',reason:'Seu plano continua adequado. A capacidade disponível não permite transferir ao menos 15 minutos sem comprometer a manutenção.',algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const recentReverse=(Array.isArray(history)?history:[]).filter(item=>item.status==='applied'&&item.sourceSubjectId===target.subjectId&&item.targetSubjectId===source.subjectId).sort((a,b)=>String(b.decidedAt||b.createdAt).localeCompare(String(a.decidedAt||a.createdAt)))[0];
  const elapsed=recentReverse?Math.floor((Date.parse(`${today}T00:00:00Z`)-Date.parse(`${String(recentReverse.decidedAt||recentReverse.createdAt).slice(0,10)}T00:00:00Z`))/(24*60*60*1000)):Infinity;
  const relevantDeterioration=target.severeDeterioration&&target.mastery<=45;
  if(elapsed>=0&&elapsed<ADAPTIVE_COOLDOWN_DAYS&&!relevantDeterioration)return {state:'stable',reason:`Seu plano continua adequado. Um ajuste entre essas disciplinas foi aplicado há menos de duas semanas; aguarde novas evidências antes de inverter a transferência.`,algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const rationale=[
    `Disciplina de origem consolidada: domínio ${source.mastery}/100${source.falling?' com tendência recente em queda':''}.`,
    target.falling?'Disciplina de destino com tendência recente em queda.':`Disciplina de destino com domínio ${target.mastery}/100.`,
    `Impacto da disciplina de destino na prova: ${target.impact}/100.`,
    `A transferência mantém a carga semanal em ${budget} minutos. O bloco fica entre 15 e 40 minutos.`,
    ...(elapsed>=0&&elapsed<ADAPTIVE_COOLDOWN_DAYS&&relevantDeterioration?['Exceção ao intervalo de duas semanas: queda relevante de domínio, confirmada por evidência forte.']:[])
  ];
  return {state:'proposal',algorithmVersion:ADAPTIVE_PLANNING_VERSION,transferMinutes,weeklyBudgetMinutes:budget,
    from:{subjectId:source.subjectId,name:source.subjectName,beforeMinutes:source.minutes,afterMinutes:source.minutes-transferMinutes,mastery:source.mastery},
    to:{subjectId:target.subjectId,name:target.subjectName,beforeMinutes:target.minutes,afterMinutes:target.minutes+transferMinutes,mastery:target.mastery,impact:target.impact,falling:target.falling},
    reason:'A proposta move tempo de um conteúdo consolidado para uma lacuna relevante sem aumentar a carga semanal.',rationale,applied:false};
}

const scaleMix=(mix,minutes)=>{
  const keys=['theory','questions','reviews'],total=keys.reduce((sum,key)=>sum+(Number(mix?.[key])||0),0);
  if(!total)return {theory:minutes,questions:0,reviews:0};
  const next=Object.fromEntries(keys.map(key=>[key,Math.floor(minutes*(Number(mix[key])||0)/total)]));
  next[keys.sort((a,b)=>(Number(mix[b])||0)-(Number(mix[a])||0))[0]]+=minutes-Object.values(next).reduce((sum,value)=>sum+value,0);
  return next;
};

export function applyAdaptivePlanningAdvice(plan,advice){
  if(advice?.state!=='proposal'||advice.applied||!validPlanBudget(plan)||!advice.from?.subjectId||!advice.to?.subjectId||advice.from.subjectId===advice.to.subjectId)return null;
  const budget=minutesValue(plan.weeklyPlannedMinutes),requested=minutesValue(advice.transferMinutes);
  if(requested==null||requested<ADAPTIVE_TRANSFER_MINUTES||requested>ADAPTIVE_TRANSFER_MAX_MINUTES||!sameMinutes(minutesValue(advice.weeklyBudgetMinutes)??-1,budget))return null;
  const fromSubject=plan.subjects.find(item=>item.subjectId===advice.from.subjectId),toSubject=plan.subjects.find(item=>item.subjectId===advice.to.subjectId);
  if(!fromSubject||!toSubject||!sameMinutes(fromSubject.minutes,advice.from.beforeMinutes)||!sameMinutes(toSubject.minutes,advice.to.beforeMinutes))return null;
  const from=plan.items.filter(item=>item.subjectId===advice.from.subjectId&&item.minutes>15).sort((a,b)=>b.minutes-a.minutes)[0];
  const to=plan.items.filter(item=>item.subjectId===advice.to.subjectId&&item.capacityMinutes>item.minutes).sort((a,b)=>(b.capacityMinutes-b.minutes)-(a.capacityMinutes-a.minutes))[0];
  if(!from||!to||requested>from.minutes-15||requested>to.capacityMinutes-to.minutes)return null;
  if(!sameMinutes(advice.from.afterMinutes,fromSubject.minutes-requested)||!sameMinutes(advice.to.afterMinutes,toSubject.minutes+requested))return null;
  const moved=requested;
  const next=structuredClone(plan),source=next.items.find(item=>item.id===from.id),target=next.items.find(item=>item.id===to.id);
  source.minutes-=moved;target.minutes+=moved;
  source.activityMix=scaleMix(source.activityMix,source.minutes);target.activityMix=scaleMix(target.activityMix,target.minutes);
  next.subjects=next.subjects.map(item=>item.subjectId===advice.from.subjectId?{...item,minutes:item.minutes-moved}:item.subjectId===advice.to.subjectId?{...item,minutes:item.minutes+moved}:item);
  next.maintenanceMinutes=next.items.filter(item=>item.covered).reduce((sum,item)=>sum+item.minutes,0);
  next.adaptiveAdvice={...advice,transferMinutes:moved,applied:true};
  return validPlanBudget(next)&&sameMinutes(next.weeklyPlannedMinutes,budget)&&sameMinutes(next.weeklyAvailableMinutes??budget,plan.weeklyAvailableMinutes??budget)?next:null;
}
