import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';

async function prepareStudyCase(page){
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),topic=state.subjects[0].topics[0];
    topic.status='Não iniciado';topic.archived=false;topic.estimatedStudyMinutes=35;topic.prerequisites=[];
    const second={...structuredClone(topic),id:'cycle-topic-2',name:'Segundo tópico',estimatedStudyMinutes:40};
    state.subjects.push({id:'cycle-subject-2',name:'Disciplina seguinte',archived:false,topics:[second]});
    state.studySessions=[];state.questoes=[];state.dailyPlans=[];state.recommendationFeedback=[];state.reviewAgenda=[];
    api.setState(state);api.renderAll();
  });
}

for(const source of ['overview','today','diagnosis'])test(`ação ${source} percorre cronômetro, sessão, evidência e nova prioridade`,async({page})=>{
  await prepareStudyCase(page);
  await activateTab(page,source==='overview'?'dashboard':'hoje');
  if(source==='diagnosis')await page.locator('.today-analysis-details > summary').click();
  const action=source==='overview'
    ?page.locator('#overviewNextAction .overview-action-card[data-activity-type="study"]')
    :source==='today'
      ?page.locator('#studyRecommendation .study-recommendation[data-activity-type="study"]').first()
      :page.locator('#diagnosisCenter .diagnostic-row[data-activity-type="study"] button[data-study-action-source="diagnosis"]').first();
  await expect(action).toBeVisible();
  const actionId=await action.getAttribute('data-study-action-id');
  expect(actionId).toBeTruthy();
  if(source==='diagnosis')await action.click();
  else await action.getByRole('button',{name:/Iniciar estudo/i}).click();
  await expect(page.locator('#guidedStrategy')).toBeVisible();
  const timer=await page.evaluate(()=>({
    ...window.__EXTRATO_TEST__.getState().activeTimer,
    subjectName:document.querySelector('#timerSubjectSelect option:checked')?.textContent,
    topicName:document.querySelector('#timerTopicSelect option:checked')?.textContent
  }));
  expect(timer.recommendationId).toBe(actionId);
  expect(timer.recommendationSource).toBe(source);
  expect(timer.recommendationType).toBe('study');
  expect(timer.type).toBe('study');
  expect(timer.subjectId).toBeTruthy();expect(timer.topicId).toBeTruthy();
  expect(timer.subjectName).toBeTruthy();expect(timer.topicName).toBeTruthy();
  expect(timer.targetMinutes).toBeGreaterThanOrEqual(15);
  await expect.poll(()=>page.locator('#studyTimerDisplay').innerText()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await expect(page.locator('#sessionModalOverlay')).toBeVisible();
  await expect(page.locator('#sessionModalSubject')).toHaveValue(timer.subjectId);
  await expect(page.locator('#sessionModalTopic')).toHaveValue(timer.topicId);
  await expect(page.locator('#sessionModalType')).toHaveValue('study');
  await page.locator('#sessionModalDifficulty').selectOption('medium');
  await page.locator('#sessionModalSaveBtn').click();
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__.getState().studySessions.length)).toBe(1);
  const result=await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=api.getState(),session=state.studySessions.at(-1);
    const feedback=state.recommendationFeedback.find(item=>item.recommendationId===session.recommendationId);
    const candidate=api.intelligenceCandidates().find(item=>item.topicId===session.topicId);
    return {session,feedback,candidate};
  });
  expect(result.session.recommendationId).toBe(actionId);
  expect(result.session.recommendationSource).toBe(source);
  expect(result.session.recommendationType).toBe('study');
  expect(result.session.subjectId).toBe(timer.subjectId);
  expect(result.session.topicId).toBe(timer.topicId);
  expect(result.session.durationSeconds).toBeGreaterThan(0);
  expect(result.session.perceivedDifficulty).toBe('medium');
  expect(result.feedback?.completed).toBe(true);
  expect(result.feedback?.resultingSessionId).toBe(result.session.id);
  expect(result.feedback?.snapshot).toBeTruthy();
  expect(result.candidate?.completed).toBe(true);
  await activateTab(page,'dashboard');
  const nextId=await page.locator('#overviewNextAction .overview-action-card').getAttribute('data-study-action-id');
  expect(nextId).toBeTruthy();expect(nextId).not.toBe(actionId);
});
