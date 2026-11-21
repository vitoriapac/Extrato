import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openDemo, activateTab, openPerformanceSection } from './helpers.js';

test('subabas de Desempenho são tablist com setas, Home e End', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');

  const tablist = page.getByRole('tablist', { name: 'Análises de desempenho' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(3)).toHaveText('Análise de resultados');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  // Nomes que não repetem as abas de topo "Visão geral" e "Disciplinas".
  await expect(tabs).toHaveText(['Resumo', 'Por disciplina', 'Diagnóstico', 'Análise de resultados', 'Ritmo e aderência']);
  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#performanceSectionContent')).toHaveAttribute('role', 'tabpanel');

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();

  await expect(page.locator('#panel-desempenho').getByRole('tablist')).toHaveCount(1);

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

test('Análise de resultados mostra um painel por vez, sem segundo nível de abas, e as rotas levam ao painel certo', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await page.getByRole('tab', { name: 'Análise de resultados', exact: true }).click();
  // Sem segundo nível de abas: o controle é segmentado (botões com aria-pressed), não um tablist.
  await expect(page.locator('#panel-desempenho').getByRole('tablist')).toHaveCount(1);
  const titles = page.locator('#performanceSectionContent .performance-proof__title');
  await expect(titles).toHaveText(['Questões']);
  const index = page.locator('.performance-proof-index');
  await expect(index.getByRole('button')).toHaveText(['Questões', 'Simulados', 'Inteligência da prova']);
  await expect(index.locator('[aria-pressed="true"]')).toHaveText('Questões');
  await index.getByRole('button', { name: 'Simulados' }).click();
  await expect(titles).toHaveText(['Simulados']);
  await expect(page.locator('#prova-questions')).toHaveCount(0);
  await expect(index.locator('[aria-pressed="true"]')).toHaveText('Simulados');
  await index.getByRole('button', { name: 'Inteligência da prova' }).click();
  await expect(titles).toHaveText(['Inteligência da prova']);
  await expect(page.locator('#examIntelligenceHub')).toBeVisible();
  for (const [route, key] of [['simulations', 'simulations'], ['exam', 'exam'], ['questions', 'questions']]) {
    await page.evaluate(hash => {
      window.location.hash = hash;
    }, `#desempenho/${route}`);
    await expect(page.getByRole('tab', { name: 'Análise de resultados', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`#prova-${key}`)).toBeVisible();
    await expect(titles).toHaveCount(1);
  }
});

test('endereços novos e antigos levam a Análise de resultados e o endereço mostrado é o novo', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const cases = [
    ['resultados', 'resultados'],
    ['simulados', 'simulados'],
    ['inteligencia', 'inteligencia'],
    ['questions', 'resultados'],
    ['simulations', 'simulados'],
    ['exam', 'inteligencia'],
    ['exams', 'inteligencia'],
    ['provas', 'resultados'],
  ];
  for (const [route, shown] of cases) {
    await page.evaluate(hash => {
      window.location.hash = '#desempenho/diagnosis';
      window.location.hash = hash;
    }, `#desempenho/${route}`);
    await expect(page.getByRole('tab', { name: 'Análise de resultados', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(`#desempenho/${shown}`);
  }
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

test('celular: subabas em uma linha, heatmap vira lista de 12 semanas e o contraste passa no axe nos dois temas', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const heights = await page.locator('.performance-section-nav [role=tab]').evaluateAll(tabs => tabs.map(tab => Math.round(tab.getBoundingClientRect().height)));
  expect(new Set(heights).size).toBe(1);
  expect(heights[0]).toBeLessThanOrEqual(48);
  await openPerformanceSection(page, 'consistency');
  const list = page.locator('.heatmap-weekly-mobile');
  await expect(list).toBeVisible();
  await expect(list.locator('li')).toHaveCount(12);
  const rowHeight = await list.locator('li').first().evaluate(row => row.getBoundingClientRect().height);
  expect(rowHeight).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.heatmap-grid-wrap')).toBeHidden();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.locator('#themeToggleBtn').evaluate(node => node.click());
    for (const section of ['overview', 'consistency']) {
      await openPerformanceSection(page, section);
      const axe = await new AxeBuilder({ page }).include('#panel-desempenho').withRules(['color-contrast']).analyze();
      expect(axe.violations).toEqual([]);
    }
  }
});
