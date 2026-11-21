import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceSection } from './helpers.js';

test('quem começa sem dados entra no modo Essencial: análises a um clique e dicas dos termos (F10)', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-essential', 'on');
  await expect(page.locator('#essentialToggleBtn')).toHaveAttribute('aria-pressed', 'true');
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'subjects');
  await expect(page.locator('.today-analysis-details')).toBeHidden();
  // Sem registro, o Diagnóstico mostra o estado do modo iniciante (T32); com dados, abrir a subaba já mostra o bloco.
  await openPerformanceSection(page, 'diagnosis');
  await expect(page.locator('[data-beginner-state="diagnosis"]')).toBeVisible();
  await activateTab(page, 'dashboard');
  // Primeiro acesso: o cabeçalho completo (e a dica do Índice de prontidão) só aparece depois que há dado a mostrar.
  await expect(page.locator('.statement')).toHaveAttribute('data-first-run', '');
  await expect(page.locator('.statement-body')).toBeHidden();

  await page.locator('#preferencesMenuBtn').click();
  await page.locator('#essentialToggleBtn').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-essential', 'on');
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
