import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

test('subabas de Desempenho são tablist com setas, Home e End', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');

  const tablist = page.getByRole('tablist', { name: 'Análises de desempenho' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(7);
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#performanceSectionContent')).toHaveAttribute('role', 'tabpanel');

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();

  await page.keyboard.press('End');
  await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.last()).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(tabs.last()).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
});
