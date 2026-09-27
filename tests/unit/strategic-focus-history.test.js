import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStrategicFocusHistory} from '../../src/application/analytics/build-strategic-focus-history.js';
import {renderStrategicFocusHistory} from '../../src/ui/renderers/studytrack32-renderer.js';
import {createWeeklyCloseSnapshot} from '../../src/application/analytics/weekly-close-snapshot.js';

const model=(start,end,focusPercent,executedMinutes,{tags=['bb-escriturario'],workedGaps=2,improved=1,stable=0,declined=0}={})=>({
  period:{start,end},activeExamTags:tags,weeklyClose:{state:'available',algorithmVersion:'2.1.0',investment:{executedMinutes},strategicFocus:{state:'available',highImpactPercent:focusPercent,highImpactMinutes:Math.round(executedMinutes*focusPercent/100),totalMinutes:executedMinutes,workedGaps,improved,stable,declined,unmeasured:workedGaps-improved-stable-declined}},gapMap:{items:[]},decisionHistory:{items:[]}
});
const snapshot=(value,id)=>createWeeklyCloseSnapshot(value,{id,savedAt:`${value.period.end}T12:00:00Z`});

test('histórico usa apenas períodos salvos, comparáveis, sem sobreposição e no mesmo concurso',()=>{
  const old=snapshot(model('2026-09-01','2026-09-07',52,100),'old');
  const overlap=snapshot(model('2026-09-08','2026-09-14',61,120),'overlap');
  const recent=snapshot(model('2026-09-13','2026-09-19',68,130),'recent');
  const wrongScope=snapshot(model('2026-09-20','2026-09-21',95,200,{tags:['caixa-tbn']}),'caixa');
  const legacy={...snapshot(model('2026-08-24','2026-08-31',80,100),'legacy')};delete legacy.activeExamTags;
  const current=model('2026-09-22','2026-09-28',74,90,{workedGaps:4,improved:2,stable:1,declined:1});
  const result=buildStrategicFocusHistory({snapshots:[old,overlap,recent,wrongScope,legacy],current,activeExamTags:['bb-escriturario']});
  assert.deepEqual(result.rows.map(item=>item.focusPercent),[52,68,74]);
  assert.deepEqual(result.rows.map(item=>item.end),['2026-09-07','2026-09-19','2026-09-28']);
  assert.deepEqual(result.comparison,{focusDelta:6,executionDelta:-40,previousEnd:'2026-09-19'});
  assert.deepEqual(result.totals,{workedGaps:8,measured:6,improved:4,stable:1,declined:1});
  assert.match(renderStrategicFocusHistory(result),/74%/);
  assert.match(renderStrategicFocusHistory(result),/tempo executado/);
  assert.match(renderStrategicFocusHistory(result),/não atribui causalidade/);
  assert.match(renderStrategicFocusHistory(result),/class="weekly-focus-trend"/);
  assert.equal((renderStrategicFocusHistory(result).match(/class="weekly-focus-trend-point"/g)||[]).length,3);
});

test('snapshot congela foco e escopo sem recalcular semanas antigas',()=>{
  const source=model('2026-09-01','2026-09-07',60,100);
  const frozen=snapshot(source,'frozen');
  source.weeklyClose.strategicFocus.highImpactPercent=90;
  source.activeExamTags.push('caixa-tbn');
  assert.equal(frozen.weeklyClose.strategicFocus.highImpactPercent,60);
  assert.deepEqual(frozen.activeExamTags,['bb-escriturario']);
  const wrong=buildStrategicFocusHistory({snapshots:[frozen],current:model('2026-09-15','2026-09-21',80,120,{tags:['caixa-tbn']}),activeExamTags:['caixa-tbn']});
  assert.equal(wrong.historyCount,0);
  assert.equal(wrong.comparison,null);
});

test('sem valor histórico confiável não inventa zero nem tendência',()=>{
  const incomplete={...snapshot(model('2026-09-01','2026-09-07',55,100),'missing')};
  incomplete.weeklyClose.strategicFocus.highImpactPercent=null;
  const result=buildStrategicFocusHistory({snapshots:[incomplete],current:model('2026-09-15','2026-09-21',70,80),activeExamTags:['bb-escriturario']});
  assert.equal(result.historyCount,0);
  assert.equal(result.comparison,null);
  assert.match(renderStrategicFocusHistory(result),/Salve fechamentos/);
  assert.doesNotMatch(renderStrategicFocusHistory(result),/class="weekly-focus-trend"/);
});
