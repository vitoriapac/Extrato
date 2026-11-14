import { test, expect } from '@playwright/test';
import { activateTab, openDemo } from './helpers.js';

// O modo de teste restaura o estado inicial depois do relatório; marca a primeira leitura como feita,
// como acontece no app real logo ao carregar.
async function startAfterFirstRead(page) {
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    window.__EXTRATO_TEST__.getState().achievementsBaselined = true;
  });
}

async function finishQuestionSession(page) {
  await activateTab(page, 'hoje');
  await page.locator('#timerTypeSelect').selectOption('questions');
  await page.locator('#timerStartBtn').click();
  await expect.poll(() => page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible({ timeout: 10000 });
  await page.locator('#sessionModalResolved').fill('10');
  await page.locator('#sessionModalCorrect').fill('7');
  await page.locator('#sessionModalSaveBtn').click();
}

test('a primeira sessão desbloqueia uma conquista, avisa uma vez e grava a data', async ({
  page,
}) => {
  await startAfterFirstRead(page);
  await finishQuestionSession(page);

  const toast = page.locator('#achievementToast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Conquista desbloqueada: Primeiros passos');
  await expect(toast).toHaveAttribute('role', 'status');

  const unlock = await page.evaluate(
    () => window.__EXTRATO_TEST__.getState().achievementUnlocks.firstSession
  );
  expect(unlock.source).toBe('live');
  expect(unlock.unlockedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.keyboard.press('Escape');
  await expect(toast).toBeHidden();

  // Uma segunda sessão não repete o aviso da mesma conquista.
  await finishQuestionSession(page);
  await page.waitForTimeout(500);
  await expect(page.locator('#achievementToast')).toHaveCount(0);
});

test('o botão fechar dispensa o aviso de conquista', async ({ page }) => {
  await startAfterFirstRead(page);
  await finishQuestionSession(page);
  const toast = page.locator('#achievementToast');
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Fechar aviso de conquista' }).click();
  await expect(toast).toBeHidden();
});

test('entrar na demonstração não dispara avisos de conquistas antigas', async ({ page }) => {
  await openDemo(page);
  await page.waitForTimeout(1500);
  await expect(page.locator('#achievementToast')).toHaveCount(0);
  const sources = await page.evaluate(() => {
    const unlocks = window.__EXTRATO_TEST__?.getState?.().achievementUnlocks;
    return unlocks ? [...new Set(Object.values(unlocks).map(item => item.source))] : null;
  });
  if (sources) expect(sources.every(source => source === 'migrated')).toBe(true);
});

test('o resultado da sessão mostra a conquista ganha ou a mais perto', async ({ page }) => {
  await startAfterFirstRead(page);
  await finishQuestionSession(page);
  const note = page.locator('#sessionResult [data-achievement-note]');
  await expect(note).toBeVisible();
  await expect(note).toContainText('Primeiros passos');
  await expect(note).toHaveAttribute('data-achievement-note', 'unlocked');
});
