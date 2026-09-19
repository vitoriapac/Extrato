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
  const overlay=page.locator('#guidedOnboardingOverlay');
  const clickButton=name=>overlay.getByRole('button',{name:new RegExp(name)}).first().evaluate(button=>button.click());
  await expect(onboarding).toBeVisible();
  await expect(onboarding).toContainText(/Comece seu plano|Configuração incompleta/);
  await page.locator('#guidedOnboarding [data-guided-action="open"]').evaluate(button=>button.click());
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText(/Por que isso importa\?/i);
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await clickButton('Continuar');
  await expect(overlay).toContainText('Quanto tempo cabe na sua semana?');
  await page.locator('[data-guided-day="1"]').fill('2');
  await clickButton('Continuar');
  await expect(overlay).toContainText('Quais conteúdos entram no plano?');
  await clickButton('Carregar edital');
  await page.locator('#examImportNextBtn').evaluate(button=>button.click());
  await page.locator('#examImportNextBtn').evaluate(button=>button.click());
  await page.locator('#examImportNextBtn').evaluate(button=>button.click());
  await expect(overlay).toContainText('Confira a capacidade e crie o primeiro plano');
  await clickButton('Voltar');
  await expect(overlay).toContainText('Nível inicial por disciplina');
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

test('modal fecha com Escape e devolve o foco ao card',async({page})=>{
  const open=page.locator('#guidedOnboarding [data-guided-action="open"]');
  await open.focus();
  await open.evaluate(button=>button.click());
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(open).toBeFocused();
});

for(const viewport of [{name:'celular',width:375,height:812},{name:'tablet',width:768,height:900},{name:'desktop',width:1440,height:900}])test(`modal permanece navegável em ${viewport.name}`,async({page})=>{
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await page.locator('#guidedOnboarding [data-guided-action="open"]').evaluate(button=>button.click());
  const overlay=page.locator('#guidedOnboardingOverlay'),modal=overlay.locator('.onboarding-modal');
  await expect(overlay).toBeVisible();
  const bounds=await modal.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height+1);
  await expect(page.locator('#guidedOnboardingClose')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(overlay.locator('[data-guided-action="cancel"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#guidedOnboardingClose')).toBeFocused();
});
