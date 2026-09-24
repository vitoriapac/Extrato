import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';
import {waitForAppReady} from './helpers/app-state.js';

for(const width of [375,768,1366,1440,1920])test(`preserva todas as áreas sem overflow global em ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await openDemo(page);
  for(const name of ['dashboard','hoje','disciplinas','calendario','agenda','questoes','metas']){await activateTab(page,name);await expectNoPageOverflow(page)}
});

for(const width of [320,360,390,430])test(`mantém Visão Geral, Hoje e Planejamento sem overflow em ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:850});await openDemo(page);
  for(const name of ['dashboard','hoje','metas']){await activateTab(page,name);await expectNoPageOverflow(page)}
});

for(const width of [320,375,430,768,1440])test(`matriz visual crítica não transborda em claro e escuro em ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await openDemo(page);
  for(const theme of ['light','dark']){
    if(theme==='dark')await page.locator('#themeToggleBtn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await activateTab(page,'dashboard');await expectNoPageOverflow(page);
    await expect(page.locator('#weeklyCloseDashboard')).toBeVisible();
    await activateTab(page,'hoje');
    const analyses=page.locator('.today-analysis-details');
    if(await analyses.count()&&!await analyses.first().evaluate(element=>element.open))await analyses.first().locator(':scope > summary').click();
    await expectNoPageOverflow(page);
    await expect(page.locator('#diagnosisCenter')).toBeVisible();
    await activateTab(page,'metas');await expectNoPageOverflow(page);
    await expect(page.locator('#examBlueprintConfig')).toBeVisible();
    await activateTab(page,'disciplinas');await expectNoPageOverflow(page);
    await activateTab(page,'agenda');await expectNoPageOverflow(page);
    await activateTab(page,'calendario');await expectNoPageOverflow(page);
    await activateTab(page,'questoes');await expectNoPageOverflow(page);
    await page.keyboard.press('Control+k');
    await page.locator('#globalSearchInput').fill('recomendação prioritária');
    await expect(page.locator('#globalSearchInput')).toBeFocused();await expectNoPageOverflow(page);
    await page.keyboard.press('Escape');
  }
});

for(const width of [320,375,430,768,1440])test(`onboarding e modal de sessão cabem na matriz mobile ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/?test=1');await waitForAppReady(page);await page.locator('#testReport').evaluate(element=>element.remove());
  for(const theme of ['light','dark']){
    await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
    await activateTab(page,'dashboard');
    await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
    await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
    await expectNoPageOverflow(page);
    const onboardingBounds=await page.locator('#guidedOnboardingOverlay .onboarding-modal').boundingBox();
    expect(onboardingBounds.x).toBeGreaterThanOrEqual(0);
    expect(onboardingBounds.x+onboardingBounds.width).toBeLessThanOrEqual(width+1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();

    await page.locator('#timerTypeSelect').selectOption('questions');
    await page.locator('#timerStartBtn').click();
    await expect.poll(()=>page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
    await page.locator('#timerFinishBtn').click();
    await expect(page.locator('#sessionModalOverlay')).toBeVisible();
    await expectNoPageOverflow(page);
    const sessionBounds=await page.locator('#sessionModalOverlay .modal-box').boundingBox();
    expect(sessionBounds.x).toBeGreaterThanOrEqual(0);
    expect(sessionBounds.x+sessionBounds.width).toBeLessThanOrEqual(width+1);
    await page.locator('#sessionModalSkipBtn').click();
    await expect(page.locator('#sessionModalOverlay')).toBeHidden();
  }
});

test('modo foco e cronômetro cabem nos viewports críticos em claro e escuro',async({page})=>{
  await openDemo(page);await activateTab(page,'dashboard');
  const focusToggle=page.locator('#timerFocusToggle');
  for(const width of [320,375,430,768,1440])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:900});
    await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await focusToggle.click();
    await expect(page.locator('body')).toHaveClass(/timer-focus-active/);
    await expect(page.locator('#timerFocusContext')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/timer-focus-active/);
  }
});

for(const width of [320,375,390,430])for(const theme of ['light','dark'])test(`pilha sticky não se sobrepõe em ${width}px no tema ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:800});await openDemo(page);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
  await activateTab(page,'dashboard');await page.evaluate(()=>scrollTo(0,1400));
  const stack=await page.evaluate(()=>{
    const shell=document.querySelector('.sticky-shell').getBoundingClientRect();
    const tabs=document.querySelector('.tabs').getBoundingClientRect();
    const nav=document.querySelector('.overview-nav').getBoundingClientRect();
    const search=document.querySelector('.global-search-row').getBoundingClientRect();
    const brand=document.querySelector('.compact-brand').getBoundingClientRect();
    const meta=document.querySelector('.compact-meta').getBoundingClientRect();
    const more=document.querySelector('#moreTabButton').getBoundingClientRect();
    return{shellTop:shell.top,shellBottom:shell.bottom,tabsTop:tabs.top,navTop:nav.top,searchBottom:search.bottom,brandTop:brand.top,metaTop:meta.top,moreTop:more.top};
  });
  expect(stack.shellTop).toBeGreaterThanOrEqual(0);expect(stack.shellTop).toBeLessThanOrEqual(1);
  expect(stack.searchBottom).toBeLessThan(0);
  expect(stack.navTop).toBeGreaterThanOrEqual(stack.shellBottom-1);
  expect(Math.abs(stack.brandTop-stack.metaTop)).toBeLessThan(8);
  expect(Math.abs(stack.moreTop-stack.tabsTop)).toBeLessThan(2);
});

for(const width of [320,375,768,1440])test(`nomes extensos quebram sem overflow em ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/?test=1');await waitForAppReady(page);await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const names=['Conhecimentos e Comportamentos Digitais','Mercado Financeiro e Transformação Digital','Prevenção à Lavagem de Dinheiro e Financiamento ao Terrorismo'];
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());
    state.subjects=names.map((name,index)=>({id:`long-subject-${index}`,name,archived:false,topics:[{id:`long-topic-${index}`,name:names[(index+1)%names.length],status:'Não iniciado',difficulty:'Médio',estimatedStudyMinutes:60,archived:false,prerequisites:[]}]}));
    api.setState(state);api.renderAll();
  });
  for(const theme of ['light','dark']){
    if(theme==='dark')await page.locator('#themeToggleBtn').click();
    await activateTab(page,'dashboard');await expectNoPageOverflow(page);
    await activateTab(page,'hoje');await expectNoPageOverflow(page);
    await activateTab(page,'disciplinas');await expectNoPageOverflow(page);
    await activateTab(page,'questoes');await expectNoPageOverflow(page);
    await activateTab(page,'metas');await expectNoPageOverflow(page);
  }
});
