import {scoreStudyDecision} from './study-decision.js';
import {calculateRiskScore} from '../domain/diagnostics/risk-score.js';
import {withPrerequisiteEligibility} from '../domain/study-eligibility.js';
import {buildTopicSignals} from '../domain/analytics/topic-signals.js';
import {buildTopicExamProfile} from './exam-intelligence/build-topic-exam-profile.js';
import {resolveValidatedExamImpact} from '../domain/exam-intelligence/validated-impact.js';

export function buildStudyCandidates({priorities=[],topics=[],retentions={},reviewHealths={},blueprint=[],sessions=[],today,examProximity=null,activeExamTags=[],exams=[],examQuestions=[]}={}){
  const catalog=new Map(topics.map(topic=>[topic.id,topic]));
  const candidates=priorities.map(priority=>{
    const topic=catalog.get(priority.topicId),diagnosis=priority.diagnosis;
    const retention=retentions[priority.topicId];
    const reviewHealth=reviewHealths[priority.topicId];
    const exam=blueprint.find(item=>item.subjectId===priority.subjectId);
    const examProfile=buildTopicExamProfile({topic,subjectConfig:exam,activeExamTags,exams,examQuestions});
    const validatedImpact=resolveValidatedExamImpact(examProfile);
    const examImpact=validatedImpact.value;
    const mastery=diagnosis?.mastery?.confidence>0?diagnosis.mastery.score:null;
    const daysSinceContact=diagnosis?.lastActivity?Math.max(0,Number(priority.diasSemEstudar)||0):null;
    const covered=topic?.status==='Concluído';
    const reviewUrgency=priority.tipo==='revisão'?Math.min(100,40+Math.max(0,Number(priority.diasAtrasado)||0)*12):0;
    const difficultyMinutes=topic?.difficulty==='Difícil'?55:topic?.difficulty==='Fácil'?30:40,sessionMinutes=Math.max(15,Math.min(60,Number(priority.estimatedMinutes)||difficultyMinutes));
    const evidenceStrength=((diagnosis?.mastery?.confidence||0)+(retention?.confidence||0))/2;
    const signals=buildTopicSignals({topic,priority,mastery,retention,reviewHealth,examImpact,daysSinceContact,reviewUrgency,evidenceStrength});
    const studiedMinutes=sessions.filter(session=>session.topicId===priority.topicId&&session.date<=today&&session.type==='study').reduce((sum,session)=>sum+Math.max(0,Number(session.durationSeconds)||0)/60,0);
    const remainingMinutes=topic?.estimatedStudyMinutes==null?null:Math.max(0,Math.ceil(topic.estimatedStudyMinutes-studiedMinutes));
    const risk=calculateRiskScore({masteryRisk:signals.masteryGap,retentionRisk:signals.retentionRisk,trendRisk:signals.trendRisk,recencyRisk:signals.recencyRisk,examImpact:signals.examImpact,examProximity},undefined,{evidenceStrength});
    const candidate={...priority,id:priority.topicId||priority.id,archived:Boolean(topic?.topicArchived||topic?.subjectArchived||topic?.archived),
      covered,completed:sessions.some(session=>session.date===today&&session.topicId===priority.topicId&&(!priority.topicId?session.subjectId===priority.subjectId:true)&&Number(session.durationSeconds)>0),
      prerequisites:topic?.prerequisites||[],remainingMinutes,totalEstimatedMinutes:topic?.estimatedStudyMinutes??null,
      estimatedMinutes:sessionMinutes,sessionMinutes,action:priority.recommendedAction,risk,...signals,examIntelligence:{...examProfile,...validatedImpact},retentionNeed:signals.retentionRisk,reviewHealth,
      frequency:daysSinceContact===null?null:Math.max(0,100-daysSinceContact*5),
      planAlignment:priority.tipo==='continuar'?90:priority.tipo==='revisão'?80:55,
      improvementPotential:signals.masteryGap,effortEfficiency:Math.max(10,100-sessionMinutes)};
    return scoreStudyDecision(candidate);
  });
  const prerequisites=topics.map(topic=>({...topic,covered:topic.status==='Concluído',archived:topic.archived||topic.topicArchived||topic.subjectArchived,mastery:candidates.find(item=>item.topicId===topic.id)?.mastery??null}));
  return withPrerequisiteEligibility(candidates,prerequisites);
}
