import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {randomUUID} from 'node:crypto';
import {readImpactPlan} from './lib/browser-test-selection.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const requestedGate=process.argv[2],dryRun=process.argv.includes('--dry-run');
if(!['fast','regression','full','visual','affected'].includes(requestedGate))throw Error('Uso: node scripts/run-test-gate.mjs fast|regression|full|visual|affected [--dry-run] [--plan arquivo]');
const option=flag=>{const index=process.argv.indexOf(flag);if(index<0)return null;if(!process.argv[index+1]||process.argv[index+1].startsWith('--'))throw Error(`Valor ausente: ${flag}`);return process.argv[index+1]};
let impactPath=option('--plan')?resolve(root,option('--plan')):null;
mkdirSync(resolve(root,'.test-gates'),{recursive:true});
if(requestedGate==='affected'&&!impactPath){
  impactPath=resolve(root,`.test-gates/impact-${randomUUID()}.json`);
  const input=['scripts/select-affected-tests.mjs','--output',impactPath];
  for(const flag of ['--base','--head','--files'])if(option(flag))input.push(flag,option(flag));
  const selection=spawnSync(process.execPath,input,{cwd:root,encoding:'utf8'});
  if(selection.status!==0)throw Error(selection.stderr||selection.stdout);console.log(selection.stderr||'');
}
const impact=readImpactPlan(impactPath);
const gate=impact?.requiredGate==='full'&&requestedGate!=='visual'?'full':requestedGate;
if(impact)console.log(`Impacto: ${impact.areas.join(', ')||'sem área restrita'}; gate ${gate}; ${impact.unitFiles.length} arquivos Node.`);
const allUnitFiles=readdirSync(resolve(root,'tests/unit')).filter(name=>name.endsWith('.test.js')).sort().map(name=>`tests/unit/${name}`);
const unitFiles=gate==='affected'?impact.unitFiles:allUnitFiles;
if(unitFiles.some(file=>!allUnitFiles.includes(file)))throw Error('Plano contém arquivo Node não existente');
const playwright=resolve(root,'node_modules/playwright/cli.js');
const phases=[];
if(gate!=='visual'){
  phases.push(['Syntax',['scripts/check-syntax.mjs'],'UTC'],['Inventory',['scripts/audit-test-suite.mjs','--check'],'UTC'],['Tier contracts',['scripts/check-test-tiers.mjs'],'UTC'],
    ['Generated artifacts',['scripts/build.mjs','--check'],'UTC']);
  if(unitFiles.length)phases.push(['Unit UTC',['--test',...unitFiles],'UTC'],['Unit Sao Paulo',['--test',...unitFiles],'America/Sao_Paulo']);
}
if(gate!=='affected'||impact.browserFiles.length||impact.browserCases.length)phases.push(['Browser selection',['scripts/check-test-selection.mjs',gate],'UTC'],
  [`Browser ${gate} UTC`,[playwright,'test','--config=playwright.gates.config.js'],'UTC']);
if(gate==='full'){
  const timezoneScript=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).scripts['test:e2e:timezone'];
  // This existing script intentionally contains only literal spec paths.
  const timezoneFiles=timezoneScript.split(/\s+/).slice(2);
  if(!timezoneFiles.length||timezoneFiles.some(file=>!/^tests\/e2e\/[\w-]+\.spec\.js$/.test(file)))throw Error('Recorte timezone deve conter caminhos literais de spec');
  phases.push(['Browser timezone Sao Paulo',[playwright,'test',...timezoneFiles],'America/Sao_Paulo']);
}
if(dryRun){
  for(const [name,args,tz] of phases)console.log(`${name} [${tz}]: node ${args[0]} (${args.length-1} argumentos)`);
  process.exit(0);
}
const start=performance.now(),results=[];let exitCode=0;
try{
  for(const [name,args,tz] of phases){
    console.log(`\n=== ${name} ===`);const phaseStart=performance.now();
    const code=await new Promise((done,reject)=>{
      const env={...process.env,TZ:tz,STUDYTRACK_TEST_GATE:gate};
      if(impactPath)env.STUDYTRACK_IMPACT_PLAN=impactPath;else delete env.STUDYTRACK_IMPACT_PLAN;
      const child=spawn(process.execPath,args,{cwd:root,stdio:'inherit',env});
      child.once('error',reject);child.once('exit',(code,signal)=>done(signal?1:code??1));
    });
    results.push({phase:name,timezone:tz,seconds:Number(((performance.now()-phaseStart)/1000).toFixed(2)),exitCode:code});
    if(code!==0){exitCode=code;break;}
  }
}catch(error){console.error(error);exitCode=1;}
const seconds=Number(((performance.now()-start)/1000).toFixed(2));
const budget=JSON.parse(readFileSync(resolve(root,'tests/config/test-tiers.json'),'utf8')).budgetSeconds[{fast:'FAST_GATE',regression:'REGRESSION',full:'FULL'}[gate]]||null;
const revision=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'});
const dirty=spawnSync('git',['diff','--quiet','HEAD','--'],{cwd:root});
const summary={schemaVersion:1,recordedAt:new Date().toISOString(),commit:revision.status===0?revision.stdout.trim():null,workingTreeDirty:dirty.status===1,requestedGate,gate,platform:process.platform,node:process.version,seconds,exitCode,budget,budgetStatus:budget?.max?(seconds>budget.max?'over_budget':'within_budget'):'not_budgeted',impact,phases:results};
mkdirSync(resolve(root,'test-results'),{recursive:true});writeFileSync(resolve(root,'test-results/gate-summary.json'),JSON.stringify(summary,null,2)+'\n');
appendFileSync(resolve(root,'.test-gates/history.jsonl'),JSON.stringify(summary)+'\n');
const markdown=`## ${gate.toUpperCase()} gate\n\n| Etapa | Fuso | Tempo | Código |\n|---|---|---:|---:|\n${results.map(row=>`| ${row.phase} | ${row.timezone} | ${row.seconds} s | ${row.exitCode} |`).join('\n')}\n\nTotal: **${seconds} s**. Resultado: **${exitCode===0?'passou':'falhou'}**. Instalação e fila do CI não incluídas.\n`;
console.log(markdown);
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown);
if(Number.isFinite(budget?.max)&&seconds>budget.max)console.warn(`Orçamento excedido: ${seconds} s > ${budget.max} s; revisar custo antes de ampliar o gate.`);
process.exitCode=exitCode;
