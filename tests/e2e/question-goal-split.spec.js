import { test, expect } from '@playwright/test';
import { openDemo, openPlanningSubtab } from './helpers.js';

// A soma vem da legenda da própria tabela, o que a pessoa lê na tela.
const weeklySum = async page => {
  const caption = await page.locator('#subjectTargetEditor caption').innerText();
  return Number(/Soma das metas por disciplina: (\d+)/.exec(caption)?.[1]);
};

test('metas de questões por disciplina fecham na meta global: aviso, prévia, confirmar e desfazer', async ({
  page,
}) => {
  await openDemo(page);
  await openPlanningSubtab(page, 'prova');
  const editor = page.locator('#subjectTargetEditor');

  // A demo já nasce fechada: 220 na global e 220 na soma, sem aviso.
  await expect(editor).toContainText('Meta global: 80% de acerto · 220 questões/semana');
  await expect(editor).not.toContainText('sem meta global de questões');
  await expect(editor).toContainText('Soma das metas por disciplina: 220 questões/semana');
  await expect(editor.locator('[data-questions-split-preview]')).toHaveCount(0);

  // Subir uma meta por disciplina abre a diferença; o aviso aparece e nada é reescrito sozinho.
  await editor.locator('summary[aria-label^="Editar metas de Língua Portuguesa"]').click();
  const input = editor.getByRole('spinbutton', {
    name: 'Meta semanal de questões de Língua Portuguesa',
  });
  await input.fill('50');
  await input.press('Enter');
  expect(await weeklySum(page)).toBe(230);
  await expect(editor).toContainText('somam 230 questões por semana; a meta global é 220');
  await expect(editor).toContainText('passam 10');

  // A prévia mostra o antes e o depois sem gravar.
  await editor.getByRole('button', { name: 'Repartir a meta global entre as disciplinas' }).click();
  await expect(
    editor.getByRole('heading', { name: 'Prévia: repartir 220 questões por semana' })
  ).toBeVisible();
  await expect(editor).toContainText('Língua Portuguesa 50 →');
  expect(await weeklySum(page)).toBe(230);

  // Cancelar descarta; repartir de novo e confirmar fecha na meta global.
  await editor.getByRole('button', { name: 'Cancelar' }).click();
  await expect(editor.locator('[data-questions-split-confirm]')).toHaveCount(0);
  expect(await weeklySum(page)).toBe(230);
  await editor.getByRole('button', { name: 'Repartir a meta global entre as disciplinas' }).click();
  await editor.getByRole('button', { name: 'Confirmar repartição' }).click();
  await expect.poll(() => weeklySum(page)).toBe(220);
  await expect(editor).toContainText('Soma das metas por disciplina: 220 questões/semana');
  await expect(editor.locator('[data-questions-split-preview]')).toHaveCount(0);

  // Desfazer devolve as metas de antes.
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect.poll(() => weeklySum(page)).toBe(230);
});
