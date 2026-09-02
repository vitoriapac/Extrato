import {test,expect} from '@playwright/test';

test('conclui uma sessão pelo cronômetro e registra o histórico uma única vez',async({page})=>{
  await page.goto('/');
  await page.locator('#timerStartBtn').click();
  await expect.poll(()=>page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toHaveClass(/show/);
  await page.locator('#sessionModalResolved').fill('10');
  await page.locator('#sessionModalCorrect').fill('7');
  await page.locator('#sessionModalNotes').fill('Sessão validada pelo fluxo completo');
  await page.locator('#sessionModalSaveBtn').click();
  await expect(page.locator('#studySessionsCount')).toHaveText('1 sessão');
  await expect(page.locator('#studySessionsBody tr[data-id]')).toHaveCount(1);
  await expect(page.locator('#studySessionsBody')).toContainText('10 questões');
  await expect(page.locator('#studySessionsBody')).toContainText('70% de acerto');
});
