import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceSection } from './helpers.js';

test('Disciplinas: a comparação tem quatro modos, um por vez, com a precisão como padrão', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'subjects');
  const modes = page.locator('.performance-modes:not(.performance-view-toggle) button');
  await expect(modes).toHaveText(['Precisão', 'Tendência', 'Progresso', 'Radar']);
  await expect(page.locator('.performance-modes:not(.performance-view-toggle) [aria-pressed="true"]')).toHaveText('Precisão');
  await expect(page.locator('#bloco-comparacao')).toBeVisible();
  await expect(page.locator('#bloco-estabilidade')).toBeHidden();

  await page.getByRole('button', { name: 'Tendência', exact: true }).click();
  await expect(page.locator('#bloco-estabilidade')).toBeVisible();
  await expect(page.locator('#bloco-comparacao')).toBeHidden();

  await page.getByRole('button', { name: 'Progresso', exact: true }).click();
  await expect(page.locator('#progressChart')).toBeVisible();
  await expect(page.locator('#progressBars')).toBeVisible();
  await expect(page.locator('#radarChart')).toBeHidden();

  await page.getByRole('button', { name: 'Radar', exact: true }).click();
  await expect(page.locator('#radarChart svg')).toBeVisible();
  await expect(page.locator('#progressChart')).toBeHidden();

  // O modo escolhido acompanha a pessoa ao trocar de subaba e voltar.
  await openPerformanceSection(page, 'consistency');
  await openPerformanceSection(page, 'subjects');
  await expect(page.locator('.performance-modes:not(.performance-view-toggle) [aria-pressed="true"]')).toHaveText('Radar');
});
