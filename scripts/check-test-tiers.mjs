import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {TEST_TIERS,testTierManifest,classifyTest,selectBrowserCases} from '../tests/config/test-tiers.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const expected=['unit','e2e'].flatMap(layer=>readdirSync(resolve(root,`tests/${layer}`)).filter(name=>name.endsWith(layer==='unit'?'.test.js':'.spec.js')).map(name=>`tests/${layer}/${name}`)).sort();
const classified=testTierManifest.files.map(row=>row.file).sort();
assert.equal(testTierManifest.schemaVersion,1);
assert.equal(testTierManifest.mode,'classification-only');
for(const gate of ['FAST_GATE','REGRESSION']){
  const budget=testTierManifest.budgetSeconds[gate];
  assert.ok(Number.isFinite(budget.target)&&budget.target>0&&budget.max>=budget.target,`Orçamento inválido: ${gate}`);
}
assert.equal(new Set(classified).size,classified.length,'Arquivo duplicado no manifesto');
assert.deepEqual(classified,expected,'Todo arquivo executável deve ter classificação explícita');
for(const entry of testTierManifest.files){
  assert.ok(TEST_TIERS.includes(entry.tier),`Tier inválido: ${entry.file}`);
  assert.ok(entry.rationale,`Justificativa ausente: ${entry.file}`);
  if(entry.file.includes('/unit/'))assert.equal(entry.tier,'FAST_GATE','Todos os contratos Node permanecem no Fast nesta fase');
  else assert.equal(entry.tier,'FULL','Promover jornadas por título; não promover a matriz inteira');
  const titles=(entry.promotions||[]).map(row=>row.title);
  assert.equal(new Set(titles).size,titles.length,`Promoção duplicada: ${entry.file}`);
  for(const promotion of entry.promotions||[]){
    assert.ok(TEST_TIERS.includes(promotion.tier));assert.ok(promotion.rationale);
  }
}
const discovery=spawnSync(process.execPath,[resolve(root,'node_modules/playwright/cli.js'),'test','--list','--reporter=json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(discovery.status,0,discovery.stderr||discovery.stdout);
const report=JSON.parse(discovery.stdout),cases=[];
assert.equal(report.errors?.length||0,0,'Falha na descoberta Playwright');
function collect(suite){
  for(const spec of suite.specs||[])for(const test of spec.tests||[])cases.push({file:`tests/e2e/${spec.file.replaceAll('\\','/')}`,title:spec.title,project:test.projectName});
  for(const child of suite.suites||[])collect(child);
}
report.suites.forEach(collect);
for(const entry of testTierManifest.files)for(const promotion of entry.promotions||[]){
  assert.equal(cases.filter(row=>row.file===entry.file&&row.title===promotion.title).length,1,`Seleção deve corresponder a um único caso: ${entry.file} / ${promotion.title}`);
}
for(const gate of TEST_TIERS){
  const selected=selectBrowserCases(gate,cases);
  console.log(`${gate}: ${classified.filter(file=>file.includes('/unit/')).length} arquivos Node + ${selected.length} casos browser.`);
}
const fast=selectBrowserCases('FAST_GATE',cases);
assert.equal(fast.length,1,'Fast deve conter somente um smoke browser');
assert.equal(fast[0].file,'tests/e2e/smoke.spec.js','Demo e matriz visual não entram no Fast');
assert.equal(selectBrowserCases('FULL',cases).length,cases.length,'Full preserva todos os casos');
const regression=selectBrowserCases('REGRESSION',cases);
assert.ok(fast.every(row=>regression.includes(row)),'Regression deve incluir Fast');
assert.equal(regression.length-fast.length,10,'Regression contém oito jornadas e duas verificações responsivas');
assert.ok(testTierManifest.files.every(entry=>entry.tier!=='REMOVE'&&entry.tier!=='CONSOLIDATE'),'Decisão de remoção não é gate');
assert.throws(()=>classifyTest('tests/e2e/unknown.spec.js','x'),/sem classificação/);
assert.throws(()=>selectBrowserCases('REMOVE',cases),/desconhecido/);
const evidence=JSON.parse(readFileSync(resolve(root,'tests/config/runtime-evidence.json'),'utf8'));
for(const gate of ['FAST_GATE','REGRESSION']){
  const selected=selectBrowserCases(gate,cases);
  const measured=selected.map(row=>evidence.e2eCases.find(item=>item.file===row.file&&item.title===row.title));
  console.log(`${gate}: soma histórica dos casos ${measured.every(Boolean)?measured.reduce((sum,row)=>sum+row.seconds,0).toFixed(1)+' s':'incompleta'}; não é medição do novo gate.`);
}
console.log('Classificação e seleções verificadas por descoberta; nenhum teste browser foi executado.');
