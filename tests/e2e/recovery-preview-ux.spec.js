import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';

for(const [width,theme] of [[320,'light'],[375,'dark'],[430,'light']])test(`prévia e cancelamento do Recovery: ${width}px ${theme}`,async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.setViewportSize({width,height:900});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__;api.setState(state);api.renderAll()},generateDemoData({today:'2026-10-01'}));
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  await activateTab(page,'desempenho');
  const before=await page.evaluate(async()=>{const api=window.__EXTRATO_TEST__;await api.settleSaves();return JSON.stringify(api.getState());});
  const open=page.locator('[data-recovery-preview-open]');await open.click();
  const preview=page.getByRole('dialog',{name:'Plano de recuperação',exact:true});await expect(preview).toBeVisible();
  await expect(preview.locator(':scope > .recovery-allocations > li')).toHaveCount(2);
  await expect(preview).toContainText('Sem alteração');await expectNoPageOverflow(page);
  const dimensions=await preview.evaluate(node=>({scroll:node.scrollWidth,width:node.clientWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
  expect((await new AxeBuilder({page}).include('#recoveryPreviewDialog').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  if(process.platform==='win32')await expect(preview).toHaveScreenshot(`recovery-preview-${width}-${theme}-win32.png`,{animations:'disabled',maxDiffPixelRatio:.03});
  await preview.getByRole('button',{name:'Aplicar ao planejamento'}).click();
  const confirmation=page.getByRole('dialog',{name:'Aplicar plano de recuperação?',exact:true});await expect(confirmation).toBeVisible();
  await expect(confirmation.locator('.recovery-allocations > li')).toHaveCount(2);
  await page.keyboard.press('Escape');await expect(confirmation).not.toBeVisible();await expect(preview).toBeVisible();
  await expect(preview.getByRole('button',{name:'Aplicar ao planejamento'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(preview).not.toBeVisible();await expect(open).toBeFocused();
  expect(await page.evaluate(()=>JSON.stringify(window.__EXTRATO_TEST__.getState()))).toBe(before);
});
