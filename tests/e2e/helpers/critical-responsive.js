import { expect } from '@playwright/test';
import { activateTab, expectNoPageOverflow, openDemo, openPlanningSubtab, openPerformanceSection } from '../helpers.js';

export async function assertCriticalResponsive(page, { width, theme }) {
  await page.setViewportSize({ width, height: 900 });
  await openDemo(page);
  if (theme === 'dark') await page.locator('#themeToggleBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await activateTab(page, 'dashboard');
  await expectNoPageOverflow(page);
  await expect(page.locator('.overview-now')).toBeVisible();
  await activateTab(page, 'desempenho');
  // A leitura reúne a prontidão na Visão geral; o diagnóstico fica na subaba Disciplinas.
  await openPerformanceSection(page, 'overview');
  await expectNoPageOverflow(page);
  await expect(page.getByRole('region', { name: 'Leitura da preparação' })).toBeVisible();
  await openPerformanceSection(page, 'diagnosis');
  await expectNoPageOverflow(page);
  await expect(page.locator('#diagnosisCenter')).toBeVisible();
  await openPlanningSubtab(page, 'fechamento');
  await expectNoPageOverflow(page);
  await expect(page.locator('#weeklyCloseDashboard')).toBeVisible();
  await openPlanningSubtab(page, 'prova');
  await expectNoPageOverflow(page);
  await expect(page.locator('#examBlueprintConfig')).toBeVisible();
  await activateTab(page, 'disciplinas');
  await expectNoPageOverflow(page);
  await activateTab(page, 'agenda');
  await expectNoPageOverflow(page);
  await activateTab(page, 'questoes');
  await expectNoPageOverflow(page);
  await page.keyboard.press('Control+k');
  await page.locator('#globalSearchInput').fill('recomendação prioritária');
  await expect(page.locator('#globalSearchInput')).toBeFocused();
  await expectNoPageOverflow(page);
  await page.keyboard.press('Escape');
}
