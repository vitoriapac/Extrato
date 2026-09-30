import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStabilityMap} from '../../src/application/performance/build-stability-map.js';
import {buildPhaseComparison} from '../../src/application/analytics/build-phase-comparison.js';
import {createWeeklyCloseSnapshot} from '../../src/application/analytics/weekly-close-snapshot.js';
import {renderPhaseComparison} from '../../src/ui/renderers/phase-comparison-renderer.js';

test('mapa usa meta e evolução existentes, sem criar score ou classificar amostra pequena',()=>{
  const rows=[['a',85,80,-4],['b',85,80,0],['c',65,80,0],['d',65,80,4],['e',90,80,null]].map(([subjectId,accuracy,target,evolution])=>({subjectId,name:subjectId,accuracy,target,evolution,state:'measured'}));
  const map=buildStabilityMap({rows});
  assert.deepEqual(['attention','maintain','intervene','evolving','insufficient'].map(key=>map.groups[key].map(row=>row.subjectId)),[['a'],['b'],['c'],['d'],['e']]);
  assert.equal(map.measured,4);
  assert.equal(rows[0].stabilityState,undefined);
});

test('comparação usa fase salva, ignora legado, outro concurso e revisão duplicada',()=>{
  const close=(id,phase,revision,questions,correct)=>({id,period:{start:'2026-08-01',end:'2026-08-07'},activeExamTags:['bb'],examPhase:phase,revision,weeklyClose:{questions:{resolved:questions,correct},investment:{plannedMinutes:120,executedMinutes:90}}});
  const construction={state:'construction',label:'Construção'};
  const model=buildPhaseComparison({activeExamTags:['bb'],weeklyCloseSnapshots:[close('old',construction,1,20,10),close('new',construction,2,40,28),close('legacy',null,1,99,99),{...close('other',construction,1,100,100),activeExamTags:['caixa']}],readinessSnapshots:[{date:'2026-08-07',score:61,examPhase:construction,activeExamTags:['bb']}]});
  assert.equal(model.rows.length,1);
  assert.equal(model.rows[0].questions,40);
  assert.equal(model.rows[0].accuracy,70);
  assert.equal(model.rows[0].adherence,75);
  assert.equal(model.rows[0].readiness,61);
});

test('captura fase no fechamento sem alterar o modelo original',()=>{
  const model={period:{start:'2026-08-01',end:'2026-08-07'},activeExamTags:['bb'],weeklyClose:{state:'ready',algorithmVersion:1},gapMap:{},decisionHistory:{}};
  const phase={state:'consolidation',label:'Consolidação',days:50};
  const snapshot=createWeeklyCloseSnapshot(model,{id:'one',savedAt:'2026-08-07T12:00:00Z',examPhase:phase});
  assert.deepEqual(snapshot.examPhase,{state:'consolidation',label:'Consolidação'});
  assert.equal(model.examPhase,undefined);
});

test('nome de fase restaurado é escapado no HTML',()=>{
  const html=renderPhaseComparison({state:'ready',rows:[{label:'<img src=x onerror=alert(1)>',accuracy:null,questions:0,adherence:null,readiness:null}]});
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
});
