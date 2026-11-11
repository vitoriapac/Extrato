import { test, expect } from '@playwright/test';
import { activateTab, expectNoPageOverflow, openDemo } from './helpers.js';

for (const width of [320, 600, 900, 1100, 1280])
  for (const theme of ['light', 'dark']) {
    test(`demo densa mantém módulos legíveis em ${width}px no tema ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openDemo(page);
      if (theme === 'dark') await page.locator('#themeToggleBtn').click();
      for (const name of [
        'dashboard',
        'desempenho',
        'metas',
        'disciplinas',
        'questoes',
        'instrucoes',
      ]) {
        await activateTab(page, name);
        await expect(page.locator(`[data-tab="${name}"]`)).toHaveAttribute('aria-current', 'page');
        await expectNoPageOverflow(page);
      }
      await activateTab(page, 'disciplinas');
      const menu = page.locator('.subject-action-menu').first();
      await menu.locator('summary').click();
      await expect(menu).toHaveAttribute('open', '');
      await expectNoPageOverflow(page);
      await page.keyboard.press('Escape');
      await expect(menu).not.toHaveAttribute('open', '');
      await expect(menu.locator('summary')).toBeFocused();
      const importTrigger = page.locator('.subjects-import-menu > button');
      const importMenu = page.locator('.subjects-import-menu [role="menu"]');
      await importTrigger.click();
      await expect(importTrigger).toHaveAttribute('aria-expanded', 'true');
      await expect(importMenu).toBeVisible();
      await expectNoPageOverflow(page);
      await page.keyboard.press('Escape');
      await expect(importTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(importMenu).toBeHidden();
    });
  }
