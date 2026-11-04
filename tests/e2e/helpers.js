import { expect } from '@playwright/test';

export async function openDemo(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Explorar demonstração/i }).first().click();
  await page.getByRole('button', { name: 'Carregar demonstração' }).click();
  await expect(
    page.locator('#demoBanner').getByText('MODO DEMONSTRAÇÃO', { exact: true })
  ).toBeVisible({ timeout: 15_000 });
}
export async function activateTab(page, name) {
  await page.locator(`[data-tab="${name}"]`).evaluate(button => button.click());
  await expect(page.locator(`#panel-${name}`)).toBeVisible();
}
// Conquistas, tempo de estudo e sessões moram na subaba Histórico de Desempenho.
export async function openPerformanceHistory(page) {
  await activateTab(page, 'desempenho');
  await page.locator('[data-performance-section="history"]').evaluate(button => button.click());
  await expect(page.locator('#panel-desempenho')).toHaveAttribute(
    'data-performance-view',
    'history'
  );
}
// The overview card is either the recommendation itself or a pending plan item carrying it as a suggestion line.
export async function overviewRecommendationId(page) {
  return page
    .locator('#overviewNextAction .overview-action-card')
    .evaluate(card => card.dataset.studyActionId || card.dataset.recommendationActionId || null);
}
export async function openExamImport(page) {
  await page.locator('.subjects-import-menu summary').click();
  await page.getByTestId('open-exam-import').click();
}
export async function expectNoPageOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    page: document.documentElement.scrollWidth,
    tab: document.querySelector('.tab-btn.active')?.dataset.tab,
  }));
  if (dimensions.page > dimensions.viewport) {
    const wide = await page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter(element => {
          const box = element.getBoundingClientRect(),
            style = getComputedStyle(element);
          return style.position !== 'fixed' && box.right > innerWidth + 2 && box.width > 0;
        })
        .slice(0, 8)
        .map(
          element =>
            `${element.tagName.toLowerCase()}#${element.id}.${String(element.className).split(' ').slice(0, 2).join('.')}`
        )
    );
    expect(
      dimensions.page,
      `Aba ${dimensions.tab}; elementos excedentes: ${wide.join(', ')}`
    ).toBeLessThanOrEqual(dimensions.viewport);
  }
}
// Planejamento shows one sub-tab at a time (F1): semana, prova, metas, fechamento or historico.
export async function openPlanningSubtab(page, key) {
  await activateTab(page, 'metas');
  await page.locator(`#metasTab-${key}`).evaluate(button => button.click());
  await expect(page.locator(`#metasSub-${key}`)).toBeVisible();
}
