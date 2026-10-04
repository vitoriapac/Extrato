import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAdherenceChangeExplanation as explain} from '../../src/application/adherence/build-adherence-change-explanation.js';
const model=(time=80,priority=90)=>({period:{evaluatedEnd:'2026-10-03'},ambiguousItemCount:0,
  summary:{plannedMinutes:600,executedMinutes:500,temporalAdherence:time,additionalMinutes:20},
  priority:{plannedMinutes:120,classifiedCoverage:100,adherence:priority},planningContext:{capacity:{state:'recorded',availableMinutes:720}}});
test('explains priority and time independently, without adding their deltas',()=>{
  const previous=model(),current=model(80,68),before=JSON.stringify({previous,current});
  const result=explain({previous,current});assert.equal(result.mainDriver,'priority');assert.equal(result.direction,'down');
  assert.equal(result.changes.time,0);assert.equal(result.changes.priority,-22);assert.equal(JSON.stringify({previous,current}),before);
  assert.equal(explain({previous,current:model(74,90)}).mainDriver,'time');
  assert.equal(explain({previous,current:model(74,68)}).mainDriver,'both');
  assert.equal(explain({previous,current:model(85,68)}).direction,'mixed');
});
test('additional volume does not imply a change in adherence',()=>{
  const previous=model(),current=model();current.summary.additionalMinutes=80;current.summary.executedMinutes=560;
  const result=explain({previous,current});assert.equal(result.mainDriver,'additional_study');assert.equal(result.direction,'stable');
});
test('classification gaps suppress strategic interpretations',()=>{
  const previous=model(),current=model();current.priority.classifiedCoverage=50;
  assert.equal(explain({previous,current}).mainDriver,'coverage');assert.equal(explain({previous,current}).changes,null);
  current.ambiguousItemCount=1;current.priority.classifiedCoverage=100;
  assert.equal(explain({previous,current}).state,'insufficient_data');assert.equal(explain({}).state,'insufficient_data');
});
test('changed denominators and capacity are context, not a fabricated cause',()=>{
  const previous=model(),current=model();current.summary.plannedMinutes=800;current.priority.plannedMinutes=160;current.planningContext.capacity.availableMinutes=900;
  const result=explain({previous,current,mode:'equal_elapsed',evaluatedDays:6});
  assert.equal(result.denominatorChanged,true);assert.equal(result.capacityChanged,true);assert.equal(result.evaluatedDays,6);
  assert.equal(result.mainDriver,'stable');
});
