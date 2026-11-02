import { test, expect } from '@playwright/test';
import { activateTab } from './helpers.js';
import { createDefaultState } from '../../src/state/defaults.js';

// Real mode (no ?test=1): the only path that boots through loadState.
const stored = page =>
  page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('bb-premium-study-data') || 'null');
    return (
      value && {
        sessions: value.studySessions.length,
        subjectCreatedAt: value.subjects[0]?.createdAt,
      }
    );
  });

test('recarregar com hash de aba mantém sessões salvas', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00-03:00') });
  // A first run has no subjects; seed one before boot so loadState reads it from storage.
  const seed = {
    ...createDefaultState(),
    subjects: [
      {
        id: 'reload-subject',
        name: 'Português',
        archived: false,
        createdAt: '2026-10-01T12:00:00-03:00',
        topics: [{ id: 'reload-topic', name: 'Crase', status: 'Não iniciado', archived: false }],
      },
    ],
  };
  await page.addInitScript(value => {
    if (!localStorage.getItem('bb-premium-study-data'))
      localStorage.setItem('bb-premium-study-data', value);
  }, JSON.stringify(seed));
  await page.goto('/');
  await activateTab(page, 'hoje');
  await page.locator('#timerSubjectSelect').selectOption({ index: 1 });
  await page.locator('#timerTopicSelect').selectOption({ index: 1 });
  await page.locator('#timerStartBtn').click();
  await page.clock.fastForward('00:05:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();
  await page.locator('#sessionModalSaveBtn').click();
  await page.clock.fastForward('00:00:02');
  const saved = await stored(page);
  expect(saved.sessions).toBe(1);
  expect(new URL(page.url()).hash).toBe('#hoje');

  await page.reload();
  await expect(page.locator('#panel-hoje')).toBeVisible();
  await page.clock.fastForward('00:00:02');
  expect(await stored(page)).toEqual(saved);
});
