import {calculateTopicIncidence} from '../../domain/exam-intelligence/topic-incidence.js';
import {buildTopicImpact} from '../../domain/exam-intelligence/topic-impact.js';

export function buildTopicExamProfile({topic,subjectConfig=null,activeExamTags=[],exams=[],examQuestions=[]}={}){
  const incidence=calculateTopicIncidence({topicId:topic?.id,exams,questions:examQuestions,activeExamTags});
  return buildTopicImpact({topic,subjectConfig,activeExamTags,incidence,exams,examQuestions});
}
