import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceSection } from './helpers.js';

// Abre tudo (inclusive o que espera a hidratação) e devolve o maior nível de <details> aninhados e a contagem por dobra.
const measure = page =>
  page.evaluate(() => {
    const root = document.getElementById('performanceSectionContent');
    for (let k = 0; k < 5; k++) {
      root.querySelectorAll('details:not([open])').forEach(node => {
        node.open = true;
      });
      root.querySelectorAll('template[data-lazy]').forEach(node => node.replaceWith(node.content.cloneNode(true)));
    }
    let max = 1;
    root.querySelectorAll('details').forEach(node => {
      // A "dobra" que envolve a subaba Diagnóstico é só a casca: o resumo dela fica oculto por CSS.
      if (node.classList.contains('today-analysis-details')) return;
      let depth = 1,
        parent = node.parentElement;
      while (parent && parent !== root) {
        if (parent.tagName === 'DETAILS' && !parent.classList.contains('today-analysis-details')) depth++;
        parent = parent.parentElement;
      }
      max = Math.max(max, depth);
    });
    return max;
  });

test('T55: nenhuma subaba de Desempenho tem mais de dois níveis de dobras', async ({ page }) => {
  test.setTimeout(240_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  for (const section of ['overview', 'subjects', 'diagnosis', 'questions', 'simulations', 'exam', 'consistency']) {
    await openPerformanceSection(page, section);
    expect(await measure(page), section).toBeLessThanOrEqual(2);
  }
});

test('T55: Como o plano foi cumprido tem blocos abertos e no máximo 3 dobras internas', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'consistency');
  const fold = page.locator('details.adherence-fold');
  await fold.locator(':scope > summary').click();
  // Semanas e disciplinas são blocos, não dobras: a execução por semana aparece ao abrir.
  await expect(fold.getByRole('heading', { name: 'Execução por semana' })).toBeVisible();
  await expect(fold.getByRole('heading', { name: 'Aderência por disciplina' })).toBeVisible();
  await expect(fold.locator('.adherence-week-list > li:visible').first()).toBeVisible();
  expect(await fold.locator('details').count()).toBeLessThanOrEqual(3);
});
