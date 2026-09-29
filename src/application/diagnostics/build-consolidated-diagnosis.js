import {buildTopicGapInputs} from '../analytics/build-topic-gap-inputs.js';
import {buildGapMap} from '../../domain/analytics/gap-map.js';
import {buildConsolidatedSignals} from './build-consolidated-signals.js';

// Read-only assembly of current producer outputs, with the content scope verified first.
export function buildConsolidatedDiagnosis({candidates=[],subjects=[],eligibleTopics=[],preparationSignals={},recommendations=[],opportunityCosts=[],activeExamTags=[]}={}){
  const topics=eligibleTopics.filter(item=>!item.archived&&!item.topicArchived&&!item.subjectArchived)
    .map(item=>({...item,topicId:item.topicId||item.id,subjectId:item.subjectId,granularity:'topic',name:item.topicName||item.name}));
  const ids=new Set(topics.map(item=>JSON.stringify([item.subjectId,item.topicId]))),subjectIds=new Set(topics.map(item=>item.subjectId));
  const scopedCandidates=candidates.filter(item=>ids.has(JSON.stringify([item.subjectId,item.topicId]))&&!item.archived);
  const subjectEntities=subjects.filter(item=>subjectIds.has(item.id||item.subjectId)&&!item.archived).map(item=>({subjectId:item.id||item.subjectId,topicId:null,granularity:'subject',name:item.name}));
  return buildConsolidatedSignals({eligibleEntities:[...topics,...subjectEntities],activeExamTags,inputsAlreadyScoped:true,
    priorities:scopedCandidates,gapSignals:buildGapMap(buildTopicGapInputs(scopedCandidates),{limit:Number.MAX_SAFE_INTEGER}),
    preparationSignals,recommendations,opportunityCosts,reviewSignals:scopedCandidates,
    examIntelligence:scopedCandidates.map(item=>({...item.examIntelligence,subjectId:item.subjectId,topicId:item.topicId}))});
}
