import test from 'node:test';import assert from 'node:assert/strict';
import {recommendStudy} from '../../src/application/recommend-study.js';

test('ordena recomendações pela fórmula explicável',()=>{
  const result=recommendStudy([{id:'a',estimatedMinutes:30,examImpact:90,retentionRisk:80,masteryGap:70,reviewUrgency:80,planAlignment:50,recencyRisk:60},{id:'b',estimatedMinutes:30,examImpact:20,retentionRisk:20,masteryGap:20,reviewUrgency:0,planAlignment:20,recencyRisk:20}],{availableMinutes:45});
  assert.equal(result[0].id,'a');assert.ok(result[0].reasons.length);assert.equal(result[0].confidence,'alta');
});

test('respeita tempo, exclusões, conclusão e arquivamento',()=>{
  const base={estimatedMinutes:20,examImpact:60,masteryGap:50,planAlignment:50};
  const result=recommendStudy([{...base,id:'ok'},{...base,id:'long',estimatedMinutes:90},{...base,id:'skip'},{...base,id:'done',completed:true},{...base,id:'arch',archived:true}],{availableMinutes:30,excludedIds:['skip']});
  assert.deepEqual(result.map(item=>item.id),['ok']);
});
