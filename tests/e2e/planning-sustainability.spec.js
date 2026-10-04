import {test,expect} from '@playwright/test';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {addLocalDays} from '../../src/core/date-utils.js';
import {freezePlanExecution} from '../../src/domain/planning/plan-execution-snapshot.js';
import {recordPlanningCapacity} from '../../src/domain/planning/capacity-history.js';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';
import AxeBuilder from '@axe-core/playwright';

test('sustainability opens a readonly capacity preview, navigates and freezes its explanation',async({page})=>{
  test.setTimeout(120_000);await page.setViewportSize({width:375,height:900});
  await page.clock.install({time:new Date('2026-10-05T12:00:00-03:00')});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  const state=generateDemoData({today:'2026-10-05'}),subject=state.subjects[0],topic=subject.topics[0];
  for(const key of ['studySessions','questoes','simulados','recommendationFeedback','recommendationHistory','planAdjustments','adaptivePlanningHistory','studyPlans','projectionSnapshots','readinessSnapshots','progressHistory','reviewAgenda','calendar','topicHistory','weeklyCloseSnapshots','dailyPlans','planningCapacityHistory'])state[key]=[];
  state.examBlueprint.activeExamTags=[];state.metas.horasPorDia=Object.fromEntries(Array.from({length:7},(_,i)=>[i,i===0?0:2]));
  recordPlanningCapacity(state.planningCapacityHistory,{id:'capacity-test',today:'2026-08-01',capturedAt:'2026-08-01T12:00:00Z',hoursByDay:state.metas.horasPorDia});
  for(let week=0;week<4;week++)for(let part=0;part<2;part++){
    const date=addLocalDays('2026-09-07',week*7+part),priority=part===0,plannedMinutes=priority?120:480,executed=priority?108:312;
    const item={id:`sustain-item-${week}-${part}`,subjectId:subject.id,topicId:topic.id,type:'study',status:'planned',plannedMinutes,sessionIds:[],prioritySnapshot:{priority,tier:priority?'critical':'normal'}};
    freezePlanExecution(item,{date});state.dailyPlans.push({id:`sustain-plan-${week}-${part}`,date,availableMinutes:plannedMinutes,plannedMinutes,items:[item]});
    state.studySessions.push({id:`sustain-session-${week}-${part}`,date,subjectId:subject.id,topicId:topic.id,type:'study',planItemId:item.id,durationSeconds:executed*60});
  }
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__,result=api.validateBackupData(state);if(!result.valid)throw Error(result.message);api.setState(result.normalized);api.renderAll()},state);
  await activateTab(page,'dashboard');const close=page.locator('#weeklyCloseDashboard'),section=close.locator('.planning-sustainability').first();
  await expect(section).toContainText('Carga acima da execução recente');await expect(section).toContainText('4 comparáveis');
  const before=await page.evaluate(()=>JSON.stringify(window.__EXTRATO_TEST__.getState()));
  await section.getByRole('button',{name:'Revisar capacidade',exact:true}).click();
  await expect(page.locator('#modalMessage')).toContainText('Nenhum bloco foi redistribuído');
  await page.locator('#modalCancelBtn').click();expect(await page.evaluate(()=>JSON.stringify(window.__EXTRATO_TEST__.getState()))).toBe(before);
  await section.getByRole('button',{name:'Revisar capacidade',exact:true}).click();await page.getByRole('button',{name:'Abrir disponibilidade',exact:true}).click();
  await expect(page.locator('#panel-metas')).toBeVisible();expect(await page.evaluate(()=>JSON.stringify(window.__EXTRATO_TEST__.getState()))).toBe(before);
  await activateTab(page,'dashboard');await close.getByRole('button',{name:'Salvar fechamento desta semana',exact:true}).click();
  const snapshot=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState().weeklyCloseSnapshots.at(-1)));
  expect(snapshot.weeklyClose.adherence.sustainability.assessment.status).toBe('capacity_mismatch');
  await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.studySessions=[];state.metas.horasPorDia['1']=3;api.setState(state);api.renderAll()});
  expect(await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState().weeklyCloseSnapshots.at(-1)))).toEqual(snapshot);
  await expectNoPageOverflow(page);
});

for(const [width,theme] of [[320,'light'],[375,'dark'],[430,'light'],[1440,'light'],[1440,'dark']])test(`dense Demo sustainability journey: ${width}px ${theme}`,async({page})=>{
  test.setTimeout(120_000);await page.setViewportSize({width,height:900});
  await page.clock.install({time:new Date('2026-10-03T12:00:00-03:00')});await openDemo(page);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  const realBefore=await page.evaluate(()=>localStorage.getItem('bb-premium-study-data'));
  await activateTab(page,'desempenho');await page.locator('[data-performance-section="consistency"]').click();
  await expect(page.locator('.adherence-change')).toContainText('O que mudou?');await expectNoPageOverflow(page);
  await activateTab(page,'dashboard');const section=page.locator('#weeklyCloseDashboard .planning-sustainability').first();
  await expect(section).toContainText('Carga acima da execução recente');await expect(section).toContainText('4 comparáveis');
  if(process.platform==='win32')await expect(section).toHaveScreenshot(`sustainability-${width}-${theme}-win32.png`,{animations:'disabled',caret:'hide',maxDiffPixelRatio:.08});
  expect((await new AxeBuilder({page}).include('#weeklyCloseDashboard .planning-sustainability').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  const review=section.getByRole('button',{name:'Revisar capacidade',exact:true});await review.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#modalMessage')).toContainText('Nenhum bloco foi redistribuído');await page.keyboard.press('Escape');
  await expect(page.locator('#modalOverlay')).not.toHaveClass(/show/);await expect(review).toBeFocused();
  await review.click();await page.getByRole('button',{name:'Abrir disponibilidade',exact:true}).click();
  await expect(page.locator('#panel-metas')).toBeVisible();await expect(page.locator('#metasCapacityTitle')).toBeFocused();
  await expectNoPageOverflow(page);expect(await page.evaluate(()=>localStorage.getItem('bb-premium-study-data'))).toBe(realBefore);
});
