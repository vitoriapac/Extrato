import {test,expect} from '@playwright/test';
import {renderWeeklyStrategicFocus} from '../../src/ui/renderers/studytrack32-renderer.js';
import {activateTab} from './helpers.js';

const cases=[
  {name:'desktop',width:1440,height:900,theme:'light',model:{state:'available',highImpactPercent:74,highImpactMinutes:560,totalMinutes:755,workedGaps:4,improved:2,stable:1,declined:0,unmeasured:1,unknownMinutes:20}},
  {name:'mobile',width:375,height:812,theme:'light',model:{state:'available',highImpactPercent:74,highImpactMinutes:560,totalMinutes:755,workedGaps:4,improved:2,stable:1,declined:0,unmeasured:1,unknownMinutes:20}},
  {name:'dark',width:375,height:812,theme:'dark',model:{state:'available',highImpactPercent:58,highImpactMinutes:175,totalMinutes:300,workedGaps:1,improved:0,stable:0,declined:1,unmeasured:0,unknownMinutes:0}},
  {name:'light',width:390,height:812,theme:'light',model:{state:'available',highImpactPercent:0,highImpactMinutes:0,totalMinutes:120,workedGaps:0,improved:0,stable:0,declined:0,unmeasured:0,unknownMinutes:0}},
  {name:'insufficient',width:375,height:812,theme:'light',model:{state:'insufficient'}}
];

for(const scenario of cases){
  test(`foco semanal ${scenario.name}`,async({page})=>{
    await page.setViewportSize({width:scenario.width,height:scenario.height});
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(element=>element.remove());
    await activateTab(page,'dashboard');
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme},scenario.theme);
    await page.locator('#weeklyCloseDashboard').evaluate((element,html)=>{element.innerHTML=html},renderWeeklyStrategicFocus(scenario.model));
    await page.evaluate(()=>document.fonts.ready);
    const focus=page.locator('#weeklyCloseDashboard .weekly-strategic-focus');
    await expect(focus).toBeVisible();
    if(scenario.model.state==='available'){
      await expect(focus.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow',String(scenario.model.highImpactPercent));
      await expect(focus).toContainText('sem meta mínima');
    }
    await expect(focus).toHaveScreenshot(`weekly-focus-${scenario.name}.png`,{animations:'disabled',caret:'hide',maxDiffPixelRatio:.08});
  });
}
