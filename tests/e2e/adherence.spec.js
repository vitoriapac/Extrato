import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {activateTab,expectNoPageOverflow} from './helpers.js';

async function prepare(page){
  await page.clock.install({time:new Date('2026-10-03T12:00:00-03:00')});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  const state=generateDemoData({today:'2026-10-03'});
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__,result=api.validateBackupData(state);if(!result.valid)throw Error(result.message);api.setState(result.normalized);api.renderAll()},state);
  await activateTab(page,'desempenho');await page.locator('[data-performance-section="consistency"]').click();
}
for(const [width,theme] of [[320,'light'],[375,'dark'],[430,'light'],[1440,'light'],[1440,'dark']])test(`aderência em Desempenho: ${width}px ${theme}`,async({page},testInfo)=>{
  test.setTimeout(120_000);await page.setViewportSize({width,height:900});await prepare(page);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  const content=page.locator('#performanceSectionContent');await expect(content).toContainText('Execução prioritária');
  const chrome=await page.evaluateHandle(()=>[...document.querySelectorAll('.sticky-shell,#backToTopBtn')].map(node=>{
    const position={node,parent:node.parentNode,next:node.nextSibling};node.remove();return position;
  }));
  try{
    await content.locator('.adherence-summary').screenshot({path:testInfo.outputPath('adherence-review.png')});
    if(process.platform==='win32')await expect(content.locator('.adherence-summary')).toHaveScreenshot(`adherence-${width}-${theme}-win32.png`,{animations:'disabled',caret:'hide',maxDiffPixelRatio:.08});
  }finally{await chrome.evaluate(positions=>positions.forEach(({node,parent,next})=>parent.insertBefore(node,next)));await chrome.dispose();}
  await expectNoPageOverflow(page);
  const before=await page.evaluate(()=>{const s=window.__EXTRATO_TEST__.getState();return {dailyPlans:s.dailyPlans,studySessions:s.studySessions,weeklyCloseSnapshots:s.weeklyCloseSnapshots}});
  await content.locator('[data-adherence-weeks]').selectOption('12');await expect(content.locator('[data-adherence-weeks]')).toBeFocused();
  await expect(content.locator('[data-adherence-weeks]')).toHaveValue('12');
  await content.getByText('Execução por semana',{exact:true}).click();
  const list=content.locator('.adherence-week-list');await expect(list.locator('> li:visible')).toHaveCount(5);
  const more=list.locator('xpath=following-sibling::button[1]');await more.focus();await page.keyboard.press('Enter');
  await expect(more).toHaveAttribute('aria-expanded','true');await expect(list.locator('> li:visible')).toHaveCount(await list.locator('> li').count());
  await more.click();await expect(list.locator('> li:visible')).toHaveCount(5);
  await expectNoPageOverflow(page);
  expect((await new AxeBuilder({page}).include('#performanceSectionContent').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  const after=await page.evaluate(()=>{const s=window.__EXTRATO_TEST__.getState();return {dailyPlans:s.dailyPlans,studySessions:s.studySessions,weeklyCloseSnapshots:s.weeklyCloseSnapshots}});
  expect(after).toEqual(before);
});
