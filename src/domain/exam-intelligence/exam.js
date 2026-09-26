import {isSafeId,isISODate} from '../../core/utils.js';

const SOURCES=new Set(['manual','catalog','imported','assisted']);
const COVERAGE=new Set(['unknown','partial','complete']);
const safeText=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const optionalText=(value,max)=>value==null||typeof value==='string'&&value.length<=max;

export function validateExam(exam){
  if(!exam||typeof exam!=='object'||Array.isArray(exam))return 'Prova inválida.';
  if(!isSafeId(exam.id))return 'A prova precisa de um ID seguro.';
  if(!safeText(exam.institution,300)||!safeText(exam.examName,300)||!safeText(exam.role,300)||!safeText(exam.board,200))return 'A prova precisa de instituição, nome, cargo e banca.';
  if(!Number.isInteger(exam.year)||exam.year<1900||exam.year>2200)return 'O ano da prova é inválido.';
  if(exam.date!=null&&(!isISODate(exam.date)||Number(exam.date.slice(0,4))!==exam.year))return 'A data da prova é inválida.';
  if(!SOURCES.has(exam.source)||!optionalText(exam.sourceReference,2000))return 'A origem da prova é inválida.';
  if(!COVERAGE.has(exam.coverage))return 'A cobertura da prova é inválida.';
  if(exam.importedQuestionCount!=null&&(!Number.isInteger(exam.importedQuestionCount)||exam.importedQuestionCount<0||exam.importedQuestionCount>10000))return 'O total importado da prova é inválido.';
  if(exam.expectedQuestionCount!=null&&(!Number.isInteger(exam.expectedQuestionCount)||exam.expectedQuestionCount<1||exam.expectedQuestionCount>10000))return 'O total declarado da prova é inválido.';
  if(exam.expectedQuestionCount!=null&&exam.importedQuestionCount!=null&&exam.expectedQuestionCount<exam.importedQuestionCount)return 'O total declarado não pode ser menor que o importado.';
  if(exam.unresolvedQuestions!=null&&(!Array.isArray(exam.unresolvedQuestions)||exam.unresolvedQuestions.length>10000||exam.unresolvedQuestions.some(row=>!Number.isInteger(row?.number)||row.number<1||!safeText(row.subject,300)||!safeText(row.topic,300)||row.weight!=null&&(!Number.isFinite(row.weight)||row.weight<=0))))return 'As questões pendentes da prova são inválidas.';
  if((exam.unresolvedQuestions?.length||0)!==new Set((exam.unresolvedQuestions||[]).map(row=>row.number)).size)return 'A prova contém questões pendentes duplicadas.';
  if(exam.importedQuestionCount!=null&&exam.importedQuestionCount<(exam.unresolvedQuestions?.length||0))return 'O total importado não cobre as questões pendentes.';
  if(!Array.isArray(exam.examTags)||exam.examTags.length>20||exam.examTags.some(tag=>!safeText(tag,100)))return 'O escopo da prova é inválido.';
  return null;
}

export function createExam(input){
  const exam={id:input?.id,institution:input?.institution,examName:input?.examName,role:input?.role,board:input?.board,year:input?.year,date:input?.date??null,source:input?.source??'manual',sourceReference:input?.sourceReference??null,coverage:input?.coverage??'unknown',examTags:Array.isArray(input?.examTags)?[...new Set(input.examTags)]:input?.examTags??[],importedQuestionCount:input?.importedQuestionCount??null,expectedQuestionCount:input?.expectedQuestionCount??null,unresolvedQuestions:structuredClone(input?.unresolvedQuestions||[])};
  const error=validateExam(exam);if(error)throw new TypeError(error);
  return exam;
}
