import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceSection } from './helpers.js';

const SECTIONS = ['overview', 'questions', 'simulations', 'subjects', 'diagnosis', 'consistency'];

// Regra de tamanho (Tarefa 16): gráfico na largura do cartão, sem rolagem lateral, texto de 12 a 13 px.
test('gráficos de Desempenho ficam dentro do cartão, sem rolagem, com texto legível', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await openDemo(page);
  for (const width of [1440, 1024, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await activateTab(page, 'desempenho');
    for (const section of SECTIONS) {
      await openPerformanceSection(page, section);
      await page.evaluate(() =>
        document.querySelectorAll('#panel-desempenho details').forEach(d => (d.open = true))
      );
      await page.waitForTimeout(250);
      const problems = await page.evaluate(() => {
        const found = [];
        document.querySelectorAll('#panel-desempenho svg').forEach(svg => {
          const box = svg.getBoundingClientRect();
          const view = svg.viewBox?.baseVal;
          if (!box.width || svg.closest('[hidden]') || !view || view.width < 250) return;
          const card = svg.closest('.chart-card, .performance-block, .chart-frame, section, article');
          const limit = (card || svg.parentElement).getBoundingClientRect();
          const label = svg.getAttribute('aria-label') || svg.parentElement.className.toString();
          if (box.right > limit.right + 1) found.push(`${label}: passa do cartão`);
          if (!svg.classList.contains('chart-fit')) found.push(`${label}: sem ajuste`);
          const scale = box.width / view.width;
          const fonts = [...svg.querySelectorAll('text')].map(
            t => parseFloat(getComputedStyle(t).fontSize) * scale
          );
          if (fonts.length && Math.min(...fonts) < 11.5) found.push(`${label}: texto de ${Math.min(...fonts)} px`);
          for (let el = svg.parentElement; el && el !== card; el = el.parentElement)
            if (el.scrollWidth > el.clientWidth + 1 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX))
              found.push(`${label}: rolagem lateral`);
        });
        return found;
      });
      expect(problems, `${section} em ${width}px`).toEqual([]);
    }
  }
});

test('série com menos de 3 simulados vira texto, sem gráfico', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'simulations');
  const frame = page.locator('.chart-frame', { hasText: 'Evolução dos simulados' });
  await expect(frame.locator('svg.progress-chart-svg')).toHaveCount(0);
  await expect(frame).toContainText(/Com 2 simulados ainda não há tendência/);
  await expect(frame.locator('.simulation-trend-list li')).toHaveCount(2);
});
