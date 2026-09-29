import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {buildStrategicCycleFixture} from '../fixtures/strategic-cycle.js';
test('faixas emitidas sobrevivem ao backup e qualidade abre por teclado',async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.clock.install({time:new Date('2026-09-28T12:00:00-03:00')});
 await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
 const base=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
 await page.evaluate(value=>{const api=window.__EXTRATO_TEST__,result=api.validateBackupData(value);if(!result.valid)throw Error(result.message);api.setState(result.normalized);api.renderAll()},buildStrategicCycleFixture(base));
 await activateTab(page,'dashboard');
 const initial=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState().projectionSnapshots));expect(initial.length).toBeGreaterThan(0);
 const quality=page.locator('#approvalDashboard .evidence-quality').first();await quality.locator('summary').focus();await page.keyboard.press('Enter');await expect(quality).toHaveAttribute('open','');
 await page.clock.setSystemTime(new Date('2026-09-30T12:00:00-03:00'));
 await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),old=state.simulados.filter(item=>item.examTags?.includes('bb-escriturario')).at(-1);state.simulados.push({...structuredClone(old),id:'calibration-new',date:'2026-09-30',breakdown:old.breakdown.map(row=>({...row,id:row.id+'-calibration'}))});api.setState(state);api.renderAll()});
 await expect(page.locator('#approvalDashboard .projection-calibration-list')).toContainText('2026-09-30');
 const result=await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=api.getState();return {snapshots:structuredClone(state.projectionSnapshots),validation:api.validateBackupData(JSON.parse(JSON.stringify(state)))}});
 expect(result.snapshots[0]).toEqual(initial[0]);expect(result.validation.valid,result.validation.message).toBe(true);expect(result.validation.normalized.projectionSnapshots).toEqual(result.snapshots);
 const calibration=page.locator('#approvalDashboard .projection-calibration-list > details').first();
 await calibration.locator(':scope > summary').click();await expect(calibration.locator('svg[role="img"]')).toBeVisible();
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:812});await expectNoPageOverflow(page);
  await page.locator('#themeToggleBtn').click();await expectNoPageOverflow(page);await page.locator('#themeToggleBtn').click();
 }
});
