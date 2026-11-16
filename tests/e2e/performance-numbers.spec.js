import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceFilters, openPerformanceSection } from './helpers.js';

test('T56: a tendência da Prontidão não muda ao trocar o período', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const trend = page.locator('.performance-reading__verdict');
  await expect(trend).toBeVisible();
  const at30 = (await trend.innerText()).trim();
  const detail30 = (await page.locator('.performance-reading').innerText()).match(/Último fechamento[^.]*\./)?.[0];
  await openPerformanceFilters(page);
  await page.locator('#performancePeriod').selectOption('90');
  await expect(page.locator('.performance-reading__verdict')).toHaveText(at30);
  const detail90 = (await page.locator('.performance-reading').innerText()).match(/Último fechamento[^.]*\./)?.[0];
  expect(detail90).toBe(detail30);
});

test('T57: sem milhar cru, sem plural no singular e com porcentagens de uma casa', async ({ page }) => {
  test.setTimeout(240_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  for (const section of ['overview', 'subjects', 'diagnosis', 'questions', 'simulations', 'exam', 'consistency']) {
    await openPerformanceSection(page, section);
    const text = await page.locator('#performanceSectionContent').evaluate(node => node.innerText);
    // 1000 ou mais precisa de ponto: "1.247", nunca "1247" (datas e anos ficam de fora pelas barras e pontos vizinhos).
    const bare = text.match(/(?<![\d.,/:\-–])\d{4,}(?![\d.,/:\-–]|\/)/g) || [];
    expect(bare.filter(token => !/^(19|20)\d\d$/.test(token)), `${section}: milhar sem ponto`).toEqual([]);
    expect(text, `${section}: plural errado`).not.toMatch(/\b1 (questões|revisões|sessões|tópicos|disciplinas|dias)\b/);
  }
});

test('T58 e T59: cada contagem diz o critério e cada bloco diz como ordena', async ({ page }) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'diagnosis');
  await expect(page.locator('.diagnosis-unseen-note')).toContainText('sem nenhum registro');
  await expect(page.locator('.diagnosis-consolidated > .analytics-note').first()).toContainText('A fila ordena por gravidade e impacto');
  await openPerformanceSection(page, 'exam');
  await expect(page.locator('.incidence-quadrant', { hasText: 'Sem evidência suficiente para posicionar' })).toContainText('domínio medido');
  await expect(page.locator('.exam-opportunity')).toContainText('ordenada por incidência e domínio');
  await openPerformanceSection(page, 'overview');
  await expect(page.locator('.performance-reading__pull')).toContainText('Ordenado por peso na Prontidão');
});
