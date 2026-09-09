export const STUDY_SESSION_TYPES=Object.freeze(['study','review','questions','simulation']);
export const STUDY_SESSION_SOURCES=Object.freeze(['manual','plan','recommendation','import']);
const nullable=value=>value==null||value===''?null:String(value);
const nonNegative=value=>Math.max(0,Number(value)||0);
const nonNegativeInteger=value=>Math.floor(nonNegative(value));
const finiteOrNull=value=>value==null||value===''||!Number.isFinite(Number(value))?null:Number(value);
const isLocalDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
export function localDateFromTimestamp(value){if(!value)return null;const parsed=new Date(value);if(Number.isNaN(parsed.getTime()))return null;const year=parsed.getFullYear(),month=String(parsed.getMonth()+1).padStart(2,'0'),day=String(parsed.getDate()).padStart(2,'0');return year+'-'+month+'-'+day}
export function normalizeStudySession(rawSession={},options={}){
  const input=rawSession&&typeof rawSession==='object'?rawSession:{},questionsResolved=nonNegativeInteger(input.questionsResolved),inferredDate=localDateFromTimestamp(input.endedAt||input.startedAt||input.createdAt),fallbackDate=typeof options.today==='function'?options.today():options.today,type=STUDY_SESSION_TYPES.includes(input.type)?input.type:'study',source=STUDY_SESSION_SOURCES.includes(input.source)?input.source:(input.recommendationId?'recommendation':input.planItemId?'plan':'manual');
  return {...input,id:nullable(input.id),date:isLocalDate(input.date)?input.date:inferredDate||(isLocalDate(fallbackDate)?fallbackDate:null),createdAt:nullable(input.createdAt),startedAt:nullable(input.startedAt),endedAt:nullable(input.endedAt),durationSeconds:nonNegative(input.durationSeconds),subjectId:nullable(input.subjectId),topicId:nullable(input.topicId),planItemId:nullable(input.planItemId),recommendationId:nullable(input.recommendationId),type,source,questionsResolved,correctAnswers:Math.min(questionsResolved,nonNegativeInteger(input.correctAnswers)),prioritySnapshot:finiteOrNull(input.prioritySnapshot),notes:typeof input.notes==='string'?input.notes:''};
}
export function normalizeStudySessions(sessions=[],options={}){return (Array.isArray(sessions)?sessions:[]).map(session=>normalizeStudySession(session,options))}
