import { test, expect } from '@playwright/test';
import {
  activateTab,
  expectNoPageOverflow,
  openDemo,
  overviewRecommendationId,
} from './helpers.js';

test('Leitura da preparação usa a mesma recomendação de Hoje e leva ao dono', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  const todayId = await overviewRecommendationId(page);
  await activateTab(page, 'desempenho');
  const reading = page.locator('.performance-reading');
  await expect(reading).toBeVisible();
  await expect(reading.getByRole('heading', { name: 'Como estou' })).toBeVisible();
  await expect(reading.getByRole('heading', { name: 'O que mais pesa' })).toBeVisible();
  await expect(reading.getByRole('heading', { name: 'O que fazer' })).toBeVisible();
  // Um único botão sólido na faixa: abrir no dono da recomendação.
  await expect(reading.locator('.btn:not(.ghost)')).toHaveCount(1);
  if (todayId)
    await expect(reading.locator('[data-recommendation-id]')).toHaveAttribute(
      'data-recommendation-id',
      todayId
    );
  await expect(reading).not.toContainText(/porque|garante|graças/i);
  await expectNoPageOverflow(page);
  await reading.getByRole('button', { name: 'Abrir em Hoje' }).click();
  await expect(page.locator('#panel-hoje')).toBeVisible();
});

test('Leitura da preparação cabe em 375 px sem rolagem lateral', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await expect(page.locator('.performance-reading')).toBeVisible();
  await expectNoPageOverflow(page);
});

test('Comparação por disciplina mostra o saldo do plano e a âncora do bloco é preservada', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await page.evaluate(() => {
    window.location.hash = '#desempenho/subjects/comparacao';
  });
  const block = page.locator('#bloco-comparacao');
  await expect(block).toBeVisible();
  await expect(block).toBeInViewport();
  expect(await page.evaluate(() => window.location.hash)).toBe('#desempenho/subjects/comparacao');
  await block.locator('summary', { hasText: 'Ver tabela detalhada' }).click();
  await expect(block.getByRole('columnheader', { name: 'Saldo do plano' }).first()).toBeVisible();
  await expect(block.getByRole('columnheader', { name: 'Sugestão' }).first()).toBeVisible();
  await expect(block.locator('tbody td', { hasText: /faltam|sobram/ }).first()).toBeVisible();
});
