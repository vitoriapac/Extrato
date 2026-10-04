import {selectBrowserCases} from '../../tests/config/test-tiers.js';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

export function readImpactPlan(path){
  if(!path)return null;const plan=JSON.parse(readFileSync(path,'utf8'));
  assert.equal(plan.schemaVersion,1);assert.ok(['full','affected','docs'].includes(plan.requiredGate));
  for(const key of ['changedFiles','areas','reasons','unitFiles','browserFiles','browserCases'])assert.ok(Array.isArray(plan[key]),`Plano inválido: ${key}`);
  for(const file of plan.unitFiles)assert.match(file,/^tests\/unit\/[\w-]+\.test\.js$/);
  for(const file of plan.browserFiles)assert.match(file,/^tests\/e2e\/[\w-]+\.spec\.js$/);
  for(const row of plan.browserCases){assert.match(row.file,/^tests\/e2e\/[\w-]+\.spec\.js$/);assert.equal(typeof row.title,'string');assert.ok(row.title.length)}
  return plan;
}

export function selectImpactedBrowserCases(cases,plan){
  if(!plan)return [];
  if(plan.requiredGate==='full')return cases;
  return cases.filter(row=>plan.browserFiles.includes(row.file)||plan.browserCases.some(item=>item.file===row.file&&item.title===row.title));
}
export function selectGateBrowserCases(gate,cases,plan){
  if(gate==='full'||plan?.requiredGate==='full')return cases;
  const tier={fast:'FAST_GATE',regression:'REGRESSION'}[gate];
  const base=tier?selectBrowserCases(tier,cases):[];
  const impact=selectImpactedBrowserCases(cases,plan);
  return cases.filter(row=>base.includes(row)||impact.includes(row));
}
