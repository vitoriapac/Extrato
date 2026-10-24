import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';

// Real mode (no ?test=1): the only path that boots through loadState.
const stored=page=>page.evaluate(()=>{const value=JSON.parse(localStorage.getItem('bb-premium-study-data')||'null');return value&&{sessions:value.studySessions.length,subjectCreatedAt:value.subjects[0]?.createdAt}});

test('recarregar com hash de aba mantém sessões salvas',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.goto('/');
  await activateTab(page,'dashboard');
  await page.locator('#timerSubjectSelect').selectOption({index:1});
  await page.locator('#timerTopicSelect').selectOption({index:1});
  await page.locator('#timerStartBtn').click();
  await page.clock.fastForward('00:05:00');await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();await page.locator('#sessionModalSaveBtn').click();
  await page.clock.fastForward('00:00:02');
  const saved=await stored(page);
  expect(saved.sessions).toBe(1);
  expect(new URL(page.url()).hash).toBe('#dashboard');

  await page.reload();
  await expect(page.locator('#panel-dashboard')).toBeVisible();
  await page.clock.fastForward('00:00:02');
  expect(await stored(page)).toEqual(saved);
});
