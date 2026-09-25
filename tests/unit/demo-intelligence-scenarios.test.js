import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {calculateWindowTrend} from '../../src/domain/analytics/trends.js';
import {calculateTopicMastery,calculateTopicRetention} from '../../src/domain/analytics/topic-metrics.js';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';
import {recommendStudy} from '../../src/application/recommend-study.js';
import {generateDiagnosis} from '../../src/application/generate-diagnosis.js';
import {buildDiagnosisViewModel} from '../../src/application/analytics/build-analytics-view-model.js';

const today='2026-09-24';
const demo=generateDemoData({today});
const scenarios=[
  {name:'lacuna',subject:1,topic:7,status:'Em andamento',impact:.98,correct:32,resolved:80,weeklyCorrect:[9,9,9,9,8,8,8,8],reviews:4,onTime:0,daysSinceReview:24,daysSinceContact:18,tipo:'revisão'},
  {name:'consolidado',subject:0,topic:1,status:'Concluído',impact:.75,correct:72,resolved:80,weeklyCorrect:[18,18,18,18,18,18,18,18],reviews:4,onTime:4,daysSinceReview:2,daysSinceContact:2,tipo:'manutenção'},
  {name:'poucos_dados',subject:1,topic:5,status:'Em andamento',impact:.8,correct:2,resolved:3,weeklyCorrect:[0,0,0,0,0,0,0,2],reviews:0,onTime:0,daysSinceReview:null,daysSinceContact:1,tipo:'continuar'},
  {name:'queda',subject:2,topic:2,status:'Em andamento',impact:.75,correct:60,resolved:80,weeklyCorrect:[18,18,18,18,12,12,12,12],reviews:4,onTime:4,daysSinceReview:3,daysSinceContact:3,tipo:'continuar'}
];

function scenarioCandidates(){
  const retentions={},masteries={},trends={},topics=[],priorities=[];
  for(const item of scenarios){
    const subject=demo.subjects[item.subject],original=subject.topics[item.topic];
    const topic={...original,subjectId:subject.id,status:item.status,examImportance:item.impact,prerequisites:[],estimatedStudyMinutes:180};
    const trend=calculateWindowTrend(item.weeklyCorrect.map(correct=>({resolved:item.name==='poucos_dados'?(correct?3:0):20,correct})));
    const reviews=Array.from({length:item.reviews},(_,index)=>({status:index<item.onTime?'Concluído':'Não iniciado'}));
    const sessions=Array.from({length:item.name==='poucos_dados'?1:4},()=>({durationSeconds:1800}));
    const mastery=calculateTopicMastery({topic,performance:{resolved:item.resolved,accuracy:item.correct/item.resolved*100},trend,reviews,recentSessions:sessions});
    const retention=calculateTopicRetention({due:reviews,resolved:item.resolved,correct:item.correct,lastReview:item.daysSinceReview==null?null:today,daysSince:item.daysSinceReview,onTime:item.onTime});
    topics.push(topic);masteries[item.name]=mastery;trends[item.name]=trend;retentions[topic.id]=retention;
    priorities.push({topicId:topic.id,subjectId:subject.id,topicName:topic.name,subjectName:subject.name,tipo:item.tipo,estimatedMinutes:35,studyType:item.status==='Concluído'?'review':'study',diasSemEstudar:item.daysSinceContact,diasAtrasado:item.name==='lacuna'?12:0,diagnosis:{mastery,trend,lastActivity:today}});
  }
  const candidates=buildStudyCandidates({today,topics,priorities,retentions,blueprint:demo.examBlueprint.subjects,sessions:demo.studySessions.filter(session=>!topics.some(topic=>topic.id===session.topicId)),examProximity:70});
  return {masteries,trends,candidates:Object.fromEntries(scenarios.map((item,index)=>[item.name,candidates[index]])),recommendations:recommendStudy(candidates,{availableMinutes:120})};
}

test('demo extensa contém quatro cenários de inteligência distinguíveis',()=>{
  assert.equal(demo.progressHistory.length,130);
  assert.equal(demo.studySessions.length,170);
  assert.equal(demo.simulados.length,13);
  const {masteries,trends,candidates,recommendations}=scenarioCandidates();
  assert.ok(candidates.lacuna.score>=70);
  assert.ok(candidates.lacuna.score>candidates.consolidado.score);
  assert.ok(candidates.lacuna.reviewUrgency>candidates.consolidado.reviewUrgency);
  assert.ok(candidates.lacuna.examImpact>=candidates.consolidado.examImpact);
  assert.equal(candidates.consolidado.covered,true);
  assert.ok(!recommendations.some(item=>item.id===candidates.consolidado.id&&item.studyType==='study'));
  assert.equal(masteries.poucos_dados.state,'insufficient');
  assert.equal(trends.poucos_dados.state,'insufficient');
  assert.equal(candidates.poucos_dados.evidence.evidenceLabel,'Baixa');
  const diagnosis=buildDiagnosisViewModel(generateDiagnosis(Object.values(candidates)),{limit:10});
  const sparseRows=diagnosis.sections.flatMap(section=>section.items).filter(item=>item.id===candidates.poucos_dados.id);
  assert.ok(sparseRows.length>0);
  assert.ok(sparseRows.every(item=>item.signalLabel==='Evidência limitada'));
  const sparseOpportunity=sparseRows.find(item=>item.presentation.type==='opportunity');
  assert.ok(sparseOpportunity?.presentation.evidence.some(row=>row.label==='Força da evidência'&&Number.parseInt(row.value,10)<35));
  assert.equal(trends.queda.direction,'down');
  assert.ok(candidates.queda.trendRisk>candidates.consolidado.trendRisk);
  assert.ok(candidates.queda.mastery>candidates.lacuna.mastery);
});
