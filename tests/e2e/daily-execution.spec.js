import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {withPixelAlignedCapture} from './helpers/visual-capture.js';

async function prepare(page,{dense=true}={}){
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  const state=dense?generateDemoData({today:'2026-10-01'}):await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState())),subject=state.subjects[0],topic=subject.topics[0];
  state.dailyPlans=state.dailyPlans.map(plan=>plan.date==='2026-10-01'?{...plan,date:'2026-10-02'}:plan);
  state.dailyPlans.push({id:'today',date:'2026-10-01',availableMinutes:120,plannedMinutes:20,items:[{id:'daily-first',subjectId:subject.id,topicId:topic.id,type:'study',plannedMinutes:10,executedSeconds:0,status:'planned',sessionIds:[]},{id:'daily-second',subjectId:subject.id,topicId:topic.id,type:'questions',plannedMinutes:10,executedSeconds:0,status:'planned',sessionIds:[]}]});
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__,validation=api.validateBackupData(state);if(!validation.valid)throw Error(validation.message);api.setState(validation.normalized);api.renderAll();},state);
  await activateTab(page,'dashboard');
}
test('Hoje inicia sessão vinculada, atualiza progresso e avança sem reload',async({page})=>{
  await prepare(page);const card=page.locator('#dailyExecutionDashboard');
  const summary=await card.locator('.daily-execution-summary').boundingBox(),next=await card.locator('.daily-execution-next').boundingBox();expect(next.x).toBeGreaterThan(summary.x+summary.width);
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
  await page.setViewportSize({width,height:1100});await prepare(page);if(theme==='dark')await page.locator('#themeToggleBtn').click();
  const card=page.locator('#dailyExecutionDashboard');await expectNoPageOverflow(page);
  expect((await new AxeBuilder({page}).include('#dailyExecutionDashboard').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
  await card.evaluate(node=>window.scrollBy(0,node.getBoundingClientRect().top-120));
  if(process.platform==='win32')await withPixelAlignedCapture(card,()=>expect(card).toHaveScreenshot(`today-${width}-${theme}-win32.png`,{animations:'disabled',maxDiffPixelRatio:.03}));
  const suggestion=card.locator('.daily-execution-suggestion');
  await expect(suggestion).not.toHaveAttribute('open','');
  await suggestion.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(suggestion).toContainText('confira a prévia');
  await expect(suggestion.getByRole('button',{name:'Ver recomendação',exact:true})).toBeVisible();
  await page.keyboard.press('Enter');await expect(suggestion).not.toHaveAttribute('open','');
  await card.getByRole('button',{name:'Iniciar estudo',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(card.getByRole('button',{name:'Retomar sessão'})).toBeVisible();
});

test('execução diária explica estados vazios, parciais, concluídos e cronômetro com nomes longos',async({page})=>{
  await prepare(page,{dense:false});
  const base=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
  base.studySessions=[];base.activeTimer=null;base.dailyPlans=base.dailyPlans.filter(plan=>plan.id==='today');
  const subject=base.subjects[0],topic=subject.topics[0];
  subject.name='Língua Portuguesa e interpretação de textos em contextos de concursos públicos';
  topic.name='Interpretação e compreensão de textos extensos com análise de relações sintáticas e semânticas';
  const apply=state=>page.evaluate(state=>{const api=window.__EXTRATO_TEST__;api.setState(state);api.renderAll()},state);
  const card=page.locator('#dailyExecutionDashboard');
  const empty=structuredClone(base);empty.dailyPlans[0].items=[];empty.dailyPlans[0].plannedMinutes=0;await apply(empty);
  await expect(card).toContainText('Não há atividade elegível');await expect(card.getByRole('button',{name:'Abrir planejamento'})).toBeVisible();
  await apply(base);
  for(const width of [320,390,430,1440]){
    await page.setViewportSize({width,height:1100});await expectNoPageOverflow(page);
    const boxes=await card.evaluate(node=>{const summary=node.querySelector('.daily-execution-summary').getBoundingClientRect(),next=node.querySelector('.daily-execution-next').getBoundingClientRect();return {summary:{right:summary.right,bottom:summary.bottom},next:{left:next.left,top:next.top}}});
    if(width<800)expect(boxes.next.top).toBeGreaterThan(boxes.summary.bottom);else expect(boxes.next.left).toBeGreaterThan(boxes.summary.right);
  }
  await card.screenshot({path:test.info().outputPath('execution-desktop-long-names.png')});
  const partial=structuredClone(base);partial.studySessions=[{id:'partial',date:'2026-10-01',subjectId:subject.id,topicId:topic.id,type:'study',durationSeconds:300,planItemId:'daily-first'}];
  await apply(partial);await expect(card).toContainText('25% de progresso do plano');await expect(card).toContainText('0 de 2 atividades concluídas');
  await card.getByRole('button',{name:'Iniciar estudo',exact:true}).click();await expect(card.getByRole('button',{name:'Retomar sessão'})).toBeVisible();
  const blocked=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));blocked.studySessions[0].durationSeconds=600;await apply(blocked);
  await expect(card.getByRole('button',{name:'Finalize a sessão atual'})).toBeDisabled();
  const extra=structuredClone(base);extra.studySessions=[{...partial.studySessions[0],type:'questions',durationSeconds:300},{...partial.studySessions[0],id:'additional',planItemId:null,durationSeconds:300}];
  await apply(extra);
  const context=card.locator('.daily-execution-context');await expect(context).not.toHaveAttribute('open');
  await expect(context.locator('p').first()).toBeHidden();await context.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(context).toHaveAttribute('open','');await expect(context).toContainText('estudo adicional');await expect(context).toContainText('atividade diferente');
  await expect(card.locator('.daily-execution-footer')).toBeVisible();
  const complete=structuredClone(base);complete.studySessions=[{...partial.studySessions[0],durationSeconds:600},{...partial.studySessions[0],id:'questions',type:'questions',planItemId:'daily-second',durationSeconds:600}];
  await apply(complete);await expect(card).toContainText('100% de progresso do plano');await expect(card).toContainText('2 de 2 atividades concluídas');await expect(card).toContainText('Todas as atividades de hoje foram cumpridas');await expect(card.locator('[data-daily-start]')).toHaveCount(0);
});

test('sugestão fora do plano permite dispensar sem alterar a agenda',async({page})=>{
 test.setTimeout(120_000);await page.setViewportSize({width:390,height:900});await prepare(page);
 await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.studySessions=state.studySessions.filter(session=>session.date!=='2026-10-01');api.setState(state);api.renderAll()});
 await activateTab(page,'hoje');
 const action=page.locator('#studyRecommendation .study-recommendation').first();
 await expect(action).toContainText('Sugestão fora do plano de hoje');
 await expect(action.getByRole('button',{name:/Seguir plano de hoje/})).toBeVisible();
 await expect(action.getByRole('button',{name:/Estudar como atividade adicional/})).toBeVisible();
 const state=()=>page.evaluate(()=>{const s=window.__EXTRATO_TEST__.getState();return JSON.stringify({plans:s.dailyPlans,weekly:s.studyPlans,sessions:s.studySessions,capacity:s.metas.horasPorDia})});
 const before=await state();
 await expectNoPageOverflow(page);
 expect((await new AxeBuilder({page}).include('#studyRecommendation').withTags(['wcag2a','wcag2aa']).analyze()).violations).toEqual([]);
 await action.getByRole('button',{name:'Dispensar esta sugestão agora',exact:true}).click();
 await expect(action).toBeHidden();expect(await state()).toBe(before);
 await expectNoPageOverflow(page);
});
