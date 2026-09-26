import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('histórico compara apenas retratos salvos no escopo ativo e registra o concurso no novo fechamento',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),today=api.todayISO(),subject=state.subjects[0],topic=subject.topics[0];
    state.studySessions=[{id:'focus-current',date:today,subjectId:subject.id,topicId:topic.id,type:'study',durationSeconds:3600,questionsResolved:0,correctAnswers:0,notes:''}];
    const start=api.addDays(today,-20),end=api.addDays(today,-14);
    const old={id:'focus-old',period:{start,end},activeExamTags:[],savedAt:`${end}T12:00:00Z`,version:1,algorithmVersion:'2.1.0',weeklyClose:{state:'available',investment:{executedMinutes:120},strategicFocus:{state:'available',highImpactPercent:60,highImpactMinutes:72,totalMinutes:120,workedGaps:2,improved:1,stable:1,declined:0,unmeasured:0}},gapMap:{items:[]},decisionHistory:{items:[]}};
    state.weeklyCloseSnapshots=[old,{...old,id:'focus-legacy',activeExamTags:undefined,period:{start:api.addDays(today,-30),end:api.addDays(today,-24)}}];
    api.setState(state);api.renderAll();
  });
  await activateTab(page,'dashboard');
  const history=page.locator('#weeklyCloseDashboard .weekly-focus-history');
  await expect(history).toContainText('Foco estratégico ao longo do tempo');
  await expect(history.locator('.weekly-focus-history-row')).toHaveCount(2);
  await expect(history).toContainText('60%');
  await expect(history).toContainText('resultado posterior medido');
  await expectNoPageOverflow(page);
  const accessibility=await new AxeBuilder({page}).include('#weeklyCloseDashboard').analyze();
  expect(accessibility.violations).toEqual([]);
  await page.locator('#weeklyCloseDashboard [data-delegated-click="saveWeeklyCloseSnapshot()"] ').click();
  const saved=await page.evaluate(()=>window.__EXTRATO_TEST__.getState().weeklyCloseSnapshots.at(-1));
  expect(saved.activeExamTags).toEqual([]);
  expect(saved.weeklyClose.strategicFocus.state).toBe('available');
});
