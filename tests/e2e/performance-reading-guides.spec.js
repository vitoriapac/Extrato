import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceSection } from './helpers.js';

const guides = page =>
  page.locator('#performanceSectionContent details > summary', { hasText: /^Como ler esta aba$/ });
const oldLimits = page =>
  page.locator('#performanceSectionContent details > summary', { hasText: /^Como ler: limites$/ });

test('T51: cada subaba tem um "Como ler esta aba" e nenhum "Como ler: limites" solto', async ({ page }) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  for (const [section, expected] of [
    ['overview', 0],
    ['subjects', 1],
    ['diagnosis', 1],
    ['exam', 1],
  ]) {
    await openPerformanceSection(page, section);
    await expect(guides(page), section).toHaveCount(expected);
    await expect(oldLimits(page), section).toHaveCount(0);
  }
  await openPerformanceSection(page, 'diagnosis');
  await expect(page.getByText('Como ler: sinais de preparação e critérios')).toHaveCount(0);
  const guide = page.locator('#performanceSectionContent details', {
    has: page.locator(':scope > summary', { hasText: /^Como ler esta aba$/ }),
  });
  await guide.locator(':scope > summary').click();
  await expect(guide).toContainText('A contagem não altera automaticamente o plano');
});

test('T52: sem as redundâncias de Resumo, Diagnóstico e Simulados', async ({ page }) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');

  await openPerformanceSection(page, 'overview');
  const content = page.locator('#performanceSectionContent');
  await expect(content.locator('details > summary', { hasText: /^Principais mudanças$/ })).toHaveCount(1);
  for (const gone of ['Comparação e principais mudanças', 'Período atual × anterior', 'Carga e aderência ao plano'])
    await expect(content.getByText(gone)).toHaveCount(0);

  await openPerformanceSection(page, 'diagnosis');
  await expect(page.getByText('Visão complementar: lacunas e retenção por tópico')).toHaveCount(0);
  await expect(content.locator('details > summary', { hasText: /^Retenção por tópico$/ }).or(page.locator('#desempenho-gaps > summary', { hasText: 'Retenção por tópico' }))).not.toHaveCount(0);
  await expect(page.locator('#performanceSectionContent #gapMapDashboard')).toHaveCount(0);
  // O cartão não repete "Coletar evidência" no "Ver evidências"; os cartões sem nada a abrir não têm a dobra.
  await page.locator('.diagnosis-group[open] .diagnostic-detail > summary').evaluateAll(nodes => nodes.forEach(node => node.click()));
  await expect(page.locator('.diagnostic-detail__body', { hasText: 'A evidência pessoal ainda é limitada' })).toHaveCount(0);

  await openPerformanceSection(page, 'simulations');
  await expect(page.locator('.achievement-projection__details > summary', { hasText: 'Histórico da trajetória' })).toHaveCount(0);
  await expect(page.locator('.achievement-projection__history-line')).toContainText('Último registro da trajetória');
});

test('T53: comparação entre disciplinas em tabela (padrão) ou barras, uma visão por vez', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'subjects');
  const block = page.locator('#bloco-comparacao');
  await expect(block.getByRole('button', { name: 'Tabela' })).toHaveAttribute('aria-pressed', 'true');
  await expect(block.locator('table').first()).toBeVisible();
  await expect(block.locator('.subject-precision-bar')).toHaveCount(0);
  await expect(page.getByText('Ver tabela detalhada')).toHaveCount(0);
  await block.getByRole('button', { name: 'Barras' }).click();
  await expect(block.getByRole('button', { name: 'Barras' })).toHaveAttribute('aria-pressed', 'true');
  await expect(block.locator('.subject-precision-bar').first()).toBeVisible();
  await expect(block.locator('table')).toHaveCount(0);
  // A escolha sobrevive à troca de período.
  await page.locator('#performancePeriod').selectOption('90').catch(() => {});
  await expect(page.locator('#bloco-comparacao').getByRole('button', { name: 'Barras' })).toHaveAttribute('aria-pressed', 'true');
});

test('T54: definições junto do termo, filtros no mesmo padrão e a referência de carreira em Planejamento', async ({ page }) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'overview');
  await expect(page.getByText('Definições de Prontidão, domínio, retenção e aderência')).toHaveCount(0);
  const hint = page.locator('.performance-reading [data-term="prontidao"] .term-hint');
  await expect(hint).toBeVisible();
  await hint.click();
  await expect(page.locator('.performance-reading .term-hint-text').first()).toContainText('Não é chance de aprovação');

  await openPerformanceSection(page, 'consistency');
  await expect(page.getByText('Turnos de estudo')).toBeVisible();
  await expect(page.locator('#careerClusterSelect')).toBeHidden();
  await expect(page.getByText('Sugestão de cursinhos')).toHaveCount(0);

  await openPerformanceSection(page, 'exam');
  const filters = page.locator('details.exam-matrix-more-filters');
  await expect(filters).toHaveJSProperty('open', false);
  await expect(filters.locator('summary')).toHaveText(/^Filtros/);

  await activateTab(page, 'metas');
  await page.evaluate(() => {
    window.location.hash = '#planejamento/prova';
  });
  const fold = page.locator('#careerBenchmarkFold');
  await expect(fold).toBeVisible();
  await fold.locator(':scope > summary').click();
  await expect(fold.locator('#careerClusterSelect')).toBeVisible();
});
