import test from 'node:test';import assert from 'node:assert/strict';
import {createWeeklyCloseSnapshot,upsertWeeklyCloseSnapshot} from '../../src/application/analytics/weekly-close-snapshot.js';

test('salva retrato versionado e preserva versões do mesmo período',()=>{const model={period:{start:'2026-09-01',end:'2026-09-07'},activeExamTags:['bb-escriturario'],weeklyClose:{state:'available',algorithmVersion:'2.0.0',questions:{resolved:10}},gapMap:{items:[]},decisionHistory:{items:[]}},list=[],first=createWeeklyCloseSnapshot(model,{id:'one',savedAt:'2026-09-07T12:00:00Z'});assert.equal(upsertWeeklyCloseSnapshot(list,first),true);model.weeklyClose.questions.resolved=20;const second=createWeeklyCloseSnapshot(model,{id:'two',savedAt:'2026-09-07T13:00:00Z'});upsertWeeklyCloseSnapshot(list,second);assert.equal(list.length,2);assert.equal(list[1].id,'two');assert.equal(list[1].revision,2);assert.equal(list[0].weeklyClose.questions.resolved,10);assert.equal(first.weeklyClose.questions.resolved,10);assert.deepEqual(first.activeExamTags,['bb-escriturario'])});
test('não salva semana sem evidência',()=>{assert.equal(createWeeklyCloseSnapshot({period:{},weeklyClose:{state:'insufficient'}}),null)});
test('mesmo período preserva fechamentos de concursos diferentes e o legado sem escopo',()=>{
  const period={start:'2026-09-01',end:'2026-09-07'},list=[];
  for(const [id,activeExamTags] of [['legacy',null],['bb',['bb-escriturario']],['caixa',['caixa-tbn']]])upsertWeeklyCloseSnapshot(list,{id,period,activeExamTags});
  assert.equal(list.length,3);
  upsertWeeklyCloseSnapshot(list,{id:'bb-updated',weeklyClose:{questions:{resolved:20}},period,activeExamTags:['bb-escriturario','bb-escriturario']});
  assert.deepEqual(list.map(item=>item.id),['legacy','bb','caixa','bb-updated']);
});
