import {test,expect} from '@playwright/test';
import {activateTab,openDemo,expectNoPageOverflow} from './helpers.js';

test('Demo mostra mapa de estabilidade e fases gravadas sem perder o concurso',async({page})=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:375,height:812});
  await openDemo(page);
  await activateTab(page,'desempenho');
  await page.locator('[data-performance-section="subjects"]').evaluate(button=>button.click());
  const map=page.locator('.stability-map');
  await expect(map).toBeVisible();
  await expect(map.locator('.stability-map-cell')).toHaveCount(4);
  const first=map.locator('[data-stability-subject]').first();
  if(await first.count()){
    const subjectId=await first.getAttribute('data-stability-subject');
    await first.click();
    await expect(page.locator('[data-performance-subject]')).toHaveValue(subjectId);
  }
  await expectNoPageOverflow(page);
  await activateTab(page,'dashboard');
  await expect(page.locator('#strategicTimelineDashboard .phase-comparison')).toBeVisible();
  await expect(page.locator('#strategicTimelineDashboard .phase-comparison table')).toContainText('Prontidão');
  await expectNoPageOverflow(page);
});
