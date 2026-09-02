import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';

for(const width of [375,768,1440])test(`preserva todas as áreas sem overflow global em ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await openDemo(page);
  for(const name of ['dashboard','hoje','disciplinas','calendario','agenda','questoes','metas']){await activateTab(page,name);await expectNoPageOverflow(page)}
});

test('mantém tema e barras fixas sem sobreposição no celular',async({page})=>{
  await page.setViewportSize({width:375,height:800});await openDemo(page);await page.locator('#themeToggleBtn').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await activateTab(page,'dashboard');await page.locator('.overview-nav').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollBy(0,360));
  const p=await page.evaluate(()=>{const tabs=document.querySelector('.tabs').getBoundingClientRect(),nav=document.querySelector('.overview-nav').getBoundingClientRect();return{tabsBottom:tabs.bottom,navTop:nav.top}});
  expect(p.navTop).toBeGreaterThanOrEqual(p.tabsBottom);
});
