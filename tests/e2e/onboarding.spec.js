import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {waitForAppReady} from './helpers/app-state.js';
import {activateTab} from './helpers.js';

test.beforeEach(async({page})=>{
  await page.goto('/?test=1');
  await waitForAppReady(page);
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.examDate='';state.examBlueprint.examDate=null;state.studySessions=[];state.questoes=[];state.dailyPlans=[];state.studyPlans=[];api.setState(state);api.renderAll()});
  await activateTab(page,'dashboard');
});

test('Visão Geral mostra KPIs, tópicos, configuração e ações nessa ordem',async({page})=>{
  const inOrder=await page.evaluate(()=>{
    const ids=['kpiGrid','quickStats','guidedOnboarding','overviewNextAction'];
    const nodes=ids.map(id=>document.getElementById(id));
    return nodes.every(Boolean)&&nodes.every((node,index)=>index===0||nodes[index-1].compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(inOrder).toBe(true);
  await expect(page.locator('#guidedOnboarding')).toBeVisible();
  await expect(page.locator('#guidedOnboarding')).toContainText('CONFIGURAÇÃO INICIAL');
  await expect(page.locator('#guidedOnboarding [role="progressbar"]')).toHaveAttribute('aria-valuemax','4');
});

test('primeiro uso preserva escolhas e chega à prévia do plano',async({page})=>{
  const onboarding=page.locator('#guidedOnboarding');
  const overlay=page.locator('#guidedOnboardingOverlay');
  const clickButton=name=>overlay.getByRole('button',{name:new RegExp(name)}).first().click();
  await expect(onboarding).toBeVisible();
  await expect(onboarding).toContainText(/Comece seu plano|Configuração incompleta/);
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText(/Por que isso importa\?/i);
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await clickButton('Continuar');
  await expect(overlay).toContainText('Quanto tempo cabe na sua semana?');
  await page.locator('[data-guided-day="1"]').fill('2');
  await clickButton('Continuar');
  await expect(overlay).toContainText('Quais conteúdos entram no plano?');
  await clickButton('Carregar edital');
  await expect(overlay).toBeHidden();
  await expect(page.locator('#examImportOverlay')).toBeVisible();
  await page.locator('#examImportNextBtn').click();
  await page.locator('#examImportNextBtn').click();
  await page.locator('#examImportNextBtn').click();
  await expect(page.locator('#examImportOverlay')).toBeHidden();
  await expect(overlay).toContainText('Confira a capacidade e crie o primeiro plano');
  await expect(overlay).toContainText('Primeiras atividades priorizadas');
  await expect(overlay).toContainText('mesma prioridade, elegibilidade e capacidade');
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
  await open.click();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(open).toBeFocused();
});

for(const viewport of [{name:'celular',width:375,height:812},{name:'tablet',width:768,height:900},{name:'desktop',width:1440,height:900}])test(`modal permanece navegável em ${viewport.name}`,async({page})=>{
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
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

for(const theme of ['light','dark'])for(const viewport of [{name:'mobile',width:375,height:812},{name:'desktop',width:1440,height:900}])test(`hierarquia visual cobre quatro etapas em ${theme} ${viewport.name}`,async({page})=>{
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await page.evaluate(selected=>{document.documentElement.dataset.theme=selected;const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.subjects=[{id:'visual-subject',name:'Matemática',archived:false,topics:[{id:'visual-topic',name:'Porcentagem',status:'Não iniciado',difficulty:'Médio',estimatedStudyMinutes:75,archived:false,prerequisites:[]}]}];api.setState(state);api.renderAll()},theme);
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  const overlay=page.locator('#guidedOnboardingOverlay'),next=()=>overlay.locator('[data-guided-action="next"]');
  const assertLayering=async(expectedCompleted)=>{
    const colors=await overlay.evaluate(element=>{const modal=element.querySelector('.onboarding-modal'),main=element.querySelector('.onboarding-modal-body>main'),help=element.querySelector('.onboarding-help');return{modal:getComputedStyle(modal).backgroundColor,main:getComputedStyle(main).backgroundColor,help:getComputedStyle(help).backgroundColor}});
    expect(colors.main).not.toBe(colors.help);expect(colors.modal).not.toBe(colors.help);
    await expect(overlay.locator('.guided-onboarding-steps .is-current')).toHaveCount(1);await expect(overlay.locator('.guided-onboarding-steps .is-complete')).toHaveCount(expectedCompleted);
    const bounds=await overlay.locator('.onboarding-modal').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+1);
    const accessibility=await new AxeBuilder({page}).include('#guidedOnboardingOverlay').withRules(['color-contrast']).analyze();expect(accessibility.violations).toEqual([]);
  };
  await assertLayering(0);
  const goalControl=page.locator('#guidedExamPreset');expect(await goalControl.evaluate(input=>parseFloat(getComputedStyle(input).borderTopWidth))).toBeGreaterThan(0);expect(await goalControl.evaluate(input=>input.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.locator('#guidedExamDate').fill('2027-03-14');await next().click();await assertLayering(1);
  await page.locator('[data-guided-day="1"]').fill('2');await next().click();await assertLayering(2);
  await next().click();await assertLayering(3);await expect(overlay).toContainText('Primeiras atividades priorizadas');
});

test('cancelar edital devolve foco e escolhas ao onboarding sem diálogos concorrentes',async({page})=>{
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('[data-guided-day="1"]').fill('2');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="import"]').click();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(page.locator('#examImportOverlay')).toBeVisible();
  await expect(page.locator('#examImportOverlay [name="examPreset"]').first()).toBeFocused();
  const accessibility=await new AxeBuilder({page}).include('#examImportOverlay').analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#examImportOverlay')).toBeHidden();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await expect(page.locator('#guidedOnboardingClose')).toBeFocused();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="back"]').click();
  await expect(page.locator('[data-guided-day="1"]')).toHaveValue('2');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="back"]').click();
  await expect(page.locator('#guidedExamDate')).toHaveValue('2027-03-14');
});

test('importação CSV retorna à prévia do onboarding sem sobrepor diálogos',async({page})=>{
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('[data-guided-day="1"]').fill('2');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  const fileChooser=page.waitForEvent('filechooser');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="structured"]').click();
  await (await fileChooser).setFiles({name:'edital.csv',mimeType:'text/csv',buffer:Buffer.from('disciplina,topico,esforco\nPortuguês,Interpretação,90')});
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(page.locator('#structuredImportOverlay')).toBeVisible();
  await expect(page.locator('#structuredImportCancelBtn')).toBeFocused();
  await page.locator('#structuredImportConfirmBtn').click();
  await expect(page.locator('#structuredImportOverlay')).toBeHidden();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await expect(page.locator('#guidedOnboardingOverlay')).toContainText('Confira a capacidade e crie o primeiro plano');
});

test('cadastro manual oferece retorno à configuração após criar conteúdo',async({page})=>{
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="manual"]').click();
  await expect(page.locator('#panel-disciplinas')).toBeVisible();
  await expect(page.locator('#guidedManualReturn')).toBeVisible();
  await expect(page.locator('[data-guided-manual-return]')).toBeEnabled();
  await page.locator('[data-guided-manual-return]').click();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await expect(page.locator('#guidedOnboardingOverlay')).toContainText('Quais conteúdos entram no plano?');
});
