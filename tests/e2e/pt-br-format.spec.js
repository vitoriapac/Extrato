import { test, expect } from '@playwright/test';
import { activateTab, openDemo } from './helpers.js';

// Rendered copy must use pt-BR formats: comma decimals, DD/MM/AAAA dates and no seconds in timestamps.
const PATTERNS = [
  ['decimal com ponto', /(?<![\d.,/:-])\d{1,3}\.\d{1,2}(?![\d.])/g],
  ['data ISO', /\b\d{4}-\d{2}-\d{2}\b/g],
  ['horário com segundos', /\b\d{2}:\d{2}:\d{2}\b/g],
];

test('textos da demo usam números, datas e horários no formato brasileiro', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await openDemo(page);
  const findings = [];
  for (const tab of [
    'dashboard',
    'hoje',
    'desempenho',
    'disciplinas',
    'calendario',
    'agenda',
    'questoes',
    'metas',
    'instrucoes',
  ]) {
    await activateTab(page, tab);
    const sections =
      tab === 'desempenho'
        ? await page
            .locator('[data-performance-section]')
            .evaluateAll(nodes => nodes.map(node => node.dataset.performanceSection))
        : [null];
    for (const section of sections) {
      if (section)
        await page
          .locator(`[data-performance-section="${section}"]`)
          .evaluate(button => button.click());
      const text = await page.locator(`#panel-${tab}`).evaluate(panel => {
        panel.querySelectorAll('details').forEach(node => {
          node.open = true;
        });
        return panel.innerText;
      });
      for (const [label, pattern] of PATTERNS)
        for (const match of text.matchAll(pattern)) {
          const context = text
            .slice(Math.max(0, match.index - 40), match.index + match[0].length + 20)
            .replace(/\s+/g, ' ');
          findings.push(`${tab}${section ? '/' + section : ''} · ${label}: …${context}…`);
        }
    }
  }
  expect([...new Set(findings)]).toEqual([]);
});

test('Visão Geral e Desempenho mostram a mesma precisão e os mesmos simulados comparáveis', async ({
  page,
}) => {
  await openDemo(page);
  const kpi = label =>
    page.locator('#kpiGrid .kpi-cell').filter({ hasText: label }).locator('.n').innerText();
  const accuracy = await kpi('Precisão · 30 dias'),
    simulations = await kpi('Simulados comparáveis');
  await activateTab(page, 'desempenho');
  await expect(page.locator('#panel-desempenho')).toContainText(accuracy);
  await expect(page.locator('#panel-desempenho .achievement-projection__metrics')).toContainText(
    simulations
  );
});
