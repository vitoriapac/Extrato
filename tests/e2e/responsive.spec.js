import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';

for(const width of [375,768,1366,1440,1920])test(`preserva todas as áreas sem overflow global em ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await openDemo(page);
  for(const name of ['dashboard','hoje','disciplinas','calendario','agenda','questoes','metas']){await activateTab(page,name);await expectNoPageOverflow(page)}
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
