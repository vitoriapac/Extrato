import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';

const sections=['overview','subjects','questions','simulations','exam','consistency'];
const screenshotOptions={animations:'disabled',caret:'hide',maxDiffPixelRatio:.08};
const screenshotName=(name)=>name.replace(/\.png$/,`-${process.platform}.png`);

for(const {name,width,theme,columns} of [
  {name:'desktop-light',width:1440,theme:'light',columns:3},
  {name:'desktop-dark',width:1440,theme:'dark',columns:3},
  {name:'mobile-light',width:375,theme:'light',columns:1},
  {name:'mobile-dark',width:375,theme:'dark',columns:1}
])test(`refinamento visual em Demo densa: ${name}`,async({page})=>{
  await page.clock.install({time:new Date('2026-09-30T12:00:00-03:00')});
  await page.setViewportSize({width,height:900});
  await openDemo(page);
  await page.evaluate(()=>document.fonts.ready);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  await activateTab(page,'desempenho');
  for(const section of sections){
    await page.locator(`[data-performance-section="${section}"]`).click();
    await expect(page.locator(`[data-performance-section="${section}"]`)).toHaveAttribute('aria-pressed','true');
    await expectNoPageOverflow(page);
    if(section==='exam')await expect(page.locator('#performanceSectionContent .exam-intelligence-hub')).toBeVisible();
    else await expect(page.locator('#performanceSectionContent .performance-summary')).toBeVisible();
    if(section==='overview'&&process.platform==='win32')await expect(page.locator('#performanceSectionContent .performance-summary')).toHaveScreenshot(screenshotName(`desempenho-resumo-${name}.png`),screenshotOptions);
  }
  await activateTab(page,'metas');
  await expect(page.locator('#metasContainer .meta-card')).toHaveCount(6);
  await expect(page.locator('#metasContainer .meta-card').last()).toContainText('Meta de Consistência');
  const actualColumns=await page.locator('#metasContainer').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(actualColumns).toBe(columns);
  await expectNoPageOverflow(page);
  if(process.platform==='win32')await expect(page.locator('#metasContainer')).toHaveScreenshot(screenshotName(`metas-${name}.png`),screenshotOptions);
});

test('Metas usa duas colunas em tablet',async({page})=>{
  await page.setViewportSize({width:768,height:900});
  await openDemo(page);
  await activateTab(page,'metas');
  const columns=await page.locator('#metasContainer').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(2);
  await expectNoPageOverflow(page);
});

test('Desempenho mantém orientação dentro dos cards quando não há dados',async({page})=>{
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.studySessions=[];state.questoes=[];state.simulados=[];state.dailyPlans=[];api.setState(state);api.renderAll()});
  await activateTab(page,'desempenho');
  for(const section of ['questions','simulations']){
    await page.locator(`[data-performance-section="${section}"]`).click();
    await expect(page.locator('#performanceSectionContent > .empty-state')).toBeVisible();
    await expect(page.locator('#performanceSectionContent > .empty-state')).not.toHaveText('Sem dados.');
  }
  await page.locator('[data-performance-section="consistency"]').click();
  await expect(page.locator('#performanceSectionContent')).toContainText('0 dia(s) com estudo');
});
