import {addLocalDays} from '../../src/core/date-utils.js';
import {createReadinessSnapshot} from '../../src/application/analytics/readiness-history.js';
import {captureRecommendationBaseline,captureRecommendationSnapshot} from '../../src/application/recommendations/outcome-service.js';

export const STRATEGIC_CYCLE_TODAY='2026-09-28';
export function buildStrategicCycleFixture(base={}){
  const state=structuredClone(base),today=STRATEGIC_CYCLE_TODAY,bb='bb-escriturario',caixa='caixa-tbn';
  const names=['Matemática Financeira','Língua Portuguesa','Conhecimentos Bancários','Informática'];
  state.schemaVersion=25;state.examDate=addLocalDays(today,20);
  state.subjects=names.map((name,subjectIndex)=>({id:`cycle-s${subjectIndex}`,name,archived:false,topics:Array.from({length:5},(_,index)=>({id:`cycle-t${subjectIndex}-${index}`,subjectId:`cycle-s${subjectIndex}`,name:subjectIndex===0?['Juros Compostos','Juros Simples','Fluxo de Caixa','Descontos','Tópico compartilhado'][index]:`${name} — tópico ${index+1}`,status:index===1?'Concluído':'Em andamento',difficulty:'Médio',archived:false,prerequisites:[],estimatedStudyMinutes:720,examImportance:index===0?1:index===1?.9:.25,examTags:index===4?[bb,caixa]:subjectIndex>=2&&index===3?[caixa]:[bb],firstCompletedAt:index===1?`${addLocalDays(today,-45)}T12:00:00-03:00`:null}))}));
  const topics=state.subjects.flatMap(subject=>subject.topics);
  state.examBlueprint={...(state.examBlueprint||{}),activeExamTags:[bb],masteryTarget:80,targetScore:80,configuredAt:`${addLocalDays(today,-56)}T12:00:00-03:00`,subjects:state.subjects.map(subject=>({subjectId:subject.id,priority:'normal',masteryTarget:null,expectedQuestions:20,questionWeight:1}))};
  state.metas={...(state.metas||{}),horasPorDia:Object.fromEntries(Array.from({length:7},(_,day)=>[String(day),2])),metaAprovacao:80};
  state.studySessions=[];state.questoes=[];state.reviewAgenda=[];state.dailyPlans=[];
  for(let week=0;week<8;week++){
    const end=addLocalDays(today,-(7-week)*7-2),items=[];
    for(const topic of topics){
      const mastered=topic.status==='Concluído',date=addLocalDays(end,-4+topics.indexOf(topic)%5),sessionId=`cycle-session-${week}-${topic.id}`,itemId=`cycle-item-${week}-${topic.id}`;
      state.studySessions.push({id:sessionId,date,subjectId:topic.subjectId,topicId:topic.id,type:'study',durationSeconds:1200,source:'manual',planItemId:itemId,questionsResolved:0,correctAnswers:0,notes:'Sessão anterior preservada',createdAt:`${date}T12:00:00-03:00`});
      state.questoes.push({id:`cycle-q-${week}-${topic.id}`,date,subjectId:topic.subjectId,topicId:topic.id,resolved:20,correct:mastered?19:topic.name==='Juros Compostos'?7:9,errorBreakdown:{naoSabia:mastered?0:5,esqueci:mastered?0:3,interpretacao:mastered?1:2,calculo:0,desatencao:0,chute:0},createdAt:`${date}T12:00:00-03:00`});
      items.push({date,id:itemId,topicId:topic.id,subjectId:topic.subjectId,plannedMinutes:20,executedSeconds:1200,status:'completed',type:'study',sessionIds:[sessionId],prioritySnapshot:{priority:!mastered&&topic.examImportance>=.7,score:mastered?20:80},createdAt:`${date}T10:00:00-03:00`});
      if(mastered)state.reviewAgenda.push({id:`cycle-review-${week}-${topic.id}`,date,topicId:topic.id,subjectId:topic.subjectId,status:'Concluído',tipo:'Revisão 7 dias',completedAt:`${date}T12:00:00-03:00`,rating:'easy'});
    }
    for(const date of [...new Set(items.map(item=>item.date))]){const rows=items.filter(item=>item.date===date);state.dailyPlans.push({id:`cycle-daily-${week}-${date}`,date,availableMinutes:120,plannedMinutes:rows.length*20,flexMinutes:120-rows.length*20,items:rows})}
  }
  const breakdown=state.subjects.map(subject=>({id:'breakdown-'+subject.id,subjectId:subject.id,total:20,correct:14}));
  state.simulados=[0,1,2,3].map(index=>({id:`cycle-sim-${index}`,nome:`Simulado comparável ${index+1}`,date:addLocalDays(today,-42+index*12),examTags:[bb],total:80,correct:56+index*4,breakdown:breakdown.map(row=>({...row,id:row.id+index,correct:14+index}))}));
  state.exams=Array.from({length:4},(_,index)=>({id:`cycle-exam-${index}`,institution:'Banco do Brasil',examName:`Prova BB ${2020+index}`,role:'Escriturário',board:'Cesgranrio',year:2020+index,date:null,coverage:'complete',examTags:[bb],source:'manual',sourceReference:'Fixture determinística'}));
  state.exams.push({id:'cycle-exam-caixa',institution:'Caixa',examName:'Prova Caixa 2024',role:'TBN',board:'Cesgranrio',year:2024,date:null,coverage:'complete',examTags:[caixa],source:'manual',sourceReference:'Fixture determinística'});
  state.examQuestions=state.exams.flatMap((exam,examIndex)=>topics.filter(topic=>topic.examTags.includes(exam.examTags[0])&&(examIndex===0||examIndex===4||topic.id.endsWith('-0')||topic.id.endsWith('-1'))).map((topic,index)=>({id:`cycle-hq-${examIndex}-${index}`,examId:exam.id,subjectId:topic.subjectId,topicId:topic.id,questionNumber:index+1,weight:1,source:'manual',classification:{method:'manual',confidence:1}})));
  state.readinessSnapshots=Array.from({length:8},(_,index)=>createReadinessSnapshot({id:`cycle-readiness-${index}`,date:addLocalDays(today,-(8-index)*7),activeExamTags:[bb],metrics:Object.fromEntries(['coverage','mastery','retention','consistency','simulations'].map(key=>[key,{available:true,score:45+index*3,confidence:.8}]))}));
  const baseline=captureRecommendationBaseline({mastery:40,accuracy:35,retention:45,reviewHealth:40,risk:65,questionVolume:40,measuredAt:`${addLocalDays(today,-21)}T12:00:00-03:00`});
  const recommendation={recommendationId:'cycle-old-rec',subjectId:topics[0].subjectId,topicId:topics[0].id,topicName:topics[0].name,score:80,mastery:40,retention:45,examImpact:85,type:'study',estimatedMinutes:30,reasons:['Lacuna de alto impacto registrada antes da semana'],algorithmVersion:1};
  state.recommendationFeedback=[{id:'cycle-feedback',recommendationId:'cycle-old-rec',topicId:topics[0].id,subjectId:topics[0].subjectId,date:addLocalDays(today,-21),accepted:true,completed:true,baseline,snapshot:captureRecommendationSnapshot(recommendation,{baseline,createdAt:baseline.measuredAt}),resultingSessionId:state.studySessions.find(item=>item.date>=addLocalDays(today,-20)&&item.topicId===topics[0].id).id,createdAt:baseline.measuredAt}];
  state.recommendationHistory=[];state.adaptivePlanningHistory=[];state.planAdjustments=[];state.studyPlans=[];state.weeklyCloseSnapshots=[];state.progressHistory=[];state.topicHistory=[];state.calendar=[];state.activeTimer=null;
  return state;
}
