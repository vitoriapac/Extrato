import {buildSubjectAccuracy} from '../analytics/build-subject-accuracy.js';

const inRange=(date,range)=>Boolean(date&&range?.end&&date<=range.end&&(!range.start||date>=range.start));
const rounded=value=>Math.round(value*10)/10;
export const PERFORMANCE_SUBJECT_SORTS=Object.freeze(['gap','accuracy','evolution','questions','priority']);

export function buildPerformanceSubjectComparison({subjects=[],questions=[],range,blueprint={},globalTarget=80,candidates=[],sort='gap'}={}){
  const current=questions.filter(item=>inRange(item.date,range));
  const previous=range?.previous?questions.filter(item=>inRange(item.date,range.previous)):[];
  const currentRows=buildSubjectAccuracy({subjects,questions:current,blueprint,globalTarget});
  const previousRows=new Map(buildSubjectAccuracy({subjects,questions:previous,blueprint,globalTarget}).map(item=>[item.subjectId,item]));
  const priorityBySubject=new Map();
  for(const item of candidates){
    if(!item.subjectId||!Number.isFinite(Number(item.score)))continue;
    priorityBySubject.set(item.subjectId,Math.max(priorityBySubject.get(item.subjectId)??-Infinity,Number(item.score)));
  }
  const rows=currentRows.map(item=>{
    const earlier=previousRows.get(item.subjectId)?.personal;
    const enough=item.personal.total>=10;
    return {subjectId:item.subjectId,name:item.name,target:item.target,accuracy:item.personal.accuracy,questions:item.personal.total,
      gap:enough?item.personal.gap:null,state:enough?item.personal.state:'insufficient',
      evolution:range?.comparePrevious&&enough&&earlier?.total>=10?rounded(item.personal.accuracy-earlier.accuracy):null,
      priority:priorityBySubject.get(item.subjectId)??null};
  });
  const selected=PERFORMANCE_SUBJECT_SORTS.includes(sort)?sort:'gap';
  const metric={gap:item=>item.gap==null?Infinity:item.gap,accuracy:item=>item.accuracy==null?Infinity:item.accuracy,evolution:item=>item.evolution==null?Infinity:item.evolution,questions:item=>-item.questions,priority:item=>item.priority==null?Infinity:-item.priority}[selected];
  rows.sort((a,b)=>metric(a)-metric(b)||a.name.localeCompare(b.name,'pt-BR'));
  return {rows,sort:selected,measured:rows.filter(item=>item.state!=='insufficient').length};
}
