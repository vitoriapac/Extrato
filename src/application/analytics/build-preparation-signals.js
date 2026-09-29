import {addLocalDays} from '../../core/date-utils.js';
import {resolveSubjectAccuracyTarget} from '../../domain/analytics/subject-accuracy-target.js';
const count=value=>Math.max(0,Number(value)||0);
const totals=records=>{
 const total=records.reduce((sum,item)=>sum+count(item.resolved),0),correct=records.reduce((sum,item)=>sum+Math.min(count(item.resolved),count(item.correct)),0);
 return {total,accuracy:total?Math.round(correct/total*1000)/10:null};
};
const inRange=(item,start,end)=>item.date>=start&&item.date<=end;
export function buildPreparationSignals({subjects=[],candidates=[],questions=[],sessions=[],blueprint={},globalTarget=80,today}={}){
 const rows=[],seen=new Set(),uniqueQuestions=questions.filter(item=>item.id&&!seen.has(item.id)&&seen.add(item.id)),sessionMap=new Map(sessions.map(item=>[item.id,item]));
 const end=addLocalDays(today,-1),start=addLocalDays(today,-28);
 for(const subject of subjects){
  const target=resolveSubjectAccuracyTarget(subject.id,blueprint,globalTarget);
  const weeks=Array.from({length:4},(_,index)=>{const first=addLocalDays(start,index*7),last=addLocalDays(first,6);return {start:first,end:last,...totals(uniqueQuestions.filter(item=>item.subjectId===subject.id&&inRange(item,first,last)))};});
  const study=[...sessionMap.values()].filter(item=>item.subjectId===subject.id&&count(item.durationSeconds)>0&&inRange(item,start,end)),minutes=Math.round(study.reduce((sum,item)=>sum+count(item.durationSeconds),0)/60);
  const enough=weeks.every(week=>week.total>=30)&&minutes>=120&&new Set(study.map(item=>item.date)).size>=3;
  if(enough&&Math.max(...weeks.map(week=>week.accuracy))-Math.min(...weeks.map(week=>week.accuracy))<=3&&weeks.at(-1).accuracy<target-3){
   const before=weeks[0].total+weeks[1].total,after=weeks[2].total+weeks[3].total;
   rows.push({id:'plateau-'+subject.id,type:'plateau',name:subject.name,title:'Possível platô',weeks,minutes,questionCount:before+after,target,message:after>before?'O volume aumentou, mas a precisão permaneceu praticamente estável.':'A precisão permaneceu praticamente estável apesar de prática recorrente.',action:'Investigue as categorias de erro, os tópicos problemáticos e a abordagem de estudo.',limitation:'Quatro semanas completas, pelo menos 30 questões por semana e 120 minutos de estudo. A seleção e a dificuldade das questões podem variar; estabilidade não demonstra causa.'});
  }
 }
 for(const item of candidates){
  const target=resolveSubjectAccuracyTarget(item.subjectId,blueprint,globalTarget),recent=totals(uniqueQuestions.filter(question=>question.topicId===item.topicId&&question.subjectId===item.subjectId&&inRange(question,addLocalDays(today,-13),today)));
  const strength=item.evidenceStrength??item.evidence?.evidenceStrength;
  if(item.mastery!=null&&item.retention!=null&&item.mastery>=80&&item.retention<60&&strength>=.35&&recent.total>=30&&recent.accuracy<target-10){
   rows.push({id:'consolidation-'+item.topicId,type:'consolidation',name:item.topicName||item.name||'Tópico',title:'Consolidação em risco',mastery:item.mastery,retention:item.retention,accuracy:recent.accuracy,questionCount:recent.total,target,confidence:strength,message:'O domínio registrado está alto, mas a precisão recente e a retenção não confirmam uma consolidação segura.',action:'Revise os erros recentes e avalie uma revisão antes de reduzir a atenção ao tópico.',limitation:'Exige domínio de pelo menos 80, retenção abaixo de 60, evidência moderada e 30 questões nos últimos 14 dias. Não altera automaticamente a prioridade ou o plano.'});
  }
 }
 return {rows,start,end};
}
