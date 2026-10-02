import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';

const screenshotName=(name)=>`${name}-${process.platform}.png`;
for(const {width,theme} of [{width:320,theme:'light'},{width:375,theme:'dark'},{width:430,theme:'light'},{width:1440,theme:'dark'}])test(`trajetória em Desempenho com Demo: ${width}px ${theme}`,async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.setViewportSize({width,height:900});
  await openDemo(page);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  await expect(page.locator('#weeklyCloseDashboard .projection-close-context')).toHaveCount(1);
  await activateTab(page,'desempenho');
  await expect(page.locator('#achievementProjectionTitle')).toHaveText('Projeção até a prova');
  await expect(page.locator('.achievement-projection__status')).toBeVisible();
  const explanation=page.locator('.achievement-projection__details').filter({has:page.locator('summary', {hasText:'Entender esta projeção'})});
  await explanation.locator('summary').click();
  await expect(explanation).toContainText('Prontidão é um índice de preparação');
  await expect(page.locator('.achievement-projection__details').filter({hasText:'O que seria necessário?'})).toHaveCount(1);
  await expectNoPageOverflow(page);
  if(process.platform==='win32'){
    await page.evaluate(()=>document.querySelectorAll('.skip-link,.sticky-shell,#demoBanner,#backToTopBtn').forEach(element=>element.remove()));
    await expect(page.locator('.achievement-projection')).toHaveScreenshot(screenshotName(`achievement-projection-${width}-${theme}`),{animations:'disabled',caret:'hide',maxDiffPixelRatio:.08});
  }
});

test('novo snapshot passa na validação e migração do backup anterior preserva o histórico',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  const result=await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());
    state.examDate='2026-12-15';state.examBlueprint.examDate=state.examDate;
    api.setState(state);api.renderAll();
    const current=structuredClone(api.getState());
    const old=structuredClone(current);old.schemaVersion=27;
    return {valid:api.validateBackupData(current).valid,
      snapshot:current.projectionSnapshots.find(item=>item.kind==='achievement'),
      migrated:api.migrateState(old)};
  });
  expect(result.valid).toBe(true);
  expect(result.snapshot).toMatchObject({kind:'achievement',algorithmVersion:2,projection:{examDayScore:null,approvalProbability:null}});
  expect(result.migrated.schemaVersion).toBe(28);
  expect(result.migrated.projectionSnapshots).toContainEqual(result.snapshot);
});

test('prévia de recuperação no Demo explica origem e destino sem ação de aplicação',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await openDemo(page);
  await activateTab(page,'desempenho');
  const open=page.locator('[data-recovery-preview-open]');
  await expect(open).toBeVisible();
  await open.click();
  const dialog=page.getByRole('dialog',{name:'Plano de recuperação'});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/capacidade semanal será preservada/i);
  await expect(dialog).toContainText('Total planejado');
  await expect(dialog).toContainText('Por que esta mudança?');
  await expect(dialog.getByRole('button',{name:/Aplicar/i})).toHaveCount(0);
  await dialog.getByRole('button',{name:'Fechar prévia de recuperação'}).click();
  await expect(dialog).not.toBeVisible();
});

test('Recovery exige confirmação, revalida e registra plano e decisão sem reescrever sessões',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  const demo=generateDemoData({today:'2026-10-01'});
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__,validation=api.validateBackupData(state);if(!validation.valid)throw Error(validation.message);api.setState(validation.normalized);api.renderAll()},demo);
  await activateTab(page,'desempenho');
  await page.locator('[data-recovery-preview-open]').click();
  await page.getByRole('dialog',{name:'Plano de recuperação'}).getByRole('button',{name:'Aplicar ao planejamento'}).click();
  const confirmation=page.getByRole('dialog',{name:'Aplicar plano de recuperação?'});
  await expect(confirmation).toBeVisible();await expect(confirmation).toContainText('Nenhuma sessão concluída será alterada.');
  const before=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return {planId:state.studyPlans.at(-1).id,sessions:structuredClone(state.studySessions),dailyPlans:structuredClone(state.dailyPlans),budget:state.studyPlans.at(-1).weeklyPlannedMinutes,history:state.adaptivePlanningHistory.length}});
  await confirmation.getByRole('button',{name:'Confirmar alterações'}).click();
  await expect(page.locator('#toast')).toContainText('Plano de recuperação confirmado');
  const after=await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=api.getState(),plan=state.studyPlans.at(-1);return {planId:plan.id,plan,sessionCount:state.studySessions.length,sessions:structuredClone(state.studySessions),dailyPlans:structuredClone(state.dailyPlans),history:structuredClone(state.adaptivePlanningHistory),backup:api.validateBackupData(JSON.parse(JSON.stringify(state)))}});
  expect(after.planId).not.toBe(before.planId);expect(after.plan.weeklyPlannedMinutes).toBe(before.budget);expect(after.plan.weeklyAvailableMinutes).toBe(720);
  expect(after.sessionCount).toBe(before.sessions.length);expect(after.sessions).toEqual(before.sessions);expect(after.dailyPlans).toEqual(before.dailyPlans);
  expect(after.history).toHaveLength(before.history+1);expect(after.history.at(-1)).toMatchObject({decisionType:'recovery',status:'applied',planId:after.planId,totalMinutesBefore:before.budget,totalMinutesAfter:before.budget});
  expect(after.backup.valid,after.backup.message).toBe(true);
  await activateTab(page,'dashboard');await expect(page.locator('#strategicTimelineDashboard')).toContainText('Plano de recuperação aplicado');
  const decision=after.history.at(-1);
  await page.locator('#timerSubjectSelect').selectOption(decision.targetSubjectId);
  await page.locator('#timerTopicSelect').selectOption(decision.targetTopicId);
  await page.locator('#timerTypeSelect').selectOption('study');await page.locator('#timerStartBtn').click();
  await page.clock.fastForward('01:00:00');await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();await page.locator('#sessionModalSaveBtn').click();
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__.getState().studySessions.length)).toBe(before.sessions.length+1);
  const executed=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return {sessions:structuredClone(state.studySessions),dailyPlans:structuredClone(state.dailyPlans),plans:structuredClone(state.studyPlans)}});
  expect(executed.sessions.at(-1).durationSeconds).toBeGreaterThanOrEqual(3600);
  await activateTab(page,'metas');await page.locator('#adaptivePlanningHistory > details > summary').click();
  await page.locator('#adaptivePlanningHistory').getByRole('button',{name:'Reverter ajuste'}).click();
  await expect(page.locator('#toast')).toContainText('A redistribuição foi revertida');
  const reverted=await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=api.getState();return {plan:structuredClone(state.studyPlans.at(-1)),plans:structuredClone(state.studyPlans),sessions:structuredClone(state.studySessions),dailyPlans:structuredClone(state.dailyPlans),decision:structuredClone(state.adaptivePlanningHistory.at(-1)),valid:api.validateBackupData(JSON.parse(JSON.stringify(state))).valid,saved:JSON.parse(localStorage.getItem('bb-premium-study-data'))}});
  expect(reverted.plan.id).not.toBe(after.planId);expect(reverted.plan.subjects).toEqual(executed.plans.find(plan=>plan.id===before.planId).subjects);
  expect(reverted.plans.slice(0,-1)).toEqual(executed.plans);expect(reverted.sessions).toEqual(executed.sessions);expect(reverted.dailyPlans).toEqual(executed.dailyPlans);
  expect(reverted.decision).toMatchObject({status:'reverted',originalDecisionId:decision.id,reversionPlanId:reverted.plan.id});
  expect(reverted.valid).toBe(true);expect(reverted.saved.studyPlans.at(-1).id).toBe(reverted.plan.id);
  await activateTab(page,'dashboard');await expect(page.locator('#strategicTimelineDashboard')).toContainText('Plano de recuperação revertido');
});

test('falha de persistência do Recovery preserva estado e permite repetir a confirmação',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
  await page.evaluate(state=>{const api=window.__EXTRATO_TEST__;api.setState(state);api.renderAll()},generateDemoData({today:'2026-10-01'}));
  await activateTab(page,'desempenho');
  const before=await page.evaluate(async()=>{const api=window.__EXTRATO_TEST__;await api.settleSaves();window.__recoveryOriginalSet=api.StorageManager.set;api.StorageManager.set=async()=>false;const state=api.getState();return {plans:structuredClone(state.studyPlans),history:structuredClone(state.adaptivePlanningHistory),snapshots:structuredClone(state.readinessSnapshots)}});
  const confirm=async()=>{await page.locator('[data-recovery-preview-open]').click();await page.getByRole('dialog',{name:'Plano de recuperação'}).getByRole('button',{name:'Aplicar ao planejamento'}).click();await page.getByRole('dialog',{name:'Aplicar plano de recuperação?'}).getByRole('button',{name:'Confirmar alterações'}).click()};
  await confirm();await expect(page.locator('#toast')).toContainText('Não foi possível salvar a operação');
  const failed=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return {plans:structuredClone(state.studyPlans),history:structuredClone(state.adaptivePlanningHistory),snapshots:structuredClone(state.readinessSnapshots)}});
  expect(failed).toEqual(before);
  await page.evaluate(()=>{window.__EXTRATO_TEST__.StorageManager.set=window.__recoveryOriginalSet;delete window.__recoveryOriginalSet});
  await confirm();await expect(page.locator('#toast')).toContainText('Plano de recuperação confirmado');
});

test('histórico comparável mostra tendência futura distinta dos resultados observados',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subjectId=state.subjects[0].id;
    state.examDate='2026-12-15';state.examBlueprint.examDate=state.examDate;state.metas.metaAprovacao=80;
    const dates=['2026-08-06','2026-08-13','2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24'];
    state.simulados=dates.map((date,index)=>({id:`projected-${index}`,date,total:100,correct:60+index*3,
      breakdown:[{subjectId,total:100,correct:60+index*3}],examTags:[]}));
    api.setState(state);api.renderAll();
  });
  await activateTab(page,'desempenho');
  await expect(page.locator('.achievement-trajectory__future')).toHaveCount(1);
  await expect(page.locator('.achievement-projection__metrics > div').last().locator('strong')).not.toHaveText('—');
});

test('simulador compara cenário sem persistir estado real ou snapshots',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subjectId=state.subjects[0].id;
    state.examDate='2026-12-15';state.examBlueprint.examDate=state.examDate;state.metas.metaAprovacao=80;
    const dates=['2026-08-06','2026-08-13','2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24'];
    state.simulados=dates.map((date,index)=>({id:`scenario-${index}`,date,total:100,correct:70+index,
      breakdown:[{subjectId,total:100,correct:70+index}],examTags:[]}));
    api.setState(state);api.renderAll();
  });
  await activateTab(page,'desempenho');
  const decisionState=()=>page.evaluate(()=>{
    const state=window.__EXTRATO_TEST__.getState();
    return structuredClone({examDate:state.examDate,metas:state.metas,examBlueprint:state.examBlueprint,
      projectionSnapshots:state.projectionSnapshots,studyPlans:state.studyPlans});
  });
  await page.evaluate(()=>window.__EXTRATO_TEST__.settleSaves());
  const before=await decisionState();
  await page.locator('[data-projection-scenario-open]').click();
  const dialog=page.locator('#projectionScenarioDialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('[name="capacityHours"]').fill('12');
  await dialog.locator('[name="examDate"]').fill('2026-10-11');
  await dialog.locator('[name="targetScore"]').fill('85');
  await dialog.getByRole('button',{name:'Executar simulação'}).click();
  await expect(dialog.locator('#projectionScenarioResult')).toContainText('Resultado simulado');
  await expect(dialog.locator('#projectionScenarioResult')).toContainText('Nenhum dado real foi alterado');
  await expect(dialog.locator('#projectionScenarioResult')).toContainText('Plano atual vs. plano de recuperação');
  await expect(dialog.locator('#projectionScenarioResult')).toContainText('não prevê melhora de nota');
  expect(await decisionState()).toEqual(before);
  await dialog.getByRole('button',{name:'Fechar simulação'}).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(page.locator('#projectionScenarioResult')).toBeEmpty();
});

test('simulador é acessível por teclado e cabe em 320px no tema escuro',async({page})=>{
  await page.clock.install({time:new Date('2026-10-01T12:00:00-03:00')});
  await page.setViewportSize({width:320,height:700});
  await openDemo(page);
  await page.locator('#themeToggleBtn').click();
  await activateTab(page,'desempenho');
  await page.locator('[data-projection-scenario-open]').focus();
  await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Simular cenário'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('spinbutton',{name:'Capacidade semanal (horas)'})).toBeVisible();
  await expectNoPageOverflow(page);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
