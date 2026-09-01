import {createDefaultState} from '../state/defaults.js';

const SUBJECTS=[
  ['Português',['Interpretação de texto','Gramática','Concordância','Regência','Crase','Pontuação','Redação oficial','Semântica']],
  ['Matemática',['Razões e proporções','Porcentagem','Equações','Funções','Probabilidade','Estatística','Geometria','Matemática financeira']],
  ['Direito Constitucional',['Princípios fundamentais','Direitos fundamentais','Organização do Estado','Poder Legislativo','Poder Executivo','Poder Judiciário','Controle de constitucionalidade','Administração pública']],
  ['Direito Administrativo',['Atos administrativos','Poderes administrativos','Agentes públicos','Licitações','Contratos','Serviços públicos','Responsabilidade civil','Improbidade']],
  ['Informática',['Sistemas operacionais','Editores de texto','Planilhas','Internet','Segurança da informação','Redes','Banco de dados','Computação em nuvem']],
  ['Conhecimentos Bancários',['Sistema financeiro','Produtos bancários','Mercado financeiro','Câmbio','Garantias','Prevenção à fraude','Atendimento','Atualidades financeiras']]
];
const ERROR_KEYS=['naoSabia','esqueci','interpretacao','calculo','desatencao','chute'];
const TYPES=['questions','study','questions','review','questions'];

function hashSeed(value){let hash=2166136261;for(const char of String(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}return hash>>>0}
function randomFactory(seed){let value=hashSeed(seed)||1;return()=>{value+=0x6D2B79F5;let next=value;next=Math.imul(next^next>>>15,next|1);next^=next+Math.imul(next^next>>>7,next|61);return((next^next>>>14)>>>0)/4294967296}}
function shiftDate(iso,days){const [year,month,day]=iso.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day+days));return date.toISOString().slice(0,10)}
function timestamp(date,hour=12){return `${date}T${String(hour).padStart(2,'0')}:00:00.000Z`}
function distributeErrors(errors,random){const result=Object.fromEntries(ERROR_KEYS.map(key=>[key,0]));let remaining=errors;ERROR_KEYS.forEach((key,index)=>{const count=index===ERROR_KEYS.length-1?remaining:Math.min(remaining,Math.floor(random()*Math.max(1,errors*.32)));result[key]=count;remaining-=count});return result}

export function generateDemoData({seed='studytrack-demo-v1',today}={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(today||'')) throw new TypeError('A demonstração requer a data local atual.');
  const random=randomFactory(`${seed}:${today}`),state=createDefaultState(),createdAt=timestamp(shiftDate(today,-89));
  state.subjects=SUBJECTS.map(([name,topicNames],subjectIndex)=>({
    id:`demo-subject-${subjectIndex+1}`,name,collapsed:false,archived:false,archivedAt:null,createdAt,
    topics:topicNames.map((topicName,topicIndex)=>{
      const archived=topicIndex===7&&subjectIndex===4,status=topicIndex%5===0?'Não iniciado':topicIndex%4===0?'Revisão':topicIndex%3===0?'Concluído':'Em andamento';
      const lastDate=shiftDate(today,-Math.min(80,topicIndex*6+subjectIndex*2));
      return {id:`demo-topic-${subjectIndex+1}-${topicIndex+1}`,name:topicName,link:'',status,archived,archivedAt:archived?timestamp(shiftDate(today,-12)):null,notes:topicIndex%3===0?'Revisar pontos marcados no material principal.':'',tags:topicIndex%2?['edital']:['prioridade'],difficulty:['Fácil','Médio','Difícil'][(topicIndex+subjectIndex)%3],createdAt,firstCompletedAt:status==='Concluído'?timestamp(shiftDate(today,-50)):null,lastCompletedAt:status==='Concluído'?timestamp(lastDate):null,completionCount:status==='Concluído'?2:0,lastReviewedAt:status==='Revisão'||status==='Concluído'?timestamp(lastDate):null,reviewCount:status==='Revisão'||status==='Concluído'?1+topicIndex%3:0,examImportance:Math.round((.45+random()*.5)*100)/100,estimatedStudyMinutes:120+Math.floor(random()*300),prerequisites:topicIndex===0?[]:[`demo-topic-${subjectIndex+1}-${topicIndex}`]};
    })
  }));
  const activeTopics=state.subjects.flatMap(subject=>subject.topics.filter(topic=>!topic.archived).map(topic=>({subject,topic})));
  state.studySessions=[];state.questoes=[];
  const activeAges=Array.from({length:90},(_,age)=>age).filter(age=>age%7!==0&&age%11!==0);
  for(let index=0;index<120;index++){
    const age=activeAges[index%activeAges.length],date=shiftDate(today,-age),entry=activeTopics[index%activeTopics.length],type=TYPES[index%TYPES.length],durationMinutes=25+Math.floor(random()*66);
    const session={id:`demo-session-${index+1}`,date,startedAt:timestamp(date,8+index%11),endedAt:timestamp(date,9+index%11),durationSeconds:durationMinutes*60,subjectId:entry.subject.id,topicId:entry.topic.id,planItemId:null,type,questionsResolved:0,correctAnswers:0,notes:index%9===0?'Sessão demonstrativa com observação de progresso.':'',createdAt:timestamp(date)};
    if(type==='questions'){
      const resolved=22+Math.floor(random()*15),progress=(89-age)/89,subjectPenalty=entry.subject.id==='demo-subject-4'&&age<28?-10:0,rate=Math.max(42,Math.min(88,54+progress*24+subjectPenalty+(random()-.5)*10)),correct=Math.round(resolved*rate/100),errors=resolved-correct;
      session.questionsResolved=resolved;session.correctAnswers=correct;
      state.questoes.push({id:`demo-question-${state.questoes.length+1}`,date,subjectId:entry.subject.id,topicId:entry.topic.id,resolved,correct,errorBreakdown:distributeErrors(errors,random),studySessionId:session.id,createdAt:timestamp(date)});
    }
    state.studySessions.push(session);
  }
  const simulationRates=[61,64,63,67,69,72,74,76,70];
  state.simulados=simulationRates.map((rate,index)=>{const date=shiftDate(today,-(80-index*10)),total=100,correct=rate;return{id:`demo-simulation-${index+1}`,date,nome:`Simulado ${index+1}`,total,correct,breakdown:state.subjects.map((subject,subjectIndex)=>{const rowTotal=subjectIndex<4?17:16,rowCorrect=Math.max(0,Math.min(rowTotal,Math.round(rowTotal*(rate+(subjectIndex-2)*2)/100)));return{id:`demo-simulation-row-${index+1}-${subjectIndex+1}`,subjectId:subject.id,total:rowTotal,correct:rowCorrect}}),createdAt:timestamp(date)}});
  state.reviewAgenda=Array.from({length:42},(_,index)=>{const entry=activeTopics[index%activeTopics.length],offset=index<8?-(8-index):index-8,date=shiftDate(today,offset),completed=index%4===0;return{id:`demo-review-${index+1}`,date,subjectId:entry.subject.id,topicId:entry.topic.id,topicRef:entry.topic.id,topic:entry.topic.name,tipo:['Revisão 24h','Revisão 7 dias','Revisão 30 dias'][index%3],difficulty:['Fácil','Médio','Difícil'][index%3],status:completed?'Concluído':'Não iniciado',completedAt:completed?timestamp(shiftDate(date,index%3===0?2:0)):null,manualDate:false,adaptive:true,adaptiveReason:'Intervalo ajustado pelo histórico demonstrativo.',suggestedDate:date,baseIntervalDays:[1,7,30][index%3],createdAt:timestamp(shiftDate(date,-7))}});
  state.calendar=Array.from({length:24},(_,index)=>{const entry=activeTopics[(index*3)%activeTopics.length],date=shiftDate(today,index-6);return{id:`demo-calendar-${index+1}`,date,week:'',subjectId:entry.subject.id,topicId:entry.topic.id,subject:entry.subject.name,topic:entry.topic.name,status:index<4?'Concluído':'Não iniciado',reviewType:index%2?'Questões':'Revisão rápida',createdAt:timestamp(shiftDate(date,-5))}});
  state.progressHistory=Array.from({length:90},(_,index)=>({date:shiftDate(today,index-89),pct:Math.min(82,18+Math.floor(index*.65))}));
  state.metas={semanal:12,mensal:48,questoesSemanal:220,simuladosSemanal:1,metaAprovacao:80,horasDiarias:2.2,horasPorDia:{'0':0,'1':2.5,'2':2.5,'3':2,'4':2.5,'5':2,'6':1}};
  state.examDate=shiftDate(today,90);state.examBlueprint={examDate:state.examDate,targetScore:80,configuredAt:timestamp(today),subjects:state.subjects.map((subject,index)=>({subjectId:subject.id,expectedQuestions:index<4?18:14,questionWeight:index===2?1.5:1,priority:index<2?'high':index===5?'low':'normal'}))};
  state.metasPorDisciplina=state.subjects.map((subject,index)=>({id:`demo-subject-goal-${index+1}`,subjectId:subject.id,meta:30+index*5,createdAt}));
  state.dailyPlans=Array.from({length:14},(_,index)=>{const date=shiftDate(today,index-6),entryA=activeTopics[(index*2)%activeTopics.length],entryB=activeTopics[(index*2+1)%activeTopics.length],past=index<6;const items=[entryA,entryB].map((entry,itemIndex)=>({id:`demo-plan-item-${index+1}-${itemIndex+1}`,subjectId:entry.subject.id,topicId:entry.topic.id,type:itemIndex?'questions':'study',plannedMinutes:itemIndex?35:45,executedSeconds:past?(itemIndex?2100:1800):0,status:past?(itemIndex?'completed':'partial'):'planned',originalDate:date,currentDate:date,rescheduleCount:index===5&&itemIndex===0?1:0,skippedReason:null,recommendationId:null,lastExecutedAt:past?timestamp(date):null}));return{id:`demo-daily-plan-${index+1}`,date,availableMinutes:120,plannedMinutes:80,flexMinutes:40,createdAt:timestamp(date),updatedAt:timestamp(date),items}});
  const planItems=activeTopics.slice(0,12).map((entry,index)=>({id:`demo-study-plan-topic-${index+1}`,subjectId:entry.subject.id,subjectName:entry.subject.name,topicId:entry.topic.id,topicName:entry.topic.name,minutes:45+index%3*15,estimatedMinutes:entry.topic.estimatedStudyMinutes,activityMix:{theory:20,questions:20,reviews:5}}));
  state.studyPlans=[{id:'demo-study-plan-1',state:'ready',confirmedAt:timestamp(shiftDate(today,-9)),examDate:state.examDate,weeklyAvailableMinutes:900,weeklyPlannedMinutes:planItems.reduce((sum,item)=>sum+item.minutes,0),weeksUntilExam:13,remainingMinutes:6200,missingEffort:[],items:planItems,subjects:state.subjects.map(subject=>({subjectId:subject.id,subjectName:subject.name,minutes:120})),activityMix:{theory:300,questions:300,reviews:120},confidence:.84,confidenceLabel:'Alta',algorithmVersion:1}];
  state.planAdjustments=[{id:'demo-adjustment-1',periodStart:shiftDate(today,-7),periodEnd:shiftDate(today,7),plannedMinutes:480,executedMinutes:350,deficitMinutes:130,redistributedMinutes:100,discardedMinutes:30,allocations:[{date:shiftDate(today,1),minutes:50},{date:shiftDate(today,2),minutes:50}],confirmedAt:timestamp(shiftDate(today,-1)),status:'confirmed'}];
  state.recommendationFeedback=Array.from({length:6},(_,index)=>({id:`demo-feedback-${index+1}`,recommendationId:`demo-recommendation-${index+1}`,date:shiftDate(today,-index*5),subjectId:state.subjects[index%state.subjects.length].id,topicId:activeTopics[index].topic.id,accepted:index!==4,completed:index<3,useful:index<3?index!==2:null,reasonSkipped:index===4?'Preferiu outra disciplina':null,resultingSessionId:index<3?state.studySessions[index].id:null,createdAt:timestamp(shiftDate(today,-index*5)),completedAt:index<3?timestamp(shiftDate(today,-index*5)):null}));
  state.topicHistory=activeTopics.flatMap((entry,index)=>[{id:`demo-history-start-${index+1}`,type:'topic_created',date:shiftDate(today,-89+index%15),subjectId:entry.subject.id,topicId:entry.topic.id,createdAt:timestamp(shiftDate(today,-89+index%15))},...(entry.topic.status==='Concluído'?[{id:`demo-history-done-${index+1}`,type:'topic_completed',date:shiftDate(today,-30-index%20),subjectId:entry.subject.id,topicId:entry.topic.id,createdAt:timestamp(shiftDate(today,-30-index%20))}]:[])]);
  state.alertStates=[];state.achievementsUnlocked={primeira_sessao:timestamp(shiftDate(today,-88)),cem_questoes:timestamp(shiftDate(today,-70))};state.lastBackupAt=timestamp(today);state.updatedAt=timestamp(today);
  return state;
}
