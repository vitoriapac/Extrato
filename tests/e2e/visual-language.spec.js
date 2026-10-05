import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {renderExamDataQuality} from '../../src/ui/renderers/exam-data-quality-renderer.js';
import {renderStrategicFocusHistory} from '../../src/ui/renderers/studytrack32-renderer.js';

const history={rows:[
  {start:'2026-09-01',end:'2026-09-07',focusPercent:52,highImpactMinutes:52,studiedMinutes:100},
  {start:'2026-09-08',end:'2026-09-14',focusPercent:68,highImpactMinutes:68,studiedMinutes:100},
  {start:'2026-09-15',end:'2026-09-21',current:true,focusPercent:74,highImpactMinutes:74,studiedMinutes:100}
],comparison:{focusDelta:6,executionDelta:0},totals:{workedGaps:3,measured:2,improved:1,stable:1,declined:0}};

for(const {width,theme} of [{width:375,theme:'light'},{width:375,theme:'dark'},{width:1440,theme:'light'},{width:1440,theme:'dark'}]){
  test(`linguagem visual em ${width}px e tema ${theme}`,async({page})=>{
    await page.setViewportSize({width,height:812});
    await page.goto('/?test=1');
    await page.locator('#testReport').evaluate(element=>element.remove());
    await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
    await activateTab(page,'instrucoes');
    await expect(page.locator('#helpCenter .module-heading')).toBeVisible();
    await page.locator('[data-help-category="guide-areas"]').click();
    const tips=page.locator('#guide-areas .context-note--tip');
    expect(await tips.count()).toBeGreaterThan(0);
    for(const tip of await tips.all())await expect(tip).toBeVisible();
    await expectNoPageOverflow(page);
    await activateTab(page,'desempenho');
    await page.locator('[data-performance-section="exam"]').click();
    await expect(page.locator('.exam-intelligence-hub > .module-heading')).toBeVisible();
    await page.locator('#examDataQuality').evaluate((element,html)=>{element.innerHTML=html},renderExamDataQuality({coveragePercent:50,confidence:'low',examCount:2,completeExamCount:1,questionCount:20,unresolvedQuestions:2,mappedTopics:5,lowConfidenceQuestions:1,unreviewedQuestions:1,warnings:['Revise a cobertura antes de usar a incidência.']}));
    await expect(page.locator('#examDataQuality .context-note--attention')).toContainText('Atenção');
    await expectNoPageOverflow(page);
    await activateTab(page,'metas');
    await expect(page.locator('#panel-metas .context-note--info')).toBeVisible();
    await expectNoPageOverflow(page);
    await activateTab(page,'dashboard');
    await page.locator('#weeklyCloseDashboard').evaluate((element,html)=>{element.innerHTML=html},renderStrategicFocusHistory(history));
    const trend=page.locator('#weeklyCloseDashboard .weekly-focus-trend');
    await expect(trend.locator('.weekly-focus-trend-point')).toHaveCount(3);
    await expect(trend).toHaveAttribute('aria-hidden','true');
    await expectNoPageOverflow(page);
    const accessibility=await new AxeBuilder({page}).include('#weeklyCloseDashboard').analyze();
    expect(accessibility.violations).toEqual([]);
  });
}
