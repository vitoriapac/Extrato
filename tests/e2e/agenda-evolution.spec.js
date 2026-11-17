import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

test('Agenda: criar atividade, alternar visão Semana e concluir em Hoje sem gerar horas fictícias', async ({
  page,
}) => {
  await openDemo(page);

  const getSessionsCount = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('bb-premium-study-demo');
      return raw ? (JSON.parse(raw).studySessions || []).length : 0;
    });

  const initialSessionsCount = await getSessionsCount();

  await activateTab(page, 'agenda');
  await expect(page.locator('#panel-agenda')).toBeVisible();

  // Abre modal de nova atividade pelo botão principal
  await page.locator('#addCalRowBtn').click();
  const modal = page.locator('#calendarActivityModal');
  await expect(modal).toBeVisible();

  await page.locator('#calActivityTitle').fill('Redação sobre tecnologia');
  await page.locator('#calActivityKind').selectOption('essay');
  await modal.getByRole('button', { name: /Mais detalhes/i }).click();
  await page.locator('#calActivityStart').fill('14:00');
  await modal.getByRole('button', { name: 'Adicionar atividade', exact: true }).click();
  await expect(modal).toBeHidden();

  // Confirma exibição na aba Agenda (drawer do dia + visão Semana)
  await expect(page.locator('#calendarDayDrawerMount')).toContainText('Redação sobre tecnologia');
  await page.locator('[data-calendar-view="week"]').click();
  await expect(page.locator('#calendarWeekCard')).toContainText('Redação sobre tecnologia');
  await expect(page.locator('#calendarWeekCard')).toContainText('14:00');

  // Navega para Hoje e confirma sincronização sem duplicidade
  await activateTab(page, 'hoje');
  const hojeList = page.locator('#hojeTarefasHoje');
  await expect(hojeList).toContainText('Redação sobre tecnologia');
  await expect(hojeList).toContainText('14:00');
  await expect(hojeList).toContainText('Redação');

  // Conclui a tarefa em Hoje e garante que nenhuma sessão de estudo fictícia foi criada
  await hojeList.getByRole('button', { name: 'Concluir tarefa' }).first().click();
  await expect(hojeList).not.toContainText('Redação sobre tecnologia');

  const finalSessionsCount = await getSessionsCount();
  expect(finalSessionsCount).toBe(initialSessionsCount);
});
