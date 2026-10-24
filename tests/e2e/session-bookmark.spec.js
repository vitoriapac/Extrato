import {test,expect} from '@playwright/test';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {activateTab} from './helpers.js';

async function prepare(page){
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  const state=generateDemoData({today:'2026-10-01'}),subject=state.subjects[0],topic=subject.topics[0];
  state.dailyPlans=state.dailyPlans.filter(plan=>plan.date!=='2026-10-01');
  state.dailyPlans.push({id:'today',date:'2026-10-01',availableMinutes:120,plannedMinutes:120,items:[{id:'daily-first',subjectId:subject.id,topicId:topic.id,type:'study',plannedMinutes:60,executedSeconds:0,status:'planned',sessionIds:[]}]});
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__,validation=api.validateBackupData(state);if(!validation.valid)throw Error(validation.message);api.setState(validation.normalized);api.renderAll();},state);
  await activateTab(page,'dashboard');
  return topic.id;
}
const card=page=>page.locator('.overview-now-action .overview-action-card').first();
async function runSession(page){
  await card(page).locator('.overview-action-buttons .btn').first().click();
  await page.clock.fastForward('00:05:00');await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();
}
const bookmarkOf=(page,topicId)=>page.evaluate(id=>window.__EXTRATO_TEST__.getState().subjects.flatMap(subject=>subject.topics).find(topic=>topic.id===id).bookmark,topicId);

test('ponto de parada salvo no check-out aparece na próxima ação e volta preenchido',async({page})=>{
  const topicId=await prepare(page);
  await expect(card(page)).not.toContainText('Continuar de:');
  await runSession(page);
  const section=page.locator('#sessionBookmarkSection');
  await expect(section).toBeVisible();await expect(section).not.toHaveAttribute('open','');
  await section.locator('summary').click();
  await page.locator('#sessionBookmarkCurrent').fill('42');await page.locator('#sessionBookmarkTotal').fill('110');
  await page.locator('#sessionModalSaveBtn').click();
  await expect(card(page)).toContainText('Continuar de: PDF · pág. 42 de 110 (38%)');
  expect(await bookmarkOf(page,topicId)).toMatchObject({resourceType:'pdf',currentUnit:42,totalUnits:110});

  await runSession(page);
  await expect(section).toHaveAttribute('open','');await expect(page.locator('#sessionBookmarkCurrent')).toHaveValue('42');
  await page.locator('#sessionBookmarkCurrent').fill('');await page.locator('#sessionBookmarkTotal').fill('');
  await page.locator('#sessionModalSaveBtn').click();
  expect(await bookmarkOf(page,topicId)).toMatchObject({currentUnit:42,totalUnits:110});

  await runSession(page);
  await page.locator('#sessionBookmarkClearBtn').click();await expect(page.locator('#sessionBookmarkClearBtn')).toHaveText('Será removido ao salvar');
  await page.locator('#sessionModalSaveBtn').click();
  expect(await bookmarkOf(page,topicId)).toBeNull();
  await expect(card(page)).not.toContainText('Continuar de:');
});

test('modo foco mostra o ponto de parada do tópico em andamento',async({page})=>{
  const topicId=await prepare(page);
  await page.evaluate(id=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.subjects.flatMap(subject=>subject.topics).find(topic=>topic.id===id).bookmark={resourceType:'law',positionText:'Art. 37, § 6º',updatedAt:'2026-09-30T12:00:00.000Z'};const validation=api.validateBackupData(state);api.setState(validation.normalized);api.renderAll();},topicId);
  await expect(card(page)).toContainText('Continuar de: Lei seca · Art. 37, § 6º');
  await card(page).locator('.overview-action-buttons .btn').first().click();
  await page.locator('#timerFocusToggle').click();
  await expect(page.locator('#timerFocusResume')).toHaveText('Continuar de: Lei seca · Art. 37, § 6º');
});
