import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {buildStrategicCycleFixture} from '../fixtures/strategic-cycle.js';
test('platô e consolidação em risco explicam os dados sem modificar o plano',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.clock.install({time:new Date('2026-09-28T12:00:00-03:00')});
 await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
 const base=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState())),fixture=buildStrategicCycleFixture(base);
 fixture.questoes=fixture.questoes.filter(item=>item.subjectId!=='cycle-s0'&&item.topicId!=='cycle-t1-0');
 for(const [index,date] of ['2026-09-01','2026-09-08','2026-09-15','2026-09-22'].entries())fixture.questoes.push({id:'plateau-q'+index,date,subjectId:'cycle-s0',topicId:'cycle-t0-0',resolved:50,correct:index%2?32:31});
 fixture.questoes.push({id:'risk-old',date:'2026-06-01',subjectId:'cycle-s1',topicId:'cycle-t1-0',resolved:1000,correct:1000},{id:'risk-new',date:'2026-09-27',subjectId:'cycle-s1',topicId:'cycle-t1-0',resolved:50,correct:27});
 for(let index=0;index<4;index++)fixture.reviewAgenda.push({id:'risk-review'+index,date:'2026-08-20',topicId:'cycle-t1-0',subjectId:'cycle-s1',status:'Concluído',tipo:'Revisão 7 dias',completedAt:'2026-09-01T12:00:00-03:00',rating:'easy'});
 await page.evaluate(value=>{const api=window.__EXTRATO_TEST__,result=api.validateBackupData(value);if(!result.valid)throw Error(result.message);api.setState(result.normalized);api.renderAll()},fixture);
 await activateTab(page,'hoje');await page.locator('.today-analysis-details > summary').click();const before=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
 const signals=page.locator('#diagnosisCenter .preparation-signals');await page.locator('#diagnosisCenter .diagnosis-method-details > summary').click();await expect(signals).toContainText('Possível platô');await expect(signals).toContainText('Consolidação em risco');
 const plateau=signals.locator('.preparation-signal-list > details').filter({hasText:'Matemática Financeira'});await plateau.locator(':scope > summary').focus();await page.keyboard.press('Enter');await expect(plateau).toHaveAttribute('open','');await expect(plateau).toContainText('50 questões');
 await expectNoPageOverflow(page);await page.locator('#themeToggleBtn').click();await expectNoPageOverflow(page);
 const after=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));expect(after.studyPlans).toEqual(before.studyPlans);expect(after.dailyPlans).toEqual(before.dailyPlans);expect(after.studySessions).toEqual(before.studySessions);expect(after.weeklyCloseSnapshots).toEqual(before.weeklyCloseSnapshots);
});
