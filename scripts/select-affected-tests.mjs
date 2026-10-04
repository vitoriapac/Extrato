import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildAffectedTestPlan} from './lib/affected-test-plan.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),value=flag=>{const index=args.indexOf(flag);if(index<0)return null;if(!args[index+1]||args[index+1].startsWith('--'))throw Error(`Valor ausente: ${flag}`);return args[index+1]};
const git=args=>{const result=spawnSync('git',args,{cwd:root,encoding:'utf8'});if(result.status!==0)throw Error(result.stderr||'Git indisponível');return result.stdout};
let changedFiles=[],diffAvailable=true,baseCommit='HEAD',headCommit=null;
try{
  if(value('--files'))changedFiles=value('--files').split(',').filter(Boolean);
  else{
    const base=value('--base'),head=value('--head');if(head&&!base)throw Error('--head requer --base');
    const commit=ref=>git(['rev-parse','--verify','--end-of-options',`${ref}^{commit}`]).trim();
    const range=base?[commit(base),commit(head||'HEAD')]:['HEAD'];
    baseCommit=range[0];headCommit=range[1]||null;
    const parts=git(['diff','--name-status','-z','--find-renames',...range,'--']).split('\0');
    for(let index=0;index<parts.length&&parts[index];){const status=parts[index++],count=/^[RC]/.test(status)?2:1;for(let n=0;n<count;n++)changedFiles.push(parts[index++]);}
    if(!base)changedFiles.push(...git(['ls-files','--others','--exclude-standard','-z','--','src','styles','icons','scripts','tests','.github','AGENTS.md','package.json','package-lock.json','playwright.config.js','playwright.gates.config.js']).split('\0').filter(Boolean));
  }
}catch(error){diffAvailable=false;console.error(`Diff indisponível; seleção Full: ${error.message}`);}
const inventory=JSON.parse(readFileSync(resolve(root,'tests/config/test-inventory.json'),'utf8')).inventory;
const tierManifest=JSON.parse(readFileSync(resolve(root,'tests/config/test-tiers.json'),'utf8'));
const cache=new Map();
function dependencies(file,seen=new Set()){
  if(cache.has(file))return cache.get(file);
  if(seen.has(file))return [];seen.add(file);const result=new Set();
  if(existsSync(resolve(root,file))){
    const source=readFileSync(resolve(root,file),'utf8');
    for(const match of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)){
      if(!match[1].startsWith('.'))continue;
      const imported=posix.normalize(posix.join(posix.dirname(file),match[1]));
      if(imported.startsWith('../'))continue;result.add(imported);
      if(/\.(?:js|mjs)$/.test(imported))for(const item of dependencies(imported,new Set(seen)))result.add(item);
    }
  }
  // Cycles use the current traversal's conservative closure; no test is removed
  // because it was visited through another branch.
  const values=[...result];if(seen.size===1)cache.set(file,values);return values;
}
const graph=Object.fromEntries(inventory.filter(row=>row.layer==='node').map(row=>[row.file,dependencies(row.file)]));
const derivedFiles=[];
for(const file of ['index.html','service-worker.js'].filter(file=>changedFiles.includes(file)))try{
  const before=git(['show',`${baseCommit}:${file}`]),after=headCommit?git(['show',`${headCommit}:${file}`]):readFileSync(resolve(root,file),'utf8');
  const normalize=value=>value.replace(/\r\n/g,'\n').replace(/((?:styles\/app\.css|src\/app\.bundle\.js)\?v=)[a-f0-9]{12}/g,'$1__VERSION__').replace(/studytrack-[a-f0-9]{12}/g,'studytrack-__VERSION__');
  if(normalize(before)===normalize(after))derivedFiles.push(file);
}catch{/* Unverifiable generated changes remain global. */}
const plan=buildAffectedTestPlan({changedFiles,inventory,tierManifest,dependencies:graph,derivedFiles,diffAvailable});
plan.provenance={source:value('--files')?'explicit_files':value('--base')?'commit_diff':'working_tree',baseCommit,headCommit,diffAvailable};
if(value('--output'))writeFileSync(resolve(root,value('--output')),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify(plan,null,2));
