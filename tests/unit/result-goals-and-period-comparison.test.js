import test from 'node:test';
import assert from 'node:assert/strict';
import {buildResultGoalsViewModel} from '../../src/application/goals/build-result-goals-view-model.js';
import {buildPeriodComparisonViewModel} from '../../src/application/analytics/build-period-comparison-view-model.js';

test('metas de resultado diferenciam meta atingida, andamento e ausência de evidência',()=>{
  const model=buildResultGoalsViewModel({goals:{semanal:10,mensal:40,questoesSemanal:100,simuladosSemanal:1,metaAprovacao:80},achieved:{weeklyTopics:10,monthlyTopics:12,questions:25,simulations:0,accuracy:null}});
  assert.equal(model.items.find(item=>item.id==='weeklyTopics').state,'achieved');
  assert.equal(model.items.find(item=>item.id==='questions').remaining,75);
  assert.equal(model.items.find(item=>item.id==='accuracy').state,'insufficient');
  assert.equal(model.items.find(item=>item.id==='accuracy').progress,null);
});

test('comparação pareia períodos de igual duração e deixa acerto ausente sem amostra',()=>{
  const model=buildPeriodComparisonViewModel({today:'2026-09-21',preset:'7',sessions:[{date:'2026-09-21',durationSeconds:3600},{date:'2026-09-14',durationSeconds:1800}],questions:[{date:'2026-09-20',resolved:10,correct:7}],reviews:[{date:'2026-09-20',status:'Concluído',completedAt:'2026-09-20T12:00:00.000Z'}]});
  assert.deepEqual(model.currentPeriod,{preset:'7',start:'2026-09-15',end:'2026-09-21',days:7,label:'Últimos 7 dias'});
  assert.equal(model.metrics.find(item=>item.key==='minutes').delta,30);
  assert.equal(model.metrics.find(item=>item.key==='accuracy').current,70);
  assert.equal(model.metrics.find(item=>item.key==='accuracy').previous,null);
  assert.equal(model.metrics.find(item=>item.key==='accuracy').delta,null);
  assert.equal(model.insights.confidence,'insufficient');
  assert.match(model.insights.accuracyMessage,/necessárias questões resolvidas nos dois períodos/);
  assert.match(model.insights.caveat,/não demonstra que uma ação causou/);
});

test('insight de acerto calibra a confiança pelo menor volume entre períodos',()=>{
  const model=buildPeriodComparisonViewModel({today:'2026-09-21',preset:'7',questions:[
    {date:'2026-09-21',resolved:24,correct:18},
    {date:'2026-09-14',resolved:12,correct:6}
  ]});
  assert.equal(model.insights.confidence,'low');
  assert.equal(model.insights.currentQuestionVolume,24);
  assert.equal(model.insights.previousQuestionVolume,12);
  assert.equal(model.insights.accuracyDelta,25);
  assert.match(model.insights.accuracyMessage,/12 questões no período anterior e 24 no atual/);
});

test('insight marca como moderada a comparação com amostras suficientes nos dois períodos',()=>{
  const model=buildPeriodComparisonViewModel({today:'2026-09-21',preset:'7',questions:[
    {date:'2026-09-21',resolved:25,correct:20},
    {date:'2026-09-14',resolved:20,correct:14}
  ]});
  assert.equal(model.insights.confidence,'moderate');
  assert.match(model.insights.accuracyMessage,/amostra comparável/);
});

test('comparação com datas personalizadas usa intervalo civil local',()=>{
  const model=buildPeriodComparisonViewModel({today:'2026-09-21',preset:'custom',start:'2026-09-18',end:'2026-09-20',sessions:[{date:'2026-09-18',durationSeconds:1200}]});
  assert.equal(model.currentPeriod.days,3);
  assert.equal(model.previousPeriod.start,'2026-09-15');
  assert.equal(model.previousPeriod.end,'2026-09-17');
  assert.equal(model.metrics[0].current,20);
});
