import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

const viewports=[
  {name:'mobile-375',width:375,height:812},
  {name:'desktop-1366',width:1366,height:768},
  {name:'desktop-1440',width:1440,height:900},
  {name:'desktop-1920',width:1920,height:1080}
];
const screenshotOptions={animations:'disabled',caret:'hide',maxDiffPixelRatio:.08};

async function openStableDemo(page,viewport){
  await page.clock.install({time:new Date('2026-09-10T12:00:00-03:00')});
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  await openDemo(page);
  await page.evaluate(()=>document.fonts.ready);
}

for(const viewport of viewports){
  test(`regressão visual do hero e fechamento em ${viewport.width}px`,async({page})=>{
    await openStableDemo(page,viewport);
    await expect(page.locator('.statement')).toHaveScreenshot(`hero-${viewport.name}.png`,screenshotOptions);
    await expect(page.locator('#weeklyCloseDashboard').locator('..')).toHaveScreenshot(`fechamento-${viewport.name}.png`,screenshotOptions);
  });
}

test('regressão visual dos componentes críticos em desktop',async({page})=>{
  await openStableDemo(page,{width:1440,height:900});
  await page.locator('.demo-banner').evaluate(element=>element.hidden=true);
  await page.evaluate(()=>scrollTo(0,600));
  await expect(page.locator('.sticky-shell')).toHaveClass(/is-compact/);
  await expect(page.locator('.compact-header')).toHaveScreenshot('cabecalho-compacto-desktop.png',screenshotOptions);
  await page.evaluate(()=>scrollTo(0,0));
  await expect(page.locator('#studySessionsCard')).toHaveScreenshot('historico-sessoes-desktop.png',screenshotOptions);
  await expect(page.locator('#badgesGrid')).toHaveScreenshot('conquistas-desktop.png',screenshotOptions);
  await activateTab(page,'questoes');
  await expect(page.locator('#subjectErrorProfile')).toHaveScreenshot('erros-categorizados-desktop.png',screenshotOptions);
  await activateTab(page,'metas');
  await expect(page.locator('#examBlueprintConfig')).toHaveScreenshot('configuracao-estrategica-desktop.png',screenshotOptions);
});
