import {comparableExamEvidence} from './exam-evidence.js';
import {classifyExamConfidence} from './exam-confidence.js';

const percent=(part,total)=>total>0?Math.round(part/total*100):null;

export function calculateTopicIncidence({topicId,exams=[],questions=[],activeExamTags=[]}={}){
  const evidence=comparableExamEvidence({exams,questions,activeExamTags});
  const matching=evidence.analyzedQuestions.filter(question=>question.topicId===topicId);
  const presentIds=new Set(matching.map(question=>question.examId));
  const presentExams=evidence.completeExams.filter(exam=>presentIds.has(exam.id));
  const recentExams=[...evidence.completeExams].sort((a,b)=>b.year-a.year||String(b.date||'').localeCompare(String(a.date||''))||String(a.id).localeCompare(String(b.id))).slice(0,3);
  const classificationConfidence=matching.length?matching.reduce((sum,question)=>sum+question.classification.confidence,0)/matching.length:null;
  return Object.freeze({
    topicId,
    analyzedExamCount:evidence.completeExams.length,
    scopedExamCount:evidence.scopedExams.length,
    presentExamCount:presentExams.length,
    questionCount:matching.length,
    observedQuestionCount:evidence.observedQuestions.filter(question=>question.topicId===topicId).length,
    analyzedQuestionCount:evidence.analyzedQuestions.length,
    presencePercent:percent(presentExams.length,evidence.completeExams.length),
    participationPercent:percent(matching.length,evidence.analyzedQuestions.length),
    recentExamCount:recentExams.length,
    recentPresentCount:recentExams.filter(exam=>presentIds.has(exam.id)).length,
    recentYears:recentExams.map(exam=>exam.year),
    confidence:classifyExamConfidence({examCount:evidence.completeExams.length,questionCount:evidence.analyzedQuestions.length,classificationConfidence})
  });
}
