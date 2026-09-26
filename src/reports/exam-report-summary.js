import {buildExamDataQuality} from '../application/exam-intelligence/build-exam-data-quality.js';
import {examsInScope} from '../domain/exam-intelligence/exam-evidence.js';

export function buildExamReportSummary({state={},topics=[],candidates=[]}={}){
  const quality=buildExamDataQuality({exams:state.exams||[],examQuestions:state.examQuestions||[],topics,blueprint:state.examBlueprint||{}});
  const completeIds=new Set(examsInScope(state.exams||[],state.examBlueprint?.activeExamTags||[]).filter(exam=>exam.coverage==='complete').map(exam=>exam.id));
  const analyzedQuestionCount=(state.examQuestions||[]).filter(question=>completeIds.has(question.examId)).length;
  const topicIds=new Set(topics.map(topic=>topic.id));
  const gaps=(candidates||[]).filter(item=>topicIds.has(item.topicId)&&item.examImpact>=70&&item.mastery!=null&&item.mastery<70)
    .map(item=>({topicId:item.topicId,subjectName:item.subjectName||'',topicName:item.topicName||'',impact:Math.round(item.examImpact),mastery:Math.round(item.mastery),need:Math.round(item.examImpact*(100-item.mastery)/100)}))
    .sort((a,b)=>b.need-a.need||b.impact-a.impact||a.topicName.localeCompare(b.topicName,'pt-BR')).slice(0,3);
  return {examCount:quality.examCount,completeExamCount:quality.completeExamCount,questionCount:analyzedQuestionCount,coveragePercent:quality.coveragePercent,confidence:quality.confidence,unresolvedQuestions:quality.unresolvedQuestions,gaps};
}
