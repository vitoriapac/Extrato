import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

test('subabas de Desempenho são tablist com setas, Home e End', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');

  const tablist = page.getByRole('tablist', { name: 'Análises de desempenho' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(2)).toHaveText('Questões e provas');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#performanceSectionContent')).toHaveAttribute('role', 'tabpanel');

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();

  await expect(
    page.getByRole('tablist', { name: 'Seções de Disciplinas' }).getByRole('tab')
  ).toHaveCount(2);

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

test('Questões e provas reúne Questões, Simulados e Inteligência da prova, e a URL acompanha a subaba', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await page.getByRole('tab', { name: 'Questões e provas', exact: true }).click();
  const sections = page.getByRole('tablist', { name: 'Seções de Questões e provas' }).getByRole('tab');
  await expect(sections).toHaveText(['Questões', 'Simulados', 'Inteligência da prova']);
  await sections.nth(2).click();
  await expect(page.locator('#panel-desempenho')).toHaveAttribute('data-performance-view', 'exam');
  await expect(page).toHaveURL(/#desempenho\/exam$/);
});
