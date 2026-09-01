export const DEFAULT_ALGORITHM_VERSIONS=Object.freeze({readiness:1,retention:1,recommendations:1,adaptiveReview:1,forecasts:1});
export const EXAM_PRIORITIES=Object.freeze(['low','normal','high']);

export function normalizeTopicStrategy(topic){
  const importance=topic.examImportance==null||topic.examImportance===''?NaN:Number(topic.examImportance);
  topic.examImportance=Number.isFinite(importance)?Math.max(0,Math.min(1,importance)):null;
  const minutes=Number(topic.estimatedStudyMinutes);
  topic.estimatedStudyMinutes=Number.isFinite(minutes)&&minutes>0?Math.round(minutes):null;
  topic.prerequisites=Array.isArray(topic.prerequisites)?[...new Set(topic.prerequisites.filter(value=>typeof value==='string'&&value!==topic.id))]:[];
  return topic;
}

export function normalizeExamBlueprint(value={},legacyExamDate=''){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  const target=Number(source.targetScore);
  return {
    examDate:typeof source.examDate==='string'&&source.examDate?source.examDate:(legacyExamDate||null),
    targetScore:Number.isFinite(target)?Math.max(0,Math.min(100,target)):80,
    configuredAt:typeof source.configuredAt==='string'?source.configuredAt:null,
    subjects:Array.isArray(source.subjects)?source.subjects.map(item=>({
      subjectId:item?.subjectId||null,
      expectedQuestions:Math.max(0,Math.round(Number(item?.expectedQuestions)||0)),
      questionWeight:Math.max(0,Number(item?.questionWeight)||1),
      priority:EXAM_PRIORITIES.includes(item?.priority)?item.priority:'normal'
    })):[]
  };
}

export function normalizeAlgorithmVersions(value={}){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return Object.fromEntries(Object.entries(DEFAULT_ALGORITHM_VERSIONS).map(([key,fallback])=>[key,Math.max(1,Math.floor(Number(source[key])||fallback))]));
}
