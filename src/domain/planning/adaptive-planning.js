export const ADAPTIVE_PLANNING_VERSION=1;
export const EXAM_PHASE_THRESHOLDS=Object.freeze({construction:90,consolidation:30,finalStretch:7});

export function resolveExamPhase(daysToExam,thresholds=EXAM_PHASE_THRESHOLDS){
  if(daysToExam==null||!Number.isFinite(Number(daysToExam)))return {state:'undated',label:'Prova sem data',strategy:'Defina a data da prova para ajustar o foco do estudo.'};
  const days=Math.max(0,Math.floor(Number(daysToExam)));
  if(days>thresholds.construction)return {state:'construction',label:'Construção',strategy:'Priorize teoria e cobertura do edital.',days};
  if(days>thresholds.consolidation)return {state:'consolidation',label:'Consolidação',strategy:'Combine questões, revisão e tópicos ainda não cobertos.',days};
  if(days>thresholds.finalStretch)return {state:'final_stretch',label:'Reta final',strategy:'Concentre-se nas lacunas e nas revisões de maior impacto.',days};
  return {state:'final_review',label:'Revisão final',strategy:'Priorize revisões críticas, questões e simulados.',days};
}

export function buildAdaptivePlanningAdvice({plan=null,candidates=[],minimumEvidence=.5}={}){
  const budget=Math.max(0,Number(plan?.weeklyPlannedMinutes)||0);
  if(!budget||!Array.isArray(plan?.subjects)||plan.subjects.length<2)return {state:'insufficient',reason:'É necessário um plano semanal com pelo menos duas disciplinas.',algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const measured=(Array.isArray(candidates)?candidates:[]).filter(item=>item.subjectId&&item.mastery!=null&&Number(item.evidenceStrength)>=minimumEvidence);
  const groups=plan.subjects.map(subject=>{
    const rows=measured.filter(item=>item.subjectId===subject.subjectId),weight=rows.reduce((sum,item)=>sum+Math.max(.1,Number(item.evidenceStrength)||0),0);
    const mastery=weight?Math.round(rows.reduce((sum,item)=>sum+item.mastery*Math.max(.1,Number(item.evidenceStrength)||0),0)/weight):null;
    const impact=rows.length?Math.max(...rows.map(item=>Number(item.examImpact)||0)):null;
    return {...subject,mastery,impact,falling:rows.some(item=>item.trend?.direction==='down'||item.trend?.key==='down'),measuredTopics:rows.length};
  });
  const source=groups.filter(item=>item.mastery>=80&&!item.falling&&item.minutes>=45).sort((a,b)=>b.mastery-a.mastery)[0];
  const target=groups.filter(item=>item.subjectId!==source?.subjectId&&item.impact>=50&&(item.mastery<=60||item.falling)).sort((a,b)=>(a.mastery??100)-(b.mastery??100))[0];
  if(!source||!target)return {state:'insufficient',reason:'Ainda não há evidência comparável de disciplina consolidada e lacuna prioritária.',algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const sourceItem=plan.items?.filter(item=>item.subjectId===source.subjectId&&item.minutes>15).sort((a,b)=>b.minutes-a.minutes)[0];
  const targetItem=plan.items?.filter(item=>item.subjectId===target.subjectId&&item.capacityMinutes>item.minutes).sort((a,b)=>(b.capacityMinutes-b.minutes)-(a.capacityMinutes-a.minutes))[0];
  const transferMinutes=Math.min(40,Math.floor(source.minutes*.25),source.minutes-30,(sourceItem?.minutes||0)-15,(targetItem?.capacityMinutes||0)-(targetItem?.minutes||0));
  if(transferMinutes<15)return {state:'insufficient',reason:'A carga atual não permite redistribuir um bloco útil sem reduzir a manutenção.',algorithmVersion:ADAPTIVE_PLANNING_VERSION};
  const rationale=[
    `Disciplina de origem consolidada: domínio ${source.mastery}/100${source.falling?' com tendência recente em queda':''}.`,
    target.falling?'Disciplina de destino com tendência recente em queda.':`Disciplina de destino com domínio ${target.mastery}/100.`,
    `Impacto da disciplina de destino na prova: ${target.impact}/100.`,
    `A transferência mantém a carga semanal em ${budget} minutos.`
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
  if(advice?.state!=='proposal'||advice.applied||!plan?.items?.length)return null;
  const from=plan.items.filter(item=>item.subjectId===advice.from.subjectId&&item.minutes>15).sort((a,b)=>b.minutes-a.minutes)[0];
  const to=plan.items.filter(item=>item.subjectId===advice.to.subjectId&&item.capacityMinutes>item.minutes).sort((a,b)=>(b.capacityMinutes-b.minutes)-(a.capacityMinutes-a.minutes))[0];
  if(!from||!to)return null;
  const moved=Math.min(advice.transferMinutes,from.minutes-15,to.capacityMinutes-to.minutes);
  if(moved<15)return null;
  const next=structuredClone(plan),source=next.items.find(item=>item.id===from.id),target=next.items.find(item=>item.id===to.id);
  source.minutes-=moved;target.minutes+=moved;
  source.activityMix=scaleMix(source.activityMix,source.minutes);target.activityMix=scaleMix(target.activityMix,target.minutes);
  next.subjects=next.subjects.map(item=>item.subjectId===advice.from.subjectId?{...item,minutes:item.minutes-moved}:item.subjectId===advice.to.subjectId?{...item,minutes:item.minutes+moved}:item);
  next.maintenanceMinutes=next.items.filter(item=>item.covered).reduce((sum,item)=>sum+item.minutes,0);
  next.adaptiveAdvice={...advice,transferMinutes:moved,applied:true};
  return next;
}
