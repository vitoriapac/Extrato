import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';

test('conclui uma sessão pelo cronômetro e registra o histórico uma única vez',async({page})=>{
  await page.goto('/');
  await page.locator('#timerTypeSelect').selectOption('questions');
  await page.locator('#timerStartBtn').click();
  await expect.poll(()=>page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toHaveClass(/show/);await expect(page.locator('#sessionModalOverlay')).toBeVisible({timeout:10000});
  await expect(page.locator('[data-session-fields="questions"]')).toBeVisible();
  await page.locator('#sessionModalResolved').fill('10');
  await page.locator('#sessionModalCorrect').fill('7');
  await page.locator('#sessionModalNotes').fill('Sessão validada pelo fluxo completo');
  await page.locator('#sessionModalSaveBtn').click();
  await expect(page.locator('#studySessionsCount')).toHaveText('1 sessão');
  await expect(page.locator('#studySessionsBody tr[data-id]')).toHaveCount(1);
  await expect(page.locator('#studySessionsBody')).toContainText('10 questões');
  await expect(page.locator('#studySessionsBody')).toContainText('70% de acerto');
});

test('conclusão de revisão registra retenção percebida sem mostrar campos de questões',async({page})=>{
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(element=>element.remove());
  await activateTab(page,'dashboard');
  await page.locator('#timerTypeSelect').selectOption('review');
  await page.locator('#timerStartBtn').click();
  await expect.poll(()=>page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('[data-session-fields="review"]')).toBeVisible();
  await expect(page.locator('[data-session-fields="questions"]')).toBeHidden();
  await page.locator('#sessionModalRetention').selectOption('effortful');
  await page.locator('#sessionModalSaveBtn').click();
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__?.getState().studySessions.at(-1)?.perceivedRetention)).toBe('effortful');
});

test('sessão de simulado encaminha ao cadastro próprio do simulado',async({page})=>{
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(element=>element.remove());
  await activateTab(page,'dashboard');
  await page.locator('#timerTypeSelect').selectOption('simulation');
  await page.locator('#timerStartBtn').click();
  await expect.poll(()=>page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('[data-session-fields="simulation"]')).toBeVisible();
  await page.locator('#sessionModalSaveBtn').click();
  await expect(page.locator('#panel-questoes')).toHaveClass(/active/);
  await expect(page.locator('#simuladosBody tr.row-editing')).toBeVisible();
  await expect(page.locator('#toast')).toContainText('Complete agora os resultados do simulado.');
});

