import {test,expect} from '@playwright/test';
import {openDemo,expectNoPageOverflow} from './helpers.js';

test('prévia e selo da demonstração funcionam no mobile sem alterar a base antes de carregar',async({page})=>{
  await page.setViewportSize({width:320,height:720});await page.goto('/');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('bb-premium-study-data'))?.subjects);
  await page.getByRole('button',{name:/Explorar demonstração/i}).click();
  const dialog=page.locator('#demoIntroDialog');await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('1.750 questões de estudo');
  await page.getByRole('button',{name:'Cancelar'}).click();await expect(dialog).toBeHidden();
  expect(await page.evaluate(()=>sessionStorage.getItem('bb-premium-mode'))).toBeNull();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('bb-premium-study-data'))?.subjects)).toEqual(before);
  for(const width of [320,375,390,430]){
    await page.setViewportSize({width,height:720});await page.getByRole('button',{name:/Explorar demonstração/i}).click();await expect(dialog).toBeVisible();
    const bounds=await dialog.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width+1);
    await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
  }
  await page.getByRole('button',{name:/Explorar demonstração/i}).click();await page.getByRole('button',{name:'Carregar demonstração'}).click();
  await expect(page.locator('#demoHeaderBadge')).toBeVisible();await expect(page.locator('#demoHeaderBadge')).toContainText('Dados fictícios');
  await expectNoPageOverflow(page);
});

test('isola, reinicia e encerra a demonstração sem alterar o estado real',async({page})=>{
  await page.goto('/?test=1');
  await expect(page).toHaveTitle(/OK — Testes do Extrato/);
  const realState=await page.evaluate(async()=>{
    const api=window.__EXTRATO_TEST__;
    await api.settleSaves();
    const state=structuredClone(api.getState());state.subjects[0].name='Registro real preservado';state.updatedAt='2099-01-01T12:00:00.000Z';
    api.setState(state);
    await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('extrato-estudos-db');request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=resolve});
    const serialized=JSON.stringify(state);
    localStorage.setItem('bb-premium-study-data',serialized);
    return serialized;
  });
  await openDemo(page);await expect(page.locator('#demoBanner')).toBeVisible();
  await expect(page.locator('#guidedOnboarding')).toBeHidden();await expect(page.locator('#overviewExamPhase + #dailyExecutionDashboard')).toHaveCount(1);await expect(page.locator('#panel-dashboard .exam-phase-compact')).toHaveCount(1);
await expect(page.locator('[data-demo-protected]').first()).toBeDisabled();
  const firstDemo=await page.evaluate(()=>sessionStorage.getItem('bb-premium-study-demo'));expect(firstDemo).toBeTruthy();const parsed=JSON.parse(firstDemo);
  expect(parsed.progressHistory).toHaveLength(140);expect(parsed.studySessions).toHaveLength(200);expect(parsed.simulados).toHaveLength(9);
  parsed.subjects[0].name='Alteração fictícia';await page.evaluate(value=>sessionStorage.setItem('bb-premium-study-demo',JSON.stringify(value)),parsed);
  await page.getByRole('button',{name:/Reiniciar demo/i}).click();await page.getByRole('button',{name:'Confirmar'}).click();await expect(page.locator('#demoBanner').getByText('MODO DEMONSTRAÇÃO',{exact:true})).toBeVisible();
  const restarted=JSON.parse(await page.evaluate(()=>sessionStorage.getItem('bb-premium-study-demo')));expect(restarted.subjects[0].name).not.toBe('Alteração fictícia');
  await page.getByRole('button',{name:/Sair da demonstração/i}).click();await expect(page.getByRole('button',{name:/Explorar demonstração/i})).toBeVisible();
  const restored=JSON.parse(await page.evaluate(()=>localStorage.getItem('bb-premium-study-data')));
  expect(JSON.parse(realState).subjects[0].name).toBe('Registro real preservado');
  expect(restored.subjects[0].name).toBe('Registro real preservado');
  expect(restored.subjects.some(subject=>subject.name==='Alteração fictícia')).toBe(false);
  expect(restored.studySessions.some(session=>String(session.id).startsWith('demo-'))).toBe(false);
  await expect(page.getByTitle('Registro real preservado')).toBeVisible();
});

test('encerra a demo em uma nova sessão do navegador',async({browser})=>{
  const first=await browser.newContext();const page=await first.newPage();await openDemo(page);await first.close();
  const second=await browser.newContext();const next=await second.newPage();await next.goto('/');await expect(next.locator('#demoBanner')).toBeHidden();await second.close();
});

test('roteiro da demonstração navega pelas áreas preservando o cenário',async({page})=>{
  await openDemo(page);await expect(page.locator('.demo-tour')).toBeVisible();
  for(const target of ['hoje','dashboard','agenda','metas']){await page.locator(`[data-demo-target="${target}"]`).click();await expect(page.locator(`#panel-${target}`)).toBeVisible()}
});

test('cenário de 140 dias renderiza todas as áreas sem perder dados',async({page})=>{
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await openDemo(page);
  const baseline=await page.evaluate(()=>{const state=JSON.parse(sessionStorage.getItem('bb-premium-study-demo'));return{history:state.progressHistory.length,sessions:state.studySessions.length,simulations:state.simulados.length}});
  expect(baseline).toEqual({history:140,sessions:200,simulations:9});
  for(const name of ['dashboard','hoje','disciplinas','calendario','agenda','questoes','metas','instrucoes']){
    await page.locator(`[data-tab="${name}"]`).evaluate(button=>button.click());
    const panel=page.locator(`#panel-${name}`);await expect(panel).toBeVisible();await expect(panel).not.toBeEmpty();
    expect(await panel.locator('text=/NaN|Invalid Date|undefined/').count(),`${name} exibiu valor inválido`).toBe(0);
  }
  const after=await page.evaluate(()=>{const state=JSON.parse(sessionStorage.getItem('bb-premium-study-demo'));return{history:state.progressHistory.length,sessions:state.studySessions.length,simulations:state.simulados.length}});
  expect(after).toEqual(baseline);expect(pageErrors).toEqual([]);
});

test('listas acumulativas da demo limitam, expandem e filtram sem duplicar',async({page})=>{
  await openDemo(page);
  const assertUnique=async locator=>{const ids=await locator.evaluateAll(rows=>rows.map(row=>row.dataset.id).filter(Boolean));expect(new Set(ids).size).toBe(ids.length)};
  await page.locator('[data-tab="dashboard"]').evaluate(button=>button.click());
  const sessionDays=page.locator('#studySessionsBody .session-day-row');const initialDays=await sessionDays.count();expect(initialDays).toBeGreaterThan(0);expect(initialDays).toBeLessThanOrEqual(5);await page.locator('#studySessionsBody').getByRole('button',{name:'Mostrar mais'}).click();expect(await sessionDays.count()).toBeGreaterThan(initialDays);
  await page.locator('#studySessionsTypeFilter').selectOption('questions');await expect(page.locator('#studySessionsFilterSummary')).toContainText(/sessões? no filtro atual/);await assertUnique(page.locator('#studySessionsBody tr[data-id]'));
  await page.locator('[data-tab="questoes"]').evaluate(button=>button.click());
  const questions=page.locator('#questoesBody tr[data-id]');await expect(questions).toHaveCount(5);await page.locator('#questoesBody').getByRole('button',{name:'Mostrar mais'}).click();expect(await questions.count()).toBeGreaterThan(10);await assertUnique(questions);
  const simulations=page.locator('#simuladosBody tr[data-id]');await expect(simulations).toHaveCount(5);await page.locator('#simuladosBody').getByRole('button',{name:'Mostrar mais'}).click();expect(await simulations.count()).toBeGreaterThan(5);await assertUnique(simulations);
  await page.locator('[data-tab="agenda"]').evaluate(button=>button.click());await page.locator('#agendaFilterStatus').selectOption('Atrasadas');await expect(page.locator('#agendaBody')).toContainText('Atrasadas');
  await page.locator('[data-tab="metas"]').evaluate(button=>button.click());await expect(page.locator('#weeklyCloseDashboard')).toContainText('Diagnóstico');await expect(page.locator('#decisionHistoryDashboard .data-row').first()).toBeAttached();
});

test('massa de 140 dias mantém navegação completa dentro do orçamento de renderização',async({page})=>{
  await openDemo(page);const started=Date.now();
  for(const name of ['dashboard','hoje','disciplinas','calendario','agenda','questoes','metas','instrucoes'])await page.locator(`[data-tab="${name}"]`).evaluate(button=>button.click());
  // Shared CI runners showed ~16.6 s twice; retain a bounded smoke budget with headroom.
  expect(Date.now()-started).toBeLessThan(25_000);
});
