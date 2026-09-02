import {
  STORAGE_KEY,BACKUP_KEY,BACKUP_INDEX_KEY,AUTOMATIC_BACKUP_SLOTS,CURRENT_SCHEMA_VERSION,MAX_BACKUP_FILE_SIZE,
  DB_NAME,DB_VERSION,STORE_NAME,STATUS_OPTIONS,REVIEW_OPTIONS,STATUS_CLASS,TIPO_AGENDA_OPTIONS,
  DIFFICULTY_OPTIONS,DIFFICULTY_WEIGHT,DIFFICULTY_CLASS,DEMO_STORAGE_KEY
} from './state/schema.js';
import {uid,isPlainObject,isSafeId,isISODate,isOptionalTimestamp,isFiniteNonNegative,structuredCloneSafe,pluralize} from './core/utils.js';
import {createStorageManager,repositoryReadLocalState,repositoryWriteLocalState} from './storage/repository.js';
import {createRealStorageProvider} from './storage/real-storage-provider.js';
import {createDemoStorageProvider} from './storage/demo-storage-provider.js';
import {createClock} from './core/clock.js';
import {createAppContext} from './application/create-app-context.js';
import {bootstrapApplication} from './bootstrap.js';
import {AGENDA_INTERVALS,DIFFICULTY_INTERVALS,REVIEW_RATINGS,calculateAdaptiveInterval,createAdaptiveReviewState,applyAdaptiveReviewRating} from './domain/reviews.js';
import {createDefaultState} from './state/defaults.js';
import {labelDynamicControls,trapModalTab} from './ui/accessibility.js';
import {renderCollectionFooter,renderGroupHeader} from './ui/list-components.js';
import {countActiveFilters,filterPanelLabel} from './ui/filter-panel.js';
import {filterStudySessions,groupStudySessionsByDate} from './ui/session-history.js';
import {calculateReadinessScore,READINESS_WEIGHTS} from './domain/analytics/readiness-score.js';
import {calculateTopicCoverage} from './domain/analytics/coverage.js';
import {calculateActivityStreak,calculateGoalConsistency} from './domain/analytics/consistency.js';
import {calculateWindowTrend} from './domain/analytics/trends.js';
import {summarizeStudyRecords} from './domain/analytics/study-metrics.js';
import {normalizeTopicStrategy,normalizeExamBlueprint,normalizeAlgorithmVersions,EXAM_PRIORITIES} from './state/strategic.js';
import {buildExecutiveSummary} from './application/build-executive-summary.js';
import {buildCognitiveProfile} from './domain/diagnostics/cognitive-profile.js';
import {HEATMAP_METRICS,heatmapMetricLevel} from './domain/analytics/heatmap.js';
import {calculateSubjectRadar} from './domain/analytics/multidimensional-radar.js';
import {generateDiagnosis} from './application/generate-diagnosis.js';
import {recommendStudy} from './application/recommend-study.js';
import {createRecommendationPresentation,recordRecommendationDecision,completeRecommendationFeedback,rateRecommendationFeedback,summarizeRecommendationFeedback} from './application/recommendations/recommendation-feedback.js';
import {buildHeatmapViewModel,buildDiagnosisViewModel,buildApprovalSignals} from './application/analytics/build-analytics-view-model.js';
import {calculateRiskScore} from './domain/diagnostics/risk-score.js';
import {buildStudyPlan} from './application/build-study-plan.js';
import {buildReplanProposal,applyReplan,undoReplan} from './application/replan-study.js';
import {buildDailyPlanProposal,applyDailyPlanProposal,undoDailyPlanGeneration} from './application/planning/distribute-study-plan.js';
import {dismissAlert,reconcileAlerts} from './application/alert-lifecycle.js';
import {buildPerformanceForecast} from './domain/forecasts/performance-forecast.js';
import {APP_MODES,readAppMode,enterDemoMode,exitDemoMode,resetDemoMode} from './application/demo/demo-mode.js';
import {generateDemoData} from './demo/demo-generator.js';
import {runStateMigrations,validateBackupEnvelope} from './storage/migration-service.js';
import {serializeBackup,parseBackupText,backupFileName} from './storage/backup-service.js';
import {createAppRepositories} from './repositories/collection-repository.js';
import {buildStrategicReport} from './reports/report-data.js';
import {renderStrategicReport} from './reports/report-template.js';
import {printStrategicReport} from './reports/print-report.js';

const THEME_STORAGE_KEY='bb-premium-theme';
const MODE_FLASH_KEY='bb-premium-mode-message';
const TEST_MODE=new URLSearchParams(location.search).get('test')==='1';
const APP_MODE=TEST_MODE?APP_MODES.REAL:readAppMode(globalThis.sessionStorage);
const IS_DEMO_MODE=APP_MODE===APP_MODES.DEMO;
let suppressBeforeUnloadSave=false;
const appClock=createClock();
function nowISO(){return appClock.nowISO()}
function getCurrentTheme(){
  return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
}
function updateThemeToggleIcon(){
  const icon=document.getElementById('themeToggleIcon');
  if(icon) icon.textContent=getCurrentTheme()==='dark'?'☀️':'🌙';
  const button=document.getElementById('themeToggleBtn');
  if(button) button.setAttribute('aria-label',getCurrentTheme()==='dark'?'Mudar para modo claro':'Mudar para modo escuro');
}
function setTheme(theme){
  document.documentElement.setAttribute('data-theme',theme==='dark'?'dark':'light');
  try{ localStorage.setItem(THEME_STORAGE_KEY,theme); }catch(e){}
  updateThemeToggleIcon();
}
function toggleTheme(){ setTheme(getCurrentTheme()==='dark'?'light':'dark'); }
document.getElementById('themeToggleBtn').addEventListener('click',toggleTheme);
updateThemeToggleIcon();
document.getElementById('exportReportBtn')?.addEventListener('click',()=>{
  const diagnosis=generateDiagnosis(intelligenceCandidates()),report=buildStrategicReport({state,generatedAt:nowISO(),isDemo:IS_DEMO_MODE,readiness:readinessResult(computeApprovalMetrics()),diagnosis,forecast:projectPerformance()});
  printStrategicReport({document,window,report,render:renderStrategicReport});
});

const ERROR_CATEGORIES = {
  naoSabia:{label:'Não sabia',icon:'📚'},
  esqueci:{label:'Esqueci',icon:'🧠'},
  interpretacao:{label:'Interpretação',icon:'📖'},
  calculo:{label:'Cálculo',icon:'➗'},
  desatencao:{label:'Desatenção',icon:'⚠️'},
  chute:{label:'Chute',icon:'🎲'}
};
const MIN_WEEKLY_QUESTIONS = 10;
const MIN_TREND_WINDOW_QUESTIONS = 30;
const MIN_TOPIC_TREND_WINDOW_QUESTIONS = 20;
const MIN_ERROR_RECOMMENDATION_COUNT = 10;
const MIN_ERROR_RECOMMENDATION_COVERAGE = 60;
const DEFAULT_STREAK_WEEKS = 12;
const streakView = {expanded:false,onlyActiveDays:false,metric:'hours',subjectId:'',selectedDate:null};
const ERROR_RECOMMENDATIONS = {
  naoSabia:{action:'Revisar a teoria e os conceitos-base',studyType:'study',estimatedMinutes:35,questions:10},
  esqueci:{action:'Fazer uma revisão curta e recuperar de memória',studyType:'review',estimatedMinutes:25,questions:15},
  interpretacao:{action:'Resolver questões comentadas de interpretação',studyType:'questions',estimatedMinutes:40,questions:15},
  calculo:{action:'Treinar exercícios de cálculo passo a passo',studyType:'questions',estimatedMinutes:45,questions:15},
  desatencao:{action:'Resolver questões com conferência obrigatória',studyType:'questions',estimatedMinutes:35,questions:20},
  chute:{action:'Reforçar conceitos antes de voltar às questões',studyType:'study',estimatedMinutes:30,questions:10}
};
const DIAGNOSIS_STATUS_ICON = {'Crítico':'🔴','Atenção':'🟠','Acompanhamento':'🟡','Em dia':'🟢'};


let state = createDefaultState();

function getSubjectById(subjectId){
  return state.subjects.find(s => s.id === subjectId) || null;
}
function getTopicById(topicId){
  for(const subject of state.subjects){
    const topic = subject.topics.find(t => t.id === topicId);
    if(topic) return { subject, topic };
  }
  return null;
}
function getSubjectName(subjectId){ return getSubjectById(subjectId)?.name || 'Disciplina removida'; }
function getTopicName(topicId){ return getTopicById(topicId)?.topic?.name || 'Tópico removido'; }
function entitySubjectId(item){
  if(item?.subjectId) return item.subjectId;
  return state.subjects.find(s => s.name === item?.subject)?.id || null;
}
function entitySubjectName(item){
  const id = entitySubjectId(item);
  return id ? getSubjectName(id) : (item?.subject || '—');
}

function historicalLocalDate(value){
  if(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return timestampToLocalDateISO(value) || todayISO();
}
function normalizeHistoryEvent(event){
  if(!event.id) event.id=uid('history');
  if(!event.occurredAt) event.occurredAt=event.date||nowISO();
  if(!event.date) event.date=event.occurredAt;
  if(!event.localDate) event.localDate=historicalLocalDate(event.occurredAt||event.date);
  if(!event.metadata||typeof event.metadata!=='object') event.metadata={};
  event.subjectId=event.subjectId||null;
  event.topicId=event.topicId||null;
  return event;
}

function migrateV1toV2(data){
  const subjectIdByName = new Map();
  (data.subjects || []).forEach(subject => {
    if(!subject.id) subject.id = uid('subject');
    subject.archived = Boolean(subject.archived);
    subject.createdAt = subject.createdAt || nowISO();
    if(!Array.isArray(subject.topics)) subject.topics = [];
    subjectIdByName.set(subject.name, subject.id);
    subject.topics.forEach(topic => {
      if(!topic.id) topic.id = uid('topic');
      topic.createdAt = topic.createdAt || nowISO();
    });
  });

  (data.questoes || []).forEach(q => {
    q.id = q.id || uid('question');
    q.subjectId = q.subjectId || subjectIdByName.get(q.subject) || null;
    q.topicId = q.topicId || null;
    q.createdAt = q.createdAt || nowISO();
  });
  (data.calendar || []).forEach(item => {
    item.id = item.id || uid('calendar');
    item.subjectId = item.subjectId || subjectIdByName.get(item.subject) || null;
    item.topicId = item.topicId || null;
    item.createdAt = item.createdAt || nowISO();
  });
  (data.reviewAgenda || []).forEach(item => {
    item.id = item.id || uid('review');
    item.subjectId = item.subjectId || subjectIdByName.get(item.subject) || null;
    item.topicId = item.topicId || item.topicRef || null;
    item.createdAt = item.createdAt || nowISO();
    item.completedAt = item.completedAt || null;
  });
  (data.simulados || []).forEach(sim => {
    sim.id = sim.id || uid('simulado');
    sim.createdAt = sim.createdAt || nowISO();
    (sim.breakdown || []).forEach(b => {
      b.id = b.id || uid('breakdown');
      b.subjectId = b.subjectId || subjectIdByName.get(b.subject) || null;
    });
  });
  (data.metasPorDisciplina || []).forEach(meta => {
    meta.id = meta.id || uid('goal');
    meta.subjectId = meta.subjectId || subjectIdByName.get(meta.subject) || null;
  });
  (data.studySessions || []).forEach(session => {
    session.id = session.id || uid('session');
    session.subjectId = session.subjectId || subjectIdByName.get(session.subject) || null;
    session.topicId = session.topicId || null;
  });
  data.schemaVersion = 2;
  return data;
}

function migrateV2toV3(data){
  (data.subjects||[]).forEach(subject=>(subject.topics||[]).forEach(topic=>{
    topic.firstCompletedAt=topic.firstCompletedAt||(topic.completedAt?`${topic.completedAt}T12:00:00.000Z`:null);
    topic.lastCompletedAt=topic.lastCompletedAt||topic.firstCompletedAt||null;
    topic.completionCount=Number(topic.completionCount)||(topic.completedAt?1:0);
    topic.lastReviewedAt=topic.lastReviewedAt||null;
    topic.reviewCount=Number(topic.reviewCount)||0;
  }));
  if(!Array.isArray(data.topicHistory)) data.topicHistory=[];
  data.topicHistory.forEach(event=>{
    if(!event.id) event.id=uid('history');
    if(!event.occurredAt) event.occurredAt=event.date||nowISO();
    if(!event.date) event.date=event.occurredAt;
  });
  (data.subjects||[]).forEach(subject=>(subject.topics||[]).forEach(topic=>{
    if(topic.completedAt&&!data.topicHistory.some(event=>event.type==='topic_completed'&&event.topicId===topic.id)){
      const occurredAt=topic.lastCompletedAt||`${topic.completedAt}T12:00:00.000Z`;
      data.topicHistory.push({id:uid('history'),date:occurredAt,occurredAt,type:'topic_completed',subjectId:subject.id,topicId:topic.id,metadata:{migrated:true}});
    }
  }));
  (data.reviewAgenda||[]).forEach(review=>{
    const topicId=review.topicId||review.topicRef||null;
    if(review.completedAt&&!data.topicHistory.some(event=>event.type==='review_completed'&&event.metadata?.reviewId===review.id)){
      data.topicHistory.push({id:uid('history'),date:review.completedAt,occurredAt:review.completedAt,type:'review_completed',subjectId:review.subjectId||null,topicId,metadata:{reviewId:review.id,reviewType:review.tipo,migrated:true}});
    }
  });
  data.schemaVersion=3;
  return data;
}

function migrateV3toV4(data){
  (data.subjects||[]).forEach(subject=>{
    if(!('archived' in subject)) subject.archived=false;
    if(!('archivedAt' in subject)) subject.archivedAt=null;
    (subject.topics||[]).forEach(topic=>{
      if(!('archived' in topic)) topic.archived=false;
      if(!('archivedAt' in topic)) topic.archivedAt=null;
    });
  });
  data.schemaVersion=4;
  return data;
}


function migrateV4toV5(data){
  (data.questoes||[]).forEach(question=>{
    question.topicId=question.topicId||null;
    const source=question.errorBreakdown||{};
    question.errorBreakdown={};
    Object.keys(ERROR_CATEGORIES).forEach(key=>{
      question.errorBreakdown[key]=Math.max(0,Math.floor(Number(source[key])||0));
    });
  });
  data.schemaVersion=5;
  return data;
}

function migrateV5toV6(data){
  if(!Array.isArray(data.topicHistory)) data.topicHistory=[];
  data.topicHistory.forEach(normalizeHistoryEvent);
  data.schemaVersion=6;
  return data;
}

function migrateV6toV7(data){
  if(!data.metas||typeof data.metas!=='object') data.metas={};
  const legacyHours=Number(data.metas.horasDiarias);
  const base=Number.isFinite(legacyHours)?Math.max(0,legacyHours):2.5;
  const source=data.metas.horasPorDia&&typeof data.metas.horasPorDia==='object'?data.metas.horasPorDia:{};
  data.metas.horasPorDia={};
  for(let day=0;day<7;day++) data.metas.horasPorDia[String(day)]=Math.max(0,Number(source[String(day)]??base)||0);
  (data.reviewAgenda||[]).forEach(review=>{
    review.manualDate=Boolean(review.manualDate);
    review.adaptive=review.adaptive!==false;
    review.adaptiveReason=review.adaptiveReason||null;
    review.suggestedDate=review.suggestedDate||null;
    review.baseIntervalDays=Math.max(1,Number(review.baseIntervalDays)||reviewBaseDaysFromType(review.tipo));
  });
  data.schemaVersion=7;
  return data;
}

function migrateV7toV8(data){
  if(!Array.isArray(data.dailyPlans)) data.dailyPlans=[];
  if(!data.activeTimer||typeof data.activeTimer!=='object') data.activeTimer={};
  data.activeTimer.planItemId=data.activeTimer.planItemId||null;
  data.activeTimer.targetMinutes=Number(data.activeTimer.targetMinutes)||null;
  data.schemaVersion=8;
  return data;
}

function migrateV8toV9(data){
  data.examBlueprint=normalizeExamBlueprint(data.examBlueprint,data.examDate);
  data.algorithmVersions=normalizeAlgorithmVersions(data.algorithmVersions);
  (data.subjects||[]).forEach(subject=>(subject.topics||[]).forEach(normalizeTopicStrategy));
  data.schemaVersion=9;
  return data;
}

function migrateV9toV10(data){
  if(!Array.isArray(data.studyPlans))data.studyPlans=[];
  data.schemaVersion=10;
  return data;
}
function migrateV10toV11(data){
  if(!Array.isArray(data.planAdjustments))data.planAdjustments=[];
  if(!Array.isArray(data.recommendationFeedback))data.recommendationFeedback=[];
  (data.dailyPlans||[]).forEach(plan=>(plan.items||[]).forEach(item=>{item.originalDate=item.originalDate||plan.date;item.currentDate=item.currentDate||plan.date;item.rescheduleCount=Math.max(0,Number(item.rescheduleCount)||0);item.skippedReason=item.skippedReason||null;item.recommendationId=item.recommendationId||null}));
  data.schemaVersion=11;return data;
}
function migrateV11toV12(data){if(!Array.isArray(data.alertStates))data.alertStates=[];data.schemaVersion=12;return data}
function migrateV12toV13(data){
  (data.dailyPlans||[]).forEach(plan=>{plan.studyPlanId=plan.studyPlanId||null;plan.generationOperationId=plan.generationOperationId||null;(plan.items||[]).forEach(item=>{item.studyPlanId=item.studyPlanId||null;item.studyPlanItemId=item.studyPlanItemId||null;item.generationOperationId=item.generationOperationId||null;item.rescheduledFromId=item.rescheduledFromId||null;item.rescheduleOperationId=item.rescheduleOperationId||null})});
  (data.studyPlans||[]).forEach(plan=>{if(!Array.isArray(plan.dailyPlanOperations))plan.dailyPlanOperations=[]});
  (data.planAdjustments||[]).forEach(item=>{item.operationId=item.operationId||null;item.changes=Array.isArray(item.changes)?item.changes:[];item.undoneAt=item.undoneAt||null});data.schemaVersion=13;return data
}
function migrateV13toV14(data){
  (data.recommendationFeedback||[]).forEach(item=>{item.shownAt=item.shownAt||item.createdAt||null;item.ratedAt=item.ratedAt||null;item.algorithmVersion=Math.max(1,Number(item.algorithmVersion)||1);item.score=Number.isFinite(Number(item.score))?Number(item.score):null;item.confidence=item.confidence||null});data.schemaVersion=14;return data
}
function migrateV14toV15(data){
  data.algorithmVersions=normalizeAlgorithmVersions(data.algorithmVersions);data.algorithmVersions.adaptiveReview=Math.max(2,Number(data.algorithmVersions.adaptiveReview)||2);
  (data.subjects||[]).forEach(subject=>(subject.topics||[]).forEach(topic=>{topic.adaptiveReview=topic.adaptiveReview?createAdaptiveReviewState(topic.adaptiveReview):null}));
  (data.reviewAgenda||[]).forEach(review=>{review.lastRating=REVIEW_RATINGS[review.lastRating]?review.lastRating:null;review.adaptiveState=review.adaptiveState?createAdaptiveReviewState(review.adaptiveState):null});data.schemaVersion=15;return data
}

function migrateState(data){
  return runStateMigrations(data,{currentVersion:CURRENT_SCHEMA_VERSION,migrations:{1:migrateV1toV2,2:migrateV2toV3,3:migrateV3toV4,4:migrateV4toV5,5:migrateV5toV6,6:migrateV6toV7,7:migrateV7toV8,8:migrateV8toV9,9:migrateV9toV10,10:migrateV10toV11,11:migrateV11toV12,12:migrateV12toV13,13:migrateV13toV14,14:migrateV14toV15}});
}

function ensureStateDefaults(){
  if(!state || typeof state !== 'object') state = {};
  if(!Array.isArray(state.subjects)) state.subjects = [];
  if(!Array.isArray(state.calendar)) state.calendar = [];
  if(!Array.isArray(state.reviewAgenda)) state.reviewAgenda = [];
  if(!Array.isArray(state.questoes)) state.questoes = [];
  if(!Array.isArray(state.simulados)) state.simulados = [];
  const metaDefaults={semanal:5,mensal:20,questoesSemanal:150,simuladosSemanal:1,metaAprovacao:70,horasDiarias:2.5};
  if(!state.metas||typeof state.metas!=='object') state.metas={};
  Object.entries(metaDefaults).forEach(([key,value])=>{
    if(!Number.isFinite(Number(state.metas[key]))) state.metas[key]=value;
    else state.metas[key]=Number(state.metas[key]);
  });
  const hoursSource=state.metas.horasPorDia&&typeof state.metas.horasPorDia==='object'?state.metas.horasPorDia:{};
  state.metas.horasPorDia={};
  for(let day=0;day<7;day++){
    const value=Number(hoursSource[String(day)]??state.metas.horasDiarias);
    state.metas.horasPorDia[String(day)]=Number.isFinite(value)?Math.max(0,value):state.metas.horasDiarias;
  }
  if(typeof state.examDate !== 'string') state.examDate = '';
  state.examBlueprint=normalizeExamBlueprint(state.examBlueprint,state.examDate);
  state.algorithmVersions=normalizeAlgorithmVersions(state.algorithmVersions);
  state.algorithmVersions.adaptiveReview=Math.max(2,Number(state.algorithmVersions.adaptiveReview)||2);
  if(!state.examDate&&state.examBlueprint.examDate)state.examDate=state.examBlueprint.examDate;
  if(state.examDate!==state.examBlueprint.examDate)state.examBlueprint.examDate=state.examDate||null;
  if(!Array.isArray(state.progressHistory)) state.progressHistory = [];
  if(!state.achievementsUnlocked||typeof state.achievementsUnlocked!=='object') state.achievementsUnlocked={};
  if(!Array.isArray(state.metasPorDisciplina)) state.metasPorDisciplina = [];
  if(!Array.isArray(state.studySessions)) state.studySessions = [];
  if(!Array.isArray(state.dailyPlans)) state.dailyPlans = [];
  if(!Array.isArray(state.studyPlans)) state.studyPlans = [];
  if(!Array.isArray(state.planAdjustments)) state.planAdjustments = [];
  if(!Array.isArray(state.recommendationFeedback)) state.recommendationFeedback = [];
  state.recommendationFeedback.forEach(item=>{item.shownAt=item.shownAt||item.createdAt||null;item.ratedAt=item.ratedAt||null;item.algorithmVersion=Math.max(1,Number(item.algorithmVersion)||1);item.score=Number.isFinite(Number(item.score))?Number(item.score):null;item.confidence=item.confidence||null});
  if(!Array.isArray(state.alertStates)) state.alertStates = [];
  if(!state.activeTimer || typeof state.activeTimer!=='object') state.activeTimer = {};
  state.activeTimer.startedAt = state.activeTimer.startedAt || null;
  state.activeTimer.runStartedAt = state.activeTimer.runStartedAt || null;
  state.activeTimer.accumulatedSeconds = Math.max(0,Number(state.activeTimer.accumulatedSeconds)||0);
  state.activeTimer.isRunning = Boolean(state.activeTimer.isRunning && state.activeTimer.runStartedAt);
  state.activeTimer.subjectId = state.activeTimer.subjectId || null;
  state.activeTimer.topicId = state.activeTimer.topicId || null;
  if(!['study','review','questions','simulation'].includes(state.activeTimer.type)) state.activeTimer.type='study';
  state.activeTimer.hiddenAt = state.activeTimer.hiddenAt || null;
  state.activeTimer.planItemId = state.activeTimer.planItemId || null;
  state.activeTimer.targetMinutes = Number(state.activeTimer.targetMinutes)||null;
  state.dailyPlans.forEach(plan=>{
    if(!plan.id) plan.id=uid('plan');
    if(typeof plan.date!=='string') plan.date=todayISO();
    plan.availableMinutes=Math.max(0,Number(plan.availableMinutes)||0);
    plan.studyPlanId=plan.studyPlanId||null;
    plan.generationOperationId=plan.generationOperationId||null;
    if(!Array.isArray(plan.items)) plan.items=[];
    plan.items.forEach(item=>{
      if(!item.id) item.id=uid('plan-item');
      item.subjectId=item.subjectId||null;
      item.topicId=item.topicId||null;
      if(!['study','review','questions','simulation'].includes(item.type)) item.type='study';
      item.plannedMinutes=Math.max(0,Number(item.plannedMinutes)||0);
      item.executedSeconds=Math.max(0,Number(item.executedSeconds)||0);
      if(!['planned','in_progress','partial','completed','deferred','replaced','skipped'].includes(item.status)) item.status='planned';
      if(!Array.isArray(item.sessionIds)) item.sessionIds=[];
      item.originalDate=item.originalDate||plan.date;item.currentDate=item.currentDate||plan.date;item.rescheduleCount=Math.max(0,Number(item.rescheduleCount)||0);item.skippedReason=item.skippedReason||null;item.recommendationId=item.recommendationId||null;
      item.studyPlanId=item.studyPlanId||null;item.studyPlanItemId=item.studyPlanItemId||null;item.generationOperationId=item.generationOperationId||null;item.rescheduledFromId=item.rescheduledFromId||null;item.rescheduleOperationId=item.rescheduleOperationId||null;
    });
  });
  state.studyPlans.forEach(plan=>{if(!Array.isArray(plan.dailyPlanOperations))plan.dailyPlanOperations=[]});
  if(!Array.isArray(state.topicHistory)) state.topicHistory = [];
  state.topicHistory.forEach(normalizeHistoryEvent);
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  state.subjects.forEach(s => {
    if(!Array.isArray(s.topics)) s.topics = [];
    if(typeof s.collapsed !== 'boolean') s.collapsed = false;
    if(typeof s.archived !== 'boolean') s.archived = false;
    if(!('archivedAt' in s)) s.archivedAt = null;
    if(typeof s.createdAt !== 'string') s.createdAt = nowISO();
    s.topics.forEach(t => {
      if(typeof t.notes !== 'string') t.notes = '';
      if(!Array.isArray(t.tags)) t.tags = [];
      if(!DIFFICULTY_OPTIONS.includes(t.difficulty)) t.difficulty = 'Médio';
      if(typeof t.createdAt !== 'string') t.createdAt = nowISO();
      if(typeof t.archived !== 'boolean') t.archived = false;
      if(!('archivedAt' in t)) t.archivedAt = null;
      if(!('firstCompletedAt' in t)) t.firstCompletedAt = null;
      if(!('lastCompletedAt' in t)) t.lastCompletedAt = null;
      t.completionCount = Number(t.completionCount)||0;
      if(!('lastReviewedAt' in t)) t.lastReviewedAt = null;
      t.reviewCount = Number(t.reviewCount)||0;
      t.adaptiveReview=t.adaptiveReview?createAdaptiveReviewState(t.adaptiveReview):null;
      normalizeTopicStrategy(t);
    });
  });
  state.questoes.forEach(question=>{
    question.topicId=question.topicId||null;
    normalizeErrorBreakdown(question);
  });
  state.simulados.forEach(sim => {
    if(!Array.isArray(sim.breakdown)) sim.breakdown = [];
  });
  state.studySessions.forEach(session=>{
    if(!session.id) session.id=uid('session');
    if(typeof session.date!=='string') session.date=todayISO();
    session.durationSeconds=Math.max(0,Number(session.durationSeconds)||0);
    session.subjectId=session.subjectId||null;
    session.topicId=session.topicId||null;
    session.planItemId=session.planItemId||null;
    if(!['study','review','questions','simulation'].includes(session.type)) session.type='study';
    session.questionsResolved=Math.max(0,Number(session.questionsResolved)||0);
    session.correctAnswers=Math.max(0,Math.min(Number(session.correctAnswers)||0,session.questionsResolved));
    if(typeof session.notes!=='string') session.notes='';
  });
  state.reviewAgenda.forEach(review=>{
    review.topicId=review.topicId||review.topicRef||null;
    if(!('completedAt' in review)) review.completedAt=null;
    review.manualDate=Boolean(review.manualDate);
    review.adaptive=review.adaptive!==false;
    review.adaptiveReason=review.adaptiveReason||null;
    review.suggestedDate=review.suggestedDate||null;
    review.lastRating=REVIEW_RATINGS[review.lastRating]?review.lastRating:null;
    review.adaptiveState=review.adaptiveState?createAdaptiveReviewState(review.adaptiveState):null;
  });
  refreshAllTopicReviewStats();
}

const persistentStorageManager=createStorageManager({dbName:DB_NAME,dbVersion:DB_VERSION,storeName:STORE_NAME});
const realStorageProvider=createRealStorageProvider({manager:persistentStorageManager,readLocal:repositoryReadLocalState,writeLocal:repositoryWriteLocalState,removeLocal:key=>{try{localStorage.removeItem(key)}catch(error){}}});
const demoStorageProvider=IS_DEMO_MODE?createDemoStorageProvider({storage:sessionStorage,stateKey:STORAGE_KEY,demoKey:DEMO_STORAGE_KEY,generate:()=>generateDemoData({today:appClock.today()})}):null;
const appContext=createAppContext({storage:demoStorageProvider||realStorageProvider,clock:appClock,idGenerator:uid,repositories:createAppRepositories(()=>state)});
const StorageManager=appContext.storage;
const INSTANCE_ID=uid('instance');
const STATE_CHANNEL=!IS_DEMO_MODE&&typeof BroadcastChannel==='function'?new BroadcastChannel('extrato-estudos-state'):null;
let applyingRemoteState=false;
function readLocalState(key=STORAGE_KEY){return appContext.storage.readLocal(key)}
function writeLocalState(value,key=STORAGE_KEY){return appContext.storage.writeLocal(key,value)}

function normalizeAndValidateState(raw){
  const parsed=typeof raw==='string'?JSON.parse(raw):structuredCloneSafe(raw);
  const validation=validateBackupData(parsed);
  if(!validation.valid) throw new Error(validation.message);
  return validation.normalized;
}

async function readLatestValidSnapshot(){
  const rawIndex=await StorageManager.get(BACKUP_INDEX_KEY);
  if(!rawIndex) return null;
  const index=JSON.parse(rawIndex);
  const snapshots=Array.isArray(index.snapshots)?index.snapshots.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))):[];
  for(const snapshot of snapshots){
    try{
      const raw=await StorageManager.get(snapshot.key);
      if(!raw) continue;
      if(snapshot.checksum&&await sha256(raw)!==snapshot.checksum) continue;
      return {raw,state:normalizeAndValidateState(raw)};
    }catch(error){ console.warn('Snapshot de recuperacao ignorado',error); }
  }
  return null;
}

async function loadState(){
  let loadWarning = '';
  try{
    const raw = await StorageManager.get(STORAGE_KEY);
    if(raw){
      try{ state=normalizeAndValidateState(raw); }
      catch(error){
        const recovered=await readLatestValidSnapshot();
        if(recovered){
          state=recovered.state;
          await StorageManager.set(STORAGE_KEY,JSON.stringify(state));
          loadWarning='Os dados principais estavam inválidos e foram recuperados do backup automático mais recente.';
        }else throw error;
      }
    }
  }catch(e){
    console.error('Erro ao carregar estado salvo',e);
    loadWarning = 'Não foi possível carregar os dados salvos. O aplicativo iniciou com os dados padrão; importe um backup se necessário.';
  }
  ensureStateDefaults();
  restoreTimerFromState();
  render();
  let modeMessage='';try{modeMessage=sessionStorage.getItem(MODE_FLASH_KEY)||'';sessionStorage.removeItem(MODE_FLASH_KEY)}catch(error){}
  if(loadWarning) showToast(loadWarning);else if(modeMessage)showToast(modeMessage);
}

let saveTimeout;
let saveQueue=Promise.resolve();
let pendingSave=null;
async function sha256(value){
  if(!window.crypto?.subtle) return null;
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}
async function rotateAutomaticBackup(previousRaw,options={}){
  if(!previousRaw) return true;
  const backupKey=options.backupKey||BACKUP_KEY;
  const indexKey=options.indexKey||BACKUP_INDEX_KEY;
  const slotCount=Math.max(1,Number(options.slotCount)||AUTOMATIC_BACKUP_SLOTS);
  let previous;
  try{ previous=JSON.parse(previousRaw); }catch(e){ return false; }
  if(!previous||!Array.isArray(previous.subjects)) return false;
  let index={nextSlot:0,snapshots:[]};
  try{
    const rawIndex=await StorageManager.get(indexKey);
    if(rawIndex){
      const parsed=JSON.parse(rawIndex);
      if(isPlainObject(parsed)&&Array.isArray(parsed.snapshots)) index=parsed;
    }
  }catch(e){ console.warn('Índice de backups inválido; iniciando um novo.',e); }
  const slot=Math.max(0,Number(index.nextSlot)||0)%slotCount;
  const key=`${backupKey}-${slot}`;
  const checksum=await sha256(previousRaw);
  const saved=await StorageManager.set(key,previousRaw);
  if(!saved) return false;
  const verification=await StorageManager.get(key);
  if(verification!==previousRaw||(checksum&&await sha256(verification)!==checksum)) return false;
  const snapshot={slot,key,createdAt:nowISO(),stateUpdatedAt:previous.updatedAt||null,checksum,bytes:new Blob([previousRaw]).size};
  index.snapshots=index.snapshots.filter(item=>item&&item.slot!==slot).concat(snapshot).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  index.nextSlot=(slot+1)%slotCount;
  index.version=1;
  index.updatedAt=nowISO();
  return StorageManager.set(indexKey,JSON.stringify(index));
}
function enqueueSave(serialized,previousRaw){
  pendingSave={serialized,previousRaw};
  saveQueue=saveQueue.then(async()=>{
    while(pendingSave){
      const job=pendingSave;
      pendingSave=null;
      await saveState(job.serialized,job.previousRaw);
    }
  }).catch(error=>{
    console.error('Falha na fila de gravação',error);
    showToast('Não foi possível concluir a gravação. Exporte um backup para proteger seus dados.');
  });
  return saveQueue;
}
function scheduleSave(){
  const previousRaw=readLocalState(STORAGE_KEY);
  state.updatedAt = nowISO();
  const serialized=JSON.stringify(state);
  writeLocalState(serialized);
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(()=>enqueueSave(serialized,previousRaw),350);
}
async function saveState(serialized=JSON.stringify(state),previousRaw=null){
  try{
    let backupWarning = false;
    const lastBackup = state.lastBackupAt ? Date.parse(state.lastBackupAt) : 0;
    if(!IS_DEMO_MODE&&previousRaw&&Date.now() - lastBackup >= 24*60*60*1000){
      const backupSuccess=await rotateAutomaticBackup(previousRaw);
      if(backupSuccess){
        state.lastBackupAt=nowISO();
        const parsed=JSON.parse(serialized);
        parsed.lastBackupAt=state.lastBackupAt;
        parsed.updatedAt=state.updatedAt;
        serialized=JSON.stringify(parsed);
        writeLocalState(serialized);
      }else backupWarning=true;
    }
    const success = await StorageManager.set(STORAGE_KEY,serialized);
    if(success){
      if(!applyingRemoteState) STATE_CHANNEL?.postMessage({source:INSTANCE_ID,serialized,updatedAt:JSON.parse(serialized).updatedAt||null});
      flashSaved();
      if(backupWarning) showToast('Os dados atuais foram salvos, mas o backup automático não pôde ser atualizado. Exporte um backup manual.');
    }
    else showToast('Não foi possível salvar. Exporte um backup para proteger seus dados.');
  }catch(e){
    console.error('Erro ao salvar estado',e);
    showToast('Não foi possível salvar. Exporte um backup para proteger seus dados.');
  }
}

STATE_CHANNEL?.addEventListener('message',event=>{
  const message=event.data;
  if(!message||message.source===INSTANCE_ID||typeof message.serialized!=='string') return;
  const remoteTime=Date.parse(message.updatedAt||0)||0;
  const localTime=Date.parse(state.updatedAt||0)||0;
  if(remoteTime<=localTime) return;
  try{
    applyingRemoteState=true;
    state=normalizeAndValidateState(message.serialized);
    writeLocalState(message.serialized);
    render();
    showToast('Dados atualizados por outra aba.');
  }catch(error){ console.warn('Atualizacao de outra aba ignorada',error); }
  finally{ applyingRemoteState=false; }
});
function flashSaved(){
  const el = document.getElementById('saveIndicator');
  el.classList.add('show');
  clearTimeout(flashSaved._t);
  flashSaved._t = setTimeout(()=>el.classList.remove('show'), 1200);
}

/* ===== TOAST (substitui alert()) ===== */
function showToast(message){
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>el.classList.remove('show'), 2600);
}

/* ===== MODAL DE CONFIRMAÇÃO (substitui confirm()) ===== */
let activeConfirmCleanup=null;
function showConfirm(message, onConfirm, onCancel, options={}){
  const overlay = document.getElementById('modalOverlay');
  if(activeConfirmCleanup) activeConfirmCleanup(false);
  const previouslyFocused=document.activeElement;
  document.getElementById('modalMessage').textContent = message;
  const promptGroup=document.getElementById('modalPromptGroup');
  const promptInput=document.getElementById('modalPromptInput');
  const promptLabel=document.getElementById('modalPromptLabel');
  const promptError=document.getElementById('modalPromptError');
  const hasPrompt=Boolean(options.prompt);
  promptGroup.hidden=!hasPrompt;
  promptError.textContent='';
  if(hasPrompt){
    promptLabel.textContent=options.prompt.label||'Nome';
    promptInput.value=options.prompt.value||'';
    promptInput.placeholder=options.prompt.placeholder||'';
  }
  overlay.classList.add('show');

  const confirmBtn = document.getElementById('modalConfirmBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  const originalConfirmLabel=confirmBtn.textContent;
  let focusFrame=0;
  if(options.confirmLabel) confirmBtn.textContent=options.confirmLabel;
  function cleanup(restoreFocus=true){
    if(focusFrame) cancelAnimationFrame(focusFrame);
    overlay.classList.remove('show');
    confirmBtn.removeEventListener('click', onConfirmClick);
    cancelBtn.removeEventListener('click', onCancelClick);
    overlay.removeEventListener('click', onOverlayClick);
    promptInput.removeEventListener('keydown',onPromptKeydown);
    confirmBtn.textContent=originalConfirmLabel;
    activeConfirmCleanup=null;
    if(restoreFocus&&previouslyFocused?.isConnected) previouslyFocused.focus();
  }
  function onConfirmClick(){
    const value=hasPrompt?promptInput.value.trim():undefined;
    const validationMessage=hasPrompt&&typeof options.prompt.validate==='function'?options.prompt.validate(value):'';
    if(validationMessage){promptError.textContent=validationMessage;promptInput.focus();return;}
    cleanup(); onConfirm(value);
  }
  function cancel(){ cleanup(); if(typeof onCancel==='function') onCancel(); }
  function onCancelClick(){ cancel(); }
  function onOverlayClick(e){ if(e.target === overlay) cancel(); }
  function onPromptKeydown(e){if(e.key==='Enter'){e.preventDefault();onConfirmClick();}}

  confirmBtn.addEventListener('click', onConfirmClick);
  cancelBtn.addEventListener('click', onCancelClick);
  overlay.addEventListener('click', onOverlayClick);
  if(hasPrompt) promptInput.addEventListener('keydown',onPromptKeydown);
  activeConfirmCleanup=cleanup;
  focusFrame=requestAnimationFrame(()=>{focusFrame=0;(hasPrompt?promptInput:cancelBtn).focus();});
}

function showPrompt(message, options, onConfirm, onCancel){
  showConfirm(message,onConfirm,onCancel,{confirmLabel:options.confirmLabel||'Criar',prompt:options});
}

/* ===== TABS ===== */
function activateTab(tabName, updateHash = true){
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const panel = document.getElementById('panel-'+tabName);
  if(!btn || !panel) return;

  document.querySelectorAll('.tab-btn').forEach(b=>{
    const active = b === btn;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
    b.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p === panel));
  document.querySelector('.statement')?.classList.toggle('statement--compact',tabName!=='dashboard');
  document.querySelector('.global-search-row')?.classList.toggle('global-search-row--compact',tabName!=='dashboard');
  syncMobileMoreState(tabName);
  btn.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'smooth'});
  if(typeof render==='function') render(tabName);
  if(updateHash) history.replaceState(null, '', '#'+tabName);
}

const moreTabButton=document.getElementById('moreTabButton'),mobileMoreMenu=document.getElementById('mobileMoreMenu');
function closeMobileMore({restoreFocus=false}={}){
  if(!mobileMoreMenu)return;mobileMoreMenu.hidden=true;moreTabButton?.setAttribute('aria-expanded','false');
  if(restoreFocus)moreTabButton?.focus();
}
function toggleMobileMore(){
  if(!mobileMoreMenu)return;const open=mobileMoreMenu.hidden;mobileMoreMenu.hidden=!open;moreTabButton?.setAttribute('aria-expanded',String(open));
  if(open)mobileMoreMenu.querySelector('[role="menuitem"]')?.focus();
}
function syncMobileMoreState(tabName){
  const secondary=['agenda','questoes','metas'].includes(tabName);
  moreTabButton?.classList.toggle('active',secondary);
  mobileMoreMenu?.querySelectorAll('[data-more-tab]').forEach(item=>item.classList.toggle('active',item.dataset.moreTab===tabName));
}
moreTabButton?.addEventListener('click',toggleMobileMore);
mobileMoreMenu?.addEventListener('click',event=>{const item=event.target.closest('[data-more-tab]');if(!item)return;activateTab(item.dataset.moreTab);closeMobileMore();});
mobileMoreMenu?.addEventListener('keydown',event=>{
  const items=[...mobileMoreMenu.querySelectorAll('[role="menuitem"]')],index=items.indexOf(document.activeElement);
  if(event.key==='Escape'){event.preventDefault();closeMobileMore({restoreFocus:true});return}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();
});
document.addEventListener('click',event=>{if(!mobileMoreMenu?.hidden&&!mobileMoreMenu.contains(event.target)&&event.target!==moreTabButton)closeMobileMore();});

document.querySelectorAll('.tab-btn[data-tab]').forEach(btn=>{
  btn.addEventListener('click', ()=>activateTab(btn.dataset.tab));
  btn.addEventListener('keydown', e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...document.querySelectorAll('.tab-btn[data-tab]')].filter(tab=>getComputedStyle(tab).display!=='none');
    const current = tabs.indexOf(btn);
    const next = e.key==='Home' ? 0 : e.key==='End' ? tabs.length-1 :
      (current + (e.key==='ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    activateTab(tabs[next].dataset.tab);
  });
});

/* ===== HELPERS ===== */
function allTopics(){
  return state.subjects.flatMap(s => s.topics.map(t => ({...t, subjectName:s.name, subjectId:s.id, subjectArchived:Boolean(s.archived), topicArchived:Boolean(t.archived)})));
}
function activeSubjects(){ return state.subjects.filter(subject=>!subject.archived); }
function archivedSubjects(){ return state.subjects.filter(subject=>subject.archived); }
function topicsForSelection(subjectOrId,selectedTopicId){
  const subject=subjectOrId&&typeof subjectOrId==='object'?subjectOrId:getSubjectById(subjectOrId);
  if(!subject||!Array.isArray(subject.topics)) return [];
  return subject.topics.filter(topic=>!topic.archived||topic.id===selectedTopicId);
}
function isActiveSubjectId(subjectId){
  const subject=getSubjectById(subjectId);
  return Boolean(subject&&!subject.archived);
}
function isActiveTopicId(topicId){
  const found=getTopicById(topicId);
  return Boolean(found&&!found.subject.archived&&!found.topic.archived);
}
function isActiveStudyReference(subjectId,topicId=null){
  if(!isActiveSubjectId(subjectId)) return false;
  return !topicId||isActiveTopicId(topicId);
}
function subjectsForSelection(selectedId=null){
  return state.subjects.filter(subject=>!subject.archived||subject.id===selectedId);
}
function activeTopics(){ return allTopics().filter(topic=>!topic.subjectArchived&&!topic.topicArchived); }
function subjectProgress(subject){
  return calculateTopicCoverage(subject.topics).value;
}
function localDateISO(value){
  if(arguments.length===0) value=new Date();
  if(value===null||value===undefined||value==='') return '';
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function localDateFromTimestamp(value){ return localDateISO(value); }
function timestampToLocalDateISO(value){ return localDateISO(value); }
function parseLocalDate(iso){
  if(!iso||typeof iso!=='string') return null;
  const [year,month,day]=iso.split('-').map(Number);
  if(!year||!month||!day) return null;
  const date=new Date(year,month-1,day,12,0,0,0);
  return Number.isNaN(date.getTime())?null:date;
}
function todayISO(){ return appContext.clock.today(); }
function formatDatePt(iso){
  if(!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function monthKey(iso){
  if(!iso) return null;
  return iso.slice(0,7); // "AAAA-MM"
}
function monthLabel(key){
  if(!key) return '';
  const [y,m] = key.split('-');
  return `${MESES_PT[parseInt(m,10)-1]} de ${y}`;
}
function collectMonthKeys(...arrays){
  const set = new Set();
  arrays.forEach(arr => arr.forEach(item => { const k = monthKey(item.date); if(k) set.add(k); }));
  return [...set].sort();
}
function startOfWeek(d){
  const date = parseLocalDate(d);
  if(!date) return '';
  const day = date.getDay(); // 0 = domingo
  const diff = (day === 0 ? -6 : 1) - day; // volta pra segunda-feira
  date.setDate(date.getDate() + diff);
  return localDateISO(date);
}
function isSameWeek(iso){
  if(!iso) return false;
  return startOfWeek(iso) === startOfWeek(todayISO());
}
function isSameMonth(iso){
  if(!iso) return false;
  return monthKey(iso) === monthKey(todayISO());
}

/* ===== "=A2-HOJE()" — Dias para Revisão ===== */
function diasParaRevisao(iso){
  const alvo = parseLocalDate(iso);
  const hoje = parseLocalDate(todayISO());
  if(!alvo||!hoje) return null;
  return Math.round((alvo - hoje) / 86400000);
}
function diasParaRevisaoPill(iso, status){
  const dias = diasParaRevisao(iso);
  if(dias === null) return `<span class="dias-pill dias-futura">—</span>`;
  if(status === 'Concluído'){
    return `<span class="dias-pill dias-proxima">✓ feita</span>`;
  }
  if(dias < 0) return `<span class="dias-pill dias-atrasada">${dias}d · atrasada</span>`;
  if(dias === 0) return `<span class="dias-pill dias-hoje">hoje</span>`;
  if(dias <= 7) return `<span class="dias-pill dias-proxima">em ${dias}d</span>`;
  return `<span class="dias-pill dias-futura">em ${dias}d</span>`;
}

document.getElementById('examDateInput').addEventListener('change', function(){
  state.examDate = this.value;
  state.examBlueprint.examDate=this.value||null;
  state.examBlueprint.configuredAt=nowISO();
  persistAndRender();
});

/* ===== SEQUÊNCIA DE DIAS ESTUDANDO (STREAK) ===== */
function getDailyStudySummary(date,options={}){
  const subjectId=options.subjectId||'';
  const matchesSubject=item=>!subjectId||entitySubjectId(item)===subjectId;
  const sessions=state.studySessions.filter(s=>s.date===date&&matchesSubject(s));
  const allSessionIds=new Set(state.studySessions.map(s=>s.id));
  const independentQuestions=state.questoes.filter(q=>q.date===date&&matchesSubject(q)&&(!q.studySessionId||!allSessionIds.has(q.studySessionId)));
  const simulations=state.simulados.filter(sim=>sim.date===date&&(!subjectId||(sim.breakdown||[]).some(row=>entitySubjectId(row)===subjectId)));
  const reviews=state.reviewAgenda.filter(review=>review.status==='Concluído'&&localDateFromTimestamp(review.completedAt)===date&&matchesSubject(review));
  const metrics=summarizeStudyRecords({sessions,questions:independentQuestions,simulations});
  const {seconds,questions,correct,accuracy}=metrics;
  const subjectNames=new Set();
  sessions.forEach(s=>{ const id=entitySubjectId(s); if(id) subjectNames.add(getSubjectName(id)); });
  independentQuestions.forEach(q=>{ const id=entitySubjectId(q); if(id) subjectNames.add(getSubjectName(id)); });
  const targetSeconds=metaHoursForDate(date)*3600;
  const goalPct=targetSeconds>0?Math.round((seconds/targetSeconds)*100):0;
  return {
    date,sessions,seconds,questions,correct,reviews:reviews.length,simulations:metrics.simulations,targetSeconds,goalPct,accuracy,
    subjectNames:[...subjectNames],
    meaningful:seconds>=300||independentQuestions.some(q=>(Number(q.resolved)||0)>0)||metrics.simulations>0,
    goalAchieved:targetSeconds>0&&seconds>=targetSeconds
  };
}
function getActivityDates(){
  const set = new Set();
  const sessionIds=new Set(state.studySessions.map(s=>s.id));
  const dates=new Set([
    ...state.studySessions.map(s=>s.date),
    ...state.questoes.filter(q=>!q.studySessionId||!sessionIds.has(q.studySessionId)).map(q=>q.date),
    ...state.simulados.map(s=>s.date)
  ].filter(Boolean));
  dates.forEach(date=>{ if(getDailyStudySummary(date).meaningful) set.add(date); });
  return set;
}
function getGoalDates(){
  const set=new Set();
  new Set(state.studySessions.map(s=>s.date).filter(Boolean)).forEach(date=>{
    if(getDailyStudySummary(date).goalAchieved) set.add(date);
  });
  return set;
}
function computeStreak(activityDates){
  return calculateActivityStreak(activityDates,{today:todayISO(),addDays});
}

function toggleStreakExpanded(){
  streakView.expanded=!streakView.expanded;
  renderHeatmap();
}
function toggleStreakActiveDays(){
  streakView.onlyActiveDays=!streakView.onlyActiveDays;
  renderHeatmap();
}
function focusStudyTimer(){
  activateTab('dashboard');
  document.getElementById('timerStartBtn')?.focus();
}

/* ===== GRÁFICO DE EVOLUÇÃO DO PROGRESSO ===== */
function recordProgressSnapshot(pct){
  const today = todayISO();
  const existing = state.progressHistory.find(p => p.date === today);
  if(existing){ existing.pct = pct; }
  else { state.progressHistory.push({ date: today, pct }); }
  state.progressHistory.sort((a,b)=> a.date.localeCompare(b.date));
  if(state.progressHistory.length > 90){
    state.progressHistory = state.progressHistory.slice(-90);
  }
}
function renderProgressChart(){
  const container = document.getElementById('progressChart');
  const data = state.progressHistory;
  if(data.length < 2){
    container.innerHTML = `<div class="progress-chart-empty">Continue estudando — o gráfico aparece a partir do segundo dia com dados.</div>`;
    return;
  }
  const W = 640, H = 160, padL = 30, padR = 12, padT = 12, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = data.length;
  const xFor = i => padL + (n===1 ? 0 : (i/(n-1))*plotW);
  const yFor = pct => padT + plotH - (pct/100)*plotH;

  const points = data.map((d,i)=>`${xFor(i)},${yFor(d.pct)}`).join(' ');
  const areaPoints = `${padL},${padT+plotH} ${points} ${xFor(n-1)},${padT+plotH}`;

  const gridLines = [0,25,50,75,100].map(v => `
    <line class="chart-grid" x1="${padL}" y1="${yFor(v)}" x2="${W-padR}" y2="${yFor(v)}"></line>
    <text x="2" y="${yFor(v)+3}">${v}%</text>
  `).join('');

  const stepLabels = n <= 6 ? n : 6;
  const labelIdxs = Array.from({length: stepLabels}, (_,k)=> Math.round(k*(n-1)/(stepLabels-1||1)));
  const uniqueLabelIdxs = [...new Set(labelIdxs)];
  const dateLabels = uniqueLabelIdxs.map(i => `<text x="${xFor(i)}" y="${H-4}" text-anchor="middle">${formatDatePt(data[i].date).slice(0,5)}</text>`).join('');

  const dots = data.map((d,i)=>`<circle class="chart-dot" cx="${xFor(i)}" cy="${yFor(d.pct)}" r="3"><title>${formatDatePt(d.date)}: ${d.pct}%</title></circle>`).join('');

  container.innerHTML = `
    <svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
      ${gridLines}
      <polygon class="chart-area" points="${areaPoints}"></polygon>
      <polyline class="chart-line" points="${points}"></polyline>
      ${dots}
      ${dateLabels}
    </svg>
  `;
}

/* ===== BACKUP: EXPORTAR / IMPORTAR ===== */
function exportBackup(){
  if(IS_DEMO_MODE){showToast('Backups ficam indisponíveis durante a demonstração.');return}
  const blob = new Blob([serializeBackup(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(todayISO());
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup exportado.');
}
function downloadJsonBackup(raw,name){
  const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
}
async function exportLatestAutomaticBackup(){
  if(IS_DEMO_MODE){showToast('A recuperação real fica indisponível durante a demonstração.');return}
  try{
    const rawIndex=await StorageManager.get(BACKUP_INDEX_KEY);
    if(!rawIndex){showToast('Ainda não existe um snapshot automático de recuperação.');return}
    const index=JSON.parse(rawIndex),snapshot=Array.isArray(index.snapshots)?index.snapshots.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0]:null;
    if(!snapshot?.key){showToast('O índice de recuperação está vazio.');return}
    const raw=await StorageManager.get(snapshot.key);
    const checksum=raw?await sha256(raw):null;
    if(!raw||(snapshot.checksum&&checksum!==snapshot.checksum)){showToast('O snapshot automático falhou na verificação de integridade.');return}
    const validation=validateBackupData(JSON.parse(raw));
    if(!validation.valid){showToast('O snapshot automático não contém um estado restaurável.');return}
    downloadJsonBackup(raw,`recuperacao-extrato-estudos-${String(snapshot.createdAt||todayISO()).slice(0,10)}.json`);
    showToast('Snapshot verificado e exportado. Use “Importar backup” para restaurá-lo.');
  }catch(error){console.error('Falha ao exportar snapshot automático',error);showToast('Não foi possível exportar o snapshot automático.')}
}
function validateBackupData(data){
  const arrayFields = ['calendar','reviewAgenda','questoes','simulados','progressHistory','studySessions','dailyPlans','studyPlans','planAdjustments','recommendationFeedback','alertStates','topicHistory','metasPorDisciplina'];
  const envelope=validateBackupEnvelope(data,{currentVersion:CURRENT_SCHEMA_VERSION,arrayFields});if(!envelope.valid)return envelope;const {version}=envelope;
  try{
    const normalized=migrateState(structuredCloneSafe(data));
    ensureBackupStateDefaults(normalized);
    const deepValidation=validateNormalizedBackup(normalized);
    if(!deepValidation.valid) return deepValidation;
    return {valid:true,version,normalized};
  }catch(error){
    console.error('Falha ao normalizar backup para validação',error);
    return {valid:false,message:'O backup contém dados que não puderam ser normalizados com segurança.'};
  }
}
function ensureBackupStateDefaults(candidate){
  const previous=state;
  try{ state=candidate; ensureStateDefaults(); }
  finally{ state=previous; }
}
function validateNormalizedBackup(data){
  const fail=message=>({valid:false,message});
  const collections=['subjects','calendar','reviewAgenda','questoes','simulados','progressHistory','studySessions','dailyPlans','studyPlans','planAdjustments','recommendationFeedback','alertStates','topicHistory','metasPorDisciplina'];
  for(const field of collections){
    if(!Array.isArray(data[field])) return fail(`O campo "${field}" deve ser uma lista.`);
    if(data[field].length>50000) return fail(`O campo "${field}" excede o limite seguro de 50.000 registros.`);
  }
  const ids=new Set(),subjectIds=new Set(),topicIds=new Set(),sessionIds=new Set(),planItemIds=new Set();
  const registerId=(id,label)=>{
    if(!isSafeId(id)) return `${label} possui um identificador inválido.`;
    if(ids.has(id)) return `O identificador "${id}" aparece mais de uma vez no backup.`;
    ids.add(id); return '';
  };
  const textOk=(value,max=5000)=>typeof value==='string'&&value.length<=max;
  for(const subject of data.subjects){
    if(!isPlainObject(subject)) return fail('Uma disciplina não é um objeto válido.');
    const idError=registerId(subject.id,'Uma disciplina'); if(idError) return fail(idError);
    subjectIds.add(subject.id);
    if(!textOk(subject.name,300)||!Array.isArray(subject.topics)||subject.topics.length>10000) return fail('Uma disciplina possui nome ou lista de tópicos inválida.');
    for(const topic of subject.topics){
      if(!isPlainObject(topic)) return fail('Um tópico não é um objeto válido.');
      const topicIdError=registerId(topic.id,'Um tópico'); if(topicIdError) return fail(topicIdError);
      topicIds.add(topic.id);
      if(!textOk(topic.name,500)||!textOk(topic.link||'',2000)||!textOk(topic.notes||'',20000)) return fail('Um tópico excede os limites de texto permitidos.');
      if(!STATUS_OPTIONS.includes(topic.status)||!DIFFICULTY_OPTIONS.includes(topic.difficulty)) return fail('Um tópico possui status ou dificuldade inválida.');
      if(!Array.isArray(topic.tags)||topic.tags.length>100||topic.tags.some(tag=>!textOk(tag,100))) return fail('Um tópico possui tags inválidas.');
      if(topic.examImportance!==null&&(!Number.isFinite(Number(topic.examImportance))||Number(topic.examImportance)<0||Number(topic.examImportance)>1)) return fail('Um tópico possui importância de prova inválida.');
      if(topic.estimatedStudyMinutes!==null&&(!isFiniteNonNegative(topic.estimatedStudyMinutes)||Number(topic.estimatedStudyMinutes)<=0)) return fail('Um tópico possui esforço estimado inválido.');
      if(!Array.isArray(topic.prerequisites)||topic.prerequisites.length>100||topic.prerequisites.some(id=>!isSafeId(id))) return fail('Um tópico possui pré-requisitos inválidos.');
    }
  }
  const validateEntity=(item,label)=>{
    if(!isPlainObject(item)) return `${label} não é um objeto válido.`;
    return registerId(item.id,label);
  };
  for(const item of data.calendar){
    const error=validateEntity(item,'Um item do calendário'); if(error) return fail(error);
    if(!isISODate(item.date)||!STATUS_OPTIONS.includes(item.status)||!REVIEW_OPTIONS.includes(item.reviewType)) return fail('Um item do calendário possui data, status ou tipo inválido.');
  }
  for(const item of data.reviewAgenda){
    const error=validateEntity(item,'Uma revisão'); if(error) return fail(error);
    if(!isISODate(item.date)||!STATUS_OPTIONS.includes(item.status)||!TIPO_AGENDA_OPTIONS.includes(item.tipo)||!isOptionalTimestamp(item.completedAt)) return fail('Uma revisão possui data, status ou tipo inválido.');
  }
  for(const item of data.questoes){
    const error=validateEntity(item,'Um registro de questões'); if(error) return fail(error);
    if(!isISODate(item.date)||!isFiniteNonNegative(item.resolved)||!isFiniteNonNegative(item.correct)||Number(item.correct)>Number(item.resolved)) return fail('Um registro de questões possui data ou totais inválidos.');
  }
  for(const item of data.simulados){
    const error=validateEntity(item,'Um simulado'); if(error) return fail(error);
    if(!isISODate(item.date)||!textOk(item.nome||'',500)||!isFiniteNonNegative(item.total)||!isFiniteNonNegative(item.correct)||Number(item.correct)>Number(item.total)||!Array.isArray(item.breakdown)) return fail('Um simulado possui dados inválidos.');
    for(const row of item.breakdown){
      const rowError=validateEntity(row,'Uma linha de simulado'); if(rowError) return fail(rowError);
      if(!isFiniteNonNegative(row.total)||!isFiniteNonNegative(row.correct)||Number(row.correct)>Number(row.total)) return fail('Uma linha de simulado possui totais inválidos.');
    }
  }
  for(const item of data.studySessions){
    const error=validateEntity(item,'Uma sessão'); if(error) return fail(error);
    sessionIds.add(item.id);
    if(!isISODate(item.date)||!isFiniteNonNegative(item.durationSeconds)||!isFiniteNonNegative(item.questionsResolved)||!isFiniteNonNegative(item.correctAnswers)||Number(item.correctAnswers)>Number(item.questionsResolved)||!['study','review','questions','simulation'].includes(item.type)||!textOk(item.notes||'',20000)) return fail('Uma sessão de estudo possui dados inválidos.');
  }
  for(const plan of data.dailyPlans){
    const error=validateEntity(plan,'Um plano diário'); if(error) return fail(error);
    if(!isISODate(plan.date)||!isFiniteNonNegative(plan.availableMinutes)||!Array.isArray(plan.items)) return fail('Um plano diário possui dados inválidos.');
    for(const item of plan.items){
      const itemError=validateEntity(item,'Um item de plano'); if(itemError) return fail(itemError);
      planItemIds.add(item.id);
      if(!isFiniteNonNegative(item.plannedMinutes)||!isFiniteNonNegative(item.executedSeconds)||!['study','review','questions','simulation'].includes(item.type)||!['planned','in_progress','partial','completed','deferred','replaced','skipped'].includes(item.status)) return fail('Um item de plano possui dados inválidos.');
    }
  }
  for(const plan of data.studyPlans){
    const error=validateEntity(plan,'Um plano até a prova');if(error)return fail(error);
    if(!isOptionalTimestamp(plan.confirmedAt)||!isFiniteNonNegative(plan.weeklyAvailableMinutes)||!isFiniteNonNegative(plan.weeklyPlannedMinutes)||!Array.isArray(plan.subjects)||!Array.isArray(plan.items))return fail('Um plano até a prova possui dados inválidos.');
  }
  for(const item of data.planAdjustments){const error=validateEntity(item,'Um ajuste de plano');if(error)return fail(error);if(!isISODate(item.periodStart)||!isISODate(item.periodEnd)||!isOptionalTimestamp(item.confirmedAt)||!isFiniteNonNegative(item.deficitMinutes)||!isFiniteNonNegative(item.redistributedMinutes)||!Array.isArray(item.allocations))return fail('Um ajuste de plano possui dados inválidos.');}
  for(const item of data.recommendationFeedback){const error=validateEntity(item,'Um feedback de recomendação');if(error)return fail(error);if(!isISODate(item.date)||typeof item.accepted!=='boolean'||typeof item.completed!=='boolean'||!isOptionalTimestamp(item.createdAt)||!isOptionalTimestamp(item.completedAt))return fail('Um feedback de recomendação possui dados inválidos.');}
  for(const item of data.alertStates){if(!isPlainObject(item)||!isSafeId(item.alertId)||!(item.dismissedUntil===null||isISODate(item.dismissedUntil))||!(item.resolvedAt===null||isISODate(item.resolvedAt)))return fail('Um estado de alerta possui dados inválidos.');}
  for(const item of data.topicHistory){ const error=validateEntity(item,'Um evento histórico'); if(error) return fail(error); }
  for(const item of data.metasPorDisciplina){
    const error=validateEntity(item,'Uma meta por disciplina'); if(error) return fail(error);
    if(!isFiniteNonNegative(item.meta)) return fail('Uma meta por disciplina possui valor inválido.');
  }
  const validRef=(value,set)=>value==null||(isSafeId(value)&&set.has(value));
  if(data.subjects.some(subject=>subject.topics.some(topic=>topic.prerequisites.some(id=>!topicIds.has(id)||id===topic.id)))) return fail('O backup contém pré-requisito de tópico inexistente ou circular direto.');
  const referenceCollections=[...data.calendar,...data.reviewAgenda,...data.questoes,...data.studySessions,...data.metasPorDisciplina];
  if(referenceCollections.some(item=>!validRef(item.subjectId,subjectIds)||!validRef(item.topicId,topicIds))) return fail('O backup contém referência para disciplina ou tópico inexistente.');
  if(data.simulados.some(sim=>sim.breakdown.some(item=>!validRef(item.subjectId,subjectIds)))) return fail('O backup contém detalhamento de simulado para uma disciplina inexistente.');
  if(data.dailyPlans.some(plan=>plan.items.some(item=>!validRef(item.subjectId,subjectIds)||!validRef(item.topicId,topicIds)))) return fail('O backup contém item de plano com referência inexistente.');
  if(data.topicHistory.some(item=>(item.subjectId!=null&&!isSafeId(item.subjectId))||(item.topicId!=null&&!isSafeId(item.topicId)))) return fail('O backup contém histórico com identificador inseguro.');
  if(data.questoes.some(item=>item.studySessionId!=null&&!validRef(item.studySessionId,sessionIds))) return fail('O backup contém questões vinculadas a uma sessão inexistente.');
  if(data.studySessions.some(item=>item.planItemId!=null&&!validRef(item.planItemId,planItemIds))) return fail('O backup contém sessão vinculada a um item de plano inexistente.');
  if(!isPlainObject(data.metas)||Object.entries(data.metas).some(([key,value])=>key!=='horasPorDia'&&!isFiniteNonNegative(value))||!isPlainObject(data.metas.horasPorDia)||Object.values(data.metas.horasPorDia).some(value=>!isFiniteNonNegative(value))) return fail('O backup contém metas globais inválidas.');
  if(!isPlainObject(data.activeTimer)||!isFiniteNonNegative(data.activeTimer.accumulatedSeconds)||!validRef(data.activeTimer.subjectId,subjectIds)||!validRef(data.activeTimer.topicId,topicIds)||!validRef(data.activeTimer.planItemId,planItemIds)) return fail('O backup contém um cronômetro ativo inválido.');
  if(!isPlainObject(data.examBlueprint)||!(data.examBlueprint.examDate===null||isISODate(data.examBlueprint.examDate))||!Number.isFinite(Number(data.examBlueprint.targetScore))||Number(data.examBlueprint.targetScore)<0||Number(data.examBlueprint.targetScore)>100||!isOptionalTimestamp(data.examBlueprint.configuredAt)||!Array.isArray(data.examBlueprint.subjects)||data.examBlueprint.subjects.length>1000) return fail('O backup contém configuração de prova inválida.');
  if(data.examBlueprint.subjects.some(item=>!isPlainObject(item)||!validRef(item.subjectId,subjectIds)||!isFiniteNonNegative(item.expectedQuestions)||!isFiniteNonNegative(item.questionWeight)||!EXAM_PRIORITIES.includes(item.priority))) return fail('O backup contém peso de disciplina inválido.');
  if(!isPlainObject(data.algorithmVersions)||Object.values(data.algorithmVersions).some(value=>!Number.isInteger(Number(value))||Number(value)<1)) return fail('O backup contém versões de algoritmos inválidas.');
  if(data.progressHistory.some(item=>!isPlainObject(item)||!isISODate(item.date)||!isFiniteNonNegative(item.pct)||Number(item.pct)>100)) return fail('O backup contém histórico de progresso inválido.');
  return {valid:true};
}
function backupSummary(data,version){
  const subjectCount=data.subjects.length;
  const topicCount=data.subjects.reduce((sum,subject)=>sum+(Array.isArray(subject.topics)?subject.topics.length:0),0);
  const sessionCount=Array.isArray(data.studySessions)?data.studySessions.length:0;
  const questionCount=Array.isArray(data.questoes)?data.questoes.length:0;
  const updated=Date.parse(data.updatedAt||'');
  const updatedLabel=Number.isFinite(updated)?new Date(updated).toLocaleString('pt-BR'):'data não informada';
  return `Backup v${version}: ${pluralize(subjectCount,'disciplina')}, ${pluralize(topicCount,'tópico')}, ${pluralize(sessionCount,'sessão','sessões')} e ${pluralize(questionCount,'registro')} de questões. Última atualização: ${updatedLabel}.`;
}
function importBackupFromFile(file){
  if(IS_DEMO_MODE){showToast('A importação fica indisponível durante a demonstração.');return}
  if(!file) return;
  if(file.size > MAX_BACKUP_FILE_SIZE){
    showToast('O arquivo excede o limite de 10 MB para importação.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    let parsed;
    try{
      const parsedResult=parseBackupText(String(e.target.result),{maxBytes:MAX_BACKUP_FILE_SIZE});if(!parsedResult.valid){showToast(parsedResult.message);return}parsed=parsedResult.data;
    }catch(err){showToast('Arquivo inválido — não parece um backup deste extrato.');return}
    const validation=validateBackupData(parsed);
    if(!validation.valid){
      showToast(validation.message);
      return;
    }
    const summary=backupSummary(parsed,validation.version);
    showConfirm(`${summary} Importar vai substituir todos os dados atuais. Continuar?`, () => {
      const previousState=state;
      try{
        const importedState=validation.normalized;
        state=importedState;
        ensureStateDefaults();
        restoreTimerFromState();
        persistAndRender();
        showToast('Backup importado com sucesso.');
      }catch(err){
        state=previousState;
        restoreTimerFromState();
        render();
        console.error('Erro ao importar backup',err);
        showToast('O backup passou pela validação inicial, mas não pôde ser convertido. Seus dados atuais foram preservados.');
      }
    });
  };
  reader.onerror = function(){
    showToast('Não foi possível ler o arquivo selecionado.');
  };
  reader.readAsText(file);
}
document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);
document.getElementById('exportAutomaticBackupBtn').addEventListener('click', exportLatestAutomaticBackup);
document.getElementById('importBackupBtn').addEventListener('click', () => {
  document.getElementById('importBackupFile').click();
});
document.getElementById('importBackupFile').addEventListener('change', function(){
  if(this.files && this.files[0]){
    importBackupFromFile(this.files[0]);
    this.value = '';
  }
});
function reloadWithModeChange(){
  suppressBeforeUnloadSave=true;
  if(saveTimeout)clearTimeout(saveTimeout);
  pendingSave=null;
  location.reload();
}
function configureDemoModeUi(){
  const banner=document.getElementById('demoBanner'),enterButton=document.getElementById('enterDemoBtn');
  banner.hidden=!IS_DEMO_MODE;enterButton.hidden=IS_DEMO_MODE;
  document.querySelectorAll('[data-demo-protected]').forEach(button=>{button.disabled=IS_DEMO_MODE;button.title=IS_DEMO_MODE?'Indisponível para proteger seus dados reais.':''});
}
document.getElementById('enterDemoBtn').addEventListener('click',()=>showConfirm('Explorar a demonstração com três meses de estudos, questões, simulados e planejamento? Seus dados atuais não serão alterados.',()=>{enterDemoMode(sessionStorage);reloadWithModeChange()}));
document.getElementById('resetDemoBtn').addEventListener('click',()=>showConfirm('Reiniciar todos os dados fictícios da demonstração?',()=>{resetDemoMode(sessionStorage,DEMO_STORAGE_KEY);reloadWithModeChange()}));
document.getElementById('exitDemoBtn').addEventListener('click',()=>{exitDemoMode(sessionStorage,DEMO_STORAGE_KEY);sessionStorage.setItem(MODE_FLASH_KEY,'Demonstração encerrada. Seus dados pessoais foram restaurados.');reloadWithModeChange()});
configureDemoModeUi();

/* ===== CRONÔMETRO DE SESSÃO DE ESTUDO ===== */
let timerSeconds = 0;
let timerRunning = false;
let timerIntervalId = null;
let timerStartedAt = null;

function formatTimer(totalSeconds){
  const total=Math.max(0,Math.floor(Number(totalSeconds)||0));
  const h=Math.floor(total/3600);
  const m=Math.floor((total%3600)/60).toString().padStart(2,'0');
  const s=(total%60).toString().padStart(2,'0');
  return h>0?`${String(h).padStart(2,'0')}:${m}:${s}`:`${m}:${s}`;
}
function findDailyPlanItem(itemId){
  if(!itemId) return null;
  for(const plan of state.dailyPlans){
    const item=plan.items.find(candidate=>candidate.id===itemId);
    if(item) return {plan,item};
  }
  return null;
}
function releaseActivePlanItem(){
  const found=findDailyPlanItem(state.activeTimer?.planItemId);
  if(found&&found.item.status==='in_progress'){
    found.item.status=found.item.executedSeconds>0?'partial':'planned';
    found.plan.updatedAt=nowISO();
  }
}
function recordPlannedExecution(planItemId,session){
  const found=findDailyPlanItem(planItemId);
  if(!found) return;
  const {plan,item}=found;
  const linkedSessions=state.studySessions.filter(candidate=>candidate.planItemId===item.id);
  item.sessionIds=linkedSessions.map(candidate=>candidate.id);
  item.executedSeconds=linkedSessions.reduce((sum,candidate)=>sum+Math.max(0,Number(candidate.durationSeconds)||0),0);
  item.status=item.plannedMinutes>0&&item.executedSeconds>=item.plannedMinutes*60?'completed':'partial';
  item.lastExecutedAt=session.endedAt||nowISO();
  plan.updatedAt=nowISO();
  if(item.recommendationId&&item.status==='completed')completeRecommendationFeedback(state.recommendationFeedback,item.recommendationId,{sessionId:session.id,completedAt:item.lastExecutedAt});
}
function syncPlannedExecution(planItemId){
  const latest=state.studySessions.filter(session=>session.planItemId===planItemId).sort((a,b)=>(a.endedAt||'').localeCompare(b.endedAt||'')).pop();
  if(latest) recordPlannedExecution(planItemId,latest);
  else{
    const found=findDailyPlanItem(planItemId);
    if(found){
      found.item.sessionIds=[];
      found.item.executedSeconds=0;
      found.item.status='planned';
      found.item.lastExecutedAt=null;
      found.plan.updatedAt=nowISO();
    }
  }
}
function startPlannedActivity(itemId){
  const found=findDailyPlanItem(itemId);
  if(!found){ showToast('Esta atividade não está mais disponível no plano.'); return; }
  if(['completed','deferred','replaced','skipped'].includes(found.item.status)){
    showToast('Esta atividade não está disponível para iniciar.');
    return;
  }
  if(timerSeconds>0){
    showToast('Finalize ou zere a sessão atual antes de iniciar outra atividade.');
    return;
  }
  const {plan,item}=found;
  Object.assign(state.activeTimer,{
    subjectId:item.subjectId||null,topicId:item.topicId||null,type:item.type||'study',
    planItemId:item.id,targetMinutes:item.plannedMinutes
  });
  item.status='in_progress';
  item.startedAt=item.startedAt||nowISO();
  plan.updatedAt=nowISO();
  populateTimerContextControls();
  startTimer();
  renderPlanoHoje();
  activateTab('dashboard');
  document.getElementById('studyTimerDisplay')?.scrollIntoView({behavior:'smooth',block:'center'});
  showToast(`Atividade iniciada · meta de ${formatPlanMinutes(item.plannedMinutes)}.`);
}
function currentTimerSeconds(){
  const active=state.activeTimer||{};
  let seconds=Math.max(0,Number(active.accumulatedSeconds)||0);
  if(active.isRunning&&active.runStartedAt){
    const runStart=Date.parse(active.runStartedAt);
    if(Number.isFinite(runStart)) seconds+=Math.max(0,Math.floor((Date.now()-runStart)/1000));
  }
  return seconds;
}
function updateTimerDisplay(){
  const el = document.getElementById('studyTimerDisplay');
  if(el) el.textContent = formatTimer(timerSeconds);
  const targetEl=document.getElementById('studyTimerTarget');
  if(targetEl){
    const targetMinutes=Math.max(0,Number(state.activeTimer?.targetMinutes)||0);
    if(targetMinutes>0){
      const targetSeconds=targetMinutes*60;
      const difference=targetSeconds-timerSeconds;
      const planItem=findDailyPlanItem(state.activeTimer.planItemId)?.item;
      const context=planItem?`${planItem.subjectName} — ${planItem.topicName} · `:'';
      targetEl.textContent=context+`meta ${formatPlanMinutes(targetMinutes)} · ${difference>=0?formatDuration(difference)+' restantes':formatDuration(Math.abs(difference))+' além da meta'}`;
      targetEl.style.display='block';
    }else{
      targetEl.textContent='';
      targetEl.style.display='none';
    }
  }
}
function updateTimerControls(){
  const hasTime=timerSeconds>0;
  document.getElementById('timerStartBtn').style.display=timerRunning?'none':'inline-block';
  document.getElementById('timerPauseBtn').style.display=timerRunning?'inline-block':'none';
  ['timerSubjectSelect','timerTopicSelect','timerTypeSelect'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.disabled=hasTime;
  });
}
function populateTimerTopicSelect(subjectId,selectedTopicId){
  const select=document.getElementById('timerTopicSelect');
  if(!select) return;
  const subject=getSubjectById(subjectId);
  select.innerHTML=`<option value="">Sem tópico específico</option>`+
    (subject?topicsForSelection(subject,selectedTopicId).map(topic=>`<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name||'(tópico sem nome)')}</option>`).join(''):'');
  select.value=selectedTopicId||'';
  if(select.value!==(selectedTopicId||'')) state.activeTimer.topicId=null;
}
function populateTimerContextControls(){
  const subjectSelect=document.getElementById('timerSubjectSelect');
  const typeSelect=document.getElementById('timerTypeSelect');
  if(!subjectSelect||!typeSelect) return;
  subjectSelect.innerHTML=`<option value="">Sem disciplina específica</option>`+
    subjectsForSelection(state.activeTimer.subjectId).map(subject=>`<option value="${escapeAttr(subject.id)}">${escapeHtml(subject.name)}${subject.archived?' (arquivada)':''}</option>`).join('');
  subjectSelect.value=state.activeTimer.subjectId||'';
  if(subjectSelect.value!==(state.activeTimer.subjectId||'')) state.activeTimer.subjectId=null;
  populateTimerTopicSelect(state.activeTimer.subjectId,state.activeTimer.topicId);
  typeSelect.value=state.activeTimer.type||'study';
  updateTimerControls();
}
function timerTick(){
  timerSeconds=currentTimerSeconds();
  updateTimerDisplay();
}
function startTimer(){
  if(timerRunning) return;
  const active=state.activeTimer;
  if(timerSeconds===0){ active.startedAt=nowISO(); active.accumulatedSeconds=0; }
  active.subjectId=document.getElementById('timerSubjectSelect').value||null;
  active.topicId=document.getElementById('timerTopicSelect').value||null;
  active.type=document.getElementById('timerTypeSelect').value||'study';
  active.runStartedAt=nowISO();
  active.isRunning=true;
  active.hiddenAt=null;
  timerStartedAt=active.startedAt;
  timerRunning = true;
  clearInterval(timerIntervalId);
  timerIntervalId=setInterval(timerTick,1000);
  timerTick();
  updateTimerControls();
  scheduleSave();
}
function pauseTimer(shouldSave=true){
  timerSeconds=currentTimerSeconds();
  state.activeTimer.accumulatedSeconds=timerSeconds;
  state.activeTimer.runStartedAt=null;
  state.activeTimer.isRunning=false;
  state.activeTimer.hiddenAt=null;
  timerRunning = false;
  clearInterval(timerIntervalId);
  timerIntervalId=null;
  updateTimerDisplay();
  updateTimerControls();
  if(shouldSave) scheduleSave();
}
function resetTimer(){
  pauseTimer(false);
  releaseActivePlanItem();
  timerSeconds = 0;
  timerStartedAt = null;
  Object.assign(state.activeTimer,{startedAt:null,runStartedAt:null,accumulatedSeconds:0,isRunning:false,hiddenAt:null,planItemId:null,targetMinutes:null});
  updateTimerDisplay();
  updateTimerControls();
  scheduleSave();
}
function restoreTimerFromState(){
  clearInterval(timerIntervalId);
  timerIntervalId=null;
  timerSeconds=currentTimerSeconds();
  timerStartedAt=state.activeTimer.startedAt||null;
  timerRunning=Boolean(state.activeTimer.isRunning);
  const runStart=state.activeTimer.runStartedAt?Date.parse(state.activeTimer.runStartedAt):0;
  const recoveredLongRun=timerRunning&&runStart&&Date.now()-runStart>4*60*60*1000;
  if(recoveredLongRun){
    pauseTimer(false);
    scheduleSave();
    setTimeout(()=>showConfirm(
      `Uma sessão longa foi recuperada com ${formatDuration(timerSeconds)}. Manter esse tempo e continuar com o cronômetro pausado?`,
      ()=>showToast('Tempo recuperado. Você pode continuar ou finalizar a sessão.'),
      ()=>{ resetTimer(); showToast('Intervalo recuperado descartado.'); }
    ),0);
  }else if(timerRunning){
    timerIntervalId=setInterval(timerTick,1000);
  }
  updateTimerDisplay();
  populateTimerContextControls();
  updateTimerControls();
}
function populateSessionTopicSelect(subjectId,selectedTopicId=null){
  const select = document.getElementById('sessionModalTopic');
  const subject = getSubjectById(subjectId);
  select.innerHTML = `<option value="">Sem tópico específico</option>` +
    (subject ? topicsForSelection(subject,selectedTopicId).map(topic=>`<option value="${escapeAttr(topic.id)}">${escapeHtml(topic.name || '(tópico sem nome)')}</option>`).join('') : '');
}
function showSessionModal(){
  const overlay = document.getElementById('sessionModalOverlay');
  document.getElementById('sessionModalDuration').textContent = formatTimer(timerSeconds);
  const sel = document.getElementById('sessionModalSubject');
  sel.innerHTML = `<option value="">Sem disciplina específica</option>` +
    subjectsForSelection(state.activeTimer.subjectId).map(s=>`<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}${s.archived?' (arquivada)':''}</option>`).join('');
  sel.value=state.activeTimer.subjectId||'';
  populateSessionTopicSelect(sel.value,state.activeTimer.topicId);
  document.getElementById('sessionModalTopic').value=state.activeTimer.topicId||'';
  document.getElementById('sessionModalType').value=state.activeTimer.type||'study';
  document.getElementById('sessionModalResolved').value = '';
  document.getElementById('sessionModalCorrect').value = '';
  document.getElementById('sessionModalNotes').value = '';
  overlay.classList.add('show');
}
function closeSessionModal(){
  document.getElementById('sessionModalOverlay').classList.remove('show');
  resetTimer();
}
document.getElementById('timerStartBtn').addEventListener('click', startTimer);
document.getElementById('timerPauseBtn').addEventListener('click', pauseTimer);
document.getElementById('timerSubjectSelect').addEventListener('change',function(){
  state.activeTimer.subjectId=this.value||null;
  state.activeTimer.topicId=null;
  populateTimerTopicSelect(state.activeTimer.subjectId,null);
  scheduleSave();
});
document.getElementById('timerTopicSelect').addEventListener('change',function(){ state.activeTimer.topicId=this.value||null; scheduleSave(); });
document.getElementById('timerTypeSelect').addEventListener('change',function(){ state.activeTimer.type=this.value||'study'; scheduleSave(); });
document.getElementById('timerResetBtn').addEventListener('click', () => {
  if(timerSeconds === 0){ return; }
  showConfirm('Zerar o cronômetro? O tempo desta sessão será perdido.', resetTimer);
});
document.getElementById('timerFinishBtn').addEventListener('click', () => {
  if(timerSeconds === 0){ showToast('O cronômetro ainda não começou.'); return; }
  pauseTimer();
  showSessionModal();
});
document.getElementById('sessionModalSkipBtn').addEventListener('click', closeSessionModal);
document.getElementById('sessionModalSubject').addEventListener('change',function(){ populateSessionTopicSelect(this.value); });
document.getElementById('sessionModalSaveBtn').addEventListener('click', () => {
  const subjectId = document.getElementById('sessionModalSubject').value || null;
  const topicId = document.getElementById('sessionModalTopic').value || null;
  const type = document.getElementById('sessionModalType').value || 'study';
  const resolved = Number(document.getElementById('sessionModalResolved').value) || 0;
  const correct = Number(document.getElementById('sessionModalCorrect').value) || 0;
  const notes = document.getElementById('sessionModalNotes').value.trim();
  const session = {
    id:uid('session'),startedAt:timerStartedAt || nowISO(),endedAt:nowISO(),date:localDateFromTimestamp(timerStartedAt || nowISO()),
    durationSeconds:timerSeconds,subjectId,topicId,type,questionsResolved:resolved,
    correctAnswers:Math.min(correct,resolved),notes,planItemId:state.activeTimer.planItemId||null
  };
  state.studySessions.push(session);
  recordPlannedExecution(session.planItemId,session);
  addHistoryEvent('study_session',subjectId,topicId,{sessionId:session.id,durationSeconds:session.durationSeconds});
  if(resolved > 0){
    state.questoes.push({ id:uid('question'),date:session.date,subjectId,topicId,resolved,correct:Math.min(correct,resolved),studySessionId:session.id,createdAt:nowISO() });
  }
  persistAndRender();
  showToast(resolved > 0 ? 'Sessão e questões registradas.' : 'Sessão de estudo registrada.');
  closeSessionModal();
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    if(state.activeTimer.isRunning){ state.activeTimer.hiddenAt=nowISO(); scheduleSave(); }
    return;
  }
  const hiddenAt=state.activeTimer.hiddenAt?Date.parse(state.activeTimer.hiddenAt):0;
  if(!state.activeTimer.isRunning||!hiddenAt) return;
  const awaySeconds=Math.max(0,Math.floor((Date.now()-hiddenAt)/1000));
  if(awaySeconds>=2*60*60){
    pauseTimer();
    showConfirm(
      `O cronômetro ficou em segundo plano por ${formatDuration(awaySeconds)}. Manter o intervalo no tempo da sessão?`,
      ()=>showToast('Intervalo mantido. O cronômetro ficou pausado.'),
      ()=>{ resetTimer(); showToast('Intervalo descartado.'); }
    );
  }else{
    state.activeTimer.hiddenAt=null;
    scheduleSave();
  }
});

/* ===== CONQUISTAS / BADGES ===== */
const BADGES = [
  { id:'streak7', icon:'🔥', name:'Uma semana de foco', desc:'7 dias seguidos estudando', check: () => computeStreak(getActivityDates()) >= 7 },
  { id:'streak30', icon:'🏆', name:'Mês de ferro', desc:'30 dias seguidos estudando', check: () => computeStreak(getActivityDates()) >= 30 },
  { id:'subject100', icon:'🎯', name:'Disciplina dominada', desc:'Uma disciplina 100% concluída', check: () => state.subjects.some(s => s.topics.length>0 && subjectProgress(s)===100) },
  { id:'allsubjects', icon:'🗂️', name:'Plano completo', desc:'Todas as disciplinas 100%', check: () => activeSubjects().length>0 && activeSubjects().every(s => s.topics.some(t=>!t.archived) && subjectProgress(s)===100) },
  { id:'topics10', icon:'✅', name:'Dez tópicos', desc:'10 tópicos concluídos', check: () => allTopics().filter(t=>t.status==='Concluído').length >= 10 },
  { id:'topics50', icon:'📚', name:'Cinquenta tópicos', desc:'50 tópicos concluídos', check: () => allTopics().filter(t=>t.status==='Concluído').length >= 50 },
  { id:'q100', icon:'✍️', name:'Cem questões', desc:'100 questões resolvidas', check: () => state.questoes.reduce((sum,q)=>sum+(Number(q.resolved)||0),0) >= 100 },
  { id:'q500', icon:'🧠', name:'Quinhentas questões', desc:'500 questões resolvidas', check: () => state.questoes.reduce((sum,q)=>sum+(Number(q.resolved)||0),0) >= 500 },
  { id:'sim1', icon:'📝', name:'Primeiro simulado', desc:'Completou o primeiro simulado', check: () => state.simulados.length >= 1 },
  { id:'sim5', icon:'🏅', name:'Cinco simulados', desc:'Completou 5 simulados', check: () => state.simulados.length >= 5 },
];
function renderBadges(){
  const grid = document.getElementById('badgesGrid');
  grid.innerHTML = BADGES.map(b => {
    const unlocked = b.check();
    return `<div class="badge-card ${unlocked?'unlocked':''}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>`;
  }).join('');
}

/* ===== HEATMAP DE HORAS E META DIÁRIA ===== */
function heatmapLevel(summary){
  return heatmapMetricLevel(summary,streakView.metric);
}
function heatmapTooltip(summary){
  const parts=[formatDatePt(summary.date),formatDuration(summary.seconds),pluralize(summary.sessions.length,'sessão','sessões')];
  if(summary.targetSeconds>0) parts.push(`${summary.goalPct}% da meta`);
  if(summary.questions>0) parts.push(`${summary.questions} questões · ${summary.accuracy}% de acerto`);
  if(summary.reviews>0) parts.push(pluralize(summary.reviews,'revisão','revisões'));
  if(summary.simulations>0) parts.push(pluralize(summary.simulations,'simulado'));
  if(summary.subjectNames.length) parts.push(summary.subjectNames.join(', '));
  return parts.join(' · ');
}
function renderHeatmap(){
  const activityDates=getActivityDates();
  const earliest=[...activityDates].sort()[0];
  const historyDays=earliest?Math.max(1,Math.round((parseLocalDate(todayISO())-parseLocalDate(earliest))/86400000)+1):DEFAULT_STREAK_WEEKS*7;
  const days=streakView.expanded?historyDays:DEFAULT_STREAK_WEEKS*7;
  const today = todayISO();
  const cells = [];
  for(let i = days-1; i >= 0; i--){
    const d = addDays(today, -i);
    const summary=getDailyStudySummary(d,{subjectId:streakView.subjectId});
    const active=heatmapMetricLevel(summary,streakView.metric)>0;
    if(!streakView.onlyActiveDays||active) cells.push(summary);
  }
  const heatmapModel=buildHeatmapViewModel({summaries:cells,metric:streakView.metric,selectedDate:streakView.selectedDate});
  const cellsHtml = heatmapModel.cells.map(summary => {
    const level=summary.level;
    const tooltip=heatmapTooltip(summary);
    const selected=streakView.selectedDate===summary.date?'selected':'';
    return `<button type="button" class="heatmap-cell ${level>0?'heat-'+level:''} ${selected}" title="${escapeAttr(tooltip)}" aria-label="${escapeAttr(tooltip)}" data-delegated-click="selectHeatmapDay('${summary.date}')"></button>`;
  }).join('');
  const hasMetricActivity=heatmapModel.hasActivity;
  const activityStreak=computeStreak(activityDates);
  const goalStreak=computeStreak(getGoalDates());
  document.getElementById('heatmapContainer').innerHTML = `
    <div class="heatmap-toolbar" aria-label="Período da sequência">
      <select aria-label="Métrica do heatmap" data-delegated-change="setHeatmapFilter('metric',this.value)"><option value="hours" ${streakView.metric==='hours'?'selected':''}>Horas</option><option value="questions" ${streakView.metric==='questions'?'selected':''}>Questões</option><option value="reviews" ${streakView.metric==='reviews'?'selected':''}>Revisões</option><option value="simulations" ${streakView.metric==='simulations'?'selected':''}>Simulados</option></select>
      <select aria-label="Disciplina do heatmap" data-delegated-change="setHeatmapFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${activeSubjects().map(subject=>`<option value="${escapeAttr(subject.id)}" ${streakView.subjectId===subject.id?'selected':''}>${escapeHtml(subject.name)}</option>`).join('')}</select>
      <span>${streakView.expanded?'Período completo':`Últimas ${DEFAULT_STREAK_WEEKS} semanas`}</span>
      <button class="btn ghost small" data-delegated-click="toggleStreakExpanded()">${streakView.expanded?'Mostrar menos':'Ver período completo'}</button>
      <button class="btn ghost small" aria-pressed="${streakView.onlyActiveDays}" data-delegated-click="toggleStreakActiveDays()">${streakView.onlyActiveDays?'Mostrar todos os dias':'Apenas dias com atividade'}</button>
    </div>
    <div class="heatmap-grid">${cellsHtml}</div>
    ${hasMetricActivity?'':`<div class="empty-inline heatmap-empty"><p>Nenhuma atividade encontrada para este indicador e disciplina.</p><button class="btn small" data-delegated-click="focusStudyTimer()">Iniciar estudo</button></div>`}
    <div class="heatmap-legend">
      0%
      <span class="heatmap-cell"></span>
      <span class="heatmap-cell heat-1"></span>
      <span class="heatmap-cell heat-2"></span>
      <span class="heatmap-cell heat-3"></span>
      meta atingida
    </div>
    <div class="heatmap-summary">
      <span>🔥 Atividade: ${pluralize(activityStreak,'dia')}</span>
      <span>🎯 Meta atingida: ${pluralize(goalStreak,'dia')}</span>
      <span>${streakView.metric==='hours'?'Cores: <50% · 50–99% · ≥100% da meta diária':'Intensidade relativa da atividade selecionada'}</span>
    </div>
    ${streakView.selectedDate?`<div class="heatmap-detail" role="status">${escapeHtml(heatmapTooltip(getDailyStudySummary(streakView.selectedDate,{subjectId:streakView.subjectId})))} <button class="btn ghost small" data-delegated-click="viewSelectedHeatmapSessions()">Ver sessões deste dia</button></div>`:''}
  `;
}

function setHeatmapFilter(field,value){if(field==='metric'&&HEATMAP_METRICS.includes(value))streakView.metric=value;if(field==='subjectId')streakView.subjectId=value;streakView.selectedDate=null;renderHeatmap()}
function selectHeatmapDay(date){streakView.selectedDate=date;renderHeatmap()}
function viewSelectedHeatmapSessions(){if(streakView.selectedDate)selectSessionHistoryDate(streakView.selectedDate)}

function getMetricDataState(metric,minimumConfidence=.35){
  if(!metric?.available||metric.raw===null) return 'empty';
  if((Number(metric.confidence)||0)<minimumConfidence) return 'insufficient';
  return 'ready';
}
function metricStateLabel(metric,minimumConfidence=.35){
  const status=getMetricDataState(metric,minimumConfidence);
  if(status==='empty') return 'Aguardando dados';
  if(status==='insufficient') return 'Estimativa inicial';
  return 'Resultado calculado';
}

/* ===== GRÁFICO: EVOLUÇÃO DOS SIMULADOS ===== */
function renderSimuladosChart(){
  const card = document.getElementById('simuladosChartCard');
  const container = document.getElementById('simuladosChart');
  const data = [...state.simulados].sort((a,b)=> (a.date||'').localeCompare(b.date||''));

  if(data.length < 2){
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  const W = 640, H = 160, padL = 30, padR = 12, padT = 12, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = data.length;
  const xFor = i => padL + (n===1 ? 0 : (i/(n-1))*plotW);
  const yFor = pct => padT + plotH - (pct/100)*plotH;
  const notas = data.map(s => simuladoNota(s));

  const points = notas.map((pct,i)=>`${xFor(i)},${yFor(pct)}`).join(' ');
  const gridLines = [0,25,50,75,100].map(v => `
    <line class="chart-grid" x1="${padL}" y1="${yFor(v)}" x2="${W-padR}" y2="${yFor(v)}"></line>
    <text x="2" y="${yFor(v)+3}">${v}%</text>
  `).join('');
  const dots = data.map((s,i)=>`<circle class="chart-dot" cx="${xFor(i)}" cy="${yFor(notas[i])}" r="3"><title>${escapeHtml(s.nome||'Simulado')} (${formatDatePt(s.date)}): ${notas[i]}%</title></circle>`).join('');
  const labels = data.map((s,i)=>`<text x="${xFor(i)}" y="${H-6}" text-anchor="middle">${i+1}</text>`).join('');

  container.innerHTML = `
    <svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
      ${gridLines}
      <polyline class="chart-line" points="${points}"></polyline>
      ${dots}
      ${labels}
    </svg>
  `;
}

function getSubjectQuestionRecords(subjectId){
  const records = [];
  state.questoes.filter(q => entitySubjectId(q) === subjectId).forEach(q => {
    records.push({ date: q.date, correct: Number(q.correct)||0, total: Number(q.resolved)||0 });
  });
  state.simulados.forEach(sim => {
    (sim.breakdown||[]).filter(b => entitySubjectId(b) === subjectId).forEach(b => {
      records.push({ date: sim.date, correct: Number(b.correct)||0, total: Number(b.total)||0 });
    });
  });
  return records.filter(r => r.total > 0).sort((a,b)=> (a.date||'').localeCompare(b.date||''));
}

function computeSubjectPerformance(){
  const subjectIds = new Set();
  state.questoes.forEach(q => { const id=entitySubjectId(q); if(id) subjectIds.add(id); });
  state.simulados.forEach(sim => (sim.breakdown||[]).forEach(b => { const id=entitySubjectId(b); if(id) subjectIds.add(id); }));

  const results = [];
  subjectIds.forEach(subjectId => {
    const records = getSubjectQuestionRecords(subjectId);
    const total = records.reduce((s,r)=>s+r.total, 0);
    const correct = records.reduce((s,r)=>s+r.correct, 0);
    if(total === 0) return;
    const acerto = calcAcertoPct(correct, total);

    let trend = '→';
    if(records.length >= 2){
      const mid = Math.ceil(records.length/2);
      const first = records.slice(0, mid);
      const second = records.slice(mid);
      const firstTotal = first.reduce((s,r)=>s+r.total,0);
      const secondTotal = second.reduce((s,r)=>s+r.total,0);
      if(firstTotal > 0 && secondTotal > 0){
        const firstPct = calcAcertoPct(first.reduce((s,r)=>s+r.correct,0), firstTotal);
        const secondPct = calcAcertoPct(second.reduce((s,r)=>s+r.correct,0), secondTotal);
        if(secondPct - firstPct >= 3) trend = '↑';
        else if(firstPct - secondPct >= 3) trend = '↓';
      }
    }
    results.push({ subjectId, subject: getSubjectName(subjectId), acerto, total, trend });
  });

  return results.sort((a,b)=> a.acerto - b.acerto);
}

function renderDesempenhoDisciplina(){
  const card = document.getElementById('desempenhoDisciplinaCard');
  const container = document.getElementById('desempenhoDisciplinaBars');
  const perf = computeSubjectPerformance();

  if(perf.length === 0){
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  const rows = perf.map(p => {
    const trend=calculateWeightedTrend(getSubjectWeeklyTrend(p.subjectId));
    const color=trend.key==='up'?'var(--green)':trend.key==='down'?'var(--red)':'var(--ink-soft)';
    const comparison=trend.key==='insufficient'?'Amostra insuficiente':`${trend.previousAccuracy}% → ${trend.recentAccuracy}% (${trend.delta>=0?'+':''}${trend.delta} p.p.)`;
    return `
    <tr>
      <td>${escapeHtml(p.subject)}</td>
      <td style="text-align:right;">${p.acerto}%</td>
      <td style="text-align:right;">${p.total}</td>
      <td style="text-align:right;color:${color};font-weight:600;">${trend.icon} ${escapeHtml(trend.label)}<small class="trend-comparison">${escapeHtml(comparison)}</small></td>
    </tr>
  `}).join('');

  const fracos = perf.filter(p => p.acerto < 70 && p.total >= 5);
  const alertasHtml = fracos.length
    ? fracos.map(p => `<div class="desempenho-alerta">🔴 ${escapeHtml(p.subject)} precisa de atenção.</div>`).join('')
    : '';

  container.innerHTML = `
    <table class="weekly-history-table" style="margin-bottom:${fracos.length?'12px':'0'};">
      <thead>
        <tr><th>Disciplina</th><th style="text-align:right;">Acerto</th><th style="text-align:right;">Questões</th><th style="text-align:right;">Tendência · 4 semanas × 4 anteriores</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${alertasHtml}
  `;
}

/* ===== BUSCA GLOBAL ===== */
function performGlobalSearch(query){
  const q = query.trim().toLowerCase();
  if(!q) return [];
  const results = [];
  state.subjects.forEach(s => {
    s.topics.forEach(t => {
      const hay = [t.name||'', t.notes||'', ...(t.tags||[])].join(' ').toLowerCase();
      if(hay.includes(q)){
        results.push({ subjectId: s.id, subjectName: s.name, topicId: t.id, topicName: t.name || '(sem nome)' });
      }
    });
  });
  return results.slice(0, 8);
}
function renderGlobalSearchResults(){
  const input = document.getElementById('globalSearchInput');
  const panel = document.getElementById('globalSearchResults');
  const q = input.value;
  if(!q.trim()){ panel.classList.remove('show'); panel.innerHTML=''; return; }
  const results = performGlobalSearch(q);
  if(results.length === 0){
    panel.innerHTML = `<div class="search-result-empty">Nada encontrado pra "${escapeHtml(q)}"</div>`;
  } else {
    panel.innerHTML = results.map(r => `
      <div class="search-result-item" onmousedown="jumpToTopic('${r.subjectId}','${r.topicId}')">
        <strong>${escapeHtml(r.topicName)}</strong>
        <span>${escapeHtml(r.subjectName)}</span>
      </div>
    `).join('');
  }
  panel.classList.add('show');
}
function jumpToTopic(subjectId, topicId){
  const s = state.subjects.find(x=>x.id===subjectId);
  if(s) s.collapsed = false;
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('globalSearchResults').classList.remove('show');
  document.querySelector('.tab-btn[data-tab="disciplinas"]').click();
  persistAndRender();
  setTimeout(() => {
    const row = document.getElementById('topic-row-'+topicId);
    if(row){
      row.scrollIntoView({ behavior:'smooth', block:'center' });
      row.classList.add('highlight-flash');
      setTimeout(()=>row.classList.remove('highlight-flash'), 1700);
    }
  }, 150);
}
document.getElementById('globalSearchInput').addEventListener('input', renderGlobalSearchResults);
document.getElementById('globalSearchInput').addEventListener('focus', renderGlobalSearchResults);
document.getElementById('globalSearchInput').addEventListener('blur', () => {
  setTimeout(()=> document.getElementById('globalSearchResults').classList.remove('show'), 150);
});

/* ===== RENDER: HEADER STATS ===== */
function renderHeader(){
  const topics = activeTopics();
  const total = topics.length;
  const done = topics.filter(t=>t.status==='Concluído').length;
  const andamento = topics.filter(t=>t.status==='Em andamento').length;
  const pct = total ? Math.round((done/total)*100) : 0;

  document.getElementById('balanceFigure').innerHTML = `${pct}<span>%</span>`;
  document.getElementById('balanceSub').textContent = `${done} de ${total} tópicos concluídos`;
  document.getElementById('statSubjects').textContent = activeSubjects().length;
  document.getElementById('statAndamento').textContent = andamento;
  document.getElementById('statConcluido').textContent = done;

  const revisoesPrevistas =
    state.calendar.filter(c => c.date >= todayISO()).length +
    state.reviewAgenda.filter(a => a.date >= todayISO() && a.status !== 'Concluído').length;
  document.getElementById('statRevisoes').textContent = revisoesPrevistas;

  document.getElementById('statStreak').textContent = computeStreak(getActivityDates());

  recordProgressSnapshot(pct);
  renderExamCountdown();
}

/* ===== RENDER: DASHBOARD ===== */
let upcomingVisible=5;
function changeUpcomingLimit(delta){upcomingVisible+=Number(delta||0);renderDashboard()}
function showAllUpcoming(){upcomingVisible=Number.MAX_SAFE_INTEGER;renderDashboard()}
function resetUpcomingLimit(){upcomingVisible=5;renderDashboard()}
function renderDashboard(){
  const topics = activeTopics();
  const total = topics.length;
  const done = topics.filter(t=>t.status==='Concluído').length;
  const andamento = topics.filter(t=>t.status==='Em andamento').length;
  const naoIniciado = topics.filter(t=>t.status==='Não iniciado').length;

  const qs = document.getElementById('quickStats');
  qs.innerHTML = `
    <div class="stat-cell"><div class="n">${total}</div><div class="l">Tópicos totais</div></div>
    <div class="stat-cell"><div class="n">${naoIniciado}</div><div class="l">Não iniciados</div></div>
    <div class="stat-cell"><div class="n">${andamento}</div><div class="l">Em andamento</div></div>
    <div class="stat-cell"><div class="n">${done}</div><div class="l">Concluídos</div></div>
  `;

  const bars = document.getElementById('progressBars');
  if(activeSubjects().length === 0){
    bars.innerHTML = `<div class="upcoming-empty">Adicione disciplinas na aba "Disciplinas" para ver o progresso aqui.</div>`;
  } else {
    bars.innerHTML = activeSubjects().map(s=>{
      const pct = subjectProgress(s);
      return `<div class="bar-row">
        <div class="bar-label" title="${escapeAttr(s.name)}">${escapeHtml(s.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-pct">${pct}%</div>
      </div>`;
    }).join('');
  }

  const calItems = state.calendar
    .filter(c => c.date >= todayISO())
    .map(c => ({ date:c.date, subject:entitySubjectName(c), label:c.reviewType && c.reviewType!=='—' ? c.reviewType : 'Revisão', status:c.status,origem:'Calendário' }));
  const agendaItems = state.reviewAgenda
    .filter(a => a.date >= todayISO())
    .map(a => ({ date:a.date, subject:entitySubjectName(a), label:`${a.topicId ? getTopicName(a.topicId) : (a.topic || 'Tópico')} · ${a.tipo}`, status:a.status,origem:'Agenda de Revisões' }));

  const allUpcoming = [...calItems, ...agendaItems].sort((a,b)=> a.date.localeCompare(b.date));
  const upcoming=allUpcoming.slice(0,upcomingVisible);

  const ul = document.getElementById('upcomingList');
  const title=document.getElementById('upcomingTitle'),footer=document.getElementById('upcomingFooter');
  if(title)title.textContent=`Próximas revisões · ${allUpcoming.length}`;
  if(upcoming.length === 0){
    ul.innerHTML = `<li class="upcoming-empty">Nenhuma revisão futura cadastrada. Adicione datas no Calendário ou gere a Agenda de Revisões.</li>`;
    if(footer)footer.innerHTML='';
  } else {
    ul.innerHTML = upcoming.map(c => `
      <li>
        <span class="upcoming-date">${formatDatePt(c.date)}</span>
        <span style="flex:1;"><strong>${escapeHtml(c.subject || '—')}</strong> — ${escapeHtml(unifiedItemLabel(c))}<span class="item-origin">${escapeHtml(c.origem)}</span></span>
        <span class="subject-progress-pill">${escapeHtml(c.status||'Não iniciado')}</span>
      </li>
    `).join('');
    if(footer)footer.innerHTML=renderCollectionFooter({variant:'block',total:allUpcoming.length,visible:upcoming.length,step:5,label:'revisões',showMoreAction:'changeUpcomingLimit(5)',showAllAction:'showAllUpcoming()',showLessAction:upcomingVisible>5?'resetUpcomingLimit()':''})+`<button class="btn ghost small upcoming-calendar-link" data-delegated-click="navigateKpi('calendario')">Ver todas no calendário</button>`;
  }
}

/* ===== RENDER: DISCIPLINAS ===== */
function renderSubjects(){
  const container = document.getElementById('subjectsContainer');
  const subjects=activeSubjects();
  const archived=archivedSubjects();
  if(subjects.length === 0 && archived.length===0){
    container.innerHTML = `<div class="empty-state">
      <p>Nenhuma disciplina cadastrada ainda.</p>
      <button class="btn" data-delegated-click="addSubject()">+ Adicionar primeira disciplina</button>
    </div>`;
    return;
  }

  const activeHtml = subjects.length===0 ? `<div class="empty-state"><p>Nenhuma disciplina ativa.</p><button class="btn" data-delegated-click="addSubject()">+ Adicionar disciplina</button></div>` : subjects.map((s, idx) => {
    const pct = subjectProgress(s);
    const subjectTopics=s.topics.filter(t=>!t.archived);
    const topicFilter=subjectTopicFilters.get(s.id)||{status:'',difficulty:''};
    const allVisibleTopics=subjectTopics.filter(topic=>(!topicFilter.status||topic.status===topicFilter.status)&&(!topicFilter.difficulty||topic.difficulty===topicFilter.difficulty));
    const topicLimit=subjectTopicLimits.get(s.id)||10;
    const visibleTopics=allVisibleTopics.slice(0,topicLimit);
    const archivedTopics=s.topics.filter(t=>t.archived);
    return `
    <div class="subject-block" data-subject-id="${s.id}">
      <div class="subject-header" data-delegated-click="toggleSubject('${s.id}')">
        <div class="subject-header-left">
          <div class="subject-order-btns" data-delegated-click="event.stopPropagation()">
            <button class="icon-btn-nav" data-delegated-click="moveSubject('${s.id}', -1)" ${idx===0?'disabled':''} title="Mover pra cima">▲</button>
            <button class="icon-btn-nav" data-delegated-click="moveSubject('${s.id}', 1)" ${idx===subjects.length-1?'disabled':''} title="Mover pra baixo">▼</button>
          </div>
          <span class="subject-toggle">${s.collapsed ? '▸' : '▾'}</span>
          <span class="subject-name" contenteditable="true"
                data-delegated-click="event.stopPropagation()"
                data-delegated-blur="renameSubject('${s.id}', this.textContent)">${escapeHtml(s.name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="subject-progress-pill">${pct}% · ${subjectTopics.length} tópico${subjectTopics.length===1?'':'s'}</span>
          <button class="btn ghost small" data-delegated-click="event.stopPropagation();duplicateSubject('${s.id}')">Duplicar</button>
          <button class="btn ghost small" data-delegated-click="event.stopPropagation();archiveSubject('${s.id}')">Arquivar</button>
        </div>
      </div>
      <div class="subject-body ${s.collapsed ? 'collapsed':''}">
        <div class="subject-topic-filters"><select aria-label="Filtrar tópicos de ${escapeAttr(s.name)} por status" data-delegated-change="setSubjectTopicFilter('${s.id}','status',this.value)"><option value="">Todos os status</option>${STATUS_OPTIONS.map(option=>`<option value="${option}" ${topicFilter.status===option?'selected':''}>${option}</option>`).join('')}</select><select aria-label="Filtrar tópicos de ${escapeAttr(s.name)} por dificuldade" data-delegated-change="setSubjectTopicFilter('${s.id}','difficulty',this.value)"><option value="">Todas as dificuldades</option>${DIFFICULTY_OPTIONS.map(option=>`<option value="${option}" ${topicFilter.difficulty===option?'selected':''}>${option}</option>`).join('')}</select></div>
        <div class="ledger-scroll">
        <table class="ledger">
          <thead>
            <tr>
              <th style="width:22%;">Tópico</th>
              <th style="width:15%;">Link / material</th>
              <th style="width:13%;">Status</th>
              <th style="width:13%;">Dificuldade</th>
              <th style="width:9%;">Notas</th>
              <th style="width:6%;"></th>
            </tr>
          </thead>
          <tbody>
            ${visibleTopics.map(t => `
              <tr data-status="${t.status}" id="topic-row-${t.id}">
                <td>
                  <input type="text" value="${escapeAttr(t.name)}" placeholder="Nome do tópico"
                     data-delegated-blur="updateTopic('${s.id}','${t.id}','name', this.value)">
                  ${t.tags && t.tags.length ? `<div class="tag-chips">${t.tags.map(tag=>`<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
                </td>
                <td>
                  <input type="url" value="${escapeAttr(t.link||'')}" placeholder="https://..."
                     data-delegated-blur="updateTopic('${s.id}','${t.id}','link', this.value)">
                </td>
                <td>
                  <select class="status-select ${STATUS_CLASS[t.status]||'st-nao'}"
                     data-delegated-change="updateTopicStatus('${s.id}','${t.id}', this)">
                    ${STATUS_OPTIONS.map(o=>`<option value="${o}" ${o===t.status?'selected':''}>${o}</option>`).join('')}
                  </select>
                  <span class="stamp">✓ ok</span>
                </td>
                <td>
                  <select class="status-select ${DIFFICULTY_CLASS[t.difficulty]||'diff-medio'}"
                     data-delegated-change="updateTopic('${s.id}','${t.id}','difficulty', this.value)">
                    ${DIFFICULTY_OPTIONS.map(o=>`<option value="${o}" ${o===t.difficulty?'selected':''}>${o}</option>`).join('')}
                  </select>
                </td>
                <td>
                  <button class="btn ghost small notes-toggle-btn ${(t.notes || (t.tags && t.tags.length)) ? 'has-notes':''}" data-delegated-click="toggleNotes('${t.id}')">${(t.notes || (t.tags && t.tags.length)) ? '📝 ver' : '📝 add'}</button>
                </td>
                <td><button class="icon-btn" data-delegated-click="archiveTopic('${s.id}','${t.id}')" title="Arquivar tópico">✕</button></td>
              </tr>
              ${openNotesIds.has(t.id) ? `
              <tr class="notes-row">
                <td colspan="6">
                  ${renderTopicAnalyticsState(s,t)}
                  <div class="topic-strategy-fields">
                    <label>Importância na prova (%)<input type="number" min="0" max="100" step="1" placeholder="Não definida" value="${t.examImportance==null?'':Math.round(t.examImportance*100)}" data-delegated-blur="updateTopicStrategy('${s.id}','${t.id}','examImportance',this.value)"></label>
                    <label>Esforço total estimado (min)<input type="number" min="1" step="5" placeholder="Não definido" value="${t.estimatedStudyMinutes==null?'':t.estimatedStudyMinutes}" data-delegated-blur="updateTopicStrategy('${s.id}','${t.id}','estimatedStudyMinutes',this.value)"></label>
                  </div>
                  <input type="text" class="topic-tags-input" placeholder="Tags separadas por vírgula (ex: cai muito, revisar antes da prova)"
                    value="${escapeAttr((t.tags||[]).join(', '))}"
                    data-delegated-blur="updateTopicTags('${s.id}','${t.id}', this.value)">
                  <textarea class="topic-notes-textarea" placeholder="Resumo, pegadinha da prova, dúvida pra revisar depois..."
                    data-delegated-blur="updateTopic('${s.id}','${t.id}','notes', this.value)">${escapeHtml(t.notes||'')}</textarea>
                </td>
              </tr>` : ''}
            `).join('')}
          </tbody>
        </table>
        </div>
        ${renderCollectionFooter({variant:'block',total:allVisibleTopics.length,visible:visibleTopics.length,step:10,label:`tópicos filtrados · ${subjectTopics.length} no total`,showMoreAction:`changeSubjectTopicLimit('${s.id}',10)`,showAllAction:`showAllSubjectTopics('${s.id}')`,showLessAction:topicLimit>10?`resetSubjectTopicLimit('${s.id}')`:''})}
        <div class="add-topic-row">
          <button class="btn ghost small" data-delegated-click="addTopic('${s.id}')">+ Adicionar tópico</button>
        </div>
        ${archivedTopics.length?`<div class="archived-section">
          <div class="archived-section-title">Tópicos arquivados</div>
          ${archivedTopics.map(t=>`<div class="archived-item">
            <div><div class="archived-item-name">${escapeHtml(t.name||'Tópico sem nome')}</div><div class="archived-item-date">Arquivado em ${t.archivedAt?new Date(t.archivedAt).toLocaleDateString('pt-BR'):'—'}</div></div>
            <div class="archived-item-actions"><button class="btn ghost small" data-delegated-click="restoreTopic('${s.id}','${t.id}')">Restaurar</button><button class="btn danger" data-delegated-click="requestPermanentTopicDelete('${s.id}','${t.id}')">Excluir definitivamente</button></div>
          </div>`).join('')}
        </div>`:''}
      </div>
    </div>`;
  }).join('');
  const archivedHtml=archived.length?`<div class="archived-section">
    <div class="archived-section-title">Disciplinas arquivadas</div>
    ${archived.map(s=>`<div class="archived-item">
      <div><div class="archived-item-name">${escapeHtml(s.name)}</div><div class="archived-item-date">Arquivada em ${s.archivedAt?new Date(s.archivedAt).toLocaleDateString('pt-BR'):'—'} · ${pluralize(s.topics.length,'tópico')}</div></div>
      <div class="archived-item-actions"><button class="btn ghost small" data-delegated-click="restoreSubject('${s.id}')">Restaurar</button><button class="btn danger" data-delegated-click="requestPermanentSubjectDelete('${s.id}')">Excluir definitivamente</button></div>
    </div>`).join('')}
  </div>`:'';
  container.innerHTML=activeHtml+archivedHtml;
}

let openNotesIds = new Set();
const subjectTopicLimits=new Map();
const subjectTopicFilters=new Map();
function toggleNotes(topicId){
  if(openNotesIds.has(topicId)) openNotesIds.clear();
  else{openNotesIds.clear();openNotesIds.add(topicId)}
  renderSubjects();
}
function changeSubjectTopicLimit(subjectId,delta){subjectTopicLimits.set(subjectId,(subjectTopicLimits.get(subjectId)||10)+Number(delta||0));renderSubjects()}
function showAllSubjectTopics(subjectId){subjectTopicLimits.set(subjectId,Number.MAX_SAFE_INTEGER);renderSubjects()}
function resetSubjectTopicLimit(subjectId){subjectTopicLimits.set(subjectId,10);renderSubjects()}
function setSubjectTopicFilter(subjectId,field,value){const current=subjectTopicFilters.get(subjectId)||{status:'',difficulty:''};if(field==='status'||field==='difficulty')current[field]=value;subjectTopicFilters.set(subjectId,current);subjectTopicLimits.set(subjectId,10);renderSubjects()}
function updateTopicTags(subjectId, topicId, value){
  const s = state.subjects.find(x=>x.id===subjectId);
  const t = s.topics.find(x=>x.id===topicId);
  t.tags = value.split(',').map(tag=>tag.trim()).filter(Boolean);
  persistAndRender();
}
function updateTopicStrategy(subjectId,topicId,field,value){
  studyPlanPreview=null;
  const found=getTopicById(topicId);if(!found||found.subject.id!==subjectId)return;
  if(field==='examImportance')found.topic.examImportance=value===''?null:Number(value)/100;
  if(field==='estimatedStudyMinutes')found.topic.estimatedStudyMinutes=value===''?null:Number(value);
  normalizeTopicStrategy(found.topic);persistAndRender();
}
function renderTopicAnalyticsState(subject,topic){
  const coverage=topic.status==='Concluído'?100:topic.status==='Em andamento'||topic.status==='Revisão'?50:0;
  const masteryResult=topicMasteryIndex(subject.id,topic.id),retentionResult=topicRetentionScore(subject.id,topic.id);
  const mastery=masteryResult.confidence>0?masteryResult.score:null,retention=retentionResult.available?retentionResult.score:null;
  let label='Não iniciado';
  if(coverage>0&&mastery===null)label='Em estudo · aguardando questões';
  else if(coverage===100&&mastery<50)label='Coberto, não consolidado';
  else if(coverage===100&&retention!==null&&retention<60)label='Domínio em risco';
  else if(coverage===100&&mastery>=75)label='Consolidado';
  else if(coverage===100)label='Em consolidação';
  else if(coverage>0)label='Em estudo';
  const metric=(name,value,detail='')=>`<div><span>${name}</span><strong>${value===null?'Aguardando dados':Math.round(value)+'%'}</strong>${detail?`<small>${escapeHtml(detail)}</small>`:''}</div>`;
  return `<div class="topic-analytics-state"><div class="topic-analytics-title">Estado analítico <strong>${escapeHtml(label)}</strong><small>Independente do status manual</small></div><div class="topic-analytics-metrics">${metric('Cobertura',coverage)}${metric('Domínio',mastery,mastery===null?'Registre questões deste tópico':'Confiança '+Math.round(masteryResult.confidence*100)+'%')}${metric('Retenção',retention,retention===null?'Conclua revisões vinculadas':'Estimativa baseada nas revisões')}</div></div>`;
}
function moveSubject(id, direction){
  const active=activeSubjects();
  const activeIdx=active.findIndex(s=>s.id===id);
  const target=active[activeIdx+direction];
  if(activeIdx===-1||!target) return;
  const idx=state.subjects.findIndex(s=>s.id===id);
  const targetIdx=state.subjects.findIndex(s=>s.id===target.id);
  [state.subjects[idx],state.subjects[targetIdx]]=[state.subjects[targetIdx],state.subjects[idx]];
  persistAndRender();
}
function duplicateSubject(id){
  const idx = state.subjects.findIndex(s=>s.id===id);
  if(idx === -1) return;
  const original = state.subjects[idx];
  const copy = {
    id: uid('subject'),
    name: original.name + ' (cópia)',
    collapsed: false,
    archived: false,
    archivedAt: null,
    createdAt: nowISO(),
    topics: original.topics.map(t => ({
      id: uid('topic'), name: t.name, link: t.link || '', status: 'Não iniciado', archived:false, archivedAt:null,
      notes: '', tags: [...(t.tags||[])], difficulty: t.difficulty || 'Médio', createdAt:nowISO(),
      firstCompletedAt:null,lastCompletedAt:null,completionCount:0,lastReviewedAt:null,reviewCount:0
      ,examImportance:t.examImportance??null,estimatedStudyMinutes:t.estimatedStudyMinutes??null,prerequisites:[]
    }))
  };
  state.subjects.splice(idx + 1, 0, copy);
  persistAndRender();
  showToast(`"${copy.name}" criada com os mesmos tópicos (progresso zerado).`);
}

function toggleSubject(id){
  const s = state.subjects.find(x=>x.id===id);
  s.collapsed = !s.collapsed;
  renderSubjects();
}
function renameSubject(id, name){
  const s = state.subjects.find(x=>x.id===id);
  const clean = name.trim() || 'Disciplina sem nome';
  if(s.name !== clean){ s.name = clean; persistAndRender(); } else { renderAll(); }
}
function addSubject(){
  showPrompt('Criar uma nova disciplina',{label:'Nome da disciplina',placeholder:'Ex.: Conhecimentos Bancários',confirmLabel:'Criar',validate:name=>{
    if(!name) return 'Informe o nome da disciplina.';
    if(state.subjects.some(subject=>subject.name.trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))) return 'Já existe uma disciplina com esse nome.';
    return '';
  }},name=>{
    state.subjects.push({ id: uid('subject'), name, collapsed:false, archived:false, archivedAt:null, createdAt:nowISO(), topics: [] });
    persistAndRender();
    showToast(`Disciplina "${name}" criada.`);
  });
}
const DISCIPLINAS_PADRAO_BB = [
  'Português',
  'Matemática',
  'Matemática Financeira',
  'Conhecimentos Bancários',
  'Atualidades do Mercado Financeiro',
  'Informática',
  'Vendas e Negociação'
];
function carregarDisciplinasPadrao(){
  const existentes = new Set(state.subjects.map(s => s.name));
  let adicionadas = 0;
  DISCIPLINAS_PADRAO_BB.forEach(nome => {
    if(!existentes.has(nome)){
      state.subjects.push({ id: uid('subject'), name: nome, collapsed:false, archived:false, archivedAt:null, createdAt:nowISO(), topics: [] });
      adicionadas++;
    }
  });
  persistAndRender();
  if(adicionadas > 0){
    showToast(`${pluralize(adicionadas,'disciplina')} do edital ${adicionadas===1?'adicionada':'adicionadas'}.`);
  } else {
    showToast('Todas as disciplinas do edital já estão na sua lista.');
  }
}
document.getElementById('loadDefaultSubjectsBtn').addEventListener('click', carregarDisciplinasPadrao);

function archiveSubject(id){
  const subject=getSubjectById(id);
  if(!subject) return showToast('Disciplina não encontrada.');
  subject.archived=true;
  subject.archivedAt=nowISO();
  addHistoryEvent('subject_archived',id,null,{name:subject.name});
  persistAndRender();
  showToast(`"${subject.name}" foi arquivada.`);
}
function restoreSubject(id){
  const subject=getSubjectById(id);
  if(!subject) return;
  subject.archived=false;
  subject.archivedAt=null;
  addHistoryEvent('subject_restored',id,null,{name:subject.name});
  persistAndRender();
  showToast(`"${subject.name}" foi restaurada.`);
}
function getSubjectDependencies(subjectId){
  const subject=getSubjectById(subjectId);
  const topicIds=new Set((subject?.topics||[]).map(t=>t.id));
  return {
    questoes:state.questoes.filter(item=>entitySubjectId(item)===subjectId||topicIds.has(item.topicId)).length,
    sessions:state.studySessions.filter(item=>entitySubjectId(item)===subjectId||topicIds.has(item.topicId)).length,
    calendar:state.calendar.filter(item=>entitySubjectId(item)===subjectId||topicIds.has(item.topicId)).length,
    reviews:state.reviewAgenda.filter(item=>entitySubjectId(item)===subjectId||topicIds.has(item.topicId||item.topicRef)).length,
    goals:state.metasPorDisciplina.filter(item=>entitySubjectId(item)===subjectId).length,
    history:state.topicHistory.filter(item=>(item.subjectId===subjectId||topicIds.has(item.topicId))&&!['subject_archived','subject_restored'].includes(item.type)).length,
    simulatedBreakdowns:state.simulados.reduce((sum,sim)=>sum+(sim.breakdown||[]).filter(item=>entitySubjectId(item)===subjectId).length,0),
    activeTimer:state.activeTimer.subjectId===subjectId||topicIds.has(state.activeTimer.topicId)?1:0
  };
}
function dependencyTotal(dependencies){ return Object.values(dependencies).reduce((sum,value)=>sum+(Number(value)||0),0); }
function requestPermanentSubjectDelete(id){
  const subject=getSubjectById(id);
  if(!subject) return;
  if(!subject.archived) return showToast('Arquive a disciplina antes de solicitar a exclusão definitiva.');
  const total=dependencyTotal(getSubjectDependencies(id));
  if(total>0) return showToast(`A disciplina possui ${pluralize(total,'registro')} ${total===1?'vinculado':'vinculados'} e não pode ser excluída.`);
  showConfirm(`Excluir definitivamente "${subject.name}"? Esta ação não pode ser desfeita.`,()=>{
    state.subjects=state.subjects.filter(s=>s.id!==id);
    persistAndRender();
    showToast('Disciplina excluída definitivamente.');
  });
}
function addTopic(subjectId){
  const s = state.subjects.find(x=>x.id===subjectId);
  s.topics.push({ id: uid('topic'), name:'', link:'', status:'Não iniciado', archived:false, archivedAt:null, notes:'', tags:[], difficulty:'Médio', createdAt:nowISO(), firstCompletedAt:null,lastCompletedAt:null,completionCount:0,lastReviewedAt:null,reviewCount:0,examImportance:null,estimatedStudyMinutes:null,prerequisites:[] });
  persistAndRender();
}
function archiveTopic(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found||found.subject.id!==subjectId) return;
  found.topic.archived=true;
  found.topic.archivedAt=nowISO();
  addHistoryEvent('topic_archived',subjectId,topicId,{name:found.topic.name});
  persistAndRender();
  showToast('Tópico arquivado.');
}
function restoreTopic(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found||found.subject.id!==subjectId) return;
  found.topic.archived=false;
  found.topic.archivedAt=null;
  addHistoryEvent('topic_restored',subjectId,topicId,{name:found.topic.name});
  persistAndRender();
  showToast('Tópico restaurado.');
}
function getTopicDependencies(topicId){
  return {
    questions:state.questoes.filter(item=>item.topicId===topicId).length,
    sessions:state.studySessions.filter(item=>item.topicId===topicId).length,
    reviews:state.reviewAgenda.filter(item=>item.topicId===topicId||item.topicRef===topicId).length,
    calendar:state.calendar.filter(item=>item.topicId===topicId).length,
    history:state.topicHistory.filter(item=>item.topicId===topicId&&!['topic_archived','topic_restored'].includes(item.type)).length,
    activeTimer:state.activeTimer.topicId===topicId?1:0
  };
}
function requestPermanentTopicDelete(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found||found.subject.id!==subjectId) return;
  if(!found.topic.archived) return showToast('Arquive o tópico antes de solicitar a exclusão definitiva.');
  const total=dependencyTotal(getTopicDependencies(topicId));
  if(total>0) return showToast(`O tópico possui ${pluralize(total,'registro')} ${total===1?'vinculado':'vinculados'} e não pode ser excluído.`);
  showConfirm(`Excluir definitivamente "${found.topic.name||'este tópico'}"?`,()=>{
    found.subject.topics=found.subject.topics.filter(topic=>topic.id!==topicId);
    persistAndRender();
    showToast('Tópico excluído definitivamente.');
  });
}
function updateTopic(subjectId, topicId, field, value){
  const s = state.subjects.find(x=>x.id===subjectId);
  const t = s.topics.find(x=>x.id===topicId);
  t[field] = value;
  persistAndRender();
}
function addHistoryEvent(type,subjectId,topicId=null,metadata={}){
  if(!Array.isArray(state.topicHistory)) state.topicHistory = [];
  const occurredAt=nowISO();
  const event={id:uid('history'),date:occurredAt,occurredAt,localDate:todayISO(),type,subjectId:subjectId||null,topicId:topicId||null,metadata};
  state.topicHistory.push(event);
  return event;
}
function historyEvents(type){ return state.topicHistory.filter(event=>event.type===type); }
function eventLocalDate(event){ return event.localDate||historicalLocalDate(event.occurredAt||event.date); }
function topicCompletionEvents(){ return historyEvents('topic_completed'); }
function uniqueTopicsCompletedBetween(startDate,endDate){
  const ids=new Set();
  topicCompletionEvents().forEach(event=>{
    const date=eventLocalDate(event);
    if(date&&date>=startDate&&date<=endDate&&event.topicId) ids.add(event.topicId);
  });
  return ids.size;
}
function completedReviewsForTopic(topicId){
  return state.reviewAgenda.filter(review=>(review.topicId||review.topicRef)===topicId&&review.status==='Concluído');
}
function refreshTopicReviewStats(topicId){
  const found=getTopicById(topicId);
  if(!found) return;
  const completed=completedReviewsForTopic(topicId);
  const dates=completed.map(review=>review.completedAt).filter(Boolean).sort();
  found.topic.reviewCount=completed.length;
  found.topic.lastReviewedAt=dates.length?dates[dates.length-1]:null;
}
function refreshAllTopicReviewStats(){
  state.subjects.forEach(subject=>subject.topics.forEach(topic=>refreshTopicReviewStats(topic.id)));
}

function markTopicCompleted(topic){
  const now = nowISO();
  if(!topic.firstCompletedAt) topic.firstCompletedAt = now;
  topic.lastCompletedAt = now;
  topic.completedAt = todayISO();
  topic.completionCount = (Number(topic.completionCount)||0) + 1;
}
function updateTopicStatus(subjectId, topicId, selectEl){
  const s = getSubjectById(subjectId);
  const t = s?.topics.find(x=>x.id===topicId);
  if(!t) return;
  const oldStatus = t.status;
  const newStatus = selectEl.value;
  if(oldStatus === newStatus) return;
  t.status = newStatus;
  if(newStatus === 'Concluído'){
    markTopicCompleted(t);
    addHistoryEvent('topic_completed',subjectId,topicId);
  }else if(oldStatus === 'Concluído'){
    t.completedAt = null;
    addHistoryEvent('topic_reopened',subjectId,topicId,{newStatus});
  }else if(newStatus === 'Em andamento' && oldStatus === 'Não iniciado'){
    addHistoryEvent('topic_started',subjectId,topicId);
  }
  persistAndRender();
}

/* ===== RENDER: CALENDARIO ===== */
/* ===== INTEGRAÇÃO CALENDÁRIO + AGENDA_REVISOES ===== */
function getRevisoesUnificadas(){
  const doCalendario = state.calendar.map(c => ({
    id: c.id, date: c.date, subjectId: entitySubjectId(c), subject: entitySubjectName(c),
    label: c.reviewType && c.reviewType !== '—' ? c.reviewType : 'Revisão',
    status: c.status || 'Não iniciado', origem: 'Calendário'
  }));
  const daAgenda = state.reviewAgenda.map(a => ({
    id: a.id, date: a.date, subjectId: entitySubjectId(a), subject: entitySubjectName(a),
    label: `${a.topicId ? getTopicName(a.topicId) : (a.topic || 'Tópico')} · ${a.tipo || ''}`,
    status: a.status || 'Não iniciado', origem: 'Agenda de Revisões'
  }));
  return [...doCalendario, ...daAgenda];
}
function unifiedItemLabel(item){
  const subject=String(item?.subject||'').trim(),label=String(item?.label||'').trim();
  if(!subject||!label) return label||'Revisão';
  const escaped=subject.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return label.replace(new RegExp(`^${escaped}\\s*[·•—-]\\s*`,'i'),'').trim()||'Revisão';
}
const overdueGroupLimits={calAtrasadas:3,hojeAtrasadas:3};
const overdueExpandedDates={calAtrasadas:new Set(),hojeAtrasadas:new Set()};
const overdueExpansionInitialized=new Set();
function changeOverdueGroupLimit(elId,delta){overdueGroupLimits[elId]=(overdueGroupLimits[elId]||3)+Number(delta||0);renderCalAtrasadas(elId)}
function showAllOverdueGroups(elId){overdueGroupLimits[elId]=Number.MAX_SAFE_INTEGER;renderCalAtrasadas(elId)}
function resetOverdueGroupLimit(elId){overdueGroupLimits[elId]=3;renderCalAtrasadas(elId)}
function toggleOverdueDate(elId,date){const dates=overdueExpandedDates[elId]||(overdueExpandedDates[elId]=new Set());if(dates.has(date))dates.delete(date);else dates.add(date);renderCalAtrasadas(elId)}

function renderCalIndicadores(){
  const todas = getRevisoesUnificadas();
  const today = todayISO();
  const total = todas.length;
  const atrasadas = todas.filter(r => r.date && r.date < today && r.status !== 'Concluído').length;
  const hoje = todas.filter(r => r.date === today).length;
  const proximos7 = todas.filter(r => {
    const d = diasParaRevisao(r.date);
    return d !== null && d > 0 && d <= 7;
  }).length;

  document.getElementById('calIndicadores').innerHTML = `
    <div class="kpi-cell"><div class="n">${total}</div><div class="l">Itens no total</div></div>
    <div class="kpi-cell ${atrasadas>0?'warn':''}"><div class="n">${atrasadas}</div><div class="l">Atrasadas</div></div>
    <div class="kpi-cell ${hoje>0?'ok':''}"><div class="n">${hoje}</div><div class="l">Hoje</div></div>
    <div class="kpi-cell"><div class="n">${proximos7}</div><div class="l">Próximos 7 dias</div></div>
  `;
}

/* ===== VISÃO MENSAL DO CALENDÁRIO ===== */
let currentMonthDate = new Date();
const MONTH_MAX_EVENTS_PER_DAY = 3;

function renderMonthCalendar(){
  const container = document.getElementById('monthCalendar');
  if(!container) return;

  const filterSubject = document.getElementById('calFilterSubject').value;
  const filterStatus = document.getElementById('calFilterStatus').value;

  const events = getRevisoesUnificadas()
    .filter(e => !filterSubject || e.subjectId === filterSubject)
    .filter(e => !filterStatus || e.status === filterStatus);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  document.getElementById('calendarMonthTitle').textContent = (() => {
    const label = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();

  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());

  let html = `<div class="month-grid-wrap"><div class="month-grid">`;
  ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(day => {
    html += `<div class="month-header">${day}</div>`;
  });

  const cursor = new Date(start);
  for(let i = 0; i < 42; i++){
    const iso = localDateISO(cursor);
    const dayEvents = events.filter(e => e.date === iso);
    const isToday = iso === todayISO();
    const outside = cursor.getMonth() !== month;

    html += `<div class="month-day ${outside?'outside':''} ${isToday?'today':''}">
      <div class="day-number">${cursor.getDate()}</div>`;

    dayEvents.slice(0, MONTH_MAX_EVENTS_PER_DAY).forEach(evt => {
      let cls = 'event-futura';
      if(evt.status === 'Concluído'){
        cls = 'event-concluida';
      } else {
        const dias = diasParaRevisao(evt.date);
        if(dias !== null && dias < 0) cls = 'event-atrasada';
        else if(dias === 0) cls = 'event-hoje';
      }
      const tooltip = `${evt.subject || '—'} · ${evt.label} (${evt.origem})`;
      html += `<div class="cal-event ${cls}" title="${escapeAttr(tooltip)}">${escapeHtml(evt.subject || evt.label)}</div>`;
    });

    if(dayEvents.length > MONTH_MAX_EVENTS_PER_DAY){
      html += `<div class="cal-event-more">+${dayEvents.length - MONTH_MAX_EVENTS_PER_DAY} mais</div>`;
    }

    html += `</div>`;
    cursor.setDate(cursor.getDate() + 1);
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

document.getElementById('monthPrevBtn').addEventListener('click', () => {
  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
  renderMonthCalendar();
});
document.getElementById('monthNextBtn').addEventListener('click', () => {
  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
  renderMonthCalendar();
});
document.getElementById('monthTodayBtn').addEventListener('click', () => {
  currentMonthDate = new Date();
  renderMonthCalendar();
});

function renderCalendarFilters(){
  const sel = document.getElementById('calFilterSubject');
  const current = sel.value;
  sel.innerHTML = `<option value="">Todas as disciplinas</option>` +
    state.subjects.map(s=>`<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join('');
  sel.value = current;

  const selMes = document.getElementById('calFilterMes');
  const currentMes = selMes.value;
  const meses = collectMonthKeys(state.calendar);
  selMes.innerHTML = `<option value="">Todos os meses</option>` +
    meses.map(k=>`<option value="${k}">${monthLabel(k)}</option>`).join('');
  selMes.value = currentMes;

  const selTipo = document.getElementById('calFilterTipo');
  const currentTipo = selTipo.value;
  selTipo.innerHTML = `<option value="">Todos os tipos de revisão</option>` +
    REVIEW_OPTIONS.filter(o=>o!=='—').map(o=>`<option value="${o}">${o}</option>`).join('');
  selTipo.value = currentTipo;
}

function toggleFilterPanel(scope){
  const id=scope==='agenda'?'agendaFilters':scope==='sessions'?'studySessionsFilters':'calendarFilters';
  const panel=document.getElementById(id),button=document.querySelector(`[aria-controls="${id}"]`);if(!panel)return;
  const expanded=!panel.classList.contains('show');panel.classList.toggle('show',expanded);button?.setAttribute('aria-expanded',String(expanded));
  if(scope==='sessions')renderSessionHistoryFilterControls();
}
function setCalendarMobileView(view){
  const normalized=view==='agenda'?'agenda':'month';
  document.getElementById('panel-calendario')?.setAttribute('data-calendar-view',normalized);
  document.querySelectorAll('.calendar-view-btn').forEach(button=>{
    const active=button.dataset.calendarView===normalized;
    button.classList.toggle('active',active);
    button.classList.toggle('ghost',!active);
    button.setAttribute('aria-pressed',String(active));
  });
}
document.querySelectorAll('.calendar-view-btn').forEach(button=>button.addEventListener('click',()=>setCalendarMobileView(button.dataset.calendarView)));
const calendarUiState={visible:10,editingId:null,editingIsNew:false,draft:null};
function calendarViewModel(item){return {date:item.date?formatDatePt(item.date):'Sem data',week:item.week||'—',subject:getSubjectName(entitySubjectId(item)),status:item.status||'Não iniciado',reviewType:item.reviewType&&item.reviewType!=='—'?item.reviewType:'Sem revisão'};}
function changeCalendarLimit(delta){calendarUiState.visible=Math.max(10,calendarUiState.visible+Number(delta||0));renderCalendar()}
function resetCalendarLimit(){calendarUiState.visible=10;renderCalendar()}
function editCalendarItem(id){
  if(calendarUiState.editingIsNew&&calendarUiState.editingId!==id)state.calendar=state.calendar.filter(item=>item.id!==calendarUiState.editingId);
  const item=state.calendar.find(entry=>entry.id===id);if(!item)return;calendarUiState.editingId=id;calendarUiState.editingIsNew=false;calendarUiState.draft=cloneRecord(item);renderCalendar();
}
function cancelCalendarEdit(){if(calendarUiState.editingIsNew)state.calendar=state.calendar.filter(item=>item.id!==calendarUiState.editingId);calendarUiState.editingId=null;calendarUiState.editingIsNew=false;calendarUiState.draft=null;renderCalendar()}
function updateCalendarDraft(field,value){const draft=calendarUiState.draft;if(draft)draft[field]=value;}
function saveCalendarEdit(){const draft=calendarUiState.draft,index=state.calendar.findIndex(item=>item.id===calendarUiState.editingId);if(!draft||index<0)return cancelCalendarEdit();state.calendar[index]=draft;calendarUiState.editingId=null;calendarUiState.editingIsNew=false;calendarUiState.draft=null;persistAndRender();showToast('Item do calendário atualizado.');}
function completeCalendarItem(id){const item=state.calendar.find(entry=>entry.id===id);if(!item||item.status==='Concluído')return;item.status='Concluído';persistAndRender();showToast('Item concluído.');}
function renderCalendarReadRow(item){
  const vm=calendarViewModel(item),pending=item.status!=='Concluído';
  if(isMobileHistoryLayout())return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)} · ${escapeHtml(vm.week)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.reviewType)}</div></div><button class="btn ghost small" data-delegated-click="editCalendarItem('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(vm.status)}</span><span>${diasParaRevisaoPill(item.date,item.status)}</span></div><div class="mobile-card-actions">${pending?`<button class="btn small history-primary-action" data-delegated-click="completeCalendarItem('${item.id}')">Concluir</button>`:''}</div></article></td></tr>`;
  return `<tr class="history-read-row history-desktop-row ${item.date===todayISO()?'today':''}" data-id="${item.id}"><td>${escapeHtml(vm.date)}</td><td>${escapeHtml(vm.week)}</td><td><div class="row-primary">${escapeHtml(vm.subject)}</div></td><td><span class="history-status ${STATUS_CLASS[item.status]||''}">${escapeHtml(vm.status)}</span></td><td>${escapeHtml(vm.reviewType)}</td><td>${diasParaRevisaoPill(item.date,item.status)}</td><td><div class="row-actions">${pending?`<button class="btn small" data-delegated-click="completeCalendarItem('${item.id}')">Concluir</button>`:''}<button class="btn ghost small" data-delegated-click="editCalendarItem('${item.id}')">Editar</button></div></td></tr>`;
}
function renderCalendarEditRow(item){const draft=calendarUiState.draft,subjectId=entitySubjectId(draft);if(!draft)return '';return `<tr class="row-editing" data-id="${item.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date||''}" data-delegated-change="updateCalendarDraft('date',this.value)"></label><label>Semana<input type="text" value="${escapeAttr(draft.week||'')}" data-delegated-input="updateCalendarDraft('week',this.value)"></label><label>Disciplina<select data-delegated-change="updateCalendarDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===subjectId?'selected':''}>${escapeHtml(subject.name)}</option>`).join('')}</select></label><label>Status<select data-delegated-change="updateCalendarDraft('status',this.value)">${STATUS_OPTIONS.map(option=>`<option value="${option}" ${option===draft.status?'selected':''}>${option}</option>`).join('')}</select></label><label>Tipo de revisão<select data-delegated-change="updateCalendarDraft('reviewType',this.value)">${REVIEW_OPTIONS.map(option=>`<option value="${option}" ${option===draft.reviewType?'selected':''}>${option}</option>`).join('')}</select></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelCalendarEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveCalendarEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteCalRow('${item.id}')">Excluir</button></div></div></td></tr>`;}
function renderCalendar(){
  const body = document.getElementById('calBody');
  const filterSubject = document.getElementById('calFilterSubject').value;
  const filterStatus = document.getElementById('calFilterStatus').value;
  const filterMes = document.getElementById('calFilterMes').value;
  const filterTipo = document.getElementById('calFilterTipo').value;

  const rows = state.calendar
    .filter(c => !filterSubject || entitySubjectId(c) === filterSubject)
    .filter(c => !filterStatus || c.status === filterStatus)
    .filter(c => !filterMes || monthKey(c.date) === filterMes)
    .filter(c => !filterTipo || c.reviewType === filterTipo)
    .sort((a,b)=> (a.date||'').localeCompare(b.date||''));

  if(rows.length === 0){
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="border:none;">
      <p>Nenhum item encontrado com esses filtros.</p>
      <button class="btn" data-delegated-click="addCalRow()">+ Adicionar item</button>
    </div></td></tr>`;
    return;
  }

  const visible=rows.slice(0,calendarUiState.visible);
  body.innerHTML=visible.map(item=>calendarUiState.editingId===item.id?renderCalendarEditRow(item):renderCalendarReadRow(item)).join('')+renderCollectionFooter({total:rows.length,visible:calendarUiState.visible,showMoreAction:'changeCalendarLimit(10)',showLessAction:calendarUiState.visible>10?'resetCalendarLimit()':'',colspan:7,label:'itens'});
}

function addCalRow(){
  const item={id:uid('calendar'),date:todayISO(),week:'',subjectId:activeSubjects()[0]?.id||null,topicId:null,status:'Não iniciado',reviewType:'—',createdAt:nowISO()};state.calendar.push(item);calendarUiState.editingId=item.id;calendarUiState.editingIsNew=true;calendarUiState.draft=cloneRecord(item);renderCalendar();
}
function deleteCalRow(id){
  showConfirm('Excluir este item do calendário?',()=>{state.calendar=state.calendar.filter(c=>c.id!==id);calendarUiState.editingId=null;calendarUiState.editingIsNew=false;calendarUiState.draft=null;persistAndRender();showToast('Item excluído.');});
}
function updateCal(id, field, value){
  const c = state.calendar.find(x=>x.id===id);
  c[field] = value;
  persistAndRender();
}

document.getElementById('calFilterSubject').addEventListener('change', () => {calendarUiState.visible=10;renderCalendar();renderMonthCalendar();});
document.getElementById('calFilterStatus').addEventListener('change', () => {calendarUiState.visible=10;renderCalendar();renderMonthCalendar();});
document.getElementById('calFilterMes').addEventListener('change',()=>{calendarUiState.visible=10;renderCalendar();});
document.getElementById('calFilterTipo').addEventListener('change',()=>{calendarUiState.visible=10;renderCalendar();});
document.getElementById('addSubjectBtn').addEventListener('click', addSubject);
document.getElementById('addCalRowBtn').addEventListener('click', addCalRow);

/* ===== AGENDA DE REVISÕES ===== */
function addDays(iso, days){
  const d = parseLocalDate(iso);
  if(!d) return '';
  d.setDate(d.getDate() + Number(days||0));
  return localDateISO(d);
}

function reviewBaseDaysFromType(type){
  if(type==='Revisão 24h') return 1;
  const match=String(type||'').match(/(\d+)/);
  return match?Math.max(1,Number(match[1])):7;
}
function adaptiveReviewSuggestion(topicId,baseDays,baseDate){
  const found=getTopicById(topicId);
  const diagnosis=found?diagnoseTopic(found.subject.id,topicId):null;
  const result=calculateAdaptiveInterval({
    baseDays,accuracy:diagnosis?.performance?.accuracy,volume:diagnosis?.performance?.resolved||0,
    target:Number(state.metas.metaAprovacao)||70,trendKey:diagnosis?.trend?.key,
    dominantErrorKey:diagnosis?.dominantError?.key,reviews:Number(found?.topic?.reviewCount)||0
  });
  return {...result,date:addDays(baseDate,result.days)};
}
function resetAdaptiveReviewDate(id){
  const review=state.reviewAgenda.find(item=>item.id===id);
  if(!review||!review.topicId) return;
  const found=getTopicById(review.topicId);
  const baseDate=found?.topic?.completedAt||todayISO();
  const suggestion=adaptiveReviewSuggestion(review.topicId,review.baseIntervalDays||reviewBaseDaysFromType(review.tipo),baseDate);
  review.date=suggestion.date;
  review.suggestedDate=suggestion.date;
  review.adaptiveReason=suggestion.reason;
  review.manualDate=false;
  review.adaptive=true;
  persistAndRender();
}
function gerarAgendaAutomatica(){
  const concluidos = activeTopics().filter(t => t.status === 'Concluído' && t.completedAt);
  if(concluidos.length === 0){
    showToast('Nenhum tópico concluído com data registrada ainda. Marque tópicos como "Concluído" na aba Disciplinas primeiro.');
    return;
  }
  let adicionados = 0;
  concluidos.forEach(t => {
    const intervalos = DIFFICULTY_INTERVALS[t.difficulty] || AGENDA_INTERVALS;
    intervalos.forEach(intervalo => {
      const jaExiste = state.reviewAgenda.some(a =>
        (a.topicId || a.topicRef) === t.id && a.tipo === intervalo.tipo
      );
      if(!jaExiste){
        const suggestion=adaptiveReviewSuggestion(t.id,intervalo.dias,t.completedAt);
        state.reviewAgenda.push({
          id:uid('review'),subjectId:t.subjectId,topicId:t.id,
          date:suggestion.date,suggestedDate:suggestion.date,baseIntervalDays:intervalo.dias,
          adaptive:true,manualDate:false,adaptiveReason:suggestion.reason,
          tipo:intervalo.tipo,status:'Não iniciado',createdAt:nowISO(),completedAt:null
        });
        adicionados++;
      }
    });
  });
  persistAndRender();
  if(adicionados > 0){
    showToast(`${pluralize(adicionados,'revisão','revisões')} ${adicionados===1?'adicionada':'adicionadas'} à agenda — tópicos difíceis ganham revisões mais próximas.`);
  } else {
    showToast('A agenda já está atualizada — nenhuma revisão nova para gerar.');
  }
}
function getTopicDifficulty(topicId){
  if(!topicId) return 'Médio';
  for(const s of state.subjects){
    const t = s.topics.find(x=>x.id===topicId);
    if(t) return t.difficulty || 'Médio';
  }
  return 'Médio';
}

function renderAgendaFilters(){
  const sel = document.getElementById('agendaFilterSubject');
  const current = sel.value;
  sel.innerHTML = `<option value="">Todas as disciplinas</option>` +
    state.subjects.map(s=>`<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join('');
  sel.value = current;

  const selMes = document.getElementById('agendaFilterMes');
  const currentMes = selMes.value;
  const meses = collectMonthKeys(state.reviewAgenda);
  selMes.innerHTML = `<option value="">Todos os meses</option>` +
    meses.map(k=>`<option value="${k}">${monthLabel(k)}</option>`).join('');
  selMes.value = currentMes;

  const selTipo = document.getElementById('agendaFilterTipo');
  const currentTipo = selTipo.value;
  selTipo.innerHTML = `<option value="">Todos os tipos</option>` +
    TIPO_AGENDA_OPTIONS.map(o=>`<option value="${o}">${o}</option>`).join('');
  selTipo.value = currentTipo;
}

const agendaUiState={upcomingVisible:5,completedVisible:10,completedExpanded:false,editingId:null,editingIsNew:false,draft:null};
function agendaViewModel(item){
  const topicId=item.topicId||item.topicRef;
  return {date:item.date?formatDatePt(item.date):'Sem data',subject:getSubjectName(entitySubjectId(item)),topic:topicId?getTopicName(topicId):(item.topic||'Sem tópico'),type:item.tipo||'Revisão livre',difficulty:getTopicDifficulty(topicId),status:item.status||'Não iniciado'};
}
function toggleCompletedReviews(){agendaUiState.completedExpanded=!agendaUiState.completedExpanded;renderAgenda()}
function changeAgendaLimit(group,delta){const key=`${group}Visible`,minimum=group==='completed'?10:5;agendaUiState[key]=Math.max(minimum,agendaUiState[key]+Number(delta||0));renderAgenda()}
function resetAgendaLimit(group){agendaUiState[`${group}Visible`]=group==='completed'?10:5;renderAgenda()}
function editAgenda(id){
  if(agendaUiState.editingIsNew&&agendaUiState.editingId!==id)state.reviewAgenda=state.reviewAgenda.filter(item=>item.id!==agendaUiState.editingId);
  const item=state.reviewAgenda.find(entry=>entry.id===id);if(!item)return;
  agendaUiState.editingId=id;agendaUiState.editingIsNew=false;agendaUiState.draft=cloneRecord(item);renderAgenda();
}
function cancelAgendaEdit(){if(agendaUiState.editingIsNew)state.reviewAgenda=state.reviewAgenda.filter(item=>item.id!==agendaUiState.editingId);agendaUiState.editingId=null;agendaUiState.editingIsNew=false;agendaUiState.draft=null;renderAgenda()}
function updateAgendaDraft(field,value){const draft=agendaUiState.draft;if(!draft)return;draft[field]=value;if(field==='subjectId'&&draft.topicId&&!topicsForSelection(value,draft.topicId).some(topic=>topic.id===draft.topicId))draft.topicId=null;}
function applyAgendaField(item,field,value){
  const oldStatus=item.status,oldValue=item[field];item[field]=value;
  if(field==='date'&&value!==oldValue){item.manualDate=true;item.adaptive=false;}
  if(field==='status'&&value==='Concluído'&&oldStatus!=='Concluído'){
    item.completedAt=nowISO();const topicId=item.topicId||item.topicRef||null;addHistoryEvent('review_completed',entitySubjectId(item),topicId,{reviewId:item.id,reviewType:item.tipo});if(topicId)refreshTopicReviewStats(topicId);
  }else if(field==='status'&&value!=='Concluído'&&oldStatus==='Concluído'){
    const topicId=item.topicId||item.topicRef||null;item.completedAt=null;addHistoryEvent('review_reopened',entitySubjectId(item),topicId,{reviewId:item.id,newStatus:value});if(topicId)refreshTopicReviewStats(topicId);
  }
}
function saveAgendaEdit(){
  const draft=agendaUiState.draft,item=state.reviewAgenda.find(entry=>entry.id===agendaUiState.editingId);if(!draft||!item)return cancelAgendaEdit();
  ['date','subjectId','topic','tipo','status'].forEach(field=>{if(item[field]!==draft[field])applyAgendaField(item,field,draft[field])});
  agendaUiState.editingId=null;agendaUiState.editingIsNew=false;agendaUiState.draft=null;persistAndRender();showToast('Revisão atualizada.');
}
let pendingReviewRatingId=null;
function closeReviewRating(){pendingReviewRatingId=null;const overlay=document.getElementById('reviewRatingOverlay');overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true')}
function completeAgendaReview(id){
  const item=state.reviewAgenda.find(entry=>entry.id===id);if(!item||item.status==='Concluído')return;
  if(!(item.topicId||item.topicRef)){applyAgendaField(item,'status','Concluído');persistAndRender();showToast('Revisão concluída.');return}
  pendingReviewRatingId=id;const overlay=document.getElementById('reviewRatingOverlay');overlay.classList.add('show');overlay.removeAttribute('aria-hidden');overlay.querySelector('[data-review-rating="good"]')?.focus();
}
function adaptiveReviewType(days){return ({1:'Revisão 24h',3:'Revisão 3 dias',7:'Revisão 7 dias',14:'Revisão 14 dias',15:'Revisão 15 dias',30:'Revisão 30 dias'})[days]||'Revisão livre'}
function rateCompletedReview(rating){
  const item=state.reviewAgenda.find(entry=>entry.id===pendingReviewRatingId),topicId=item?.topicId||item?.topicRef;if(!item||!topicId||!REVIEW_RATINGS[rating])return closeReviewRating();
  const found=getTopicById(topicId),reviewDate=todayISO(),adaptiveState=applyAdaptiveReviewRating(found?.topic?.adaptiveReview,rating,{reviewDate,algorithmVersion:state.algorithmVersions.adaptiveReview});
  if(found)found.topic.adaptiveReview=adaptiveState;item.lastRating=rating;item.adaptiveState=structuredCloneSafe(adaptiveState);item.adaptiveReason=`Avaliação: ${REVIEW_RATINGS[rating].label} · próximo intervalo: ${adaptiveState.intervalDays} dia${adaptiveState.intervalDays===1?'':'s'}`;
  applyAgendaField(item,'status','Concluído');
  const alreadyScheduled=state.reviewAgenda.some(review=>review.id!==item.id&&(review.topicId||review.topicRef)===topicId&&review.status!=='Concluído'&&review.date===adaptiveState.nextReviewDate);
  if(!alreadyScheduled)state.reviewAgenda.push({id:uid('review'),subjectId:entitySubjectId(item)||found?.subject?.id||null,topicId,topicRef:topicId,topic:found?.topic?.name||item.topic||'',date:adaptiveState.nextReviewDate,suggestedDate:adaptiveState.nextReviewDate,baseIntervalDays:adaptiveState.intervalDays,adaptive:true,manualDate:false,adaptiveReason:`Agendada após avaliação ${REVIEW_RATINGS[rating].label}.`,tipo:adaptiveReviewType(adaptiveState.intervalDays),status:'Não iniciado',lastRating:null,adaptiveState:structuredCloneSafe(adaptiveState),createdAt:nowISO(),completedAt:null});
  addHistoryEvent('adaptive_review_rated',entitySubjectId(item),topicId,{reviewId:item.id,rating,intervalDays:adaptiveState.intervalDays,nextReviewDate:adaptiveState.nextReviewDate,algorithmVersion:adaptiveState.algorithmVersion});
  closeReviewRating();persistAndRender();showToast(`Revisão concluída. Próxima em ${formatDatePt(adaptiveState.nextReviewDate)}.`);
}
document.querySelectorAll('[data-review-rating]').forEach(button=>button.addEventListener('click',()=>rateCompletedReview(button.dataset.reviewRating)));
document.getElementById('reviewRatingCancelBtn')?.addEventListener('click',closeReviewRating);
function renderAgendaReadRow(item){
  const vm=agendaViewModel(item),pending=item.status!=='Concluído';
  if(isMobileHistoryLayout())return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="8"><article class="mobile-history-card review-mobile-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)} · ${escapeHtml(vm.status)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.topic)}</div></div><button class="btn ghost small" data-delegated-click="editAgenda('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(vm.type)}</span><span>${escapeHtml(vm.difficulty)}</span><span>${diasParaRevisaoPill(item.date,item.status)}</span></div><div class="mobile-card-actions">${pending?`<button class="btn small history-primary-action" data-delegated-click="completeAgendaReview('${item.id}')">Concluir</button>`:''}</div></article></td></tr>`;
  return `<tr class="history-read-row history-desktop-row ${item.date===todayISO()?'today':''}" data-id="${item.id}"><td>${escapeHtml(vm.date)}<div class="review-date-mode" title="${escapeAttr(item.adaptiveReason||'')}">${item.manualDate?'Manual':'Adaptativa'}${item.lastRating?` · ${escapeHtml(REVIEW_RATINGS[item.lastRating].label)}`:''}${item.manualDate&&item.topicId?` · <button type="button" data-delegated-click="resetAdaptiveReviewDate('${item.id}')">usar sugestão</button>`:''}</div></td><td><div class="row-primary">${escapeHtml(vm.subject)}</div></td><td><div class="row-secondary">${escapeHtml(vm.topic)}</div></td><td>${escapeHtml(vm.type)}</td><td><span class="dias-pill ${DIFFICULTY_CLASS[vm.difficulty]}">${escapeHtml(vm.difficulty)}</span></td><td><span class="history-status ${STATUS_CLASS[item.status]||''}">${escapeHtml(vm.status)}</span></td><td>${diasParaRevisaoPill(item.date,item.status)}</td><td><div class="row-actions">${pending?`<button class="btn small history-primary-action" data-delegated-click="completeAgendaReview('${item.id}')">Concluir</button>`:''}<button class="btn ghost small" data-delegated-click="editAgenda('${item.id}')">Editar</button></div></td></tr>`;
}
function renderAgendaEditRow(item){
  const draft=agendaUiState.draft,subjectId=entitySubjectId(draft);if(!draft)return '';
  return `<tr class="row-editing" data-id="${item.id}"><td colspan="8"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date||''}" data-delegated-change="updateAgendaDraft('date',this.value)"></label><label>Disciplina<select ${draft.topicId?'disabled title="Definida pelo tópico vinculado"':''} data-delegated-change="updateAgendaDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===subjectId?'selected':''}>${escapeHtml(subject.name)}</option>`).join('')}</select></label><label>Tópico<input type="text" value="${escapeAttr(draft.topicId?getTopicName(draft.topicId):(draft.topic||''))}" ${draft.topicId?'readonly':''} data-delegated-input="updateAgendaDraft('topic',this.value)"></label><label>Tipo<select data-delegated-change="updateAgendaDraft('tipo',this.value)">${TIPO_AGENDA_OPTIONS.map(option=>`<option value="${option}" ${option===draft.tipo?'selected':''}>${option}</option>`).join('')}</select></label><label>Status<select data-delegated-change="updateAgendaDraft('status',this.value)">${STATUS_OPTIONS.map(option=>`<option value="${option}" ${option===draft.status?'selected':''}>${option}</option>`).join('')}</select></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelAgendaEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveAgendaEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteAgendaRow('${item.id}')">Excluir</button></div></div></td></tr>`;
}
function renderAgenda(){
  const body = document.getElementById('agendaBody');
  const filterSubject = document.getElementById('agendaFilterSubject').value;
  const filterStatus = document.getElementById('agendaFilterStatus').value;
  const filterMes = document.getElementById('agendaFilterMes').value;
  const filterTipo = document.getElementById('agendaFilterTipo').value;

  const rows = state.reviewAgenda
    .filter(a => !filterSubject || entitySubjectId(a) === filterSubject)
    .filter(a => !filterStatus || (filterStatus === 'Atrasadas' ? Boolean(a.date && a.date < todayISO() && a.status !== 'Concluído') : a.status === filterStatus))
    .filter(a => !filterMes || monthKey(a.date) === filterMes)
    .filter(a => !filterTipo || a.tipo === filterTipo)
    .sort((a,b)=> {
      const dateCompare = (a.date||'').localeCompare(b.date||'');
      if(dateCompare !== 0) return dateCompare;
      const wA = DIFFICULTY_WEIGHT[getTopicDifficulty(a.topicId || a.topicRef)] || 2;
      const wB = DIFFICULTY_WEIGHT[getTopicDifficulty(b.topicId || b.topicRef)] || 2;
      return wB - wA;
    });

  if(rows.length === 0){
    body.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="border:none;">
      <p>Nenhuma revisão encontrada com esses filtros.</p>
      <button class="btn ghost small" data-delegated-click="gerarAgendaAutomatica()">⟳ Gerar a partir dos concluídos</button>
      <button class="btn small" data-delegated-click="addAgendaRow()">+ Adicionar manualmente</button>
    </div></td></tr>`;
    return;
  }

  const today=todayISO();
  const groups={overdue:rows.filter(item=>item.status!=='Concluído'&&item.date&&item.date<today),today:rows.filter(item=>item.status!=='Concluído'&&item.date===today),upcoming:rows.filter(item=>item.status!=='Concluído'&&(!item.date||item.date>today)),completed:rows.filter(item=>item.status==='Concluído').sort((a,b)=>String(b.completedAt||b.date||'').localeCompare(String(a.completedAt||a.date||'')))};
  const html=[];
  const renderItems=items=>items.map(item=>agendaUiState.editingId===item.id?renderAgendaEditRow(item):renderAgendaReadRow(item)).join('');
  if(groups.overdue.length){html.push(renderGroupHeader({title:'🔴 Atrasadas',count:groups.overdue.length,tone:'overdue'}),renderItems(groups.overdue));}
  if(groups.today.length){html.push(renderGroupHeader({title:'🟡 Hoje',count:groups.today.length,tone:'today'}),renderItems(groups.today));}
  if(groups.upcoming.length){const visible=groups.upcoming.slice(0,agendaUiState.upcomingVisible);html.push(renderGroupHeader({title:'🔵 Próximas',count:groups.upcoming.length,tone:'upcoming'}),renderItems(visible),renderCollectionFooter({total:groups.upcoming.length,visible:agendaUiState.upcomingVisible,showMoreAction:"changeAgendaLimit('upcoming',5)",showLessAction:agendaUiState.upcomingVisible>5?"resetAgendaLimit('upcoming')":'',colspan:8,label:'revisões'}));}
  if(groups.completed.length){html.push(renderGroupHeader({title:'✓ Concluídas',count:groups.completed.length,tone:'completed',expanded:agendaUiState.completedExpanded,toggleAction:'toggleCompletedReviews()'}));if(agendaUiState.completedExpanded){const visible=groups.completed.slice(0,agendaUiState.completedVisible);html.push(renderItems(visible),renderCollectionFooter({total:groups.completed.length,visible:agendaUiState.completedVisible,showMoreAction:"changeAgendaLimit('completed',10)",showLessAction:agendaUiState.completedVisible>10?"resetAgendaLimit('completed')":'',colspan:8,label:'revisões'}));}}
  body.innerHTML=html.join('');
}

function addAgendaRow(){
  const item={id:uid('review'),topicId:null,date:todayISO(),subjectId:activeSubjects()[0]?.id||null,topic:'',tipo:'Revisão livre',status:'Não iniciado',adaptive:false,manualDate:true,adaptiveReason:null,suggestedDate:null,baseIntervalDays:7,createdAt:nowISO(),completedAt:null};
  state.reviewAgenda.push(item);agendaUiState.editingId=item.id;agendaUiState.editingIsNew=true;agendaUiState.draft=cloneRecord(item);renderAgenda();
}
function deleteAgendaRow(id){
  showConfirm('Excluir esta revisão?',()=>{state.reviewAgenda=state.reviewAgenda.filter(a=>a.id!==id);agendaUiState.editingId=null;agendaUiState.editingIsNew=false;agendaUiState.draft=null;persistAndRender();showToast('Revisão excluída.');});
}
function updateAgenda(id, field, value){
  const a = state.reviewAgenda.find(x=>x.id===id);
  if(!a)return;applyAgendaField(a,field,value);
  persistAndRender();
}

document.getElementById('agendaFilterSubject').addEventListener('change',()=>{agendaUiState.upcomingVisible=5;agendaUiState.completedVisible=10;renderAgenda();});
document.getElementById('agendaFilterStatus').addEventListener('change',()=>{agendaUiState.upcomingVisible=5;agendaUiState.completedVisible=10;renderAgenda();});
document.getElementById('agendaFilterMes').addEventListener('change',()=>{agendaUiState.upcomingVisible=5;agendaUiState.completedVisible=10;renderAgenda();});
document.getElementById('agendaFilterTipo').addEventListener('change',()=>{agendaUiState.upcomingVisible=5;agendaUiState.completedVisible=10;renderAgenda();});
document.getElementById('addAgendaRowBtn').addEventListener('click', addAgendaRow);
document.getElementById('autoGenBtn').addEventListener('click', gerarAgendaAutomatica);

/* ===== QUESTÕES & SIMULADOS ===== */
function calcAcertoPct(correct, resolved){
  const r = Number(resolved)||0;
  const c = Number(correct)||0;
  if(r <= 0) return 0;
  return Math.round((c/r)*1000)/10;
}


let openQuestionErrorIds = new Set();
let performanceSubjectId = null;
let performanceViewMode='with-data';
const errorAnalysisView={days:30,topicId:''};
let performanceVisible=8;
let retentionShowAll=false;
const retentionView={subjectId:'',order:'asc',confidence:'all'};
function setPerformanceViewMode(mode){performanceViewMode=['with-data','insufficient','without-data','all'].includes(mode)?mode:'with-data';performanceVisible=8;renderQuestionAnalytics()}
function setErrorAnalysisFilter(field,value){if(field==='days'&&[7,30,60,90].includes(Number(value)))errorAnalysisView.days=Number(value);if(field==='topicId')errorAnalysisView.topicId=value||'';renderQuestionAnalytics()}
function changePerformanceLimit(delta){performanceVisible+=Number(delta||0);renderQuestionAnalytics()}
function showAllPerformance(){performanceVisible=Number.MAX_SAFE_INTEGER;renderQuestionAnalytics()}
function resetPerformanceLimit(){performanceVisible=8;renderQuestionAnalytics()}
function showAllRetention(){retentionShowAll=true;renderTopicRetentionDashboard()}
function resetRetentionLimit(){retentionShowAll=false;renderTopicRetentionDashboard()}
function setRetentionFilter(field,value){if(field in retentionView)retentionView[field]=value;retentionShowAll=false;renderTopicRetentionDashboard()}
const listViewState={questionsVisible:10,simulationsVisible:5,sessionDaysVisible:5};
const LIST_VIEW_STEPS={questions:10,simulations:5,sessionDays:5};
const historyEditState={questionId:null,questionIsNew:false,simulationId:null,simulationIsNew:false,sessionId:null};
const historyEditDraft={question:null,simulation:null,session:null};
function cloneRecord(record){ return record?JSON.parse(JSON.stringify(record)):null; }
function isMobileHistoryLayout(){ return window.matchMedia('(max-width:760px)').matches; }

function renderListViewFooter(total,visible,step,showMoreAction,showLessAction,colspan,label){
  if(total<=step) return '';
  return `<tr class="list-view-footer"><td colspan="${colspan}"><div class="list-view-controls">
    <span class="list-view-count">Exibindo ${Math.min(visible,total)} de ${total} ${label}</span>
    ${visible<total?`<button class="btn ghost small" type="button" data-delegated-click="${showMoreAction}">Mostrar mais</button>`:''}
    ${visible>step?`<button class="btn ghost small" type="button" data-delegated-click="${showLessAction}">Mostrar menos</button>`:''}
  </div></td></tr>`;
}
function changeListLimit(key,delta,renderFn){
  const minimum=LIST_VIEW_STEPS[key];
  listViewState[`${key}Visible`]=Math.max(minimum,listViewState[`${key}Visible`]+delta);
  renderFn();
}

function emptyErrorBreakdown(){
  return Object.fromEntries(Object.keys(ERROR_CATEGORIES).map(key=>[key,0]));
}
function normalizeErrorBreakdown(question){
  const normalized=emptyErrorBreakdown();
  Object.keys(normalized).forEach(key=>{
    normalized[key]=Math.max(0,Math.floor(Number(question?.errorBreakdown?.[key])||0));
  });
  const realErrors=Math.max(0,(Number(question?.resolved)||0)-(Number(question?.correct)||0));
  let excess=Object.values(normalized).reduce((sum,value)=>sum+value,0)-realErrors;
  [...Object.keys(normalized)].reverse().forEach(key=>{
    if(excess<=0) return;
    const cut=Math.min(normalized[key],excess);
    normalized[key]-=cut;
    excess-=cut;
  });
  question.errorBreakdown=normalized;
  return normalized;
}
function validQuestionRecords(){
  return state.questoes.filter(q=>q.date&&(Number(q.resolved)||0)>0);
}
function accuracyFromCounts(correct,total){
  return total>0?Math.round((correct/total)*1000)/10:null;
}
function questionTopicOptions(question){
  return topicsForSelection(entitySubjectId(question),question.topicId);
}
function toggleQuestionErrors(id){
  if(openQuestionErrorIds.has(id)) openQuestionErrorIds.delete(id);
  else openQuestionErrorIds.add(id);
  renderQuestoes();
  renderQuestionAnalytics();
}
function questionCategorizedErrors(question){
  return Object.values(normalizeErrorBreakdown(question)).reduce((sum,value)=>sum+value,0);
}
function renderQuestionErrorFields(question){
  const realErrors=Math.max(0,(Number(question.resolved)||0)-(Number(question.correct)||0));
  const categorized=questionCategorizedErrors(question);
  return `
    <tr class="error-breakdown-row">
      <td colspan="8">
        <div class="error-breakdown-box">
          <div class="error-breakdown-head">
            <strong>Categorização opcional dos erros</strong>
            <span>${categorized} de ${realErrors} erros categorizados</span>
          </div>
          <div class="error-breakdown-grid">
            ${Object.entries(ERROR_CATEGORIES).map(([key,meta])=>`
              <label class="error-breakdown-field">
                <span>${meta.icon} ${meta.label}</span>
                <input type="number" min="0" max="${realErrors}" value="${question.errorBreakdown[key]||0}"
                  data-delegated-blur="updateQuestionError('${question.id}','${key}',this.value)">
              </label>
            `).join('')}
          </div>
          <small>As categorias não alteram a taxa de acerto; servem para diagnosticar a origem dos erros.</small>
        </div>
      </td>
    </tr>
  `;
}
function questionViewModel(q){
  const subjectId=entitySubjectId(q);
  return {date:q.date?formatDatePt(q.date):'Sem data',subject:getSubjectName(subjectId)||'Sem disciplina',topic:q.topicId?getTopicName(q.topicId):'Sem tópico',resolved:Number(q.resolved)||0,correct:Number(q.correct)||0,accuracy:calcAcertoPct(q.correct,q.resolved)};
}
function editQuestion(id){
  if(historyEditState.questionIsNew&&historyEditState.questionId!==id) state.questoes=state.questoes.filter(q=>q.id!==historyEditState.questionId);
  const question=state.questoes.find(q=>q.id===id); if(!question) return;
  if(historyEditState.questionId!==id) historyEditState.questionIsNew=false;
  historyEditState.questionId=id; historyEditDraft.question=cloneRecord(question); renderQuestoes();
}
function cancelQuestionEdit(){
  if(historyEditState.questionIsNew&&historyEditState.questionId) state.questoes=state.questoes.filter(q=>q.id!==historyEditState.questionId);
  historyEditState.questionId=null; historyEditState.questionIsNew=false; historyEditDraft.question=null; renderQuestoes();
}
function updateQuestionDraft(field,value){
  const draft=historyEditDraft.question; if(!draft) return;
  draft[field]=(field==='resolved'||field==='correct')?Math.max(0,Math.floor(Number(value)||0)):value;
  if(field==='subjectId'&&draft.topicId&&!topicsForSelection(value,draft.topicId).some(t=>t.id===draft.topicId)) draft.topicId=null;
  if(field==='subjectId') renderQuestoes();
}
function saveQuestionEdit(){
  const draft=historyEditDraft.question; if(!draft) return;
  draft.resolved=Math.max(0,Math.floor(Number(draft.resolved)||0));
  draft.correct=Math.max(0,Math.min(Math.floor(Number(draft.correct)||0),draft.resolved));
  normalizeErrorBreakdown(draft);
  const index=state.questoes.findIndex(q=>q.id===draft.id); if(index<0) return cancelQuestionEdit();
  state.questoes[index]=draft; historyEditState.questionId=null; historyEditState.questionIsNew=false; historyEditDraft.question=null; persistAndRender(); showToast('Registro atualizado.');
}
function renderQuestionReadRow(q){
  const vm=questionViewModel(q); const realErrors=Math.max(0,vm.resolved-vm.correct); const categorized=questionCategorizedErrors(q);
  if(isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${q.id}"><td colspan="8"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.topic)}</div></div><button class="btn ghost small" data-delegated-click="editQuestion('${q.id}')" aria-label="Editar registro">Editar</button></div><div class="mobile-card-metrics"><span>${vm.resolved} questões</span><span>${vm.correct} acertos</span><strong>${vm.accuracy}%</strong><button class="error-toggle-btn" data-delegated-click="toggleQuestionErrors('${q.id}')">Erros ${categorized}/${realErrors}</button></div></article></td></tr>${openQuestionErrorIds.has(q.id)?renderQuestionErrorFields(q):''}`;
  return `<tr class="history-read-row history-desktop-row" data-id="${q.id}"><td>${escapeHtml(vm.date)}</td><td><div class="row-primary">${escapeHtml(vm.subject)}</div></td><td><div class="row-secondary">${escapeHtml(vm.topic)}</div></td><td class="number-cell">${vm.resolved}</td><td class="number-cell">${vm.correct}</td><td class="number-cell">${vm.accuracy}%</td><td><button class="error-toggle-btn" data-delegated-click="toggleQuestionErrors('${q.id}')">${categorized}/${realErrors}</button></td><td><div class="row-actions"><button class="btn ghost small" data-delegated-click="editQuestion('${q.id}')">Editar</button></div></td></tr>${openQuestionErrorIds.has(q.id)?renderQuestionErrorFields(q):''}`;
}
function renderQuestionEditRow(q){
  const d=historyEditDraft.question; const subjectId=entitySubjectId(d); const topics=topicsForSelection(subjectId,d.topicId);
  return `<tr class="row-editing" data-id="${q.id}"><td colspan="8"><div class="inline-edit-form"><label>Data<input type="date" value="${d.date||''}" data-delegated-change="updateQuestionDraft('date',this.value)"></label><label>Disciplina<select data-delegated-change="updateQuestionDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map(s=>`<option value="${escapeAttr(s.id)}" ${s.id===subjectId?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select></label><label>Tópico<select data-delegated-change="updateQuestionDraft('topicId',this.value||null)"><option value="">Sem tópico</option>${topics.map(t=>`<option value="${escapeAttr(t.id)}" ${t.id===d.topicId?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}</select></label><label>Resolvidas<input type="number" min="0" value="${Number(d.resolved)||0}" data-delegated-input="updateQuestionDraft('resolved',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(d.correct)||0}" data-delegated-input="updateQuestionDraft('correct',this.value)"></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelQuestionEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveQuestionEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteQuestaoRow('${q.id}')">Excluir</button></div></div></td></tr>`;
}
function renderQuestoes(){
  const body=document.getElementById('questoesBody');
  const rows=[...state.questoes].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  if(rows.length===0){
    body.innerHTML=`<tr><td colspan="8"><div class="empty-state" style="border:none;">
      <p>Nenhuma sessão de questões registrada ainda.</p>
      <button class="btn small" data-delegated-click="addQuestaoRow()">+ Registrar sessão</button>
    </div></td></tr>`;
    return;
  }
  const visibleRows=rows.slice(0,listViewState.questionsVisible);
  body.innerHTML=visibleRows.map(q=>{ normalizeErrorBreakdown(q); return historyEditState.questionId===q.id?renderQuestionEditRow(q):renderQuestionReadRow(q); }).join('')+renderListViewFooter(rows.length,listViewState.questionsVisible,LIST_VIEW_STEPS.questions,
    "changeListLimit('questions',LIST_VIEW_STEPS.questions,renderQuestoes)",
    "changeListLimit('questions',-listViewState.questionsVisible,renderQuestoes)",8,'registros');
}
function addQuestaoRow(){
  listViewState.questionsVisible=LIST_VIEW_STEPS.questions;
  const question={id:uid('question'),date:todayISO(),subjectId:activeSubjects()[0]?.id||null,topicId:null,resolved:0,correct:0,errorBreakdown:emptyErrorBreakdown(),createdAt:nowISO()};
  state.questoes.push(question); historyEditState.questionId=question.id; historyEditState.questionIsNew=true; historyEditDraft.question=cloneRecord(question); renderQuestoes();
}
function deleteQuestaoRow(id){
  showConfirm('Excluir este registro de questões?',()=>{ state.questoes=state.questoes.filter(q=>q.id!==id); openQuestionErrorIds.delete(id); historyEditState.questionId=null; historyEditState.questionIsNew=false; historyEditDraft.question=null; persistAndRender(); showToast('Registro excluído.'); });
}
function updateQuestionSubject(id,subjectId){
  const question=state.questoes.find(q=>q.id===id);
  if(!question) return;
  question.subjectId=subjectId||null;
  if(question.topicId&&!questionTopicOptions(question).some(topic=>topic.id===question.topicId)) question.topicId=null;
  persistAndRender();
}
function updateQuestao(id,field,value){
  const question=state.questoes.find(q=>q.id===id);
  if(!question) return;
  question[field]=(field==='resolved'||field==='correct')?Math.max(0,Math.floor(Number(value)||0)):value;
  question.resolved=Math.max(0,Number(question.resolved)||0);
  if((Number(question.correct)||0)>question.resolved) showToast('Os acertos foram limitados ao total de questões.');
  question.correct=Math.max(0,Math.min(Number(question.correct)||0,question.resolved));
  normalizeErrorBreakdown(question);
  persistAndRender();
}
function updateQuestionError(id,key,value){
  const question=state.questoes.find(q=>q.id===id);
  if(!question||!ERROR_CATEGORIES[key]) return;
  normalizeErrorBreakdown(question);
  const realErrors=Math.max(0,(Number(question.resolved)||0)-(Number(question.correct)||0));
  const others=Object.entries(question.errorBreakdown).reduce((sum,[category,count])=>category===key?sum:sum+count,0);
  const requested=Math.max(0,Math.floor(Number(value)||0));
  const allowed=Math.max(0,realErrors-others);
  question.errorBreakdown[key]=Math.min(requested,allowed);
  if(requested>allowed) showToast('A categorização foi limitada ao total real de erros.');
  persistAndRender();
}

function performanceConfidence(total){
  if(total<MIN_WEEKLY_QUESTIONS) return {key:'insufficient',label:'Amostra insuficiente'};
  if(total<20) return {key:'low',label:'Confiança baixa'};
  if(total<50) return {key:'medium',label:'Confiança média'};
  return {key:'high',label:'Confiança alta'};
}
function classifyAccuracy(accuracy){
  if(accuracy===null) return {key:'none',icon:'⚪',label:'Sem dados'};
  const target=Math.max(0,Math.min(100,Number(state.metas?.metaAprovacao)||70));
  if(accuracy>=target) return {key:'strong',icon:'🟢',label:'Na meta'};
  if(accuracy>=target-10) return {key:'attention',icon:'🟡',label:'Atenção'};
  return {key:'weak',icon:'🔴',label:'Prioritário'};
}
function getTopicPerformance(topicId){
  const records=validQuestionRecords().filter(q=>q.topicId===topicId);
  const resolved=records.reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const correct=records.reduce((sum,q)=>sum+(Number(q.correct)||0),0);
  return {resolved,correct,accuracy:accuracyFromCounts(correct,resolved)};
}
function getSubjectTopicPerformance(subjectId){
  const subject=state.subjects.find(item=>item.id===subjectId);
  if(!subject) return [];
  return subject.topics.filter(topic=>!topic.archived).map(topic=>{
    const performance=getTopicPerformance(topic.id);
    return {...topic,...performance,confidence:performanceConfidence(performance.resolved),classification:classifyAccuracy(performance.accuracy)};
  }).sort((a,b)=>{
    if(a.accuracy===null) return 1;
    if(b.accuracy===null) return -1;
    return a.accuracy-b.accuracy;
  });
}
function getQuestionErrors(question){
  const breakdown=normalizeErrorBreakdown(question);
  const totalErrors=Math.max(0,(Number(question.resolved)||0)-(Number(question.correct)||0));
  const categorizedErrors=Object.values(breakdown).reduce((sum,value)=>sum+value,0);
  return {breakdown,totalErrors,categorizedErrors,uncategorized:Math.max(0,totalErrors-categorizedErrors)};
}
function buildErrorProfile(records){
  records.forEach(normalizeErrorBreakdown);
  return buildCognitiveProfile(records,Object.keys(ERROR_CATEGORIES));
}
function getSubjectErrorProfile(subjectId){
  return buildErrorProfile(validQuestionRecords().filter(question=>entitySubjectId(question)===subjectId));
}
function getTopicErrorProfile(topicId){
  return buildErrorProfile(validQuestionRecords().filter(question=>question.topicId===topicId));
}
function getSubjectPerformanceCounts(subjectId){
  let resolved=0,correct=0;
  state.questoes.filter(question=>entitySubjectId(question)===subjectId).forEach(question=>{
    resolved+=Number(question.resolved)||0;
    correct+=Number(question.correct)||0;
  });
  state.simulados.forEach(simulado=>(simulado.breakdown||[]).filter(item=>entitySubjectId(item)===subjectId).forEach(item=>{
    resolved+=Number(item.total)||0;
    correct+=Number(item.correct)||0;
  }));
  return {resolved,correct,accuracy:accuracyFromCounts(correct,resolved)};
}
function topicErrorRate(topicId,subjectId){
  const topicPerformance=getTopicPerformance(topicId);
  const subjectPerformance=getSubjectPerformanceCounts(subjectId);
  const topicRate=topicPerformance.accuracy===null?null:100-topicPerformance.accuracy;
  const subjectRate=subjectPerformance.accuracy===null?null:100-subjectPerformance.accuracy;
  if(topicRate===null||topicPerformance.resolved<10){
    return {rate:subjectRate,source:subjectRate===null?'none':'subject',topicWeight:0,topicPerformance,subjectPerformance};
  }
  if(subjectRate===null){
    return {rate:Math.round(topicRate*10)/10,source:'topic',topicWeight:1,topicPerformance,subjectPerformance};
  }
  const topicWeight=topicPerformance.resolved>=50?1:0.2+((topicPerformance.resolved-10)/40)*0.8;
  const rate=Math.round((topicRate*topicWeight+subjectRate*(1-topicWeight))*10)/10;
  return {rate,source:topicWeight===1?'topic':'blended',topicWeight,topicPerformance,subjectPerformance};
}
function getWeekRange(weeksAgo){
  const currentStart=startOfWeek(todayISO());
  const start=addDays(currentStart,-7*weeksAgo);
  return {start,end:addDays(start,6)};
}
function getSubjectPerformanceBetween(subjectId,start,end){
  const records=validQuestionRecords().filter(question=>entitySubjectId(question)===subjectId&&question.date>=start&&question.date<=end);
  const resolved=records.reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const correct=records.reduce((sum,q)=>sum+(Number(q.correct)||0),0);
  return {start,end,resolved,correct,accuracy:accuracyFromCounts(correct,resolved),insufficientData:resolved<MIN_WEEKLY_QUESTIONS};
}
function getSubjectWeeklyTrend(subjectId,weeks=8){
  return Array.from({length:weeks},(_,index)=>{
    const range=getWeekRange(weeks-1-index);
    return getSubjectPerformanceBetween(subjectId,range.start,range.end);
  });
}
function getTopicPerformanceBetween(topicId,start,end){
  const records=validQuestionRecords().filter(question=>question.topicId===topicId&&question.date>=start&&question.date<=end);
  const resolved=records.reduce((sum,question)=>sum+(Number(question.resolved)||0),0);
  const correct=records.reduce((sum,question)=>sum+(Number(question.correct)||0),0);
  return {start,end,resolved,correct,accuracy:accuracyFromCounts(correct,resolved),insufficientData:resolved<MIN_WEEKLY_QUESTIONS};
}
function getTopicWeeklyTrend(topicId,weeks=8){
  return Array.from({length:weeks},(_,index)=>{
    const range=getWeekRange(weeks-1-index);
    return getTopicPerformanceBetween(topicId,range.start,range.end);
  });
}
function calculateWeightedTrend(weeklyData,minWindow=MIN_TREND_WINDOW_QUESTIONS){
  return calculateWindowTrend(weeklyData,minWindow);
}
function topicLastActivityDate(topicId){
  let last=null;
  const bump=date=>{if(date&&(!last||date>last)) last=date;};
  state.topicHistory.filter(event=>event.topicId===topicId&&!['topic_archived','topic_restored'].includes(event.type)).forEach(event=>bump(eventLocalDate(event)));
  state.questoes.filter(question=>question.topicId===topicId).forEach(question=>bump(question.date));
  state.studySessions.filter(session=>session.topicId===topicId).forEach(session=>bump(session.date));
  state.calendar.filter(item=>item.topicId===topicId&&item.status==='Concluído').forEach(item=>bump(item.date));
  state.reviewAgenda.filter(item=>(item.topicId||item.topicRef)===topicId&&item.status==='Concluído').forEach(item=>bump(item.date));
  return last;
}
function pendingReviewForTopic(topicId){
  return state.reviewAgenda
    .filter(review=>(review.topicId||review.topicRef)===topicId&&review.status!=='Concluído')
    .sort((a,b)=>(a.date||'').localeCompare(b.date||''))[0]||null;
}
function dominantTopicError(profile){
  if(profile.categorizedErrors<MIN_ERROR_RECOMMENDATION_COUNT||profile.coverage<MIN_ERROR_RECOMMENDATION_COVERAGE) return null;
  const entries=Object.entries(profile.categories).sort((a,b)=>b[1]-a[1]);
  const top=entries[0];
  if(!top||top[1]<=0) return null;
  const share=Math.round(top[1]/profile.categorizedErrors*100);
  if(share<30) return null;
  return {key:top[0],count:top[1],share,meta:ERROR_CATEGORIES[top[0]],recommendation:ERROR_RECOMMENDATIONS[top[0]]};
}
function topicMasteryIndex(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found) return {score:0,confidence:0,confidenceLabel:'Baixa',classification:'Sem dados'};
  const performance=getTopicPerformance(topicId);
  const questionConfidence=Math.min(1,performance.resolved/50);
  const performanceScore=performance.accuracy===null?0:performance.accuracy*questionConfidence+40*(1-questionConfidence);
  const trend=calculateWeightedTrend(getTopicWeeklyTrend(topicId),MIN_TOPIC_TREND_WINDOW_QUESTIONS);
  let trendScore=50;
  if(trend.key==='up') trendScore=Math.min(100,70+Math.max(0,trend.delta||0)*2);
  else if(trend.key==='down') trendScore=Math.max(0,40-Math.abs(trend.delta||0)*2);
  else if(trend.key==='stable') trendScore=60;

  const today=todayISO();
  const reviews=state.reviewAgenda.filter(review=>(review.topicId||review.topicRef)===topicId&&review.date&&review.date<=today);
  const completedReviews=reviews.filter(review=>review.status==='Concluído').length;
  const reviewScore=reviews.length?completedReviews/reviews.length*100:(found.topic.status==='Concluído'?50:20);
  const cutoff=addDays(today,-29);
  const recentSessions=state.studySessions.filter(session=>session.topicId===topicId&&session.date>=cutoff&&session.date<=today);
  const recentSeconds=recentSessions.reduce((sum,session)=>sum+(Number(session.durationSeconds)||0),0);
  const studyScore=Math.min(100,recentSeconds/(2*3600)*100);
  const reviewConfidence=Math.min(1,reviews.length/4);
  const studyConfidence=Math.min(1,recentSessions.length/4);
  const confidence=Math.min(1,questionConfidence*0.6+reviewConfidence*0.2+studyConfidence*0.2);
  const confidenceScore=confidence*100;
  let score=Math.round(performanceScore*0.40+trendScore*0.20+reviewScore*0.15+studyScore*0.15+confidenceScore*0.10);
  const hasEvidence=performance.resolved>0||reviews.length>0||recentSeconds>0;
  if(!hasEvidence) score=0;
  score=Math.max(0,Math.min(100,score));
  const classification=score>=80?'Dominado':score>=60?'Em consolidação':score>=40?'Em desenvolvimento':'Inicial';
  return {score,confidence,confidenceLabel:confidence>=0.70?'Alta':confidence>=0.35?'Média':'Baixa',classification,performanceScore,trendScore,reviewScore,studyScore,trend};
}
function diagnoseTopic(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found) return null;
  const performance=getTopicPerformance(topicId);
  const mastery=topicMasteryIndex(subjectId,topicId);
  const effectiveError=topicErrorRate(topicId,subjectId);
  const trend=calculateWeightedTrend(getTopicWeeklyTrend(topicId),MIN_TOPIC_TREND_WINDOW_QUESTIONS);
  const errorProfile=getTopicErrorProfile(topicId);
  const dominantError=dominantTopicError(errorProfile);
  const lastActivity=topicLastActivityDate(topicId);
  const dateDistance=lastActivity?diasParaRevisao(lastActivity):null;
  const daysSinceStudy=dateDistance===null?0:Math.max(0,-dateDistance);
  const pendingReview=pendingReviewForTopic(topicId);
  const reviewDistance=pendingReview?.date?diasParaRevisao(pendingReview.date):null;
  const overdueDays=reviewDistance===null?0:Math.max(0,-reviewDistance);
  const target=Math.max(0,Math.min(100,Number(state.metas?.metaAprovacao)||70));
  const reliablePerformance=performance.resolved>=10&&performance.accuracy!==null;
  let status='Em dia';
  if(overdueDays>=7||(reliablePerformance&&performance.accuracy<target-15)||(trend.key==='down'&&reliablePerformance&&performance.accuracy<target)) status='Crítico';
  else if(overdueDays>0||(reliablePerformance&&performance.accuracy<target)||trend.key==='down'||daysSinceStudy>=7) status='Atenção';
  else if(!reliablePerformance||daysSinceStudy>=4) status='Acompanhamento';

  let recommendation=dominantError?.recommendation||null;
  if(!recommendation&&pendingReview&&reviewDistance!==null&&reviewDistance<=0) recommendation={action:'Concluir a revisão programada',studyType:'review',estimatedMinutes:25,questions:10};
  if(!recommendation&&found.topic.status==='Não iniciado') recommendation={action:'Estudar a teoria e registrar os pontos principais',studyType:'study',estimatedMinutes:35,questions:10};
  if(!recommendation&&reliablePerformance&&performance.accuracy<target) recommendation={action:'Resolver questões comentadas e revisar os erros',studyType:'questions',estimatedMinutes:40,questions:15};
  if(!recommendation) recommendation={action:found.topic.status==='Em andamento'?'Continuar o estudo do tópico':'Fazer uma revisão de manutenção',studyType:found.topic.status==='Em andamento'?'study':'review',estimatedMinutes:30,questions:10};

  const reasons=[];
  if(overdueDays>0) reasons.push('revisão atrasada '+overdueDays+'d');
  if(reliablePerformance&&performance.accuracy<target) reasons.push(performance.accuracy+'% de acerto');
  if(trend.key==='down') reasons.push('tendência em queda');
  if(daysSinceStudy>=7) reasons.push(daysSinceStudy+'d sem atividade');
  if(dominantError) reasons.push(dominantError.meta.label.toLowerCase()+' em '+dominantError.share+'% dos erros categorizados');
  if(reasons.length===0) reasons.push(reliablePerformance?'desempenho dentro do esperado':'amostra ainda pequena');

  return {
    subjectId,topicId,status,statusIcon:DIAGNOSIS_STATUS_ICON[status],performance,mastery,effectiveErrorRate:effectiveError.rate,
    performanceSource:effectiveError.source,trend,errorProfile,dominantError,lastActivity,daysSinceStudy,
    studySeconds:studyTimeByTopic(topicId),pendingReview,overdueDays,recommendation,reasons,
    summary:reasons.join(' · ')
  };
}
function renderQuestionAnalytics(){
  const select=document.getElementById('performanceSubjectSelect');
  if(!select) return;
  const subjects=activeSubjects();
  if(!subjects.some(subject=>subject.id===performanceSubjectId)){
    performanceSubjectId=subjects.find(subject=>validQuestionRecords().some(question=>entitySubjectId(question)===subject.id))?.id||subjects[0]?.id||null;
  }
  select.innerHTML=subjects.map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===performanceSubjectId?'selected':''}>${escapeHtml(subject.name)}</option>`).join('');
  const summary=document.getElementById('questionAnalyticsSummary');
  const bars=document.getElementById('topicPerformanceBars');
  const weeklyEl=document.getElementById('subjectWeeklyTrend');
  const profileEl=document.getElementById('subjectErrorProfile');
  const coverageEl=document.getElementById('questionDataCoverage');
  if(!performanceSubjectId){
    summary.innerHTML='';
    bars.innerHTML=weeklyEl.innerHTML=profileEl.innerHTML='<div class="empty-state"><p>Cadastre uma disciplina para iniciar a análise.</p></div>';
    coverageEl.textContent='0% identificadas';
    return;
  }
  const records=validQuestionRecords().filter(question=>entitySubjectId(question)===performanceSubjectId);
  const resolved=records.reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const correct=records.reduce((sum,q)=>sum+(Number(q.correct)||0),0);
  const identified=records.filter(q=>q.topicId).reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const coverage=resolved?Math.round(identified/resolved*100):0;
  const accuracy=accuracyFromCounts(correct,resolved);
  const weekly=getSubjectWeeklyTrend(performanceSubjectId);
  const trend=calculateWeightedTrend(weekly);
  coverageEl.textContent=`${coverage}% identificadas`;
  summary.innerHTML=[
    ['Questões analisadas',resolved],
    ['Taxa de acerto',accuracy===null?'—':`${accuracy}%`],
    ['Cobertura por tópico',`${coverage}%`],
    ['Tendência',`${trend.icon} ${trend.label}`]
  ].map(([label,value])=>`<div class="stat-cell"><div class="n">${value}</div><div class="l">${label}</div></div>`).join('');

  const topicPerformance=getSubjectTopicPerformance(performanceSubjectId);
  const mature=topicPerformance.filter(topic=>topic.resolved>=30),insufficient=topicPerformance.filter(topic=>topic.resolved>0&&topic.resolved<30);
  if(performanceViewMode==='with-data'&&!mature.length&&insufficient.length)performanceViewMode='insufficient';
  const filteredPerformance=performanceViewMode==='all'?topicPerformance:topicPerformance.filter(topic=>performanceViewMode==='without-data'?topic.resolved===0:performanceViewMode==='insufficient'?topic.resolved>0&&topic.resolved<30:topic.resolved>=30);
  const visiblePerformance=filteredPerformance.slice(0,performanceVisible);
  const performanceTabs=`<div class="analytics-view-tabs" role="group" aria-label="Filtrar desempenho por dados"><button class="btn small ${performanceViewMode==='with-data'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('with-data')">Com dados</button><button class="btn small ${performanceViewMode==='insufficient'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('insufficient')">Amostra insuficiente</button><button class="btn small ${performanceViewMode==='without-data'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('without-data')">Sem dados</button><button class="btn small ${performanceViewMode==='all'?'':'ghost'}" data-delegated-click="setPerformanceViewMode('all')">Todos</button></div>`;
  bars.innerHTML=performanceTabs+(filteredPerformance.length?visiblePerformance.map(topic=>{
    const width=topic.accuracy===null?0:topic.accuracy;
    return `<div class="performance-row">
      <div class="performance-name">${escapeHtml(topic.name)}<div class="performance-meta">${topic.resolved} questões · ${topic.confidence.label} · domínio ${topicMasteryIndex(performanceSubjectId,topic.id).score}/100</div></div>
      <div class="performance-track"><div class="performance-fill ${topic.classification.key}" style="width:${width}%"></div></div>
      <div class="performance-value">${topic.classification.icon} ${topic.accuracy===null?'—':topic.accuracy+'%'}</div>
    </div>`;
  }).join('')+renderCollectionFooter({variant:'block',total:filteredPerformance.length,visible:visiblePerformance.length,step:8,label:'tópicos',showMoreAction:'changePerformanceLimit(8)',showAllAction:'showAllPerformance()',showLessAction:performanceVisible>8?'resetPerformanceLimit()':''}):`<div class="empty-state empty-state--compact"><strong>${performanceViewMode==='with-data'?'Nenhum tópico possui amostra suficiente':'Nenhum tópico nesta categoria'}</strong><p>${performanceViewMode==='with-data'?'São necessárias pelo menos 30 questões por tópico para esta visualização.':'Altere o filtro para visualizar os demais tópicos.'}</p></div>`);

  weeklyEl.innerHTML=`<div class="trend-grid">${weekly.map(week=>`
    <div class="trend-week ${week.insufficientData?'insufficient':''}">
      <span>${formatDatePt(week.start).slice(0,5)}</span>
      <strong>${week.insufficientData?'—':week.accuracy+'%'}</strong>
      <small>${week.resolved} questões</small>
    </div>`).join('')}</div>
    <div class="trend-summary ${trend.key}">${trend.icon} ${trend.label}${trend.delta===null?'':` · ${trend.delta>0?'+':''}${trend.delta.toFixed(1)} p.p.`}</div>`;

  const subjectTopics=activeTopics().filter(topic=>topic.subjectId===performanceSubjectId);
  if(errorAnalysisView.topicId&&!subjectTopics.some(topic=>topic.id===errorAnalysisView.topicId))errorAnalysisView.topicId='';
  const currentStart=addDays(todayISO(),-(errorAnalysisView.days-1)),previousEnd=addDays(currentStart,-1),previousStart=addDays(previousEnd,-(errorAnalysisView.days-1));
  const scopedRecords=validQuestionRecords().filter(question=>entitySubjectId(question)===performanceSubjectId&&(!errorAnalysisView.topicId||question.topicId===errorAnalysisView.topicId));
  const profile=buildErrorProfile(scopedRecords.filter(question=>question.date>=currentStart&&question.date<=todayISO()));
  const previousProfile=buildErrorProfile(scopedRecords.filter(question=>question.date>=previousStart&&question.date<=previousEnd));
  const errorToolbar=`<div class="error-analysis-toolbar"><select aria-label="Período do perfil de erros" data-delegated-change="setErrorAnalysisFilter('days',this.value)">${[7,30,60,90].map(days=>`<option value="${days}" ${errorAnalysisView.days===days?'selected':''}>Últimos ${days} dias</option>`).join('')}</select><select aria-label="Tópico do perfil de erros" data-delegated-change="setErrorAnalysisFilter('topicId',this.value)"><option value="">Todos os tópicos</option>${subjectTopics.map(topic=>`<option value="${escapeAttr(topic.id)}" ${errorAnalysisView.topicId===topic.id?'selected':''}>${escapeHtml(topic.name)}</option>`).join('')}</select></div>`;
  if(profile.totalErrors===0){
    profileEl.innerHTML=errorToolbar+'<div class="empty-state"><p>Nenhum erro registrado neste recorte.</p></div>';
  }else{
    const items=[...Object.entries(ERROR_CATEGORIES).map(([key,meta])=>({label:`${meta.icon} ${meta.label}`,value:profile.categories[key],previous:previousProfile.categories[key]})),{label:'Sem categoria',value:profile.uncategorized,previous:previousProfile.uncategorized}];
    profileEl.innerHTML=errorToolbar+`<div class="error-profile-grid">${items.map(item=>{const delta=item.value-item.previous;return `<div class="error-profile-item"><span>${item.label}</span><strong>${item.value}</strong><small>${previousProfile.totalErrors?`${delta>=0?'+':''}${delta} vs. período anterior`:'Sem período anterior'}</small></div>`}).join('')}</div>
      <div class="analytics-note">${profile.coverage}% dos ${profile.totalErrors} erros estão categorizados · confiança ${profile.confidence.label.toLowerCase()} · ${formatDatePt(currentStart)} a ${formatDatePt(todayISO())}.</div>`;
  }
}

function simuladoEffectiveCounts(sim){
  if(sim.breakdown && sim.breakdown.length > 0){
    const correct = sim.breakdown.reduce((s,b)=>s+(Number(b.correct)||0),0);
    const total = sim.breakdown.reduce((s,b)=>s+(Number(b.total)||0),0);
    return { correct, total };
  }
  return { correct: Number(sim.correct)||0, total: Number(sim.total)||0 };
}
function simuladoNota(sim){
  const { correct, total } = simuladoEffectiveCounts(sim);
  return calcAcertoPct(correct, total);
}

let openBreakdownIds = new Set();
function toggleBreakdown(simuladoId){
  if(openBreakdownIds.has(simuladoId)) openBreakdownIds.delete(simuladoId);
  else openBreakdownIds.add(simuladoId);
  renderSimulados();
}
function addBreakdownRow(simuladoId){
  const sim = state.simulados.find(s=>s.id===simuladoId);
  if(!sim.breakdown) sim.breakdown = [];
  sim.breakdown.push({ id: uid('breakdown'), subjectId:activeSubjects()[0]?.id || null, correct: 0, total: 0 });
  persistAndRender();
}
function updateBreakdownRow(simuladoId, breakdownId, field, value){
  const sim = state.simulados.find(s=>s.id===simuladoId);
  const b = sim.breakdown.find(x=>x.id===breakdownId);
  b[field] = (field==='correct'||field==='total') ? Number(value)||0 : value;
  b.total = Math.max(0, Number(b.total)||0);
  if((Number(b.correct)||0) > b.total) showToast('Os acertos foram limitados ao total de questões.');
  b.correct = Math.max(0, Math.min(Number(b.correct)||0, b.total));
  persistAndRender();
}
function deleteBreakdownRow(simuladoId, breakdownId){
  const sim = state.simulados.find(s=>s.id===simuladoId);
  sim.breakdown = sim.breakdown.filter(x=>x.id!==breakdownId);
  persistAndRender();
}

function simulationViewModel(sim){ const counts=simuladoEffectiveCounts(sim); return {date:sim.date?formatDatePt(sim.date):'Sem data',name:sim.nome||'Simulado sem nome',correct:counts.correct,total:counts.total,score:simuladoNota(sim)}; }
function editSimulation(id){ if(historyEditState.simulationIsNew&&historyEditState.simulationId!==id) state.simulados=state.simulados.filter(s=>s.id!==historyEditState.simulationId); const sim=state.simulados.find(s=>s.id===id); if(!sim) return; if(historyEditState.simulationId!==id) historyEditState.simulationIsNew=false; historyEditState.simulationId=id; historyEditDraft.simulation=cloneRecord(sim); renderSimulados(); }
function cancelSimulationEdit(){ if(historyEditState.simulationIsNew&&historyEditState.simulationId) state.simulados=state.simulados.filter(s=>s.id!==historyEditState.simulationId); historyEditState.simulationId=null; historyEditState.simulationIsNew=false; historyEditDraft.simulation=null; renderSimulados(); }
function updateSimulationDraft(field,value){ const d=historyEditDraft.simulation; if(!d) return; d[field]=(field==='correct'||field==='total')?Math.max(0,Math.floor(Number(value)||0)):value; }
function saveSimulationEdit(){
  const d=historyEditDraft.simulation; if(!d) return;
  d.total=Math.max(0,Math.floor(Number(d.total)||0)); d.correct=Math.max(0,Math.min(Math.floor(Number(d.correct)||0),d.total));
  const index=state.simulados.findIndex(s=>s.id===d.id); if(index<0) return cancelSimulationEdit();
  state.simulados[index]=d; historyEditState.simulationId=null; historyEditState.simulationIsNew=false; historyEditDraft.simulation=null; persistAndRender(); showToast('Simulado atualizado.');
}
function renderSimulationReadRow(sim){
  const vm=simulationViewModel(sim); const hasBreakdown=sim.breakdown&&sim.breakdown.length>0;
  const details=`<button class="btn ghost small ${hasBreakdown?'has-notes':''}" data-delegated-click="toggleBreakdown('${sim.id}')">${openBreakdownIds.has(sim.id)?'Ocultar detalhes':'Ver desempenho'}</button>`;
  if(isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${sim.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)}</div><div class="mobile-card-title">${escapeHtml(vm.name)}</div></div><button class="btn ghost small" data-delegated-click="editSimulation('${sim.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${vm.correct} / ${vm.total}</span><strong>Nota ${vm.score}%</strong>${details}</div></article></td></tr>${openBreakdownIds.has(sim.id)?renderSimulationBreakdown(sim):''}`;
  return `<tr class="history-read-row history-desktop-row" data-id="${sim.id}"><td>${escapeHtml(vm.date)}</td><td><div class="row-primary">${escapeHtml(vm.name)}</div></td><td class="number-cell">${vm.correct}</td><td class="number-cell">${vm.total}</td><td class="number-cell">${vm.score}%</td><td>${details}</td><td><button class="btn ghost small" data-delegated-click="editSimulation('${sim.id}')">Editar</button></td></tr>${openBreakdownIds.has(sim.id)?renderSimulationBreakdown(sim):''}`;
}
function renderSimulationBreakdown(sim){
  return `<tr class="breakdown-row"><td colspan="7"><div class="breakdown-box"><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink-soft);margin-bottom:8px;">Nota por disciplina neste simulado — a nota geral é calculada automaticamente por aqui.</div>${(sim.breakdown||[]).map(b=>`<div class="breakdown-line"><select data-delegated-change="updateBreakdownRow('${sim.id}','${b.id}','subjectId',this.value)"><option value="">—</option>${subjectsForSelection(entitySubjectId(b)).map(s=>`<option value="${escapeAttr(s.id)}" ${s.id===entitySubjectId(b)?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select><input type="number" min="0" value="${b.correct||0}" placeholder="Acertos" data-delegated-blur="updateBreakdownRow('${sim.id}','${b.id}','correct',this.value)"><input type="number" min="0" value="${b.total||0}" placeholder="Total" data-delegated-blur="updateBreakdownRow('${sim.id}','${b.id}','total',this.value)"><button class="icon-btn" data-delegated-click="deleteBreakdownRow('${sim.id}','${b.id}')">✕</button></div>`).join('')}<button class="btn ghost small breakdown-add-btn" data-delegated-click="addBreakdownRow('${sim.id}')">+ Adicionar disciplina</button></div></td></tr>`;
}
function renderSimulationEditRow(sim){ const d=historyEditDraft.simulation; const hasBreakdown=d.breakdown&&d.breakdown.length>0; return `<tr class="row-editing" data-id="${sim.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${d.date||''}" data-delegated-change="updateSimulationDraft('date',this.value)"></label><label>Nome<input type="text" value="${escapeAttr(d.nome||'')}" data-delegated-input="updateSimulationDraft('nome',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(d.correct)||0}" ${hasBreakdown?'disabled':''} data-delegated-input="updateSimulationDraft('correct',this.value)"></label><label>Total<input type="number" min="0" value="${Number(d.total)||0}" ${hasBreakdown?'disabled':''} data-delegated-input="updateSimulationDraft('total',this.value)"></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelSimulationEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveSimulationEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteSimuladoRow('${sim.id}')">Excluir</button></div></div></td></tr>`; }

function renderSimulados(){
  const body = document.getElementById('simuladosBody');
  const rows = [...state.simulados].sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  if(rows.length === 0){
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="border:none;">
      <p>Nenhum simulado registrado ainda.</p>
      <button class="btn small" data-delegated-click="addSimuladoRow()">+ Registrar simulado</button>
    </div></td></tr>`;
    return;
  }
  const visibleRows=rows.slice(0,listViewState.simulationsVisible);
  body.innerHTML = visibleRows.map(sim=>historyEditState.simulationId===sim.id?renderSimulationEditRow(sim):renderSimulationReadRow(sim)).join('')+renderListViewFooter(rows.length,listViewState.simulationsVisible,LIST_VIEW_STEPS.simulations,
    "changeListLimit('simulations',LIST_VIEW_STEPS.simulations,renderSimulados)",
    "changeListLimit('simulations',-listViewState.simulationsVisible,renderSimulados)",7,'simulados');
}
function addSimuladoRow(){
  listViewState.simulationsVisible=LIST_VIEW_STEPS.simulations;
  const sim={id:uid('simulado'),date:todayISO(),nome:'',correct:0,total:0,breakdown:[],createdAt:nowISO()}; state.simulados.push(sim); historyEditState.simulationId=sim.id; historyEditState.simulationIsNew=true; historyEditDraft.simulation=cloneRecord(sim); renderSimulados();
}
function deleteSimuladoRow(id){
  showConfirm('Excluir este simulado?',()=>{ state.simulados=state.simulados.filter(s=>s.id!==id); openBreakdownIds.delete(id); historyEditState.simulationId=null; historyEditState.simulationIsNew=false; historyEditDraft.simulation=null; persistAndRender(); showToast('Simulado excluído.'); });
}
function updateSimulado(id, field, value){
  const sim = state.simulados.find(x=>x.id===id);
  sim[field] = (field==='correct'||field==='total') ? Number(value)||0 : value;
  sim.total = Math.max(0, Number(sim.total)||0);
  if((Number(sim.correct)||0) > sim.total) showToast('Os acertos foram limitados ao total do simulado.');
  sim.correct = Math.max(0, Math.min(Number(sim.correct)||0, sim.total));
  persistAndRender();
}

document.getElementById('addQuestaoRowBtn').addEventListener('click', addQuestaoRow);
document.getElementById('addSimuladoRowBtn').addEventListener('click', addSimuladoRow);

/* ===== METAS ===== */
const WEEKDAY_LABELS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function metaHoursForDate(date=todayISO()){
  const parsed=parseLocalDate(date);
  const day=parsed?parsed.getDay():new Date().getDay();
  return Math.max(0,Number(state.metas?.horasPorDia?.[String(day)]??state.metas?.horasDiarias)||0);
}
function metaHoursToday(){return metaHoursForDate(todayISO());}
function updateMetaHoursDay(day,value){
  studyPlanPreview=null;
  state.metas.horasPorDia[String(day)]=Math.max(0,Number(value)||0);
  if(Number(day)===parseLocalDate(todayISO()).getDay()) state.metas.horasDiarias=state.metas.horasPorDia[String(day)];
  persistAndRender();
}
function applyTodayGoalToAllDays(){
  const value=metaHoursToday();
  WEEKDAY_LABELS.forEach((_,day)=>{state.metas.horasPorDia[String(day)]=value});
  state.metas.horasDiarias=value;
  persistAndRender();
  showToast(`Meta de ${value}h aplicada a todos os dias.`);
}
function clearWeekendGoals(){
  state.metas.horasPorDia['0']=0;
  state.metas.horasPorDia['6']=0;
  persistAndRender();
  showToast('Metas do fim de semana removidas.');
}
function renderWeeklyHoursGoals(){
  const container=document.getElementById('weeklyHoursGoals');
  if(!container) return;
  const todayDay=parseLocalDate(todayISO()).getDay();
  container.innerHTML='<div class="weekday-goal-actions"><button class="btn ghost small" data-delegated-click="applyTodayGoalToAllDays()">Aplicar meta de hoje a todos</button><button class="btn ghost small" data-delegated-click="clearWeekendGoals()">Limpar fim de semana</button></div><div class="weekday-goals">'+WEEKDAY_LABELS.map((label,day)=>
    '<label class="weekday-goal '+(day===todayDay?'today':'')+'"><span>'+label+(day===todayDay?' · hoje':'')+'</span><input type="number" min="0" step="0.25" value="'+metaHoursForDate(addDays(startOfWeek(todayISO()),day===0?6:day-1))+'" data-delegated-blur="updateMetaHoursDay('+day+',this.value)" aria-label="Meta de horas de '+label+'"></label>'
  ).join('')+'</div>';
}

function contarTopicosConcluidosNoPeriodo(pred){
  const ids=new Set();
  topicCompletionEvents().forEach(event=>{
    const date=eventLocalDate(event);
    if(date&&pred(date)&&event.topicId) ids.add(event.topicId);
  });
  return ids.size;
}
function somarQuestoesNaSemana(){
  return state.questoes.filter(q=>isSameWeek(q.date)).reduce((sum,q)=> sum + (Number(q.resolved)||0), 0);
}
function contarSimuladosNaSemana(){
  return state.simulados.filter(s=>isSameWeek(s.date)).length;
}

function renderMetas(){
  const m = state.metas;
  const atingidoSemanal = contarTopicosConcluidosNoPeriodo(isSameWeek);
  const atingidoMensal = contarTopicosConcluidosNoPeriodo(isSameMonth);
  const atingidoQuestoes = somarQuestoesNaSemana();
  const atingidoSimulados = contarSimuladosNaSemana();

  const cards = [
    { key:'semanal', label:'Meta Semanal', desc:'Tópicos concluídos esta semana', atingido: atingidoSemanal, meta: m.semanal },
    { key:'mensal', label:'Meta Mensal', desc:'Tópicos concluídos este mês', atingido: atingidoMensal, meta: m.mensal },
    { key:'questoesSemanal', label:'Meta de Questões', desc:'Questões resolvidas esta semana', atingido: atingidoQuestoes, meta: m.questoesSemanal },
    { key:'simuladosSemanal', label:'Meta de Simulados', desc:'Simulados feitos esta semana', atingido: atingidoSimulados, meta: m.simuladosSemanal }
  ];

  document.getElementById('metasContainer').innerHTML = cards.map(c => {
    const pct = c.meta > 0 ? Math.round((c.atingido/c.meta)*100) : 0;
    const pctDisplay = Math.min(pct, 100);
    return `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">${c.label}</div>
        <div class="meta-formula">=Atingido/Meta · ${escapeHtml(c.desc)}</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${pct>=100?'over':''}" style="width:${pctDisplay}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>${c.atingido} / ${c.meta}</span>
          <span>${pct}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="0" value="${c.meta}" data-delegated-blur="updateMeta('${c.key}', this.value)">
      </div>
    </div>`;
  }).join('') + `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">Meta de Aprovação</div>
        <div class="meta-formula">Taxa de acerto alvo em questões e simulados</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${taxaAcertoGeral()>=state.metas.metaAprovacao?'over':''}" style="width:${Math.min(taxaAcertoGeral(),100)}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>Atual: ${taxaAcertoGeral()}%</span>
          <span>Meta: ${state.metas.metaAprovacao}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="0" max="100" value="${state.metas.metaAprovacao}" data-delegated-blur="updateMeta('metaAprovacao', this.value)">%
      </div>
    </div>`;
}

function updateMeta(key, value){
  state.metas[key] = Number(value) || 0;
  persistAndRender();
}

function renderExamBlueprintConfig(){
  const container=document.getElementById('examBlueprintConfig');if(!container)return;
  const blueprint=state.examBlueprint;
  const rows=activeSubjects().map(subject=>{
    const config=blueprint.subjects.find(item=>item.subjectId===subject.id);
    return `<div class="exam-subject-row"><strong>${escapeHtml(subject.name)}</strong><label>Questões esperadas<input type="number" min="0" step="1" value="${config?.expectedQuestions??''}" placeholder="Não definido" data-delegated-blur="updateExamSubject('${subject.id}','expectedQuestions',this.value)"></label><label>Peso por questão<input type="number" min="0.1" step="0.1" value="${config?.questionWeight??''}" placeholder="1" data-delegated-blur="updateExamSubject('${subject.id}','questionWeight',this.value)"></label><label>Prioridade<select data-delegated-change="updateExamSubject('${subject.id}','priority',this.value)"><option value="normal" ${!config||config.priority==='normal'?'selected':''}>Normal</option><option value="high" ${config?.priority==='high'?'selected':''}>Alta</option><option value="low" ${config?.priority==='low'?'selected':''}>Baixa</option></select></label></div>`;
  }).join('');
  container.innerHTML=`<div class="exam-blueprint-main"><label>Data da prova<input type="date" value="${escapeAttr(blueprint.examDate||'')}" data-delegated-change="updateExamBlueprint('examDate',this.value)"></label><label>Nota-alvo (%)<input type="number" min="0" max="100" value="${blueprint.targetScore}" data-delegated-blur="updateExamBlueprint('targetScore',this.value)"></label></div><div class="exam-subject-list">${rows||'<p class="diagnosis-empty">Cadastre disciplinas para configurar o peso no edital.</p>'}</div>`;
}
let studyPlanPreview=null,dailyPlanPreview=null;
function studyPlanCandidates(){
  return activeTopics().filter(topic=>topic.status!=='Concluído').map(topic=>{
    const mastery=topicMasteryIndex(topic.subjectId,topic.id),retention=topicRetentionScore(topic.subjectId,topic.id),blueprint=state.examBlueprint.subjects.find(item=>item.subjectId===topic.subjectId);
    const examImpact=topic.examImportance!=null?topic.examImportance*100:blueprint?Math.min(100,blueprint.expectedQuestions*4*blueprint.questionWeight):null;
    return {id:topic.id,subjectId:topic.subjectId,subjectName:topic.subjectName,topicName:topic.name,archived:topic.topicArchived||topic.subjectArchived,completed:false,estimatedMinutes:topic.estimatedStudyMinutes,examImpact,masteryGap:mastery.confidence>0?100-mastery.score:null,retentionNeed:retention.available?100-retention.score:null};
  });
}
function calculateStudyPlanPreview(){
  const days=state.examDate?diasParaRevisao(state.examDate):null;
  const weeklyAvailableMinutes=Object.values(state.metas.horasPorDia).reduce((sum,hours)=>sum+Math.max(0,Number(hours)||0)*60,0);
  studyPlanPreview=buildStudyPlan({topics:studyPlanCandidates(),weeklyAvailableMinutes,weeksUntilExam:days===null?0:Math.max(0,days/7)});
  renderStudyPlanBuilder();
}
function clearStudyPlanPreview(){studyPlanPreview=null;renderStudyPlanBuilder()}
function confirmStudyPlan(){
  if(!studyPlanPreview||studyPlanPreview.state==='insufficient'||!studyPlanPreview.items.length)return;
  const confirmedAt=nowISO(),id=uid('study-plan'),plan=structuredCloneSafe(studyPlanPreview);
  plan.items=plan.items.map(item=>({...item,id:uid('study-plan-item'),topicId:item.topicId||item.id,studyPlanId:id}));
  state.studyPlans.push({...plan,id,confirmedAt,examDate:state.examDate||null,algorithmVersion:state.algorithmVersions.recommendations,dailyPlanOperations:[]});studyPlanPreview=null;dailyPlanPreview=null;scheduleSave();renderStudyPlanBuilder();showToast('Plano semanal confirmado e salvo.')
}
function latestStudyPlan(){return [...state.studyPlans].sort((a,b)=>(b.confirmedAt||'').localeCompare(a.confirmedAt||''))[0]||null}
function calculateDailyPlanPreview(){
  const studyPlan=latestStudyPlan();if(!studyPlan)return;
  const days=Array.from({length:7},(_,index)=>{const date=addDays(todayISO(),index);return {date,availableMinutes:Math.round(metaHoursForDate(date)*60)}}),end=days.at(-1).date;
  const dueReviews=state.reviewAgenda.filter(review=>review.status!=='Concluído'&&review.topicId&&review.date>=todayISO()&&review.date<=end).map(review=>({id:review.id,date:review.date,subjectId:review.subjectId,topicId:review.topicId,subjectName:getSubjectName(review.subjectId),topicName:getTopicName(review.topicId),minutes:25}));
  dailyPlanPreview=buildDailyPlanProposal({studyPlan,existingPlans:state.dailyPlans,days,dueReviews,reserveRatio:.1});renderStudyPlanBuilder();
}
function clearDailyPlanPreview(){dailyPlanPreview=null;renderStudyPlanBuilder()}
function confirmDailyPlanPreview(){
  if(dailyPlanPreview?.state!=='proposal')return;const studyPlan=latestStudyPlan(),operationId=uid('daily-plan-operation'),createdAt=nowISO(),result=applyDailyPlanProposal({dailyPlans:state.dailyPlans,proposal:dailyPlanPreview,operationId,now:createdAt,idGenerator:uid});
  studyPlan.dailyPlanOperations=Array.isArray(studyPlan.dailyPlanOperations)?studyPlan.dailyPlanOperations:[];studyPlan.dailyPlanOperations.push({id:operationId,createdAt,createdItems:result.createdItems,undoneAt:null});dailyPlanPreview=null;scheduleSave();renderStudyPlanBuilder();showToast(`${pluralize(result.createdItems,'atividade')} criada${result.createdItems===1?'':'s'} no plano diário.`)
}
function undoLatestDailyPlanGeneration(){
  const studyPlan=latestStudyPlan(),operation=[...(studyPlan?.dailyPlanOperations||[])].reverse().find(item=>!item.undoneAt);if(!operation)return;const result=undoDailyPlanGeneration({dailyPlans:state.dailyPlans,operationId:operation.id});
  operation.undoneAt=result.complete?nowISO():null;operation.protectedItems=result.protectedItems;scheduleSave();renderStudyPlanBuilder();renderPlanoHoje();showToast(result.protectedItems.length?`${pluralize(result.removedItems,'atividade')} removida${result.removedItems===1?'':'s'}; itens executados foram preservados.`:'Criação dos planos diários desfeita.')
}
function renderStudyPlanBuilder(){
  const container=document.getElementById('examStudyPlan');if(!container)return;
  const latest=latestStudyPlan();
  if(!studyPlanPreview){
    if(dailyPlanPreview){const proposal=dailyPlanPreview,rows=proposal.days.map(day=>`<div><strong>${formatDatePt(day.date)}</strong><span>${formatPlanMinutes(day.plannedMinutes)} planejados · ${formatPlanMinutes(day.flexMinutes)} livres · ${day.items.length} atividades</span></div>`).join('');container.innerHTML=`<div class="study-plan-summary"><div><strong>${formatPlanMinutes(proposal.plannedMinutes)}</strong><span>Distribuição proposta</span></div><div><strong>${proposal.days.length}</strong><span>Dias utilizados</span></div><div><strong>${formatPlanMinutes(proposal.unallocatedMinutes)}</strong><span>Não alocados</span></div><div><strong>10%</strong><span>Reserva mínima</span></div></div>${proposal.state==='proposal'?`<div class="replan-allocations">${rows}</div><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmDailyPlanPreview()">Confirmar planos diários</button><button class="btn ghost" data-delegated-click="clearDailyPlanPreview()">Cancelar</button></div>`:`<div class="upcoming-empty">${escapeHtml(proposal.reason)}</div><button class="btn ghost small" data-delegated-click="clearDailyPlanPreview()">Fechar</button>`}`;return}
    const activeOperation=[...(latest?.dailyPlanOperations||[])].reverse().find(item=>!item.undoneAt);
    container.innerHTML=`${latest?`<div class="confirmed-plan-note"><strong>Plano confirmado</strong><span>${new Date(latest.confirmedAt).toLocaleString('pt-BR')} · ${formatPlanMinutes(latest.weeklyPlannedMinutes)} por semana · prova em ${latest.examDate?formatDatePt(latest.examDate):'data não definida'}</span></div>`:''}<div class="study-plan-actions"><button class="btn" data-delegated-click="calculateStudyPlanPreview()">Calcular proposta semanal</button>${latest?'<button class="btn ghost" data-delegated-click="calculateDailyPlanPreview()">Distribuir nos próximos 7 dias</button>':''}${activeOperation?'<button class="btn ghost" data-delegated-click="undoLatestDailyPlanGeneration()">Desfazer última distribuição</button>':''}</div>`;return
  }
  const plan=studyPlanPreview;
  if(plan.state==='insufficient'){container.innerHTML=`<div class="upcoming-empty">Não foi possível montar o plano. Defina a data da prova, disponibilidade semanal e esforço de pelo menos um tópico.</div><button class="btn ghost small" data-delegated-click="clearStudyPlanPreview()">Fechar</button>`;return}
  const subjectRows=plan.subjects.map(item=>`<div><strong>${escapeHtml(item.subjectName)}</strong><span>${formatPlanMinutes(item.minutes)} por semana</span></div>`).join('');
  const topicRows=plan.items.slice(0,8).map(item=>`<div class="study-plan-topic"><span><strong>${escapeHtml(item.subjectName)}</strong> — ${escapeHtml(item.topicName)}</span><span>${formatPlanMinutes(item.minutes)} · teoria ${formatPlanMinutes(item.activityMix.theory)} · questões ${formatPlanMinutes(item.activityMix.questions)} · revisões ${formatPlanMinutes(item.activityMix.reviews)}</span></div>`).join('');
  container.innerHTML=`<div class="study-plan-summary"><div><strong>${formatPlanMinutes(plan.weeklyAvailableMinutes)}</strong><span>Disponibilidade semanal</span></div><div><strong>${formatPlanMinutes(plan.remainingMinutes)}</strong><span>Carga pendente configurada</span></div><div><strong>${plan.weeksUntilExam}</strong><span>Semanas até a prova</span></div><div><strong>${formatPlanMinutes(plan.weeklyPlannedMinutes)}</strong><span>Proposta semanal</span></div></div><div class="study-plan-confidence">Confiança ${plan.confidenceLabel.toLowerCase()} · ${Math.round(plan.confidence*100)}% dos dados estratégicos disponíveis${plan.missingEffort.length?` · ${plan.missingEffort.length} tópico${plan.missingEffort.length===1?'':'s'} sem esforço estimado`:''}</div><div class="study-plan-subjects">${subjectRows}</div><details class="study-plan-details"><summary>Ver divisão por tópico e atividade</summary>${topicRows}</details><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmStudyPlan()">Confirmar e salvar plano</button><button class="btn ghost" data-delegated-click="clearStudyPlanPreview()">Descartar proposta</button></div>`;
}
function updateExamBlueprint(field,value){
  studyPlanPreview=null;
  if(field==='examDate'){state.examBlueprint.examDate=value||null;state.examDate=value||''}
  if(field==='targetScore'){const target=Math.max(0,Math.min(100,Number(value)||0));state.examBlueprint.targetScore=target;state.metas.metaAprovacao=target}
  state.examBlueprint.configuredAt=nowISO();persistAndRender();
}
function updateExamSubject(subjectId,field,value){
  studyPlanPreview=null;
  let config=state.examBlueprint.subjects.find(item=>item.subjectId===subjectId);
  if(!config){config={subjectId,expectedQuestions:0,questionWeight:1,priority:'normal'};state.examBlueprint.subjects.push(config)}
  if(field==='expectedQuestions')config.expectedQuestions=Math.max(0,Math.round(Number(value)||0));
  if(field==='questionWeight')config.questionWeight=Math.max(.1,Number(value)||1);
  if(field==='priority'&&EXAM_PRIORITIES.includes(value))config.priority=value;
  state.examBlueprint.configuredAt=nowISO();persistAndRender();
}

/* ===== METAS POR DISCIPLINA ===== */
function somarQuestoesDisciplinaNaSemana(subjectId){
  return state.questoes
    .filter(q => entitySubjectId(q) === subjectId && isSameWeek(q.date))
    .reduce((sum,q)=> sum + (Number(q.resolved)||0), 0);
}
function renderMetasPorDisciplina(){
  const sel = document.getElementById('novaMetaDisciplinaSelect');
  const current = sel.value;
  sel.innerHTML = activeSubjects().map(s=>`<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join('')
    || `<option value="">Nenhuma disciplina cadastrada</option>`;
  if(current) sel.value = current;

  const container = document.getElementById('metasPorDisciplinaContainer');
  if(state.metasPorDisciplina.length === 0){
    container.innerHTML = `<div class="upcoming-empty">Nenhuma meta por disciplina ainda. Escolha uma disciplina acima e adicione.</div>`;
    return;
  }
  container.innerHTML = state.metasPorDisciplina.map(md => {
    const subjectId = entitySubjectId(md);
    const atingido = somarQuestoesDisciplinaNaSemana(subjectId);
    const pct = md.meta > 0 ? Math.round((atingido/md.meta)*100) : 0;
    const pctDisplay = Math.min(pct, 100);
    return `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">${escapeHtml(subjectId ? getSubjectName(subjectId) : '(sem disciplina)')}</div>
        <div class="meta-formula">Questões resolvidas nesta semana</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${pct>=100?'over':''}" style="width:${pctDisplay}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>${atingido} / ${md.meta}</span>
          <span>${pct}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="1" value="${md.meta}" data-delegated-blur="updateMetaDisciplina('${md.id}', this.value)">
        <button class="icon-btn" data-delegated-click="deleteMetaDisciplina('${md.id}')" title="Remover">✕</button>
      </div>
    </div>`;
  }).join('');
}
function addMetaDisciplina(){
  const subjectId = document.getElementById('novaMetaDisciplinaSelect').value;
  const meta = Number(document.getElementById('novaMetaDisciplinaValor').value) || 20;
  if(!subjectId){ showToast('Cadastre uma disciplina primeiro.'); return; }
  if(state.metasPorDisciplina.some(md => entitySubjectId(md) === subjectId)){
    showToast('Já existe uma meta pra essa disciplina.');
    return;
  }
  state.metasPorDisciplina.push({ id: uid('goal'), subjectId, meta });
  persistAndRender();
}
function updateMetaDisciplina(id, value){
  const md = state.metasPorDisciplina.find(x=>x.id===id);
  md.meta = Number(value) || 1;
  persistAndRender();
}
function deleteMetaDisciplina(id){
  state.metasPorDisciplina = state.metasPorDisciplina.filter(x=>x.id!==id);
  persistAndRender();
}
document.getElementById('addMetaDisciplinaBtn').addEventListener('click', addMetaDisciplina);

/* ===== HISTÓRICO DE METAS (retroativo, últimas 8 semanas) ===== */
function getWeekStartMinus(weeksAgo){
  const currentWeekStart = startOfWeek(todayISO());
  return addDays(currentWeekStart, -7*weeksAgo);
}
function computeWeeklyHistory(numWeeks){
  const weeks = [];
  for(let i = 0; i < numWeeks; i++){
    const weekStart = getWeekStartMinus(i);
    const weekEnd = addDays(weekStart, 6);
    const topicsConcl = uniqueTopicsCompletedBetween(weekStart,weekEnd);
    const questoesResolved = state.questoes.filter(q => q.date >= weekStart && q.date <= weekEnd).reduce((sum,q)=> sum + (Number(q.resolved)||0), 0);
    const simuladosCount = state.simulados.filter(s => s.date >= weekStart && s.date <= weekEnd).length;
    weeks.push({
      weekStart, weekEnd, current: i === 0,
      topicsConcl, questoesResolved, simuladosCount,
      semanalOk: topicsConcl >= state.metas.semanal,
      questoesOk: questoesResolved >= state.metas.questoesSemanal,
      simuladosOk: simuladosCount >= state.metas.simuladosSemanal
    });
  }
  return weeks;
}
function renderHistoricoMetas(){
  const weeks = computeWeeklyHistory(8);
  const container = document.getElementById('historicoMetasContainer');
  const badge = (ok, current) => current
    ? `<span class="wk-current">em andamento</span>`
    : (ok ? `<span class="wk-ok">✓ cumprida</span>` : `<span class="wk-fail">✗ não cumprida</span>`);

  container.innerHTML = `
    <div class="weekly-history-table-wrap">
    <table class="weekly-history-table">
      <thead>
        <tr>
          <th>Semana</th>
          <th>Tópicos</th>
          <th>Questões</th>
          <th>Simulados</th>
        </tr>
      </thead>
      <tbody>
        ${weeks.map(w => `
          <tr>
            <td>${formatDatePt(w.weekStart)} – ${formatDatePt(w.weekEnd)}</td>
            <td>${w.topicsConcl}/${state.metas.semanal} ${badge(w.semanalOk, w.current)}</td>
            <td>${w.questoesResolved}/${state.metas.questoesSemanal} ${badge(w.questoesOk, w.current)}</td>
            <td>${w.simuladosCount}/${state.metas.simuladosSemanal} ${badge(w.simuladosOk, w.current)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    </div>
  `;
}

/* ===== ESTIMATIVA DE RITMO ===== */
function computeRitmo(){
  const allT = activeTopics();
  const total = allT.length;
  const done = allT.filter(t => t.status === 'Concluído').length;
  const remaining = total - done;

  if(total === 0) return { status: 'sem-topicos' };
  if(remaining <= 0) return { status: 'completo' };

  const cutoff = addDays(todayISO(), -13);
  const recentDone = uniqueTopicsCompletedBetween(cutoff,todayISO());
  const ratePerDay = recentDone / 14;

  if(ratePerDay <= 0) return { status: 'sem-dados', remaining };

  const daysNeeded = Math.ceil(remaining / ratePerDay);
  const finishDate = addDays(todayISO(), daysNeeded);
  let comparativo = null, daysToExam = null;
  if(state.examDate){
    daysToExam = diasParaRevisao(state.examDate);
    if(daysToExam !== null){
      comparativo = daysNeeded <= daysToExam ? 'no-prazo' : 'atrasado';
    }
  }
  return { status: 'ok', remaining, ratePerDay, daysNeeded, finishDate, comparativo, daysToExam };
}
function renderRitmo(){
  const r = computeRitmo();
  const container = document.getElementById('ritmoContainer');

  if(r.status === 'sem-topicos'){
    container.innerHTML = `<div class="upcoming-empty">Adicione disciplinas e tópicos pra ver a estimativa de ritmo aqui.</div>`;
    return;
  }
  if(r.status === 'completo'){
    container.innerHTML = `<div class="pace-block"><div class="pace-status ok">🎉 Todos os tópicos cadastrados já foram concluídos!</div></div>`;
    return;
  }
  if(r.status === 'sem-dados'){
    container.innerHTML = `<div class="pace-block">
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining===1?'':'s'} pra concluir o plano.</div>
      <div class="pace-status neutral">Ainda sem tópicos concluídos nos últimos 14 dias — sem dados suficientes pra estimar o ritmo ainda.</div>
    </div>`;
    return;
  }

  const ritmoTxt = r.ratePerDay >= 1
    ? `${r.ratePerDay.toFixed(1)} tópicos por dia`
    : `${(r.ratePerDay*7).toFixed(1)} tópicos por semana`;

  let statusHtml = '';
  if(r.comparativo === 'no-prazo'){
    const folga = r.daysToExam - r.daysNeeded;
    statusHtml = `<div class="pace-status ok">🟢 No ritmo atual, você termina com ${folga} dia${folga===1?'':'s'} de folga antes da prova.</div>`;
  } else if(r.comparativo === 'atrasado'){
    const atraso = r.daysNeeded - r.daysToExam;
    statusHtml = `<div class="pace-status warn">🔴 No ritmo atual, você terminaria ${atraso} dia${atraso===1?'':'s'} depois da prova. Considere acelerar ou rever o plano.</div>`;
  } else {
    statusHtml = `<div class="pace-status neutral">Defina a data da prova na Visão Geral pra comparar com o prazo.</div>`;
  }

  container.innerHTML = `
    <div class="pace-block">
      <div class="pace-line">Nos últimos 14 dias você concluiu em média <strong>${ritmoTxt}</strong>.</div>
      <div class="pace-line">Faltam <strong>${r.remaining}</strong> tópico${r.remaining===1?'':'s'} — no ritmo atual, você termina em <strong>${r.daysNeeded} dia${r.daysNeeded===1?'':'s'}</strong> (${formatDatePt(r.finishDate)}).</div>
      ${statusHtml}
    </div>
  `;
}

function taxaAcertoGeral(){
  const simCounts = state.simulados.map(s => simuladoEffectiveCounts(s));
  const totalResolvidas = state.questoes.reduce((sum,q)=>sum + (Number(q.resolved)||0), 0)
    + simCounts.reduce((sum,c)=>sum + c.total, 0);
  const totalCorretas = state.questoes.reduce((sum,q)=>sum + (Number(q.correct)||0), 0)
    + simCounts.reduce((sum,c)=>sum + c.correct, 0);
  if(totalResolvidas <= 0) return 0;
  return Math.round((totalCorretas/totalResolvidas)*1000)/10;
}
function mediaSimulados(){
  if(state.simulados.length === 0) return 0;
  const soma = state.simulados.reduce((sum,s)=> sum + simuladoNota(s), 0);
  return Math.round((soma/state.simulados.length)*10)/10;
}
function revisoesAtrasadas(){
  const today=todayISO();
  const isCurrent=item=>isActiveStudyReference(entitySubjectId(item),item.topicId||item.topicRef||null);
  const doCalendario=state.calendar.filter(c=>c.date&&c.date<today&&c.status!=='Concluído'&&isCurrent(c)).length;
  const daAgenda=state.reviewAgenda.filter(a=>a.date&&a.date<today&&a.status!=='Concluído'&&isCurrent(a)).length;
  return doCalendario+daAgenda;
}

/* ===== TAXA DE ERRO / ÚLTIMA ATIVIDADE POR DISCIPLINA ===== */
function taxaErroDisciplina(subjectId){
  let correct = 0, total = 0;
  state.questoes.filter(q => entitySubjectId(q) === subjectId).forEach(q => {
    total += Number(q.resolved)||0;
    correct += Number(q.correct)||0;
  });
  state.simulados.forEach(sim => {
    (sim.breakdown||[]).filter(b => entitySubjectId(b) === subjectId).forEach(b => {
      total += Number(b.total)||0;
      correct += Number(b.correct)||0;
    });
  });
  if(total === 0) return 0;
  return Math.round((1 - correct/total) * 1000) / 10;
}
function taxaAcertoDisciplina(subjectId){
  return Math.round((100 - taxaErroDisciplina(subjectId)) * 10) / 10;
}
function ultimaAtividadeDisciplina(subjectId){
  let last=null;
  const bump=d=>{if(d&&(!last||d>last)) last=d;};
  state.topicHistory.filter(event=>event.subjectId===subjectId).forEach(event=>bump(eventLocalDate(event)));
  state.questoes.filter(q=>entitySubjectId(q)===subjectId).forEach(q=>bump(q.date));
  state.calendar.filter(c=>entitySubjectId(c)===subjectId&&c.status==='Concluído').forEach(c=>bump(c.date));
  state.reviewAgenda.filter(a=>entitySubjectId(a)===subjectId&&a.status==='Concluído').forEach(a=>bump(a.date));
  state.studySessions.filter(session=>entitySubjectId(session)===subjectId).forEach(session=>bump(session.date));
  return last;
}
function diasSemEstudarDisciplina(subjectId){
  const last = ultimaAtividadeDisciplina(subjectId);
  if(!last) return 0;
  const d = diasParaRevisao(last);
  return d !== null ? Math.max(0, -d) : 21;
}

/* ===== PRIORIDADE INTELIGENTE DE ESTUDOS (Score 0-100) ===== */
/* Pesos: Revisão atrasada 30% · Baixo desempenho 30% · Dificuldade 20% · Tempo sem estudar 10% · Proximidade da prova 10% */

const PRIORITY_WEIGHTS={revisaoAtrasada:0.25,baixoDesempenho:0.30,tendencia:0.10,dificuldade:0.15,tempoSemEstudar:0.10,proximidadeProva:0.10};
const PRIORITY_TIER_EMOJI={'Alta':'🔴','Média':'🟠','Baixa':'🟡'};

function proximidadeProvaScore(){
  if(!state.examDate) return 0;
  const dias=diasParaRevisao(state.examDate);
  if(dias===null) return 0;
  return Math.max(0,Math.min(100,100-dias));
}
function trendPriorityRisk(trend){
  if(!trend||trend.key!=='down'||trend.delta===null) return 0;
  return Math.max(0,Math.min(100,40+Math.abs(trend.delta)*6));
}
function computeStudyPriorities(){
  const today=todayISO();
  const provaScore=proximidadeProvaScore();
  const candidateMap=new Map();
  const addCandidate=(key,candidate)=>{
    const current=candidateMap.get(key);
    if(!current||candidate.diasAtrasado>current.diasAtrasado||candidate.tipo==='revisão'&&current.tipo!=='revisão') candidateMap.set(key,candidate);
  };

  state.reviewAgenda
    .filter(review=>{
      const subjectId=entitySubjectId(review);
      const topicId=review.topicId||review.topicRef||null;
      return review.status!=='Concluído'&&review.date&&review.date<=today&&isActiveStudyReference(subjectId,topicId);
    })
    .forEach(review=>{
      const subjectId=entitySubjectId(review);
      const topicId=review.topicId||review.topicRef||null;
      const diagnosis=topicId?diagnoseTopic(subjectId,topicId):null;
      addCandidate(topicId||'review:'+review.id,{
        subjectId,topicId,subjectName:entitySubjectName(review),
        topicName:topicId?getTopicName(topicId):(review.topic||review.tipo||'Revisão'),
        tipo:'revisão',dificuldade:getTopicDifficulty(topicId),
        diasAtrasado:Math.max(0,-(diasParaRevisao(review.date)??0)),
        erroQuestoes:diagnosis?.effectiveErrorRate??taxaErroDisciplina(subjectId),
        diasSemEstudar:diagnosis?.daysSinceStudy??diasSemEstudarDisciplina(subjectId),
        diagnosis
      });
    });

  activeTopics()
    .filter(topic=>topic.status!=='Concluído'&&(topic.name||'').trim()!=='')
    .forEach(topic=>{
      if(candidateMap.has(topic.id)) return;
      const diagnosis=diagnoseTopic(topic.subjectId,topic.id);
      addCandidate(topic.id,{
        subjectId:topic.subjectId,topicId:topic.id,subjectName:topic.subjectName,topicName:topic.name,
        tipo:topic.status==='Em andamento'?'continuar':'novo tópico',
        dificuldade:topic.difficulty||'Médio',diasAtrasado:0,
        erroQuestoes:diagnosis?.effectiveErrorRate??taxaErroDisciplina(topic.subjectId),
        diasSemEstudar:diagnosis?.daysSinceStudy??diasSemEstudarDisciplina(topic.subjectId),
        diagnosis
      });
    });

  const candidates=[...candidateMap.values()];
  candidates.forEach(candidate=>{
    const scoreRevisaoAtrasada=Math.max(0,Math.min(100,candidate.diasAtrasado*10));
    const scoreBaixoDesempenho=Math.max(0,Math.min(100,Number(candidate.erroQuestoes)||0));
    const scoreTendencia=trendPriorityRisk(candidate.diagnosis?.trend);
    const scoreDificuldade=((DIFFICULTY_WEIGHT[candidate.dificuldade]||2)/3)*100;
    const scoreTempoSemEstudar=Math.max(0,Math.min(100,candidate.diasSemEstudar*5));
    const score=Math.round(
      scoreRevisaoAtrasada*PRIORITY_WEIGHTS.revisaoAtrasada+
      scoreBaixoDesempenho*PRIORITY_WEIGHTS.baixoDesempenho+
      scoreTendencia*PRIORITY_WEIGHTS.tendencia+
      scoreDificuldade*PRIORITY_WEIGHTS.dificuldade+
      scoreTempoSemEstudar*PRIORITY_WEIGHTS.tempoSemEstudar+
      provaScore*PRIORITY_WEIGHTS.proximidadeProva
    );
    candidate.score=Math.max(0,Math.min(100,score));
    candidate.tier=candidate.score>=70?'Alta':candidate.score>=40?'Média':'Baixa';
    candidate.recommendedAction=candidate.diagnosis?.recommendation?.action||(candidate.tipo==='revisão'?'Concluir a revisão programada':'Estudar o tópico');
    candidate.studyType=candidate.diagnosis?.recommendation?.studyType||(candidate.tipo==='revisão'?'review':'study');
    candidate.estimatedMinutes=candidate.diagnosis?.recommendation?.estimatedMinutes||(candidate.tipo==='revisão'?25:35);
    candidate.recommendedQuestions=candidate.diagnosis?.recommendation?.questions||0;
  });
  return candidates.sort((a,b)=>b.score-a.score||b.diasAtrasado-a.diasAtrasado);
}
function motivoPrioridade(priority){
  if(priority.diasAtrasado>0) return 'Revisão atrasada ('+priority.diasAtrasado+'d)';
  const diagnosis=priority.diagnosis;
  if(diagnosis?.trend?.key==='down') return 'Tendência em queda ('+diagnosis.trend.delta.toFixed(1)+' p.p.)';
  if(diagnosis?.performance?.resolved>=10&&diagnosis.performance.accuracy!==null&&diagnosis.performance.accuracy<state.metas.metaAprovacao){
    return 'Baixo desempenho no tópico ('+diagnosis.performance.accuracy+'% de acerto)';
  }
  if(diagnosis?.dominantError) return 'Erro predominante: '+diagnosis.dominantError.meta.label;
  if(priority.dificuldade==='Difícil') return 'Tópico difícil';
  if(priority.tipo==='continuar') return 'Em andamento';
  if(priority.diasSemEstudar>=7) return priority.diasSemEstudar+'d sem atividade no tópico';
  return priority.tipo==='revisão'?'Revisão de hoje':'Tópico novo';
}

function renderPrioridadeHoje(){
  const container = document.getElementById('prioridadeHojeList');
  if(!container) return;
  const priorities = computeStudyPriorities().slice(0, 6);

  if(priorities.length === 0){
    container.innerHTML = `<div class="upcoming-empty">Nada pendente — todos os tópicos cadastrados estão concluídos e sem revisões em aberto. 🎉</div>`;
    return;
  }

  const TIER_CLASS = { 'Alta':'priority-alta', 'Média':'priority-media', 'Baixa':'priority-baixa' };
  container.innerHTML = priorities.map((p, idx) => `
    <div class="priority-item">
      <div class="priority-rank">${idx+1}</div>
      <div class="priority-info">
        <div class="priority-subject">${escapeHtml(p.subjectName)}</div>
        <div class="priority-topic">${escapeHtml(p.topicName)} <span style="opacity:0.6;">· ${p.tipo}</span></div>
        <div class="priority-reason">${p.diagnosis?.statusIcon||'🟡'} ${escapeHtml(p.diagnosis?.status||'Acompanhamento')} · ${escapeHtml(motivoPrioridade(p))}</div>
        <div class="priority-reason">Ação: ${escapeHtml(p.recommendedAction)}</div>
      </div>
      <div class="priority-badge ${TIER_CLASS[p.tier]}">${PRIORITY_TIER_EMOJI[p.tier]} ${p.score}/100</div>
    </div>`
  ).join('');
}

/* ===== RADAR DE DISCIPLINAS ===== */
const radarView={subjectIds:[]};
function subjectRadarModel(subject){
  const topics=subject.topics.filter(topic=>!topic.archived),coverage=topics.length?subjectProgress(subject):null;
  const masteryValues=topics.map(topic=>topicMasteryIndex(subject.id,topic.id)).filter(item=>item.confidence>0);
  const retentionValues=topics.map(topic=>topicRetentionScore(subject.id,topic.id)).filter(item=>item.available);
  const mastery=masteryValues.length?masteryValues.reduce((sum,item)=>sum+item.score,0)/masteryValues.length:null;
  const retention=retentionValues.length?retentionValues.reduce((sum,item)=>sum+item.score,0)/retentionValues.length:null;
  const last=ultimaAtividadeDisciplina(subject.id),distance=last?diasParaRevisao(last):null,daysSinceContact=distance===null?null:Math.max(0,-distance);
  const cutoff=addDays(todayISO(),-27),activeDates=new Set();
  state.studySessions.filter(item=>entitySubjectId(item)===subject.id&&item.date>=cutoff).forEach(item=>activeDates.add(item.date));
  state.questoes.filter(item=>entitySubjectId(item)===subject.id&&item.date>=cutoff).forEach(item=>activeDates.add(item.date));
  const result=calculateSubjectRadar({coverage,mastery,retention,daysSinceContact,activeDays:activeDates.size||null});
  return {...result,id:subject.id,name:subject.name};
}
function setRadarSubject(slot,value){
  const index=Math.max(0,Math.min(1,Number(slot)||0));
  radarView.subjectIds[index]=value||'';
  if(value)radarView.subjectIds=radarView.subjectIds.map((id,i)=>i!==index&&id===value?'':id);
  renderRadarDisciplinas();
}
function renderRadarDisciplinas(){
  const container = document.getElementById('radarChart');
  if(!container) return;
  const subjects = activeSubjects().filter(s => s.topics.some(t=>!t.archived));

  if(!subjects.length){
    container.innerHTML = `<div class="radar-empty">Cadastre uma disciplina com tópicos para ver o radar.</div>`;
    return;
  }
  if(!radarView.subjectIds[0]||!subjects.some(subject=>subject.id===radarView.subjectIds[0]))radarView.subjectIds[0]=subjects[0].id;
  radarView.subjectIds=radarView.subjectIds.slice(0,2);
  const selected=radarView.subjectIds.map(id=>subjects.find(subject=>subject.id===id)).filter(Boolean).map(subjectRadarModel);
  const axisMeta=[['coverage','Cobertura'],['mastery','Domínio'],['retention','Retenção'],['frequency','Frequência'],['consistency','Consistência']];
  const N=axisMeta.length,W=560,H=430,cx=W/2,cy=190,maxR=125;
  const angleFor = i => (Math.PI*2 * i/N) - Math.PI/2;
  const gridRings = [0.25,0.5,0.75,1].map(frac => {
    const pts = axisMeta.map((_,i) => {
      const a = angleFor(i);
      const r = maxR*frac;
      return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
    }).join(' ');
    return `<polygon class="radar-grid" points="${pts}"></polygon>`;
  }).join('');

  const axes = axisMeta.map((_,i) => {
    const a = angleFor(i);
    return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx+maxR*Math.cos(a)}" y2="${cy+maxR*Math.sin(a)}"></line>`;
  }).join('');

  const labels = axisMeta.map(([,label],i) => {
    const a = angleFor(i);
    const labelR = maxR + 28;
    const x = cx + labelR*Math.cos(a);
    const y = cy + labelR*Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${label}</text>`;
  }).join('');
  const series=selected.map((model,seriesIndex)=>{const values=axisMeta.map(([key])=>model.axes[key]);const complete=values.every(value=>value!==null);const points=values.map((value,index)=>{if(value===null)return '';const a=angleFor(index),r=maxR*(value/100);return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`}).filter(Boolean);const shape=complete?`<polygon class="radar-shape radar-series-${seriesIndex+1}" points="${points.join(' ')}"></polygon>`:'';const dots=values.map((value,index)=>{if(value===null)return '';const a=angleFor(index),r=maxR*(value/100);return `<circle class="radar-dot radar-series-${seriesIndex+1}" cx="${cx+r*Math.cos(a)}" cy="${cy+r*Math.sin(a)}" r="4"><title>${escapeHtml(model.name)} · ${axisMeta[index][1]}: ${value}/100</title></circle>`}).join('');return shape+dots}).join('');
  const options=(selectedId='')=>`<option value="">Nenhuma</option>`+subjects.map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===selectedId?'selected':''}>${escapeHtml(subject.name)}</option>`).join('');
  container.innerHTML = `
    <div class="radar-toolbar"><label>Disciplina 1<select data-delegated-change="setRadarSubject(0,this.value)">${options(radarView.subjectIds[0])}</select></label><label>Comparar com<select data-delegated-change="setRadarSubject(1,this.value)">${options(radarView.subjectIds[1])}</select></label></div>
    <svg class="radar-svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:460px;height:auto;display:block;margin:0 auto;">
      ${gridRings}
      ${axes}
      ${series}
      ${labels}
    </svg>
    <div class="radar-analysis">${selected.map((model,index)=>`<section><h4><span class="radar-key radar-key-${index+1}"></span>${escapeHtml(model.name)}</h4><p>${escapeHtml(model.interpretation)}</p><small>${model.availableAxes} de 5 eixos · confiança ${model.confidenceLabel.toLowerCase()}</small><dl>${axisMeta.map(([key,label])=>`<div><dt>${label}</dt><dd>${model.axes[key]===null?'Aguardando dados':model.axes[key]+'/100'}</dd></div>`).join('')}</dl></section>`).join('')}</div>
  `;
}

/* ===== SIMULADOS PLANEJADOS ===== */
function renderSimuladosPlanejados(){
  const ul = document.getElementById('hojeSimuladosPlanejados');
  if(!ul) return;
  const today = todayISO();
  const planejados = state.simulados
    .filter(s => s.date >= today && (Number(s.correct)||0) === 0 && (Number(s.total)||0) === 0 && (!s.breakdown || s.breakdown.length === 0))
    .sort((a,b)=> (a.date||'').localeCompare(b.date||''));

  if(planejados.length === 0){
    ul.innerHTML = `<li class="upcoming-empty">Nenhum simulado planejado. Registre um com data futura na aba Questões &amp; Simulados pra ele aparecer aqui.</li>`;
  } else {
    ul.innerHTML = planejados.map(s => `
      <li>
        <span class="upcoming-date">${formatDatePt(s.date)}</span>
        <span style="flex:1;">${escapeHtml(s.nome || 'Simulado sem nome')}</span>
        <span class="subject-progress-pill">${s.date === today ? 'hoje' : 'planejado'}</span>
      </li>
    `).join('');
  }
}

/* ===== METAS DE HOJE ===== */
function formatHoras(decimalHoras){
  const totalMin = Math.round(decimalHoras*60);
  const h = Math.floor(totalMin/60);
  const m = totalMin%60;
  return m>0 ? `${h}h${m.toString().padStart(2,'0')}` : `${h}h`;
}
function formatDuration(seconds){
  const minutes = Math.floor((Number(seconds)||0)/60);
  const hours = Math.floor(minutes/60);
  const mins = minutes%60;
  if(hours <= 0) return `${mins}min`;
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2,'0')}`;
}
function totalStudySeconds(filterFn){
  const fn = filterFn || (()=>true);
  return state.studySessions.filter(fn).reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
}
function segundosEstudadosHoje(){ return totalStudySeconds(s=>s.date===todayISO()); }
function segundosEstudadosSemana(){ return totalStudySeconds(s=>isSameWeek(s.date)); }
function segundosEstudadosMes(){ return totalStudySeconds(s=>isSameMonth(s.date)); }
function studyTimeBySubject(){
  const map = {};
  state.studySessions.forEach(session=>{
    const id = entitySubjectId(session);
    if(id) map[id] = (map[id]||0)+(Number(session.durationSeconds)||0);
  });
  return map;
}
function studyTimeByTopic(topicId){ return totalStudySeconds(s=>s.topicId===topicId); }
function questionsPerHour(){
  const sessions = state.studySessions.filter(s=>(Number(s.durationSeconds)||0)>=300 && (Number(s.questionsResolved)||0)>0);
  const seconds = sessions.reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
  const questions = sessions.reduce((sum,s)=>sum+(Number(s.questionsResolved)||0),0);
  return seconds > 0 ? Math.round(questions/(seconds/3600)) : 0;
}

function studySecondsByDate(sessions=state.studySessions){
  const map={};
  sessions.forEach(s=>{
    if(!s.date) return;
    map[s.date]=(map[s.date]||0)+(Number(s.durationSeconds)||0);
  });
  return map;
}
function inclusiveDayCount(startIso,endIso){
  if(!startIso||!endIso) return 0;
  const start=new Date(startIso+'T00:00:00');
  const end=new Date(endIso+'T00:00:00');
  return Math.max(0,Math.floor((end-start)/86400000)+1);
}
function progressoMetaHorasHoje(){
  const target=metaHoursToday()*3600;
  return target>0?Math.round((segundosEstudadosHoje()/target)*100):0;
}
function consistenciaSemanalHoras(){
  const today=todayISO();
  const weekStart=startOfWeek(today);
  const elapsed=inclusiveDayCount(weekStart,today);
  const byDate=studySecondsByDate(state.studySessions.filter(s=>s.date>=weekStart&&s.date<=today));
  let achieved=0;
  for(let index=0;index<elapsed;index++){
    const date=addDays(weekStart,index);
    const target=metaHoursForDate(date)*3600;
    if(target>0&&(byDate[date]||0)>=target) achieved++;
  }
  return {achieved,elapsed};
}
function ritmoMedioEstudo(){
  const today=todayISO();
  const cutoff=addDays(today,-29);
  const recent=state.studySessions.filter(s=>s.date&&s.date>=cutoff&&s.date<=today);
  if(recent.length===0) return {secondsPerDay:0,days:0};
  const first=recent.map(s=>s.date).sort()[0];
  const days=inclusiveDayCount(first,today);
  const total=recent.reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
  return {secondsPerDay:days>0?total/days:0,days};
}
function scoreDedicacao(){
  const today=todayISO();
  const cutoff=addDays(today,-29);
  const recent=state.studySessions.filter(s=>s.date&&s.date>=cutoff&&s.date<=today);
  if(recent.length===0) return {score:0,realized:0,planned:0,days:0};
  const first=recent.map(s=>s.date).sort()[0];
  const days=inclusiveDayCount(first,today);
  const realized=recent.reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
  let planned=0;
  for(let index=0;index<days;index++) planned+=metaHoursForDate(addDays(first,index))*3600;
  return {score:planned>0?Math.min(100,Math.round((realized/planned)*100)):0,realized,planned,days};
}
function renderStudyHoursDashboard(){
  const container=document.getElementById('studyTimeStats');
  if(!container) return;
  const today=segundosEstudadosHoje();
  const week=segundosEstudadosSemana();
  const month=segundosEstudadosMes();
  const total=totalStudySeconds();
  const metaSeconds=metaHoursToday()*3600;
  const remaining=Math.max(0,metaSeconds-today);
  const consistency=consistenciaSemanalHoras();
  const pace=ritmoMedioEstudo();
  const dedication=scoreDedicacao();
  const metaLabel=metaSeconds>0?`${progressoMetaHorasHoje()}% · faltam ${formatDuration(remaining)}`:'meta não definida';
  container.innerHTML=`
    <div class="stat-cell" title="${escapeAttr(metaLabel)}"><div class="n">${formatDuration(today)}</div><div class="l">Estudo hoje</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(week)}</div><div class="l">Estudo na semana</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(month)}</div><div class="l">Estudo no mês</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(total)}</div><div class="l">Total acumulado</div></div>
    <div class="stat-cell"><div class="n">${metaSeconds>0?progressoMetaHorasHoje()+'%':'—'}</div><div class="l">Meta de hoje</div></div>
    <div class="stat-cell"><div class="n">${metaSeconds>0?consistency.achieved+'/'+consistency.elapsed:'—'}</div><div class="l">Consistência semanal</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(pace.secondsPerDay)}</div><div class="l">Ritmo médio diário</div></div>
    <div class="stat-cell" title="${dedication.days?`Últimos ${dedication.days} dias observados`:''}"><div class="n">${dedication.score}/100</div><div class="l">Score de dedicação</div></div>
    <div class="stat-cell"><div class="n">${questionsPerHour()}</div><div class="l">Questões por hora</div></div>
  `;
  renderStudyHoursChart();
  renderSubjectHoursBars();
}
function renderStudyHoursChart(){
  const container=document.getElementById('studyHoursChart');
  if(!container) return;
  const byDate=studySecondsByDate();
  const data=[];
  for(let i=13;i>=0;i--){ const date=addDays(todayISO(),-i); data.push({date,seconds:byDate[date]||0}); }
  const total=data.reduce((sum,d)=>sum+d.seconds,0);
  if(total<=0){ container.innerHTML=`<div class="progress-chart-empty">Registre sessões para visualizar a evolução das horas.</div>`; return; }
  const W=640,H=180,padL=36,padR=12,padT=16,padB=26;
  const plotW=W-padL-padR,plotH=H-padT-padB;
  const target=metaHoursToday()*3600;
  const maxSeconds=Math.max(target,...data.map(d=>d.seconds),3600);
  const xFor=i=>padL+(i/(data.length-1))*plotW;
  const yFor=seconds=>padT+plotH-(seconds/maxSeconds)*plotH;
  const points=data.map((d,i)=>`${xFor(i)},${yFor(d.seconds)}`).join(' ');
  const gridValues=[0,maxSeconds/2,maxSeconds];
  const grid=gridValues.map(seconds=>`<line class="chart-grid" x1="${padL}" y1="${yFor(seconds)}" x2="${W-padR}" y2="${yFor(seconds)}"></line><text x="2" y="${yFor(seconds)+3}">${(seconds/3600).toFixed(seconds%3600?1:0)}h</text>`).join('');
  const labels=[0,4,9,13].map(i=>`<text x="${xFor(i)}" y="${H-5}" text-anchor="middle">${formatDatePt(data[i].date).slice(0,5)}</text>`).join('');
  const dots=data.map((d,i)=>`<circle class="chart-dot" cx="${xFor(i)}" cy="${yFor(d.seconds)}" r="3"><title>${formatDatePt(d.date)} · ${formatDuration(d.seconds)}</title></circle>`).join('');
  const targetLine=target>0?`<line x1="${padL}" y1="${yFor(target)}" x2="${W-padR}" y2="${yFor(target)}" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="5 4"><title>Meta diária: ${formatDuration(target)}</title></line>`:'';
  container.innerHTML=`<svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">${grid}${targetLine}<polyline class="chart-line" points="${points}"></polyline>${dots}${labels}</svg>`;
}
function renderSubjectHoursBars(){
  const container=document.getElementById('subjectHoursBars');
  if(!container) return;
  const map={};
  state.studySessions.forEach(session=>{
    const key=entitySubjectId(session)||'__none';
    map[key]=(map[key]||0)+(Number(session.durationSeconds)||0);
  });
  const rows=Object.entries(map).filter(([,seconds])=>seconds>0).sort((a,b)=>b[1]-a[1]);
  if(rows.length===0){ container.innerHTML=`<div class="upcoming-empty">Nenhuma sessão registrada.</div>`; return; }
  const total=rows.reduce((sum,row)=>sum+row[1],0);
  container.innerHTML=rows.map(([subjectId,seconds])=>{
    const name=subjectId==='__none'?'Sem disciplina':getSubjectName(subjectId);
    const pct=total>0?Math.round((seconds/total)*100):0;
    return `<div class="bar-row"><div class="bar-label" title="${escapeAttr(name)}">${escapeHtml(name)}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-pct" title="${pct}% do tempo total">${formatDuration(seconds)}</div></div>`;
  }).join('');
}

const SESSION_TYPES={study:'Estudo teórico',review:'Revisão',questions:'Questões',simulation:'Simulado'};
let sessionHistoryFilters={period:'30',subjectId:'',type:'',date:''};
let expandedSessionDays=new Set();
let expandedSessionDetails=new Set();
let sessionHistoryExpansionInitialized=false;
function sessionTypeLabel(type){ return SESSION_TYPES[type]||SESSION_TYPES.study; }
function sessionTypeOptions(selected){
  return Object.entries(SESSION_TYPES).map(([value,label])=>`<option value="${value}" ${value===selected?'selected':''}>${label}</option>`).join('');
}
function updateSessionHistoryFilter(field,value){
  sessionHistoryFilters[field]=value;
  if(field==='period') sessionHistoryFilters.date='';
  listViewState.sessionDaysVisible=LIST_VIEW_STEPS.sessionDays;
  expandedSessionDays.clear();
  sessionHistoryExpansionInitialized=false;
  renderStudySessionsHistory();
  renderHeatmap();
}
function clearSessionHistoryFilters(){
  sessionHistoryFilters={period:'30',subjectId:'',type:'',date:''};
  listViewState.sessionDaysVisible=LIST_VIEW_STEPS.sessionDays;
  expandedSessionDays.clear();
  sessionHistoryExpansionInitialized=false;
  renderStudySessionsHistory();
  renderHeatmap();
}
function selectSessionHistoryDate(date){
  sessionHistoryFilters.date=date;
  sessionHistoryFilters.period='all';
  listViewState.sessionDaysVisible=LIST_VIEW_STEPS.sessionDays;
  expandedSessionDays=new Set([date]);
  sessionHistoryExpansionInitialized=true;
  renderStudySessionsHistory();
  renderHeatmap();
  document.getElementById('studySessionsCard')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function toggleSessionDay(date){
  sessionHistoryExpansionInitialized=true;
  if(expandedSessionDays.has(date)) expandedSessionDays.delete(date);
  else expandedSessionDays.add(date);
  renderStudySessionsHistory();
}
function toggleSessionDetails(id){
  if(expandedSessionDetails.has(id))expandedSessionDetails.delete(id);
  else expandedSessionDetails=new Set([id]);
  renderStudySessionsHistory();
}
function renderSessionHistoryFilterControls(){
  const period=document.getElementById('studySessionsPeriod');
  const subject=document.getElementById('studySessionsSubjectFilter');
  const type=document.getElementById('studySessionsTypeFilter');
  if(!period||!subject||!type) return;
  period.value=sessionHistoryFilters.period;
  subject.innerHTML=`<option value="">Todas as disciplinas</option>`+state.subjects.map(s=>`<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)}</option>`).join('');
  subject.value=sessionHistoryFilters.subjectId;
  type.value=sessionHistoryFilters.type;
  const active=countActiveFilters(sessionHistoryFilters,{period:'30',subjectId:'',type:'',date:''});
  const toggle=document.getElementById('studySessionsFilterToggle');
  if(toggle)toggle.textContent=filterPanelLabel(active)+(toggle.getAttribute('aria-expanded')==='true'?' ▴':' ▾');
}
function filteredStudySessions(){
  return filterStudySessions(state.studySessions,sessionHistoryFilters,{today:todayISO(),addDays,subjectIdOf:entitySubjectId});
}
function sessionTopicOptions(session){
  const subject=getSubjectById(entitySubjectId(session));
  return `<option value="">Sem tópico</option>`+(subject?subject.topics.map(topic=>`<option value="${escapeAttr(topic.id)}" ${topic.id===session.topicId?'selected':''}>${escapeHtml(topic.name||'(sem nome)')}</option>`).join(''):'');
}
function sessionStartTime(session){
  if(!session.startedAt) return '—';
  const date=new Date(session.startedAt);
  return Number.isNaN(date.getTime())?'—':date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function syncQuestionFromStudySession(session){
  let question=state.questoes.find(q=>q.studySessionId===session.id);
  const resolved=Math.max(0,Number(session.questionsResolved)||0);
  const correct=Math.max(0,Math.min(Number(session.correctAnswers)||0,resolved));
  session.questionsResolved=resolved;
  session.correctAnswers=correct;
  if(resolved<=0){ state.questoes=state.questoes.filter(q=>q.studySessionId!==session.id); return; }
  if(!question){
    question={id:uid('question'),studySessionId:session.id,createdAt:nowISO()};
    state.questoes.push(question);
  }
  Object.assign(question,{date:session.date,subjectId:session.subjectId||null,topicId:session.topicId||null,resolved,correct});
  normalizeErrorBreakdown(question);
}
function updateStudySession(id,field,value){
  const session=state.studySessions.find(s=>s.id===id);
  if(!session) return;
  if(field==='durationMinutes') session.durationSeconds=Math.max(0,(Number(value)||0)*60);
  else if(field==='questionsResolved'||field==='correctAnswers') session[field]=Math.max(0,Number(value)||0);
  else session[field]=value;
  syncQuestionFromStudySession(session);
  if(session.planItemId) syncPlannedExecution(session.planItemId);
  persistAndRender();
}
function updateStudySessionSubject(id,subjectId){
  const session=state.studySessions.find(s=>s.id===id);
  if(!session) return;
  session.subjectId=subjectId||null;
  const selectedTopic=session.topicId?getTopicById(session.topicId):null;
  if(selectedTopic?.subject.id!==session.subjectId) session.topicId=null;
  syncQuestionFromStudySession(session);
  persistAndRender();
}
function deleteStudySession(id){
  showConfirm('Excluir esta sessão e as questões vinculadas a ela?',()=>{
    const planItemId=state.studySessions.find(s=>s.id===id)?.planItemId||null;
    state.studySessions=state.studySessions.filter(s=>s.id!==id);
    state.questoes=state.questoes.filter(q=>q.studySessionId!==id);
    state.topicHistory=state.topicHistory.filter(h=>!(h.type==='study_session'&&h.metadata?.sessionId===id));
    if(planItemId) syncPlannedExecution(planItemId);
    persistAndRender();
    showToast('Sessão excluída.');
  });
}
function sessionViewModel(session){
  const resolved=Number(session.questionsResolved)||0,correct=Number(session.correctAnswers)||0;
  return {date:session.date?formatDatePt(session.date):'Sem data',time:sessionStartTime(session),subject:getSubjectName(entitySubjectId(session))||'Sem disciplina',topic:session.topicId?getTopicName(session.topicId):'Sem tópico',type:sessionTypeLabel(session.type||'study'),duration:formatDuration(Number(session.durationSeconds)||0),questions:resolved,correct,accuracy:resolved?Math.round((correct/resolved)*100):null,notes:session.notes||''};
}
function editStudySession(id){ const session=state.studySessions.find(s=>s.id===id); if(!session) return; historyEditState.sessionId=id; historyEditDraft.session=cloneRecord(session); renderStudySessionsHistory(); }
function cancelStudySessionEdit(){ historyEditState.sessionId=null; historyEditDraft.session=null; renderStudySessionsHistory(); }
function updateStudySessionDraft(field,value){
  const d=historyEditDraft.session; if(!d) return;
  if(field==='durationMinutes') d.durationSeconds=Math.max(0,Number(value)||0)*60;
  else if(field==='questionsResolved'||field==='correctAnswers') d[field]=Math.max(0,Math.floor(Number(value)||0));
  else d[field]=value;
  if(field==='subjectId'){
    const selected=d.topicId?getTopicById(d.topicId):null; if(selected?.subject.id!==d.subjectId) d.topicId=null;
    renderStudySessionsHistory();
  }
}
function saveStudySessionEdit(){
  const d=historyEditDraft.session; if(!d) return;
  d.durationSeconds=Math.max(0,Number(d.durationSeconds)||0); d.questionsResolved=Math.max(0,Math.floor(Number(d.questionsResolved)||0)); d.correctAnswers=Math.max(0,Math.min(Math.floor(Number(d.correctAnswers)||0),d.questionsResolved));
  const index=state.studySessions.findIndex(s=>s.id===d.id); if(index<0) return cancelStudySessionEdit();
  state.studySessions[index]=d; syncQuestionFromStudySession(d); if(d.planItemId) syncPlannedExecution(d.planItemId);
  historyEditState.sessionId=null; historyEditDraft.session=null; persistAndRender(); showToast('Sessão atualizada.');
}
function renderStudySessionReadRow(session){
  const vm=sessionViewModel(session);
  const detailsId=`session-details-${session.id}`,expanded=expandedSessionDetails.has(session.id);
  if(isMobileHistoryLayout()) return `<tr class="mobile-history-row" data-id="${session.id}"><td colspan="5"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(vm.date)} · ${escapeHtml(vm.time)}</div><div class="mobile-card-title">${escapeHtml(vm.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(vm.topic)}</div></div><button class="btn ghost small" data-delegated-click="editStudySession('${session.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(vm.type)}</span><span>⏱ ${escapeHtml(vm.duration)}</span>${vm.questions?`<span>${pluralize(vm.questions,'questão','questões')}</span><strong>${vm.accuracy}%</strong>`:''}${vm.notes?`<span title="${escapeAttr(vm.notes)}">📝 ${escapeHtml(vm.notes)}</span>`:''}</div></article></td></tr>`;
  return `<tr class="history-read-row history-desktop-row" data-id="${session.id}"><td><div class="row-primary">${escapeHtml(vm.date)}</div><div class="row-secondary">${escapeHtml(vm.time)}</div></td><td class="number-cell">${escapeHtml(vm.duration)}</td><td><div class="row-primary">${escapeHtml(vm.subject)}</div><div class="row-secondary">${escapeHtml(vm.topic)}</div></td><td><div class="row-primary">${vm.questions?pluralize(vm.questions,'questão','questões'):'Sem questões'}</div><div class="row-secondary">${vm.accuracy===null?'—':vm.accuracy+'% de acerto'}</div></td><td class="session-actions"><button class="btn ghost small" aria-expanded="${expanded}" aria-controls="${detailsId}" data-delegated-click="toggleSessionDetails('${session.id}')">Detalhes</button><button class="btn ghost small" data-delegated-click="editStudySession('${session.id}')">Editar</button></td></tr>${expanded?`<tr class="session-details-row" id="${detailsId}"><td colspan="5"><dl><div><dt>Tipo</dt><dd>${escapeHtml(vm.type)}</dd></div><div><dt>Observação</dt><dd>${escapeHtml(vm.notes||'Sem observação')}</dd></div><div><dt>Atividade do plano</dt><dd>${session.planItemId?'Vinculada ao plano diário':'Sem vínculo'}</dd></div></dl></td></tr>`:''}`;
}
function renderStudySessionEditRow(session){
  const d=historyEditDraft.session; const subjectId=entitySubjectId(d); const subject=getSubjectById(subjectId); const topics=subject?subject.topics:[];
  return `<tr class="row-editing" data-id="${session.id}"><td colspan="10"><div class="inline-edit-form"><label>Data<input type="date" value="${d.date||''}" data-delegated-change="updateStudySessionDraft('date',this.value)"></label><label>Duração (min)<input type="number" min="0" value="${Math.floor((Number(d.durationSeconds)||0)/60)}" data-delegated-input="updateStudySessionDraft('durationMinutes',this.value)"></label><label>Tipo<select data-delegated-change="updateStudySessionDraft('type',this.value)">${sessionTypeOptions(d.type||'study')}</select></label><label>Disciplina<select data-delegated-change="updateStudySessionDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectsForSelection(subjectId).map(s=>`<option value="${escapeAttr(s.id)}" ${s.id===subjectId?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select></label><label>Tópico<select data-delegated-change="updateStudySessionDraft('topicId',this.value||null)"><option value="">Sem tópico</option>${topics.map(t=>`<option value="${escapeAttr(t.id)}" ${t.id===d.topicId?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}</select></label><label>Questões<input type="number" min="0" value="${Number(d.questionsResolved)||0}" data-delegated-input="updateStudySessionDraft('questionsResolved',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(d.correctAnswers)||0}" data-delegated-input="updateStudySessionDraft('correctAnswers',this.value)"></label><label class="edit-notes-field">Observação<textarea data-delegated-input="updateStudySessionDraft('notes',this.value)">${escapeHtml(d.notes||'')}</textarea></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelStudySessionEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveStudySessionEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteStudySession('${session.id}')">Excluir</button></div></div></td></tr>`;
}
function renderStudySessionsHistory(){
  const body=document.getElementById('studySessionsBody');
  const count=document.getElementById('studySessionsCount');
  const summary=document.getElementById('studySessionsFilterSummary');
  const tableWrap=document.getElementById('studySessionsTableWrap');
  const emptyState=document.getElementById('studySessionsEmpty');
  if(!body||!count) return;
  renderSessionHistoryFilterControls();
  const rows=filteredStudySessions();
  count.textContent=rows.length===state.studySessions.length?`${rows.length} sess${rows.length===1?'ão':'ões'}`:`${rows.length} de ${state.studySessions.length}`;
  if(summary){
    summary.textContent=sessionHistoryFilters.date?`Dia selecionado: ${formatDatePt(sessionHistoryFilters.date)}`:`${pluralize(rows.length,'sessão','sessões')} no filtro atual`;
  }
  if(rows.length===0){
    body.innerHTML='';
    if(tableWrap) tableWrap.hidden=true;
    if(emptyState) emptyState.hidden=false;
    return;
  }
  if(tableWrap) tableWrap.hidden=false;
  if(emptyState) emptyState.hidden=true;
  const groupedDays=groupStudySessionsByDate(rows);
  const visibleGroups=groupedDays.slice(0,listViewState.sessionDaysVisible);
  if(!sessionHistoryExpansionInitialized&&visibleGroups.length){
    expandedSessionDays.add(visibleGroups[0][0]);
    sessionHistoryExpansionInitialized=true;
  }
  const html=[];
  visibleGroups.forEach(([date,sessions])=>{
    const seconds=sessions.reduce((sum,s)=>sum+(Number(s.durationSeconds)||0),0);
    const questions=sessions.reduce((sum,s)=>sum+(Number(s.questionsResolved)||0),0);
    const correct=sessions.reduce((sum,s)=>sum+(Number(s.correctAnswers)||0),0);
    const accuracy=questions>0?` · ${Math.round((correct/questions)*100)}% de acerto`:'';
    const expanded=expandedSessionDays.has(date);
    html.push(`<tr class="session-day-row"><td colspan="5"><button type="button" class="session-day-toggle" aria-expanded="${expanded}" data-delegated-click="toggleSessionDay('${escapeAttr(date)}')"><span>${date==='Sem data'?date:formatDatePt(date)} · ${pluralize(sessions.length,'sessão','sessões')} · ${formatDuration(seconds)} · ${pluralize(questions,'questão','questões')}${accuracy}</span><span class="session-day-chevron" aria-hidden="true">›</span></button></td></tr>`);
    if(!expanded) return;
    sessions.forEach(session=>html.push(historyEditState.sessionId===session.id?renderStudySessionEditRow(session):renderStudySessionReadRow(session)));
  });
  html.push(renderListViewFooter(groupedDays.length,listViewState.sessionDaysVisible,LIST_VIEW_STEPS.sessionDays,
    "changeListLimit('sessionDays',LIST_VIEW_STEPS.sessionDays,renderStudySessionsHistory)",
    "changeListLimit('sessionDays',-listViewState.sessionDaysVisible,renderStudySessionsHistory)",10,'dias'));
  body.innerHTML=html.join('');
}

/* ===== ALERTAS INTELIGENTES ===== */
function computeAlertasInteligentes(){
  const alertas = [];
  const today = todayISO();

  const atrasadas = revisoesAtrasadas();
  if(atrasadas > 0){
    alertas.push({id:'reviews-overdue',severity:'high', nivel:'alta', icon:'🔴', texto:`${pluralize(atrasadas,'revisão','revisões')} atrasada${atrasadas===1?'':'s'}` });
  }

  computeSubjectPerformance().filter(p=>isActiveSubjectId(p.subjectId)&&p.acerto<65&&p.total>=5).forEach(p=>{
    alertas.push({id:`accuracy-${p.subjectId}`,subjectId:p.subjectId,severity:'high',nivel:'alta',icon:'🔴',texto:`${p.subject} abaixo de 65% de acerto (${p.acerto}%)`});
  });
  activeSubjects().forEach(subject=>{
    const trend=calculateWeightedTrend(getSubjectWeeklyTrend(subject.id));
    if(trend.key==='down'){const high=Math.abs(trend.delta)>=8;alertas.push({id:`trend-${subject.id}`,subjectId:subject.id,severity:high?'high':'medium',nivel:high?'alta':'media',icon:'↘',texto:`${subject.name} caiu ${Math.abs(trend.delta)} pontos nas últimas quatro semanas (${trend.previousAccuracy}% para ${trend.recentAccuracy}%)`})}
  });

  const diaSemana = new Date(today + 'T00:00:00').getDay(); // 0=domingo..6=sábado
  const diasDecorridos = diaSemana === 0 ? 7 : diaSemana; // considera semana seg-dom
  const expectedFrac = diasDecorridos / 7;
  const inicioSemana=startOfWeek(today);
  const atingidoSemanal=uniqueTopicsCompletedBetween(inicioSemana,addDays(inicioSemana,6));
  const semanalFrac = state.metas.semanal > 0 ? atingidoSemanal / state.metas.semanal : 1;
  if(expectedFrac >= 0.5 && semanalFrac < expectedFrac - 0.15){
    const gap = Math.round((expectedFrac - semanalFrac) * 100);
    alertas.push({id:'weekly-goal-risk',severity:'medium', nivel:'media', icon:'🟠', texto:`Meta semanal ${gap}% abaixo do esperado pro dia da semana` });
  }

  const difSemRevisao=activeTopics().filter(t=>
    t.difficulty==='Difícil'&&t.status!=='Concluído'&&
    !state.reviewAgenda.some(a=>(a.topicId||a.topicRef)===t.id&&a.status!=='Concluído')
  ).length;
  if(difSemRevisao > 0){
    alertas.push({id:'hard-topics-no-review',severity:'low', nivel:'baixa', icon:'🟡', texto:`${pluralize(difSemRevisao,'tópico')} ${difSemRevisao===1?'difícil':'difíceis'} sem revisão agendada` });
  }

  const ritmo = computeRitmo();
  if(ritmo.status === 'ok' && ritmo.comparativo === 'no-prazo'){
    const folga = ritmo.daysToExam - ritmo.daysNeeded;
    alertas.push({id:'pace-ahead',severity:'ok', nivel:'ok', icon:'🟢', texto:`Ritmo atual permite terminar ${folga} dia${folga===1?'':'s'} antes da prova` });
  } else if(ritmo.status === 'ok' && ritmo.comparativo === 'atrasado'){
    const atraso = ritmo.daysNeeded - ritmo.daysToExam;
    alertas.push({id:'pace-behind',severity:'high', nivel:'alta', icon:'🔴', texto:`No ritmo atual você terminaria ${atraso} dia${atraso===1?'':'s'} depois da prova` });
  }

  return alertas;
}

function renderAlertasInteligentes(){
  const container = document.getElementById('alertasInteligentesList');
  if(!container) return;
  const reconciliation=reconcileAlerts(computeAlertasInteligentes(),state.alertStates,todayISO(),addDays);
  if(JSON.stringify(reconciliation.states)!==JSON.stringify(state.alertStates)){state.alertStates=reconciliation.states;scheduleSave()}
  const alertas = reconciliation.visible;

  if(alertas.length === 0){
    container.innerHTML = `<div class="upcoming-empty">Nenhum alerta no momento — tudo sob controle. 🎉</div>`;
    return;
  }
  container.innerHTML = alertas.map(a => `
    <div class="alerta-item alerta-${a.nivel}">
      <span class="alerta-icon">${a.icon}</span>
      <span>${escapeHtml(a.texto)}</span>${a.severity!=='ok'?`<button class="btn ghost small alert-dismiss" data-delegated-click="dismissIntelligentAlert('${escapeAttr(a.id)}')">Dispensar 7 dias</button>`:''}
    </div>
  `).join('');
}
function dismissIntelligentAlert(id){state.alertStates=dismissAlert(state.alertStates,id,todayISO(),addDays,7);scheduleSave();renderAlertasInteligentes()}

function renderExecutiveSummary(){
  const container=document.getElementById('executiveSummary');if(!container)return;
  const metrics=computeApprovalMetrics(),readiness=readinessResult(metrics),pace=computeRitmo(),priorities=computeStudyPriorities();
  const topPriority=priorities[0]?{...priorities[0],reason:motivoPrioridade(priorities[0])}:null;
  const risks=computeAlertasInteligentes().filter(alert=>alert.nivel!=='ok');
  const configuredTopics=activeTopics().filter(topic=>topic.examImportance!==null&&topic.estimatedStudyMinutes!==null);
  const opportunityCount=configuredTopics.filter(topic=>priorities.some(priority=>priority.topicId===topic.id)).length;
  const weekStart=startOfWeek(todayISO()),weeklyGoal={achieved:uniqueTopicsCompletedBetween(weekStart,addDays(weekStart,6)),target:state.metas.semanal};
  const summary=buildExecutiveSummary({readiness,daysToExam:state.examDate?(diasParaRevisao(state.examDate)??null):null,pace,topPriority,riskCount:risks.length,weeklyGoal,opportunityCount});
  container.innerHTML=`<div class="executive-kpis">${summary.cards.map(card=>`<div class="executive-kpi"><strong>${escapeHtml(card.value)}</strong><span>${escapeHtml(card.label)}</span><small>${escapeHtml(card.detail)}</small></div>`).join('')}</div>
    <div class="executive-decision-grid"><section><h4>Prioridade principal</h4>${summary.primaryAction?`<strong>${escapeHtml(summary.primaryAction.title)}</strong><p>${escapeHtml(summary.primaryAction.subject||'')} · ${escapeHtml(summary.primaryAction.topic||'')} · ${formatPlanMinutes(summary.primaryAction.duration)}</p><small>${escapeHtml(summary.primaryAction.reason)}</small>`:'<p>Ainda não há uma prioridade confiável. Cadastre tópicos ou revisões pendentes.</p>'}</section>
    <section><h4>Riscos e oportunidades</h4><p><strong>${summary.riskCount}</strong> risco${summary.riskCount===1?'':'s'} com evidência atual.</p><small>${escapeHtml(summary.opportunityMessage)}</small></section></div>`;
}

const dismissedRecommendationIds=new Set();
let currentStudyRecommendations=[];
function intelligenceCandidates(){
  const today=todayISO();
  return computeStudyPriorities().map(priority=>{
    const found=getTopicById(priority.topicId),topic=found?.topic,subject=found?.subject;
    const retention=priority.topicId?topicRetentionScore(priority.subjectId,priority.topicId):null;
    const blueprint=state.examBlueprint.subjects.find(item=>item.subjectId===priority.subjectId);
    const blueprintImpact=blueprint?Math.min(100,(Number(blueprint.expectedQuestions)||0)*4*(Number(blueprint.questionWeight)||1)):null;
    const examImpact=topic?.examImportance!=null?Number(topic.examImportance)*100:blueprintImpact;
    const mastery=priority.diagnosis?.mastery?.score??(priority.erroQuestoes==null?null:100-priority.erroQuestoes);
    const daysSinceContact=Math.max(0,Number(priority.diasSemEstudar)||0);
    const estimatedMinutes=Math.max(15,priority.tipo==='revisão'?(Number(priority.estimatedMinutes)||25):(Number(topic?.estimatedStudyMinutes)||Number(priority.estimatedMinutes)||30));
    const reviewUrgency=Math.min(100,Math.max(0,Number(priority.diasAtrasado)||0)*12);
    const completed=state.studySessions.some(session=>session.date===today&&session.topicId===priority.topicId);
    const risk=calculateRiskScore({masteryRisk:mastery==null?null:100-mastery,retentionRisk:retention?.available?100-retention.score:null,trendRisk:priority.diagnosis?.trend?.key==='insufficient'?null:trendPriorityRisk(priority.diagnosis?.trend),recencyRisk:Math.min(100,daysSinceContact*5),examImpact,examProximity:state.examDate?proximidadeProvaScore():null});
    return {id:priority.topicId||`review-${priority.subjectId}`,subjectId:priority.subjectId,topicId:priority.topicId,subjectName:priority.subjectName,topicName:priority.topicName,archived:Boolean(topic?.archived||subject?.archived),completed,estimatedMinutes,studyType:priority.studyType,action:priority.recommendedAction,risk,
      examImpact,retention:retention?.available?retention.score:null,retentionRisk:retention?.available?100-retention.score:null,mastery,masteryGap:mastery==null?null:100-mastery,coverage:subject?subjectProgress(subject):null,frequency:Math.max(0,100-daysSinceContact*5),daysSinceContact,recencyRisk:Math.min(100,daysSinceContact*5),reviewUrgency,planAlignment:priority.tipo==='continuar'?90:priority.tipo==='revisão'?80:55,trendRisk:trendPriorityRisk(priority.diagnosis?.trend),improvementPotential:mastery==null?50:100-mastery,effortEfficiency:Math.max(10,100-estimatedMinutes),reason:motivoPrioridade(priority)};
  });
}
function renderDiagnosisCenter(){
  const container=document.getElementById('diagnosisCenter');if(!container)return;
  const result=generateDiagnosis(intelligenceCandidates()),model=buildDiagnosisViewModel(result);
  if(model.state==='insufficient'){container.innerHTML='<div class="upcoming-empty">Ainda não há dados suficientes. Cadastre tópicos e registre atividades para gerar o diagnóstico.</div>';return}
  const list=(items,empty,formatter)=>items.length?items.slice(0,4).map(formatter).join(''):`<p class="diagnosis-empty">${empty}</p>`;
  const section=key=>model.sections.find(item=>item.key===key)?.items||[];
  container.innerHTML=`<div class="diagnosis-summary">
    <section><h4>Gargalos</h4>${list(section('bottlenecks'),'Nenhum gargalo relevante agora.',item=>`<article><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><span>Risco ${item.risk?.value??item.severity}/100 · confiança ${(item.risk?.confidenceLabel||'Baixa').toLowerCase()} · ${escapeHtml(item.reason)}${item.risk?.missingFactors?.length?' · '+item.risk.missingFactors.length+' fatores ausentes':''}</span></article>`)}</section>
    <section><h4>Oportunidades</h4>${list(section('opportunities'),'Configure pesos e esforço para revelar oportunidades.',item=>`<article><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><span>Retorno estimado ${item.opportunityScore}/100 · confiança ${item.confidenceLabel.toLowerCase()} · ${formatPlanMinutes(item.estimatedMinutes)}${item.missingFactors.includes('examImpact')?' · peso da prova ausente':''}</span></article>`)}</section>
    <section><h4>Revisões críticas e risco</h4>${list(section('risk'),'Nenhuma revisão crítica identificada.',item=>`<article><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><span>${item.reviewUrgency>0?'Urgência '+Math.round(item.reviewUrgency)+'/100':item.daysSinceContact+' dias sem contato'}</span></article>`)}</section>
    <section><h4>Foco da semana</h4>${list(section('focus'),'Sem distribuição confiável.',item=>`<article><strong>${escapeHtml(item.subjectName)}</strong><span>${item.percentage}% do foco recomendado</span></article>`)}</section>
  </div><p class="confidence-note">Diagnóstico estimado a partir dos registros disponíveis; não representa certeza de resultado.</p>`;
}
function renderStudyRecommendation(){
  const container=document.getElementById('studyRecommendation');if(!container)return;
  const availableMinutes=Math.max(0,Math.round(metaHoursToday()*60));
  const previous=new Map(currentStudyRecommendations.map(item=>[item.id,item]));
  currentStudyRecommendations=recommendStudy(intelligenceCandidates(),{availableMinutes,excludedIds:[...dismissedRecommendationIds]}).map(item=>previous.get(item.id)||createRecommendationPresentation(item,{id:uid('recommendation'),shownAt:nowISO(),algorithmVersion:state.algorithmVersions.recommendations}));
  const item=currentStudyRecommendations[0];
  if(!item){container.innerHTML=`<div class="upcoming-empty">${availableMinutes<15?'Defina pelo menos 15 minutos na meta de hoje.':'Nenhuma recomendação compatível com o tempo e os dados atuais.'}</div>`;return}
  const factorLabels={examImpact:'Impacto na prova',retentionRisk:'Risco de retenção',masteryGap:'Lacuna de domínio',reviewUrgency:'Urgência da revisão',planAlignment:'Alinhamento com o plano',recencyRisk:'Tempo sem contato'};
  const contributionRows=Object.entries(item.contributions).map(([key,value])=>`<div><span>${escapeHtml(factorLabels[key]||key)}</span><strong>+${value}</strong></div>`).join('');
  const pending=state.recommendationFeedback.find(feedback=>feedback.completed&&feedback.useful===null),summary=summarizeRecommendationFeedback(state.recommendationFeedback);
  const outcome=pending?`<div class="recommendation-outcome"><strong>Esta recomendação ajudou?</strong><button class="btn small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(pending.recommendationId)}',true)">Sim</button><button class="btn ghost small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(pending.recommendationId)}',false)">Não</button></div>`:'';
  const history=summary.shown?`<small class="recommendation-history">Histórico: ${summary.acceptanceRate}% aceitas · ${summary.completionRate??0}% concluídas${summary.rated?` · ${summary.usefulnessRate}% úteis`:''}</small>`:'';
  container.innerHTML=`${outcome}<div class="study-recommendation"><div><span class="recommendation-rank">Recomendação principal · ${item.score}/100</span><h4>${escapeHtml(item.action||'Estudar agora')}</h4><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><p>${formatPlanMinutes(item.estimatedMinutes)} · confiança ${escapeHtml(item.confidence)}</p><ul>${item.reasons.map(reason=>`<li>${escapeHtml(reason)}</li>`).join('')}</ul><details class="recommendation-explanation"><summary>Por que esta pontuação?</summary><div class="recommendation-contributions">${contributionRows}<div class="recommendation-total"><span>Prioridade final</span><strong>${item.score}/100</strong></div></div>${item.missingFactors.length?`<small>${item.missingFactors.length} fator${item.missingFactors.length===1?'':'es'} sem dados; os pesos disponíveis foram redistribuídos.</small>`:''}</details>${history}</div><div class="recommendation-actions"><button class="btn" data-delegated-click="startStudyRecommendation('${escapeAttr(item.id)}')">▶ Iniciar agora</button><button class="btn ghost" data-delegated-click="dismissStudyRecommendation('${escapeAttr(item.id)}')">Trocar recomendação</button><button class="btn ghost" data-delegated-click="markRecommendationNotUseful('${escapeAttr(item.id)}')">Não foi útil</button></div></div>`;
}
function recordRecommendationFeedback(recommendation,{accepted,reasonSkipped=null}={}){return recordRecommendationDecision(state.recommendationFeedback,recommendation,{accepted,reasonSkipped,now:nowISO(),idGenerator:uid})}
function dismissStudyRecommendation(id){const recommendation=currentStudyRecommendations.find(item=>item.id===id);if(recommendation){recordRecommendationFeedback(recommendation,{accepted:false,reasonSkipped:'swapped'});scheduleSave()}dismissedRecommendationIds.add(id);renderStudyRecommendation()}
function markRecommendationNotUseful(id){const recommendation=currentStudyRecommendations.find(item=>item.id===id);if(recommendation){const feedback=recordRecommendationFeedback(recommendation,{accepted:false,reasonSkipped:'not_useful'});feedback.useful=false;scheduleSave()}dismissedRecommendationIds.add(id);renderStudyRecommendation()}
function rateRecommendationOutcome(recommendationId,useful){if(rateRecommendationFeedback(state.recommendationFeedback,recommendationId,{useful,ratedAt:nowISO()})){scheduleSave();renderStudyRecommendation();showToast('Obrigado. Esse retorno melhora a avaliação das recomendações.')}}
function startStudyRecommendation(id){
  const recommendation=currentStudyRecommendations.find(item=>item.id===id);if(!recommendation)return;
  recordRecommendationFeedback(recommendation,{accepted:true});
  let plan=todayDailyStudyPlan();if(!plan){plan={id:uid('plan'),date:todayISO(),availableMinutes:Math.round(metaHoursToday()*60),plannedMinutes:0,flexMinutes:0,createdAt:nowISO(),updatedAt:nowISO(),items:[]};state.dailyPlans.push(plan)}
  let item=plan.items.find(candidate=>candidate.topicId===recommendation.topicId&&!['completed','skipped'].includes(candidate.status));
  if(item)item.recommendationId=recommendation.recommendationId;
  if(!item){item={id:uid('plan-item'),subjectId:recommendation.subjectId,topicId:recommendation.topicId,subjectName:recommendation.subjectName,topicName:recommendation.topicName,type:recommendation.studyType||'study',plannedMinutes:recommendation.estimatedMinutes,executedSeconds:0,status:'planned',sessionIds:[],score:recommendation.score,tier:recommendation.score>=70?'Alta':recommendation.score>=40?'Média':'Baixa',position:plan.items.length+1,statusIcon:'🎯',statusLabel:'Recomendação inteligente',reason:recommendation.reasons.join(' · '),action:recommendation.action,recommendedQuestions:0,originalDate:todayISO(),currentDate:todayISO(),rescheduleCount:0,skippedReason:null,recommendationId:recommendation.recommendationId,createdAt:nowISO()};plan.items.push(item);plan.plannedMinutes+=item.plannedMinutes;plan.updatedAt=nowISO();scheduleSave()}
  startPlannedActivity(item.id);
}

let replanPreview=null;
function calculateReplanPreview(){
  const start=startOfWeek(todayISO()),end=addDays(start,6),futureDays=[];
  for(let date=addDays(todayISO(),1);date<=end;date=addDays(date,1)){const capacity=metaHoursForDate(date)*60;const planned=state.dailyPlans.filter(plan=>plan.date===date).reduce((sum,plan)=>sum+(plan.items||[]).reduce((n,item)=>n+(Number(item.plannedMinutes)||0),0),0);futureDays.push({date,availableMinutes:Math.max(0,capacity-planned)})}
  replanPreview=buildReplanProposal({plans:state.dailyPlans.filter(plan=>plan.date>=start&&plan.date<=todayISO()),periodStart:start,periodEnd:end,futureDays});renderWeeklyReplan();
}
function clearReplanPreview(){replanPreview=null;renderWeeklyReplan()}
function confirmReplan(){
  if(!replanPreview||replanPreview.state!=='proposal')return;const operationId=uid('replan-operation'),appliedAt=nowISO(),result=applyReplan({dailyPlans:state.dailyPlans,proposal:replanPreview,operationId,now:appliedAt,idGenerator:uid});
  state.planAdjustments.push({...structuredCloneSafe(replanPreview),id:uid('plan-adjustment'),operationId,confirmedAt:appliedAt,appliedAt,status:'applied',changes:result.changes,undoneAt:null});replanPreview=null;scheduleSave();renderWeeklyReplan();renderPlanoHoje();showToast(`${pluralize(result.createdItems,'atividade')} redistribuída${result.createdItems===1?'':'s'} para os próximos dias.`)
}
function undoPlanAdjustment(id){
  const adjustment=state.planAdjustments.find(item=>item.id===id);if(!adjustment||adjustment.undoneAt)return;const result=undoReplan({dailyPlans:state.dailyPlans,adjustment});adjustment.status=result.complete?'undone':'partially_undone';adjustment.undoneAt=result.complete?nowISO():null;adjustment.protectedItems=result.protectedItems;scheduleSave();renderWeeklyReplan();renderPlanoHoje();showToast(result.protectedItems.length?'Itens já executados foram preservados; os demais retornaram à origem.':'Redistribuição desfeita com segurança.')
}
function renderWeeklyReplan(){
  const container=document.getElementById('weeklyReplan');if(!container)return;
  const latest=[...state.planAdjustments].sort((a,b)=>(b.confirmedAt||'').localeCompare(a.confirmedAt||''))[0];
  if(!replanPreview){container.innerHTML=`${latest?`<div class="confirmed-plan-note"><strong>Último ajuste ${latest.undoneAt?'desfeito':'aplicado'}</strong><span>${formatPlanMinutes(latest.redistributedMinutes)} redistribuídos · ${formatPlanMinutes(latest.discardedMinutes)} sem capacidade</span></div>`:''}<div class="study-plan-actions"><button class="btn" data-delegated-click="calculateReplanPreview()">Analisar execução da semana</button>${latest&&!latest.undoneAt&&latest.status!=='undone'&&latest.changes?.length?`<button class="btn ghost" data-delegated-click="undoPlanAdjustment('${latest.id}')">Desfazer redistribuição</button>`:''}</div>`;return}
  if(replanPreview.state==='balanced'){container.innerHTML='<div class="upcoming-empty">Não há déficit de execução nos planos registrados nesta semana.</div><button class="btn ghost small" data-delegated-click="clearReplanPreview()">Fechar</button>';return}
  const allocationByDate=new Map();replanPreview.allocations.forEach(item=>allocationByDate.set(item.date,(allocationByDate.get(item.date)||0)+item.minutes));const allocations=[...allocationByDate].map(([date,minutes])=>`<div><strong>${formatDatePt(date)}</strong><span>+ ${formatPlanMinutes(minutes)}</span></div>`).join('');
  container.innerHTML=`<div class="study-plan-summary"><div><strong>${formatPlanMinutes(replanPreview.plannedMinutes)}</strong><span>Planejado</span></div><div><strong>${formatPlanMinutes(replanPreview.executedMinutes)}</strong><span>Executado</span></div><div><strong>${formatPlanMinutes(replanPreview.deficitMinutes)}</strong><span>Déficit</span></div><div><strong>${formatPlanMinutes(replanPreview.redistributedMinutes)}</strong><span>Redistribuição possível</span></div></div><div class="replan-allocations">${allocations||'<span>Sem capacidade restante nesta semana.</span>'}</div>${replanPreview.discardedMinutes?`<p class="confidence-note">${formatPlanMinutes(replanPreview.discardedMinutes)} não cabem na disponibilidade restante e não serão acumulados automaticamente.</p>`:''}<div class="study-plan-actions"><button class="btn" data-delegated-click="confirmReplan()">Confirmar redistribuição</button><button class="btn ghost" data-delegated-click="clearReplanPreview()">Cancelar</button></div>`;
}

/* ===== PLANO DE HOJE ===== */

function formatPlanMinutes(minutes){
  const value=Math.max(0,Math.round(Number(minutes)||0));
  if(value<60) return value+'min';
  const hours=Math.floor(value/60);
  const rest=value%60;
  return hours+'h'+(rest?String(rest).padStart(2,'0'):'');
}
function buildDailyStudyPlan(priorities,availableMinutes){
  let remaining=Math.max(0,Math.round(Number(availableMinutes)||0));
  const items=[];
  for(const priority of priorities.slice(0,5)){
    if(remaining<15) break;
    const desired=Math.max(15,Math.min(60,Math.round(Number(priority.estimatedMinutes)||30)));
    let minutes=Math.min(desired,remaining);
    if(remaining-minutes>0&&remaining-minutes<15) minutes=remaining;
    items.push({...priority,minutes});
    remaining-=minutes;
    if(remaining<=0) break;
  }
  return {items,plannedMinutes:items.reduce((sum,item)=>sum+item.minutes,0),flexMinutes:remaining};
}
function materializeDailyStudyPlan(priorities,availableMinutes){
  const calculated=buildDailyStudyPlan(priorities,availableMinutes);
  if(!calculated.items.length) return null;
  const createdAt=nowISO();
  const plan={
    id:uid('plan'),date:todayISO(),availableMinutes,plannedMinutes:calculated.plannedMinutes,
    flexMinutes:calculated.flexMinutes,createdAt,updatedAt:createdAt,items:calculated.items.map((item,index)=>({
      id:uid('plan-item'),subjectId:item.subjectId||null,topicId:item.topicId||null,
      subjectName:item.subjectName||getSubjectName(item.subjectId),topicName:item.topicName||getTopicName(item.topicId),
      type:item.studyType||'study',plannedMinutes:item.minutes,executedSeconds:0,status:'planned',sessionIds:[],
      score:Number(item.score)||0,tier:item.tier||'Baixa',position:index+1,
      statusIcon:item.diagnosis?.statusIcon||PRIORITY_TIER_EMOJI[item.tier]||'📌',
      statusLabel:item.diagnosis?.status||('Prioridade '+(index+1)),reason:motivoPrioridade(item),
      action:item.recommendedAction||'Estudar o tópico',recommendedQuestions:Number(item.recommendedQuestions)||0,
      originalDate:todayISO(),currentDate:todayISO(),rescheduleCount:0,skippedReason:null,recommendationId:null,
      createdAt
    }))
  };
  state.dailyPlans.push(plan);
  scheduleSave();
  return plan;
}
function todayDailyStudyPlan(){
  return state.dailyPlans.find(plan=>plan.date===todayISO())||null;
}
function ensureTodayDailyStudyPlan(priorities,availableMinutes){
  return todayDailyStudyPlan()||materializeDailyStudyPlan(priorities,availableMinutes);
}
function planItemStatusLabel(status){
  return ({planned:'Planejada',in_progress:'Em andamento',partial:'Parcial',completed:'Concluída',deferred:'Adiada',replaced:'Substituída',skipped:'Ignorada'})[status]||'Planejada';
}
function renderPlanoHoje(){
  const container=document.getElementById('planoHojeContent');
  if(!container) return;
  const priorities=computeStudyPriorities();
  const availableMinutes=Math.max(0,Math.round(metaHoursToday()*60));
  const plan=ensureTodayDailyStudyPlan(priorities,availableMinutes);

  if(!plan&&priorities.length===0){
    container.innerHTML='<div class="upcoming-empty">Nada pendente hoje — todos os tópicos concluídos e sem revisões em aberto. 🎉</div>';
    return;
  }
  if(!plan){
    container.innerHTML='<div class="upcoming-empty">Defina uma meta diária de pelo menos 15 minutos para montar o plano.</div>';
    return;
  }

  const listaHtml=plan.items.map(item=>{
    const progress=item.plannedMinutes>0?Math.min(100,Math.round(item.executedSeconds/(item.plannedMinutes*60)*100)):0;
    const active=state.activeTimer.planItemId===item.id&&state.activeTimer.isRunning;
    const canStart=!['completed','deferred','replaced','skipped'].includes(item.status)&&!active;
    return `
    <div class="plano-item ${active?'is-active':''} ${item.status==='completed'?'is-completed':''}">
      <div class="plano-item-head">${escapeHtml(item.statusIcon)} ${escapeHtml(item.statusLabel)} · ${item.score}/100</div>
      <div class="plano-item-title">${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</div>
      <div class="plano-item-reason">${escapeHtml(item.reason)}</div>
      <div class="plano-item-reason">⏱️ ${formatPlanMinutes(item.plannedMinutes)} · ${escapeHtml(item.action)}${item.recommendedQuestions?' · '+item.recommendedQuestions+' questões':''}</div>
      <div class="plano-item-progress" title="${progress}% executado"><span style="width:${progress}%"></span></div>
      <div class="plano-item-actions">
        ${canStart?`<button type="button" class="btn small" data-delegated-click="startPlannedActivity('${escapeAttr(item.id)}')">${item.executedSeconds>0?'▶ Continuar':'▶ Iniciar'}</button>`:''}
        <span class="plano-item-status">${active?'Cronômetro ativo':escapeHtml(planItemStatusLabel(item.status))} · ${formatDuration(item.executedSeconds)} executado</span>
      </div>
    </div>
  `}).join('');

  const executedSeconds=plan.items.reduce((sum,item)=>sum+(Number(item.executedSeconds)||0),0);
  const executionPct=plan.plannedMinutes>0?Math.min(100,Math.round(executedSeconds/(plan.plannedMinutes*60)*100)):0;

  container.innerHTML=`
    ${listaHtml}
    ${plan.flexMinutes>0?`<div class="plano-depois"><div class="plano-depois-label">Tempo flexível:</div><div class="plano-depois-item">⏱️ ${formatPlanMinutes(plan.flexMinutes)} para pausas, correção ou continuidade</div></div>`:''}
    <div class="plano-meta">
      <div class="plano-depois-label">Planejamento:</div>
      <div class="plano-depois-item">⏱️ ${formatPlanMinutes(plan.plannedMinutes)} planejados · ${formatDuration(executedSeconds)} executado (${executionPct}%)</div>
    </div>
  `;
}

function renderMetasHoje(){
  const container = document.getElementById('hojeMetas');
  if(!container) return;
  const today = todayISO();

  const topicosHoje = uniqueTopicsCompletedBetween(today,today);
  const metaTopicosHoje = Math.max(1, Math.round(state.metas.semanal / 7));

  const questoesHoje = state.questoes.filter(q => q.date === today).reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const metaQuestoesHoje = Math.max(1, Math.round(state.metas.questoesSemanal / 7));

  const revisoesHoje = getRevisoesUnificadas().filter(r => r.date === today);
  const revisoesConcluidasHoje = revisoesHoje.filter(r => r.status === 'Concluído').length;
  const tempoHoje = segundosEstudadosHoje();
  const metaTempo = metaHoursToday()*3600;
  const pctTempo = metaTempo > 0 ? Math.round((tempoHoje/metaTempo)*100) : 0;

  container.innerHTML = `
    <div class="metas-hoje-grid">
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Tópicos concluídos hoje</div>
        <div class="meta-hoje-value">${topicosHoje} <span>/ ${metaTopicosHoje}</span></div>
      </div>
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Questões resolvidas hoje</div>
        <div class="meta-hoje-value">${questoesHoje} <span>/ ${metaQuestoesHoje}</span></div>
      </div>
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Revisões de hoje concluídas</div>
        <div class="meta-hoje-value">${revisoesConcluidasHoje} <span>/ ${revisoesHoje.length}</span></div>
      </div>
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">⏱️ Tempo estudado hoje</div>
        <div class="meta-hoje-time">
          <div class="meta-hoje-time-main">
            <div class="meta-hoje-time-value">${formatDuration(tempoHoje)}</div>
            <div class="meta-hoje-time-target">de ${formatHoras(metaHoursToday())} · ${pctTempo}%</div>
          </div>
          <label class="meta-hoje-time-goal">
            <span>Meta diária</span>
            <input type="number" min="0" step="0.25" value="${metaHoursToday()}"
              data-delegated-blur="updateMetaHoursDay(parseLocalDate(todayISO()).getDay(),this.value)" title="Editar a meta de hoje" aria-label="Meta de horas de hoje">
          </label>
        </div>
      </div>
    </div>
  `;
}

/* ===== DASHBOARD DE APROVAÇÃO ===== */
function clampScore(value){ return Math.max(0,Math.min(100,Math.round(Number(value)||0))); }
function average(values){ return values.length ? values.reduce((sum,n)=>sum+n,0)/values.length : 0; }

function approvalSimuladosMetric(){
  const completed = state.simulados
    .filter(sim=>simuladoEffectiveCounts(sim).total>0)
    .sort((a,b)=>(a.date||'').localeCompare(b.date||''))
    .slice(-5);
  if(completed.length===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem simulados concluídos'};
  let weighted=0,weights=0,totalQuestions=0;
  completed.forEach((sim,index)=>{
    const weight=index+1;
    weighted+=simuladoNota(sim)*weight;
    weights+=weight;
    totalQuestions+=simuladoEffectiveCounts(sim).total;
  });
  const raw=weighted/weights;
  const confidence=Math.min(1,(completed.length/4)*0.7+(totalQuestions/300)*0.3);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:`${completed.length} simulado${completed.length===1?'':'s'} · média recente ${Math.round(raw)}%`};
}

function approvalAcertosMetric(){
  const total=state.questoes.reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const correct=state.questoes.reduce((sum,q)=>sum+(Number(q.correct)||0),0);
  if(total===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem questões registradas'};
  const raw=(correct/total)*100;
  const confidence=Math.min(1,total/300);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:`${total} questões · acerto bruto ${Math.round(raw)}%`};
}

function approvalEditalMetric(){
  const topics=activeTopics();
  if(topics.length===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem tópicos cadastrados'};
  const concluded=topics.filter(t=>t.status==='Concluído').length;
  const raw=(concluded/topics.length)*100;
  const subjectsWithTopics=activeSubjects().filter(s=>s.topics.some(t=>!t.archived)).length;
  const confidence=Math.min(1,(topics.length/40)*0.55+(subjectsWithTopics/5)*0.45);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:`${concluded} de ${topics.length} tópicos concluídos`};
}

function approvalDominioMetric(){
  const topics=activeTopics();
  if(topics.length===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem tópicos ativos'};
  const values=topics.map(topic=>topicMasteryIndex(topic.subjectId,topic.id));
  const evidenced=values.filter(item=>item.confidence>0);
  if(evidenced.length===0) return {score:50,confidence:0,available:false,raw:null,detail:'Ainda não há evidências de domínio'};
  const weightTotal=evidenced.reduce((sum,item)=>sum+Math.max(0.15,item.confidence),0);
  const raw=evidenced.reduce((sum,item)=>sum+item.score*Math.max(0.15,item.confidence),0)/weightTotal;
  const coverage=evidenced.length/topics.length;
  const evidence=evidenced.reduce((sum,item)=>sum+item.confidence,0)/evidenced.length;
  const confidence=Math.min(1,coverage*0.55+evidence*0.45);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:Math.round(raw)+'/100 em '+evidenced.length+' de '+topics.length+' tópicos'};
}

function approvalRevisoesMetric(){
  const today=todayISO();
  const due=getRevisoesUnificadas().filter(r=>r.date&&r.date<=today);
  if(due.length===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem revisões vencidas até hoje'};
  const completed=due.filter(r=>r.status==='Concluído').length;
  const pending=due.filter(r=>r.status!=='Concluído');
  const severity=pending.reduce((sum,r)=>{
    const daysLate=Math.max(0,-(diasParaRevisao(r.date)||0));
    return sum+Math.min(1,daysLate/14);
  },0);
  const raw=Math.max(0,(completed/due.length)*100-(severity/due.length)*20);
  const confidence=Math.min(1,due.length/10);
  const evidence=Math.max(0.4,confidence);
  return {score:clampScore(50+(raw-50)*evidence),confidence,available:true,raw,detail:`${completed} de ${due.length} revisões em dia`};
}

function approvalTendenciaMetric(){
  const simulations=state.simulados
    .filter(sim=>simuladoEffectiveCounts(sim).total>0)
    .sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  if(simulations.length<2) return {score:50,confidence:0,available:false,raw:null,detail:'São necessários pelo menos 2 simulados'};
  const windowSize=Math.min(3,Math.floor(simulations.length/2));
  const previous=simulations.slice(-(windowSize*2),-windowSize).map(simuladoNota);
  const recent=simulations.slice(-windowSize).map(simuladoNota);
  const variation=average(recent)-average(previous);
  const raw=clampScore(50+variation*2);
  const confidence=Math.min(1,(simulations.length-1)/5);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:`Variação recente ${variation>=0?'+':''}${Math.round(variation*10)/10} p.p.`};
}

function approvalPrazoMetric(){
  const ritmo=computeRitmo();
  if(!state.examDate) return {score:50,confidence:0,available:false,raw:null,detail:'Data da prova não definida'};
  if(ritmo.status==='completo') return {score:100,confidence:1,available:true,raw:100,detail:'Cobertura cadastrada concluída'};
  if(ritmo.status!=='ok'||!ritmo.comparativo) return {score:50,confidence:0.2,available:false,raw:null,detail:'Ritmo recente insuficiente para estimar'};
  if(ritmo.comparativo==='no-prazo'){
    const slack=ritmo.daysToExam-ritmo.daysNeeded;
    const raw=clampScore(70+Math.min(30,Math.max(0,slack)));
    return {score:raw,confidence:1,available:true,raw,detail:`Previsão com ${slack} dia${slack===1?'':'s'} de folga`};
  }
  const delay=ritmo.daysNeeded-ritmo.daysToExam;
  const raw=clampScore(60-Math.min(60,Math.max(0,delay)*2));
  return {score:raw,confidence:1,available:true,raw,detail:`Previsão ${delay} dia${delay===1?'':'s'} após a prova`};
}

function scoreSimulados(metrics){ return (metrics||computeApprovalMetrics()).simulados.score; }
function scoreAcertos(metrics){ return (metrics||computeApprovalMetrics()).acertos.score; }
function scoreEdital(metrics){ return (metrics||computeApprovalMetrics()).edital.score; }
function scoreDominio(metrics){ return (metrics||computeApprovalMetrics()).dominio.score; }
function scoreRevisoes(metrics){ return (metrics||computeApprovalMetrics()).revisoes.score; }
function scoreTendencia(metrics){ return (metrics||computeApprovalMetrics()).tendencia.score; }
function scorePrazo(metrics){ return (metrics||computeApprovalMetrics()).prazo.score; }

function readinessFactors(metrics){
  const m=metrics||computeApprovalMetrics();
  return {coverage:m.edital,mastery:m.dominio,retention:m.retencao,consistency:m.consistencia,simulations:m.simulados};
}
function readinessResult(metrics){return calculateReadinessScore(readinessFactors(metrics),READINESS_WEIGHTS)}
function indiceProntidao(metrics){
  return readinessResult(metrics).value??0;
}
function confiancaAprovacao(metrics){
  const result=readinessResult(metrics);
  return {value:result.confidence,nivel:result.confidenceLabel};
}
function projectPerformance(metrics){
  const m=metrics||computeApprovalMetrics();
  const sources=[
    {metric:m.simulados,weight:0.45,label:'simulados'},
    {metric:m.acertos,weight:0.25,label:'questões'},
    {metric:m.dominio,weight:0.30,label:'domínio'}
  ].filter(source=>source.metric.available&&source.metric.raw!==null);
  if(sources.length===0) return {available:false,low:null,high:null,central:null,confidence:0,confidenceLabel:'Baixa',detail:'Registre questões, simulados e sessões para gerar uma faixa.',forecast30:{available:false,reason:'A faixa atual ainda não possui dados suficientes.'}};
  let weighted=0,totalWeight=0;
  sources.forEach(source=>{
    const evidenceWeight=source.weight*Math.max(0.2,source.metric.confidence);
    weighted+=source.metric.raw*evidenceWeight;
    totalWeight+=evidenceWeight;
  });
  let central=weighted/totalWeight;
  if(m.tendencia.available) central+=(m.tendencia.score-50)*0.08;
  central=Math.max(0,Math.min(100,central));
  const sourceCoverage=sources.reduce((sum,source)=>sum+source.weight,0);
  const evidence=sources.reduce((sum,source)=>sum+source.metric.confidence*source.weight,0)/sourceCoverage;
  const confidence=Math.min(1,evidence*0.75+sourceCoverage*0.25);
  const result=buildPerformanceForecast({currentValue:central,currentConfidence:confidence,targetScore:state.metas.metaAprovacao,observations:performanceForecastObservations()});
  const {low,high}=result.currentBand;
  return {
    available:true,low,high,central:result.currentBand.central,confidence,
    confidenceLabel:result.currentBand.confidenceLabel,gap:result.gap,movingAverage:result.movingAverage,forecast30:result.forecast30,evidence:result.evidence,
    detail:'Base: '+sources.map(source=>source.label).join(', ')+' · margem ajustada pela confiança'
  };
}

function performanceForecastObservations(){
  return Array.from({length:12},(_,index)=>getWeekRange(11-index)).map(({start,end})=>{
    const questions=validQuestionRecords().filter(item=>item.date>=start&&item.date<=end);
    let total=questions.reduce((sum,item)=>sum+(Number(item.resolved)||0),0);
    let correct=questions.reduce((sum,item)=>sum+(Number(item.correct)||0),0);
    state.simulados.filter(item=>item.date>=start&&item.date<=end).forEach(item=>{const counts=simuladoEffectiveCounts(item);total+=counts.total;correct+=counts.correct});
    return {date:end,value:accuracyFromCounts(correct,total),sampleSize:total};
  });
}

function gerarDiagnosticoAprovacao(metrics){
  const m=metrics||computeApprovalMetrics();
  const icons={positive:'✅',warning:'⚠️',info:'ℹ️'};
  return buildApprovalSignals(m,{target:state.metas.metaAprovacao}).map(item=>`${icons[item.level]} ${item.text}`);
}
function topicRetentionScore(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found)return {score:0,raw:null,confidence:0,confidenceLabel:'Baixa',available:false,detail:'Tópico não encontrado'};
  const today=todayISO(),due=state.reviewAgenda.filter(r=>(r.topicId||r.topicRef)===topicId&&r.date&&r.date<=today);
  const done=due.filter(r=>r.status==='Concluído'&&r.completedAt);
  const onTime=done.filter(r=>localDateFromTimestamp(r.completedAt)<=addDays(r.date,1)).length;
  const reviewRate=due.length?onTime/due.length*100:50,cutoff=addDays(today,-59);
  const questions=validQuestionRecords().filter(q=>q.topicId===topicId&&q.date>=cutoff&&q.date<=today);
  const resolved=questions.reduce((n,q)=>n+(Number(q.resolved)||0),0),correct=questions.reduce((n,q)=>n+(Number(q.correct)||0),0);
  const accuracy=resolved?correct/resolved*100:50,dates=done.map(r=>localDateFromTimestamp(r.completedAt)).filter(Boolean).sort();
  const lastReview=dates[dates.length-1]||localDateFromTimestamp(found.topic.lastReviewedAt)||null;
  const daysSince=lastReview?Math.max(0,-(diasParaRevisao(lastReview)??0)):null;
  const recency=daysSince===null?50:Math.max(0,100-Math.max(0,daysSince-1)*2.7);
  const confidence=Math.min(1,Math.min(1,due.length/4)*.4+Math.min(1,resolved/50)*.4+(lastReview?1:0)*.2);
  if(!due.length&&!resolved&&!lastReview)return {score:0,raw:null,confidence:0,confidenceLabel:'Baixa',available:false,detail:'Sem revisões ou questões vinculadas'};
  const raw=reviewRate*.45+accuracy*.35+recency*.20,score=clampScore(50+(raw-50)*(.35+confidence*.65));
  const detail=(due.length?onTime+' de '+due.length+' revisões no prazo':'sem revisões vencidas')+' · '+(resolved?Math.round(accuracy)+'% em '+resolved+' questões recentes':'sem questões recentes')+' · '+(daysSince===null?'sem revisão registrada':daysSince+'d desde a última revisão');
  return {score,raw,confidence,confidenceLabel:confidence>=.7?'Alta':confidence>=.35?'Média':'Baixa',available:true,detail};
}
function approvalRetencaoMetric(){
  const topics=activeTopics(),values=topics.map(t=>topicRetentionScore(t.subjectId,t.id)).filter(x=>x.available);
  if(!values.length)return {score:50,confidence:0,available:false,raw:null,detail:'Sem evidências de retenção por tópico'};
  const weight=values.reduce((n,x)=>n+Math.max(.15,x.confidence),0),raw=values.reduce((n,x)=>n+x.score*Math.max(.15,x.confidence),0)/weight;
  const confidence=Math.min(1,(values.reduce((n,x)=>n+x.confidence,0)/values.length)*.65+(values.length/topics.length)*.35);
  return {score:clampScore(50+(raw-50)*Math.max(.35,confidence)),confidence,available:true,raw,detail:Math.round(raw)+'% em '+values.length+' de '+topics.length+' tópicos'};
}
function approvalConhecimentoMetric(base){
  const parts=[];if(base.dominio.available)parts.push({v:base.dominio.raw??base.dominio.score,c:base.dominio.confidence,w:.65});if(base.edital.available)parts.push({v:base.edital.raw??base.edital.score,c:base.edital.confidence,w:.35});
  if(!parts.length)return {score:50,confidence:0,available:false,raw:null,detail:'Sem evidências suficientes de conhecimento'};
  const w=parts.reduce((n,x)=>n+x.w,0),raw=parts.reduce((n,x)=>n+x.v*x.w,0)/w,confidence=parts.reduce((n,x)=>n+x.c*x.w,0)/w;
  return {score:clampScore(50+(raw-50)*Math.max(.25,confidence)),confidence,available:true,raw,detail:'Domínio dos tópicos (65%) + cobertura do edital (35%)'};
}
function approvalConsistenciaMetric(){
  const today=todayISO(),byDate=studySecondsByDate(state.studySessions);
  const days=[];for(let n=27;n>=0;n--){const date=addDays(today,-n);days.push({targetSeconds:metaHoursForDate(date)*3600,studiedSeconds:byDate[date]||0})}
  const result=calculateGoalConsistency(days);
  if(!result.applicable)return {score:50,confidence:0,available:false,raw:null,detail:'Defina metas de horas para medir consistência'};
  const raw=result.value,confidence=Math.min(1,result.studiedDays/14);
  return {score:clampScore(50+(raw-50)*Math.max(.2,confidence)),confidence,available:result.available,raw,detail:result.achieved+' de '+result.applicable+' metas diárias atingidas nos últimos 28 dias'};
}
function computeApprovalMetrics(){
  const base={simulados:approvalSimuladosMetric(),acertos:approvalAcertosMetric(),edital:approvalEditalMetric(),dominio:approvalDominioMetric(),revisoes:approvalRevisoesMetric(),tendencia:approvalTendenciaMetric(),prazo:approvalPrazoMetric()};
  return {...base,conhecimento:approvalConhecimentoMetric(base),retencao:approvalRetencaoMetric(),questoes:base.acertos,consistencia:approvalConsistenciaMetric()};
}
function classificacaoAprovacao(score){
  if(score>=85)return {nivel:'🏆 Excelente preparação',cor:'ok',faixa:'85–100'};
  if(score>=70)return {nivel:'🟢 Preparação avançada',cor:'ok',faixa:'70–84'};
  if(score>=50)return {nivel:'🟠 Em desenvolvimento',cor:'warn',faixa:'50–69'};
  return {nivel:'🔴 Preparação inicial',cor:'danger',faixa:'0–49'};
}
function renderApprovalDashboard(){
  const el=document.getElementById('approvalDashboard');if(!el)return;
  const m=computeApprovalMetrics(),readiness=readinessResult(m),score=readiness.value??0,level=classificacaoAprovacao(score),confidence={value:readiness.confidence,nivel:readiness.confidenceLabel},projection=projectPerformance(m);
  const factors=[['Cobertura · 30%',m.edital,'coverage'],['Domínio · 25%',m.dominio,'mastery'],['Retenção · 20%',m.retencao,'retention'],['Consistência · 15%',m.consistencia,'consistency'],['Simulados · 10%',m.simulados,'simulations']];
  const approvalState=readiness.state==='empty'?'empty':readiness.state==='insufficient'||confidence.value<.35?'insufficient':'ready';
  const approvalLabel=approvalState==='empty'?'Aguardando dados':approvalState==='insufficient'?'Estimativa inicial':'Estimativa calculada';
  el.innerHTML=`<div class="metric-state metric-state--${approvalState}">${approvalLabel}${approvalState!=='ready'?'<span>Registre mais atividades para liberar uma classificação definitiva.</span>':''}</div><div class="kpi-grid">
    <div class="kpi-cell ${approvalState==='ready'?(level.cor==='danger'?'warn':level.cor):'neutral'}"><div class="n">${approvalState==='empty'?'—':score+'/100'}</div><div class="l">Índice de Prontidão</div></div>
    <div class="kpi-cell ${approvalState==='ready'?(level.cor==='danger'?'warn':level.cor):'neutral'}"><div class="n" style="font-size:18px">${approvalState==='ready'?level.nivel:approvalLabel}</div><div class="l">${approvalState==='ready'?'Nível de preparação · '+level.faixa:'Sem classificação definitiva'}</div></div>
    <div class="kpi-cell"><div class="n">${confidence.nivel}</div><div class="l">Confiança · ${Math.round(confidence.value*100)}%</div></div>
    <div class="kpi-cell"><div class="n">${m.retencao.available?Math.round(m.retencao.raw)+'%':'—'}</div><div class="l">Retenção média</div></div>
    <div class="kpi-cell"><div class="n">${projection.available?projection.low+'–'+projection.high+'%':'—'}</div><div class="l">Faixa estimada atual</div></div>
  </div>
  ${factors.map(([label,item])=>{const dataState=getMetricDataState(item);return `<div class="bar-row metric-row metric-row--${dataState}" title="${escapeAttr(item.detail)}"><div class="bar-label">${label}<small>${metricStateLabel(item)}</small></div><div class="bar-track"><div class="bar-fill" style="width:${dataState==='empty'?0:item.score}%"></div></div><div class="bar-pct">${dataState==='empty'?'—':item.score+'%'}</div></div>`}).join('')}
  ${projection.available?`<section class="performance-forecast" aria-label="Projeção de desempenho"><div><span class="section-eyebrow">PROJEÇÃO DE DESEMPENHO</span><strong>Faixa atual: ${projection.low}–${projection.high}%</strong><small>${projection.gap.minimum===0?'A meta de '+projection.gap.target+'% está dentro da faixa atual.':'Gap estimado até a meta: '+projection.gap.minimum+'–'+projection.gap.maximum+' p.p.'}</small></div><div><strong>${projection.forecast30.available?'Em 30 dias: '+projection.forecast30.low+'–'+projection.forecast30.high+'%':'Projeção de 30 dias aguardando dados'}</strong><small>${projection.forecast30.available?'Média móvel: '+projection.movingAverage+'% · tendência '+(projection.forecast30.slopePerWeek>=0?'+':'')+projection.forecast30.slopePerWeek+' p.p./semana · confiança '+projection.forecast30.confidenceLabel:escapeHtml(projection.forecast30.reason)}</small></div><p>${projection.evidence.observationCount} semanas · ${projection.evidence.sampleSize} questões/simulações na amostra. Estimativa baseada no histórico; não representa garantia nem efeito causal de mais horas.</p></section>`:''}
  <details class="readiness-explanation"><summary>Como este índice foi calculado?</summary><p>Os pesos são redistribuídos somente entre fatores com dados. Fatores ausentes reduzem a confiança e nunca recebem nota zero.</p><ul>${factors.map(([label,item,key])=>`<li><strong>${label}</strong>: ${item.available?item.score+'/100 · confiança '+Math.round(item.confidence*100)+'%':'aguardando dados'}${item.detail?' · '+escapeHtml(item.detail):''}</li>`).join('')}</ul></details>
  <div class="approval-scale"><span class="approval-scale-danger">🔴 0–49</span><span class="approval-scale-warn">🟠 50–69</span><span class="approval-scale-good">🟢 70–84</span><span class="approval-scale-great">🏆 85+</span></div>
  <ul class="upcoming-list" style="margin-top:14px">${gerarDiagnosticoAprovacao(m).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  renderTopicRetentionDashboard();
}
function renderTopicRetentionDashboard(){
  const el=document.getElementById('topicRetentionDashboard');if(!el)return;
  const baseRows=activeTopics().map(t=>({...t,r:topicRetentionScore(t.subjectId,t.id)})).filter(x=>x.r.available);
  const confidenceMatch=row=>retentionView.confidence==='all'||row.r.confidenceLabel.toLowerCase()===retentionView.confidence;
  const rows=baseRows.filter(row=>(!retentionView.subjectId||row.subjectId===retentionView.subjectId)&&confidenceMatch(row)).sort((a,b)=>{
    const score=retentionView.order==='desc'?b.r.score-a.r.score:a.r.score-b.r.score;
    return score||a.r.confidence-b.r.confidence||a.subjectName.localeCompare(b.subjectName)||a.name.localeCompare(b.name);
  });
  const toolbar=`<div class="retention-toolbar"><select aria-label="Filtrar retenção por disciplina" data-delegated-change="setRetentionFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${activeSubjects().map(subject=>`<option value="${escapeAttr(subject.id)}" ${retentionView.subjectId===subject.id?'selected':''}>${escapeHtml(subject.name)}</option>`).join('')}</select><select aria-label="Ordenar retenção" data-delegated-change="setRetentionFilter('order',this.value)"><option value="asc" ${retentionView.order==='asc'?'selected':''}>Menor retenção</option><option value="desc" ${retentionView.order==='desc'?'selected':''}>Maior retenção</option></select><select aria-label="Filtrar retenção por confiança" data-delegated-change="setRetentionFilter('confidence',this.value)"><option value="all">Todas as confianças</option><option value="alta" ${retentionView.confidence==='alta'?'selected':''}>Confiança alta</option><option value="média" ${retentionView.confidence==='média'?'selected':''}>Confiança média</option><option value="baixa" ${retentionView.confidence==='baixa'?'selected':''}>Confiança baixa</option></select></div>`;
  if(!rows.length){el.innerHTML=toolbar+'<div class="upcoming-empty">Nenhum tópico corresponde aos filtros atuais.</div>';return;}
  const visible=retentionShowAll?rows:rows.slice(0,8);
  const scoreCounts=new Map();rows.forEach(row=>scoreCounts.set(row.r.score,(scoreCounts.get(row.r.score)||0)+1));
  const repeated=[...scoreCounts.entries()].sort((a,b)=>b[1]-a[1])[0];
  const repeatedSummary=repeated&&repeated[1]>=4?`<div class="retention-pattern-note">${repeated[1]} tópicos apresentam retenção estimada em ${repeated[0]}%. Compare a confiança antes de interpretar o resultado como definitivo.</div>`:'';
  el.innerHTML=toolbar+repeatedSummary+visible.map(x=>{const c=x.r.score>=70?'ok':x.r.score>=50?'warn':'';return `<div class="retention-row" title="${escapeAttr(x.r.detail)}"><div class="retention-topic"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.subjectName)} · confiança ${x.r.confidenceLabel}</span></div><div class="retention-track"><div class="retention-fill ${c}" style="width:${x.r.score}%"></div></div><div class="retention-value">${x.r.score}%</div></div>`}).join('')+renderCollectionFooter({variant:'block',total:rows.length,visible:visible.length,step:8,label:'tópicos',showMoreAction:'showAllRetention()',showAllAction:'showAllRetention()',showLessAction:retentionShowAll?'resetRetentionLimit()':''});
}

function planStartDate(){
  const dates=[];
  state.studySessions.forEach(x=>{if(x.date)dates.push(x.date)});
  state.questoes.forEach(x=>{if(x.date)dates.push(x.date)});
  state.simulados.forEach(x=>{if(x.date)dates.push(x.date)});
  state.topicHistory.forEach(x=>{const d=eventLocalDate(x);if(d)dates.push(d)});
  state.subjects.forEach(subject=>{const d=localDateFromTimestamp(subject.createdAt);if(d)dates.push(d)});
  const valid=dates.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&(!state.examDate||d<=state.examDate)).sort();
  return valid[0]||todayISO();
}
function renderExamProgress(){
  const el=document.getElementById('examProgress');if(!el)return;
  if(!state.examDate){el.style.display='none';return}
  el.style.display='grid';
  const today=todayISO(),start=planStartDate(),exam=state.examDate;
  const diff=(a,b)=>Math.max(0,Math.round((parseLocalDate(b)-parseLocalDate(a))/86400000));
  const total=Math.max(1,diff(start,exam)),elapsed=Math.min(total,diff(start,today)),remaining=Math.max(0,diasParaRevisao(exam)??0),pct=Math.max(0,Math.min(100,Math.round(elapsed/total*100)));
  el.innerHTML=`<span class="exam-progress-label">Hoje</span><div class="exam-progress-track" role="progressbar" aria-label="Progresso até a prova" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="exam-progress-fill" style="width:${pct}%"></div></div><strong>${pct}%</strong><span class="exam-progress-days">${total} dias totais · ${elapsed} passaram · ${remaining} faltam</span>`;
}
function renderExamCountdown(){
  const input=document.getElementById('examDateInput');if(document.activeElement!==input)input.value=state.examDate||'';
  const fig=document.getElementById('examCountdownFigure');renderExamProgress();
  if(!state.examDate){fig.textContent='defina a data ao lado';fig.classList.remove('urgent');return}
  const dias=diasParaRevisao(state.examDate);fig.classList.toggle('urgent',dias!==null&&dias<=7);
  if(dias===null)fig.textContent='';else if(dias<0)fig.textContent='prova foi há '+pluralize(Math.abs(dias),'dia');else if(dias===0)fig.textContent='a prova é hoje!';else fig.textContent='faltam '+pluralize(dias,'dia')+' para a prova';
}
function navigateKpi(tab,filter){
  activateTab(tab);
  if(tab==='agenda'&&filter==='overdue'){const select=document.getElementById('agendaFilterStatus');select.value='Atrasadas';renderAgenda()}
  document.getElementById('panel-'+tab)?.scrollIntoView({behavior:'smooth',block:'start'});
}
function completeUnifiedReview(id,origin){
  if(origin==='Agenda de Revisões'){completeAgendaReview(id)}
  else{const item=state.calendar.find(x=>x.id===id);if(!item||item.status==='Concluído')return;updateCal(id,'status','Concluído')}
  showToast('Revisão concluída e indicadores atualizados.');
}
function quickReviewButton(item,elId){
  if(!String(elId||'').startsWith('hoje')||item.status==='Concluído')return '';
  return `<button type="button" class="btn small quick-review-btn" data-delegated-click="completeUnifiedReview('${escapeAttr(item.id)}','${escapeAttr(item.origem)}')">✓ Revisar</button>`;
}
function renderCalTarefasHoje(elId){
  elId=elId||'calTarefasHoje';const today=todayISO(),items=getRevisoesUnificadas().filter(r=>r.date===today).sort((a,b)=>(a.subject||'').localeCompare(b.subject||''));
  const ul=document.getElementById(elId);if(!ul)return;
  if(!items.length){ul.innerHTML='<li class="upcoming-empty">Nenhuma tarefa para hoje. 🎉</li>';return}
  ul.innerHTML=items.map(x=>`<li><span class="dias-pill dias-hoje" style="margin-right:6px">hoje</span><span style="flex:1">${escapeHtml(x.subject||'—')} · ${escapeHtml(unifiedItemLabel(x))} <span class="item-origin">(${x.origem})</span></span><span class="subject-progress-pill">${escapeHtml(x.status)}</span>${quickReviewButton(x,elId)}</li>`).join('');
}
function renderCalAtrasadas(elId){
  elId=elId||'calAtrasadas';const today=todayISO(),items=getRevisoesUnificadas().filter(r=>r.date&&r.date<today&&r.status!=='Concluído').sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const ul=document.getElementById(elId);if(!ul)return;
  if(!items.length){ul.innerHTML='<li class="upcoming-empty">Nenhuma revisão atrasada. Tudo em dia!</li>';return}
  const groups=new Map();items.forEach(item=>{if(!groups.has(item.date))groups.set(item.date,[]);groups.get(item.date).push(item)});
  const entries=[...groups.entries()],limit=overdueGroupLimits[elId]||3,visible=entries.slice(0,limit);
  if(!overdueExpansionInitialized.has(elId)){overdueExpandedDates[elId].add(entries[0][0]);overdueExpansionInitialized.add(elId)}
  ul.innerHTML=`<li class="overdue-summary"><strong>${items.length} revisões atrasadas</strong><span>${entries.length} datas · mais antiga em ${formatDatePt(entries[0][0])}</span></li>`+visible.map(([date,dateItems])=>{const expanded=overdueExpandedDates[elId].has(date);return `<li class="overdue-group"><button type="button" class="overdue-group-title" aria-expanded="${expanded}" data-delegated-click="toggleOverdueDate('${elId}','${date}')"><span><strong>${formatDatePt(date)}</strong><small>${dateItems.length} revisão(ões) · ${Math.abs(diasParaRevisao(date)||0)} dias de atraso</small></span><span class="overdue-chevron" aria-hidden="true">›</span></button><ul ${expanded?'':'hidden'}>${dateItems.map(x=>`<li><span style="flex:1">${escapeHtml(x.subject||'—')} — ${escapeHtml(unifiedItemLabel(x))}<span class="item-origin">${x.origem}</span></span>${quickReviewButton(x,elId)}</li>`).join('')}</ul></li>`}).join('')+`<li class="overdue-list-footer">${renderCollectionFooter({variant:'block',total:entries.length,visible:visible.length,step:3,label:'datas',showMoreAction:`changeOverdueGroupLimit('${elId}',3)`,showAllAction:`showAllOverdueGroups('${elId}')`,showLessAction:limit>3?`resetOverdueGroupLimit('${elId}')`:''})}</li>`;
}
function renderKPIs(){
  const resolved=state.questoes.reduce((n,q)=>n+(Number(q.resolved)||0),0),accuracy=taxaAcertoGeral(),average=mediaSimulados(),late=revisoesAtrasadas(),target=state.metas.metaAprovacao;
  const hasResults=state.questoes.length+state.simulados.length>0;
  document.getElementById('kpiGrid').innerHTML=`
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('questoes')"><div class="n">${resolved}</div><div class="l">Questões resolvidas</div></button>
    <button type="button" class="kpi-cell kpi-link ${hasResults?(accuracy>=target?'ok':'warn'):''}" data-delegated-click="navigateKpi('questoes')"><div class="n">${accuracy}%</div><div class="l">Taxa de acerto</div></button>
    <button type="button" class="kpi-cell kpi-link" data-delegated-click="navigateKpi('questoes')"><div class="n">${average}%</div><div class="l">Média simulados</div></button>
    <button type="button" class="kpi-cell kpi-link ${late>0?'warn':''}" data-delegated-click="navigateKpi('agenda','overdue')"><div class="n">${late}</div><div class="l">Revisões atrasadas</div></button>
    <button type="button" class="kpi-cell kpi-link ${hasResults?(accuracy>=target?'ok':'warn'):''}" data-delegated-click="navigateKpi('metas')"><div class="n">${target}%</div><div class="l">Meta de aprovação</div></button>`;
}

/* ===== ESCAPE HELPERS ===== */
function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(str){ return escapeHtml(str); }

/* ===== EVENTOS DELEGADOS: ações declarativas, sem JavaScript inline ===== */
const DELEGATED_ACTIONS=new Set([
  'addAgendaRow','addBreakdownRow','addCalRow','addQuestaoRow','addSimuladoRow','addSubject','addTopic','applyTodayGoalToAllDays','archiveSubject','archiveTopic','clearWeekendGoals',
  'calculateStudyPlanPreview','clearStudyPlanPreview','confirmStudyPlan','calculateDailyPlanPreview','clearDailyPlanPreview','confirmDailyPlanPreview','undoLatestDailyPlanGeneration',
  'calculateReplanPreview','clearReplanPreview','confirmReplan','undoPlanAdjustment',
  'cancelAgendaEdit','cancelCalendarEdit','cancelQuestionEdit','cancelSimulationEdit','cancelStudySessionEdit','changeAgendaLimit','changeCalendarLimit','changeOverdueGroupLimit','changePerformanceLimit','changeSubjectTopicLimit','changeUpcomingLimit','clearSessionHistoryFilters','completeAgendaReview','completeCalendarItem','completeUnifiedReview','deleteAgendaRow',
  'deleteBreakdownRow','deleteCalRow','deleteMetaDisciplina','deleteQuestaoRow','deleteSimuladoRow','deleteStudySession','duplicateSubject',
  'editAgenda','editCalendarItem','editQuestion','editSimulation','editStudySession','focusStudyTimer','gerarAgendaAutomatica','moveSubject','navigateKpi','renameSubject','selectHeatmapDay','setHeatmapFilter','viewSelectedHeatmapSessions',
  'dismissIntelligentAlert','dismissStudyRecommendation','markRecommendationNotUseful','rateRecommendationOutcome','startStudyRecommendation',
  'requestPermanentSubjectDelete','requestPermanentTopicDelete','resetAdaptiveReviewDate','resetAgendaLimit','resetCalendarLimit','resetOverdueGroupLimit','resetPerformanceLimit','resetRetentionLimit','resetSubjectTopicLimit','resetUpcomingLimit','restoreSubject','restoreTopic','saveAgendaEdit','saveCalendarEdit','saveQuestionEdit','setPerformanceViewMode','setRadarSubject','setRetentionFilter','setSubjectTopicFilter',
  'saveSimulationEdit','saveStudySessionEdit','selectSessionHistoryDate','showAllOverdueGroups','showAllPerformance','showAllRetention','showAllSubjectTopics','showAllUpcoming','startPlannedActivity','toggleBreakdown','toggleNotes',
  'toggleCompletedReviews','toggleFilterPanel','toggleOverdueDate','toggleQuestionErrors','toggleSessionDay','toggleSessionDetails','toggleStreakActiveDays','toggleStreakExpanded','toggleSubject','updateAgenda','updateAgendaDraft','updateBreakdownRow','updateCal','updateCalendarDraft','updateMeta',
  'updateMetaDisciplina','updateMetaHoursDay','updateQuestionDraft','updateQuestionError','updateSessionHistoryFilter',
  'setErrorAnalysisFilter','updateSimulationDraft','updateStudySessionDraft','updateTopic','updateTopicStatus','updateTopicTags','updateTopicStrategy','updateExamBlueprint','updateExamSubject'
]);
const DELEGATED_ACTION_HANDLERS={
  addAgendaRow,addBreakdownRow,addCalRow,addQuestaoRow,addSimuladoRow,addSubject,addTopic,applyTodayGoalToAllDays,archiveSubject,archiveTopic,clearWeekendGoals,
  calculateStudyPlanPreview,clearStudyPlanPreview,confirmStudyPlan,calculateDailyPlanPreview,clearDailyPlanPreview,confirmDailyPlanPreview,undoLatestDailyPlanGeneration,
  calculateReplanPreview,clearReplanPreview,confirmReplan,undoPlanAdjustment,
  cancelAgendaEdit,cancelCalendarEdit,cancelQuestionEdit,cancelSimulationEdit,cancelStudySessionEdit,changeAgendaLimit,changeCalendarLimit,changeOverdueGroupLimit,changePerformanceLimit,changeSubjectTopicLimit,changeUpcomingLimit,clearSessionHistoryFilters,completeAgendaReview,completeCalendarItem,completeUnifiedReview,deleteAgendaRow,
  deleteBreakdownRow,deleteCalRow,deleteMetaDisciplina,deleteQuestaoRow,deleteSimuladoRow,deleteStudySession,duplicateSubject,
  editAgenda,editCalendarItem,editQuestion,editSimulation,editStudySession,focusStudyTimer,gerarAgendaAutomatica,moveSubject,navigateKpi,renameSubject,selectHeatmapDay,setHeatmapFilter,viewSelectedHeatmapSessions,
  dismissIntelligentAlert,dismissStudyRecommendation,markRecommendationNotUseful,rateRecommendationOutcome,startStudyRecommendation,
  requestPermanentSubjectDelete,requestPermanentTopicDelete,resetAdaptiveReviewDate,resetAgendaLimit,resetCalendarLimit,resetOverdueGroupLimit,resetPerformanceLimit,resetRetentionLimit,resetSubjectTopicLimit,resetUpcomingLimit,restoreSubject,restoreTopic,saveAgendaEdit,saveCalendarEdit,saveQuestionEdit,setPerformanceViewMode,setRadarSubject,setRetentionFilter,setSubjectTopicFilter,
  saveSimulationEdit,saveStudySessionEdit,selectSessionHistoryDate,showAllOverdueGroups,showAllPerformance,showAllRetention,showAllSubjectTopics,showAllUpcoming,startPlannedActivity,toggleBreakdown,toggleNotes,
  toggleCompletedReviews,toggleFilterPanel,toggleOverdueDate,toggleQuestionErrors,toggleSessionDay,toggleSessionDetails,toggleStreakActiveDays,toggleStreakExpanded,toggleSubject,updateAgenda,updateAgendaDraft,updateBreakdownRow,updateCal,updateCalendarDraft,updateMeta,
  updateMetaDisciplina,updateMetaHoursDay,updateQuestionDraft,updateQuestionError,updateSessionHistoryFilter,
  setErrorAnalysisFilter,updateSimulationDraft,updateStudySessionDraft,updateTopic,updateTopicStatus,updateTopicTags,updateTopicStrategy,updateExamBlueprint,updateExamSubject
};
function splitDelegatedArguments(source){
  const values=[]; let current='',quote=null,escaped=false,depth=0;
  for(const char of source){
    if(escaped){current+=char;escaped=false;continue}
    if(char==='\\'){current+=char;escaped=true;continue}
    if(quote){current+=char;if(char===quote)quote=null;continue}
    if(char==='\''||char==='"'){quote=char;current+=char;continue}
    if(char==='('){depth++;current+=char;continue}
    if(char===')'){depth--;current+=char;continue}
    if(char===','&&depth===0){values.push(current.trim());current='';continue}
    current+=char;
  }
  if(current.trim())values.push(current.trim());
  return values;
}
function delegatedArgument(expression,element){
  const value=expression.trim();
  if(value==='this.value')return element.value;
  if(value==='this.value||null')return element.value||null;
  if(value==='this.textContent')return element.textContent;
  if(value==='this')return element;
  if(value==='true')return true;
  if(value==='false')return false;
  if(value==='null')return null;
  if(value==='parseLocalDate(todayISO()).getDay()')return parseLocalDate(todayISO()).getDay();
  if(/^-?\d+(?:\.\d+)?$/.test(value))return Number(value);
  if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1).replace(/\\(['"\\])/g,'$1');
  throw new Error('Argumento de evento não permitido: '+value);
}
function dispatchDelegatedCode(code,event,element){
  const normalized=String(code||'').trim();
  if(!normalized)return;
  if(normalized==='event.stopPropagation()'){event.stopPropagation();return}
  if(normalized.startsWith('event.stopPropagation();')){event.stopPropagation();return dispatchDelegatedCode(normalized.slice(24),event,element)}
  if(normalized==='performanceSubjectId=this.value;renderQuestionAnalytics()'){performanceSubjectId=element.value;renderQuestionAnalytics();return}
  const listMatch=normalized.match(/^changeListLimit\('(questions|simulations|sessionDays)',(-?)(?:LIST_VIEW_STEPS\.\1|listViewState\.\1Visible),(renderQuestoes|renderSimulados|renderStudySessionsHistory)\)$/);
  if(listMatch){
    const delta=(listMatch[2]? -listViewState[`${listMatch[1]}Visible`] : LIST_VIEW_STEPS[listMatch[1]]);
    const renderers={renderQuestoes,renderSimulados,renderStudySessionsHistory};
    changeListLimit(listMatch[1],delta,renderers[listMatch[3]]); return;
  }
  const match=normalized.match(/^([A-Za-z_$][\w$]*)\((.*)\)$/s);
  if(!match||!DELEGATED_ACTIONS.has(match[1]))throw new Error('Ação de evento não permitida: '+normalized);
  const fn=DELEGATED_ACTION_HANDLERS[match[1]];
  if(typeof fn!=='function')throw new Error('Ação de evento indisponível: '+match[1]);
  fn(...(match[2].trim()?splitDelegatedArguments(match[2]).map(arg=>delegatedArgument(arg,element)):[]));
}
const DELEGATED_EVENT_TYPES=['click','change','input','blur'];
DELEGATED_EVENT_TYPES.forEach(type=>document.addEventListener(type,event=>{
  const key=`delegated${type[0].toUpperCase()+type.slice(1)}`,attribute=`data-${key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase())}`;
  const element=event.target?.closest?.(`[${attribute}]`); if(!element)return;
  try{dispatchDelegatedCode(element.dataset[key],event,element)}catch(error){console.error('Evento delegado bloqueado',error);showToast('Uma ação inválida foi bloqueada por segurança.')}
},type==='blur'));
/* ===== MASTER RENDER ===== */
function safeRenderSection(name,renderer){
  try{ renderer(); }
  catch(error){ console.error('Falha ao renderizar '+name,error); }
}
const RENDER_SCOPE_SECTIONS={
  dashboard:new Set(['dashboard de aprovação','controles do cronômetro','evolução do progresso','heatmap','conquistas','radar','visão geral','horas estudadas','histórico de sessões']),
  disciplinas:new Set(['disciplinas']),
  calendario:new Set(['indicadores do calendário','tarefas de hoje','tarefas atrasadas','filtros do calendário','calendário','calendário mensal']),
  agenda:new Set(['filtros da agenda','agenda']),
  questoes:new Set(['questões','análise de questões','simulados','gráfico de simulados','desempenho por disciplina']),
  metas:new Set(['metas','configuração estratégica','plano até a prova','metas de horas por dia','metas por disciplina','histórico de metas','ritmo']),
  hoje:new Set(['resumo executivo','central de diagnóstico','recomendação de estudo','replanejamento','prioridades','tarefas da aba hoje','atrasos da aba hoje','simulados planejados','metas de hoje','alertas','plano de hoje'])
};
function activeTabName(){return document.querySelector('.tab-btn.active')?.dataset.tab||'dashboard'}
function render(scope='all'){
  const sections=[
    ['indicadores',renderKPIs],
    ['dashboard de aprovação',renderApprovalDashboard],
    ['controles do cronômetro',populateTimerContextControls],
    ['cabeçalho',renderHeader],
    ['evolução do progresso',renderProgressChart],
    ['heatmap',renderHeatmap],
    ['conquistas',renderBadges],
    ['radar',renderRadarDisciplinas],
    ['visão geral',renderDashboard],
    ['horas estudadas',renderStudyHoursDashboard],
    ['histórico de sessões',renderStudySessionsHistory],
    ['disciplinas',renderSubjects],
    ['indicadores do calendário',renderCalIndicadores],
    ['tarefas de hoje',renderCalTarefasHoje],
    ['tarefas atrasadas',renderCalAtrasadas],
    ['filtros do calendário',renderCalendarFilters],
    ['calendário',renderCalendar],
    ['calendário mensal',renderMonthCalendar],
    ['filtros da agenda',renderAgendaFilters],
    ['agenda',renderAgenda],
    ['questões',renderQuestoes],
    ['análise de questões',renderQuestionAnalytics],
    ['simulados',renderSimulados],
    ['gráfico de simulados',renderSimuladosChart],
    ['desempenho por disciplina',renderDesempenhoDisciplina],
    ['metas',renderMetas],
    ['configuração estratégica',renderExamBlueprintConfig],
    ['plano até a prova',renderStudyPlanBuilder],
    ['metas de horas por dia',renderWeeklyHoursGoals],
    ['metas por disciplina',renderMetasPorDisciplina],
    ['histórico de metas',renderHistoricoMetas],
    ['ritmo',renderRitmo],
    ['resumo executivo',renderExecutiveSummary],
    ['central de diagnóstico',renderDiagnosisCenter],
    ['recomendação de estudo',renderStudyRecommendation],
    ['replanejamento',renderWeeklyReplan],
    ['prioridades',renderPrioridadeHoje],
    ['tarefas da aba hoje',()=>renderCalTarefasHoje('hojeTarefasHoje')],
    ['atrasos da aba hoje',()=>renderCalAtrasadas('hojeAtrasadas')],
    ['simulados planejados',renderSimuladosPlanejados],
    ['metas de hoje',renderMetasHoje],
    ['alertas',renderAlertasInteligentes],
    ['plano de hoje',renderPlanoHoje]
  ];
  const globalSections=new Set(['indicadores','cabeçalho']);
  const selected=scope==='all'?null:RENDER_SCOPE_SECTIONS[scope==='active'?activeTabName():scope];
  sections.filter(([name])=>!selected||globalSections.has(name)||selected.has(name)).forEach(([name,renderer])=>safeRenderSection(name,renderer));
  labelDynamicControls();
}
function persistAndRender(){
  render('active');
  scheduleSave();
}
function renderAll(){ render(); }

const historyLayoutMedia=window.matchMedia('(max-width:760px)');
historyLayoutMedia.addEventListener('change',()=>{
  renderQuestoes();
  renderSimulados();
  renderStudySessionsHistory();
  renderAgenda();
  renderCalendar();
});

/* ===== ATALHOS DE TECLADO ===== */
document.addEventListener('keydown', function(e){
  trapModalTab(e,[document.getElementById('reviewRatingOverlay'),document.getElementById('sessionModalOverlay'),document.getElementById('modalOverlay')]);
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const modifierPressed = isMac ? e.metaKey : e.ctrlKey;
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  const typingInField = ['INPUT','TEXTAREA','SELECT'].includes(activeTag) || document.activeElement?.isContentEditable;

  if(modifierPressed && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    document.getElementById('globalSearchInput').focus();
    return;
  }

  if(e.key === 'Escape'){
    document.getElementById('globalSearchInput').blur();
    document.getElementById('globalSearchResults').classList.remove('show');
    if(document.getElementById('reviewRatingOverlay').classList.contains('show')){
      e.preventDefault();closeReviewRating();return;
    }
    if(document.getElementById('sessionModalOverlay').classList.contains('show')){
      e.preventDefault();
      document.getElementById('sessionModalSkipBtn').click();
      return;
    }
    if(document.getElementById('modalOverlay').classList.contains('show')){
      e.preventDefault();
      document.getElementById('modalCancelBtn').click();
      return;
    }
    return;
  }

  if(!typingInField && /^[1-7]$/.test(e.key)){
    const tabs = ['dashboard','hoje','disciplinas','calendario','agenda','questoes','metas'];
    const idx = parseInt(e.key, 10) - 1;
    if(tabs[idx]){
      document.querySelector(`.tab-btn[data-tab="${tabs[idx]}"]`).click();
    }
  }
});

window.addEventListener('beforeunload', () => {if(!TEST_MODE&&!suppressBeforeUnloadSave)writeLocalState(JSON.stringify(state))});

setCalendarMobileView('month');
const initialTab = location.hash.replace('#','');
if(document.querySelector(`.tab-btn[data-tab="${initialTab}"]`)) activateTab(initialTab, false);

if(TEST_MODE){
  const pristineTestState=structuredCloneSafe(state);
  window.__EXTRATO_TEST__={
    CURRENT_SCHEMA_VERSION,STATUS_OPTIONS,DIFFICULTY_OPTIONS,APP_MODE,IS_DEMO_MODE,
    getState:()=>state,
    setState:value=>{state=migrateState(structuredCloneSafe(value));ensureStateDefaults();return state},
    resetState:()=>{state=structuredCloneSafe(pristineTestState);ensureStateDefaults();return state},
    migrateState:value=>migrateState(structuredCloneSafe(value)),validateBackupData,validateNormalizedBackup,
    startOfWeek,isSameWeek,addDays,diasParaRevisao,parseLocalDate,todayISO,localDateFromTimestamp,
    calculateAdaptiveInterval,adaptiveReviewSuggestion,
    syncQuestionFromStudySession,getSubjectDependencies,getTopicDependencies,
    computeApprovalMetrics,indiceProntidao,readinessResult,calculateReadinessScore,computeStudyPriorities,topicRetentionScore,
    sha256,rotateAutomaticBackup,StorageManager,structuredCloneSafe
  };
  ensureStateDefaults();restoreTimerFromState();render();
  const testScript=document.createElement('script');testScript.src='tests/tests.js';document.body.appendChild(testScript);
}else{
  bootstrapApplication({context:appContext,start:loadState,onError:error=>console.error('Falha na inicialização do aplicativo',error)});
}
