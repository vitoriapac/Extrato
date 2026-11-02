import { test, expect } from '@playwright/test';
import { activateTab, openDemo } from './helpers.js';

test('quem começa sem dados entra no modo Essencial: análises a um clique e dicas dos termos (F10)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-essential', 'on');
  await expect(page.locator('#essentialToggleBtn')).toHaveAttribute('aria-pressed', 'true');
  await activateTab(page, 'desempenho');
  await expect(page.locator('.today-analysis-details')).toBeHidden();
  await page.getByRole('button', { name: 'Mostrar Resumo, diagnóstico e replanejamento' }).click();
  await expect(page.locator('.today-analysis-details')).toBeVisible();
  await activateTab(page, 'dashboard');
  const hint = page.getByRole('button', { name: 'O que é Índice de prontidão?' });
  await hint.click();
  await expect(hint).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.balance-label + .term-hint-text')).toContainText('Não é chance de aprovação');

  await page.locator('#essentialToggleBtn').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-essential', 'on');
  await expect(hint).toBeHidden();
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-essential', 'on');
});

test('a demonstração mostra o app completo mesmo com o modo Essencial salvo (F10)', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-essential', 'on');
  await activateTab(page, 'questoes');
  await expect(page.locator('#topicPerformanceCard')).toBeVisible();
  await expect(page.locator('.advanced-reveal:visible')).toHaveCount(0);
});
