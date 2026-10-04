import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
import {testTierManifest,TEST_TIERS} from './tests/config/test-tiers.js';
import {readImpactPlan} from './scripts/lib/browser-test-selection.js';

const gate=process.env.STUDYTRACK_TEST_GATE;
const impact=readImpactPlan(process.env.STUDYTRACK_IMPACT_PLAN);
const visualFiles=['visual-regression','ux-baseline','refinement-visual','achievement-projection','recovery-preview-ux','onboarding','planning-sustainability'].map(name=>`**/${name}.spec.js`);
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let selection={};
if(gate==='visual'){
  if(process.platform!=='win32')throw Error('O gate visual oficial requer Windows/Chromium; execute Full para validação estrutural nesta plataforma.');
  selection={testMatch:visualFiles};
}else{
  const tier={fast:'FAST_GATE',regression:'REGRESSION',full:'FULL'}[gate];
  if(!tier&&gate!=='affected')throw Error(`Gate inválido: ${gate}`);
  if(gate==='affected'&&!impact)throw Error('Affected requer plano de impacto');
  if(tier!=='FULL'&&impact?.requiredGate!=='full'){
    const rank=TEST_TIERS.indexOf(tier),entries=testTierManifest.files.filter(row=>row.file.includes('/e2e/'));
    const promoted=entries.flatMap(row=>(row.promotions||[]).filter(item=>TEST_TIERS.indexOf(item.tier)<=rank).map(item=>({file:row.file,title:item.title})));
    const exact=[...promoted,...(impact?.browserCases||[])],wholeFiles=impact?.browserFiles||[];
    if(!exact.length&&!wholeFiles.length)throw Error('Seleção browser vazia');
    // Current browser file defaults are FULL. A promoted title is matched exactly,
    // and discovery checks below guard against collisions in the selected files.
    const titlePattern=exact.length?`(?:^|\\s)(?:${exact.map(row=>escape(row.title)).join('|')})$`:null;
    const filePatterns=wholeFiles.map(file=>`${escape(file.split('/').at(-1))}(?:\\s|$)[\\s\\S]*`);
    selection={testMatch:[...new Set([...exact.map(row=>row.file),...wholeFiles].map(file=>'**/'+file.split('/').at(-1)))],grep:new RegExp([titlePattern,...filePatterns].filter(Boolean).join('|'))};
  }
}
export default defineConfig({...base,...selection});
