import {resolveTopicExamImpact} from '../analytics/topic-strategy.js';
import {EXAM_CONFIDENCE_LABELS} from './exam-confidence.js';
import {comparableExamEvidence} from './exam-evidence.js';

const level=value=>value==null?'Sem dados':value>=70?'Alta':value>=40?'Moderada':'Baixa';
const round=value=>Math.round(value*100)/100;

export function buildTopicImpact({topic={},subjectConfig=null,activeExamTags=[],incidence=null,exams=[],examQuestions=[]}={}){
  const current=resolveTopicExamImpact({topic,subjectConfig,activeExamTags});
  const sourceType=current.source==='manual'?'manual':current.source==='catalog'?'estimated':current.source==='subject'?(subjectConfig?.official&&subjectConfig?.sourceRef?'official':'manual'):null;
  const evidence=comparableExamEvidence({exams,questions:examQuestions,activeExamTags});
  const examIds=new Set(evidence.completeExams.map(exam=>exam.id));
  const weights=examQuestions.filter(question=>examIds.has(question.examId)&&question.topicId===topic.id&&question.weight!=null).map(question=>question.weight);
  const historicalWeight=weights.length?round(weights.reduce((sum,value)=>sum+value,0)/weights.length):null;
  const officialWeight=subjectConfig?.official&&subjectConfig?.sourceRef?subjectConfig.questionWeight:null;
  return Object.freeze({
    topicId:topic.id,
    impactValue:current.value,
    impactSource:current.source,
    impactSourceType:sourceType,
    impactSourceLabel:sourceType==='official'?'Peso oficial da disciplina':current.sourceLabel,
    officialWeight,
    historicalWeight,
    historicalWeightSourceType:historicalWeight==null?null:'historical',
    historicalWeightQuestionCount:weights.length,
    incidenceSourceType:incidence?.presencePercent==null?null:'historical',
    presencePercent:incidence?.presencePercent??null,
    presenceLevel:level(incidence?.presencePercent),
    participationPercent:incidence?.participationPercent??null,
    recentPresentCount:incidence?.recentPresentCount??0,
    recentExamCount:incidence?.recentExamCount??0,
    recentPresenceLevel:level(incidence?.recentExamCount?incidence.recentPresentCount/incidence.recentExamCount*100:null),
    presentExamCount:incidence?.presentExamCount??0,
    analyzedExamCount:incidence?.analyzedExamCount??0,
    questionCount:incidence?.questionCount??0,
    analyzedQuestionCount:incidence?.analyzedQuestionCount??0,
    confidence:incidence?.confidence??'insufficient',
    confidenceLabel:EXAM_CONFIDENCE_LABELS[incidence?.confidence]||EXAM_CONFIDENCE_LABELS.insufficient
  });
}
