import {buildExamIntelligenceStressFixture} from './exam-intelligence-stress.js';

const LONG_NAME='Legislação aplicada aos serviços financeiros e atendimento multicanal';

export function buildVisualDensityFixture({today='2026-09-25'}={}){
  const {state}=buildExamIntelligenceStressFixture({today});
  state.subjects[0].name=`${LONG_NAME} — fundamentos e exceções`;
  state.subjects[0].topics[0].name=`${LONG_NAME} — interpretação de requisitos e casos práticos`;
  const template=state.subjects[0];
  for(let index=state.subjects.length;index<15;index++){
    const subjectId=`visual-subject-${index+1}`;
    state.subjects.push({
      ...structuredClone(template),id:subjectId,
      name:`${LONG_NAME} — módulo ${index+1}`,
      topics:template.topics.map((topic,topicIndex)=>({
        ...structuredClone(topic),id:`${subjectId}-topic-${topicIndex+1}`,
        name:`${topic.name} — unidade ${index+1}.${topicIndex+1}`,
        examTags:[],prerequisites:[]
      }))
    });
  }
  const originalSessions=state.studySessions.slice();
  const originalQuestions=state.questoes.slice();
  for(let index=0;index<180;index++){
    const source=originalSessions[index%originalSessions.length];
    const subject=state.subjects[6+index%9];
    const topic=subject.topics[index%subject.topics.length];
    state.studySessions.push({...structuredClone(source),id:`visual-session-${index+1}`,subjectId:subject.id,topicId:topic.id,planItemId:null,questionsResolved:0,correctAnswers:0});
  }
  for(let index=0;index<120;index++){
    const source=originalQuestions[index%originalQuestions.length];
    const subject=state.subjects[6+index%9];
    const topic=subject.topics[index%subject.topics.length];
    state.questoes.push({...structuredClone(source),id:`visual-question-${index+1}`,subjectId:subject.id,topicId:topic.id,studySessionId:null});
  }
  return state;
}
