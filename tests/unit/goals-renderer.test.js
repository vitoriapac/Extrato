import test from 'node:test';
import assert from 'node:assert/strict';
import {renderGoals} from '../../src/ui/renderers/goals-renderer.js';
import {buildResultGoalsViewModel} from '../../src/application/goals/build-result-goals-view-model.js';
const escapeHtml=value=>String(value).replaceAll('<','&lt;').replaceAll('>','&gt;');
test('groups volume, routine and outcome without converting topic goals into hours',()=>{
  const goals={semanal:5,mensal:20,questoesSemanal:100,simuladosSemanal:1,consistenciaSemanal:5,metaAprovacao:80},before=JSON.stringify(goals);
  const model=buildResultGoalsViewModel({goals,achieved:{weeklyTopics:2,monthlyTopics:7,questions:50,simulations:1,studyDays:3,accuracy:null}});
  const html=renderGoals(model,{adherenceTarget:80,escapeHtml});
  for(const group of ['volume','routine','outcome'])assert.match(html,new RegExp(`goal-group--${group}`));
  assert.match(html,/Tópicos concluídos nesta semana/);assert.match(html,/Tópicos concluídos neste mês/);
  assert.match(html,/href="#metasCapacity"/);assert.match(html,/href="#subjectAccuracyGoals"/);assert.match(html,/Meta de Aderência/);
  assert.match(html,/Sem dados/);assert.equal(JSON.stringify(goals),before);
  assert.equal((html.match(/class="meta-card"/g)||[]).length,7);
});
test('accuracy gaps use readable percentage points without floating point residue',()=>{
  const model=buildResultGoalsViewModel({goals:{metaAprovacao:80},achieved:{accuracy:69.6}});
  const html=renderGoals(model,{adherenceTarget:null,escapeHtml});
  assert.match(html,/Faltam 10.4 p.p./);assert.doesNotMatch(html,/10.400000/);
});
