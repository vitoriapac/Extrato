import test from 'node:test';
import assert from 'node:assert/strict';
import {projectionScenarios} from '../fixtures/projection-scenarios/scenarios.js';
import {buildProjectionPageModel} from '../../src/application/projection/index.js';
import {captureAchievementProjection} from '../../src/application/projection/achievement-projection-history.js';

for(const [name,scenario] of Object.entries(projectionScenarios))test(`trajetória determinística: ${name}`,()=>{
  const {expected,studySessions,...input}=scenario;
  if(studySessions)assert.equal(new Set(studySessions.map(item=>item.date)).size,120);
  const first=buildProjectionPageModel(input).model;
  assert.equal(first.status,expected);
  assert.deepEqual(buildProjectionPageModel(structuredClone(input)).model,first);
  assert.equal(first.projection.examDayScore,null);
  assert.equal(first.projection.approvalProbability,null);
});

test('mudança de meta e prova não cria comparação enganosa nem mistura escopos',()=>{
  const {expected,studySessions,...input}=projectionScenarios.healthy;
  const old=buildProjectionPageModel({...input,activeExamTags:['bb']});
  const snapshots=[];
  assert.equal(captureAchievementProjection({snapshots,...old,date:'2026-10-01',issuedAt:'2026-10-01T12:00:00Z',id:'p1',activeExamTags:['bb']}),true);
  const common={...input,today:'2026-10-08',snapshots,periodStart:'2026-10-07'};
  assert.equal(buildProjectionPageModel({...common,activeExamTags:['bb']}).closeContext.state,'comparable');
  assert.equal(buildProjectionPageModel({...common,targetScore:85,activeExamTags:['bb']}).closeContext.state,'baseline');
  assert.equal(buildProjectionPageModel({...common,examDate:'2027-01-20',activeExamTags:['bb']}).closeContext.state,'baseline');
  assert.equal(buildProjectionPageModel({...common,activeExamTags:['caixa']}).history.length,0);
  assert.equal(buildProjectionPageModel({...common,activeExamTags:['caixa']}).closeContext.state,'baseline');
  assert.equal(snapshots[0].current.targetScore,80);
});
