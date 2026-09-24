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
    await page.locator('#examBlueprintConfig .exam-subject-config').first().locator('summary').click();
    expect(await config.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    const control=config.locator('input,select').first();
    expect(await control.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  }
  const matrix=page.locator('#examMasteryMatrix .mastery-matrix');
  if(await matrix.count())expect(await matrix.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});

test('configuração por disciplina começa recolhida e mantém herança nula',async({page})=>{
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();
  await page.evaluate(()=>{document.getElementById('testReport')?.remove();const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0];state.examBlueprint.masteryTarget=80;state.examBlueprint.subjects=[{subjectId:subject.id,priority:'normal',masteryTarget:null}];api.setState(state);api.renderAll()});
  await activateTab(page,'metas');
  const disclosure=page.locator('#examBlueprintConfig .exam-subject-config').first();
  await expect(disclosure).not.toHaveAttribute('open','');
  await expect(disclosure.locator('summary')).toContainText('Herdar 80% (geral)');
  await disclosure.locator('summary').click();
  await expect(disclosure.locator('input[placeholder="Herdar 80% (geral)"]')).toBeVisible();
  const target=page.locator('#examBlueprintConfig .exam-blueprint-main label').nth(2).locator('input');
  await target.fill('85');await target.press('Tab');
  await expect(page.locator('#examBlueprintConfig .exam-subject-config').first().locator('summary')).toContainText('Herdar 85% (geral)');
  expect(await page.evaluate(()=>window.__EXTRATO_TEST__.getState().examBlueprint.subjects[0].masteryTarget)).toBeNull();
});

test('Visão Geral mostra a fase compacta atual da preparação',async({page})=>{
  await openDemo(page);
  await expect(page.locator('#overviewExamPhase')).toContainText('Fase atual');
  await expect(page.locator('#overviewExamPhase')).toContainText(/Construção|Consolidação|Reta final|Revisão final/);
});
