import {examsInScope} from '../../domain/exam-intelligence/exam-evidence.js';
import {isTopicInExamScope} from '../../domain/exams/exam-scope.js';
import {classifyExamConfidence,EXAM_CONFIDENCE_LABELS} from '../../domain/exam-intelligence/exam-confidence.js';

const byName=(a,b)=>String(a).localeCompare(String(b),'pt-BR');
const options=values=>[...new Set(values.filter(Boolean))].sort(byName);
const percentage=(part,total)=>total?Math.round(part/total*100):null;

export function buildExamMatrix({topics=[],exams=[],examQuestions=[],activeExamTags=[],filters={},metricsByTopic={},auditByTopic={}}={}){
  const tags=options(exams.flatMap(exam=>exam.examTags||[]));
  const scope=filters.scope||'active';
  const scoped=scope==='all'?exams:scope==='active'?examsInScope(exams,activeExamTags):examsInScope(exams,[scope]);
  const boards=options(scoped.map(exam=>exam.board)),years=[...new Set(scoped.map(exam=>exam.year).filter(Number.isInteger))].sort((a,b)=>b-a),roles=options(scoped.map(exam=>exam.role));
  const selected=scoped.filter(exam=>(!filters.board||filters.board==='all'||exam.board===filters.board)&&(!filters.year||filters.year==='all'||String(exam.year)===String(filters.year))&&(!filters.role||filters.role==='all'||exam.role===filters.role));
  const complete=selected.filter(exam=>exam.coverage==='complete').sort((a,b)=>a.year-b.year||String(a.date||'').localeCompare(String(b.date||''))||byName(a.examName,b.examName));
  const ids=new Set(complete.map(exam=>exam.id));
  const indexed=new Map();let analyzedQuestionCount=0;
  for(const question of examQuestions){
    if(!ids.has(question.examId))continue;
    analyzedQuestionCount++;
    const key=`${question.topicId}|${question.examId}`,list=indexed.get(key)||[];
    list.push(question);indexed.set(key,list);
  }
  const topicScope=scope==='active'?activeExamTags:scope==='all'?[]:[scope];
  const rows=topics.filter(topic=>!topic.archived&&!topic.topicArchived&&!topic.subjectArchived&&isTopicInExamScope(topic,topicScope)).map(topic=>{
    const cells=complete.map(exam=>{
      const questions=indexed.get(`${topic.id}|${exam.id}`)||[];
      const weighted=questions.filter(question=>Number.isFinite(question.weight));
      return {examId:exam.id,year:exam.year,examName:exam.examName,count:questions.length,weight:weighted.length?Math.round(weighted.reduce((sum,question)=>sum+question.weight,0)*100)/100:null};
    });
    const count=cells.reduce((sum,cell)=>sum+cell.count,0),present=cells.filter(cell=>cell.count>0).length;
    const classified=complete.flatMap(exam=>indexed.get(`${topic.id}|${exam.id}`)||[]);
    const confidence=classifyExamConfidence({examCount:complete.length,questionCount:analyzedQuestionCount,classificationConfidence:classified.length?classified.reduce((sum,question)=>sum+(question.classification?.confidence??0),0)/classified.length:null});
    const metric=metricsByTopic[topic.id]||{};
    return {topicId:topic.id,subjectId:topic.subjectId,name:topic.name,subjectName:topic.subjectName,examCount:complete.length,presentExamCount:present,questionCount:count,presencePercent:percentage(present,complete.length),participationPercent:percentage(count,analyzedQuestionCount),confidence,confidenceLabel:EXAM_CONFIDENCE_LABELS[confidence],cells,mastery:metric.mastery??null,retention:metric.retention??null,trend:metric.trend??null,priority:metric.priority??null,audit:auditByTopic[topic.id]||null};
  }).sort((a,b)=>(b.presencePercent??-1)-(a.presencePercent??-1)||b.questionCount-a.questionCount||byName(a.name,b.name));
  return {state:complete.length?'available':'empty',filters:{scope,board:filters.board||'all',year:filters.year||'all',role:filters.role||'all'},options:{tags,boards,years,roles},scopedExamCount:scoped.length,selectedExamCount:selected.length,partialExamCount:selected.length-complete.length,analyzedQuestionCount,exams:complete,rows};
}
