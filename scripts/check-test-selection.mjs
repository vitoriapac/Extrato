import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readImpactPlan,selectGateBrowserCases} from './lib/browser-test-selection.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),gate=process.argv[2];
const tier={fast:'FAST_GATE',regression:'REGRESSION',full:'FULL'}[gate];
assert.ok(tier||gate==='visual'||gate==='affected','Gate desconhecido');
const impact=readImpactPlan(process.env.STUDYTRACK_IMPACT_PLAN);
function discover(config){
  const result=spawnSync(process.execPath,[resolve(root,'node_modules/playwright/cli.js'),'test',`--config=${config}`,'--list','--reporter=json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,env:{...process.env,STUDYTRACK_TEST_GATE:gate}});
  assert.equal(result.status,0,result.stderr||result.stdout);const data=JSON.parse(result.stdout);assert.equal(data.errors?.length||0,0);
  const rows=[];function visit(suite){for(const spec of suite.specs||[])for(const test of spec.tests||[])rows.push({file:`tests/e2e/${spec.file.replaceAll('\\','/')}`,title:spec.title,project:test.projectName});for(const child of suite.suites||[])visit(child)}
  data.suites.forEach(visit);return rows;
}
const all=discover('playwright.config.js'),selected=discover('playwright.gates.config.js');
const key=row=>`${row.project}|${row.file}|${row.title}`;
if(tier||gate==='affected')assert.deepEqual(selected.map(key).sort(),selectGateBrowserCases(gate,all,impact).map(key).sort(),'Config Playwright deve executar exatamente os casos do manifesto e impacto');
else{
  assert.ok(selected.length>0);assert.ok(selected.every(row=>all.some(item=>key(item)===key(row))));
}
for(const row of impact?.browserCases||[])assert.equal(all.filter(item=>item.file===row.file&&item.title===row.title).length,1,`Jornada de impacto deve existir e ser única: ${row.file} / ${row.title}`);
for(const file of impact?.browserFiles||[])assert.ok(all.some(row=>row.file===file),`Arquivo browser não encontrado: ${file}`);
console.log(`${gate}: seleção Playwright validada (${selected.length}/${all.length} casos); nenhum browser iniciado.`);
