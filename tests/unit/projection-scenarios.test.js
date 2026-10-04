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

import {evidenceAuditScenarios,evidenceSimulations} from '../fixtures/projection-scenarios/evidence-audit.js';
import {buildCalibratedScoreProjection} from '../../src/domain/forecasts/calibrated-score-projection.js';
for(const [name,scenario] of Object.entries(evidenceAuditScenarios))test('auditoria de evidência da projeção: '+name,()=>{const input={today:'2026-10-01',target:80,...scenario},before=structuredClone(input);const result=buildCalibratedScoreProjection(input);assert.equal(result.available,scenario.available);if(scenario.confidence)assert.equal(result.confidence,scenario.confidence);if(scenario.central!=null)assert.equal(result.central,scenario.central);assert.deepEqual(input,before);assert.deepEqual(buildCalibratedScoreProjection(structuredClone(input)),result);if(result.available){assert.ok(result.low<=result.central&&result.high>=result.central);assert.ok(result.low>=0&&result.high<=100)}});
test('auditoria exclui futuro, registros antigos, inválidos e duplicados sem mudar a base',()=>{const simulations=evidenceSimulations(),base=buildCalibratedScoreProjection({today:'2026-10-01',simulations});const polluted=[...simulations,{...simulations[0]},{...simulations[0],id:'old',date:'2026-01-01'},{...simulations[0],id:'future',date:'2026-10-02'},{...simulations[0],id:'invalid',date:'2026-02-30'},{...simulations[0],id:'impossible',correct:101}];assert.deepEqual(buildCalibratedScoreProjection({today:'2026-10-01',simulations:polluted}),base)});
test('mais estudo ou questões não criam nota nem elevam confiança',()=>{const base={today:'2026-10-01',examDate:'2026-12-01',simulations:evidenceSimulations().map(row=>({...row,breakdown:[]}))};const model=buildProjectionPageModel({...base,coverage:100,adherence:100,consistency:{days:7,target:7}}).model;assert.equal(model.confidence.level,'low');assert.equal(model.projection.examDayScore,null);assert.equal(model.projection.approvalProbability,null)});
