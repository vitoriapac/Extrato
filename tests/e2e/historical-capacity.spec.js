import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';
test('availability changes capture prospective capacity and legacy backups keep historical gaps',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  await activateTab(page,'metas');const input=page.getByRole('spinbutton',{name:'Disponibilidade em horas de Seg'});
  await input.fill('1');await input.blur();
  const result=await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=JSON.parse(JSON.stringify(api.getState()));
    const valid=api.validateBackupData(state),history=state.planningCapacityHistory;
    delete state.planningCapacityHistory;const legacy=api.validateBackupData(state);
    state.planningCapacityHistory=[{...history[0],totalMinutes:1}];
    return {valid:valid.valid,history,restored:valid.normalized?.planningCapacityHistory,legacy:legacy.normalized?.planningCapacityHistory,invalid:api.validateBackupData(state).valid};
  });
  expect(result.valid).toBe(true);expect(result.history).toHaveLength(2);expect(result.history[1].hoursByDay['1']).toBe(1);
  expect(result.history.every(record=>record.effectiveDate==='2026-10-01')).toBe(true);
  expect(result.restored).toEqual(result.history);expect(result.legacy).toEqual([]);expect(result.invalid).toBe(false);
});
