import { test, expect } from '@playwright/test';
import { activateTab, expectNoPageOverflow, openDemo, openPlanningSubtab } from './helpers.js';

test('paleta abre sem consulta, agrupa comandos e navega por teclado', async ({ page }) => {
  await openDemo(page);
  await page.keyboard.press('Control+k');
  const search = page.locator('#globalSearchInput'),
    panel = page.locator('#globalSearchResults');
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.getByRole('group', { name: 'Ações' })).toBeVisible();
  await expect(panel.getByRole('group', { name: 'Navegação' })).toBeVisible();
  // Padrão combobox: o foco fica no campo e a seta marca a opção ativa.
  await search.press('ArrowDown');
  const first = panel.locator('.search-result-item').first();
  await expect(search).toBeFocused();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(search).toHaveAttribute(
    'aria-activedescendant',
    (await first.getAttribute('id')) || ''
  );
  await page.keyboard.press('Escape');
  await expect(panel).not.toHaveClass(/show/);
  await expect(search).toHaveAttribute('aria-expanded', 'false');
});

test('relatório inclui planejamento adaptativo e resultados posteriores', async ({ page }) => {
  await openDemo(page);
  await page.locator('#openDataManagementBtn').click();
  await expect(page.locator('#dataManagementOverlay, #dataManagementDialog')).toBeVisible();
  await page.getByRole('button', { name: /Exportar relatório PDF/i }).click();
  const report = page.locator('#strategicPrintReport');
  await expect(report).toContainText('Planejamento adaptativo');
  await expect(report).toContainText('Recomendações');
  await expect(report).toContainText('Resultados posteriores');
  await expect(report).toContainText('As medições posteriores não demonstram');
  await expect(report).toContainText('Foco estratégico da semana');
  await expect(report).toContainText('Tempo em tópicos de alto impacto');
  await expect(report).toContainText('sem meta mínima');
});

for (const width of [320, 430])
  for (const theme of ['light', 'dark'])
    test(`metas por disciplina editam sem overflow em ${width}px no tema ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 850 });
      await openDemo(page);
      if (theme === 'dark') await page.locator('#themeToggleBtn').click();
      await activateTab(page, 'metas');
      await openPlanningSubtab(page, 'prova');
      const table = page.locator('#subjectTargetEditor .subject-target-table');
      await expect(table).toBeVisible();
      await expectNoPageOverflow(page);
      const priority = page.locator('#subjectTargetEditor [data-field="priority"]').first();
      const original = await priority.inputValue();
      const changed = original === 'high' ? 'low' : 'high';
      await priority.selectOption(changed);
      await expect(page.locator('#subjectTargetEditor [data-targets-pending-bar]')).toBeVisible();
      // Descartar volta ao valor salvo; Salvar alterações grava e esconde o aviso.
      await page.getByRole('button', { name: 'Descartar' }).click();
      await expect(
        page.locator('#subjectTargetEditor [data-field="priority"]').first()
      ).toHaveValue(original);
      await page
        .locator('#subjectTargetEditor [data-field="priority"]')
        .first()
        .selectOption(changed);
      await page.getByRole('button', { name: 'Salvar alterações' }).click();
      await expect(
        page.locator('#subjectTargetEditor [data-field="priority"]').first()
      ).toHaveValue(changed);
      await expect(page.locator('#subjectTargetEditor [data-targets-pending-bar]')).toBeHidden();
      await expectNoPageOverflow(page);
    });
