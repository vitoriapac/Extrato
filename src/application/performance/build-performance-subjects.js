import {buildQuestionEvolution} from '../questions/build-question-evolution.js';
import {buildSubjectAccuracy} from '../analytics/build-subject-accuracy.js';

const inRange=(date,range)=>Boolean(date&&range?.end&&date<=range.end&&(!range.start||date>=range.start));
const total=items=>items.reduce((sum,item)=>sum+Math.max(0,Number(item.resolved)||0),0);
const correct=items=>items.reduce((sum,item)=>sum+Math.min(Math.max(0,Number(item.resolved)||0),Math.max(0,Number(item.correct)||0)),0);
const precision=items=>total(items)?Math.round(correct(items)/total(items)*1000)/10:null;
const difference=(before,after)=>before==null||after==null?null:Math.round((after-before)*10)/10;

export function buildPerformanceSubjects({subjects=[],subjectId=null,range,today,period='30',questions=[],sessions=[],reviews=[],simulations=[],blueprint={},globalTarget=80,metricsByTopic={}}={}){
  const subject=subjects.find(item=>item.id===subjectId)||subjects[0]||null;
  if(!subject)return {state:'empty',subjects,subject:null,topics:[]};
  const id=subject.id,topicIds=new Set((subject.topics||[]).filter(item=>!item.archived).map(item=>item.id));
  const owned=questions.filter(item=>item.subjectId===id&&topicIds.has(item.topicId));
  const current=owned.filter(item=>inRange(item.date,range));
  const previous=range?.previous?owned.filter(item=>inRange(item.date,range.previous)):[];
  const goal=buildSubjectAccuracy({subjects:[subject],questions:current,simulations:simulations.filter(item=>inRange(item.date,range)),blueprint,globalTarget})[0];
  const periodEvolution=buildQuestionEvolution({questions:current,today,scope:'subject',subjectId:id,period});
  const topicRows=(subject.topics||[]).filter(item=>topicIds.has(item.id)).map(item=>{
    const now=current.filter(record=>record.topicId===item.id),before=previous.filter(record=>record.topicId===item.id);
    const recent=precision(now),prior=precision(before),sample=total(now),earlier=total(before),metric=metricsByTopic[item.id]||{};
    return {id:item.id,name:item.name,accuracy:recent,questions:sample,mastery:metric.mastery??null,retention:metric.retention??null,evidence:metric.evidence??null,
      delta:range?.comparePrevious&&sample>=10&&earlier>=10?difference(prior,recent):null,
      state:sample<10?'Amostra insuficiente':recent>=goal.target?'Na meta':'Abaixo da meta'};
  }).sort((a,b)=>b.questions-a.questions||a.name.localeCompare(b.name,'pt-BR'));
  const activity={minutes:Math.round(sessions.filter(item=>item.subjectId===id&&inRange(item.date,range)).reduce((sum,item)=>sum+(Number(item.durationSeconds)||0)/60,0)),
    questions:total(current),reviews:reviews.filter(item=>item.subjectId===id&&item.status==='Concluído'&&inRange(item.completedDate,range)).length};
  const measured=key=>topicRows.filter(row=>row[key]!=null&&(key!=='mastery'||row.evidence>0));
  const average=key=>{const rows=measured(key);return rows.length?Math.round(rows.reduce((sum,row)=>sum+Number(row[key]),0)/rows.length):null};
  return {state:'ready',subjects,subject,goal,accuracy:goal.personal.accuracy,previousAccuracy:total(previous)>=10?precision(previous):null,
    trend:range?.comparePrevious&&total(current)>=10&&total(previous)>=10?difference(precision(previous),precision(current)):null,
    mastery:average('mastery'),retention:average('retention'),masteryEvidence:measured('mastery').length,retentionEvidence:measured('retention').length,activity,evolution:periodEvolution,topics:topicRows};
}
