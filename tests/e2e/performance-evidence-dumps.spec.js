import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceFold, openPerformanceSection } from './helpers.js';

test('T49: tópicos sem evidência viram contagem e caminho, não listas de centenas de linhas', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');

  // Inteligência da prova: a lista de "sem evidência para posicionar" não é despejada.
  await openPerformanceSection(page, 'exam');
  // As dobras de Desempenho nascem fechadas (T49 a T55): o quadrante só é visível depois de abrir a sua.
  await openPerformanceFold(page, 'Quadrantes de incidência × domínio');
  const insufficient = page.locator('.incidence-quadrant', {
    hasText: 'Sem evidência suficiente para posicionar',
  });
  await expect(insufficient).toContainText(/tópicos ainda não têm domínio medido/);
  await expect(insufficient.locator('.exam-matrix-topic')).toHaveCount(0);
  await expect(insufficient.getByRole('button', { name: 'Abrir o Diagnóstico' })).toBeVisible();
  const examHeight = await page.locator('#panel-desempenho').evaluate(node => node.scrollHeight);
  expect(examHeight).toBeLessThan(6000);
  // Nenhum grupo posicionado mostra mais de 15 tópicos (5 + 10).
  for (const group of await page.locator('.incidence-quadrant').all()) {
    await group
      .locator('details.performance-more > summary')
      .evaluateAll(nodes => nodes.forEach(node => node.click()));
    expect(await group.locator('.exam-matrix-topic').count()).toBeLessThanOrEqual(15);
  }

  // Diagnóstico: um aviso só, e o filtro mostra todos.
  await openPerformanceSection(page, 'diagnosis');
  const note = page.locator('.diagnosis-unseen-note');
  await expect(note).toBeVisible();
  await expect(
    page.locator('.diagnosis-group details.performance-more > summary', {
      hasText: 'Sem evidência',
    })
  ).toHaveCount(0);
  const total = Number((await note.locator('strong').innerText()).trim());
  expect(total).toBeGreaterThan(0);
  await note.getByRole('button', { name: /^Ver os / }).click();
  await expect(page.locator('[data-diagnosis-filter=severity]')).not.toHaveValue('all');
  await expect(page.locator('.diagnosis-unseen-note')).toHaveCount(0);
  // Todos os tópicos sem evidência estão alcançáveis com o filtro (cada grupo abre sua lista).
  await page
    .locator('.diagnosis-group > summary')
    .evaluateAll(nodes => nodes.forEach(node => node.parentElement.setAttribute('open', '')));
  await page
    .locator('.diagnosis-group template[data-lazy]')
    .evaluateAll(nodes => nodes.forEach(node => node.replaceWith(node.content.cloneNode(true))));
  await expect(page.locator('.consolidated-diagnosis-row')).toHaveCount(total);
  await page.getByRole('button', { name: 'Restaurar padrão' }).click();
  await expect(page.locator('.diagnosis-unseen-note')).toBeVisible();
});

test('T50: uma só dobra explica a faixa, com a calibração dentro', async ({ page }) => {
  test.setTimeout(120_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'simulations');
  const explanations = page.locator('.achievement-projection__details > summary');
  await expect(explanations.filter({ hasText: 'Como a faixa foi calculada' })).toHaveCount(1);
  await expect(page.getByText('Como ler: esta projeção')).toHaveCount(0);
  await expect(page.getByText('Como ler: faixa, confiança e limites')).toHaveCount(0);
  await expect(page.getByText('Como a faixa foi calculada e calibrada')).toHaveCount(0);
  const fold = page.locator('.achievement-projection__details', {
    has: page.locator(':scope > summary', { hasText: 'Como a faixa foi calculada' }),
  });
  await fold.locator(':scope > summary').click();
  await expect(fold.locator('.projection-evidence-method')).toBeVisible();
  await expect(fold.locator('#simulationsCalibrationMount .readiness-calibration')).toBeVisible();
  await expect(fold.locator('.readiness-investigation')).toHaveCount(0);
});
