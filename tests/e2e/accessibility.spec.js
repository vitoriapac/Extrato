import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,openDemo} from './helpers.js';

async function expectAccessible(page,label){
  await page.waitForTimeout(400);
  const results=await new AxeBuilder({page}).analyze();
  expect(results.violations, label+' possui violações sérias ou críticas').toEqual([]);
}

test('não possui violações estruturais nas áreas críticas',async({page})=>{
  await openDemo(page);
  for(const [tab,label] of [['dashboard','Visão Geral'],['disciplinas','Disciplinas'],['metas','Planejamento'],['agenda','Agenda'],['calendario','Calendário'],['questoes','Questões e simulados']]){
    await activateTab(page,tab);
    await expectAccessible(page,label);
  }
});

test('mantém estrutura acessível no modo móvel e no modal',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await openDemo(page);
  await expectAccessible(page,'Modo móvel');
  await page.getByRole('button',{name:/Reiniciar demo/i}).click();
  await expect(page.locator('#modalOverlay')).toHaveClass(/show/);
  await expectAccessible(page,'Modal');
  await expect(page.locator('#modalCancelBtn')).toBeFocused();
});
