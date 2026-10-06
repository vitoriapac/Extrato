import {test,expect} from '@playwright/test';
import {activateTab,openDemo,expectNoPageOverflow} from './helpers.js';
import {createDefaultState} from '../../src/state/defaults.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {DEMO_EXPERIENCE_PROFILES} from '../../src/demo/demo-preparation-profiles.js';

test('históricos editoriais distinguem filtros e mantêm estudo legível com poucos e muitos dados',async({page},testInfo)=>{
  test.setTimeout(180_000);
  await page.clock.install({time:new Date('2026-10-03T12:00:00-03:00')});
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node=>node.remove());await activateTab(page,'dashboard');
  const inspect=async(name)=>{
    for(const [width,theme] of [[390,'light'],[1440,'dark']]){
      await page.setViewportSize({width,height:900});await page.evaluate(value=>document.documentElement.setAttribute('data-theme',value),theme);
      await expectNoPageOverflow(page);
      await expect(page.locator('.timer-actions')).toHaveAttribute('role','group');
      await expect(page.locator('.study-distribution-heading')).toContainText('Ver evolução e consistência');
      await expect(page.locator('.strategic-timeline-method')).not.toHaveAttribute('open','');
      const chrome=await page.evaluateHandle(()=>[...document.querySelectorAll('.sticky-shell,.overview-nav,.demo-banner,#backToTopBtn,.skip-link,#saveIndicator,#toast')].map(node=>{const saved={node,parent:node.parentNode,next:node.nextSibling};node.remove();return saved}));
      try{
        for(const [id,selector] of [['timeline','#strategicTimelineDashboard'],['study','.chart-card:has(.timer-block)'],['sessions','#studySessionsCard'],['close','#weeklyCloseDashboard']]){
          const path=testInfo.outputPath(`${name}-${id}-${width}-${theme}.png`);
          await page.locator(selector).screenshot({path,animations:'disabled'});await testInfo.attach(`${name}-${id}-${width}-${theme}`,{path,contentType:'image/png'});
        }
      }finally{await chrome.evaluate(rows=>rows.forEach(({node,parent,next})=>parent.insertBefore(node,next)));await chrome.dispose()}
    }
    await page.setViewportSize({width:320,height:900});await expectNoPageOverflow(page);
  };
  await expect(page.locator('#studySessionsEmpty')).toContainText('Seu histórico de estudos começa aqui');
  await expect(page.locator('#studySessionsCount')).toHaveText('0 sessões');await expect(page.locator('#studySessionsFilterSummary')).toBeHidden();
  await page.locator('#strategicTimelineDashboard select').first().selectOption('assessments');
  await expect(page.locator('#strategicTimelineDashboard')).toContainText('Nenhum evento neste filtro');
  await inspect('empty');
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#studySessionsEmpty').getByRole('button',{name:'Iniciar estudo',exact:true}).click();await expect(page.locator('#timerStartBtn')).toBeFocused();
  await page.evaluate(()=>{const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState());state.studySessions=[{id:'editorial-session',date:'2026-10-03',startedAt:'2026-10-03T12:00:00-03:00',endedAt:'2026-10-03T12:05:00-03:00',durationSeconds:300,type:'study',subjectId:state.subjects[0].id,topicId:null,questionsResolved:0,correctAnswers:0,notes:''}];api.setState(state);api.renderAll()});
  await expect(page.locator('#studySessionsCount')).toHaveText('1 sessão');await expect(page.locator('#studySessionsFilterSummary')).toBeHidden();
  await page.locator('#studySessionsTypeFilter').selectOption('questions');await expect(page.locator('#studySessionsEmpty')).toContainText('Nenhuma sessão neste filtro');
  await expect(page.locator('#studySessionsFilterSummary')).toHaveText('0 de 1 sessão no filtro atual');
  await page.locator('#studySessionsEmpty').getByRole('button',{name:'Limpar filtros',exact:true}).click();await expect(page.locator('#studySessionsEmpty')).toBeHidden();
  await openDemo(page);await activateTab(page,'dashboard');await inspect('dense');
});

test('hierarquia editorial da Prontidão preserva ação, ajuda e leitura em mobile e desktop',async({page},testInfo)=>{
  test.setTimeout(180_000);
  await page.clock.install({time:new Date('2026-10-03T12:00:00-03:00')});
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node=>node.remove());
  await activateTab(page,'dashboard');
  const inspect=async(stateName)=>{
    for(const [width,theme] of [[390,'light'],[390,'dark'],[1440,'light'],[1440,'dark'],[320,'light']]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(value=>document.documentElement.setAttribute('data-theme',value),theme);
      await expectNoPageOverflow(page);
      const root=page.locator('#approvalDashboard'),detail=root.locator('.readiness-explanation');
      await expect(root.locator('.analytical-result')).toBeVisible();
      await expect(root.getByRole('button',{name:'Ver trajetória em Desempenho',exact:true})).toBeVisible();
      await expect(detail).not.toHaveAttribute('open','');
      await expect(root.getByRole('button',{name:'Entenda o Índice de Prontidão'})).toBeHidden();
      const path=testInfo.outputPath(`${stateName}-${width}-${theme}.png`);
      await page.evaluate(()=>document.activeElement?.blur());
      const chrome=await page.evaluateHandle(()=>[...document.querySelectorAll('.sticky-shell,.overview-nav,.demo-banner,#backToTopBtn,.skip-link,#saveIndicator,#toast')].map(node=>{const saved={node,parent:node.parentNode,next:node.nextSibling};node.remove();return saved}));
      try{await root.screenshot({path,animations:'disabled'});}finally{await chrome.evaluate(rows=>rows.forEach(({node,parent,next})=>parent.insertBefore(node,next)));await chrome.dispose()}
      await testInfo.attach(`${stateName}-${width}-${theme}`,{path,contentType:'image/png'});
      await detail.locator('summary').focus();await page.keyboard.press('Enter');
      await expect(detail).toHaveAttribute('open','');
      await expect(root.getByRole('button',{name:'Entenda o Índice de Prontidão'})).toBeVisible();
      await detail.locator('summary').click();
    }
  };
  await inspect('insufficient');
  await page.locator('#approvalDashboard .readiness-explanation > summary').click();
  const help=page.locator('#approvalDashboard').getByRole('button',{name:'Entenda o Índice de Prontidão'});
  await help.click();await expect(page.locator('#readiness')).toBeFocused();
  await page.getByRole('button',{name:'Voltar à análise de origem'}).click();await expect(help).toBeFocused();
  await openDemo(page);await activateTab(page,'dashboard');
  await inspect('dense-demo');
});

test('iniciante sem falsa precisão encontra configuração e coleta de evidências',async({page})=>{
  await page.clock.install({time:new Date('2026-10-03T12:00:00-03:00')});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node=>node.remove());
  await page.evaluate(state=>{window.__EXTRATO_TEST__.setState(state);window.__EXTRATO_TEST__.renderAll()},createDefaultState());
  await activateTab(page,'dashboard');
  await expect(page.locator('#guidedOnboarding .onboarding-entry-cta')).toBeVisible();
  await activateTab(page,'desempenho');
  const projection=page.locator('.achievement-projection');
  await expect(projection.locator('.achievement-projection__status')).toHaveText('Dados insuficientes');
  const metric=label=>projection.locator('.achievement-projection__metrics > div').filter({hasText:label}).locator('strong');
  for(const label of ['Simulados comparáveis','Faixa atual','Tendência em 30 dias'])await expect(metric(label)).toHaveText('—');
  await activateTab(page,'hoje');
  await page.locator('.today-analysis-details > summary').click();
  const action=page.locator('#diagnosisCenter .next-best-action');
  // The default catalog permits introductory study, but cannot justify a required intervention.
  await expect(action).toHaveAttribute('data-action-state','ACTION_OPTIONAL');
  await expect(action).toContainText('Evidência: Baixa');
  await expect(action.locator('[data-study-action-source]')).toHaveClass(/ghost/);
  await activateTab(page,'dashboard');
  await expect(page.locator('#guidedOnboarding .onboarding-entry-cta')).toBeVisible();
});

test('cinco perfis percorrem a experiência consolidada com ação, contexto e leitura acessível',async({page},testInfo)=>{
  test.setTimeout(300_000);
  const today='2026-10-03';
  await page.clock.install({time:new Date(today+'T12:00:00-03:00')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node=>node.remove());
  for(const profile of Object.keys(DEMO_EXPERIENCE_PROFILES)){
    const state=generateDemoData({today,preparationProfile:profile});
    await page.evaluate(value=>{const api=window.__EXTRATO_TEST__,result=api.validateBackupData(value);if(!result.valid)throw Error(result.message);api.setState(result.normalized);api.renderAll()},state);
    await activateTab(page,'dashboard');
    await expect(page.locator('#approvalDashboard')).not.toBeEmpty();
    await expectNoPageOverflow(page);
    await activateTab(page,'hoje');
    await expect(page.locator('#panel-hoje')).toBeVisible();
    await expectNoPageOverflow(page);
    await activateTab(page,'desempenho');
    await page.locator('[data-performance-section="overview"]').click();
    const trajectory=page.locator('.achievement-projection');
    await expect(trajectory).toBeVisible();
    if(profile==='beginner')await expect(trajectory.locator('.achievement-projection__status')).toHaveText('Dados insuficientes');
    if(profile==='high_performance')await expect(trajectory.locator('.achievement-projection__status')).toHaveText('No caminho');
    if(profile==='irregular')await expect(trajectory).toContainText('Execução do plano baixa');
    if(profile==='final_stretch')await expect(trajectory.locator('.achievement-projection__status')).toHaveText('Em risco');
    await expectNoPageOverflow(page);
    const capture=testInfo.outputPath(profile+'-desempenho-390.png');
    const chrome=await page.evaluateHandle(()=>[...document.querySelectorAll('.sticky-shell,#backToTopBtn,.skip-link')].map(node=>{const position={node,parent:node.parentNode,next:node.nextSibling};node.remove();return position;}));
    try{await trajectory.screenshot({path:capture,animations:'disabled'});}finally{await chrome.evaluate(positions=>positions.forEach(({node,parent,next})=>parent.insertBefore(node,next)));await chrome.dispose();}
    await testInfo.attach(profile+'-desempenho-390',{path:capture,contentType:'image/png'});
    await activateTab(page,'metas');
    await expect(page.locator('#metasContainer')).not.toBeEmpty();
    await expectNoPageOverflow(page);
    await activateTab(page,'dashboard');
    await expect(page.locator('#weeklyCloseDashboard')).not.toBeEmpty();
    await expect(page.locator('.weekly-comparison-detail')).not.toHaveAttribute('open','');
    await expectNoPageOverflow(page);
  }
});

test('Demo apresenta próxima ação, evidências progressivas e explicação da Prontidão',async({page})=>{
  test.setTimeout(120_000);
  await page.setViewportSize({width:375,height:812});
  await openDemo(page);
  await activateTab(page,'hoje');
  await page.locator('.today-analysis-details > summary').click();
  const action=page.locator('#diagnosisCenter .next-best-action');
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute('data-action-state',/ACTION_REQUIRED|ACTION_OPTIONAL|MAINTAIN_PLAN|INSUFFICIENT_EVIDENCE|NO_ELIGIBLE_ACTION/);
  const first=page.locator('#diagnosisCenter .consolidated-diagnosis-row').first();
  await expect(first.locator('.diagnostic-quality')).toBeVisible();
  await expect(first.locator('.diagnostic-detail')).not.toHaveAttribute('open','');
  await first.locator('.diagnostic-detail > summary').click();
  await expect(first.locator('.diagnostic-detail__body')).toBeVisible();
  await first.locator('.diagnostic-detail__method > summary').click();
  await expect(first.locator('.diagnostic-detail__method')).toContainText('confianças');
  await expectNoPageOverflow(page);

  await activateTab(page,'desempenho');
  const explanation=page.locator('.readiness-change-explanation');
  await expect(explanation).toBeVisible();
  await explanation.locator('summary').click();
  await expect(explanation).toContainText(/Prontidão|comparação/);
  for(const section of ['questions','simulations','subjects','consistency']){
    await page.locator(`[data-performance-section="${section}"]`).evaluate(button=>button.click());
    await expect(page.locator('#performanceSectionContent')).not.toBeEmpty();
    await expectNoPageOverflow(page);
  }
  await page.locator('#performancePeriod').selectOption('90');
  const scope=await page.locator('.performance-scope-note').textContent();
  const records=()=>page.evaluate(()=>localStorage.getItem('bb-premium-study-data'));
  const before=await records();
  await page.locator('.adherence-summary').getByRole('button',{name:'Entenda aderência',exact:true}).click();
  await expect(page.locator('#adherence')).toBeFocused();
  await page.getByRole('button',{name:'Voltar à análise de origem'}).click();
  await expect(page.locator('#performancePeriod')).toHaveValue('90');
  await expect(page.locator('.performance-section-button[data-performance-section="consistency"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.performance-scope-note')).toHaveText(scope);
  await expect(page.locator('.adherence-summary').getByRole('button',{name:'Entenda aderência',exact:true})).toBeFocused();
  await page.locator('[data-performance-section="overview"]').click();
  await page.locator('.achievement-projection__details > summary').filter({hasText:'Entender esta projeção'}).click();
  await page.locator('.projection-evidence-method > summary').click();
  await page.getByRole('button',{name:'Entenda faixa e confiança na ajuda'}).click();
  await expect(page.locator('#projections')).toBeFocused();
  await page.locator('#projections').getByRole('button',{name:'Ver trajetória em Desempenho',exact:true}).click();
  await expect(page.locator('.achievement-projection')).toBeFocused();
  await expect(page.locator('#performancePeriod')).toHaveValue('90');
  await expect(page.locator('.performance-scope-note')).toHaveText(scope);
  expect(await records()).toBe(before);
});
