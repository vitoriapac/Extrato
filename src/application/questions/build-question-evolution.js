import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';

const number=value=>Math.max(0,Number(value)||0);
const percent=(correct,total)=>total?Math.round(correct/total*100):null;
const bucketKey=(date,monthly)=>{
  if(monthly)return date.slice(0,7);
  const weekday=parseLocalDate(date)?.getDay();
  return weekday==null?null:addLocalDays(date,-((weekday+6)%7));
};

export function buildQuestionEvolution({questions=[],today,scope='all',subjectId='',topicId='',period='90'}={}){
  const monthly=period==='180'||period==='all';
  const days=period==='all'?null:Number(period)||90;
  const cutoff=days?addLocalDays(today,-(days-1)):null;
  const groups=new Map();
  for(const question of questions){
    if(!parseLocalDate(question.date)||question.date>today||(cutoff&&question.date<cutoff))continue;
    if(scope==='subject'&&question.subjectId!==subjectId)continue;
    if(scope==='topic'&&question.topicId!==topicId)continue;
    const total=number(question.resolved),correct=Math.min(total,number(question.correct));
    if(!total)continue;
    const key=bucketKey(question.date,monthly);
    const group=groups.get(key)||{key,correct:0,errors:0,resolved:0};
    group.correct+=correct;group.errors+=total-correct;group.resolved+=total;
    groups.set(key,group);
  }
  const buckets=[...groups.values()].sort((a,b)=>a.key.localeCompare(b.key)).map((group,index,array)=>{
    const window=array.slice(Math.max(0,index-2),index+1);
    const windowTotal=window.reduce((sum,item)=>sum+item.resolved,0);
    const windowCorrect=window.reduce((sum,item)=>sum+item.correct,0);
    return {...group,accuracy:group.resolved>=10?percent(group.correct,group.resolved):null,
      movingAccuracy:windowTotal>=30?percent(windowCorrect,windowTotal):null,windowTotal};
  });
  const resolved=buckets.reduce((sum,item)=>sum+item.resolved,0);
  const correct=buckets.reduce((sum,item)=>sum+item.correct,0);
  return {buckets,resolved,correct,accuracy:percent(correct,resolved),monthly,minimumQuestions:30,
    state:!resolved?'empty':buckets.filter(item=>item.movingAccuracy!==null).length<2?'insufficient':'ready'};
}
