import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';

test('diagnóstico consolida o escopo atual sem modificar planos ou registros pessoais',async({page})=>{
  await page.clock.install({time:new Date('2026-09-29T12:00:00-03:00')});
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0],topic=subject.topics[0];
    state.subjects=[{...subject,topics:[{...topic,id:'only-bb',subjectId:subject.id,name:'Exclusivo BB',examTags:['bb-escriturario'],status:'Não iniciado',archived:false},{...topic,id:'only-caixa',subjectId:subject.id,name:'Exclusivo Caixa',examTags:['caixa-tbn'],status:'Não iniciado',archived:false}]}];
    state.examBlueprint.activeExamTags=['bb-escriturario'];state.studySessions=[];state.questoes=[];state.reviewAgenda=[];state.dailyPlans=[];
    api.setState(state);api.renderAll();
  });
  await activateTab(page,'hoje');await page.locator('.today-analysis-details > summary').click();
  const model=await page.evaluate(()=>window.__EXTRATO_TEST__.getConsolidatedDiagnosis());
  expect(model.topics.map(item=>item.topicId)).toEqual(['only-bb']);expect(model.summary.topics.controlled).toBe(0);
  expect(new Set(model.rows.map(item=>item.entityKey)).size).toBe(model.rows.length);
  const annotated=page.locator('#diagnosisCenter [data-consolidated-state]');expect(await annotated.count()).toBeGreaterThan(0);
  await expect(annotated.first()).toHaveAttribute('data-consolidated-signal',model.topics[0].primarySignal||'unassessed');
  const original=await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return structuredClone({sessions:state.studySessions,questions:state.questoes,plans:state.studyPlans,close:state.weeklyCloseSnapshots})});
  await page.evaluate(()=>{const value=window.__EXTRATO_TEST__.getConsolidatedDiagnosis();value.topics[0].primarySignal='tampered';value.rows.length=0});
  expect((await page.evaluate(()=>window.__EXTRATO_TEST__.getConsolidatedDiagnosis())).rows).toHaveLength(model.rows.length);
  await activateTab(page,'metas');await page.locator('#examBlueprintConfig .active-exams input').nth(1).evaluate(input=>input.click());await page.locator('#examBlueprintConfig .active-exams input').nth(0).evaluate(input=>input.click());
  await activateTab(page,'hoje');
  const changed=await page.evaluate(()=>window.__EXTRATO_TEST__.getConsolidatedDiagnosis());
  expect(changed.activeExamTags).toEqual(['caixa-tbn']);expect(changed.topics.map(item=>item.topicId)).toEqual(['only-caixa']);
  expect(await page.evaluate(()=>{const state=window.__EXTRATO_TEST__.getState();return structuredClone({sessions:state.studySessions,questions:state.questoes,plans:state.studyPlans,close:state.weeklyCloseSnapshots})})).toEqual(original);
});
