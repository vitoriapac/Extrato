import { test, expect } from '@playwright/test';
import { activateTab, expectNoPageOverflow } from './helpers.js';
import { createDefaultState } from '../../src/state/defaults.js';

const storedColors = page =>
  page.evaluate(() =>
    (JSON.parse(localStorage.getItem('bb-premium-study-data') || 'null')?.subjects || []).map(
      subject => subject.color
    )
  );

test('dados antigos ganham cor por disciplina, editável e persistida, com o nome ao lado', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install({ time: new Date('2026-10-01T12:00:00-03:00') });
  // A v28 save has no subject colors: loading migrates it and assigns one per subject.
  const seed = {
    ...createDefaultState(),
    schemaVersion: 28,
    subjects: ['Português', 'Matemática'].map((name, index) => ({
      id: `color-${index}`,
      name,
      archived: false,
      createdAt: '2026-10-01T12:00:00-03:00',
      topics: [{ id: `color-topic-${index}`, name: 'Tópico', status: 'Não iniciado', archived: false }],
    })),
  };
  await page.addInitScript(value => {
    if (!localStorage.getItem('bb-premium-study-data'))
      localStorage.setItem('bb-premium-study-data', value);
  }, JSON.stringify(seed));
  await page.goto('/');
  await activateTab(page, 'disciplinas');
  const first = page.locator('.subject-block[data-subject-id="color-0"]');
  await expect(first).toHaveAttribute('data-subject-color', '1');
  await expect(page.locator('.subject-block[data-subject-id="color-1"]')).toHaveAttribute(
    'data-subject-color',
    '2'
  );
  // The swatch sits right before the name, so color is never the only cue.
  await expect(first.locator('.subject-color-swatch + .subject-name')).toHaveText('Português');

  await first.locator('.subject-action-menu > summary').click();
  await first.getByRole('combobox', { name: 'Cor de Português' }).selectOption({ label: 'Ameixa' });
  await expect(first).toHaveAttribute('data-subject-color', '8');
  await expectNoPageOverflow(page);
  await page.clock.fastForward('00:00:02');
  await expect.poll(() => storedColors(page)).toEqual([8, 2]);

  await page.reload();
  await activateTab(page, 'disciplinas');
  await expect(page.locator('.subject-block[data-subject-id="color-0"]')).toHaveAttribute(
    'data-subject-color',
    '8'
  );
});

test('backup antigo sem cor é aceito e recebe cor automática; cor inválida é corrigida', async ({
  page,
}) => {
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  const result = await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      backup = structuredClone(api.getState());
    backup.schemaVersion = 28;
    backup.subjects = [
      { id: 'old-a', name: 'A', topics: [] },
      { id: 'old-b', name: 'B', topics: [], color: 99 },
      { id: 'old-c', name: 'C', topics: [], color: 1 },
    ];
    const validation = api.validateBackupData(backup);
    return {
      valid: validation.valid,
      message: validation.message,
      colors: validation.normalized?.subjects.map(subject => subject.color),
    };
  });
  expect(result.valid, result.message).toBe(true);
  expect(result.colors).toEqual([2, 3, 1]);
});
