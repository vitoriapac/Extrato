import { test, expect } from '@playwright/test';
import { openDemo, activateTab, openPerformanceSection } from './helpers.js';

test('subabas de Desempenho são tablist com setas, Home e End', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');

  const tablist = page.getByRole('tablist', { name: 'Análises de desempenho' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(3)).toHaveText('Resultados das provas');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  // Nomes que não repetem as abas de topo "Visão geral" e "Disciplinas".
  await expect(tabs).toHaveText(['Resumo', 'Por disciplina', 'Diagnóstico', 'Resultados das provas', 'Ritmo e aderência']);
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

test('Provas é uma aba só com três seções, e as rotas antigas levam à seção certa', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await page.getByRole('tab', { name: 'Resultados das provas', exact: true }).click();
  // Sem segundo nível de abas: Questões, Simulados e Inteligência da prova são seções da mesma página.
  await expect(page.locator('#panel-desempenho').getByRole('tablist')).toHaveCount(1);
  await expect(page.locator('#performanceSectionContent .performance-proof__title')).toHaveText([
    'Questões respondidas',
    'Simulados realizados',
    'Inteligência da prova',
  ]);
  for (const route of ['simulations', 'exam']) {
    await page.evaluate(hash => {
      window.location.hash = hash;
    }, `#desempenho/${route}`);
    await expect(page.getByRole('tab', { name: 'Resultados das provas', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.locator(`#prova-${route}`)).toBeInViewport();
  }
});

test('endereços novos e antigos levam a Resultados das provas e o endereço mostrado é o novo', async ({ page }) => {
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
    await expect(page.getByRole('tab', { name: 'Resultados das provas', exact: true })).toHaveAttribute('aria-selected', 'true');
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
