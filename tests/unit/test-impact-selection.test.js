import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildAffectedTestPlan,matchPath} from '../../scripts/lib/affected-test-plan.js';
import {selectGateBrowserCases} from '../../scripts/lib/browser-test-selection.js';

const inventory=JSON.parse(readFileSync(new URL('../config/test-inventory.json',import.meta.url),'utf8')).inventory;
const tierManifest=JSON.parse(readFileSync(new URL('../config/test-tiers.json',import.meta.url),'utf8'));
const plan=(changedFiles,options={})=>buildAffectedTestPlan({changedFiles,inventory,tierManifest,...options});
test('impact glob respects directories, separators and exact boundaries',()=>{
  assert.ok(matchPath('src/application/recovery/a.js','src/application/recovery/**'));
  assert.equal(matchPath('src/application/recovery-other/a.js','src/application/recovery/**'),false);
  assert.equal(matchPath('styles/nested/a.css','styles/*.css'),false);
});
test('recovery selects invariants, services and confirmed browser journey',()=>{
  const result=plan(['src/application/recovery/build-recovery-plan.js']);
  assert.equal(result.requiredGate,'affected');assert.ok(result.unitFiles.includes('tests/unit/recovery-transaction.test.js'));
  assert.ok(result.unitFiles.includes('tests/unit/adaptive-planning.test.js'));
  assert.equal(result.browserCases.length,1);
});
test('adherence includes reconciliation and transitive shared consumers',()=>{
  const file='src/application/adherence/build-weekly-adherence.js';
  const result=plan([file],{dependencies:{'tests/unit/projection-context.test.js':[file]}});
  assert.ok(result.unitFiles.includes('tests/unit/daily-session-reconciliation.test.js'));
  assert.ok(result.unitFiles.includes('tests/unit/projection-context.test.js'));
  assert.equal(result.browserCases.length,2);
});
test('CSS selects two structural viewport cases without dense screenshot matrix',()=>{
  const result=plan(['styles/app.css']);assert.equal(result.requiredGate,'affected');assert.equal(result.unitFiles.length,0);
  assert.equal(result.browserCases.length,2);assert.ok(result.browserCases.every(row=>row.file.endsWith('responsive-smoke.spec.js')));
});
test('unknown, traversal, missing diff and shared contracts broaden to Full',()=>{
  for(const file of ['src/new-module.js','src/core/date-utils.js','src/state/schema.js','tests/config/test-impact-map.js','../outside.js','C:\\outside.js'])assert.equal(plan([file]).requiredGate,'full');
  assert.equal(plan([],{diffAvailable:false}).requiredGate,'full');
});
test('rename or deletion of an unknown path never silently shrinks selection',()=>{
  assert.equal(plan(['src/application/recovery/old.js','src/unknown-new.js']).requiredGate,'full');
  assert.equal(plan(['src/deleted-unknown.js']).requiredGate,'full');
});
test('generated outputs cannot conceal substantive HTML or worker changes',()=>{
  const source='src/application/adherence/build-adherence-model.js';
  assert.equal(plan([source,'index.html']).requiredGate,'full');
  assert.equal(plan([source,'index.html','service-worker.js'],{derivedFiles:['index.html','service-worker.js']}).requiredGate,'affected');
  assert.equal(plan(['src/app.bundle.js']).requiredGate,'full');
});
test('docs and empty tracked diffs are explicit, unions are deterministic',()=>{
  assert.equal(plan(['docs/a.md']).requiredGate,'docs');assert.equal(plan([]).requiredGate,'affected');
  const a=['src/application/recovery/build-recovery-plan.js','src/application/adherence/build-adherence-model.js'];
  assert.deepEqual(plan(a),plan([...a].reverse().concat(a)));assert.equal(plan(a).browserCases.length,3);
});
test('a modified test runs itself and a modified browser file runs all its cases',()=>{
  assert.deepEqual(plan(['tests/unit/date-utils.test.js']).unitFiles,['tests/unit/date-utils.test.js']);
  assert.deepEqual(plan(['tests/e2e/adherence.spec.js']).browserFiles,['tests/e2e/adherence.spec.js']);
});
test('browser selection unions baseline and impact without dropping or duplicating cases',()=>{
  const cases=[{file:'tests/e2e/smoke.spec.js',title:'inicializa e navega pelas áreas principais'},{file:'tests/e2e/adherence.spec.js',title:'mobile'},{file:'tests/e2e/weekly-adherence.spec.js',title:'historical'}];
  const impact={requiredGate:'affected',browserFiles:['tests/e2e/adherence.spec.js'],browserCases:[]};
  assert.equal(selectGateBrowserCases('fast',cases,impact).length,2);
  assert.equal(selectGateBrowserCases('affected',cases,{requiredGate:'full'}).length,3);
});
