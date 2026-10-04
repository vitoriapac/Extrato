import {defineConfig} from '@playwright/test';
import base from './playwright.config.js';
import {testTierManifest,TEST_TIERS} from './tests/config/test-tiers.js';

const gate=process.env.STUDYTRACK_TEST_GATE;
const visualFiles=['visual-regression','ux-baseline','refinement-visual','achievement-projection','recovery-preview-ux','onboarding','planning-sustainability'].map(name=>`**/${name}.spec.js`);
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let selection={};
if(gate==='visual'){
  if(process.platform!=='win32')throw Error('O gate visual oficial requer Windows/Chromium; execute Full para validação estrutural nesta plataforma.');
  selection={testMatch:visualFiles};
}else{
  const tier={fast:'FAST_GATE',regression:'REGRESSION',full:'FULL'}[gate];
  if(!tier)throw Error(`Gate inválido: ${gate}`);
  if(tier!=='FULL'){
    const rank=TEST_TIERS.indexOf(tier),entries=testTierManifest.files.filter(row=>row.file.includes('/e2e/'));
    const promoted=entries.flatMap(row=>(row.promotions||[]).filter(item=>TEST_TIERS.indexOf(item.tier)<=rank).map(item=>({file:row.file,title:item.title})));
    if(!promoted.length)throw Error('Seleção browser vazia');
    // Current browser file defaults are FULL. A promoted title is matched exactly,
    // and discovery checks below guard against collisions in the selected files.
    selection={testMatch:[...new Set(promoted.map(row=>'**/'+row.file.split('/').at(-1)))],grep:new RegExp(`(?:^|\\s)(?:${promoted.map(row=>escape(row.title)).join('|')})$`)};
  }
}
export default defineConfig({...base,...selection});
