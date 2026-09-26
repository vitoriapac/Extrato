import {buildTopicExamProfile} from './build-topic-exam-profile.js';
import {examsInScope} from '../../domain/exam-intelligence/exam-evidence.js';
import {resolveValidatedExamImpact} from '../../domain/exam-intelligence/validated-impact.js';

export function buildExamIntelligenceViewModel({topics=[],blueprint={},exams=[],examQuestions=[]}={}){
  const activeExamTags=blueprint.activeExamTags||[];
  const scoped=examsInScope(exams,activeExamTags),complete=scoped.filter(exam=>exam.coverage==='complete');
  const rows=topics.map(topic=>{
    const subjectConfig=(blueprint.subjects||[]).find(item=>item.subjectId===topic.subjectId)||null;
    const profile=buildTopicExamProfile({topic,subjectConfig,activeExamTags,exams,examQuestions});
    return {...profile,impact:resolveValidatedExamImpact(profile).value,name:topic.name,subjectName:topic.subjectName};
  }).filter(item=>item.questionCount>0).sort((a,b)=>(b.impact??-1)-(a.impact??-1)||(b.presencePercent??-1)-(a.presencePercent??-1)||String(a.name).localeCompare(String(b.name),'pt-BR'));
  return {state:complete.length?'available':'empty',scopedExamCount:scoped.length,completeExamCount:complete.length,rows:rows.slice(0,6),totalTopicsWithEvidence:rows.length};
}
