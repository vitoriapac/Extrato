import {isSafeId} from '../../core/utils.js';

const METHODS=new Set(['manual','catalog','imported','assisted']);

export function validateExamQuestion(question){
  if(!question||typeof question!=='object'||Array.isArray(question))return 'Questão histórica inválida.';
  if(!isSafeId(question.id)||!isSafeId(question.examId)||!isSafeId(question.subjectId)||!isSafeId(question.topicId))return 'A questão histórica precisa de referências válidas.';
  if(!Number.isInteger(question.questionNumber)||question.questionNumber<1)return 'O número da questão histórica é inválido.';
  if(question.weight!=null&&(!Number.isFinite(question.weight)||question.weight<=0))return 'O peso da questão histórica é inválido.';
  if(typeof question.source!=='string'||question.source.length>2000)return 'A origem da questão histórica é inválida.';
  if(!question.classification||!METHODS.has(question.classification.method)||!Number.isFinite(question.classification.confidence)||question.classification.confidence<0||question.classification.confidence>1)return 'A classificação da questão histórica é inválida.';
  return null;
}

export function createExamQuestion(input){
  const question={id:input?.id,examId:input?.examId,subjectId:input?.subjectId,topicId:input?.topicId,questionNumber:input?.questionNumber,weight:input?.weight??null,source:input?.source??'',classification:{method:input?.classification?.method??'manual',confidence:input?.classification?.confidence??1}};
  const error=validateExamQuestion(question);if(error)throw new TypeError(error);
  return question;
}
