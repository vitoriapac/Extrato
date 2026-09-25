import {test,expect} from '@playwright/test';

test('backup do schema 19 preserva conteúdo e registros ao restaurar no schema atual',async({page})=>{
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  const backup=await page.evaluate(()=>{
    const state=structuredClone(window.__EXTRATO_TEST__.getState());
    const subject=state.subjects[0],topic=subject.topics[0];
    state.schemaVersion=19;
    subject.name='Disciplina do backup';topic.name='Tópico do backup';
    state.studySessions=[{id:'legacy-session',date:'2026-09-10',subjectId:subject.id,topicId:topic.id,type:'study',durationSeconds:1500,questionsResolved:0,correctAnswers:0,notes:'Sessão preservada'}];
    state.questoes=[{id:'legacy-questions',date:'2026-09-10',subjectId:subject.id,topicId:topic.id,resolved:12,correct:9}];
    state.reviewAgenda=[{id:'legacy-review',date:'2026-09-12',subjectId:subject.id,topicId:topic.id,status:'Não iniciado',tipo:'Revisão livre'}];
    delete state.recommendationHistory;delete state.adaptivePlanningHistory;
    return state;
  });
  await page.locator('#importBackupFile').setInputFiles({name:'backup-v19.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('#modalOverlay')).toBeVisible();
  await expect(page.locator('#modalOverlay')).toContainText('Backup v19');
  await page.locator('#modalConfirmBtn').click();
  const restored=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
  expect(restored.schemaVersion).toBe(22);
  expect(restored.subjects[0].name).toBe('Disciplina do backup');
  expect(restored.subjects[0].topics[0].name).toBe('Tópico do backup');
  expect(restored.studySessions.map(item=>item.id)).toContain('legacy-session');
  expect(restored.questoes.map(item=>item.id)).toContain('legacy-questions');
  expect(restored.reviewAgenda.map(item=>item.id)).toContain('legacy-review');
  expect(restored.recommendationHistory).toEqual([]);
  expect(restored.adaptivePlanningHistory).toEqual([]);
});
