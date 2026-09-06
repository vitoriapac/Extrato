import {calculatePriorityScore} from '../domain/analytics/priority-score.js';
import {calculateRiskScore} from '../domain/diagnostics/risk-score.js';
import {withPrerequisiteEligibility} from '../domain/study-eligibility.js';

export function buildStudyCandidates({priorities=[],topics=[],retentions={},reviewHealths={},blueprint=[],sessions=[],today,examProximity=null}={}){
  const catalog=new Map(topics.map(topic=>[topic.id,topic]));
  const candidates=priorities.map(priority=>{
    const topic=catalog.get(priority.topicId),diagnosis=priority.diagnosis;
    const retention=retentions[priority.topicId];
    const reviewHealth=reviewHealths[priority.topicId];
    const exam=blueprint.find(item=>item.subjectId===priority.subjectId);
    const examImpact=topic?.examImportance!=null?topic.examImportance*100:exam?Math.min(100,(Number(exam.expectedQuestions)||0)*4*(Number(exam.questionWeight)||1)):null;
    const mastery=diagnosis?.mastery?.confidence>0?diagnosis.mastery.score:null;
    const daysSinceContact=diagnosis?.lastActivity?Math.max(0,Number(priority.diasSemEstudar)||0):null;
    const covered=topic?.status==='Concluído';
    const reviewUrgency=priority.tipo==='revisão'?Math.min(100,40+Math.max(0,Number(priority.diasAtrasado)||0)*12):0;
    const sessionMinutes=Math.max(15,Math.min(60,Number(priority.estimatedMinutes)||30));
    const trend=diagnosis?.trend;
    const trendRisk=!trend||trend.key==='insufficient'?null:trend.key==='down'?Math.min(100,40+Math.abs(trend.delta||0)*6):0;
    const evidenceStrength=((diagnosis?.mastery?.confidence||0)+(retention?.confidence||0))/2;
    const recencyRisk=daysSinceContact===null?null:Math.min(100,daysSinceContact*5);
    const retentionRisk=retention?.available?100-retention.score:null;
    const reviewHealthRisk=reviewHealth?.value==null?null:100-reviewHealth.value;
    const masteryGap=mastery===null?null:100-mastery;
    const studiedMinutes=sessions.filter(session=>session.topicId===priority.topicId&&session.date<=today&&session.type==='study').reduce((sum,session)=>sum+Math.max(0,Number(session.durationSeconds)||0)/60,0);
    const remainingMinutes=topic?.estimatedStudyMinutes==null?null:Math.max(0,Math.ceil(topic.estimatedStudyMinutes-studiedMinutes));
    const risk=calculateRiskScore({masteryRisk:masteryGap,retentionRisk,trendRisk,recencyRisk,examImpact,examProximity},undefined,{evidenceStrength});
    const candidate={...priority,id:priority.topicId||priority.id,archived:Boolean(topic?.topicArchived||topic?.subjectArchived||topic?.archived),
      covered,completed:sessions.some(session=>session.date===today&&session.topicId===priority.topicId&&(!priority.topicId?session.subjectId===priority.subjectId:true)&&Number(session.durationSeconds)>0),
      prerequisites:topic?.prerequisites||[],remainingMinutes,totalEstimatedMinutes:topic?.estimatedStudyMinutes??null,
      estimatedMinutes:sessionMinutes,sessionMinutes,action:priority.recommendedAction,risk,examImpact,mastery,masteryGap,
      retention:retention?.available?retention.score:null,retentionRisk,retentionNeed:retentionRisk,reviewHealth,reviewHealthRisk,reviewUrgency,
      coverage:covered?100:topic?.status==='Em andamento'?50:0,frequency:daysSinceContact===null?null:Math.max(0,100-daysSinceContact*5),
      daysSinceContact,recencyRisk,planAlignment:priority.tipo==='continuar'?90:priority.tipo==='revisão'?80:55,trendRisk,
      improvementPotential:masteryGap,effortEfficiency:Math.max(10,100-sessionMinutes),evidenceStrength};
    return {...candidate,...calculatePriorityScore(candidate)};
  });
  const prerequisites=topics.map(topic=>({...topic,covered:topic.status==='Concluído',archived:topic.archived||topic.topicArchived||topic.subjectArchived,mastery:candidates.find(item=>item.topicId===topic.id)?.mastery??null}));
  return withPrerequisiteEligibility(candidates,prerequisites);
}
