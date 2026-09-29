import test from 'node:test';import assert from 'node:assert/strict';
import {buildCloseComparison} from '../../src/application/analytics/build-close-comparison.js';
import {upsertWeeklyCloseSnapshot} from '../../src/application/analytics/weekly-close-snapshot.js';
const tags=['bb-escriturario'];
test('comparação usa o último registro do mesmo concurso e mantém ausência de dados',()=>{
  const metrics={readiness:70,coverage:60,accuracy:75,strategicAdherence:null,readinessVersion:1,readinessWeights:{coverage:.3},projection:{low:60,high:80,algorithmVersion:1}};
  const previous={id:'p',activeExamTags:tags,period:{start:'2026-09-01',end:'2026-09-07'},savedAt:'2026-09-07',comparisonMetrics:metrics};
  const current={period:{start:'2026-09-08',end:'2026-09-14'},comparisonMetrics:{...metrics,readiness:74,accuracy:80,projection:{low:64,high:84,algorithmVersion:1}}};
  const result=buildCloseComparison({current,snapshots:[previous,{...previous,id:'wrong',activeExamTags:['caixa-tbn'],savedAt:'2026-09-13'}],activeExamTags:tags});assert.equal(result.previous.id,'p');assert.equal(result.rows[0].delta,4);assert.equal(result.rows[1].delta,5);assert.equal(result.rows[3].delta,null);assert.equal(result.rows[4].delta,4);
  current.comparisonMetrics.readinessVersion=2;assert.equal(buildCloseComparison({current,snapshots:[previous],activeExamTags:tags}).rows[0].delta,null);
});
test('repetir salvamento idêntico não cria versão; alterações preservam o objeto anterior',()=>{
  const list=[],first={id:'a',period:{start:'2026-09-01',end:'2026-09-07'},activeExamTags:tags,weeklyClose:{questions:{accuracy:70}}};upsertWeeklyCloseSnapshot(list,first);const frozen=structuredClone(list[0]);
  assert.equal(upsertWeeklyCloseSnapshot(list,{...first,id:'repeat'}),false);
  const second={...first,id:'b',weeklyClose:{questions:{accuracy:75}}};assert.equal(upsertWeeklyCloseSnapshot(list,second),true);second.weeklyClose.questions.accuracy=0;
  assert.deepEqual(list[0],frozen);assert.equal(list[1].revision,2);assert.equal(list[1].previousSnapshotId,'a');assert.equal(list[1].weeklyClose.questions.accuracy,75);
});
