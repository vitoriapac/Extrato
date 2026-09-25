import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('matriz histórica filtra concurso e detalha o tópico em mobile',async({page})=>{
  await page.goto('/?test=1');await expect(page.locator('#testReport')).toBeVisible();await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0],topic=subject.topics[0];
    state.examBlueprint.activeExamTags=['bb-escriturario'];topic.examTags=['bb-escriturario','caixa-tbn'];
    state.exams=[{id:'bb18',institution:'BB',examName:'BB 2018',role:'Escriturário',board:'Cesgranrio',year:2018,date:null,source:'manual',sourceReference:null,coverage:'complete',examTags:['bb-escriturario']},{id:'bb23',institution:'BB',examName:'BB 2023',role:'Escriturário',board:'Cesgranrio',year:2023,date:null,source:'manual',sourceReference:null,coverage:'complete',examTags:['bb-escriturario']},{id:'caixa24',institution:'Caixa',examName:'Caixa 2024',role:'TBN',board:'Cesgranrio',year:2024,date:null,source:'manual',sourceReference:null,coverage:'complete',examTags:['caixa-tbn']}];
    state.examQuestions=[{id:'q1',examId:'bb18',subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1,source:'',classification:{method:'manual',confidence:1}},{id:'q2',examId:'caixa24',subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1,source:'',classification:{method:'manual',confidence:1}}];
    api.setState(state);api.renderAll();
  });
  await activateTab(page,'metas');
  await expect(page.locator('#examHistoricalMatrix')).toContainText('2 provas completas');
  await expect(page.locator('.exam-matrix-table')).toContainText('0 questões');
  await page.locator('[data-exam-matrix-filter="scope"]').selectOption('caixa-tbn');
  await expect(page.locator('#examHistoricalMatrix')).toContainText('Caixa 2024');
  await page.setViewportSize({width:320,height:740});
  await page.locator('.exam-matrix-card [data-exam-matrix-topic]').first().click();
  await expect(page.locator('.exam-matrix-detail')).toContainText('1 de 1 provas');
  await expect(page.locator('.exam-matrix-detail')).toContainText('Sua situação');
  await expectNoPageOverflow(page);
});
