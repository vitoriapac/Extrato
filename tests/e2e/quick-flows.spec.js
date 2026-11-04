import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

test.describe('no celular', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('aviso curto ocupa uma linha logo acima da barra inferior (F2)', async ({ page }) => {
    await openDemo(page);
    await page.evaluate(() => {
      const toast = document.getElementById('toast');
      toast.textContent = 'O cronômetro ainda não começou.';
      toast.classList.add('show');
    });
    const toast = await page.locator('#toast').boundingBox();
    const bar = await page.locator('.primary-nav-shell').boundingBox();
    expect(toast.height).toBeLessThan(40);
    expect(toast.y + toast.height).toBeLessThanOrEqual(bar.y);
    expect(bar.y - (toast.y + toast.height)).toBeLessThan(16);
  });

  test('botão Filtros abre e fecha os filtros da Agenda no celular', async ({ page }) => {
    await openDemo(page);
    await activateTab(page, 'agenda');
    const toggle = page.locator('#panel-agenda .mobile-filter-toggle');
    const panel = page.locator('#agendaFilters');
    await expect(panel).toBeHidden();
    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(panel).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('a lupa abre a paleta de comandos (F3)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#globalSearchInput')).toBeHidden();
    await page.getByRole('button', { name: 'Buscar ações, páginas e tópicos' }).click();
    await expect(page.locator('#globalSearchInput')).toBeFocused();
    await expect(page.locator('#globalSearchResults')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#globalSearchInput')).toBeHidden();
  });

  test('registrar questões abre um painel inferior com mais e menos (F4)', async ({ page }) => {
    await openDemo(page);
    await activateTab(page, 'questoes');
    await page.locator('#addQuestaoRowBtn').click();
    const form = page.locator('#questoesBody tr.row-editing .inline-edit-form');
    const box = await form.boundingBox();
    expect(Math.round(box.y + box.height)).toBe(812);
    await expect(page.locator('#questionDraft-resolved')).toHaveAttribute('inputmode', 'numeric');
    await form.getByRole('button', { name: 'Resolvidas: mais uma' }).click();
    await form.getByRole('button', { name: 'Resolvidas: mais uma' }).click();
    for (let i = 0; i < 4; i++) await form.getByRole('button', { name: 'Acertos: mais uma' }).click();
    await expect(page.locator('#questionDraft-correct')).toHaveValue('2');
    await page.locator('#questionDraft-resolved').fill('1');
    await expect(page.locator('#questionDraft-correct')).toHaveValue('1');
  });
});

test('novo registro de questões começa na disciplina do último registro (F4)', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'questoes');
  await page.locator('#addQuestaoRowBtn').click();
  const subject = page.locator('#questoesBody tr.row-editing select').first();
  const chosen = await subject.locator('option').nth(3).getAttribute('value');
  await subject.selectOption(chosen);
  await page.locator('#questoesBody tr.row-editing').getByRole('button', { name: 'Salvar alterações' }).click();
  await page.locator('#addQuestaoRowBtn').click();
  await expect(page.locator('#questoesBody tr.row-editing select').first()).toHaveValue(chosen);
});

test('Ctrl+K continua abrindo a busca no desktop (F3)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#globalSearchOpenBtn')).toBeHidden();
  await page.locator('body').press('Control+k');
  await expect(page.locator('#globalSearchInput')).toBeFocused();
});

test('resultado da sessão mostra prontidão e meta do dia e meta do dia (F5)', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'hoje');
  await page.locator('#timerSubjectSelect').selectOption({ index: 1 });
  await page.locator('#timerTopicSelect').selectOption({ index: 1 });
  await page.locator('#timerStartBtn').click();
  await expect(page.locator('#timerFinishBtn')).toBeEnabled();
  await page.locator('#timerFinishBtn').click();
  await page.locator('#sessionModalDurationMinutes').fill('40');
  await page.locator('#sessionModalSaveBtn').click();
  const effects = page.locator('#sessionResult .session-effects');
  await expect(effects).toContainText('Prontidão');
  await expect(effects).toContainText('Meta do dia');
});

test('Alex (Power User) — encadeamento pós-sessão de estudo para questões do mesmo tópico', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'hoje');
  await page.locator('#timerSubjectSelect').selectOption({ index: 1 });
  await page.locator('#timerTopicSelect').selectOption({ index: 1 });
  await page.locator('#timerStartBtn').click();
  await page.locator('#timerFinishBtn').click();
  await page.locator('#sessionModalSaveBtn').click();

  const chainBtn = page.locator('#sessionResult .chain-questions-btn');
  await expect(chainBtn).toBeVisible();
  await expect(chainBtn).toContainText('Registrar questões deste tópico');
  await chainBtn.click();

  await expect(page.locator('#panel-questoes')).toBeVisible();
  await expect(page.locator('#questionDraft-resolved')).toBeVisible();
  await expect(page.locator('#questionDraft-resolved')).toBeFocused();
});

