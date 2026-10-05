import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const playwright=resolve(root,'node_modules/playwright/cli.js');
const browser=[
 ['tests/e2e/product-consolidation.spec.js','iniciante sem falsa precisão encontra configuração e coleta de evidências'],
 ['tests/e2e/product-consolidation.spec.js','Demo apresenta próxima ação, evidências progressivas e explicação da Prontidão'],
 ['tests/e2e/daily-execution.spec.js','sugestão fora do plano permite dispensar sem alterar a agenda'],
 ['tests/e2e/strategic-cycle.spec.js','prova → decisão → plano → execução → resultado → fechamento → próxima semana']
];
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phases=['UTC','America/Sao_Paulo'].map(timezone=>({name:'Contratos de experiência',timezone,args:['--test','tests/unit/decision-coherence-scenarios.test.js','tests/unit/daily-execution.test.js','tests/unit/weekly-adherence.test.js']}));
phases.push(...browser.map(([file,title],index)=>({name:title,timezone:'UTC',report:resolve(root,`.tmp-experience-gate/report-${index}.json`),args:[playwright,'test',file,'--grep',`${escape(title)}$`,'--retries=0','--reporter=list,json',`--output=.tmp-experience-gate/case-${index}`]})));
mkdirSync(resolve(root,'.tmp-experience-gate'),{recursive:true});
const results=[],started=performance.now();let exitCode=0;
for(const phase of phases){
 console.log(`\n${phase.name} [${phase.timezone}]`);
 const start=performance.now();
 const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,phase.args,{cwd:root,stdio:'inherit',env:{...process.env,TZ:phase.timezone,...(phase.report?{PLAYWRIGHT_JSON_OUTPUT_FILE:phase.report}:{})}});child.once('error',reject);child.once('exit',code=>done(code??1));});
 results.push({name:phase.name,timezone:phase.timezone,report:phase.report,seconds:Number(((performance.now()-start)/1000).toFixed(2)),exitCode:code});
 if(code!==0){exitCode=code;break}
}
const revision=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
const dirty=spawnSync('git',['diff','--quiet','HEAD','--'],{cwd:root}).status===1;
const summary={commit:revision,workingTreeDirty:dirty,platform:process.platform,seconds:Number(((performance.now()-started)/1000).toFixed(2)),exitCode,results};
mkdirSync(resolve(root,'.test-gates'),{recursive:true});
writeFileSync(resolve(root,'.test-gates/experience-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(`\nExperiência: ${exitCode?'falhou':'passou'} em ${summary.seconds} s.`);
process.exitCode=exitCode;
