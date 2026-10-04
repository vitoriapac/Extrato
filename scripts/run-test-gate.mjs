import {spawn} from 'node:child_process';
import {readFileSync,readdirSync,mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const gate=process.argv[2],dryRun=process.argv.includes('--dry-run');
if(!['fast','regression','full','visual'].includes(gate))throw Error('Uso: node scripts/run-test-gate.mjs fast|regression|full|visual [--dry-run]');
const unitFiles=readdirSync(resolve(root,'tests/unit')).filter(name=>name.endsWith('.test.js')).sort().map(name=>`tests/unit/${name}`);
const playwright=resolve(root,'node_modules/playwright/cli.js');
const phases=[];
if(gate!=='visual'){
  phases.push(['Syntax',['scripts/check-syntax.mjs'],'UTC'],['Inventory',['scripts/audit-test-suite.mjs','--check'],'UTC'],['Tier contracts',['scripts/check-test-tiers.mjs'],'UTC'],
    ['Generated artifacts',['scripts/build.mjs','--check'],'UTC'],['Unit UTC',['--test',...unitFiles],'UTC'],['Unit Sao Paulo',['--test',...unitFiles],'America/Sao_Paulo']);
}
phases.push(['Browser selection',['scripts/check-test-selection.mjs',gate],'UTC'],
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
      const child=spawn(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,TZ:tz,STUDYTRACK_TEST_GATE:gate}});
      child.once('error',reject);child.once('exit',(code,signal)=>done(signal?1:code??1));
    });
    results.push({phase:name,timezone:tz,seconds:Number(((performance.now()-phaseStart)/1000).toFixed(2)),exitCode:code});
    if(code!==0){exitCode=code;break;}
  }
}catch(error){console.error(error);exitCode=1;}
const seconds=Number(((performance.now()-start)/1000).toFixed(2));
const budget=JSON.parse(readFileSync(resolve(root,'tests/config/test-tiers.json'),'utf8')).budgetSeconds[{fast:'FAST_GATE',regression:'REGRESSION',full:'FULL'}[gate]]||null;
const summary={gate,platform:process.platform,node:process.version,seconds,exitCode,budget,phases:results};
mkdirSync(resolve(root,'test-results'),{recursive:true});writeFileSync(resolve(root,'test-results/gate-summary.json'),JSON.stringify(summary,null,2)+'\n');
const markdown=`## ${gate.toUpperCase()} gate\n\n| Etapa | Fuso | Tempo | Código |\n|---|---|---:|---:|\n${results.map(row=>`| ${row.phase} | ${row.timezone} | ${row.seconds} s | ${row.exitCode} |`).join('\n')}\n\nTotal: **${seconds} s**. Resultado: **${exitCode===0?'passou':'falhou'}**. Instalação e fila do CI não incluídas.\n`;
console.log(markdown);
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown);
if(budget&&seconds>budget.max)console.warn(`Orçamento excedido: ${seconds} s > ${budget.max} s; revisar custo antes de ampliar o gate.`);
process.exitCode=exitCode;
