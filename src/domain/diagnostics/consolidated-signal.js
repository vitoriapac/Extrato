import {diagnosticLabel,normalizeEvidenceLevel,normalizeSeverity} from './diagnostic-vocabulary.js';
import {parseLocalDate} from '../../core/date-utils.js';

export const SIGNAL_CONTRACT_VERSION=1;
export const SIGNAL_KINDS=Object.freeze(['consolidation-risk','critical-gap','plateau','priority-review','critical-coverage','collect-evidence','high-priority','high-incidence','recommendation-available','redistribution-source','redistribution-target','recovery','maintenance']);
const text=value=>typeof value==='string'&&value.trim()?value.trim():null;
const list=value=>Array.isArray(value)?value:[];
const ordered=value=>[...new Set(list(value).map(text).filter(Boolean))];
const distinct=value=>[...new Set(list(value).map(text).filter(Boolean))].sort();
export const signalNumber=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
const ratio=value=>{const number=signalNumber(value);return number==null||number<0||number>1?null:number};
const day=value=>typeof value==='string'&&parseLocalDate(value)?value:null;
export const signalEntityKey=({subjectId,topicId,granularity})=>JSON.stringify([granularity,subjectId,topicId]);

export function createConsolidatedSignal(input={}){
  const subjectId=text(input.subjectId),topicId=text(input.topicId),granularity=input.granularity||(topicId?'topic':'subject');
  const id=text(input.id),source=text(input.source),kind=text(input.kind);
  if(!id||!source||!subjectId||!SIGNAL_KINDS.includes(kind)||!['topic','subject'].includes(granularity)||granularity==='topic'&&!topicId||granularity==='subject'&&topicId)return null;
  const strength=ratio(input.evidence?.strength),completeness=ratio(input.evidence?.completeness);
  const level=strength==null?normalizeEvidenceLevel(input.evidence?.level):strength>=.7?'high':strength>=.35?'moderate':'low';
  const start=day(input.period?.start),end=day(input.period?.end);
  const availability=['available','insufficient','unavailable'].includes(input.availability)?input.availability:'insufficient';
  return {
    version:SIGNAL_CONTRACT_VERSION,id,source,sourceId:text(input.sourceId)||id,subjectId,topicId,granularity,
    entityKey:signalEntityKey({subjectId,topicId,granularity}),kind,active:input.active===true&&availability==='available',availability,
    severity:normalizeSeverity(input.severity),name:text(input.name),activeExamTags:Array.isArray(input.activeExamTags)?distinct(input.activeExamTags):null,
    period:{start:start&&end&&start<=end?start:null,end:start&&end&&start<=end?end:null},
    evidence:{strength,completeness,level,label:diagnosticLabel('evidence',level),assessed:level!=='unassessed',
      // IDs identify overlap, never a second sample count or another vote for confidence.
      observationIds:distinct(input.evidence?.observationIds),sources:distinct(input.evidence?.sources)},
    priority:signalNumber(input.priority),recommendedActionId:text(input.recommendedActionId),
    reasons:ordered(input.reasons),metrics:structuredClone(input.metrics||{})
  };
}
