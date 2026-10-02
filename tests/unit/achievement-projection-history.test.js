import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAchievementProjection} from '../../src/application/projection/build-achievement-projection.js';
import {captureAchievementProjection,achievementProjectionHistory,validAchievementProjectionSnapshot} from '../../src/application/projection/achievement-projection-history.js';
import {buildProjectionCalibration} from '../../src/application/analytics/projection-calibration-history.js';
import {renderAchievementProjection} from '../../src/ui/performance/achievement-projection-renderer.js';

const dates=['2026-08-06','2026-08-13','2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24'];
const simulations=dates.map((date,index)=>({id:`sim-${index}`,date,correct:62+index*3,total:100,
  breakdown:[{subjectId:'math',total:100}],examTags:['bb']}));
const inputs={coverage:75,adherence:84,consistency:{days:5,target:5},openHighImpactPriorities:0};
const model=buildAchievementProjection({today:'2026-10-01',examDate:'2026-12-15',targetScore:80,simulations,...inputs});
const args={model,simulations,inputs,date:'2026-10-01',issuedAt:'2026-10-01T12:00:00.000Z',id:'projection-1',activeExamTags:['bb']};
const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;');

test('snapshot conserva insumos e resultado, é idempotente e respeita o concurso',()=>{
  const snapshots=[];
  const local={...args,model:structuredClone(model),simulations:structuredClone(simulations),inputs:structuredClone(inputs)};
  assert.equal(captureAchievementProjection({snapshots,...local}),true);
  assert.equal(captureAchievementProjection({snapshots,...local}),false);
  assert.equal(validAchievementProjectionSnapshot(snapshots[0]),true);
  const saved=structuredClone(snapshots[0]);
  local.simulations[0].correct=0;local.model.risks.push('Novo risco');local.inputs.coverage=10;
  assert.deepEqual(snapshots[0],saved);
  assert.equal(achievementProjectionHistory(snapshots,['bb'],'2026-10-01').length,1);
  assert.equal(achievementProjectionHistory(snapshots,['caixa'],'2026-10-01').length,0);
  assert.equal(buildProjectionCalibration({snapshots,simulations:[],activeExamTags:['bb'],today:'2026-10-01'}).total,0);
});

test('snapshot adulterado é rejeitado',()=>{
  const snapshots=[];
  captureAchievementProjection({snapshots,...args});
  assert.equal(validAchievementProjectionSnapshot({...snapshots[0],projection:{...snapshots[0].projection,approvalProbability:80}}),false);
});

test('snapshot da versão 1 continua legível sem campos da versão 2',()=>{
  const snapshots=[];
  captureAchievementProjection({snapshots,...args});
  const legacy=structuredClone(snapshots[0]);
  legacy.algorithmVersion=1;
  delete legacy.source.topicRisks;
  delete legacy.topicRisks;
  delete legacy.recovery;
  assert.equal(validAchievementProjectionSnapshot(legacy),true);
  assert.equal(achievementProjectionHistory([legacy],['bb'],'2026-10-01').length,1);
});

test('card distingue observado de tendência e não declara nota na prova',()=>{
  const html=renderAchievementProjection(model,{escapeHtml});
  assert.match(html,/Histórico registrado/);
  assert.match(html,/Tendência de 30 dias/);
  assert.match(html,/não uma nota estimada para a data da prova/);
  assert.match(html,/Entender esta projeção/);
});
