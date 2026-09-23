import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

test('confirma, distribui e desfaz um plano sem perder a navegação',async({page})=>{
  await openDemo(page);
  await activateTab(page,'metas');

  await page.getByRole('button',{name:'Calcular proposta semanal'}).click();
  const confirmPlan=page.getByRole('button',{name:'Confirmar e salvar plano'});
  await expect(confirmPlan).toBeVisible();
  await confirmPlan.click();
  await expect(page.getByText('Plano confirmado',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'Distribuir nos próximos 7 dias'}).click();
  const confirmDaily=page.getByRole('button',{name:'Confirmar planos diários'});
  await expect(confirmDaily).toBeVisible();
  await confirmDaily.click();

  const undo=page.getByRole('button',{name:'Desfazer última distribuição'});
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(undo).toBeHidden();

  await activateTab(page,'hoje');
  await expect(page.locator('#panel-hoje')).toBeVisible();
});

test('prévia explica fase da prova e sugere adaptação sem salvar automaticamente',async({page})=>{
  await openDemo(page);
  await activateTab(page,'metas');
  await page.getByRole('button',{name:'Calcular proposta semanal'}).click();
  const preview=page.locator('#examStudyPlan');
  await expect(preview).toContainText('Fase até a prova');
  await expect(preview).toContainText(/Adaptação de carga|Redistribuição sugerida/);
  await expect(preview.getByRole('button',{name:'Confirmar e salvar plano'})).toBeVisible();
  await preview.getByRole('button',{name:'Descartar proposta'}).click();
  await expect(preview.getByRole('button',{name:'Calcular proposta semanal'})).toBeVisible();
});

test('fase e redistribuição do plano se organizam em tela móvel',async({page})=>{
  await page.setViewportSize({width:375,height:900});
  await openDemo(page);
  await activateTab(page,'metas');
  await page.getByRole('button',{name:'Calcular proposta semanal'}).click();
  const preview=page.locator('#examStudyPlan');
  await expect(preview.locator('.exam-phase-steps')).toBeVisible();
  await expect(preview.locator('.exam-phase-step')).toHaveCount(4);
  expect(await preview.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  const config=page.locator('#examBlueprintConfig .exam-subject-row').first();
  if(await config.count()){
    expect(await config.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    const control=config.locator('input,select').first();
    expect(await control.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  const matrix=page.locator('#examMasteryMatrix .mastery-matrix');
  if(await matrix.count())expect(await matrix.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});
