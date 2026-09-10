import {test,expect} from '@playwright/test';import {activateTab,openDemo} from './helpers.js';
test('destaca prontidão e ativa o cabeçalho compacto ao rolar',async({page})=>{await openDemo(page);await expect(page.locator('.balance-label')).toHaveText('Índice de prontidão');await expect(page.locator('#statContent')).toContainText('%');const hero=(await page.locator('#balanceFigure').innerText()).replace(/\s/g,'');await page.evaluate(()=>scrollTo(0,600));await expect(page.locator('.sticky-shell')).toHaveClass(/is-compact/);const compact=(await page.locator('#compactReadiness').innerText()).replace(/\s/g,'');expect(compact).toBe(hero)});
test('cabeçalho principal mantém a composição completa antes da rolagem',async({page})=>{await page.goto('/');await activateTab(page,'agenda');await expect(page.locator('.statement')).not.toHaveClass(/statement--compact/);await expect(page.locator('.balance-label')).toBeVisible();await expect(page.locator('.mini-stats')).toBeVisible()});
test('limpeza exige confirmação textual e fica desabilitada na demo',async({page})=>{await page.goto('/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload();await page.getByRole('button',{name:'Limpar todos os dados'}).click();await expect(page.locator('#modalMessage')).toContainText('excluirá');await page.getByRole('button',{name:'Confirmar'}).click();await expect(page.locator('#modalPromptInput')).toBeVisible();await page.locator('#modalPromptInput').fill('ERRADO');await page.getByRole('button',{name:'Limpar dados'}).click();await expect(page.locator('#modalPromptError')).toContainText('LIMPAR');await page.getByRole('button',{name:'Cancelar'}).click();await openDemo(page);await expect(page.getByRole('button',{name:'Limpar todos os dados'})).toBeDisabled()});
test('backup mantém ações destrutivas em zona separada',async({page})=>{await page.goto('/');const danger=page.locator('.backup-block > .backup-danger-zone');await expect(danger).toContainText('Zona de perigo');await expect(danger.getByRole('button',{name:'Limpar todos os dados'})).toBeVisible()});
test('configuração estratégica comunica herança e conquista de cem horas',async({page})=>{await page.goto('/?test=1');await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subjectId=state.subjects[0].id;state.examBlueprint.masteryTarget=80;state.examBlueprint.subjects=[{subjectId,priority:'normal',expectedQuestions:10,questionWeight:1,masteryTarget:null}];state.studySessions=[{id:'hours-100',date:api.todayISO(),durationSeconds:360000}];api.setState(state);api.renderAll()});await activateTab(page,'metas');await expect(page.locator('#examBlueprintConfig')).toContainText('Configuração por disciplina');await expect(page.locator('#examBlueprintConfig .field-inheritance').first()).toHaveText('80% (geral)');await activateTab(page,'dashboard');await expect(page.locator('#badgesGrid')).toContainText('Cem horas')});
test('componentes visuais não transbordam e controles usam o padrão comum',async({page})=>{
  await page.setViewportSize({width:375,height:900});
  await openDemo(page);
  await expect(page.locator('#studyTimerTarget')).toBeHidden();
  for(const select of await page.locator('#timerSubjectSelect,#timerTopicSelect,#timerTypeSelect,#studySessionsPeriod,#studySessionsSubjectFilter,#studySessionsTypeFilter').all())await expect(select).toHaveClass(/select-control/);
  const dashboardOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(dashboardOverflow).toBeLessThanOrEqual(1);
  await activateTab(page,'questoes');
  const errorCards=page.locator('#subjectErrorProfile .error-profile-item');
  if(await errorCards.count())expect(await errorCards.evaluateAll(cards=>cards.every(card=>card.scrollWidth<=card.clientWidth+1))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('cronômetro não reserva espaço vazio e instruções explicam dados e rotina',async({page})=>{await page.goto('/');await expect(page.locator('#studyTimerTarget')).toBeHidden();await expect(page.locator('#guidedStrategy')).toBeHidden();await activateTab(page,'instrucoes');await expect(page.getByRole('heading',{name:'Como usar o StudyTrack'})).toBeVisible();await expect(page.locator('#guide-start')).toContainText('Monte o edital');await expect(page.locator('#guide-data')).toContainText('Prontidão');await expect(page.locator('#guide-safety')).toContainText('Os dados ficam neste navegador')});

test('fechamento semanal e configuração estratégica preservam a hierarquia visual',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await openDemo(page);
  await expect(page.locator('#weeklyCloseDashboard .weekly-kpis')).toBeVisible();
  await expect(page.locator('#weeklyCloseDashboard .weekly-assessment')).toContainText('Diagnóstico');
  await expect(page.locator('#periodComparisonDashboard .comparison-head')).toContainText('Anterior');
  const rows=page.locator('#gapMapDashboard .data-row');
  if(await rows.count())await expect(rows.first().locator('.data-score')).toContainText(/Prioridade \d+\/100/);
  await activateTab(page,'metas');
  const strategicRow=page.locator('#examBlueprintConfig .exam-subject-row').first();
  expect(await strategicRow.evaluate(row=>row.scrollWidth<=row.clientWidth+1)).toBe(true);
});
