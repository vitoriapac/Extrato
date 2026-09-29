import test from 'node:test';
import assert from 'node:assert/strict';
import {captureProjection,buildProjectionCalibration} from '../../src/application/analytics/projection-calibration-history.js';
test('faixa emitida é imutável e não é reconstruída para resultados antigos',()=>{
 const simulations=[{id:'s',date:'2026-09-10',total:80,correct:60}],snapshots=[],model={available:true,algorithmVersion:1,target:80,low:60,central:75,high:90,observations:[{date:'2026-09-10'}]};
 const args={snapshots,model,simulations,date:'2026-09-20',issuedAt:'2026-09-20T12:00:00Z',id:'p'};
 assert.equal(captureProjection(args),true);assert.equal(captureProjection(args),false);
 model.low=0;simulations[0].correct=0;assert.equal(snapshots[0].low,60);assert.equal(snapshots[0].inputs[0].correct,60);
 const future={id:'new',date:'2026-09-21',total:80,correct:64};
 const result=buildProjectionCalibration({snapshots,simulations:[...simulations,{...future,id:'same',date:'2026-09-20'},future],today:'2026-09-29'});
 assert.equal(result.total,1);assert.equal(result.inside,1);assert.equal(result.rows[0].observed,80);
 assert.equal(buildProjectionCalibration({snapshots,simulations:[future],activeExamTags:['caixa'],today:'2026-09-29'}).total,0);
});
