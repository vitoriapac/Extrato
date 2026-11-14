import { test, expect } from '@playwright/test';
import { openDemo, activateTab, openPerformanceSection } from './helpers.js';

test('subabas de Desempenho são tablist com setas, Home e End', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');

  const tablist = page.getByRole('tablist', { name: 'Análises de desempenho' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(3)).toHaveText('Questões e provas');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#performanceSectionContent')).toHaveAttribute('role', 'tabpanel');

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();

  await expect(page.getByRole('tablist', { name: 'Seções de Questões e provas' })).toHaveCount(0);

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

test('Ritmo e aderência: nenhum alvo interativo menor que 24 px (WCAG 2.5.8)', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await activateTab(page, 'desempenho');
    await openPerformanceSection(page, 'consistency');
    const small = await page.evaluate(() => {
      const found = [];
      document
        .querySelectorAll(
          '#panel-desempenho button, #panel-desempenho a[href], #panel-desempenho summary, #panel-desempenho select'
        )
        .forEach(el => {
          const box = el.getBoundingClientRect();
          if (!box.width || !box.height || el.closest('[hidden]')) return;
          if (box.height < 24 || box.width < 24)
            found.push(`${el.className} ${Math.round(box.width)}x${Math.round(box.height)}`);
        });
      return found;
    });
    expect(small, `alvos pequenos em ${width}px`).toEqual([]);
  }
});
