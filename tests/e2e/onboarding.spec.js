import {test,expect} from '@playwright/test';
import {waitForAppReady} from './helpers/app-state.js';
import {activateTab} from './helpers.js';

test.beforeEach(async({page})=>{
  await page.goto('/?test=1');
  await waitForAppReady(page);
  await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.examDate='';state.examBlueprint.examDate=null;state.studySessions=[];state.questoes=[];state.dailyPlans=[];state.studyPlans=[];api.setState(state);api.renderAll()});
  await activateTab(page,'dashboard');
});

test('primeiro uso preserva escolhas e chega à prévia do plano',async({page})=>{
  const onboarding=page.locator('#guidedOnboarding');
  const clickButton=name=>page.getByRole('button',{name,exact:true}).evaluate(button=>button.click());
  await expect(onboarding).toBeVisible();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await clickButton('Continuar');
  await expect(onboarding).toContainText('Quanto tempo cabe na sua semana?');
  await page.locator('[data-guided-day="1"]').fill('2');
  await clickButton('Continuar');
  await expect(onboarding).toContainText('Quais conteúdos entram no plano?');
  await clickButton('Carregar edital');
  await page.locator('#examImportNextBtn').evaluate(button=>button.click());
  await page.locator('#examImportNextBtn').evaluate(button=>button.click());
  await page.locator('#examImportNextBtn').evaluate(button=>button.click());
  await expect(onboarding).toContainText('Confira a capacidade e crie o primeiro plano');
  await clickButton('Voltar');
  await expect(onboarding).toContainText('Nível inicial por disciplina');
  await clickButton('Voltar');
  await expect(page.locator('[data-guided-day="1"]')).toHaveValue('2');
  await clickButton('Voltar');
  await expect(page.locator('#guidedExamDate')).toHaveValue('2027-03-14');
  await clickButton('Continuar');
  await clickButton('Continuar');
  await clickButton('Ver prévia');
  await clickButton('Confirmar e criar meu plano');
  await expect(page.locator('#panel-hoje')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__.getState().studyPlans.length)).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__.getState().dailyPlans.reduce((sum,plan)=>sum+(plan.items||[]).length,0))).toBeGreaterThan(0);
});
