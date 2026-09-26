import {examsInScope} from '../../domain/exam-intelligence/exam-evidence.js';
import {resolveTopicExamImpact} from '../../domain/analytics/topic-strategy.js';

export function buildExamDataQuality({exams=[],examQuestions=[],topics=[],blueprint={}}={}){
  const activeExamTags=blueprint.activeExamTags||[];
  const scoped=examsInScope(exams,activeExamTags),examIds=new Set(scoped.map(exam=>exam.id));
  const questions=examQuestions.filter(question=>examIds.has(question.examId));
  const pending=scoped.flatMap(exam=>(exam.unresolvedQuestions||[]).map(row=>({...row,examId:exam.id})));
  const knownCounts=scoped.every(exam=>Number.isInteger(exam.importedQuestionCount));
  const denominator=knownCounts?scoped.reduce((sum,exam)=>sum+Math.max(exam.importedQuestionCount,exam.expectedQuestionCount||0),0):null;
  const coveragePercent=denominator?Math.round(questions.length/denominator*1000)/10:null;
  const completeExamCount=scoped.filter(exam=>exam.coverage==='complete').length;
  const lowConfidenceQuestions=questions.filter(question=>question.classification.confidence<.5).length;
  const moderateConfidenceQuestions=questions.filter(question=>question.classification.confidence>=.5&&question.classification.confidence<.75).length;
  const unreviewedQuestions=questions.filter(question=>question.classification.method==='imported').length;
  const mappedTopicIds=new Set(questions.map(question=>question.topicId));
  const importantTopicsWithoutHistory=topics.filter(topic=>{
    if(topic.archived||topic.topicArchived||topic.subjectArchived||mappedTopicIds.has(topic.id))return false;
    const subjectConfig=(blueprint.subjects||[]).find(item=>item.subjectId===topic.subjectId)||null;
    return (resolveTopicExamImpact({topic,subjectConfig,activeExamTags}).value??0)>=70;
  }).length;
  const confidence=completeExamCount<2?'insufficient':completeExamCount<4||coveragePercent==null||coveragePercent<80?'low':completeExamCount>=8&&coveragePercent>=95&&!lowConfidenceQuestions&&!unreviewedQuestions?'high':'moderate';
  const warnings=[];
  if(!scoped.length)warnings.push('Nenhuma prova histórica cadastrada neste concurso.');
  else if(!completeExamCount)warnings.push('Nenhuma prova completa pode sustentar a incidência.');
  if(scoped.length&&coveragePercent==null)warnings.push('Cobertura indisponível para provas antigas sem total de questões registrado.');
  if(pending.length)warnings.push(`${pending.length} questões aguardam classificação.`);
  if(unreviewedQuestions)warnings.push(`${unreviewedQuestions} classificações importadas ainda não foram revisadas.`);
  if(importantTopicsWithoutHistory)warnings.push(`${importantTopicsWithoutHistory} tópicos importantes ainda não têm questão histórica vinculada.`);
  return {examCount:scoped.length,completeExamCount,partialExamCount:scoped.length-completeExamCount,questionCount:questions.length,classifiedQuestions:questions.length,unresolvedQuestions:pending.length,lowConfidenceQuestions,moderateConfidenceQuestions,highConfidenceQuestions:questions.length-lowConfidenceQuestions-moderateConfidenceQuestions,unreviewedQuestions,mappedTopics:mappedTopicIds.size,importantTopicsWithoutHistory,coveragePercent,confidence,warnings};
}
