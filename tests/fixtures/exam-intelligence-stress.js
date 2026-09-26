import {generateDemoData} from '../../src/demo/demo-generator.js';

export const STRESS_TAGS=Object.freeze({bb:'bb-escriturario',caixa:'caixa-tbn',ti:'caixa-tbn-ti'});
export const STRESS_TOPICS=Object.freeze({strong:'demo-topic-1-1',weak:'demo-topic-2-1',rare:'demo-topic-3-1',manual:'demo-topic-4-1',common:'demo-topic-5-1',official:'demo-topic-6-1'});

export function buildExamIntelligenceStressFixture({today='2026-09-25'}={}){
  const state=generateDemoData({today});
  const byId=new Map(state.subjects.flatMap(subject=>subject.topics.map(topic=>[topic.id,topic])));
  const topicSetup=[
    [STRESS_TOPICS.strong,[STRESS_TAGS.bb,STRESS_TAGS.caixa],{[STRESS_TAGS.bb]:.8,[STRESS_TAGS.caixa]:.75}],
    [STRESS_TOPICS.weak,[STRESS_TAGS.bb,STRESS_TAGS.caixa],{[STRESS_TAGS.bb]:.55,[STRESS_TAGS.caixa]:.4}],
    [STRESS_TOPICS.rare,[STRESS_TAGS.bb,STRESS_TAGS.caixa],{[STRESS_TAGS.bb]:.2,[STRESS_TAGS.caixa]:.2}],
    [STRESS_TOPICS.manual,[STRESS_TAGS.bb,STRESS_TAGS.caixa],{}],
    [STRESS_TOPICS.common,[STRESS_TAGS.bb,STRESS_TAGS.caixa,STRESS_TAGS.ti],{[STRESS_TAGS.bb]:.5,[STRESS_TAGS.caixa]:.5,[STRESS_TAGS.ti]:.5}],
    [STRESS_TOPICS.official,[STRESS_TAGS.bb,STRESS_TAGS.caixa,STRESS_TAGS.ti],{}]
  ];
  for(const [id,tags,estimates] of topicSetup){
    const topic=byId.get(id);
    topic.examTags=tags;topic.examImportance=null;topic.examImportanceEstimates=estimates;topic.prerequisites=[];topic.status='Em andamento';topic.estimatedStudyMinutes=300;
  }
  byId.get(STRESS_TOPICS.manual).examImportance=.25;
  state.examBlueprint.activeExamTags=[STRESS_TAGS.bb];
  state.examBlueprint.subjects=[{subjectId:'demo-subject-6',expectedQuestions:22,questionWeight:1.5,priority:'high',official:true,sourceRef:`${STRESS_TAGS.bb}-2023`}];
  const definitions=[['bb',STRESS_TAGS.bb,6,2018,'Banco do Brasil','Escriturário','Cesgranrio'],['caixa',STRESS_TAGS.caixa,6,2019,'Caixa','TBN','Cesgranrio'],['ti',STRESS_TAGS.ti,4,2020,'Caixa','TI','Cesgranrio']];
  state.exams=[];state.examQuestions=[];
  for(const [prefix,tag,total,firstYear,institution,role,board] of definitions){
    for(let index=0;index<total;index++){
      const id=`stress-${prefix}-${firstYear+index}`,partial=index===total-1;
      state.exams.push({id,institution,examName:`${role} ${firstYear+index}`,role,board,year:firstYear+index,date:null,source:'imported',sourceReference:`Fixture ${id}`,coverage:partial?'partial':'complete',declaredCoverage:partial?'partial':'complete',examTags:[tag],importedQuestionCount:5,expectedQuestionCount:null,unresolvedQuestions:partial?[{number:5,subject:'Sem vínculo',topic:'Pendente'}]:[]});
      const topics=prefix==='bb'?[STRESS_TOPICS.strong,STRESS_TOPICS.weak,STRESS_TOPICS.common,STRESS_TOPICS.manual,STRESS_TOPICS.official]:prefix==='caixa'?[STRESS_TOPICS.strong,STRESS_TOPICS.weak,STRESS_TOPICS.common,STRESS_TOPICS.official]:[STRESS_TOPICS.common,STRESS_TOPICS.official];
      const present=topics.filter(topicId=>topicId!==STRESS_TOPICS.weak||index<4).filter(topicId=>topicId!==STRESS_TOPICS.rare);
      if(prefix==='bb'&&index===1)present.push(STRESS_TOPICS.rare);
      for(const [questionIndex,topicId] of present.entries())state.examQuestions.push({id:`${id}-q${questionIndex+1}`,examId:id,subjectId:byId.get(topicId).id.replace(/topic-(\d+)-.*/,'subject-$1'),topicId,questionNumber:questionIndex+1,weight:questionIndex%2?1.5:1,source:'Fixture',classification:{method:prefix==='ti'?'imported':'manual',confidence:prefix==='ti'?.4:1}});
    }
  }
  const selectedTopics=Object.values(STRESS_TOPICS).map(id=>{
    const topic=byId.get(id);
    return {...topic,subjectId:`demo-subject-${id.match(/topic-(\d+)/)[1]}`,subjectName:state.subjects.find(subject=>subject.id===`demo-subject-${id.match(/topic-(\d+)/)[1]}`).name};
  });
  return {state,topics:selectedTopics};
}
