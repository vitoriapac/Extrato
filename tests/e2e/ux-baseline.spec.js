import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

const screenshotOptions={animations:'disabled',caret:'hide',maxDiffPixelRatio:.08};
// Keep pixel-exact baselines aligned with the host OS used to render the fonts.
const screenshotName=name=>name.replace(/\.png$/,`-${process.platform}.png`);

async function prepareDemo(page,{width,height,theme='light'}={}){
  await page.clock.install({time:new Date('2026-09-10T12:00:00-03:00')});
  await page.setViewportSize({width,height});
  await openDemo(page);
  await page.evaluate(()=>document.fonts.ready);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
}

async function prepareDiagnosisScreenshot(page){
  await activateTab(page,'hoje');
  await page.locator('.today-analysis-details > summary').click();
  await page.locator('.sticky-shell, #demoBanner, #backToTopBtn').evaluateAll(elements=>elements.forEach(element=>element.remove()));
}

async function expectDiagnosisScreenshot(page,name,height){
  const diagnosis=page.locator('#diagnosisCenter');
  // A fixed canvas tolerates OS font rasterization without dropping any content.
  // Assert the natural content fits first; an oversized component must fail explicitly.
  expect(await diagnosis.evaluate(element=>element.scrollHeight)).toBeLessThanOrEqual(height);
  await diagnosis.evaluate((element,value)=>{element.style.height=value+'px'},height);
  await expect(diagnosis).toHaveScreenshot(name,{...screenshotOptions,maxDiffPixelRatio:.06});
}

test('baseline visual da ação principal no desktop',async({page})=>{
  await prepareDemo(page,{width:1440,height:900});
  const action=await page.locator('.overview-now-action').boundingBox(),attention=await page.locator('.overview-now-attention').boundingBox();
  expect(action.x+action.width).toBeLessThanOrEqual(attention.x+1);
  expect(action.y).toBe(attention.y);
  if(process.platform==='win32')await expect(page.locator('.overview-now')).toHaveScreenshot(screenshotName('agora-desktop-light.png'),screenshotOptions);
});

test('baseline visual da ação principal no mobile escuro',async({page})=>{
  await prepareDemo(page,{width:375,height:812,theme:'dark'});
  const action=await page.locator('.overview-now-action').boundingBox(),attention=await page.locator('.overview-now-attention').boundingBox();
  expect(attention.y).toBeGreaterThanOrEqual(action.y+action.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  if(process.platform==='win32')await expect(page.locator('.overview-now')).toHaveScreenshot(screenshotName('agora-mobile-dark.png'),screenshotOptions);
});

test('baseline visual da Central de Diagnóstico no desktop',async({page})=>{
  await prepareDemo(page,{width:1440,height:900});
  await prepareDiagnosisScreenshot(page);
  await expectDiagnosisScreenshot(page,'diagnostico-desktop-light.png',7000);
});

test('baseline visual da Central de Diagnóstico no mobile escuro',async({page})=>{
  await prepareDemo(page,{width:375,height:812,theme:'dark'});
  await prepareDiagnosisScreenshot(page);
  await expectDiagnosisScreenshot(page,'diagnostico-mobile-dark.png',10000);
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
