import {expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from '../helpers.js';

export async function assertCriticalResponsive(page,{width,theme}){
  await page.setViewportSize({width,height:900});await openDemo(page);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await activateTab(page,'dashboard');await expectNoPageOverflow(page);
  await expect(page.locator('#weeklyCloseDashboard')).toBeVisible();
  await activateTab(page,'hoje');
  const analyses=page.locator('.today-analysis-details');
  if(await analyses.count()&&!await analyses.first().evaluate(element=>element.open))await analyses.first().locator(':scope > summary').click();
  await expectNoPageOverflow(page);
  await expect(page.locator('#diagnosisCenter')).toBeVisible();
  await activateTab(page,'metas');await expectNoPageOverflow(page);
  await expect(page.locator('#examBlueprintConfig')).toBeVisible();
  await activateTab(page,'disciplinas');await expectNoPageOverflow(page);
  await activateTab(page,'agenda');await expectNoPageOverflow(page);
  await activateTab(page,'calendario');await expectNoPageOverflow(page);
  await activateTab(page,'questoes');await expectNoPageOverflow(page);
  await page.keyboard.press('Control+k');
  await page.locator('#globalSearchInput').fill('recomendação prioritária');
  await expect(page.locator('#globalSearchInput')).toBeFocused();await expectNoPageOverflow(page);
  await page.keyboard.press('Escape');
}
