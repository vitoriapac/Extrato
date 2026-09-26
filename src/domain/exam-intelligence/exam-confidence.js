import {EXAM_INTELLIGENCE_CONFIG} from './config.js';

export const EXAM_CONFIDENCE_LABELS=Object.freeze({insufficient:'Evidência limitada',low:'Baixa',moderate:'Moderada',high:'Alta'});

export function classifyExamConfidence({examCount=0,questionCount=0,classificationConfidence=null}={}){
  if(examCount<2||questionCount<1)return 'insufficient';
  const sample=examCount>=8?'high':examCount>=EXAM_INTELLIGENCE_CONFIG.minimumHistoricalExams?'moderate':'low';
  if(classificationConfidence!=null&&classificationConfidence<.5)return 'low';
  if(classificationConfidence!=null&&classificationConfidence<.75&&sample==='high')return 'moderate';
  return sample;
}
