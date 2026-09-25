import {EXAM_PRIORITIES} from '../../state/strategic.js';

export function buildSavedSubjectConfig(subjectId,current,{priority,masteryTarget,expectedQuestions,questionWeight}){
  const mastery=masteryTarget===''?null:Number(masteryTarget),questions=expectedQuestions===''?0:Number(expectedQuestions),weight=questionWeight===''?1:Number(questionWeight);
  if(!EXAM_PRIORITIES.includes(priority)||mastery!==null&&(!Number.isFinite(mastery)||mastery<0||mastery>100)||!Number.isInteger(questions)||questions<0||!Number.isFinite(weight)||weight<.1)return null;
  const next={...(current||{subjectId,expectedQuestions:0,questionWeight:1,priority:'normal',masteryTarget:null})};
  if(next.expectedQuestions!==questions||next.questionWeight!==weight){next.sourceRef=null;next.official=false;next.mappingType=null}
  return {...next,priority,masteryTarget:mastery,expectedQuestions:questions,questionWeight:weight};
}
