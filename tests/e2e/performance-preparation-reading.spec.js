import { test, expect } from '@playwright/test';
import {
  activateTab,
  expectNoPageOverflow,
  openDemo,
  openPerformanceSection,
  openPerformanceFilters,
  overviewRecommendationId,
} from './helpers.js';

test('Leitura da preparação usa a mesma recomendação de Hoje e leva ao dono', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  const todayId = await overviewRecommendationId(page);
  await activateTab(page, 'desempenho');
  const reading = page.locator('.performance-reading');
  await expect(reading).toBeVisible();
  await expect(reading.getByRole('heading', { name: 'Como estou' })).toBeVisible();
  await expect(reading.getByRole('heading', { name: 'O que mais pesa' })).toBeVisible();
  await expect(reading.getByRole('heading', { name: 'O que fazer' })).toBeVisible();
  // Um único botão sólido na faixa: abrir no dono da recomendação.
  await expect(reading.locator('.btn:not(.ghost):not(.tertiary)')).toHaveCount(1);
  if (todayId)
    await expect(reading.locator('[data-recommendation-id]')).toHaveAttribute(
      'data-recommendation-id',
      todayId
    );
  await expect(reading).not.toContainText(/porque|garante|graças/i);
  await expectNoPageOverflow(page);
  await reading.getByRole('button', { name: 'Abrir em Hoje' }).click();
  await expect(page.locator('#panel-hoje')).toBeVisible();
});

test('Leitura da preparação cabe em 375 px sem rolagem lateral', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await expect(page.locator('.performance-reading')).toBeVisible();
  const action = page.locator('.performance-reading__todo');
  const readiness = page.locator('.performance-reading__how');
  expect(await action.evaluate((node, other) => Boolean(node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING), await readiness.elementHandle())).toBe(true);
  expect((await action.boundingBox()).y).toBeLessThan((await readiness.boundingBox()).y);
  await expectNoPageOverflow(page);
});

test('Comparação por disciplina mostra o saldo do plano e a âncora do bloco é preservada', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await page.evaluate(() => {
    window.location.hash = '#desempenho/subjects/comparacao';
  });
  const block = page.locator('#bloco-comparacao');
  await expect(block).toBeVisible();
  await expect(block).toBeInViewport();
  expect(await page.evaluate(() => window.location.hash)).toBe('#desempenho/subjects/comparacao');
  await block.locator('summary', { hasText: 'Ver tabela detalhada' }).click();
  await expect(block.getByRole('columnheader', { name: 'Saldo do plano' }).first()).toBeVisible();
  await expect(block.getByRole('columnheader', { name: 'Sugestão' }).first()).toBeVisible();
  await expect(block.locator('tbody td', { hasText: /faltam|sobram/ }).first()).toBeVisible();
});

test('Ajustar plano abre a prévia de ajuste em Metas sem alterar nenhum dado', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const records = () => page.evaluate(() => localStorage.getItem('bb-premium-study-data'));
  const before = await records();
  await page.locator('.performance-reading').getByRole('button', { name: 'Ajustar plano' }).click();
  await expect(page.locator('#panel-metas')).toBeVisible();
  await expect(page.locator('#metasAdjust')).toHaveJSProperty('open', true);
  expect(await records()).toBe(before);
});

test('Copiar link gera a âncora do bloco e o calendário tem alternativa em texto', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const panel = page.locator('#panel-desempenho');
  await expect(panel.getByRole('button', { name: 'Copiar link' })).toHaveCount(1);
  await panel.getByRole('button', { name: 'Copiar link' }).click();
  await expect(panel.getByRole('button', { name: 'Link copiado' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/#desempenho\/overview$/);
  // A âncora de bloco continua valendo na navegação.
  await page.goto(copied.replace(/#.*$/, '#desempenho/overview/leitura'));
  await expect(page.locator('#bloco-leitura')).toBeVisible();
  await openPerformanceSection(page, 'consistency');
  const weekly = page.locator('.heatmap-weekly-text');
  await expect(weekly).toBeVisible();
  await weekly.locator('summary').click();
  await expect(weekly.locator('li').first()).toContainText(
    /Semana de \d{2}\/\d{2}: \d de \d dias?/
  );
});

test('No celular os filtros ficam numa linha e abrem ao tocar em Alterar filtros', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const toolbar = page.locator('#performanceToolbar');
  await expect(toolbar).toHaveAttribute('data-collapsed', 'true');
  await expect(page.locator('#performancePeriod')).toBeHidden();
  await toolbar.getByRole('button', { name: 'Alterar filtros' }).click();
  await expect(page.locator('#performancePeriod')).toBeVisible();
  await expect(toolbar.getByRole('button', { name: 'Recolher filtros' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
});

test('Dobras de Desempenho continuam abertas quando a tela é redesenhada', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const fold = page.locator('#performanceSectionContent details', {
    has: page.locator(':scope > summary', { hasText: 'Prontidão, trajetória e carga' }),
  });
  await fold.locator(':scope > summary').click();
  await expect(fold).toHaveJSProperty('open', true);
  // Trocar o período redesenha a tela; a dobra aberta não pode fechar.
  await openPerformanceFilters(page);
  await page.locator('#performancePeriod').selectOption('90');
  await expect(
    page.locator('#performanceSectionContent details', {
      has: page.locator(':scope > summary', { hasText: 'Prontidão, trajetória e carga' }),
    })
  ).toHaveJSProperty('open', true);
});

test('Diagnóstico recebe Matriz, ordenações (Balanço, Radar) e Queda; Por disciplina fica enxuta', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'subjects');
  await expect(page.locator('#bloco-comparacao')).toBeVisible();
  await expect(page.locator('#bloco-matriz')).toHaveCount(0);
  await expect(page.locator('#performanceDecisionDetails')).toBeHidden();
  const subjectsHeight = await page
    .locator('#performanceSectionContent')
    .evaluate(node => node.getBoundingClientRect().height);
  expect(subjectsHeight).toBeLessThan(3200);
  await openPerformanceSection(page, 'diagnosis');
  await expect(page.locator('#bloco-matriz')).toBeVisible();
  const balance = page.locator('#performanceDecisionDetails');
  await expect(balance).toBeVisible();
  // Nasce fechada, mas lembra se foi aberta.
  await expect(balance).toHaveJSProperty('open', false);
  await balance.locator(':scope > summary').click();
  // Balanço e Radar viraram ordenações do Extrato.
  await expect(page.getByRole('heading', { name: /Radar de Vulnerabilidades|Balanço: Tempo/ })).toHaveCount(0);
  await page.locator('[data-diagnosis-filter=sort]').selectOption('allocation');
  await expect(page.locator('.diagnosis-group > summary').first()).toContainText('edital');
  await page.locator('[data-diagnosis-filter=sort]').selectOption('vulnerable');
  await expect(page.locator('.diagnosis-group > summary').first()).toContainText('críticos');
  await expect(
    page.getByRole('heading', { name: /Queda de retenção entre avaliações/ })
  ).toBeVisible();
});

test('Aderência fica numa dobra que não fecha ao trocar a semana, e os filtros da prova lembram o estado', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'consistency');
  const fold = page
    .locator('#performanceSectionContent details')
    .filter({ has: page.locator(':scope > summary', { hasText: 'Como o plano foi cumprido' }) })
    .first();
  // Abre por padrão (é o centro de Ritmo), e a memória das dobras continua valendo.
  await expect(fold).toHaveJSProperty('open', true);
  await openPerformanceSection(page, 'exam');
  const filters = page.locator('details.exam-matrix-filters-fold');
  await expect(filters).toHaveJSProperty('open', false);
  await filters.locator(':scope > summary').click();
  await page.locator('[data-exam-matrix-filter="sort"]').selectOption('impact');
  await expect(page.locator('details.exam-matrix-filters-fold')).toHaveJSProperty('open', true);
});

test('No celular a ação "Abrir em Hoje" aparece até a primeira tela e a Leitura mantém a ordem', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const reading = page.locator('.performance-reading');
  await expect(reading).toBeVisible();
  const button = reading.getByRole('button', { name: 'Abrir em Hoje' });
  const box = await button.evaluate(node => node.getBoundingClientRect().top + window.scrollY);
  expect(box).toBeLessThan(900);
  const order = await reading.locator('.performance-reading__grid > section').evaluateAll(nodes =>
    nodes
      .map(node => ({
        name: node.className.replace('performance-reading__', ''),
        y: node.getBoundingClientRect().top,
      }))
      .sort((a, b) => a.y - b.y)
      .map(item => item.name)
  );
  expect(order).toEqual(['todo', 'how', 'pull', 'support-block']);
  await expectNoPageOverflow(page);
});

test('Blocos analíticos mostram o selo de evidência quando falta amostra', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  // Confiança baixa da faixa já está escrita no texto: o selo de evidência só entra por amostra pequena.
  await expect(page.locator('#bloco-resumo .performance-evidence')).toHaveCount(0);
  await openPerformanceSection(page, 'subjects');
  await expect(page.locator('#bloco-comparacao .performance-evidence')).toBeVisible();
});

test('Resumo dos últimos 7 dias aparece aberto abaixo da Leitura, com selo e sem cartões antigos', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const week = page.locator('#bloco-resumo');
  await expect(week).toBeVisible();
  await expect(week.locator('[data-window="sevenDays"]')).toBeVisible();
  await expect(week.locator('p')).toHaveCount(3);
  await expect(week).toContainText(/Você estudou .* em \d+ dias?/);
  await expect(week).toContainText(/A próxima ação/);
  await expect(page.locator('#panel-desempenho')).not.toContainText('Resumo do período');
  await expect(page.locator('#panel-desempenho')).not.toContainText('Meta e última semana');
  // A linha de ritmo de 7 dias vive só no resumo; a Leitura não a repete.
  await expect(page.locator('.performance-reading [data-window="sevenDays"]')).toHaveCount(0);
  const order = await page.evaluate(() => {
    const reading = document.querySelector('.performance-reading');
    const summary = document.querySelector('#bloco-resumo');
    return Boolean(reading && summary && reading.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
});

test('A projeção até a prova mora em Simulados; a Visão geral mostra a faixa numa linha com link', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await expect(page.locator('.achievement-projection')).toHaveCount(0);
  const line = page.locator('.performance-reading__support', { hasText: 'Faixa projetada' });
  await expect(line).toContainText(/\d+% a \d+%/);
  await line.getByRole('button', { name: 'Ver em Simulados' }).click();
  await expect(page.locator('#performanceTab-questions')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#prova-simulations')).toBeInViewport();
  await expect(page.locator('.achievement-projection')).toBeVisible();
});

test('"O que mais pesa" segue a mesma ordem dos cards do Diagnóstico', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  const pulled = await page.locator('.performance-reading__list li span').allInnerTexts();
  const topics = pulled.map(text => /—\s*([^:]+):/.exec(text)?.[1]?.trim()).filter(Boolean);
  expect(topics.length).toBeGreaterThan(0);
  await openPerformanceSection(page, 'diagnosis');
  // O Diagnóstico agrupa por disciplina, mas cada cartão leva o seu lugar na fila: é ele que a Leitura segue.
  const ranked = await page.evaluate(() => {
    const root = document.querySelector('#diagnosisCenter');
    for (let i = 0; i < 3; i++)
      root.querySelectorAll('template[data-lazy]').forEach(template => template.replaceWith(template.content));
    return [...root.querySelectorAll('.consolidated-diagnosis-row')].map(row => ({
      rank: Number(/^(\d+)/.exec(row.querySelector('.diagnostic-kicker').textContent)[1]),
      name: row.querySelector('.diagnostic-row-identity strong').textContent,
    }));
  });
  const positions = topics.map(topic => ranked.find(card => card.name === topic)?.rank ?? -1);
  expect(positions.every(position => position > 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
});
