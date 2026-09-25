import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('impacto manual prevalece sobre o histórico na prioridade',async({page})=>{
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(element=>element.remove());
  const before=await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0],topic=subject.topics[0];
    topic.examImportance=.82;state.examBlueprint.activeExamTags=['bb-escriturario'];topic.examTags=['bb-escriturario'];
    api.setState(state);api.renderAll();
    return api.intelligenceCandidates().find(item=>item.topicId===topic.id)?.score;
  });
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0],topic=subject.topics[0];
    state.exams=[2018,2019,2021,2023,2025].map(year=>({id:`exam-${year}`,institution:'Banco do Brasil',examName:`Escriturário ${year}`,role:'Escriturário',board:'Cesgranrio',year,date:null,source:'manual',sourceReference:null,coverage:'complete',examTags:['bb-escriturario']}));
    state.examQuestions=[2018,2019,2021,2023].map(year=>({id:`historical-${year}`,examId:`exam-${year}`,subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1.5,source:'Caderno',classification:{method:'manual',confidence:1}}));
    api.setState(state);api.renderAll();
  });
  const after=await page.evaluate(()=>window.__EXTRATO_TEST__.intelligenceCandidates().find(item=>item.topicId===window.__EXTRATO_TEST__.getState().subjects[0].topics[0].id)?.score);
  expect(after).toBe(before);
  await activateTab(page,'metas');
  await expect(page.locator('#examIntelligenceSummary')).toContainText('4 de 5 provas');
  await expect(page.locator('#examIntelligenceSummary')).toContainText('Confiança moderada');
  await expectNoPageOverflow(page);
  await activateTab(page,'disciplinas');
  await page.locator('.notes-toggle-btn').first().click();
  await expect(page.locator('.topic-exam-profile').first()).toContainText('IMPACTO NA PROVA · 82%');
  await expect(page.locator('.topic-exam-profile').first()).toContainText('Peso histórico por questão');
});
