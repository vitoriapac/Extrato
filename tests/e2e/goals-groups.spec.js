import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('grouped goals preserve topic targets and separate hours, routine and accuracy',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  await activateTab(page,'metas');const groups=page.locator('#metasContainer');
  for(const name of ['Volume','Rotina','Resultado'])await expect(groups.getByRole('heading',{name,exact:true})).toBeVisible();
  const hours=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState().metas.horasPorDia));
  await groups.getByRole('spinbutton',{name:'Tópicos na semana',exact:true}).fill('8');await page.keyboard.press('Tab');
  await groups.getByRole('spinbutton',{name:'Tópicos no mês',exact:true}).fill('22');await page.keyboard.press('Tab');
  const metas=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState().metas));
  expect(metas.semanal).toBe(8);expect(metas.mensal).toBe(22);expect(metas.horasPorDia).toEqual(hours);
  await expect(groups.locator('.goal-group--routine')).toContainText('Meta de Aderência');
  await expect(groups.locator('.goal-group--outcome')).toContainText('Meta de acerto');
  expect((await new AxeBuilder({page}).include('#metasContainer').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  await expectNoPageOverflow(page);
  await activateTab(page,'desempenho');await page.locator('[data-performance-section="consistency"]').click();
  await expect(page.locator('.adherence-change')).toContainText('O que mudou?');
  await expect(page.locator('.adherence-change')).toContainText('Ainda não há dois períodos');
});
