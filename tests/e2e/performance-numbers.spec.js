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
  await expect(page.locator('.diagnosis-consolidated > .analytics-note').first()).toContainText(/gravidade e impacto na prova/);
  await openPerformanceSection(page, 'exam');
  await expect(page.locator('.incidence-quadrant', { hasText: 'Sem evidência suficiente para posicionar' })).toContainText('domínio medido');
  await expect(page.locator('.exam-opportunity')).toHaveCount(0);
  await openPerformanceSection(page, 'overview');
  await expect(page.locator('.performance-reading__pull')).toContainText('Ordenado por peso na Prontidão');
});

test('T62 a T64: uma prioridade só, com uma linha que explica a Próxima ação contra a fila', async ({ page }) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  // Resumo: "O que mais pesa" conta os tópicos e leva ao Diagnóstico, sem nomear um tópico concorrente.
  const pull = page.locator('.performance-reading__pull');
  await expect(pull).toContainText(/tópicos? fracos? de alto impacto na prova/);
  await expect(pull.getByRole('button', { name: 'Ver no Diagnóstico' }).first()).toBeVisible();
  // Diagnóstico: uma linha com a Próxima ação e o primeiro da fila lado a lado.
  await openPerformanceSection(page, 'diagnosis');
  await expect(page.locator('.diagnosis-consolidated > .analytics-note').first()).toContainText(/A sugestão acima \(.+\) é o primeiro da fila com atividade de estudo disponível; a fila abaixo começa por/);
  // Simulados: o passo da projeção conta tópicos, sem nomear um.
  await openPerformanceSection(page, 'simulations');
  const needed = page.locator('.achievement-projection__details', { has: page.locator(':scope > summary', { hasText: 'O que seria necessário?' }) });
  await needed.locator(':scope > summary').click();
  await expect(needed).toContainText(/pesa(m)? na projeção/);
  // Inteligência da prova: sem o bloco "Maior oportunidade na banca" nem "Prova × Você" vazio.
  await openPerformanceSection(page, 'exam');
  await expect(page.locator('.exam-opportunity')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Prova × Você' })).toHaveCount(0);
});
