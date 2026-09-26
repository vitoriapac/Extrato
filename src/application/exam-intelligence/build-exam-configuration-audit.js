import {buildTopicExamProfile} from './build-topic-exam-profile.js';
import {historicalImpactEstimate,isHistoricalImpactUsable,resolveValidatedExamImpact} from '../../domain/exam-intelligence/validated-impact.js';

const sourceLabels={manual:'Impacto manual',official:'Impacto derivado do peso oficial',estimated:'Estimativa do catálogo'};
const order={divergent:0,review:1,aligned:2,insufficient:3,unconfigured:4};

export function buildExamConfigurationAudit({topics=[],blueprint={},exams=[],examQuestions=[]}={}){
  const activeExamTags=blueprint.activeExamTags||[];
  const rows=topics.filter(topic=>!topic.archived&&!topic.topicArchived&&!topic.subjectArchived).map(topic=>{
    const subjectConfig=(blueprint.subjects||[]).find(item=>item.subjectId===topic.subjectId)||null;
    const profile=buildTopicExamProfile({topic,subjectConfig,activeExamTags,exams,examQuestions});
    const configuredImpact=profile.impactValue,historicalEstimate=historicalImpactEstimate(profile),effective=resolveValidatedExamImpact(profile),usable=isHistoricalImpactUsable(profile);
    const divergence=usable&&configuredImpact!=null&&historicalEstimate!=null?Math.abs(configuredImpact-historicalEstimate):null;
    const status=configuredImpact==null?'unconfigured':divergence==null?'insufficient':divergence<=10?'aligned':divergence<=20?'review':'divergent';
    return {topicId:topic.id,subjectId:topic.subjectId,name:topic.name,subjectName:topic.subjectName,configuredImpact,configuredSource:profile.impactSourceType,configuredSourceLabel:sourceLabels[profile.impactSourceType]||'Sem configuração',historicalEstimate,validatedImpact:effective.value,usedHistory:effective.usedHistory,presencePercent:profile.presencePercent,participationPercent:profile.participationPercent,presentExamCount:profile.presentExamCount,analyzedExamCount:profile.analyzedExamCount,confidence:profile.confidence,confidenceLabel:profile.confidenceLabel,divergence,status};
  }).sort((a,b)=>order[a.status]-order[b.status]||(b.divergence??-1)-(a.divergence??-1)||a.name.localeCompare(b.name,'pt-BR'));
  return {rows,divergentCount:rows.filter(row=>row.status==='divergent').length,reviewCount:rows.filter(row=>row.status==='review').length,alignedCount:rows.filter(row=>row.status==='aligned').length};
}
