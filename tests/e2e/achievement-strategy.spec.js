import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('conquistas mostram estratégia e próximos passos em tela pequena',async({page})=>{
  await page.setViewportSize({width:320,height:800});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await activateTab(page,'dashboard');
  const upcoming=page.locator('#badgesGrid .achievement-upcoming');
  await upcoming.locator('summary').click();
  await expect(upcoming.locator('.achievement-category')).toContainText(['Consistência','Aprendizado','Estratégia']);
  await expect(upcoming.locator('.badge-card').filter({hasText:'Estrategista'})).toContainText('tópicos diferentes de alto impacto');
  await expect(upcoming.locator('.badge-card').filter({hasText:'Prova mapeada'})).toContainText('provas completas');
  await expectNoPageOverflow(page);
  const accessibility=await new AxeBuilder({page}).include('#badgesGrid').analyze();
  expect(accessibility.violations).toEqual([]);
});
