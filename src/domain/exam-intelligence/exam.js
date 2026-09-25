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
  if(!Array.isArray(exam.examTags)||exam.examTags.length>20||exam.examTags.some(tag=>!safeText(tag,100)))return 'O escopo da prova é inválido.';
  return null;
}

export function createExam(input){
  const exam={id:input?.id,institution:input?.institution,examName:input?.examName,role:input?.role,board:input?.board,year:input?.year,date:input?.date??null,source:input?.source??'manual',sourceReference:input?.sourceReference??null,coverage:input?.coverage??'unknown',examTags:Array.isArray(input?.examTags)?[...new Set(input.examTags)]:input?.examTags??[]};
  const error=validateExam(exam);if(error)throw new TypeError(error);
  return exam;
}
