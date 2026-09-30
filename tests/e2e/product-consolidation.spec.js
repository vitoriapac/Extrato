import {test,expect} from '@playwright/test';
import {activateTab,openDemo,expectNoPageOverflow} from './helpers.js';

test('Demo apresenta próxima ação, evidências progressivas e explicação da Prontidão',async({page})=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:375,height:812});
  await openDemo(page);
  await activateTab(page,'hoje');
  await page.locator('.today-analysis-details > summary').click();
  const action=page.locator('#diagnosisCenter .next-best-action');
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute('data-action-state',/ACTION_REQUIRED|ACTION_OPTIONAL|MAINTAIN_PLAN|INSUFFICIENT_EVIDENCE|NO_ELIGIBLE_ACTION/);
  const first=page.locator('#diagnosisCenter .consolidated-diagnosis-row').first();
  await expect(first.locator('.diagnostic-quality')).toBeVisible();
  await expect(first.locator('.diagnostic-detail')).not.toHaveAttribute('open','');
  await first.locator('.diagnostic-detail > summary').click();
  await expect(first.locator('.diagnostic-detail__body')).toBeVisible();
  await first.locator('.diagnostic-detail__method > summary').click();
  await expect(first.locator('.diagnostic-detail__method')).toContainText('confianças');
  await expectNoPageOverflow(page);

  await activateTab(page,'desempenho');
  const explanation=page.locator('.readiness-change-explanation');
  await expect(explanation).toBeVisible();
  await explanation.locator('summary').click();
  await expect(explanation).toContainText(/Prontidão|comparação/);
  for(const section of ['questions','simulations','subjects','consistency']){
    await page.locator(`[data-performance-section="${section}"]`).evaluate(button=>button.click());
    await expect(page.locator('#performanceSectionContent')).not.toBeEmpty();
    await expectNoPageOverflow(page);
  }
});
