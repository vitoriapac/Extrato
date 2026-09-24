export const STUDY_SESSION_TYPES=Object.freeze(['study','review','questions','simulation']);
export const STUDY_SESSION_SOURCES=Object.freeze(['manual','plan','recommendation','import']);
export const RECOMMENDATION_SESSION_SOURCES=Object.freeze(['overview','today','diagnosis','planning','review']);
export const RECOMMENDATION_SESSION_TYPES=Object.freeze(['study','review','questions','simulation','prerequisite']);
export const PERCEIVED_RETENTION_VALUES=Object.freeze(['easy','effortful','unable']);
export const PERCEIVED_DIFFICULTY_VALUES=Object.freeze(['easy','medium','hard']);
const nullable=value=>value==null||value===''?null:String(value);
const nonNegative=value=>Math.max(0,Number(value)||0);
const nonNegativeInteger=value=>Math.floor(nonNegative(value));
const finiteOrNull=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
const isLocalDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
export function localDateFromTimestamp(value){if(!value)return null;const parsed=new Date(value);if(Number.isNaN(parsed.getTime()))return null;const year=parsed.getFullYear(),month=String(parsed.getMonth()+1).padStart(2,'0'),day=String(parsed.getDate()).padStart(2,'0');return year+'-'+month+'-'+day}
export function normalizeStudySession(rawSession={},options={}){
  const input=rawSession&&typeof rawSession==='object'?rawSession:{},questionsResolved=nonNegativeInteger(input.questionsResolved),inferredDate=localDateFromTimestamp(input.endedAt||input.startedAt||input.createdAt),fallbackDate=typeof options.today==='function'?options.today():options.today,type=STUDY_SESSION_TYPES.includes(input.type)?input.type:'study',source=STUDY_SESSION_SOURCES.includes(input.source)?input.source:(input.recommendationId?'recommendation':input.planItemId?'plan':'manual');
  const recommendationId=nullable(input.recommendationId);
  return {...input,id:nullable(input.id),date:isLocalDate(input.date)?input.date:inferredDate||(isLocalDate(fallbackDate)?fallbackDate:null),createdAt:nullable(input.createdAt),startedAt:nullable(input.startedAt),endedAt:nullable(input.endedAt),durationSeconds:nonNegative(input.durationSeconds),subjectId:nullable(input.subjectId),topicId:nullable(input.topicId),planItemId:nullable(input.planItemId),recommendationId,type,source,questionsResolved,correctAnswers:Math.min(questionsResolved,nonNegativeInteger(input.correctAnswers)),prioritySnapshot:finiteOrNull(input.prioritySnapshot),recommendationSource:recommendationId&&RECOMMENDATION_SESSION_SOURCES.includes(input.recommendationSource)?input.recommendationSource:null,recommendationType:recommendationId&&RECOMMENDATION_SESSION_TYPES.includes(input.recommendationType)?input.recommendationType:null,perceivedRetention:PERCEIVED_RETENTION_VALUES.includes(input.perceivedRetention)?input.perceivedRetention:null,perceivedDifficulty:PERCEIVED_DIFFICULTY_VALUES.includes(input.perceivedDifficulty)?input.perceivedDifficulty:null,notes:typeof input.notes==='string'?input.notes:''};
}
export function normalizeStudySessions(sessions=[],options={}){return (Array.isArray(sessions)?sessions:[]).map(session=>normalizeStudySession(session,options))}
