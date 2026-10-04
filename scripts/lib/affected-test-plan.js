import {posix} from 'node:path';
import {impactAreas,globalImpactSources,impactMapVersion} from '../../tests/config/test-impact-map.js';

export const matchPath=(path,pattern)=>new RegExp('^'+pattern.split(/(\*\*|\*)/).map(part=>part==='**'?'.*':part==='*'?'[^/]*':part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('')+'$').test(path);
export function buildAffectedTestPlan({changedFiles=[],inventory=[],tierManifest,dependencies={},derivedFiles=[],diffAvailable=true}={}){
  const files=[...new Set(changedFiles.map(file=>String(file).replaceAll('\\','/').replace(/^\.\//,'')))].sort();
  const reasons=[],areas=new Set(),units=new Set(),browserFiles=new Set(),browserCases=[];
  const allUnits=inventory.filter(row=>row.layer==='node').map(row=>row.file).sort();
  let full=!diffAvailable;
  if(full)reasons.push({code:'diff_unavailable'});
  const generated=new Set(['src/app.bundle.js','src/exam-catalog.bundle.js']);
  const sourceChanged=files.some(file=>file.startsWith('src/')&&!generated.has(file)||file.startsWith('styles/')||file.startsWith('icons/'));
  for(const file of files){
    if(file.startsWith('/')||/^[A-Za-z]:/.test(file)||file.split('/').includes('..')){full=true;reasons.push({code:'invalid_path',file});continue;}
    if(file.endsWith('.md'))continue;
    if(generated.has(file)&&sourceChanged){reasons.push({code:'derived_artifact',file});continue;}
    if(sourceChanged&&derivedFiles.includes(file)&&['index.html','service-worker.js'].includes(file)){reasons.push({code:'verified_revision_only',file});continue;}
    if(globalImpactSources.some(pattern=>matchPath(file,pattern))){full=true;reasons.push({code:'global_contract',file});continue;}
    if(file.startsWith('tests/unit/')&&inventory.some(row=>row.file===file)){units.add(file);continue;}
    if(file.startsWith('tests/e2e/')&&inventory.some(row=>row.file===file)){browserFiles.add(file);continue;}
    const matched=impactAreas.filter(area=>area.sources.some(pattern=>matchPath(file,pattern)));
    if(!matched.length){full=true;reasons.push({code:'unknown_file',file});continue;}
    for(const area of matched)areas.add(area.id);
    for(const row of inventory.filter(row=>row.layer==='node'))if((dependencies[row.file]||[]).includes(file))units.add(row.file);
  }
  for(const area of impactAreas.filter(area=>areas.has(area.id))){
    for(const file of allUnits)if(area.units.some(pattern=>matchPath(posix.basename(file),pattern)))units.add(file);
    for(const name of area.journeys){
      const entry=tierManifest.files.find(row=>row.file===`tests/e2e/${name}`);
      const promotions=entry?.promotions?.filter(row=>row.tier==='REGRESSION'||row.tier==='FAST_GATE')||[];
      if(!promotions.length){full=true;reasons.push({code:'missing_journey_mapping',file:name});}
      for(const row of promotions)browserCases.push({file:entry.file,title:row.title});
    }
  }
  if(areas.size&&!units.size&&!browserCases.length&&!browserFiles.size){full=true;reasons.push({code:'empty_area_selection'});}
  return {schemaVersion:1,mapVersion:impactMapVersion,changedFiles:files,areas:[...areas].sort(),
    requiredGate:full?'full':files.length&&files.every(file=>file.endsWith('.md'))?'docs':'affected',reasons,
    unitFiles:full?allUnits:[...units].sort(),browserFiles:full?inventory.filter(row=>row.layer==='browser').map(row=>row.file).sort():[...browserFiles].sort(),
    browserCases:full?[]:[...new Map(browserCases.map(row=>[row.file+'|'+row.title,row])).values()].sort((a,b)=>(a.file+a.title).localeCompare(b.file+b.title))};
}
