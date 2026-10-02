import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAchievementProjection} from '../../src/application/projection/build-achievement-projection.js';
import {buildProjectionRequirements} from '../../src/application/projection/build-projection-requirements.js';
import {simulateProjectionScenario} from '../../src/application/projection/simulate-projection-scenario.js';
import {renderAchievementProjection,renderProjectionScenarioResult} from '../../src/ui/performance/achievement-projection-renderer.js';
import {projectionScenarios} from '../fixtures/projection-scenarios/scenarios.js';

const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;');
const {expected,studySessions,...input}=projectionScenarios.longDeadline;
const baseline={today:input.today,inputs:input,weeklyCapacityMinutes:600,plannedMinutes:660};

test('estado insuficiente deriva faltas dos limiares reais e orienta próximo passo',()=>{
  const model=buildAchievementProjection(projectionScenarios.insufficient);
  const result=buildProjectionRequirements(model);
  assert.equal(result.pending.find(item=>item.label.includes('Simulados')).guidance.includes('mais 2'),true);
  const html=renderAchievementProjection(model,{escapeHtml});
  assert.match(html,/Projeção ainda indisponível/);
  assert.match(html,/mais 2 simulado/);
  assert.match(html,/Registrar simulado/);
});

test('histórico mostra cinco registros e expande os restantes sem recalcular passado',()=>{
  const model=buildAchievementProjection(input);
  const history=Array.from({length:7},(_,index)=>({date:`2026-09-${String(index+1).padStart(2,'0')}`,
    status:index<3?'at_risk':'attention',confidence:{level:'low'}}));
  const saved=structuredClone(history);
  const html=renderAchievementProjection(model,{history,escapeHtml});
  assert.match(html,/Mostrar mais/);
  assert.match(html,/Em risco → Atenção/);
  assert.deepEqual(history,saved);
  assert.match(html,/Ver valores do gráfico/);
  assert.match(html,/meta 80%/);
});

test('simulação altera interpretação e encaixe sem mutar base, persistir ou prever nota',()=>{
  const source=structuredClone(baseline);
  const result=simulateProjectionScenario({baseline,scenario:{targetScore:85,examDate:'2026-10-11',weeklyCapacityMinutes:720}});
  assert.equal(result.state,'ready');
  assert.equal(result.current.status,'attention');
  assert.equal(result.simulated.status,'at_risk');
  assert.equal(result.current.planFit.shortfallMinutes,60);
  assert.equal(result.simulated.planFit.remainingMinutes,60);
  assert.equal(result.projection.projection.examDayScore,null);
  assert.equal(result.projection.projection.approvalProbability,null);
  assert.deepEqual(baseline,source);
  const html=renderProjectionScenarioResult(result,{escapeHtml});
  assert.match(html,/Resultado simulado/);
  assert.match(html,/Nenhum dado real foi alterado/);
});

test('cenários inválidos são bloqueados',()=>{
  for(const scenario of [
    {targetScore:101,examDate:'2026-10-11',weeklyCapacityMinutes:600},
    {targetScore:80,examDate:'2026-02-30',weeklyCapacityMinutes:600},
    {targetScore:80,examDate:'2026-09-01',weeklyCapacityMinutes:600},
    {targetScore:80,examDate:'2026-10-11',weeklyCapacityMinutes:-1}
  ])assert.equal(simulateProjectionScenario({baseline,scenario}).state,'invalid');
});

test('aumentar somente a capacidade não altera trajetória nem histórico',()=>{
  const source=structuredClone(baseline);
  const result=simulateProjectionScenario({baseline,scenario:{targetScore:80,examDate:'2026-12-30',weeklyCapacityMinutes:900}});
  assert.equal(result.state,'ready');
  assert.equal(result.simulated.status,result.current.status);
  assert.equal(result.simulated.daysRemaining,result.current.daysRemaining);
  assert.equal(result.simulated.planFit.remainingMinutes,240);
  assert.equal(result.current.planFit.shortfallMinutes,60);
  assert.deepEqual(baseline,source);
});
