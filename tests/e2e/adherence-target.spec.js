import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('meta opcional persiste sem alterar históricos, aceita legado e contextualiza a trajetória',async({page})=>{
  await page.clock.install({time:new Date('2026-10-03T12:00:00-03:00')});
  await page.setViewportSize({width:320,height:900});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  await activateTab(page,'desempenho');
  await expect(page.locator('.achievement-projection .adherence-target')).toContainText('80%');
  const before=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return {closes:state.weeklyCloseSnapshots,projections:state.projectionSnapshots,plans:state.dailyPlans}});
  await activateTab(page,'metas');const target=page.getByRole('spinbutton',{name:'Meta semanal de aderência'});
  await target.fill('70');await target.blur();await expect(target).toHaveValue('70');
  await page.getByRole('button',{name:'Desativar meta de aderência'}).click();
  await expect(page.getByRole('button',{name:'Ativar meta de aderência'})).toBeVisible();
  await activateTab(page,'desempenho');await expect(page.locator('.achievement-projection .adherence-target')).toHaveCount(0);
  const after=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return {closes:state.weeklyCloseSnapshots,projections:state.projectionSnapshots,plans:state.dailyPlans}});
  expect(after).toEqual(before);await expectNoPageOverflow(page);
  const validation=await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,legacy=structuredClone(api.getState());delete legacy.metas.aderenciaSemanal;
    const restored=api.validateBackupData(legacy);legacy.metas.aderenciaSemanal=101;
    return {valid:restored.valid,target:restored.normalized?.metas.aderenciaSemanal,invalid:api.validateBackupData(legacy).valid};
  });expect(validation).toEqual({valid:true,target:80,invalid:false});
  await page.clock.runFor(1000);await page.evaluate(()=>window.__EXTRATO_TEST__.settleSaves());
  // Test mode intentionally bypasses storage bootstrap; reload through the real entry point.
  await page.goto('/#metas');await expect(page.getByRole('button',{name:'Ativar meta de aderência'})).toBeVisible();
});
