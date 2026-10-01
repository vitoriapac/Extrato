import {readFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
import {CURRENT_SCHEMA_VERSION} from '../../src/state/schema.js';

const pick=state=>({
  subjects:state.subjects,exams:state.exams,examQuestions:state.examQuestions,
  studySessions:state.studySessions,recommendationHistory:state.recommendationHistory,
  adaptivePlanningHistory:state.adaptivePlanningHistory,achievementsUnlocked:state.achievementsUnlocked,
  weeklyCloseSnapshots:state.weeklyCloseSnapshots,algorithmVersions:state.algorithmVersions,
  consistencyTarget:state.metas.consistenciaSemanal
});
async function importBackup(page,backup,name='backup.json'){
  await page.locator('#importBackupFile').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('#modalOverlay')).toBeVisible();
  await page.locator('#modalConfirmBtn').click();
}
async function exportBackup(page){
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportBackupBtn').click();
  const download=await downloadPromise;
  return JSON.parse(await readFile(await download.path(),'utf8'));
}
async function clearAndReload(page){
  await page.locator('#clearAllDataBtn').click();
  await page.getByRole('button',{name:'Confirmar'}).click();
  await page.locator('#modalPromptInput').fill('LIMPAR');
  await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Limpar dados'}).click()]);
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
}

test('schema 24 sobrevive a exportação, limpeza, recarga e restauração',async({page})=>{
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  const seeded=await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0],topic=subject.topics[0];
    state.exams=[
      {id:'cycle-complete',institution:'Banco do Brasil',examName:'BB 2023',role:'Escriturário',board:'Cesgranrio',year:2023,date:null,source:'imported',sourceReference:'Teste',coverage:'complete',declaredCoverage:'complete',examTags:['bb-escriturario'],importedQuestionCount:1,expectedQuestionCount:1,unresolvedQuestions:[]},
      {id:'cycle-partial',institution:'Banco do Brasil',examName:'BB 2025',role:'Escriturário',board:'Cesgranrio',year:2025,date:null,source:'imported',sourceReference:'Teste',coverage:'partial',declaredCoverage:'complete',examTags:['bb-escriturario'],importedQuestionCount:2,expectedQuestionCount:3,unresolvedQuestions:[{number:2,subject:subject.name,topic:'Pendente',weight:1}]}
    ];
    state.examQuestions=[
      {id:'cycle-question-1',examId:'cycle-complete',subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1,source:'Caderno',classification:{method:'manual',confidence:1,reviewedAt:'2026-09-20T12:00:00Z'}},
      {id:'cycle-question-2',examId:'cycle-partial',subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1,source:'Caderno',classification:{method:'imported',confidence:.4}}
    ];
    state.studySessions=[{id:'cycle-session',date:'2026-09-20',subjectId:subject.id,topicId:topic.id,type:'study',durationSeconds:1800,questionsResolved:0,correctAnswers:0,notes:'Sessão preservada'}];
    state.metas.consistenciaSemanal=3;
    state.recommendationHistory=[{id:'cycle-recommendation',createdAt:'2026-09-20T12:00:00Z',status:'pending',activityType:'study',reasons:['Lacuna estratégica'],suggestedMinutes:30,priority:70,subjectId:subject.id,topicId:topic.id,algorithmVersions:{priority:5,examIntelligence:1}}];
    state.adaptivePlanningHistory=[{id:'cycle-adaptive',createdAt:'2026-09-20T12:00:00Z',status:'suggested',sourceSubjectId:subject.id,targetSubjectId:subject.id,minutes:15,reasons:['Evidência nova'],sourceBefore:90,sourceAfter:75,targetBefore:90,targetAfter:105,algorithmVersion:4}];
    state.achievementsUnlocked={'Prova mapeada':'2026-09-20'};
    state.weeklyCloseSnapshots=[{id:'cycle-week',period:{start:'2026-09-14',end:'2026-09-20'},savedAt:'2026-09-20T12:00:00Z',version:1,algorithmVersion:'2.1.0',weeklyClose:{state:'available',strategicFocus:{highImpactPercent:60}},gapMap:{items:[]},decisionHistory:{items:[]}}];
    api.setState(state);api.renderAll();
    return {valid:api.validateBackupData(api.getState()).valid};
  });
  expect(seeded.valid).toBe(true);
  const exported=await exportBackup(page);
  await clearAndReload(page);
  expect(await page.evaluate(()=>window.__EXTRATO_TEST__.getState().exams.length)).toBe(0);
  await importBackup(page,exported);
  const restored=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
  expect(restored.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  expect(restored.metas.consistenciaSemanal).toBe(3);
  expect(pick(restored)).toEqual(pick(exported));
});

test('backup do schema 23 migra lacunas como desconhecidas e pode ser exportado e importado novamente',async({page})=>{
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  const legacy=await page.evaluate(()=>{
    const state=structuredClone(window.__EXTRATO_TEST__.getState()),subject=state.subjects[0],topic=subject.topics[0];
    state.schemaVersion=23;
    delete state.metas.consistenciaSemanal;
    state.exams=[{id:'legacy-exam-2023',institution:'Banco do Brasil',examName:'BB 2023',role:'Escriturário',board:'Cesgranrio',year:2023,date:null,source:'imported',sourceReference:'Legado',coverage:'complete',examTags:['bb-escriturario']}];
    state.examQuestions=[{id:'legacy-exam-question',examId:'legacy-exam-2023',subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1,source:'Legado',classification:{method:'manual',confidence:1}}];
    return state;
  });
  await importBackup(page,legacy,'backup-v23.json');
  const migrated=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
  expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  expect(migrated.metas.consistenciaSemanal).toBe(5);
  expect(migrated.exams[0].importedQuestionCount).toBeNull();
  expect(migrated.exams[0].expectedQuestionCount).toBeNull();
  expect(migrated.examQuestions).toHaveLength(1);
  const exported=await exportBackup(page);
  await clearAndReload(page);
  await importBackup(page,exported);
  const restored=await page.evaluate(()=>structuredClone(window.__EXTRATO_TEST__.getState()));
  expect(pick(restored)).toEqual(pick(exported));
});
