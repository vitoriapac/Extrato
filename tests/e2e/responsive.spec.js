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
    await activateTab(page,'hoje');
    const analyses=page.locator('.today-analysis-details');
    if(await analyses.count()&&!await analyses.first().evaluate(element=>element.open))await analyses.first().locator('summary').click();
    await expectNoPageOverflow(page);
    await expect(page.locator('#diagnosisCenter')).toBeVisible();
    await activateTab(page,'metas');await expectNoPageOverflow(page);
    await activateTab(page,'disciplinas');await expectNoPageOverflow(page);
    await page.keyboard.press('Control+k');
    await page.locator('#globalSearchInput').fill('recomendação prioritária');
    await expect(page.locator('#globalSearchInput')).toBeFocused();await expectNoPageOverflow(page);
    await page.keyboard.press('Escape');
  }
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

test('mantém tema e barras fixas sem sobreposição no celular',async({page})=>{
  await page.setViewportSize({width:375,height:800});await openDemo(page);await page.locator('#themeToggleBtn').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await activateTab(page,'dashboard');await page.evaluate(()=>scrollTo(0,1400));
  const p=await page.evaluate(()=>{const shell=document.querySelector('.sticky-shell').getBoundingClientRect(),tabs=document.querySelector('.tabs').getBoundingClientRect(),nav=document.querySelector('.overview-nav').getBoundingClientRect(),search=document.querySelector('.global-search-row').getBoundingClientRect(),brand=document.querySelector('.compact-brand').getBoundingClientRect(),meta=document.querySelector('.compact-meta').getBoundingClientRect(),more=document.querySelector('#moreTabButton').getBoundingClientRect();return{shellTop:shell.top,shellBottom:shell.bottom,tabsTop:tabs.top,tabsBottom:tabs.bottom,navTop:nav.top,searchBottom:search.bottom,brandTop:brand.top,metaTop:meta.top,moreTop:more.top,stackHeight:getComputedStyle(document.documentElement).getPropertyValue('--sticky-stack-height')}});
  expect(p.shellTop).toBeGreaterThanOrEqual(0);expect(p.shellTop).toBeLessThanOrEqual(1);
  expect(p.searchBottom).toBeLessThan(0);
  expect(p.navTop).toBeGreaterThanOrEqual(p.shellBottom-1);
  expect(Math.abs(p.brandTop-p.metaTop)).toBeLessThan(8);
  expect(Math.abs(p.moreTop-p.tabsTop)).toBeLessThan(2);
  expect(parseInt(p.stackHeight,10)).toBeGreaterThan(40);
});
