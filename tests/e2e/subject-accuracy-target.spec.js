import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {buildStrategicCycleFixture} from '../fixtures/strategic-cycle.js';
test('meta de acerto pode ser salva, restaurada e voltar a herdar sem alterar domínio ou pesos',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.clock.install({time:new Date('2026-09-28T12:00:00-03:00')});
 await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
 const base=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
 await page.evaluate(value=>{const api=window.__EXTRATO_TEST__,v=api.validateBackupData(value);if(!v.valid)throw Error(v.message);api.setState(v.normalized);api.renderAll()},buildStrategicCycleFixture(base));
 const before=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));await activateTab(page,'metas');
 const config=page.locator('#examBlueprintConfig details[data-subject-id="cycle-s0"]');await config.locator(':scope > summary').click();await config.locator('[name="accuracyTarget"]').fill('75');await config.getByRole('button',{name:'Salvar',exact:true}).click();
 const saved=await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());return {state,backup:api.validateBackupData(state)}});
 expect(saved.backup.valid,saved.backup.message).toBe(true);const subject=saved.state.examBlueprint.subjects.find(item=>item.subjectId==='cycle-s0'),old=before.examBlueprint.subjects.find(item=>item.subjectId==='cycle-s0');
 expect(subject.accuracyTarget).toBe(75);expect(subject.masteryTarget).toEqual(old.masteryTarget);expect(subject.questionWeight).toEqual(old.questionWeight);expect(saved.state.studySessions).toEqual(before.studySessions);
 await page.evaluate(value=>{window.__EXTRATO_TEST__.setState(value);window.__EXTRATO_TEST__.renderAll()},saved.backup.normalized);
 await activateTab(page,'metas');await expect(page.locator('#subjectTargetEditor [data-accuracy-value="cycle-s0"]')).toHaveValue('75');await expectNoPageOverflow(page);
 await page.locator('#subjectTargetEditor [data-accuracy-restore="cycle-s0"]').click();
 expect(await page.evaluate(()=>window.__EXTRATO_TEST__.getState().examBlueprint.subjects.find(item=>item.subjectId==='cycle-s0').accuracyTarget)).toBeNull();
});
