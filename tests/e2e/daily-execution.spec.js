import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {activateTab,expectNoPageOverflow} from './helpers.js';

async function prepare(page){
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  const state=generateDemoData({today:'2026-10-01'}),subject=state.subjects[0],topic=subject.topics[0];
  state.dailyPlans=state.dailyPlans.map(plan=>plan.date==='2026-10-01'?{...plan,date:'2026-10-02'}:plan);
  state.dailyPlans.push({id:'today',date:'2026-10-01',availableMinutes:120,plannedMinutes:20,items:[{id:'daily-first',subjectId:subject.id,topicId:topic.id,type:'study',plannedMinutes:10,executedSeconds:0,status:'planned',sessionIds:[]},{id:'daily-second',subjectId:subject.id,topicId:topic.id,type:'questions',plannedMinutes:10,executedSeconds:0,status:'planned',sessionIds:[]}]});
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__,validation=api.validateBackupData(state);if(!validation.valid)throw Error(validation.message);api.setState(validation.normalized);api.renderAll();},state);
  await activateTab(page,'dashboard');
}
test('Hoje inicia sessão vinculada, atualiza progresso e avança sem reload',async({page})=>{
  await prepare(page);const card=page.locator('#dailyExecutionDashboard');
  await expect(card).toContainText('0% de progresso do plano');await card.getByRole('button',{name:'Iniciar estudo',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__.getState().activeTimer.planItemId)).toBe('daily-first');
  await expect(card.getByRole('button',{name:'Retomar sessão'})).toBeVisible();
  await page.clock.fastForward('00:10:00');await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();await page.locator('#sessionModalSaveBtn').click();
  await expect(card).toContainText('50% de progresso do plano');await expect(card).toContainText('Questões');
  await expect(card.locator('[data-daily-start]')).toHaveAttribute('data-daily-start','daily-second');
  const state=await page.evaluate(()=>window.__EXTRATO_TEST__.getState());expect(state.studySessions.at(-1).planItemId).toBe('daily-first');
  await page.clock.fastForward('00:00:01');await page.evaluate(()=>window.__EXTRATO_TEST__.settleSaves());
  await page.goto('/');await expect(card).toContainText('50% de progresso do plano');
});
for(const [width,theme] of [[320,'light'],[375,'dark'],[430,'light']])test(`card Hoje acessível: ${width}px ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:900});await prepare(page);if(theme==='dark')await page.locator('#themeToggleBtn').click();
  const card=page.locator('#dailyExecutionDashboard');await expectNoPageOverflow(page);
  expect((await new AxeBuilder({page}).include('#dailyExecutionDashboard').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  if(process.platform==='win32')await expect(card).toHaveScreenshot(`today-${width}-${theme}-win32.png`,{animations:'disabled',maxDiffPixelRatio:.03});
  await card.getByRole('button',{name:'Iniciar estudo',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(card.getByRole('button',{name:'Retomar sessão'})).toBeVisible();
});
