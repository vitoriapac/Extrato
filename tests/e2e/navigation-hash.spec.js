import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';

test('Planejamento usa #planejamento na URL e aceita o antigo #metas',async({page})=>{
  await page.goto('/#planejamento');
  await expect(page.locator('#panel-metas')).toBeVisible();
  await page.goto('/#metas');
  await expect(page.locator('#panel-metas')).toBeVisible();
  await activateTab(page,'dashboard');
  await activateTab(page,'metas');
  await expect(page).toHaveURL(/#planejamento$/);
});
