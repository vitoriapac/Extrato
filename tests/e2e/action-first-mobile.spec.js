import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

test('Visão Geral e Hoje compartilham a mesma recomendação prioritária',async({page})=>{
  await openDemo(page);
  const overviewAction=page.locator('#overviewNextAction .overview-action-card');
  await expect(overviewAction).toBeVisible();
  await expect(page.locator('.overview-now')).toBeVisible();
  const topic=await overviewAction.locator('h3').innerText();
  await expect(page.locator('#overviewAttention')).toBeVisible();
  await page.locator('#overviewAttentionViewAll').click();
  await expect(page.locator('#panel-hoje')).toHaveClass(/active/);
  await expect.poll(async()=> (await page.locator('#studyRecommendation .study-recommendation').first().locator('h4').innerText()).toLocaleLowerCase()).toBe(topic.replace(' · ',' — ').toLocaleLowerCase());
  await expect(page.locator('#studyRecommendation .recommendation-actions .btn').first()).toBeVisible();
});

test('aba Hoje prioriza ação e plano e recolhe apenas análises secundárias',async({page})=>{
  await openDemo(page);
  await activateTab(page,'hoje');
  const action=await page.locator('#studyRecommendation').evaluate(element=>element.getBoundingClientRect().top);
  const plan=await page.locator('#planoHojeContent').evaluate(element=>element.getBoundingClientRect().top);
  const alerts=await page.locator('#alertasInteligentesList').evaluate(element=>element.getBoundingClientRect().top);
  expect(action).toBeLessThan(plan);
  expect(plan).toBeLessThan(alerts);
  await expect(page.locator('.today-analysis-details')).not.toHaveAttribute('open','');
  await page.locator('.today-analysis-details > summary').click();
  await expect(page.locator('#diagnosisCenter')).toBeVisible();
  await expect(page.locator('#weeklyReplan')).toBeVisible();
});

test('atalhos da Visão Geral viram seletor acessível no celular',async({page})=>{
  await page.setViewportSize({width:375,height:850});
  await openDemo(page);
  const selector=page.locator('#overviewNavSelect');
  await expect(selector).toBeVisible();
  await expect(page.locator('.overview-nav-links a').first()).toBeHidden();
  await selector.selectOption('overview-study');
  await expect(page).toHaveURL(/#overview-study$/);
  await expect.poll(()=>page.evaluate(()=>document.getElementById('overview-study').getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('atalhos da Visão Geral permanecem horizontais no desktop',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openDemo(page);
  await expect(page.locator('.overview-nav-links a').first()).toBeVisible();
  await expect(page.locator('#overviewNavSelect')).toBeHidden();
});
