import {DEMO_EXPERIENCE_PROFILES} from '../demo-preparation-profiles.js';
import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';
import {freezePlanExecution} from '../../domain/planning/plan-execution-snapshot.js';
import {reconcileDemoPlanExecution} from './plan-execution.js';

// Fictitious evidence only. These hooks never run on real user records.
export function prepareDemoExperienceEvidence(state,{profile,today}){
  const definition=DEMO_EXPERIENCE_PROFILES[profile];
  if(!definition||profile==='final_stretch')return;
  const start=addLocalDays(today,1-definition.historyDays);
  state.studySessions=state.studySessions.filter(row=>row.date>=start);
  const ids=new Set(state.studySessions.map(row=>row.id));
  state.questoes=state.questoes.filter(row=>ids.has(row.studySessionId));
  state.simulados=state.simulados.filter(row=>row.date>=start);
  if(profile==='beginner'){
    state.studySessions=state.studySessions.slice(-3);
    const kept=new Set(state.studySessions.map(row=>row.id));
    state.questoes=state.questoes.filter(row=>kept.has(row.studySessionId));
    state.reviewAgenda=[];
    for(const subject of state.subjects)for(const topic of subject.topics){topic.status='Não iniciado';topic.firstCompletedAt=null;topic.lastCompletedAt=null;topic.completionCount=0;}
  }
  if(profile==='irregular'||profile==='high_performance'){
    const rate=profile==='high_performance'?0.95:0.85;
    for(const row of state.questoes){
      row.correct=Math.round(row.resolved*rate);
      const keys=Object.keys(row.errorBreakdown||{});
      row.errorBreakdown=Object.fromEntries(keys.map((key,index)=>[key,index===0?row.resolved-row.correct:0]));
      const session=state.studySessions.find(item=>item.id===row.studySessionId);
      if(session)session.correctAnswers=row.correct;
    }
  }
  if(profile==='high_performance'||profile==='irregular'){
    for(const subject of state.subjects)for(const topic of subject.topics){topic.status='Concluído';topic.firstCompletedAt=start+'T12:00:00.000Z';topic.lastCompletedAt=topic.firstCompletedAt;topic.completionCount=1;}
    for(const review of state.reviewAgenda)if(review.date<=today){review.status='Concluído';review.completedAt=review.date+'T12:00:00.000Z';}
  }
}

export function prepareDemoExperienceExecution(state,{profile,today}){
  const definition=DEMO_EXPERIENCE_PROFILES[profile];
  if(!definition||profile==='final_stretch')return;
  const start=addLocalDays(today,1-definition.historyDays);
  state.dailyPlans=state.dailyPlans.filter(row=>row.date>=start);
  // Ensure the current week is represented, rather than extrapolating old execution.
  const template=state.dailyPlans.find(row=>row.date===today);
  for(let offset=-6;offset<0;offset++){
    const date=addLocalDays(today,offset);
    if(state.dailyPlans.some(row=>row.date===date))continue;
    const plan=structuredClone(template);plan.id='demo-profile-plan-'+date;plan.date=date;plan.createdAt=date+'T06:00:00.000Z';plan.updatedAt=plan.createdAt;
    plan.items=plan.items.map((item,index)=>({...item,id:plan.id+'-'+index,originalDate:date,currentDate:date,sessionIds:[],executedSeconds:0,status:'planned',prioritySnapshot:{priority:index===0,source:'demo-scripted',capturedAt:plan.createdAt}}));
    for(const item of plan.items){delete item.executionSnapshot;freezePlanExecution(item,{date,capturedAt:plan.createdAt,activeExamTags:state.examBlueprint.activeExamTags});}
    state.dailyPlans.push(plan);
  }
  if(profile!=='beginner')for(const plan of state.dailyPlans.filter(row=>row.date<today))for(const item of plan.items){
    // Replace only fictional execution for this block; question results remain separate.
    for(const session of state.studySessions)if(session.planItemId===item.id)delete session.planItemId;
    const durationSeconds=Math.round(item.plannedMinutes*60*definition.executionRatio),id='demo-profile-session-'+item.id;
    const startedAt=plan.date+'T12:00:00.000Z';
    state.studySessions.push({id,date:plan.date,subjectId:item.subjectId,topicId:item.topicId,type:item.type,durationSeconds,planItemId:item.id,startedAt,endedAt:new Date(Date.parse(startedAt)+durationSeconds*1000).toISOString(),createdAt:startedAt,notes:'Execução fictícia do perfil '+definition.label});
    item.sessionIds=[id];item.executedSeconds=durationSeconds;item.status='partial';item.lastExecutedAt=state.studySessions.at(-1).endedAt;item.skippedReason=null;
  }
  state.dailyPlans.sort((a,b)=>a.date.localeCompare(b.date));
  state.studySessions.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  if(profile==='irregular'){
    const weeks=new Map(),capacity=Object.values(state.metas.horasPorDia).reduce((sum,value)=>sum+value*60,0);
    for(const session of state.studySessions){const monday=addLocalDays(session.date,-((parseLocalDate(session.date).getDay()+6)%7));if(!weeks.has(monday))weeks.set(monday,[]);weeks.get(monday).push(session);}
    for(const sessions of weeks.values()){
      const total=sessions.reduce((sum,row)=>sum+row.durationSeconds,0),budget=Math.round(capacity*60*definition.executionRatio);
      // Keep question evidence and identities; constrain all fictional study, including unmatched sessions.
      for(const session of sessions){session.durationSeconds=Math.max(1,Math.floor(session.durationSeconds/total*budget));session.endedAt=new Date(Date.parse(session.startedAt)+session.durationSeconds*1000).toISOString();}
    }
    state.dailyPlans=reconcileDemoPlanExecution(state.dailyPlans,state.studySessions,{today});
  }
}
