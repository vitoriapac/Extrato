import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';

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
