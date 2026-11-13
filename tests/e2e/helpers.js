import { expect } from '@playwright/test';

export async function openDemo(page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Explorar demonstração/i })
    .first()
    .click();
  await page.getByRole('button', { name: 'Carregar demonstração' }).click();
  await expect(
    page.locator('#demoBanner').getByText('MODO DEMONSTRAÇÃO', { exact: true })
  ).toBeVisible({ timeout: 15_000 });
}
export async function activateTab(page, name) {
  await page.locator(`[data-tab="${name}"]`).evaluate(button => button.click());
  await expect(page.locator(`#panel-${name}`)).toBeVisible();
}
// Só "Questões e provas" tem subabas; as demais seções são abas diretas.
const PERFORMANCE_GROUP = {
  overview: 'overview',
  subjects: 'subjects',
  diagnosis: 'diagnosis',
  questions: 'proofs',
  simulations: 'proofs',
  exam: 'proofs',
  consistency: 'consistency',
  history: 'history',
};
export async function openPerformanceSection(page, section) {
  const button = page.locator(`[data-performance-section="${section}"]`);
  if (!(await button.count()))
    await page
      .locator(`[data-performance-group="${PERFORMANCE_GROUP[section]}"]`)
      .evaluate(element => element.click());
  await button.evaluate(element => element.click());
}
// Conquistas, tempo de estudo e sessões moram na subaba Histórico de Desempenho.
export async function openPerformanceHistory(page) {
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'history');
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
  await page.locator('.subjects-import-menu > button').click();
  await page.getByTestId('open-exam-import').click();
}
export async function selectSubjectCombobox(
  page,
  selector = '#timerSubjectSelect',
  target = { index: 1 }
) {
  const input = page.locator(selector);
  await input.click();
  const inputId = await input.getAttribute('id');
  const listbox = page.locator(`#${inputId}-listbox`);
  await expect(listbox).toBeVisible();
  const option =
    typeof target === 'string'
      ? listbox.locator(`[data-option-value="${target}"]`)
      : listbox.locator('[role="option"]').nth(target.index ?? 1);
  const chosen = {
    value: (await option.getAttribute('data-option-value')) || '',
    text: ((await option.innerText()) || '').trim(),
  };
  await option.click();
  await expect(input).toHaveAttribute('data-selected-value', chosen.value);
  return chosen;
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
// Metas ativas e Disponibilidade ficam num bloco recolhido dentro de Plano da semana.
export async function openPlanningAdjust(page) {
  const fold = page.locator('#metasAdjust');
  if (!(await fold.evaluate(node => node.open))) await fold.locator(':scope > summary').click();
  await expect(page.locator('#metasActiveGoals')).toBeVisible();
}

export async function openPlanningSubtab(page, key) {
  await activateTab(page, 'metas');
  await page.locator(`#metasTab-${key}`).evaluate(button => button.click());
  await expect(page.locator(`#metasSub-${key}`)).toBeVisible();
}

// No celular os filtros de Desempenho ficam recolhidos numa linha; no desktop o botão nem aparece.
export async function openPerformanceFilters(page) {
  const toggle = page.locator('[data-performance-filters-toggle]');
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  }
  await expect(page.locator('#performancePeriod')).toBeVisible();
}

// As dobras de Desempenho lembram o estado: abrir só se ainda estiver fechada, em vez de alternar.
export async function openPerformanceFold(page, title) {
  const fold = page
    .locator('#performanceSectionContent details')
    .filter({ has: page.locator(':scope > summary', { hasText: title }) })
    .first();
  if (!(await fold.evaluate(node => node.open))) await fold.locator(':scope > summary').click();
}
