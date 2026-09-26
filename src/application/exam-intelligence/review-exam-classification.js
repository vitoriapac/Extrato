import {createExam} from '../../domain/exam-intelligence/exam.js';
import {createExamQuestion} from '../../domain/exam-intelligence/exam-question.js';
import {isTopicInExamScope} from '../../domain/exams/exam-scope.js';

export function reviewExamClassification({exams=[],examQuestions=[],subjects=[]},{examId,questionNumber,topicId,confidence,now,idGenerator}={}){
  const exam=exams.find(item=>item.id===examId),subject=subjects.find(item=>!item.archived&&(item.topics||[]).some(topic=>topic.id===topicId&&!topic.archived&&isTopicInExamScope(topic,exam?.examTags||[])));
  if(!exam||!subject||!Number.isInteger(questionNumber)||questionNumber<1||!Number.isFinite(confidence)||confidence<0||confidence>1||!Number.isFinite(Date.parse(now))||typeof idGenerator!=='function')throw new TypeError('Escolha uma prova, questão, tópico e confiança válidos.');
  const existing=examQuestions.find(item=>item.examId===examId&&item.questionNumber===questionNumber);
  const pending=(exam.unresolvedQuestions||[]).find(item=>item.number===questionNumber);
  if(!existing&&!pending)throw new TypeError('Questão histórica não encontrada.');
  const question=createExamQuestion({id:existing?.id||idGenerator('exam-question'),examId,subjectId:subject.id,topicId,questionNumber,weight:existing?.weight??pending?.weight??null,source:existing?.source||exam.sourceReference||'',classification:{method:'manual',confidence,reviewedAt:now}});
  const nextQuestions=examQuestions.map(item=>item===existing?question:item);
  if(!existing)nextQuestions.push(question);
  const unresolvedQuestions=(exam.unresolvedQuestions||[]).filter(item=>item.number!==questionNumber);
  const count=exam.importedQuestionCount==null?null:Math.max(exam.importedQuestionCount,new Set(nextQuestions.filter(item=>item.examId===examId).map(item=>item.questionNumber)).size+unresolvedQuestions.length);
  const coverage=exam.declaredCoverage==='complete'&&!unresolvedQuestions.length&&(exam.expectedQuestionCount==null||count===exam.expectedQuestionCount)?'complete':exam.coverage;
  const nextExam=createExam({...exam,coverage,importedQuestionCount:count,unresolvedQuestions});
  return {exams:exams.map(item=>item===exam?nextExam:item),examQuestions:nextQuestions,question};
}
