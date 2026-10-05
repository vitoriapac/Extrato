import {test,expect} from '@playwright/test';
import {activateTab} from '../e2e/helpers.js';
import {AUDIT_TODAY,AUDIT_PROFILES,buildJourneyProfile} from './product-journey-profiles.js';

for(const profile of AUDIT_PROFILES)test(`jornada auditada: ${profile}`,async({page})=>{
 const inspectionOnly=process.env.AUDIT_MODE==='inspection';
 const report={profile,mode:inspectionOnly?'inspection':'transactions',status:'running',steps:[],issues:[],transactionCoverage:[]};
 await page.clock.install({time:new Date(AUDIT_TODAY+'T12:00:00-03:00')});
 await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(node=>node.remove());
 await page.evaluate(state=>{const api=window.__EXTRATO_TEST__;api.setState(state);api.renderAll();window.__auditClicks=0;document.addEventListener('click',event=>{if(event.target.closest('button,a,summary'))window.__auditClicks++})},buildJourneyProfile(profile));
 let lastClicks=0;
 async function capture(step,selector,coverage='inspection'){
  const section=page.locator(selector);await expect(section).toBeVisible();
  const metrics=await section.evaluate(root=>{
   const visible=node=>node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden';
   const buttons=[...root.querySelectorAll('button')].filter(visible),headings=[...root.querySelectorAll('h2,h3,h4')].filter(visible).map(node=>node.textContent.trim());
   return {clicks:window.__auditClicks,choices:[...root.querySelectorAll('button,a,summary,input,select')].filter(visible).length,
    primaryCtas:buttons.filter(node=>node.matches('.btn:not(.ghost):not(.danger)')).map(node=>node.textContent.trim()),
    repeatedHeadings:[...new Set(headings.filter((text,index)=>text&&headings.indexOf(text)!==index))],
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
    topLevelSections:[...root.children].filter(visible).length};
  });
  report.steps.push({step,coverage,clicksSincePreviousStep:metrics.clicks-lastClicks,...metrics});lastClicks=metrics.clicks;
  if(metrics.horizontalOverflow)report.issues.push({screen:step,type:'horizontal_overflow',severity:'high',description:'A página excede a largura do viewport.'});
 }
 await activateTab(page,'dashboard');await capture('onboarding','#panel-dashboard');
 await activateTab(page,'disciplinas');await capture('subjects','#panel-disciplinas');
 await activateTab(page,'metas');await capture('planning','#panel-metas');
 if(profile!=='new'){
  await page.getByRole('button',{name:'Calcular proposta semanal',exact:true}).click();
  await expect(page.getByRole('button',{name:'Confirmar e salvar plano',exact:true})).toBeVisible();
  await capture('planning-preview','#examStudyPlan','preview');
  await page.getByRole('button',{name:'Descartar proposta',exact:true}).click();report.transactionCoverage.push('planning_preview_discarded');
 }else report.transactionCoverage.push('planning_missing_exam_date_inspected');
 await activateTab(page,'hoje');await capture('today','#panel-hoje');
 const order=await page.evaluate(()=>({plan:document.querySelector('#planoHojeContent').getBoundingClientRect().top,suggestion:document.querySelector('#studyRecommendation').getBoundingClientRect().top}));
 if(process.env.AUDIT_PHASE==='after')expect(order.plan).toBeLessThan(order.suggestion);
 if(order.suggestion<order.plan)report.issues.push({screen:'today',type:'optional_action_before_plan',severity:'high',description:'A recomendação precede o plano confirmado.',recommendation:'Apresentar o plano antes da sugestão opcional.'});
 await activateTab(page,'dashboard');
 if(!inspectionOnly)for(const type of ['study','questions','review','simulation']){
  await page.locator('#timerTypeSelect').selectOption(type);
  await page.locator('#timerStartBtn').click();await page.clock.fastForward('02:00');await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();
  if(type==='questions'){await page.locator('#sessionModalResolved').fill('10');await page.locator('#sessionModalCorrect').fill('7')}
  if(type==='review')await page.locator('#sessionModalRetention').selectOption('effortful');
  await page.locator('#sessionModalSaveBtn').click();
  if(type==='simulation'){
   const row=page.locator('#simuladosBody tr.row-editing');await expect(row).toBeVisible();
   await row.getByLabel('Nome',{exact:true}).fill('Simulado da auditoria');await row.getByLabel('Acertos',{exact:true}).fill('7');await row.getByLabel('Total',{exact:true}).fill('10');
   await row.getByRole('button',{name:'Salvar alterações',exact:true}).click();
   await capture('simulation','#panel-questoes','transaction');
  }else await capture(type==='study'?'session':type,'#panel-dashboard','transaction');
  report.transactionCoverage.push(type);if(type==='simulation')await activateTab(page,'dashboard');
 }
 if(!inspectionOnly){
  const recorded=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return {sessions:state.studySessions.slice(-4).map(row=>row.type),questions:state.questoes.at(-1)?.resolved,simulation:state.simulados.at(-1)?.nome}});
  expect(recorded.sessions).toEqual(['study','questions','review','simulation']);expect(recorded.questions).toBe(10);expect(recorded.simulation).toBe('Simulado da auditoria');
 }
 await activateTab(page,'desempenho');await capture('performance','#performancePage');
 await activateTab(page,'hoje');await page.locator('.today-analysis-details > summary').click();
 await capture('diagnosis','#diagnosisCenter');await capture('replanning','#weeklyReplan');
 await activateTab(page,'dashboard');await capture('weekly-close','#weeklyCloseDashboard');
 await activateTab(page,'hoje');await expect(page.locator('#planoHojeContent')).toBeVisible();
 report.returnPath='weekly close → Today';report.status='passed';
 await test.info().attach('journey-audit',{body:JSON.stringify(report),contentType:'application/json'});
});
