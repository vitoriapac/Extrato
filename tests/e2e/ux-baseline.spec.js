import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

const screenshotOptions={animations:'disabled',caret:'hide',maxDiffPixelRatio:.08};

async function prepareDemo(page,{width,height,theme='light'}={}){
  await page.clock.install({time:new Date('2026-09-10T12:00:00-03:00')});
  await page.setViewportSize({width,height});
  await openDemo(page);
  await page.evaluate(()=>document.fonts.ready);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
}

test('baseline visual da ação principal no desktop',async({page})=>{
  await prepareDemo(page,{width:1440,height:900});
  await expect(page.locator('.overview-now')).toHaveScreenshot('agora-desktop-light.png',screenshotOptions);
});

test('baseline visual da ação principal no mobile escuro',async({page})=>{
  await prepareDemo(page,{width:375,height:812,theme:'dark'});
  await expect(page.locator('.overview-now')).toHaveScreenshot('agora-mobile-dark.png',screenshotOptions);
});

test('baseline visual da Central de Diagnóstico no desktop',async({page})=>{
  await prepareDemo(page,{width:1440,height:900});
  await activateTab(page,'hoje');
  await page.locator('.today-analysis-details > summary').click();
  await expect(page.locator('#diagnosisCenter')).toHaveScreenshot('diagnostico-desktop-light.png',screenshotOptions);
});

test('baseline visual da Central de Diagnóstico no mobile escuro',async({page})=>{
  await prepareDemo(page,{width:375,height:812,theme:'dark'});
  await activateTab(page,'hoje');
  await page.locator('.today-analysis-details > summary').click();
  await expect(page.locator('#diagnosisCenter')).toHaveScreenshot('diagnostico-mobile-dark.png',screenshotOptions);
});

test('tokens do Design System resolvem superfície e status nos dois temas',async({page})=>{
  await page.goto('/');
  for(const theme of ['light','dark']){
    await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
    const roles=await page.evaluate(()=>{
      const root=getComputedStyle(document.documentElement);
      const badge=document.createElement('span');
      badge.className='status-badge status-badge--insufficient';
      badge.textContent='Evidência limitada';
      document.body.append(badge);
      const badgeStyle=getComputedStyle(badge);
      const result={surface:root.getPropertyValue('--surface-card').trim(),inverse:root.getPropertyValue('--text-inverse').trim(),status:root.getPropertyValue('--status-insufficient').trim(),badgeColor:badgeStyle.color,badgeBackground:badgeStyle.backgroundColor};
      badge.remove();
      return result;
    });
    expect(roles.surface).not.toBe('');
    expect(roles.inverse).not.toBe('');
    expect(roles.status).not.toBe('');
    expect(roles.badgeColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(roles.badgeBackground).not.toBe('rgba(0, 0, 0, 0)');
  }
});
