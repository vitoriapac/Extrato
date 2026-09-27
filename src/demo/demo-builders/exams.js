import {createExam} from '../../domain/exam-intelligence/exam.js';
import {createExamQuestion} from '../../domain/exam-intelligence/exam-question.js';
import {EXAM_TAGS} from '../../domain/exams/exam-constants.js';
import {isTopicInExamScope} from '../../domain/exams/exam-scope.js';

export function buildDemoExams(scenario,{subjects}){
  const config=scenario.examIntelligence,exams=[],examQuestions=[];
  const base=Math.floor(config.questions/config.historicalExams),extra=config.questions%config.historicalExams;
  for(let index=0;index<config.historicalExams;index++){
    const bb=index%2===0,tag=bb?EXAM_TAGS.BB:EXAM_TAGS.CAIXA,partial=index>=config.complete;
    const count=base+(index<extra?1:0),pendingCount=partial?Math.floor(config.unresolved/config.partial):0;
    const additional=partial?24+(index===config.complete?1:0):0;
    const exam=createExam({id:`demo-exam-${index+1}`,institution:bb?'Banco do Brasil':'Caixa Econômica Federal',examName:`Prova fictícia ${bb?'BB':'Caixa'} ${2010+index}`,role:bb?'Escriturário':'Técnico Bancário Novo',board:index%3===0?'Cesgranrio':'Banca fictícia',year:2010+index,date:`${2010+index}-05-15`,source:'manual',sourceReference:'Cenário demonstrativo sintético; não é uma prova oficial.',coverage:partial?'partial':'complete',examTags:[tag],importedQuestionCount:count+pendingCount,expectedQuestionCount:count+additional,unresolvedQuestions:Array.from({length:pendingCount},(_,pendingIndex)=>({number:count+pendingIndex+1,subject:'Classificação pendente',topic:'Aguardando associação manual',weight:1}))});
    exams.push(exam);
    const eligible=subjects.flatMap(subject=>subject.topics.filter(topic=>isTopicInExamScope(topic,[tag])).map(topic=>({subject,topic})));
    for(let questionIndex=0;questionIndex<count;questionIndex++){
      const item=eligible[(questionIndex*17+index*23)%eligible.length];
      examQuestions.push(createExamQuestion({id:`demo-exam-question-${index+1}-${questionIndex+1}`,examId:exam.id,subjectId:item.subject.id,topicId:item.topic.id,questionNumber:questionIndex+1,weight:1,source:'Classificação fictícia da demonstração',classification:{method:'manual',confidence:.85}}));
    }
  }
  return {exams,examQuestions};
}
