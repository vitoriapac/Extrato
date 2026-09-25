import {calculateTopicIncidence} from '../../domain/exam-intelligence/topic-incidence.js';

export function buildExamIntelligence({topics=[],exams=[],examQuestions=[],activeExamTags=[]}={}){
  return topics.map(topic=>calculateTopicIncidence({topicId:topic.id,exams,questions:examQuestions,activeExamTags}));
}
