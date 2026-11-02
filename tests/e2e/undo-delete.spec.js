import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

// "Exibindo 5 de 81 registros" → 81
const questionTotal = async page =>
  Number(
    (await page.locator('#questoesBody').innerText()).match(/de\s+([\d.]+)\s+registros/)[1].replace('.', '')
  );

async function deleteFirstQuestion(page) {
  await page.locator('#questoesBody').getByRole('button', { name: 'Editar' }).first().click();
  await page.locator('#questoesBody tr.row-editing').getByRole('button', { name: 'Excluir' }).click();
}

test('excluir registro de questões não pergunta e o Desfazer restaura depois do salvamento', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'questoes');
  const total = await questionTotal(page);
  const firstRow = (await page.locator('#questoesBody tr').first().textContent()).replace(/s+/g, ' ');
  await deleteFirstQuestion(page);
  await expect(page.locator('#modalOverlay')).toBeHidden();
  const toast = page.locator('#toast');
  await expect(toast).toContainText('Registro excluído.');
  await expect.poll(() => questionTotal(page)).toBe(total - 1);
  // Let the debounced autosave run before undoing.
  await page.waitForTimeout(800);
  await toast.getByRole('button', { name: 'Desfazer' }).click();
  await expect(toast).toContainText('Exclusão desfeita.');
  await expect.poll(() => questionTotal(page)).toBe(total);
  await expect
    .poll(async () => (await page.locator('#questoesBody tr').first().textContent()).replace(/s+/g, ' '))
    .toBe(firstRow);
});

test('Ctrl+Z desfaz a exclusão enquanto o aviso está aberto', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'questoes');
  const total = await questionTotal(page);
  await deleteFirstQuestion(page);
  await expect(page.locator('#toast')).toContainText('Registro excluído.');
  await page.locator('body').press('Control+z');
  await expect(page.locator('#toast')).toContainText('Exclusão desfeita.');
  await expect.poll(() => questionTotal(page)).toBe(total);
});
