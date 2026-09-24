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
import {parseLocalDate} from './core/date-utils.js';
import {createAppContext} from './application/create-app-context.js';
import {bootstrapApplication} from './bootstrap/bootstrap-application.js';
import {registerApplicationLifecycle} from './bootstrap/register-lifecycle.js';
import {AGENDA_INTERVALS,DIFFICULTY_INTERVALS,REVIEW_RATINGS,calculateAdaptiveInterval,createAdaptiveReviewState,applyAdaptiveReviewRating} from './domain/reviews.js';
import {createDefaultState} from './state/defaults.js';
import {labelDynamicControls,trapModalTab} from './ui/accessibility.js';
import {renderCollectionFooter,renderGroupHeader} from './ui/list-components.js';
import {countActiveFilters,filterPanelLabel} from './ui/filter-panel.js';
import {filterStudySessions,groupStudySessionsByDate} from './ui/session-history.js';
import {calculateReadinessScore,READINESS_WEIGHTS} from './domain/analytics/readiness-score.js';
import {calculateTopicCoverage} from './domain/analytics/coverage.js';
import {calculateActivityStreak,calculateGoalConsistency} from './domain/analytics/consistency.js';
import {calculateWindowTrend,trendToRisk} from './domain/analytics/trends.js';
import {summarizeStudyRecords} from './domain/analytics/study-metrics.js';
import {normalizeTopicStrategy,normalizeExamBlueprint,normalizeAlgorithmVersions,EXAM_PRIORITIES} from './state/strategic.js';
import {buildExecutiveSummary} from './application/build-executive-summary.js';
import {analyzeErrors} from './domain/diagnostics/error-analysis.js';
import {buildErrorAnalysisViewModel} from './application/analytics/build-error-analysis-view-model.js';
import {renderErrorAnalysis} from './ui/renderers/error-analysis-renderer.js';
import {HEATMAP_METRICS,heatmapMetricLevel} from './domain/analytics/heatmap.js';
import {calculateSubjectRadar} from './domain/analytics/multidimensional-radar.js';
import {generateDiagnosis} from './application/generate-diagnosis.js';
import {recommendStudy} from './application/recommend-study.js';
import {buildStudyCandidates} from './application/build-study-candidates.js';
import {calculateTopicMastery,calculateTopicRetention} from './domain/analytics/topic-metrics.js';
import {PRIORITY_ALGORITHM_VERSION} from './domain/analytics/priority-score.js';
import {calculateReviewHealth} from './domain/analytics/review-health.js';
import {canStudy,needsMaintenance,prerequisiteBlockers} from './domain/study-eligibility.js';
import {createRecommendationPresentation,recordRecommendationDecision,completeRecommendationFeedback,rateRecommendationFeedback,summarizeRecommendationFeedback} from './application/recommendations/recommendation-feedback.js';
import {captureRecommendationBaseline,captureRecommendationSnapshot,measureRecommendationOutcome} from './application/recommendations/outcome-service.js';
import {buildRecommendationOutcomeViewModel} from './application/recommendations/build-recommendation-outcome-view-model.js';
import {buildStudyAction,recommendationActionKind,recommendationActionLabel,STUDY_ACTION_SOURCES} from './application/recommendations/recommendation-action.js';
import {createRecommendationController} from './application/recommendations/recommendation-controller.js';
import {buildHeatmapViewModel,buildDiagnosisViewModel,buildApprovalSignals} from './application/analytics/build-analytics-view-model.js';
import {calculateRiskScore} from './domain/diagnostics/risk-score.js';
import {buildStudyPlan} from './application/build-study-plan.js';
import {buildReplanProposal,applyReplan,undoReplan} from './application/replan-study.js';
import {buildDailyPlanProposal,applyDailyPlanProposal,undoDailyPlanGeneration} from './application/planning/distribute-study-plan.js';
import {createStudyPlanService} from './application/planning/study-plan-service.js';
import {createDailyPlanService} from './application/planning/daily-plan-service.js';
import {createReplanService} from './application/planning/replan-service.js';
import {createReplanController} from './application/planning/replan-controller.js';
import {buildTodayViewModel} from './application/planning/build-today-view-model.js';
import {applyAdaptivePlanningAdvice,buildAdaptivePlanningAdvice,resolveExamPhase} from './domain/planning/adaptive-planning.js';
import {renderAdaptiveAllocationAdvice,renderExamPhase,renderExamPhaseCompact} from './ui/renderers/adaptive-planning-renderer.js';
import {buildAchievementViewModel} from './application/achievements/build-achievement-view-model.js';
import {renderAchievementGroups} from './ui/renderers/achievement-renderer.js';
import {createSessionService} from './application/sessions/session-service.js';
import {normalizeStudySession} from './domain/sessions/study-session.js';
import {createRecordService} from './application/records/record-service.js';
import {createSubjectService} from './application/subjects/subject-service.js';
import {createExamImportService} from './application/subjects/exam-import-service.js';
import {EXAM_TAGS,CATALOG_VERSION,EXAM_SOURCES} from './domain/exams/exam-constants.js';
import {EXAM_PRESET_OPTIONS} from './domain/exams/exam-preset-options.js';
import {isTopicInExamScope,isCommonTopic,topicExamScopeLabel,normalizeExamTags} from './domain/exams/exam-scope.js';
import {classifyEvidenceScope,resolveExamEvidenceScope} from './domain/exams/exam-evidence-scope.js';
import {setActiveExamTags} from './application/exams/exam-scope-transition.js';
import {snapshotEvidenceScopes} from './application/exams/evidence-scope-migration.js';
import {createUiState,pickPersistentState} from './state/state-boundaries.js';
import {createExamImportState,resetExamImportState} from './features/exam-import/exam-import-state.js';
import {buildExamImportViewModel} from './features/exam-import/exam-import-view-model.js';
import {renderExamImport as renderExamImportView,syncExamSubjectCheckboxes as syncExamSubjectCheckboxesView} from './features/exam-import/exam-import-renderer.js';
import {createExamImportController} from './features/exam-import/exam-import-controller.js';
import {createNavigationController} from './ui/controllers/navigation-controller.js';
import {createModalController} from './ui/controllers/modal-controller.js';
import {createEditableCollectionController} from './ui/controllers/editable-collection-controller.js';
import {createPreferencesController} from './ui/controllers/preferences-controller.js';
import {createBackupController} from './ui/controllers/backup-controller.js';
import {createDelegatedEventsController} from './ui/controllers/delegated-events-controller.js';
import {createErrorBoundaryController} from './ui/controllers/error-boundary-controller.js';
import {createDemoController} from './ui/controllers/demo-controller.js';
import {createStructuredImportController} from './features/structured-import/structured-import-controller.js';
import {renderStructuredImport} from './features/structured-import/structured-import-renderer.js';
import {parseStructuredStudyContent,createStructuredContentImportService} from './application/subjects/structured-content-import.js';
import {createApplicationRenderer} from './ui/renderers/application-renderer.js';
import {createGoalService} from './application/goals/goal-service.js';
import {buildResultGoalsViewModel} from './application/goals/build-result-goals-view-model.js';
import {buildPeriodComparisonViewModel} from './application/analytics/build-period-comparison-view-model.js';
import {buildWeeklyAvailability} from './application/goals/weekly-availability.js';
import {buildPriorityViewModel} from './ui/view-models/priority-view-model.js';
import {buildStudyTimeViewModel} from './application/analytics/build-overview-view-model.js';
import {buildHeaderViewModel} from './application/analytics/build-header-view-model.js';
import {renderHeroHeader,renderCompactHeader} from './ui/renderers/header-renderer.js';
import {buildStudyTrack32ViewModel} from './application/analytics/build-studytrack32-view-model.js';
import {renderWeeklyClose,renderPeriodComparison,renderGapMap,renderDecisionHistory,renderPostSimulationReplan} from './ui/renderers/studytrack32-renderer.js';
import {dismissAlert,reconcileAlerts} from './application/alert-lifecycle.js';
import {buildIntelligentAlerts} from './domain/diagnostics/alerts.js';
import {buildPerformanceForecast} from './domain/forecasts/performance-forecast.js';
import {buildPerformanceScenarios} from './domain/forecasts/performance-scenarios.js';
import {buildRecommendationCalibration} from './domain/analytics/recommendation-calibration.js';
import {renderRecommendationCalibrationModel} from './ui/renderers/recommendation-calibration-renderer.js';
import {renderPerformanceScenarios} from './ui/renderers/performance-scenarios-renderer.js';
import {APP_MODES,readAppMode,enterDemoMode,exitDemoMode,resetDemoMode} from './application/demo/demo-mode.js';
import {generateDemoData} from './demo/demo-generator.js';
import {runStateMigrations,validateBackupEnvelope} from './storage/migration-service.js';
import {serializeBackup,backupFileName} from './storage/backup-service.js';
import {createAppRepositories} from './repositories/collection-repository.js';
import {createReviewService} from './application/reviews/review-service.js';
import {createReviewsController} from './ui/controllers/reviews-controller.js';
import {createReviewViewModel} from './ui/view-models/review-view-model.js';
import {renderReviewRead,renderReviewEdit} from './ui/renderers/reviews-renderer.js';
import {buildCalendarItemViewModel} from './ui/view-models/calendar-view-model.js';
import {renderCalendarRead,renderCalendarEdit,renderCalendarIndicators,renderCalendarMonth as renderCalendarMonthView,renderCalendarFilterOptions,renderCalendarRows} from './ui/renderers/calendar-renderer.js';
import {createCalendarState} from './ui/calendar/calendar-state.js';
import {createCalendarController} from './ui/calendar/calendar-controller.js';
import {buildUnifiedReviews,unifiedReviewLabel as unifiedItemLabel} from './application/calendar/build-unified-reviews.js';
import {createQuestionController} from './application/questions/question-controller.js';
import {createEditalImportFacade} from './application/subjects/edital-import-facade.js';
import {createGuidedStudyService} from './application/guided-study/guided-study-service.js';
import {buildOnboardingViewModel} from './application/onboarding/build-onboarding-view-model.js';
import {renderOnboardingEntry,renderOnboardingProgress,renderOnboardingContent,renderOnboardingHelp,renderOnboardingActions} from './features/onboarding/onboarding-renderer.js';
import {renderTopicStrategyEditor as renderTopicStrategyEditorView} from './features/topic-strategy/topic-strategy-renderer.js';
import {buildTopicStrategyViewModel} from './features/topic-strategy/topic-strategy-view-model.js';
import {createTopicStrategyController} from './features/topic-strategy/topic-strategy-controller.js';
import {renderReplanProposal} from './features/replan/replan-renderer.js';
import {buildQuestionViewModel} from './ui/view-models/question-view-model.js';
import {renderQuestionRead,renderQuestionEdit,renderQuestionErrorFields as renderQuestionErrorFieldsView} from './ui/renderers/questions-renderer.js';
import {renderQuestionAnalyticsSummary,renderTopicQuestionPerformance,renderWeeklyQuestionTrend,renderQuestionErrorToolbar} from './ui/renderers/question-analytics-renderer.js';
import {renderGlobalSearchPanel} from './ui/renderers/global-search-renderer.js';
import {renderHeatmap as renderHeatmapView} from './ui/renderers/heatmap-renderer.js';
import {renderStudySessionRead,renderStudySessionEdit,renderStudySessionDayHeader} from './ui/renderers/study-sessions-renderer.js';
import {renderProgressChart as renderProgressChartView,renderStudyHoursChart as renderStudyHoursChartView,renderSubjectHoursBars as renderSubjectHoursBarsView} from './ui/renderers/study-charts-renderer.js';
import {renderIntelligentAlerts,renderExecutiveSummary as renderExecutiveSummaryView} from './ui/renderers/overview-renderer.js';
import {renderDiagnosisCenter as renderDiagnosisCenterView} from './ui/renderers/diagnosis-renderer.js';
import {renderTopicRetentionDashboard as renderTopicRetentionDashboardView} from './ui/renderers/retention-renderer.js';
import {renderSimulationRead,renderSimulationBreakdown as renderSimulationBreakdownView,renderSimulationEdit,renderSimulationTrendChart,renderSubjectPerformanceRows,renderSimulationRows} from './ui/renderers/simulations-renderer.js';
import {buildExamMasteryMatrix} from './domain/analytics/exam-mastery-matrix.js';
import {buildStudyStrategy} from './domain/recommendations/study-strategy.js';
import {buildWeeklyClose} from './domain/analytics/weekly-close.js';
import {createWeeklyCloseSnapshot,upsertWeeklyCloseSnapshot} from './application/analytics/weekly-close-snapshot.js';
import {buildWeeklyCloseActionProposal} from './application/analytics/weekly-close-actions.js';
import {createWeeklyCloseController} from './application/analytics/weekly-close-controller.js';
import {createTopicHistoryService} from './application/history/topic-history-service.js';
import {buildGapMap} from './domain/analytics/gap-map.js';
import {buildDecisionHistory} from './domain/recommendations/decision-history.js';
import {buildPostSimulationReplan} from './domain/planning/post-simulation-replan.js';
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
const preferencesController=createPreferencesController({document,storage:localStorage,key:THEME_STORAGE_KEY});
function getCurrentTheme(){return preferencesController.current()}
function setTheme(theme){return preferencesController.set(theme)}
function toggleTheme(){return preferencesController.toggle()}
document.getElementById('themeToggleBtn').addEventListener('click',toggleTheme);
preferencesController.sync();
document.getElementById('exportReportBtn')?.addEventListener('click',()=>{
  const preset=document.getElementById('reportPeriodSelect')?.value||'30',period={preset,start:document.getElementById('reportPeriodStart')?.value||null,end:document.getElementById('reportPeriodEnd')?.value||null};
  const diagnosis=generateDiagnosis(intelligenceCandidates()),report=buildStrategicReport({state,generatedAt:nowISO(),isDemo:IS_DEMO_MODE,readiness:readinessResult(computeApprovalMetrics()),diagnosis,forecast:projectPerformance(),period});
  printStrategicReport({document,window,report,render:renderStrategicReport});
});
document.getElementById('reportPeriodSelect')?.addEventListener('change',event=>{const custom=event.target.value==='custom';document.getElementById('reportPeriodStart').hidden=!custom;document.getElementById('reportPeriodEnd').hidden=!custom});
document.getElementById('periodComparisonPreset')?.addEventListener('change',renderSelectedPeriodComparison);
document.getElementById('periodComparisonStart')?.addEventListener('change',renderSelectedPeriodComparison);
document.getElementById('periodComparisonEnd')?.addEventListener('change',renderSelectedPeriodComparison);

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
const uiState=createUiState();
const EXAM_PRESETS=EXAM_PRESET_OPTIONS.map(option=>({...option,version:CATALOG_VERSION,examTags:[],sources:[],description:'',subjects:[]}));
let examCatalogLoadPromise=null;
let examCatalogLoaded=false;
async function ensureExamCatalog(){
  if(examCatalogLoaded)return EXAM_PRESETS;
  if(!examCatalogLoadPromise){
    examCatalogLoadPromise=new Promise((resolve,reject)=>{
      const accept=()=>{
        const catalog=window.StudyTrackExamCatalog;
        if(!Array.isArray(catalog?.EXAM_PRESETS)){reject(new Error('O catálogo de editais não carregou corretamente.'));return}
        EXAM_PRESETS.splice(0,EXAM_PRESETS.length,...catalog.EXAM_PRESETS);
        examCatalogLoaded=true;
        resolve(EXAM_PRESETS);
      };
      if(window.StudyTrackExamCatalog){accept();return}
      const script=document.createElement('script');
      script.src=new URL(`src/exam-catalog.bundle.js?v=${__STUDYTRACK_BUILD_VERSION__}`,document.baseURI).href;
      script.async=true;
      script.onload=accept;
      script.onerror=()=>reject(new Error('Não foi possível carregar o catálogo. Conecte-se à internet e tente novamente.'));
      document.head.appendChild(script);
    }).catch(error=>{examCatalogLoadPromise=null;throw error});
  }
  return examCatalogLoadPromise;
}
uiState.onboarding.presetId=EXAM_PRESETS[0]?.id||null;

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
function evidenceScopeForTopic(topicId){const found=getTopicById(topicId);return found?normalizeExamTags(found.topic.examTags):null}
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
function migrateV15toV16(data){
  (data.studySessions||[]).forEach(session=>{session.source=session.source||'manual';session.recommendationId=session.recommendationId||null;session.prioritySnapshot=session.prioritySnapshot==null||session.prioritySnapshot===''?null:Number.isFinite(Number(session.prioritySnapshot))?Number(session.prioritySnapshot):null});
  (data.recommendationFeedback||[]).forEach(item=>{item.snapshot=item.snapshot||null;if(item.outcome&&!item.outcome.state)item.outcome.state=item.outcome.attributionEligible?'neutral':'insufficient'});
  data.schemaVersion=16;return data;
}

function migrateV16toV17(data){
  data.studySessions=(data.studySessions||[]).map(session=>normalizeStudySession(session));
  data.schemaVersion=17;return data;
}

function migrateV17toV18(data){data.examBlueprint=normalizeExamBlueprint(data.examBlueprint,data.examDate);data.activeTimer=data.activeTimer||{};data.activeTimer.strategy=data.activeTimer.strategy||null;data.activeTimer.strategyStep=Math.max(0,Number(data.activeTimer.strategyStep)||0);data.schemaVersion=18;return data}

function migrateV18toV19(data){snapshotEvidenceScopes(data);data.schemaVersion=19;return data}

function migrateState(data){
  return runStateMigrations(data,{currentVersion:CURRENT_SCHEMA_VERSION,migrations:{1:migrateV1toV2,2:migrateV2toV3,3:migrateV3toV4,4:migrateV4toV5,5:migrateV5toV6,6:migrateV6toV7,7:migrateV7toV8,8:migrateV8toV9,9:migrateV9toV10,10:migrateV10toV11,11:migrateV11toV12,12:migrateV12toV13,13:migrateV13toV14,14:migrateV14toV15,15:migrateV15toV16,16:migrateV16toV17,17:migrateV17toV18,18:migrateV18toV19}});
}

function ensureStateDefaults(){
  if(!state || typeof state !== 'object') state = {};
  if(!Array.isArray(state.subjects)) state.subjects = [];
  if(!Array.isArray(state.calendar)) state.calendar = [];
  if(!Array.isArray(state.reviewAgenda)) state.reviewAgenda = [];
  if(!Array.isArray(state.questoes)) state.questoes = [];
  if(!Array.isArray(state.simulados)) state.simulados = [];
  if(!Array.isArray(state.weeklyCloseSnapshots))state.weeklyCloseSnapshots=[];
  if(!['agenda','sequence'].includes(state.executionMode)) state.executionMode='agenda';
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
  state.algorithmVersions.recommendations=PRIORITY_ALGORITHM_VERSION;
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
  state.recommendationFeedback.forEach(item=>{item.shownAt=item.shownAt||item.createdAt||null;item.ratedAt=item.ratedAt||null;item.algorithmVersion=Math.max(1,Number(item.algorithmVersion)||1);item.score=Number.isFinite(Number(item.score))?Number(item.score):null;item.confidence=item.confidence||null;item.snapshot=item.snapshot||null;item.baseline=item.baseline||null;item.outcome=item.outcome||null});
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
  state.activeTimer.strategy=state.activeTimer.strategy||null;state.activeTimer.strategyStep=Math.max(0,Number(state.activeTimer.strategyStep)||0);
  state.activeTimer.recommendationId=state.activeTimer.recommendationId||null;
  state.activeTimer.recommendationSource=STUDY_ACTION_SOURCES.includes(state.activeTimer.recommendationSource)?state.activeTimer.recommendationSource:null;
  state.activeTimer.recommendationType=['study','review','questions','simulation','prerequisite'].includes(state.activeTimer.recommendationType)?state.activeTimer.recommendationType:null;
  state.activeTimer.prioritySnapshot=Number.isFinite(Number(state.activeTimer.prioritySnapshot))?Number(state.activeTimer.prioritySnapshot):null;
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
  state.studySessions=state.studySessions.map(session=>{
    const normalized=normalizeStudySession(session,{today:todayISO});
    if(!normalized.id)normalized.id=uid('session');
    return normalized;
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
const reviewService=createReviewService({
  repository:appContext.repositories.reviewAgenda,clock:appClock,idGenerator:uid,
  findTopic:topicId=>getTopicById(topicId)?.topic||null,
  resolveEvidenceScope:evidenceScopeForTopic,
  calculateAdaptiveState:(current,rating,options)=>applyAdaptiveReviewRating(current,rating,options),
  algorithmVersion:()=>state.algorithmVersions.adaptiveReview,
  onEvent:(type,review,details)=>addHistoryEvent(type,entitySubjectId(review),review.topicId||review.topicRef||null,details),
  onTopicChanged:topicId=>refreshTopicReviewStats(topicId)
});
const planningRepository=appContext.repositories.planning;
const studyPlanService=createStudyPlanService({repository:planningRepository,calculate:buildStudyPlan,clock:appClock,idGenerator:uid,algorithmVersion:()=>state.algorithmVersions.recommendations});
const dailyPlanService=createDailyPlanService({repository:planningRepository,buildProposal:buildDailyPlanProposal,applyProposal:applyDailyPlanProposal,undoGeneration:undoDailyPlanGeneration,clock:appClock,idGenerator:uid});
const replanService=createReplanService({repository:planningRepository,buildProposal:buildReplanProposal,applyProposal:applyReplan,undoProposal:undoReplan,clock:appClock,idGenerator:uid});
const sessionService=createSessionService({repository:appContext.repositories.studySessions,questionsRepository:appContext.repositories.questoes,historyRepository:appContext.repositories.topicHistory,planningRepository,recommendationsRepository:appContext.repositories.recommendationFeedback,clock:appClock,idGenerator:uid,normalizeQuestion:normalizeErrorBreakdown,resolveEvidenceScope:evidenceScopeForTopic,completeRecommendation:completeRecommendationFeedback,onCompleted:measureRecommendationResults});
const guidedStudyService=createGuidedStudyService({recommend:({id}={})=>currentStudyRecommendations.filter(item=>!id||item.id===id),sessionService,clock:appClock});
const calendarService=createRecordService({repository:appContext.repositories.calendar,clock:appClock,idGenerator:uid,prefix:'calendar'}),questionService=createRecordService({repository:appContext.repositories.questoes,clock:appClock,idGenerator:uid,prefix:'question',normalize:item=>{item.resolved=Math.max(0,Math.floor(Number(item.resolved)||0));item.correct=Math.min(item.resolved,Math.max(0,Math.floor(Number(item.correct)||0)));normalizeErrorBreakdown(item);return item}}),simulationService=createRecordService({repository:appContext.repositories.simulados,clock:appClock,idGenerator:uid,prefix:'simulado',normalize:item=>{item.total=Math.max(0,Math.floor(Number(item.total)||0));item.correct=Math.min(item.total,Math.max(0,Math.floor(Number(item.correct)||0)));return item}}),subjectGoalService=createRecordService({repository:appContext.repositories.metasPorDisciplina,clock:appClock,idGenerator:uid,prefix:'goal'});
const goalsService=createGoalService({repository:appContext.repositories.settings,getDayOfWeek:date=>parseLocalDate(date)?.getDay()??new Date().getDay()});
const subjectService=createSubjectService({repository:appContext.repositories.subjects,clock:appClock,idGenerator:uid,onEvent:addHistoryEvent});
const topicStrategyController=createTopicStrategyController({findTopic:getTopicById,listTopics:allTopics,subjectService,normalizeTopic:normalizeTopicStrategy,invalidatePlan:()=>{studyPlanPreview=null},onChanged:persistAndRender,onCycle:()=>{showToast('Esse vínculo criaria um ciclo entre pré-requisitos.');renderSubjects()}});
const topicHistoryService=createTopicHistoryService({getState:()=>state,clock:appClock,idGenerator:uid,toLocalDate:timestampToLocalDateISO});
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
          await StorageManager.set(STORAGE_KEY,JSON.stringify(pickPersistentState(state)));
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
  const serialized=JSON.stringify(pickPersistentState(state));
  writeLocalState(serialized);
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(()=>enqueueSave(serialized,previousRaw),350);
}
async function saveState(serialized=JSON.stringify(pickPersistentState(state)),previousRaw=null){
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
const modalController=createModalController({document,window});
function showConfirm(message,onConfirm,onCancel,options={}){return modalController.confirm(message,onConfirm,onCancel,options)}
function showPrompt(message,options,onConfirm,onCancel){return modalController.prompt(message,options,onConfirm,onCancel)}

/* ===== TABS ===== */
const navigationController=createNavigationController({document,window,render:tab=>render(tab),trapModalTab:event=>trapModalTab(event,[document.getElementById('guidedOnboardingOverlay'),document.getElementById('structuredImportOverlay'),document.getElementById('examImportOverlay'),document.getElementById('reviewRatingOverlay'),document.getElementById('sessionModalOverlay'),document.getElementById('modalOverlay')]),closeReview:closeReviewRating});
function activateTab(tabName,updateHash=true){return navigationController.activate(tabName,updateHash)}

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
function topicInActiveExamScope(topic){return isTopicInExamScope(topic,state.examBlueprint?.activeExamTags||[])}
function examScopedTopics(){return activeTopics().filter(topicInActiveExamScope)}
function examEvidenceContext(){return resolveExamEvidenceScope({subjects:state.subjects,activeExamTags:state.examBlueprint?.activeExamTags||[],sessions:state.studySessions,questions:state.questoes,reviews:state.reviewAgenda})}
function examScopedRecords(records=[]){return records.filter(record=>classifyEvidenceScope(record,state.subjects,state.examBlueprint?.activeExamTags||[]).includedInExamMetrics)}
function examScopedSimulations(){const active=state.examBlueprint?.activeExamTags||[];if(!active.length)return state.simulados;return state.simulados.filter(item=>{const tags=Array.isArray(item.examTags)?item.examTags:item.examTag?[item.examTag]:[];return tags.some(tag=>active.includes(tag))})}
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
function toggleTimerFocus(force=null){
  const active=force==null?!document.body.classList.contains('timer-focus-active'):Boolean(force);
  document.body.classList.toggle('timer-focus-active',active);
  renderTimerFocusContext();
  const toggle=document.getElementById('timerFocusToggle');
  if(toggle){toggle.setAttribute('aria-pressed',String(active));toggle.textContent=active?'Sair do modo foco':'⛶ Modo foco'}
  if(active){document.querySelector('#panel-dashboard .timer-block')?.scrollIntoView({block:'center',behavior:'smooth'});requestAnimationFrame(()=>document.getElementById(timerRunning?'timerPauseBtn':'timerStartBtn')?.focus())}
  else requestAnimationFrame(()=>toggle?.focus());
  return active;
}
document.addEventListener('keydown',event=>{
  if(!document.body.classList.contains('timer-focus-active'))return;
  if(event.key==='Escape'){event.preventDefault();toggleTimerFocus(false);return}
  if(event.key!=='Tab')return;
  const focusSurface=document.querySelector('body.timer-focus-active #panel-dashboard .chart-card:has(.timer-block)');
  const focusable=[...(focusSurface?.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')||[])].filter(element=>element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden');
  if(!focusable.length){event.preventDefault();return}
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&(document.activeElement===first||!focusSurface.contains(document.activeElement))){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&(document.activeElement===last||!focusSurface.contains(document.activeElement))){event.preventDefault();first.focus()}
});

/* ===== GRÁFICO DE EVOLUÇÃO DO PROGRESSO ===== */
function recordProgressSnapshot(pct){
  const today = todayISO();
  const existing = state.progressHistory.find(p => p.date === today);
  if(existing){ existing.pct = pct; }
  else { state.progressHistory.push({ date: today, pct }); }
  state.progressHistory.sort((a,b)=> a.date.localeCompare(b.date));
  if(state.progressHistory.length > 180){
    state.progressHistory = state.progressHistory.slice(-180);
  }
}
function renderProgressChart(){
  const container = document.getElementById('progressChart');
  container.innerHTML=renderProgressChartView({data:state.progressHistory,formatDate:formatDatePt});
}

/* ===== BACKUP: EXPORTAR / IMPORTAR ===== */
const backupController=createBackupController({document,window,serialize:serializeBackup,fileName:backupFileName,validate:validateBackupData,notify:showToast,isDisabled:()=>IS_DEMO_MODE,maxBytes:MAX_BACKUP_FILE_SIZE,getState:()=>state,getDate:todayISO,exportAutomatic:exportLatestAutomaticBackup,onImport:({normalized,version})=>{const summary=backupSummary(normalized,version);showConfirm(`${summary} Importar vai substituir todos os dados atuais. Continuar?`,()=>applyImportedBackup(normalized))}});
function downloadJsonBackup(raw,name){backupController.download(raw,name)}
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
  const collections=['subjects','calendar','reviewAgenda','questoes','simulados','progressHistory','studySessions','dailyPlans','studyPlans','planAdjustments','recommendationFeedback','weeklyCloseSnapshots','alertStates','topicHistory','metasPorDisciplina'];
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
function applyImportedBackup(importedState){const previousState=state;try{state=importedState;ensureStateDefaults();restoreTimerFromState();persistAndRender();showToast('Backup importado com sucesso.')}catch(error){state=previousState;restoreTimerFromState();render();console.error('Erro ao importar backup',error);showToast('O backup passou pela validação inicial, mas não pôde ser convertido. Seus dados atuais foram preservados.')}}
backupController.mount();
document.getElementById('clearAllDataBtn').addEventListener('click',()=>showConfirm('Esta ação excluirá disciplinas, sessões, revisões, questões, simulados, metas, histórico e configurações. Exporte um backup antes de continuar.',()=>showPrompt('Digite LIMPAR para confirmar a exclusão definitiva.',{label:'Confirmação',placeholder:'LIMPAR',confirmLabel:'Limpar dados',validate:value=>value==='LIMPAR'?'':'Digite LIMPAR exatamente como exibido.'},async()=>{const keys=[STORAGE_KEY,BACKUP_KEY,BACKUP_INDEX_KEY,...Array.from({length:AUTOMATIC_BACKUP_SLOTS},(_,index)=>`${BACKUP_KEY}-${index}`)];await Promise.all(keys.map(key=>appContext.storage.remove(key)));state=createDefaultState();ensureStateDefaults();suppressBeforeUnloadSave=true;location.reload()})));
function reloadWithModeChange(){
  suppressBeforeUnloadSave=true;
  if(saveTimeout)clearTimeout(saveTimeout);
  pendingSave=null;
  location.reload();
}
const demoController=createDemoController({document,storage:sessionStorage,demoKey:DEMO_STORAGE_KEY,flashKey:MODE_FLASH_KEY,isDemo:IS_DEMO_MODE,getState:()=>state,enterMode:enterDemoMode,resetMode:resetDemoMode,exitMode:exitDemoMode,confirm:showConfirm,reload:reloadWithModeChange,activateTab});
demoController.mount();

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
  return sessionService.syncPlanItem(planItemId);
}
function syncPlannedExecution(planItemId){
  return sessionService.syncPlanItem(planItemId);
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
  if(item.topicId){const candidate=intelligenceCandidates().find(candidate=>candidate.topicId===item.topicId);if(!candidate||candidate.archived||candidate.blockedPrerequisites.length){showToast("Esta atividade aguarda pré-requisitos ou possui um tópico arquivado. Recalcule o plano.");return;}}
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
  const progressEl=document.getElementById('studyTimerProgress');
  if(targetEl){
    const targetMinutes=Math.max(0,Number(state.activeTimer?.targetMinutes)||0);
    if(targetMinutes>0){
      const targetSeconds=targetMinutes*60;
      const difference=targetSeconds-timerSeconds;
      const planItem=findDailyPlanItem(state.activeTimer.planItemId)?.item;
      const context=planItem?`${planItem.subjectName} — ${planItem.topicName} · `:'';
      targetEl.textContent=context+`meta ${formatPlanMinutes(targetMinutes)} · ${difference>=0?formatDuration(difference)+' restantes':formatDuration(Math.abs(difference))+' além da meta'}`;
      targetEl.hidden=false;
      if(progressEl){progressEl.value=Math.min(100,Math.round(timerSeconds/targetSeconds*100));progressEl.setAttribute('aria-valuetext',`${formatDuration(timerSeconds)} de ${formatPlanMinutes(targetMinutes)}`);progressEl.hidden=false}
    }else{
      targetEl.textContent='';
      targetEl.hidden=true;
      if(progressEl){progressEl.value=0;progressEl.removeAttribute('aria-valuetext');progressEl.hidden=true}
    }
  }
  renderTimerFocusContext();
  renderGuidedStrategy();
}
function renderTimerFocusContext(){
  const section=document.getElementById('timerFocusContext');
  if(!section)return;
  section.hidden=!document.body.classList.contains('timer-focus-active');
  if(section.hidden)return;
  const active=state.activeTimer||{},subject=active.subjectId?getSubjectName(active.subjectId):'Disciplina não selecionada',topic=active.topicId?getTopicName(active.topicId):'Tópico não selecionado';
  const activityLabels={study:'Estudo teórico',review:'Revisão',questions:'Questões',simulation:'Simulado'};
  const minutes=Math.max(0,Number(active.targetMinutes)||0);
  document.getElementById('timerFocusTitle').textContent=`${subject} — ${topic}`;
  document.getElementById('timerFocusSubtitle').textContent=`${activityLabels[active.type]||activityLabels.study} · ${minutes?`Meta de ${formatPlanMinutes(minutes)}`:'Sem meta de tempo'}`;
}
function renderGuidedStrategy(){const el=document.getElementById('guidedStrategy'),strategy=state.activeTimer?.strategy;if(!el)return;el.hidden=!strategy;if(!strategy){el.innerHTML='';return}const index=Math.min(state.activeTimer.strategyStep||0,strategy.steps.length-1),step=strategy.steps[index];el.innerHTML=`<strong>${escapeHtml(strategy.label)} · etapa ${index+1}/${strategy.steps.length}</strong><span>${escapeHtml(step.label)} · ${step.minutes} min</span><button class="btn ghost small" data-delegated-click="advanceGuidedStrategy()">${index===strategy.steps.length-1?'Concluir etapas':'Próxima etapa'}</button>`}
function advanceGuidedStrategy(){const strategy=state.activeTimer?.strategy;if(!strategy)return;const index=state.activeTimer.strategyStep||0;strategy.steps[index].status='completed';if(index<strategy.steps.length-1)state.activeTimer.strategyStep=index+1;renderGuidedStrategy();scheduleSave()}
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
  renderTimerFocusContext();
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
  if(guidedStudyService.current())guidedStudyService.resume();
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
  if(guidedStudyService.current())guidedStudyService.pause();
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
  Object.assign(state.activeTimer,{startedAt:null,runStartedAt:null,accumulatedSeconds:0,isRunning:false,hiddenAt:null,planItemId:null,targetMinutes:null,strategy:null,strategyStep:0,recommendationId:null,recommendationSource:null,recommendationType:null,prioritySnapshot:null});
  guidedStudyService.reset();
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
  document.getElementById('sessionModalRetention').value = '';
  document.getElementById('sessionModalNotes').value = '';
  syncSessionModalActivityFields(document.getElementById('sessionModalType').value||'study');
  overlay.classList.add('show');
}
function syncSessionModalActivityFields(type=document.getElementById('sessionModalType').value||'study'){
  const labels={study:'Registre o que você estudou e atualize seus indicadores.',questions:'Informe volume e acertos para atualizar seu desempenho.',review:'Registre como recuperou o conteúdo; esse sinal ajuda a acompanhar a retenção.',simulation:'O tempo será salvo e, em seguida, você poderá registrar o resultado do simulado.'};
  document.getElementById('sessionModalActivityHint').textContent=labels[type]||labels.study;
  document.querySelectorAll('[data-session-fields]').forEach(section=>{section.hidden=section.dataset.sessionFields!==type});
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
  renderTimerFocusContext();
  scheduleSave();
});
document.getElementById('timerTopicSelect').addEventListener('change',function(){ state.activeTimer.topicId=this.value||null; renderTimerFocusContext(); scheduleSave(); });
document.getElementById('timerTypeSelect').addEventListener('change',function(){ state.activeTimer.type=this.value||'study'; renderTimerFocusContext(); scheduleSave(); });
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
document.getElementById('sessionModalType').addEventListener('change',function(){syncSessionModalActivityFields(this.value)});
document.getElementById('sessionModalSaveBtn').addEventListener('click', () => {
  const subjectId = document.getElementById('sessionModalSubject').value || null;
  const topicId = document.getElementById('sessionModalTopic').value || null;
  const type = document.getElementById('sessionModalType').value || 'study';
  const resolved = Number(document.getElementById('sessionModalResolved').value) || 0;
  const correct = Number(document.getElementById('sessionModalCorrect').value) || 0;
  const perceivedRetention=document.getElementById('sessionModalRetention').value||null;
  const notes = document.getElementById('sessionModalNotes').value.trim();
  const session = {
    id:uid('session'),startedAt:timerStartedAt || nowISO(),endedAt:nowISO(),date:localDateFromTimestamp(timerStartedAt || nowISO()),
    durationSeconds:timerSeconds,subjectId,topicId,type,questionsResolved:resolved,
    correctAnswers:Math.min(correct,resolved),perceivedRetention,notes,planItemId:state.activeTimer.planItemId||null,
    recommendationId:state.activeTimer.recommendationId||null,recommendationSource:state.activeTimer.recommendationSource||null,
    recommendationType:state.activeTimer.recommendationType||null,prioritySnapshot:state.activeTimer.prioritySnapshot??null
  };
  if(guidedStudyService.current())guidedStudyService.complete(session);else sessionService.complete(session);
  persistAndRender();
  const openSimulationFlow=type==='simulation';
  closeSessionModal();
  if(openSimulationFlow){activateTab('questoes');addSimuladoRow();showToast('Sessão registrada. Complete agora os resultados do simulado.');return}
  showToast(type==='questions'&&resolved>0?'Sessão e questões registradas.':'Sessão registrada. Seus indicadores foram atualizados.');
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
  { id:'firstSession', icon:'▶', name:'Primeiros passos', desc:'Primeira sessão concluída', check: () => state.studySessions.length>=1 },
  { id:'streak3', icon:'⚡', name:'Ritmo iniciado', desc:'3 dias seguidos estudando', check: () => computeStreak(getActivityDates()) >= 3 },
  { id:'streak7', icon:'🔥', name:'Uma semana de foco', desc:'7 dias seguidos estudando', check: () => computeStreak(getActivityDates()) >= 7 },
  { id:'streak14', icon:'◆', name:'Duas semanas de foco', desc:'14 dias seguidos estudando', check: () => computeStreak(getActivityDates()) >= 14 },
  { id:'streak30', icon:'🏆', name:'Mês de ferro', desc:'30 dias seguidos estudando', check: () => computeStreak(getActivityDates()) >= 30 },
  { id:'subject100', icon:'🎯', name:'Disciplina dominada', desc:'Uma disciplina 100% concluída', check: () => state.subjects.some(s => s.topics.length>0 && subjectProgress(s)===100) },
  { id:'allsubjects', icon:'🗂️', name:'Plano completo', desc:'Todas as disciplinas 100%', check: () => activeSubjects().length>0 && activeSubjects().every(s => s.topics.some(t=>!t.archived) && subjectProgress(s)===100) },
  { id:'topics10', icon:'✅', name:'Dez tópicos', desc:'10 tópicos concluídos', check: () => allTopics().filter(t=>t.status==='Concluído').length >= 10 },
  { id:'topics50', icon:'📚', name:'Cinquenta tópicos', desc:'50 tópicos concluídos', check: () => allTopics().filter(t=>t.status==='Concluído').length >= 50 },
  { id:'q100', icon:'✍️', name:'Cem questões', desc:'100 questões resolvidas', check: () => state.questoes.reduce((sum,q)=>sum+(Number(q.resolved)||0),0) >= 100 },
  { id:'q500', icon:'🧠', name:'Quinhentas questões', desc:'500 questões resolvidas', check: () => state.questoes.reduce((sum,q)=>sum+(Number(q.resolved)||0),0) >= 500 },
  { id:'q1000', icon:'✦', name:'Mil questões', desc:'1.000 questões resolvidas', check: () => state.questoes.reduce((sum,q)=>sum+(Number(q.resolved)||0),0) >= 1000 },
  { id:'hours10', icon:'◷', name:'Dez horas', desc:'10 horas de estudo registradas', check: () => state.studySessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0)>=36000 },
  { id:'hours50', icon:'◷', name:'Cinquenta horas', desc:'50 horas de estudo registradas', check: () => state.studySessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0)>=180000 },
  { id:'hours100', icon:'◷', name:'Cem horas', desc:'100 horas de estudo registradas', check: () => state.studySessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0)>=360000 },
  { id:'sim1', icon:'📝', name:'Primeiro simulado', desc:'Completou o primeiro simulado', check: () => state.simulados.length >= 1 },
  { id:'sim5', icon:'🏅', name:'Cinco simulados', desc:'Completou 5 simulados', check: () => state.simulados.length >= 5 },
  { id:'reviews25', icon:'↻', name:'Revisor disciplinado', desc:'25 revisões concluídas', check: () => state.reviewAgenda.filter(item=>item.status==='Concluído').length>=25 },
  { id:'coverage50', icon:'▰', name:'Edital em andamento', desc:'50% do conteúdo concluído', check: () => allTopics().length>0&&allTopics().filter(item=>item.status==='Concluído').length/allTopics().length>=.5 },
  { id:'recommendation1', icon:'◎', name:'Inteligência aplicada', desc:'Primeira recomendação concluída', check: () => state.recommendationFeedback.some(item=>item.completed) },
  { id:'recommendationPositive', icon:'★', name:'Estratégia funcionando', desc:'Recomendação com resultado positivo', check: () => state.recommendationFeedback.some(item=>item.outcome?.state==='positive') },
];
function renderBadges(){
  const grid = document.getElementById('badgesGrid');
  if(!grid)return;
  const progressByBadge={
    topics10:{current:allTopics().filter(item=>!item.archived&&item.status==='Concluído').length,target:10,unit:'tópicos'},
    topics50:{current:allTopics().filter(item=>!item.archived&&item.status==='Concluído').length,target:50,unit:'tópicos'},
    q100:{current:state.questoes.reduce((sum,item)=>sum+(Number(item.resolved)||0),0),target:100,unit:'questões'},
    q500:{current:state.questoes.reduce((sum,item)=>sum+(Number(item.resolved)||0),0),target:500,unit:'questões'},
    q1000:{current:state.questoes.reduce((sum,item)=>sum+(Number(item.resolved)||0),0),target:1000,unit:'questões'},
    hours10:{current:state.studySessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0)/3600,target:10,unit:'horas'},
    hours50:{current:state.studySessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0)/3600,target:50,unit:'horas'},
    hours100:{current:state.studySessions.reduce((sum,item)=>sum+(Number(item.durationSeconds)||0),0)/3600,target:100,unit:'horas'},
    sim5:{current:state.simulados.length,target:5,unit:'simulados'},
    reviews25:{current:state.reviewAgenda.filter(item=>item.status==='Concluído').length,target:25,unit:'revisões'},
    coverage50:{current:allTopics().filter(item=>!item.archived).length?allTopics().filter(item=>!item.archived&&item.status==='Concluído').length/allTopics().filter(item=>!item.archived).length*100:0,target:50,unit:'% de conteúdo'},
    streak14:{current:computeStreak(getActivityDates()),target:14,unit:'dias'},
    streak30:{current:computeStreak(getActivityDates()),target:30,unit:'dias'}
  };
  const achievements=BADGES.map(item=>{const progress=progressByBadge[item.id];return{...item,unlocked:item.check(),progress:progress?{...progress,current:Math.min(progress.current,progress.target)}:null}});
  grid.innerHTML = renderAchievementGroups(buildAchievementViewModel(achievements),{escapeHtml});
}

/* ===== HEATMAP DE HORAS E META DIÁRIA ===== */
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
  const activityStreak=computeStreak(activityDates);
  const goalStreak=computeStreak(getGoalDates());
  const selectedSummary=streakView.selectedDate?getDailyStudySummary(streakView.selectedDate,{subjectId:streakView.subjectId}):null;
  document.getElementById('heatmapContainer').innerHTML=renderHeatmapView({
    cells:heatmapModel.cells,
    hasActivity:heatmapModel.hasActivity,
    metric:streakView.metric,
    subjectId:streakView.subjectId,
    subjects:activeSubjects(),
    expanded:streakView.expanded,
    onlyActiveDays:streakView.onlyActiveDays,
    defaultWeeks:DEFAULT_STREAK_WEEKS,
    activityStreak,
    goalStreak,
    selectedDate:streakView.selectedDate,
    selectedTooltip:selectedSummary?heatmapTooltip(selectedSummary):'',
    tooltipForSummary:heatmapTooltip,
    escapeHtml,
    escapeAttr,
    pluralize
  });
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
  container.innerHTML=renderSimulationTrendChart({items:data,scoreFor:simuladoNota,formatDate:formatDatePt,escapeHtml});
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

  const items=perf.map(performance=>({performance,trend:calculateWeightedTrend(getSubjectWeeklyTrend(performance.subjectId))}));
  container.innerHTML=renderSubjectPerformanceRows({items,escapeHtml});
}

/* ===== BUSCA GLOBAL ===== */
const normalizeSearchText=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
function performGlobalSearch(query){
  const q = normalizeSearchText(query.trim());
  if(!q) return [];
  const results = [];
  state.subjects.forEach(s => {
    s.topics.forEach(t => {
      const hay = normalizeSearchText([t.name||'', t.notes||'', ...(t.tags||[])].join(' '));
      if(hay.includes(q)){
        results.push({ subjectId: s.id, subjectName: s.name, topicId: t.id, topicName: t.name || '(sem nome)' });
      }
    });
  });
  return results.slice(0, 8);
}
const SEARCH_COMMANDS=[
  {label:'Visão Geral',keywords:'inicio dashboard resumo prontidao',tab:'dashboard'},
  {label:'Ir para Hoje',keywords:'hoje tarefa recomendacao estudo',tab:'hoje'},
  {label:'Iniciar recomendação prioritária',keywords:'começar iniciar próxima ação estudar recomendação prioritária',action:'recommendation'},
  {label:'Abrir cronômetro',keywords:'iniciar sessao timer estudar foco',action:'timer'},
  {label:'Abrir Disciplinas',keywords:'materias edital topicos',tab:'disciplinas'},
  {label:'Carregar edital do catálogo',keywords:'importar edital concurso bb caixa',action:'exam-import'},
  {label:'Importar JSON ou CSV',keywords:'importar arquivo conteudo disciplinas',action:'structured-import'},
  {label:'Abrir Calendário',keywords:'calendario sessoes datas',tab:'calendario'},
  {label:'Abrir Agenda de Revisões',keywords:'agenda revisao atrasadas',tab:'agenda'},
  {label:'Adicionar revisão',keywords:'criar nova revisão agenda',action:'add-review'},
  {label:'Abrir Questões e Simulados',keywords:'questoes erros simulados desempenho',tab:'questoes'},
  {label:'Registrar questões',keywords:'lancar registrar acertos erros',action:'add-questions'},
  {label:'Abrir Metas e Planejamento',keywords:'metas capacidade plano estrategia',tab:'metas'},
  {label:'Planejar semana',keywords:'plano semanal distribuir carga',tab:'metas'},
  {label:'Abrir Instruções',keywords:'ajuda guia como usar instrucoes',tab:'instrucoes'},
  {label:'Exportar backup',keywords:'backup salvar dados json',action:'backup'},
  {label:'Exportar relatório PDF',keywords:'pdf relatorio imprimir exportar',action:'report'}
];
function renderGlobalSearchResults(){
  const input = document.getElementById('globalSearchInput');
  const panel = document.getElementById('globalSearchResults');
  const q = input.value;
  if(!q.trim()){ panel.classList.remove('show'); panel.innerHTML='';input.setAttribute('aria-expanded','false');return; }
  const normalized=normalizeSearchText(q.trim()),commands=SEARCH_COMMANDS.filter(item=>normalizeSearchText(`${item.label} ${item.keywords}`).includes(normalized)).slice(0,8),results = performGlobalSearch(q);
  panel.innerHTML=renderGlobalSearchPanel({query:q,commands,results,escapeHtml,escapeAttr});
  panel.classList.add('show');
  input.setAttribute('aria-expanded','true');
  const inputRect=input.getBoundingClientRect(),left=Math.max(8,inputRect.left),width=Math.min(inputRect.width,innerWidth-left-8),top=Math.min(inputRect.bottom+4,innerHeight-80);
  panel.style.left=`${left}px`;panel.style.width=`${Math.max(180,width)}px`;panel.style.top=`${Math.max(8,top)}px`;
}
document.getElementById('globalSearchResults').addEventListener('click',event=>{
  const button=event.target.closest('.search-result-item');if(!button)return;
  if(button.dataset.searchTopic){jumpToTopic(button.dataset.searchSubject,button.dataset.searchTopic);return}
  const action=button.dataset.searchAction,input=document.getElementById('globalSearchInput'),panel=document.getElementById('globalSearchResults');
  if(action==='report')document.getElementById('exportReportBtn')?.click();
  else if(action==='backup')document.getElementById('exportBackupBtn')?.click();
  else if(action==='exam-import'){activateTab('disciplinas');openExamImport()}
  else if(action==='structured-import'){activateTab('disciplinas');document.getElementById('structuredContentImportBtn')?.click()}
  else if(action==='add-review'){activateTab('agenda');document.getElementById('addAgendaRowBtn')?.click()}
  else if(action==='add-questions'){activateTab('questoes');document.getElementById('addQuestaoRowBtn')?.click()}
  else if(action==='timer'){activateTab('dashboard');document.getElementById('timerSubjectSelect')?.focus()}
  else if(action==='recommendation'){const recommendation=currentStudyRecommendations?.[0];if(recommendation)executeStudyRecommendation(recommendation.id);else{activateTab('hoje');showToast('Ainda não há uma recomendação elegível. Revise o planejamento e as evidências disponíveis.')}}
  else if(button.dataset.searchTab)activateTab(button.dataset.searchTab);
  panel.classList.remove('show');input.setAttribute('aria-expanded','false');input.blur();
});
const globalSearchInput=document.getElementById('globalSearchInput'),globalSearchResults=document.getElementById('globalSearchResults');
globalSearchInput.addEventListener('keydown',event=>{if(!['ArrowDown','Enter'].includes(event.key))return;const first=globalSearchResults.querySelector('.search-result-item');if(first){event.preventDefault();if(event.key==='Enter')first.click();else first.focus()}});
globalSearchResults.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const items=[...globalSearchResults.querySelectorAll('.search-result-item')],index=items.indexOf(document.activeElement);if(!items.length)return;event.preventDefault();if(event.key==='ArrowUp'&&index===0){globalSearchInput.focus();return}const next=event.key==='Home'?0:event.key==='End'?items.length-1:event.key==='ArrowDown'?Math.min(items.length-1,index+1):Math.max(0,index-1);items[next]?.focus()});
function jumpToTopic(subjectId, topicId){
  const s = state.subjects.find(x=>x.id===subjectId);
  if(s) s.collapsed = false;
  document.getElementById('globalSearchInput').value = '';
  document.getElementById('globalSearchResults').classList.remove('show');
  document.getElementById('globalSearchInput').setAttribute('aria-expanded','false');
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
  setTimeout(()=>{document.getElementById('globalSearchResults').classList.remove('show');document.getElementById('globalSearchInput').setAttribute('aria-expanded','false')},150);
});
const headerObserver=new IntersectionObserver(entries=>{const hero=entries[0],shell=document.querySelector('.sticky-shell');shell?.classList.toggle('is-compact',!hero.isIntersecting&&hero.boundingClientRect.bottom<0);syncStickyMetrics()},{threshold:0});headerObserver.observe(document.querySelector('.statement'));
const stickyShell=document.querySelector('.sticky-shell');
const overviewNav=document.querySelector('.overview-nav');
document.getElementById('overviewNavSelect')?.addEventListener('change',event=>{
  const target=document.getElementById(event.target.value);if(!target)return;
  target.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  window.history.replaceState(null,'',`#${target.id}`);
});
document.getElementById('overviewAttentionViewAll')?.addEventListener('click',()=>activateTab('hoje'));
const syncStickyMetrics=()=>{
  document.documentElement.style.setProperty('--sticky-stack-height',`${Math.ceil(stickyShell?.getBoundingClientRect().height||0)}px`);
  document.documentElement.style.setProperty('--overview-nav-height',`${Math.ceil(overviewNav?.getBoundingClientRect().height||0)}px`);
};
if('ResizeObserver' in window){
  const stickyMetricsObserver=new ResizeObserver(syncStickyMetrics);
  if(stickyShell)stickyMetricsObserver.observe(stickyShell);
  if(overviewNav)stickyMetricsObserver.observe(overviewNav);
}
window.addEventListener('resize',syncStickyMetrics,{passive:true});
window.requestAnimationFrame(syncStickyMetrics);

/* ===== RENDER: HEADER STATS ===== */
function renderHeader(){
  const topics = activeTopics();
  const total = topics.length;
  const done = topics.filter(t=>t.status==='Concluído').length;
  const andamento = topics.filter(t=>t.status==='Em andamento').length;
  const pct = total ? Math.round((done/total)*100) : 0;

  const readiness=readinessResult(computeApprovalMetrics());
  document.getElementById('statAndamento').textContent = andamento;
  document.getElementById('statConcluido').textContent = done;

  const revisoesPrevistas =
    state.calendar.filter(c => c.date >= todayISO()).length +
    state.reviewAgenda.filter(a => a.date >= todayISO() && a.status !== 'Concluído').length;
  const model=buildHeaderViewModel({readiness,subjects:state.subjects,topics,upcomingReviews:revisoesPrevistas,streak:computeStreak(getActivityDates()),examDate:state.examDate,planNumber:document.getElementById('planNumber').textContent,today:todayISO()});
  renderHeroHeader(model,{document});renderCompactHeader(model,{document,formatDate:formatDatePt});

  recordProgressSnapshot(pct);
  renderExamCountdown();
}

/* ===== RENDER: DASHBOARD ===== */
let upcomingVisible=5;
function changeUpcomingLimit(delta){upcomingVisible+=Number(delta||0);renderDashboard()}
function showAllUpcoming(){upcomingVisible=Number.MAX_SAFE_INTEGER;renderDashboard()}
function resetUpcomingLimit(){upcomingVisible=5;renderDashboard()}
function renderDashboard(){
  const phaseDays=state.examDate?diasParaRevisao(state.examDate):null;
  const phaseContainer=document.getElementById('overviewExamPhase');
  if(phaseContainer)phaseContainer.innerHTML=renderExamPhaseCompact(resolveExamPhase(phaseDays),{escapeHtml});
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
  const allActiveSubjects=activeSubjects();
  const topicMatchesExam=topic=>subjectExamFilter==='all'||subjectExamFilter==='common'&&isCommonTopic(topic,[EXAM_TAGS.BB,EXAM_TAGS.CAIXA])||subjectExamFilter==='bb'&&(topic.examTags||[]).includes(EXAM_TAGS.BB)||subjectExamFilter==='caixa'&&(topic.examTags||[]).includes(EXAM_TAGS.CAIXA)||subjectExamFilter==='caixa-ti'&&(topic.examTags||[]).includes(EXAM_TAGS.CAIXA_TI);
  const subjects=subjectExamFilter==='all'?allActiveSubjects:allActiveSubjects.filter(subject=>(subject.topics||[]).some(topic=>topicMatchesExam(topic)));
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
    const subjectTopics=s.topics.filter(t=>!t.archived&&topicMatchesExam(t));
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
        <div class="subject-header-actions">
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
              <th style="width:6%;"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            ${visibleTopics.map(t => `
              <tr data-status="${t.status}" id="topic-row-${t.id}">
                <td>
                  <input type="text" value="${escapeAttr(t.name)}" placeholder="Nome do tópico"
                     data-delegated-blur="updateTopic('${s.id}','${t.id}','name', this.value)">
                  ${(t.examTags||[]).length||t.tags?.length?`<div class="tag-chips">${examBadges(t)}${(t.tags||[]).map(tag=>`<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}</div>`:''}
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
                  ${renderTopicStrategyEditor(s,t)}
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
  container.innerHTML=`<div class="exam-scope-filter" role="group" aria-label="Filtrar conteúdo por concurso">${[['all','Todos'],['bb','BB'],['caixa','Caixa'],['caixa-ti','Caixa TI'],['common','Comuns']].map(([value,label])=>`<button class="btn ghost small ${subjectExamFilter===value?'active':''}" data-delegated-click="setSubjectExamFilter('${value}')">${label}</button>`).join('')}</div>`+activeHtml+archivedHtml;
}

let openNotesIds = new Set();
let subjectExamFilter='all';
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
function setSubjectExamFilter(value){if(['all','bb','caixa','caixa-ti','common'].includes(value))subjectExamFilter=value;renderSubjects()}
function examBadges(topic){const tags=topic.examTags||[];return `${tags.includes(EXAM_TAGS.BB)?'<span class="exam-tag exam-tag--bb">BB</span>':''}${tags.includes(EXAM_TAGS.CAIXA)?'<span class="exam-tag exam-tag--caixa">CAIXA</span>':''}${tags.includes(EXAM_TAGS.CAIXA_TI)?'<span class="exam-tag exam-tag--caixa">CAIXA TI</span>':''}`}
function updateTopicTags(subjectId, topicId, value){
  const found=getTopicById(topicId),fieldOrigins={...(found?.topic?.fieldOrigins||{}),tags:'manual'};
  subjectService.updateTopic(subjectId,topicId,{tags:value.split(',').map(tag=>tag.trim()).filter(Boolean),fieldOrigins});
  persistAndRender();
}
function updateTopicStrategy(subjectId,topicId,field,value){
  topicStrategyController.update(subjectId,topicId,field,value);
}
function toggleTopicPrerequisite(subjectId,topicId,prerequisiteId,checked){
  topicStrategyController.togglePrerequisite(subjectId,topicId,prerequisiteId,checked);
}
function renderTopicStrategyEditor(subject,topic){
  const subjectConfig=state.examBlueprint.subjects.find(item=>item.subjectId===subject.id)||null;
  return renderTopicStrategyEditorView(buildTopicStrategyViewModel({subject,topic,subjectConfig,activeExamTags:state.examBlueprint.activeExamTags||[],topics:allTopics()}));
}
function renderTopicAnalyticsState(subject,topic){
  const coverage=topic.status==='Concluído'?100:topic.status==='Em andamento'||topic.status==='Revisão'?50:0;
  const masteryResult=topicMasteryIndex(subject.id,topic.id),retentionResult=topicRetentionScore(subject.id,topic.id);
  const mastery=masteryResult.confidence>0?masteryResult.score:null,retention=retentionResult.available?retentionResult.score:null;
  const diagnosis=diagnoseTopic(subject.id,topic.id),reviewHealth=topicReviewHealthScore(topic,masteryResult,retentionResult,diagnosis);
  const lastContact=diagnosis?.lastActivity?Math.max(0,-(diasParaRevisao(diagnosis.lastActivity)??0)):null;
  const lastReviewDate=localDateFromTimestamp(topic.lastReviewedAt);
  const lastReview=lastReviewDate?Math.max(0,-(diasParaRevisao(lastReviewDate)??0)):null;
  const performance=diagnosis?.performance?.accuracy??null,trend=diagnosis?.trend;
  const blockers=prerequisiteBlockers({...topic,mastery,covered:coverage===100},allTopics().map(item=>({...item,covered:item.status==='Concluído',mastery:topicMasteryIndex(item.subjectId,item.id).confidence>0?topicMasteryIndex(item.subjectId,item.id).score:null})));
  let label='Não iniciado';
  if(coverage>0&&mastery===null)label='Em estudo · aguardando questões';
  else if(coverage===100&&mastery<50)label='Coberto, não consolidado';
  else if(coverage===100&&retention!==null&&retention<60)label='Domínio em risco';
  else if(coverage===100&&mastery>=75)label='Consolidado';
  else if(coverage===100)label='Em consolidação';
  else if(coverage>0)label='Em estudo';
  if(blockers.length)label='Bloqueado por pré-requisito';
  else if(coverage===100&&needsMaintenance({covered:true,masteryGap:mastery===null?null:100-mastery,retentionRisk:retention===null?null:100-retention,reviewHealthRisk:reviewHealth.value===null?null:100-reviewHealth.value}))label='Estudado, mas precisa consolidação';
  const pctMetric=(name,value,detail='')=>`<div class="topic-metric"><span>${name}</span><strong>${value===null?'Aguardando dados':Math.round(value)+'%'}</strong><div class="topic-metric-track"><i style="width:${value===null?0:Math.round(value)}%"></i></div>${detail?`<small>${escapeHtml(detail)}</small>`:''}</div>`;
  const textMetric=(name,value,detail='')=>`<div class="topic-metric"><span>${name}</span><strong>${escapeHtml(value)}</strong>${detail?`<small>${escapeHtml(detail)}</small>`:''}</div>`;
  const trendText=!trend||trend.key==='insufficient'?'Aguardando dados':`${trend.icon} ${trend.label}`;
  const eligibility=blockers.length?`🔒 Aguarda ${blockers.map(id=>getTopicName(id)||id).join(', ')}`:coverage===100&&!needsMaintenance({covered:true,masteryGap:mastery===null?null:100-mastery,retentionRisk:retention===null?null:100-retention,reviewHealthRisk:reviewHealth.value===null?null:100-reviewHealth.value})?'✓ Consolidado':reviewHealth.level==='critical'?'↻ Revisão recomendada':masteryResult.evidence?.evidenceStrength<.35?'⚠ Poucos dados':'★ Elegível para priorização';
  return `<div class="topic-analytics-state"><div class="topic-analytics-title">Estado analítico <strong>${escapeHtml(label)}</strong><small>${escapeHtml(eligibility)}</small></div><div class="topic-analytics-metrics">${pctMetric('Cobertura',coverage)}${pctMetric('Domínio',mastery,mastery===null?'Registre questões deste tópico':'Evidência '+masteryResult.evidence.evidenceLabel.toLowerCase())}${pctMetric('Retenção',retention,retention===null?'Conclua revisões vinculadas':'Evidência '+retentionResult.evidence.evidenceLabel.toLowerCase())}${pctMetric('Saúde da revisão',reviewHealth.value,reviewHealth.reasons[0])}${textMetric('Último contato',lastContact===null?'Sem registro':lastContact===0?'Hoje':lastContact+' dias')}${textMetric('Última revisão',lastReview===null?'Sem registro':lastReview===0?'Hoje':lastReview+' dias')}${pctMetric('Desempenho recente',performance,diagnosis?.performance?.resolved?diagnosis.performance.resolved+' questões':'Sem questões')}${textMetric('Tendência',trendText,trend?.delta==null?'':(trend.delta>=0?'+':'')+trend.delta+' p.p.')}</div></div>`;
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
  subjectService.toggle(id);
  renderSubjects();
}
function renameSubject(id, name){
  const clean = name.trim() || 'Disciplina sem nome';
  const s=appContext.repositories.subjects.findById(id);if(s?.name !== clean){subjectService.rename(id,clean);persistAndRender();}else{renderAll();}
}
function addSubject(){
  showPrompt('Criar uma nova disciplina',{label:'Nome da disciplina',placeholder:'Ex.: Conhecimentos Bancários',confirmLabel:'Criar',validate:name=>{
    if(!name) return 'Informe o nome da disciplina.';
    if(state.subjects.some(subject=>subject.name.trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'))) return 'Já existe uma disciplina com esse nome.';
    return '';
  }},name=>{
    subjectService.create(name);
    persistAndRender();
    showToast(`Disciplina "${name}" criada.`);
  });
}
function carregarDisciplinasPadrao(){
  openExamImport();
}
document.getElementById('loadDefaultSubjectsBtn').addEventListener('click', carregarDisciplinasPadrao);

const examImportService=createExamImportService({subjectService,getSubjects:()=>state.subjects});
const structuredContentImportService=createStructuredContentImportService({subjectService,getSubjects:()=>state.subjects});
let structuredImportOrigin=null;
const structuredImportController=createStructuredImportController({document,window,parse:parseStructuredStudyContent,service:structuredContentImportService,render:renderStructuredImport,notify:showToast,onOpen:()=>{if(structuredImportOrigin==='onboarding')suspendGuidedOnboarding()},onCancel:({completed})=>{if(structuredImportOrigin==='onboarding'){resumeGuidedOnboarding(completed?'plan':'content');structuredImportOrigin=null}},onImported:result=>{studyPlanPreview=null;persistAndRender();showToast(`${pluralize(result.addedSubjects,'disciplina')} e ${pluralize(result.addedTopics,'tópico')} adicionados; ${pluralize(result.updatedTopics,'tópico')} atualizados.`)}});
document.getElementById('structuredContentImportBtn')?.addEventListener('click',()=>{structuredImportOrigin=null});
document.getElementById('downloadStructuredCsvBtn')?.addEventListener('click',()=>{const csv='disciplina,topico,dificuldade,importancia,esforco,tags\nPortuguês,Interpretação de texto,Médio,80,120,leitura|prioridade\n',blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='modelo-studytrack.csv';link.click();URL.revokeObjectURL(url)});
const editalImportFacade=createEditalImportFacade({catalog:EXAM_PRESETS,importService:examImportService});
const examImportState=createExamImportState(EXAM_PRESETS[0]);
let examImportOrigin=null;
function selectedExamPreset(){return EXAM_PRESETS.find(item=>item.id===examImportState.presetId)||EXAM_PRESETS[0]}
function applyPresetBlueprintDefaults(preset){const source=(preset.sources||[]).length===1?preset.sources[0]:null;if(!source||!EXAM_SOURCES[source]?.official)return;for(const subject of state.subjects){if(state.examBlueprint.subjects.some(item=>item.subjectId===subject.id))continue;const metric=subject.examMetrics?.[source];if(!metric||metric.mappingType!=='direct'||metric.expectedQuestions==null)continue;state.examBlueprint.subjects.push({subjectId:subject.id,expectedQuestions:metric.expectedQuestions,questionWeight:metric.questionWeight,priority:'normal',masteryTarget:null,sourceRef:source,official:Boolean(metric.official),mappingType:metric.mappingType})}setActiveExamTags(state,normalizeExamTags(preset.examTags||[]),{configuredAt:nowISO()})}
function syncExamSubjectCheckboxes(){syncExamSubjectCheckboxesView(document,examImportState,selectedExamPreset())}
function renderExamImport(){
  const content=document.getElementById('examImportContent'),back=document.getElementById('examImportBackBtn'),next=document.getElementById('examImportNextBtn'),preset=selectedExamPreset(),preview=examImportState.step===3?editalImportFacade.preview(examImportState.subjectIds,examImportState.topicIds):null,model=buildExamImportViewModel({state:examImportState,preset,presets:EXAM_PRESETS,topicLabel:topicExamScopeLabel,preview});
  back.hidden=model.step===1;next.textContent=model.step===3?'Importar':'Continuar';next.disabled=model.step===3?preview.addedSubjects+preview.addedTopics+preview.metadataUpdates===0:!model.canContinue;
  content.innerHTML=renderExamImportView(model,{escapeHtml,escapeAttr,renderBadges:examBadges,sourceLabel:source=>EXAM_SOURCES[source]?.label||source});
  if(model.step===2)syncExamSubjectCheckboxes();
}
async function openExamImport(initialPreset=null,origin=null){try{await ensureExamCatalog();const requestedId=typeof initialPreset==='string'?initialPreset:initialPreset?.id,preset=EXAM_PRESETS.find(item=>item.id===requestedId)||EXAM_PRESETS[0];examImportOrigin=origin;resetExamImportState(examImportState,preset,document.activeElement);if(origin==='onboarding')suspendGuidedOnboarding();editalImportFacade.begin(examImportState.presetId);document.getElementById('examImportOverlay').classList.add('show');renderExamImport();document.querySelector('[name="examPreset"]')?.focus()}catch(error){showToast(error.message||'Não foi possível abrir a importação de edital.')}}
function closeExamImport({completed=false}={}){const origin=examImportOrigin;editalImportFacade.cancel();document.getElementById('examImportOverlay').classList.remove('show');if(origin==='onboarding')resumeGuidedOnboarding(completed?'plan':'content');else examImportState.previousFocus?.focus();examImportOrigin=null}
const examImportController=createExamImportController({document,state:examImportState,getPreset:selectedExamPreset,facade:editalImportFacade,render:renderExamImport,close:()=>closeExamImport(),includeTopic:(action,topic)=>{const tags=topic.examTags||[];return action==='all'||action==='bb'&&tags.includes(EXAM_TAGS.BB)||action==='caixa'&&tags.includes(EXAM_TAGS.CAIXA)||action==='caixa-ti'&&tags.includes(EXAM_TAGS.CAIXA_TI)||action==='common'&&isCommonTopic(topic,[EXAM_TAGS.BB,EXAM_TAGS.CAIXA])},confirm:()=>{const inOnboarding=examImportOrigin==='onboarding',preset=selectedExamPreset(),result=editalImportFacade.confirm(examImportState.subjectIds,examImportState.topicIds);applyPresetBlueprintDefaults(preset);uiState.onboarding.presetId=preset.id;persistAndRender();closeExamImport({completed:true});if(inOnboarding)activateTab('dashboard');showToast(`${pluralize(result.addedSubjects,'disciplina')}, ${pluralize(result.addedTopics,'tópico')} e ${pluralize(result.metadataUpdates,'vínculo')} atualizados.`)}});examImportController.mount();

function archiveSubject(id){
  const subject=getSubjectById(id);
  if(!subject) return showToast('Disciplina não encontrada.');
  subjectService.archive(id);
  persistAndRender();
  showToast(`"${subject.name}" foi arquivada.`);
}
function restoreSubject(id){
  const subject=getSubjectById(id);
  if(!subject) return;
  subjectService.restore(id);
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
    history:topicHistoryService.list({includeLifecycle:false}).filter(item=>item.subjectId===subjectId||topicIds.has(item.topicId)).length,
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
    subjectService.remove(id);
    persistAndRender();
    showToast('Disciplina excluída definitivamente.');
  });
}
function addTopic(subjectId){
  subjectService.addTopic(subjectId);
  persistAndRender();
}
function archiveTopic(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found||found.subject.id!==subjectId) return;
  subjectService.archiveTopic(subjectId,topicId);
  persistAndRender();
  showToast('Tópico arquivado.');
}
function restoreTopic(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found||found.subject.id!==subjectId) return;
  subjectService.restoreTopic(subjectId,topicId);
  persistAndRender();
  showToast('Tópico restaurado.');
}
function getTopicDependencies(topicId){
  return {
    questions:state.questoes.filter(item=>item.topicId===topicId).length,
    sessions:state.studySessions.filter(item=>item.topicId===topicId).length,
    reviews:state.reviewAgenda.filter(item=>item.topicId===topicId||item.topicRef===topicId).length,
    calendar:state.calendar.filter(item=>item.topicId===topicId).length,
    history:topicHistoryService.list({topicId,includeLifecycle:false}).length,
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
    subjectService.removeTopic(subjectId,topicId);
    persistAndRender();
    showToast('Tópico excluído definitivamente.');
  });
}
function updateTopic(subjectId, topicId, field, value){
  const found=getTopicById(topicId),patch={[field]:value};
  if(found&&['difficulty','examImportance','estimatedStudyMinutes'].includes(field)){
    patch.fieldOrigins={...(found.topic.fieldOrigins||{}),[field]:'manual'};
  }
  subjectService.updateTopic(subjectId,topicId,patch);
  persistAndRender();
}
function addHistoryEvent(type,subjectId,topicId=null,metadata={}){
  return topicHistoryService.add(type,subjectId,topicId,metadata,{examScope:evidenceScopeForTopic(topicId)});
}
function historyEvents(type){ return topicHistoryService.list({type}); }
function eventLocalDate(event){ return topicHistoryService.eventLocalDate(event); }
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
  return buildUnifiedReviews({calendar:state.calendar,reviewAgenda:state.reviewAgenda,subjectIdOf:entitySubjectId,subjectName:entitySubjectName,topicName:getTopicName});
}
const overdueGroupLimits={calAtrasadas:3,hojeAtrasadas:3};
const overdueExpandedDates={calAtrasadas:new Set(),hojeAtrasadas:new Set()};
const overdueExpansionInitialized=new Set();
function changeOverdueGroupLimit(elId,delta){overdueGroupLimits[elId]=(overdueGroupLimits[elId]||3)+Number(delta||0);renderCalAtrasadas(elId)}
function showAllOverdueGroups(elId){overdueGroupLimits[elId]=Number.MAX_SAFE_INTEGER;renderCalAtrasadas(elId)}
function resetOverdueGroupLimit(elId){overdueGroupLimits[elId]=3;renderCalAtrasadas(elId)}
function toggleOverdueDate(elId,date){const dates=overdueExpandedDates[elId]||(overdueExpandedDates[elId]=new Set());if(dates.has(date))dates.delete(date);else dates.add(date);renderCalAtrasadas(elId)}

function renderCalIndicadores(){
  document.getElementById('calIndicadores').innerHTML=renderCalendarIndicators({items:getRevisoesUnificadas(),today:todayISO(),daysUntil:diasParaRevisao});
}

/* ===== VISÃO MENSAL DO CALENDÁRIO ===== */
const calendarUiState=createCalendarState(),calendarController=createCalendarController({service:calendarService,state:calendarUiState,clock:appClock,onChange:()=>{renderCalendar();renderMonthCalendar()}});
const MONTH_MAX_EVENTS_PER_DAY = 3;

function renderMonthCalendar(){
  const container=document.getElementById('monthCalendar');
  if(!container) return;
  const result=renderCalendarMonthView({month:calendarUiState.month,events:getRevisoesUnificadas(),filterSubject:document.getElementById('calFilterSubject').value,filterStatus:document.getElementById('calFilterStatus').value,today:todayISO(),daysUntil:diasParaRevisao,escapeHtml,escapeAttr,maxEventsPerDay:MONTH_MAX_EVENTS_PER_DAY});
  document.getElementById('calendarMonthTitle').textContent=result.title;
  container.innerHTML=result.html;
}

document.getElementById('monthPrevBtn').addEventListener('click', () => {
  calendarController.goToPreviousMonth();
});
document.getElementById('monthNextBtn').addEventListener('click', () => {
  calendarController.goToNextMonth();
});
document.getElementById('monthTodayBtn').addEventListener('click', () => {
  calendarController.goToCurrentMonth();
});

function renderCalendarFilters(){
  const sel = document.getElementById('calFilterSubject');
  const current = sel.value;
  const selMes=document.getElementById('calFilterMes'),currentMes=selMes.value;
  const selTipo=document.getElementById('calFilterTipo'),currentTipo=selTipo.value;
  const options=renderCalendarFilterOptions({subjects:state.subjects,monthKeys:collectMonthKeys(state.calendar),reviewTypes:REVIEW_OPTIONS,selectedSubject:current,selectedMonth:currentMes,selectedType:currentTipo,escapeHtml,escapeAttr,monthLabel});
  sel.innerHTML=options.subjects;
  sel.value = current;
  selMes.innerHTML=options.months;
  selMes.value = currentMes;
  selTipo.innerHTML=options.types;
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
  calendarUiState.view=normalized;
  document.getElementById('panel-calendario')?.setAttribute('data-calendar-view',normalized);
  document.querySelectorAll('.calendar-view-btn').forEach(button=>{
    const active=button.dataset.calendarView===normalized;
    button.classList.toggle('active',active);
    button.classList.toggle('ghost',!active);
    button.setAttribute('aria-pressed',String(active));
  });
}
document.querySelectorAll('.calendar-view-btn').forEach(button=>button.addEventListener('click',()=>{calendarController.setView(button.dataset.calendarView);setCalendarMobileView(calendarUiState.view)}));
const calendarEditController={state:calendarUiState,begin:(id,options={})=>options.isNew?calendarController.beginEdit(id):(calendarController.beginEdit(id)),update:calendarController.update,cancel:calendarController.cancelEdit,save:()=>{const result=calendarController.save();if(result){persistAndRender();showToast('Item do calendário atualizado.')}return result},reset:()=>{calendarUiState.editingId=null;calendarUiState.draft=null;calendarUiState.isNew=false}};
function calendarViewModel(item){return buildCalendarItemViewModel(item,{formatDate:formatDatePt,getSubjectName,subjectIdOf:entitySubjectId})}
function changeCalendarLimit(delta){calendarController.showMore(delta)}
function resetCalendarLimit(){calendarController.showLess()}
function editCalendarItem(id){
  calendarEditController.begin(id);
}
function cancelCalendarEdit(){calendarEditController.cancel()}
function updateCalendarDraft(field,value){calendarEditController.update(field,value)}
function saveCalendarEdit(){if(!calendarEditController.save())cancelCalendarEdit()}
function completeCalendarItem(id){const item=calendarController.complete(id);if(item){persistAndRender();showToast('Item concluído.')}}
function renderCalendarReadRow(item){
  return renderCalendarRead({item,view:calendarViewModel(item),mobile:isMobileHistoryLayout(),escapeHtml,daysPill:diasParaRevisaoPill(item.date,item.status),statusClass:STATUS_CLASS,today:todayISO()});
}
function renderCalendarEditRow(item){const draft=calendarUiState.draft,subjectId=entitySubjectId(draft);return renderCalendarEdit({item,draft,subjectOptions:subjectsForSelection(subjectId).map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===subjectId?'selected':''}>${escapeHtml(subject.name)}</option>`).join(''),statusOptions:STATUS_OPTIONS.map(option=>`<option value="${option}" ${option===draft?.status?'selected':''}>${option}</option>`).join(''),reviewOptions:REVIEW_OPTIONS.map(option=>`<option value="${option}" ${option===draft?.reviewType?'selected':''}>${option}</option>`).join(''),escapeAttr})}
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

  body.innerHTML=renderCalendarRows({rows,visible:calendarUiState.visible,editingId:calendarUiState.editingId,renderReadRow:renderCalendarReadRow,renderEditRow:renderCalendarEditRow,renderFooter:renderCollectionFooter,escapeHtml});
}

function addCalRow(){
  calendarController.create({date:todayISO(),week:'',subjectId:activeSubjects()[0]?.id||null,topicId:null,status:'Não iniciado',reviewType:'—'});
}
function deleteCalRow(id){
  showConfirm('Excluir este item do calendário?',()=>{calendarController.remove(id);persistAndRender();showToast('Item excluído.');});
}
function updateCal(id, field, value){
  const c = state.calendar.find(x=>x.id===id);
  c[field] = value;
  persistAndRender();
}

document.getElementById('calFilterSubject').addEventListener('change',event=>calendarController.setFilter('subjectId',event.target.value));
document.getElementById('calFilterStatus').addEventListener('change',event=>calendarController.setFilter('status',event.target.value));
document.getElementById('calFilterMes').addEventListener('change',event=>calendarController.setFilter('month',event.target.value));
document.getElementById('calFilterTipo').addEventListener('change',event=>calendarController.setFilter('type',event.target.value));
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
  const review=appContext.repositories.reviewAgenda.findById(id);
  if(!review||!review.topicId) return;
  const found=getTopicById(review.topicId);
  const baseDate=found?.topic?.completedAt||todayISO();
  const suggestion=adaptiveReviewSuggestion(review.topicId,review.baseIntervalDays||reviewBaseDaysFromType(review.tipo),baseDate);
  reviewService.restoreAdaptiveSchedule(id,suggestion);
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
  return createReviewViewModel(item,{subjectName:getSubjectName(entitySubjectId(item)),topicName:topicId?getTopicName(topicId):'',difficulty:getTopicDifficulty(topicId),formatDate:formatDatePt});
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
  const item=appContext.repositories.reviewAgenda.findById(id);if(!item||item.status==='Concluído')return;
  if(!(item.topicId||item.topicRef)){reviewService.completeReview(id);persistAndRender();showToast('Revisão concluída.');return}
  pendingReviewRatingId=id;const overlay=document.getElementById('reviewRatingOverlay');overlay.classList.add('show');overlay.removeAttribute('aria-hidden');overlay.querySelector('[data-review-rating="good"]')?.focus();
}
function adaptiveReviewType(days){return ({1:'Revisão 24h',3:'Revisão 3 dias',7:'Revisão 7 dias',14:'Revisão 14 dias',15:'Revisão 15 dias',30:'Revisão 30 dias'})[days]||'Revisão livre'}
function rateCompletedReview(rating){
  if(!REVIEW_RATINGS[rating])return closeReviewRating();
  const result=reviewService.rateReview(pendingReviewRatingId,rating,{label:REVIEW_RATINGS[rating].label});
  if(!result)return closeReviewRating();
  closeReviewRating();persistAndRender();showToast(`Revisão concluída. Próxima em ${formatDatePt(result.adaptiveState.nextReviewDate)}.`);
}
function renderAgendaReadRow(item){
  return renderReviewRead({item,view:agendaViewModel(item),mobile:isMobileHistoryLayout(),escapeHtml,escapeAttr,daysPill:diasParaRevisaoPill(item.date,item.status),difficultyClass:DIFFICULTY_CLASS,statusClass:STATUS_CLASS,ratingLabel:key=>REVIEW_RATINGS[key]?.label||key,today:todayISO()});
}
function renderAgendaEditRow(item){
  const draft=agendaUiState.draft,subjectId=entitySubjectId(draft);if(!draft)return '';
  return renderReviewEdit({item,draft,subjectOptions:subjectsForSelection(subjectId).map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===subjectId?'selected':''}>${escapeHtml(subject.name)}</option>`).join(''),topicName:draft.topicId?getTopicName(draft.topicId):(draft.topic||''),typeOptions:TIPO_AGENDA_OPTIONS.map(option=>`<option value="${option}" ${option===draft.tipo?'selected':''}>${option}</option>`).join(''),statusOptions:STATUS_OPTIONS.map(option=>`<option value="${option}" ${option===draft.status?'selected':''}>${option}</option>`).join(''),escapeAttr});
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
  const item=reviewService.createManualReview({subjectId:activeSubjects()[0]?.id||null});
  agendaUiState.editingId=item.id;agendaUiState.editingIsNew=true;agendaUiState.draft=cloneRecord(item);renderAgenda();
}
function deleteAgendaRow(id){
  showConfirm('Excluir esta revisão?',()=>{reviewService.removeReview(id);agendaUiState.editingId=null;agendaUiState.editingIsNew=false;agendaUiState.draft=null;persistAndRender();showToast('Revisão excluída.');});
}
function updateAgenda(id, field, value){
  const a = state.reviewAgenda.find(x=>x.id===id);
  if(!a)return;applyAgendaField(a,field,value);
  persistAndRender();
}

createReviewsController({actions:{
  rate:rateCompletedReview,cancelRating:closeReviewRating,
  filtersChanged:()=>{agendaUiState.upcomingVisible=5;agendaUiState.completedVisible=10;renderAgenda()},
  createManual:addAgendaRow,generateAutomatic:gerarAgendaAutomatica
}}).register();

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
const historyEditState={sessionId:null};
const historyEditDraft={session:null};
const questionCrudController=createQuestionController({service:questionService,onChange:()=>{}});
const questionEditController=createEditableCollectionController({service:questionService,clone:cloneRecord,render:renderQuestoes,normalize:draft=>{draft.resolved=Math.max(0,Math.floor(Number(draft.resolved)||0));draft.correct=Math.max(0,Math.min(Math.floor(Number(draft.correct)||0),draft.resolved));normalizeErrorBreakdown(draft);return draft},onSaved:()=>{persistAndRender();showToast('Registro atualizado.');}}),simulationEditController=createEditableCollectionController({service:simulationService,clone:cloneRecord,render:renderSimulados,normalize:draft=>{draft.total=Math.max(0,Math.floor(Number(draft.total)||0));draft.correct=Math.max(0,Math.min(Math.floor(Number(draft.correct)||0),draft.total));return draft},onSaved:()=>{persistAndRender();showToast('Simulado atualizado.');}});
function cloneRecord(record){ return record?JSON.parse(JSON.stringify(record)):null; }
function isMobileHistoryLayout(){ return window.matchMedia('(max-width:850px)').matches; }

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
  return renderQuestionErrorFieldsView({question,categories:ERROR_CATEGORIES,categorized:questionCategorizedErrors(question),totalErrors:realErrors});
}
function questionViewModel(q){
  return buildQuestionViewModel(q,{formatDate:formatDatePt,getSubjectName,getTopicName,subjectIdOf:entitySubjectId,accuracy:calcAcertoPct});
}
function editQuestion(id){
  questionEditController.begin(id);
}
function cancelQuestionEdit(){
  questionEditController.cancel();
}
function updateQuestionDraft(field,value){
  const draft=questionEditController.state.draft;if(!draft)return;questionEditController.update(field,(field==='resolved'||field==='correct')?Math.max(0,Math.floor(Number(value)||0)):value);
  if(field==='subjectId'&&draft.topicId&&!topicsForSelection(value,draft.topicId).some(t=>t.id===draft.topicId)) draft.topicId=null;
  if(field==='subjectId') renderQuestoes();
}
function saveQuestionEdit(){
  if(!questionEditController.save())cancelQuestionEdit();
}
function renderQuestionReadRow(q){
  const vm=questionViewModel(q),expanded=openQuestionErrorIds.has(q.id);return renderQuestionRead({item:q,view:vm,categorized:questionCategorizedErrors(q),errorsHtml:expanded?renderQuestionErrorFields(q):'',expanded,mobile:isMobileHistoryLayout(),escapeHtml});
}
function renderQuestionEditRow(q){
  const d=questionEditController.state.draft; const subjectId=entitySubjectId(d); const topics=topicsForSelection(subjectId,d.topicId);
  return renderQuestionEdit({item:q,draft:d,subjectOptions:subjectsForSelection(subjectId).map(s=>`<option value="${escapeAttr(s.id)}" ${s.id===subjectId?'selected':''}>${escapeHtml(s.name)}</option>`).join(''),topicOptions:topics.map(t=>`<option value="${escapeAttr(t.id)}" ${t.id===d.topicId?'selected':''}>${escapeHtml(t.name)}</option>`).join('')});
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
  body.innerHTML=visibleRows.map(q=>{ normalizeErrorBreakdown(q); return questionEditController.state.editingId===q.id?renderQuestionEditRow(q):renderQuestionReadRow(q); }).join('')+renderListViewFooter(rows.length,listViewState.questionsVisible,LIST_VIEW_STEPS.questions,
    "changeListLimit('questions',LIST_VIEW_STEPS.questions,renderQuestoes)",
    "changeListLimit('questions',-listViewState.questionsVisible,renderQuestoes)",8,'registros');
}
function addQuestaoRow(initial={}){
  listViewState.questionsVisible=LIST_VIEW_STEPS.questions;
  const question={id:uid('question'),date:todayISO(),subjectId:initial.subjectId||activeSubjects()[0]?.id||null,topicId:initial.topicId||null,resolved:0,correct:0,errorBreakdown:emptyErrorBreakdown(),recommendationId:initial.recommendationId||null,createdAt:nowISO()};
  questionCrudController.create(question);questionEditController.begin(question.id,{isNew:true});
  return question;
}
function deleteQuestaoRow(id){
  showConfirm('Excluir este registro de questões?',()=>{questionCrudController.remove(id);openQuestionErrorIds.delete(id);questionEditController.reset();persistAndRender();showToast('Registro excluído.');});
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
  return analyzeErrors(records,{minimumErrors:MIN_ERROR_RECOMMENDATION_COUNT,minimumCoverage:MIN_ERROR_RECOMMENDATION_COVERAGE});
}
function getSubjectErrorProfile(subjectId){
  return buildErrorProfile(validQuestionRecords().filter(question=>entitySubjectId(question)===subjectId));
}
function getTopicErrorProfile(topicId){
  const cutoff=addDays(todayISO(),-29);
  return buildErrorProfile(validQuestionRecords().filter(question=>question.topicId===topicId&&question.date>=cutoff&&question.date<=todayISO()));
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
function getSubjectPerformanceBetween(subjectId,start,end,records=validQuestionRecords()){
  records=records.filter(question=>entitySubjectId(question)===subjectId&&question.date>=start&&question.date<=end);
  const resolved=records.reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const correct=records.reduce((sum,q)=>sum+(Number(q.correct)||0),0);
  return {start,end,resolved,correct,accuracy:accuracyFromCounts(correct,resolved),insufficientData:resolved<MIN_WEEKLY_QUESTIONS};
}
function getSubjectWeeklyTrend(subjectId,weeks=8,records=validQuestionRecords()){
  return Array.from({length:weeks},(_,index)=>{
    const range=getWeekRange(weeks-1-index);
    return getSubjectPerformanceBetween(subjectId,range.start,range.end,records);
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
  topicHistoryService.list({topicId,includeLifecycle:false}).forEach(event=>bump(eventLocalDate(event)));
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
  const dominant=profile?.dominant;if(!dominant)return null;
  return {...dominant,meta:ERROR_CATEGORIES[dominant.key],recommendation:dominant.recommendation||ERROR_RECOMMENDATIONS[dominant.key]};
}
function topicMasteryIndex(subjectId,topicId){
  const found=getTopicById(topicId);
  if(!found)return calculateTopicMastery();
  const today=todayISO(),cutoff=addDays(today,-29);
  return calculateTopicMastery({topic:found.topic,performance:getTopicPerformance(topicId),
    trend:calculateWeightedTrend(getTopicWeeklyTrend(topicId),MIN_TOPIC_TREND_WINDOW_QUESTIONS),
    reviews:state.reviewAgenda.filter(review=>(review.topicId||review.topicRef)===topicId&&review.date&&review.date<=today),
    recentSessions:state.studySessions.filter(session=>session.topicId===topicId&&session.date>=cutoff&&session.date<=today),
    periodStart:null,periodEnd:today});
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
  if(overdueDays>=7||trend.state==='strong_down'||(reliablePerformance&&performance.accuracy<target-15)||(trend.key==='down'&&reliablePerformance&&performance.accuracy<target)) status='Crítico';
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
  summary.innerHTML=renderQuestionAnalyticsSummary({resolved,accuracy,coverage,trend});

  const topicPerformance=getSubjectTopicPerformance(performanceSubjectId);
  const mature=topicPerformance.filter(topic=>topic.resolved>=30),insufficient=topicPerformance.filter(topic=>topic.resolved>0&&topic.resolved<30);
  if(performanceViewMode==='with-data'&&!mature.length&&insufficient.length)performanceViewMode='insufficient';
  const filteredPerformance=performanceViewMode==='all'?topicPerformance:topicPerformance.filter(topic=>performanceViewMode==='without-data'?topic.resolved===0:performanceViewMode==='insufficient'?topic.resolved>0&&topic.resolved<30:topic.resolved>=30);
  bars.innerHTML=renderTopicQuestionPerformance({
    mode:performanceViewMode,
    topics:filteredPerformance,
    visible:performanceVisible,
    masteryForTopic:id=>topicMasteryIndex(performanceSubjectId,id),
    renderFooter:renderCollectionFooter,
    visibleLimit:performanceVisible,
    escapeHtml
  });

  weeklyEl.innerHTML=renderWeeklyQuestionTrend({weeks:weekly,trend,formatDate:formatDatePt});

  const subjectTopics=activeTopics().filter(topic=>topic.subjectId===performanceSubjectId);
  if(errorAnalysisView.topicId&&!subjectTopics.some(topic=>topic.id===errorAnalysisView.topicId))errorAnalysisView.topicId='';
  const currentStart=addDays(todayISO(),-(errorAnalysisView.days-1)),previousEnd=addDays(currentStart,-1),previousStart=addDays(previousEnd,-(errorAnalysisView.days-1));
  const scopedRecords=validQuestionRecords().filter(question=>entitySubjectId(question)===performanceSubjectId&&(!errorAnalysisView.topicId||question.topicId===errorAnalysisView.topicId));
  const profile=buildErrorProfile(scopedRecords.filter(question=>question.date>=currentStart&&question.date<=todayISO()));
  const previousProfile=buildErrorProfile(scopedRecords.filter(question=>question.date>=previousStart&&question.date<=previousEnd));
  const errorToolbar=renderQuestionErrorToolbar({days:errorAnalysisView.days,topicId:errorAnalysisView.topicId,topics:subjectTopics,escapeHtml,escapeAttr});
  const errorModel=buildErrorAnalysisViewModel({current:profile,previous:previousProfile,periodLabel:formatDatePt(currentStart)+' a '+formatDatePt(todayISO())});
  profileEl.innerHTML=renderErrorAnalysis(errorModel,{toolbar:errorToolbar,escapeHtml});
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
function editSimulation(id){simulationEditController.begin(id)}
function cancelSimulationEdit(){simulationEditController.cancel()}
function updateSimulationDraft(field,value){simulationEditController.update(field,(field==='correct'||field==='total')?Math.max(0,Math.floor(Number(value)||0)):value)}
function saveSimulationEdit(){
  if(!simulationEditController.save())cancelSimulationEdit();
}
function renderSimulationReadRow(sim){
  const expanded=openBreakdownIds.has(sim.id);
  return renderSimulationRead({item:sim,view:simulationViewModel(sim),mobile:isMobileHistoryLayout(),expanded,escapeHtml,breakdownHtml:expanded?renderSimulationBreakdown(sim):''});
}
function renderSimulationBreakdown(sim){
  return renderSimulationBreakdownView({item:sim,subjectOptions:subjectsForSelection,subjectIdOf:entitySubjectId,escapeHtml,escapeAttr});
}
function renderSimulationEditRow(sim){return renderSimulationEdit({item:sim,draft:simulationEditController.state.draft,escapeAttr})}

function renderSimulados(){
  const body = document.getElementById('simuladosBody');
  const rows = [...state.simulados].sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  body.innerHTML=renderSimulationRows({items:rows,visible:listViewState.simulationsVisible,editingId:simulationEditController.state.editingId,renderReadRow:renderSimulationReadRow,renderEditRow:renderSimulationEditRow,renderFooter:renderListViewFooter});
}
function addSimuladoRow(){
  listViewState.simulationsVisible=LIST_VIEW_STEPS.simulations;
  const sim=simulationService.create({date:todayISO(),nome:'',correct:0,total:0,breakdown:[]});simulationEditController.begin(sim.id,{isNew:true});
}
function deleteSimuladoRow(id){
  showConfirm('Excluir este simulado?',()=>{simulationService.remove(id);openBreakdownIds.delete(id);simulationEditController.reset();persistAndRender();showToast('Simulado excluído.');});
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
  return goalsService.hoursForDate(date);
}
function metaHoursToday(){return metaHoursForDate(todayISO());}
function updateMetaHoursDay(day,value,{refresh=true}={}){
  studyPlanPreview=null;
  goalsService.updateDailyHours(day,value,{isToday:Number(day)===parseLocalDate(todayISO()).getDay()});
  if(refresh)persistAndRender();else scheduleSave();
}
function applyTodayGoalToAllDays(){
  const value=metaHoursToday();
  goalsService.applyHoursToEveryDay(value);
  persistAndRender();
  showToast(`Meta de ${value}h aplicada a todos os dias.`);
}
function clearWeekendGoals(){
  goalsService.clearWeekend();
  persistAndRender();
  showToast('Metas do fim de semana removidas.');
}
function renderWeeklyHoursGoals(){
  const container=document.getElementById('weeklyHoursGoals');
  if(!container) return;
  const todayDay=parseLocalDate(todayISO()).getDay();
  const availability=buildWeeklyAvailability(state.metas.horasPorDia);
  container.innerHTML=`<div class="weekly-availability-summary"><div><strong>${formatPlanMinutes(availability.totalMinutes)}</strong><span>disponíveis por semana</span></div><div><strong>${availability.activeDays}</strong><span>dias com estudo</span></div><div><strong>${formatPlanMinutes(Math.round(availability.averageHours*60))}</strong><span>média por dia ativo</span></div><div><strong>${formatPlanMinutes(Math.round(metaHoursToday()*60))}</strong><span>disponíveis hoje</span></div></div>${availability.state==='empty'?'<p class="availability-warning">Defina ao menos um dia para habilitar recomendações e planejamento.</p>':''}<div class="weekday-goal-actions"><button class="btn ghost small" data-delegated-click="applyTodayGoalToAllDays()">Aplicar hoje a todos</button><button class="btn ghost small" data-delegated-click="clearWeekendGoals()">Limpar fim de semana</button></div><div class="weekday-goals">${WEEKDAY_LABELS.map((label,day)=>
    `<label class="weekday-goal ${day===todayDay?'today':''}"><span>${label}${day===todayDay?' · hoje':''}</span><div><input type="number" min="0" max="24" step="0.25" value="${metaHoursForDate(addDays(startOfWeek(todayISO()),day===0?6:day-1))}" data-delegated-blur="updateMetaHoursDay(${day},this.value)" aria-label="Disponibilidade em horas de ${label}"><small>h</small></div></label>`
  ).join('')}</div>`;
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
  const hasAccuracyEvidence=state.questoes.some(item=>Number(item.resolved)>0)||state.simulados.some(item=>Number(item.total)>0);
  const resultGoals=buildResultGoalsViewModel({goals:m,achieved:{weeklyTopics:atingidoSemanal,monthlyTopics:atingidoMensal,questions:atingidoQuestoes,simulations:atingidoSimulados,accuracy:hasAccuracyEvidence?taxaAcertoGeral():null}});

  const cards = [
    { key:'semanal', label:'Meta Semanal', desc:'Tópicos concluídos esta semana', atingido: atingidoSemanal, meta: m.semanal },
    { key:'mensal', label:'Meta Mensal', desc:'Tópicos concluídos este mês', atingido: atingidoMensal, meta: m.mensal },
    { key:'questoesSemanal', label:'Meta de Questões', desc:'Questões resolvidas esta semana', atingido: atingidoQuestoes, meta: m.questoesSemanal },
    { key:'simuladosSemanal', label:'Meta de Simulados', desc:'Simulados feitos esta semana', atingido: atingidoSimulados, meta: m.simuladosSemanal }
  ];

  document.getElementById('metasContainer').innerHTML = cards.map(c => {
    const goalId={semanal:'weeklyTopics',mensal:'monthlyTopics',questoesSemanal:'questions',simuladosSemanal:'simulations'}[c.key],goal=resultGoals.items.find(item=>item.id===goalId);
    const pct = goal?.progress??0;
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
          <span>${goal?.measured?c.atingido:'Sem dados'} / ${c.meta}</span>
          <span>${goal?.progress==null?'Aguardando registros':`${pct}%`}</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="0" value="${c.meta}" data-delegated-blur="updateMeta('${c.key}', this.value)">
      </div>
      <small class="result-goal-status">${goal?.state==='achieved'?'Meta atingida':goal?.remaining!=null?`Faltam ${goal.remaining} para atingir a meta`:'Aguardando registros'}</small>
    </div>`;
  }).join('') + `
    <div class="meta-card">
      <div class="meta-info">
        <div class="meta-name">Meta de Aprovação</div>
        <div class="meta-formula">Taxa de acerto alvo em questões e simulados</div>
      </div>
      <div class="meta-progress-block">
        <div class="meta-progress-track">
          <div class="meta-progress-fill ${resultGoals.items.find(item=>item.id==='accuracy')?.state==='achieved'?'over':''}" style="width:${resultGoals.items.find(item=>item.id==='accuracy')?.progressClamped||0}%"></div>
        </div>
        <div class="meta-progress-label">
          <span>Atual: ${resultGoals.items.find(item=>item.id==='accuracy')?.current==null?'Sem dados':resultGoals.items.find(item=>item.id==='accuracy').current+'%'}</span>
          <span>Meta: ${state.metas.metaAprovacao}%</span>
        </div>
      </div>
      <div class="meta-inputs">
        Meta:
        <input type="number" min="0" max="100" value="${state.metas.metaAprovacao}" data-delegated-blur="updateMeta('metaAprovacao', this.value)">%
      </div>
      <small class="result-goal-status">${resultGoals.items.find(item=>item.id==='accuracy')?.state==='achieved'?'Meta de acerto atingida':hasAccuracyEvidence?'Meta ainda não atingida':'Aguardando questões ou simulados para calcular o acerto'}</small>
    </div>`;
  renderSelectedPeriodComparison();
}

function updateMeta(key, value){
  goalsService.update(key,value);
  persistAndRender();
}

function renderExamBlueprintConfig(){
  const container=document.getElementById('examBlueprintConfig');if(!container)return;
  const blueprint=state.examBlueprint;
  const rows=activeSubjects().map(subject=>{
    const config=blueprint.subjects.find(item=>item.subjectId===subject.id);
    const priorityLabel=({high:'Alta',low:'Baixa',normal:'Normal'})[config?.priority||'normal'];
    const masteryLabel=config?.masteryTarget==null?`Herdar ${blueprint.masteryTarget}% (geral)`: `Meta ${config.masteryTarget}%`;
    const questionsLabel=config?.expectedQuestions>0?`${config.expectedQuestions} questões`:'Questões sem meta';
    const weightLabel=config?.questionWeight!=null?`Peso ${config.questionWeight}`:'Peso padrão';
    return `<details class="exam-subject-config"><summary><strong>${escapeHtml(subject.name)}</strong><span>${priorityLabel}</span><span>${masteryLabel}</span><span>${questionsLabel} · ${weightLabel}</span><em>Editar</em></summary><div class="exam-subject-row"><strong>${escapeHtml(subject.name)}</strong><label>Prioridade<select class="select-control" data-delegated-change="updateExamSubject('${escapeAttr(subject.id)}','priority',this.value)"><option value="normal" ${!config||config.priority==='normal'?'selected':''}>Normal</option><option value="high" ${config?.priority==='high'?'selected':''}>Alta</option><option value="low" ${config?.priority==='low'?'selected':''}>Baixa</option></select></label><label>Meta de domínio (%)<input type="number" min="0" max="100" value="${config?.masteryTarget??''}" placeholder="Herdar ${blueprint.masteryTarget}% (geral)" data-delegated-blur="updateExamSubject('${escapeAttr(subject.id)}','masteryTarget',this.value)">${config?.masteryTarget==null?`<small class="field-inheritance">${blueprint.masteryTarget}% (geral)</small>`:''}</label><label>Questões esperadas<input type="number" min="0" step="1" value="${config?.expectedQuestions??''}" placeholder="Não definido" data-delegated-blur="updateExamSubject('${escapeAttr(subject.id)}','expectedQuestions',this.value)"></label><label>Peso por questão<input type="number" min="0.1" step="0.1" value="${config?.questionWeight??''}" placeholder="1" data-delegated-blur="updateExamSubject('${escapeAttr(subject.id)}','questionWeight',this.value)">${config?.sourceRef?`<small class="field-inheritance">${escapeHtml(EXAM_SOURCES[config.sourceRef]?.label||config.sourceRef)}${config.official?' · oficial':''}</small>`:''}</label></div></details>`;
  }).join('');
  container.innerHTML=`<h4 class="config-section-title">Configuração da prova</h4><div class="exam-blueprint-main"><label>Data da prova<input type="date" value="${escapeAttr(blueprint.examDate||'')}" data-delegated-change="updateExamBlueprint('examDate',this.value)"></label><label>Nota-alvo (%)<input type="number" min="0" max="100" value="${blueprint.targetScore}" data-delegated-blur="updateExamBlueprint('targetScore',this.value)"></label><label>Meta geral de domínio (%)<input type="number" min="0" max="100" value="${blueprint.masteryTarget}" data-delegated-blur="updateExamBlueprint('masteryTarget',this.value)"></label></div><fieldset class="active-exams"><legend>Concursos ativos no planejamento</legend>${[['bb-escriturario','Banco do Brasil — Escriturário'],['caixa-tbn','Caixa — TBN'],['caixa-tbn-ti','Caixa — TBN TI']].map(([tag,label])=>`<label><input type="checkbox" data-delegated-change="toggleActiveExamTag('${tag}',this.checked)" ${(blueprint.activeExamTags||[]).includes(tag)?'checked':''}> ${label}</label>`).join('')}<small>Somente os concursos marcados influenciam prontidão, prioridade e planejamento. Se nenhum for selecionado, todo o conteúdo continuará elegível.</small></fieldset><h4 class="config-section-title">Configuração por disciplina</h4><div class="exam-subject-list">${rows||'<p class="diagnosis-empty">Cadastre disciplinas para configurar o peso no edital.</p>'}</div>`;
  renderExamMasteryMatrix();
}
function topicExamMetricForActiveScope(topic){const active=state.examBlueprint.activeExamTags||[],entries=Object.entries(topic.examMetrics||{}).filter(([profile])=>!active.length||active.some(tag=>profile.startsWith(tag)));return entries[0]?.[1]||null}
function renderExamMasteryMatrix(){const el=document.getElementById('examMasteryMatrix');if(!el)return;const candidates=intelligenceCandidates(),metrics=Object.fromEntries(candidates.map(c=>[c.topicId,{coverage:c.coverage,mastery:{value:c.mastery,confidence:c.evidenceStrength},retention:{value:c.retention},trend:c.trend,priority:{value:c.score}}])),rows=buildExamMasteryMatrix({subjects:state.subjects,blueprint:state.examBlueprint,metricsByTopic:metrics,activeExamTags:state.examBlueprint.activeExamTags||[]});el.innerHTML=rows.length?`<div class="mastery-matrix"><div class="mastery-matrix-head"><span>Disciplina</span><span>Cobertura</span><span>Domínio</span><span>Retenção</span><span>Gap</span></div>${rows.sort((a,b)=>(b.gap??-999)-(a.gap??-999)).map(row=>`<details><summary><strong>${escapeHtml(row.name)}</strong><span data-label="Cobertura">${row.coverage??'—'}%</span><span data-label="Domínio">${row.mastery??'—'}%</span><span data-label="Retenção">${row.retention??'—'}%</span><span data-label="Gap">${row.gap==null?'—':(row.gap>0?'-':'')+Math.abs(row.gap)+' pts'}</span></summary>${row.topics.map(t=>{const metric=topicExamMetricForActiveScope(t),meta=[metric?.questionWeight!=null?metric.questionWeight+' pt/questão':null,t.incidence?.level?'incidência '+t.incidence.level.toLowerCase():null].filter(Boolean).join(' · ');return `<div class="mastery-topic"><span>${escapeHtml(t.name)}${meta?`<small>${escapeHtml(meta)} · estimativa por tópico</small>`:''}</span><span data-label="Cobertura">${t.coverage}%</span><span data-label="Domínio">${t.mastery??'—'}%</span><span data-label="Retenção">${t.retention??'—'}%</span><span data-label="Estado">${escapeHtml(t.state)}</span></div>`}).join('')}</details>`).join('')}</div>`:'<div class="upcoming-empty">Cadastre disciplinas e tópicos para montar a matriz.</div>'}
let studyPlanPreview=null,dailyPlanPreview=null;
function studyPlanCandidates({guidedDefaults=false}={}){
  return intelligenceCandidates().filter(item=>item.topicId).map(item=>{
    let estimatedMinutes=item.remainingMinutes;
    if(guidedDefaults&&estimatedMinutes==null){const topic=getTopicById(item.topicId)?.topic;estimatedMinutes=topic?.difficulty==='Difícil'?120:topic?.difficulty==='Fácil'?45:75}
    return {...item,completed:false,estimatedMinutes,remainingMinutes:estimatedMinutes};
  });
}
function buildCurrentStudyPlanProposal({guidedDefaults=false}={}){
  const days=state.examDate?diasParaRevisao(state.examDate):null;
  const weeklyAvailableMinutes=Object.values(state.metas.horasPorDia).reduce((sum,hours)=>sum+Math.max(0,Number(hours)||0)*60,0);
  const candidates=studyPlanCandidates({guidedDefaults});
  const plan=studyPlanService.calculate({topics:candidates,weeklyAvailableMinutes,weeksUntilExam:days===null?0:Math.max(0,days/7)});
  return {...plan,examPhase:resolveExamPhase(days),adaptiveAdvice:buildAdaptivePlanningAdvice({plan,candidates})};
}
function calculateStudyPlanPreview(){
  studyPlanPreview=buildCurrentStudyPlanProposal();
  renderStudyPlanBuilder();
}
function useAdaptivePlanAdvice(){
  const adjusted=applyAdaptivePlanningAdvice(studyPlanPreview,studyPlanPreview?.adaptiveAdvice);
  if(!adjusted){showToast('Não há capacidade livre suficiente nos tópicos indicados para aplicar esta sugestão.');return}
  studyPlanPreview=adjusted;renderStudyPlanBuilder();
}
function clearStudyPlanPreview(){studyPlanPreview=null;renderStudyPlanBuilder()}
function confirmStudyPlan(){
  if(!studyPlanPreview||studyPlanPreview.state==='insufficient'||!studyPlanPreview.items.length)return;
  studyPlanService.confirm({...studyPlanPreview,examDate:state.examDate||null});studyPlanPreview=null;dailyPlanPreview=null;scheduleSave();renderStudyPlanBuilder();showToast('Plano semanal confirmado e salvo.')
}
function latestStudyPlan(){return studyPlanService.getActive()}
function calculateDailyPlanPreview(){
  const studyPlan=latestStudyPlan();if(!studyPlan)return;
  const days=Array.from({length:7},(_,index)=>{const date=addDays(todayISO(),index);return {date,availableMinutes:Math.round(metaHoursForDate(date)*60)}}),end=days.at(-1).date;
  const dueReviews=state.reviewAgenda.filter(review=>review.status!=='Concluído'&&review.topicId&&review.date>=todayISO()&&review.date<=end).map(review=>({id:review.id,date:review.date,subjectId:review.subjectId,topicId:review.topicId,subjectName:getSubjectName(review.subjectId),topicName:getTopicName(review.topicId),minutes:25}));
  dailyPlanPreview=dailyPlanService.calculate({studyPlan,days,dueReviews,reserveRatio:.1,eligibleTopicIds:intelligenceCandidates().filter(item=>!item.archived&&!item.blockedPrerequisites.length).map(item=>item.topicId)});renderStudyPlanBuilder();
}
function clearDailyPlanPreview(){dailyPlanPreview=null;renderStudyPlanBuilder()}
function confirmDailyPlanPreview(){
  if(dailyPlanPreview?.state!=='proposal')return;const studyPlan=latestStudyPlan(),result=dailyPlanService.confirm(dailyPlanPreview,studyPlan);
  dailyPlanPreview=null;scheduleSave();renderStudyPlanBuilder();showToast(`${pluralize(result.createdItems,'atividade')} criada${result.createdItems===1?'':'s'} no plano diário.`)
}
function undoLatestDailyPlanGeneration(){
  const studyPlan=latestStudyPlan(),operation=[...(studyPlan?.dailyPlanOperations||[])].reverse().find(item=>!item.undoneAt);if(!operation)return;const result=dailyPlanService.undo(operation,studyPlan);
  scheduleSave();renderStudyPlanBuilder();renderPlanoHoje();showToast(result.protectedItems.length?`${pluralize(result.removedItems,'atividade')} removida${result.removedItems===1?'':'s'}; itens executados foram preservados.`:'Criação dos planos diários desfeita.')
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
  const blockedNote=plan.blockedTopics?.length?`<details class="blocked-topics-note"><summary>${plan.blockedTopics.length} tópico${plan.blockedTopics.length===1?' aguarda':'s aguardam'} pré-requisitos</summary><p>${plan.blockedTopics.slice(0,5).map(item=>escapeHtml(item.topicName||item.id)+" — requer "+item.prerequisites.map(id=>escapeHtml(getTopicName(id)||id)).join(", ")).join("; ")}${plan.blockedTopics.length>5?` · e mais ${plan.blockedTopics.length-5}`:''}.</p><small>Conclua a base ou reforce o domínio e recalcule a proposta.</small></details>`:"";
  if(plan.state==='insufficient'){container.innerHTML=`<div class="upcoming-empty">Não foi possível montar o plano. Confira a data da prova, disponibilidade e carga restante dos tópicos elegíveis.</div>${blockedNote}<button class="btn ghost small" data-delegated-click="clearStudyPlanPreview()">Fechar</button>`;return}
  const subjectRows=plan.subjects.map(item=>`<div><strong>${escapeHtml(item.subjectName)}</strong><span>${formatPlanMinutes(item.minutes)} por semana</span></div>`).join('');
  const topicRows=plan.items.slice(0,8).map(item=>`<div class="study-plan-topic"><span><strong>${escapeHtml(item.subjectName)}</strong> — ${escapeHtml(item.topicName)}<small>${escapeHtml(item.reasonSummary||'Prioridade calculada pelos fatores disponíveis')}</small></span><span>${formatPlanMinutes(item.minutes)} · prioridade ${item.score}/100${item.covered?" · manutenção":""} · teoria ${formatPlanMinutes(item.activityMix.theory)} · questões ${formatPlanMinutes(item.activityMix.questions)} · revisões ${formatPlanMinutes(item.activityMix.reviews)}</span></div>`).join('');
  container.innerHTML=`<div class="study-plan-summary"><div><strong>${formatPlanMinutes(plan.weeklyAvailableMinutes)}</strong><span>Capacidade semanal</span></div><div><strong>${formatPlanMinutes(plan.weeklyNeedMinutes)}</strong><span>Necessidade semanal</span></div><div><strong>${plan.weeklyBalanceMinutes<0?'-':'+'}${formatPlanMinutes(Math.abs(plan.weeklyBalanceMinutes))}</strong><span>Saldo · ${plan.paceState==='deficit'?'ritmo insuficiente':plan.paceState==='surplus'?'capacidade disponível':'ritmo equilibrado'}</span></div><div><strong>${formatPlanMinutes(plan.weeklyPlannedMinutes)}</strong><span>Proposta semanal</span></div></div><div class="study-plan-confidence">Dados disponíveis: ${Math.round(plan.confidence*100)}% · força da evidência: ${plan.evidence?.evidenceLabel?.toLowerCase()||"não avaliada"}${plan.missingEffort.length?` · ${plan.missingEffort.length} tópico${plan.missingEffort.length===1?'':'s'} sem esforço estimado`:''}</div>${blockedNote}<p class="confidence-note">Manutenção prevista: ${formatPlanMinutes(plan.maintenanceMinutes||0)} nesta semana. Tópicos cobertos recebem questões e revisões. A prioridade usa os mesmos fatores da recomendação de estudo.</p><div class="study-plan-subjects">${subjectRows}</div><details class="study-plan-details"><summary>Ver divisão por tópico e atividade</summary>${topicRows}</details><div class="study-plan-actions"><button class="btn" data-delegated-click="confirmStudyPlan()">Confirmar e salvar plano</button><button class="btn ghost" data-delegated-click="clearStudyPlanPreview()">Descartar proposta</button></div>`;
  const phase=plan.examPhase;
  const advice=plan.adaptiveAdvice;
  const adaptiveHtml=renderAdaptiveAllocationAdvice(advice,{weeklyPlannedMinutes:plan.weeklyPlannedMinutes,formatMinutes:formatPlanMinutes,escapeHtml});
  container.insertAdjacentHTML('afterbegin',`${renderExamPhase(phase,{escapeHtml})}${adaptiveHtml}`);
}
function updateExamBlueprint(field,value,{refresh=true}={}){
  studyPlanPreview=null;
  const previousPhase=field==='examDate'?resolveExamPhase(state.examDate?diasParaRevisao(state.examDate):null):null;
  if(field==='examDate'){state.examBlueprint.examDate=value||null;state.examDate=value||''}
  if(field==='targetScore'){const target=Math.max(0,Math.min(100,Number(value)||0));state.examBlueprint.targetScore=target;goalsService.update('metaAprovacao',target)}
  if(field==='masteryTarget')state.examBlueprint.masteryTarget=Math.max(0,Math.min(100,Number(value)||80));
  state.examBlueprint.configuredAt=nowISO();if(refresh)persistAndRender();else scheduleSave();
  if(field==='examDate'&&previousPhase?.state&&previousPhase.state!=='undated'){
    const nextPhase=resolveExamPhase(state.examDate?diasParaRevisao(state.examDate):null);
    if(nextPhase.state!==previousPhase.state&&nextPhase.state!=='undated')showToast(`Você entrou na fase de ${nextPhase.label}. ${nextPhase.strategy}`);
  }
}
function updateExamSubject(subjectId,field,value){
  studyPlanPreview=null;
  let config=state.examBlueprint.subjects.find(item=>item.subjectId===subjectId);
  if(!config){config={subjectId,expectedQuestions:0,questionWeight:1,priority:'normal',masteryTarget:null};state.examBlueprint.subjects.push(config)}
  if(field==='expectedQuestions')config.expectedQuestions=Math.max(0,Math.round(Number(value)||0));
  if(field==='questionWeight')config.questionWeight=Math.max(.1,Number(value)||1);
  if(field==='expectedQuestions'||field==='questionWeight'){config.sourceRef=null;config.official=false;config.mappingType=null}
  if(field==='priority'&&EXAM_PRIORITIES.includes(value))config.priority=value;
  if(field==='masteryTarget')config.masteryTarget=value===''?null:Math.max(0,Math.min(100,Number(value)||0));
  state.examBlueprint.configuredAt=nowISO();persistAndRender();
}
function toggleActiveExamTag(tag,checked){const valid=['bb-escriturario','caixa-tbn','caixa-tbn-ti'];if(!valid.includes(tag))return;const values=new Set(state.examBlueprint.activeExamTags||[]);checked?values.add(tag):values.delete(tag);if(setActiveExamTags(state,[...values],{configuredAt:nowISO()})){studyPlanPreview=null;persistAndRender()}}

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
  subjectGoalService.create({subjectId,meta});
  persistAndRender();
}
function updateMetaDisciplina(id, value){
  subjectGoalService.update(id,{meta:Number(value)||1});
  persistAndRender();
}
function deleteMetaDisciplina(id){
  subjectGoalService.remove(id);
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

function renderSelectedPeriodComparison(){
  const container=document.getElementById('periodComparisonResults'),preset=document.getElementById('periodComparisonPreset');if(!container||!preset)return;
  const startWrap=document.getElementById('periodComparisonStartWrap'),endWrap=document.getElementById('periodComparisonEndWrap'),custom=preset.value==='custom';
  if(startWrap)startWrap.hidden=!custom;if(endWrap)endWrap.hidden=!custom;
  const start=document.getElementById('periodComparisonStart')?.value||null,end=document.getElementById('periodComparisonEnd')?.value||null;
  if(custom&&(!start||!end||start>end)){container.innerHTML='<p class="diagnosis-empty">Escolha um intervalo válido para comparar os períodos.</p>';return}
  const reviews=state.reviewAgenda.map(item=>({...item,date:item.completedAt?localDateFromTimestamp(item.completedAt):item.date}));
  const model=buildPeriodComparisonViewModel({sessions:state.studySessions,questions:state.questoes,reviews,today:todayISO(),preset:preset.value,start,end});
  const format=(metric,value)=>value==null?'Dados insuficientes':metric.unit==='min'?`${Math.floor(value/60)}h ${String(value%60).padStart(2,'0')}min`:metric.unit==='percentage_points'?`${value}%`:String(value);
  const delta=metric=>metric.delta==null?'Sem comparação':metric.unit==='percentage_points'?`${metric.delta>0?'+':''}${metric.delta} p.p.`:metric.unit==='min'?`${metric.delta>0?'+':'−'}${Math.floor(Math.abs(metric.delta)/60)}h ${String(Math.abs(metric.delta)%60).padStart(2,'0')}min`:`${metric.delta>0?'+':''}${metric.delta}`;
  container.innerHTML=`<p class="period-comparison-caption"><strong>${escapeHtml(model.currentPeriod.label)}</strong> · ${escapeHtml(model.currentPeriod.start)} a ${escapeHtml(model.currentPeriod.end)} <span>comparado com ${escapeHtml(model.previousPeriod.start)} a ${escapeHtml(model.previousPeriod.end)}</span></p><div class="period-comparison result-period-comparison"><div class="comparison-head"><span>Métrica</span><span>Anterior</span><span>Atual</span><span>Variação</span></div>${model.metrics.map(metric=>`<div><span>${escapeHtml(metric.label)}</span><b>${format(metric,metric.previous)}</b><b>${format(metric,metric.current)}</b><b class="comparison-delta ${metric.state}">${delta(metric)}</b></div>`).join('')}</div><aside class="comparison-insight" aria-label="Leitura da comparação">${model.insights.combinedMessage?`<p class="comparison-insight-combined">${escapeHtml(model.insights.combinedMessage)}</p>`:''}<p>${escapeHtml(model.insights.accuracyMessage)}</p><small>${escapeHtml(model.insights.caveat)}</small></aside>`;
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
  topicHistoryService.list({subjectId,includeLifecycle:false}).forEach(event=>bump(eventLocalDate(event)));
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
/* Prioridade compartilhada com recomendações e planejamento semanal. */

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
function collectStudyCandidates(){
  const today=todayISO();

  const candidateMap=new Map();
  const addCandidate=(key,candidate)=>{
    const current=candidateMap.get(key);
    if(!current||candidate.diasAtrasado>current.diasAtrasado||candidate.tipo==='revisão'&&current.tipo!=='revisão') candidateMap.set(key,candidate);
  };

  state.reviewAgenda
    .filter(review=>{
      const subjectId=entitySubjectId(review);
      const topicId=review.topicId||review.topicRef||null;
      return review.status!=='Concluído'&&review.date&&review.date<=today&&isActiveStudyReference(subjectId,topicId)&&(!topicId||topicInActiveExamScope(getTopicById(topicId)?.topic));
    })
    .forEach(review=>{
      const subjectId=entitySubjectId(review);
      const topicId=review.topicId||review.topicRef||null;
      const diagnosis=topicId?diagnoseTopic(subjectId,topicId):null;
      addCandidate(topicId||'review:'+review.id,{id:'review-'+review.id,
        subjectId,topicId,subjectName:entitySubjectName(review),
        topicName:topicId?getTopicName(topicId):(review.topic||review.tipo||'Revisão'),
        tipo:'revisão',dificuldade:getTopicDifficulty(topicId),
        diasAtrasado:Math.max(0,-(diasParaRevisao(review.date)??0)),
        erroQuestoes:diagnosis?.effectiveErrorRate??taxaErroDisciplina(subjectId),
        diasSemEstudar:diagnosis?.daysSinceStudy??diasSemEstudarDisciplina(subjectId),
        diagnosis
      });
    });

  activeTopics().filter(topic=>topicInActiveExamScope(topic))
    .filter(topic=>(topic.name||'').trim()!=='')
    .forEach(topic=>{
      if(candidateMap.has(topic.id)) return;
      const diagnosis=diagnoseTopic(topic.subjectId,topic.id);
      addCandidate(topic.id,{
        subjectId:topic.subjectId,topicId:topic.id,subjectName:topic.subjectName,topicName:topic.name,
        tipo:topic.status==='Concluído'?'manutenção':topic.status==='Em andamento'?'continuar':'novo tópico',
        dificuldade:topic.difficulty||'Médio',diasAtrasado:0,
        erroQuestoes:diagnosis?.effectiveErrorRate??taxaErroDisciplina(topic.subjectId),
        diasSemEstudar:diagnosis?.daysSinceStudy??diasSemEstudarDisciplina(topic.subjectId),
        diagnosis
      });
    });

  const candidates=[...candidateMap.values()];
  candidates.forEach(candidate=>{

    candidate.recommendedAction=candidate.diagnosis?.recommendation?.action||(candidate.tipo==='revisão'?'Concluir a revisão programada':'Estudar o tópico');
    candidate.studyType=candidate.diagnosis?.recommendation?.studyType||(candidate.tipo==='revisão'?'review':'study');
    candidate.estimatedMinutes=candidate.diagnosis?.recommendation?.estimatedMinutes||(candidate.tipo==='revisão'?25:35);
    candidate.recommendedQuestions=candidate.diagnosis?.recommendation?.questions||0;
  });
  return candidates;
}
function computeStudyPriorities(){
  return recommendStudy(intelligenceCandidates(),{availableMinutes:Math.round(metaHoursToday()*60)})
    .map(item=>({...item,tier:item.score>=70?'Alta':item.score>=40?'Média':'Baixa'}));
}
function motivoPrioridade(priority){
  if(priority.reasonSummary)return priority.reasonSummary;
  if(priority.reasons?.length)return priority.reasons.join(" · ");
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
    container.innerHTML = `<div class="upcoming-empty">Nenhuma atividade elegível para o tempo disponível. Confira os pré-requisitos e a meta de hoje.</div>`;
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
function renderStudyHoursDashboard(){
  const container=document.getElementById('studyTimeStats');
  if(!container) return;
  const model=buildStudyTimeViewModel({sessions:state.studySessions,today:todayISO(),weekStart:startOfWeek(todayISO()),monthStart:todayISO().slice(0,7)+'-01',hoursForDate:metaHoursForDate,addDays});
  const {todaySeconds:today,weekSeconds:week,monthSeconds:month,totalSeconds:total,targetSeconds:metaSeconds,consistency,pace,dedication,todayGoalPct}=model;
  const remaining=Math.max(0,metaSeconds-today);
  const metaLabel=metaSeconds>0?`${todayGoalPct}% · faltam ${formatDuration(remaining)}`:'meta não definida';
  container.innerHTML=`
    <div class="stat-cell" title="${escapeAttr(metaLabel)}"><div class="n">${formatDuration(today)}</div><div class="l">Estudo hoje</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(week)}</div><div class="l">Estudo na semana</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(month)}</div><div class="l">Estudo no mês</div></div>
    <div class="stat-cell"><div class="n">${formatDuration(total)}</div><div class="l">Total acumulado</div></div>
    <div class="stat-cell"><div class="n">${metaSeconds>0?todayGoalPct+'%':'—'}</div><div class="l">Meta de hoje</div></div>
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
  container.innerHTML=renderStudyHoursChartView({data,targetSeconds:metaHoursToday()*3600,formatDate:formatDatePt,formatDuration});
}
function renderSubjectHoursBars(){
  const container=document.getElementById('subjectHoursBars');
  if(!container) return;
  const map={};
  state.studySessions.forEach(session=>{
    const key=entitySubjectId(session)||'__none';
    map[key]=(map[key]||0)+(Number(session.durationSeconds)||0);
  });
  const rows=Object.entries(map).filter(([,seconds])=>seconds>0).sort((a,b)=>b[1]-a[1]).map(([subjectId,seconds])=>({subjectId,seconds}));
  container.innerHTML=renderSubjectHoursBarsView({rows,getSubjectName,formatDuration,escapeHtml,escapeAttr});
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
  return sessionService.edit(session.id,session);
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
    sessionService.remove(id);
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
  sessionService.edit(d.id,d);
  historyEditState.sessionId=null; historyEditDraft.session=null; persistAndRender(); showToast('Sessão atualizada.');
}
function renderStudySessionReadRow(session){
  const vm=sessionViewModel(session);
  const detailsId=`session-details-${session.id}`,expanded=expandedSessionDetails.has(session.id);
  return renderStudySessionRead({session,view:vm,detailsId,expanded,mobile:isMobileHistoryLayout(),escapeHtml,escapeAttr,pluralize});
}
function renderStudySessionEditRow(session){
  const draft=historyEditDraft.session,subjectId=entitySubjectId(draft),subject=getSubjectById(subjectId),topics=subject?subject.topics:[];
  const subjectOptions=subjectsForSelection(subjectId).map(item=>`<option value="${escapeAttr(item.id)}" ${item.id===subjectId?'selected':''}>${escapeHtml(item.name)}</option>`).join('');
  const topicOptions=topics.map(topic=>`<option value="${escapeAttr(topic.id)}" ${topic.id===draft.topicId?'selected':''}>${escapeHtml(topic.name)}</option>`).join('');
  return renderStudySessionEdit({session,draft,typeOptions:sessionTypeOptions(draft.type||'study'),subjectOptions,topicOptions,escapeHtml});
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
    const expanded=expandedSessionDays.has(date);
    html.push(renderStudySessionDayHeader({date,sessions,expanded,formatDate:formatDatePt,formatDuration,pluralize,escapeAttr}));
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
  const today=todayISO(),scope=examEvidenceContext(),scopedQuestions=scope.questions.included;
  const eligibleSubjectIds=new Set(examScopedTopics().map(topic=>topic.subjectId));
  const subjects=activeSubjects().filter(subject=>eligibleSubjectIds.has(subject.id)).map(subject=>{
    const trend=calculateWeightedTrend(getSubjectWeeklyTrend(subject.id,8,scopedQuestions));
    const lastSession=scope.sessions.included.filter(session=>entitySubjectId(session)===subject.id&&session.date).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
    const lastStudyDay=parseLocalDate(lastSession?.date);
    const daysSinceStudy=lastStudyDay?Math.max(0,Math.floor((parseLocalDate(today)-lastStudyDay)/86400000)):null;
    return {subjectId:subject.id,name:subject.name,trend:{direction:trend.key==='down'?'down':trend.key==='up'?'up':'stable',state:trend.state,delta:trend.delta},daysSinceStudy};
  });
  const topics=intelligenceCandidates().map(item=>({topicId:item.topicId,subjectId:item.subjectId,name:item.topicName,mastery:item.mastery,examImpact:item.examImpact,evidenceStrength:item.evidenceStrength,dominantError:item.diagnosis?.dominantError}));
  const days=state.examDate?diasParaRevisao(state.examDate):null;
  const weeklyAvailableMinutes=Object.values(state.metas.horasPorDia).reduce((sum,hours)=>sum+Math.max(0,Number(hours)||0)*60,0);
  const plan=buildStudyPlan({topics:studyPlanCandidates(),weeklyAvailableMinutes,weeksUntilExam:days===null?0:Math.max(0,days/7)});
  const dayOfWeek=parseLocalDate(today).getDay(),elapsed=dayOfWeek===0?7:dayOfWeek,expectedFrac=elapsed/7;
  const weekStart=startOfWeek(today),achieved=uniqueTopicsCompletedBetween(weekStart,addDays(weekStart,6));
  const actualFrac=state.metas.semanal>0?achieved/state.metas.semanal:1;
  const weeklyGoalGap=expectedFrac>=.5&&actualFrac<expectedFrac-.15?Math.round((expectedFrac-actualFrac)*100):null;
  const scopedReviews=examScopedRecords(getRevisoesUnificadas()),hardTopicsWithoutReview=examScopedTopics().filter(topic=>topic.difficulty==='Difícil'&&topic.status!=='Concluído'&&!scopedReviews.some(review=>(review.topicId||review.topicRef)===topic.id&&review.status!=='Concluído')).length;
  return buildIntelligentAlerts({today,overdueReviews:scopedReviews.filter(review=>review.date<today&&review.status!=='Concluído').length,subjects,topics,weeklyBalanceMinutes:plan.weeklyBalanceMinutes,hardTopicsWithoutReview,weeklyGoalGap});
}

function renderAlertasInteligentes(){
  const container = document.getElementById('alertasInteligentesList');
  const overview=document.getElementById('overviewAttention');
  if(!container&&!overview) return;
  const reconciliation=reconcileAlerts(computeAlertasInteligentes(),state.alertStates,todayISO(),addDays);
  if(JSON.stringify(reconciliation.states)!==JSON.stringify(state.alertStates)){state.alertStates=reconciliation.states;scheduleSave()}
  const alertas = reconciliation.visible;
  const presentation=renderIntelligentAlerts({alerts:alertas,additional:reconciliation.additional,escapeHtml,escapeAttr});
  if(container)container.innerHTML=presentation.list;
  if(overview)overview.innerHTML=presentation.overview;
}
function dismissIntelligentAlert(id){state.alertStates=dismissAlert(state.alertStates,id,todayISO(),addDays,7);scheduleSave();renderAlertasInteligentes()}

function renderExecutiveSummary(){
  const container=document.getElementById('executiveSummary');if(!container)return;
  const metrics=computeApprovalMetrics(),readiness=readinessResult(metrics),pace=computeRitmo(),priorities=computeStudyPriorities();
  const topPriority=priorities[0]?{...priorities[0],reason:motivoPrioridade(priorities[0])}:null;
  const risks=computeAlertasInteligentes();
  const configuredTopics=examScopedTopics().filter(topic=>(topic.examImportance!==null||Object.keys(topic.examImportanceEstimates||{}).length)&&topic.estimatedStudyMinutes!==null);
  const opportunityCount=configuredTopics.filter(topic=>priorities.some(priority=>priority.topicId===topic.id)).length;
  const weekStart=startOfWeek(todayISO()),weeklyGoal={achieved:uniqueTopicsCompletedBetween(weekStart,addDays(weekStart,6)),target:state.metas.semanal};
  const summary=buildExecutiveSummary({readiness,daysToExam:state.examDate?(diasParaRevisao(state.examDate)??null):null,pace,topPriority,riskCount:risks.length,weeklyGoal,opportunityCount});
  container.innerHTML=renderExecutiveSummaryView({summary,formatMinutes:formatPlanMinutes,escapeHtml});
}

const dismissedRecommendationIds=new Set();
let currentStudyRecommendations=[];
function intelligenceCandidates(){
  const priorities=collectStudyCandidates(),topics=allTopics();
  const retentions=Object.fromEntries(topics.map(topic=>[topic.id,topicRetentionScore(topic.subjectId,topic.id)]));
  const reviewHealths=Object.fromEntries(topics.map(topic=>[topic.id,topicReviewHealthScore(topic,topicMasteryIndex(topic.subjectId,topic.id),retentions[topic.id])]));
  return buildStudyCandidates({priorities,topics,retentions,reviewHealths,blueprint:state.examBlueprint.subjects,
    sessions:state.studySessions,today:todayISO(),examProximity:state.examDate?proximidadeProvaScore():null,activeExamTags:state.examBlueprint.activeExamTags||[]});
}
function renderDiagnosisCenter(){
  const container=document.getElementById('diagnosisCenter');if(!container)return;
  const {candidates}=refreshStudyRecommendationItems(),result=generateDiagnosis(candidates),weeklyCapacityMinutes=Object.values(state.metas.horasPorDia||{}).reduce((sum,hours)=>sum+(Number(hours)||0)*60,0),model=buildDiagnosisViewModel(result,{hasTopics:candidates.length>0,weeklyCapacityMinutes});
  container.innerHTML=renderDiagnosisCenterView({model,studyActionForItem:item=>{
    const recommendation=currentStudyRecommendations.find(candidate=>candidate.subjectId===item.subjectId&&candidate.topicId===item.topicId),action=buildStudyAction(recommendation,{source:'diagnosis'});
    return action?{...action,label:recommendationActionLabel(action)}:null;
  },escapeHtml,escapeAttr});
}
function renderRecommendationImpact(model){
  if(!model.available)return '';
  const metrics=model.metrics.map(metric=>`<div><span>${escapeHtml(metric.label)}</span><strong>${metric.before} → ${metric.after}</strong><small class="${metric.delta>=0?'positive':'negative'}">${metric.delta>=0?'+':''}${metric.delta} ${metric.key==='risk'?'de melhora':'p.p.'}</small></div>`).join('');
  const reasons=model.reasons.length?`<small class="recommendation-impact-reasons">${escapeHtml(model.reasons.join(' · '))}</small>`:'';
  return `<section class="recommendation-impact ${escapeAttr(model.state)}"><header><span>Resultado da recomendação</span><strong>${escapeHtml(model.title)}</strong><small>Confiança ${escapeHtml((model.confidenceLabel||'não calculada').toLowerCase())} · ${model.questionVolume} questões</small></header><div class="recommendation-impact-metrics">${metrics||'<p>Indicadores comparáveis ainda indisponíveis.</p>'}</div>${reasons}</section>`;
}
function refreshStudyRecommendationItems(){
  const availableMinutes=Math.max(0,Math.round(metaHoursToday()*60));
  const candidates=intelligenceCandidates();
  const previous=new Map(currentStudyRecommendations.map(item=>[item.id,item]));
  currentStudyRecommendations=recommendStudy(candidates,{availableMinutes,excludedIds:[...dismissedRecommendationIds]}).map(item=>{
    const old=previous.get(item.id);
    return old&&old.score===item.score&&old.estimatedMinutes===item.estimatedMinutes&&JSON.stringify(old.factors)===JSON.stringify(item.factors)
      ?{...item,recommendationId:old.recommendationId,shownAt:old.shownAt,algorithmVersion:PRIORITY_ALGORITHM_VERSION}
      :createRecommendationPresentation(item,{id:uid('recommendation'),shownAt:nowISO(),algorithmVersion:PRIORITY_ALGORITHM_VERSION});
  });
  return {availableMinutes,candidates};
}
function renderPendingRecommendationOutcome(){
  const pending=state.recommendationFeedback.find(feedback=>feedback.completed&&feedback.useful===null);
  return pending?`<div class="recommendation-outcome" role="group" aria-label="Avaliação do resultado da recomendação"><strong>Esta recomendação ajudou?</strong><button class="btn small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(pending.recommendationId)}',true)">Sim</button><button class="btn ghost small" data-delegated-click="rateRecommendationOutcome('${escapeAttr(pending.recommendationId)}',false)">Não</button></div>`:'';
}
function renderOverviewNextAction(availableMinutes){
  const container=document.getElementById('overviewNextAction');if(!container)return;
  const outcome=renderPendingRecommendationOutcome();
  const item=currentStudyRecommendations[0];
  if(!item){container.innerHTML=`${outcome}<p class="overview-alert-empty">${availableMinutes<15?'Defina pelo menos 15 minutos para hoje para receber uma sugestão.':'Ainda não há uma atividade elegível com os dados atuais.'}</p><a class="btn ghost small" href="#overview-study">Ver cronômetro e registrar estudo</a>`;return}
  const action=buildStudyAction(item,{source:'overview'}),model=buildPriorityViewModel(item,1),label=recommendationActionLabel(action),mastery=action.evidence.mastery==null?'Domínio ainda sem evidência':`Domínio ${Math.round(action.evidence.mastery)}/100`,reasons=action.reasons.slice(0,3).join(' · '),minutes=action.suggestedMinutes==null?'Tempo não estimado':formatPlanMinutes(action.suggestedMinutes);
  container.innerHTML=`${outcome}<article class="card card--action overview-action-card" data-study-action-source="${action.source}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${action.activityType}"><div><h3>${escapeHtml(item.subjectName)} · ${escapeHtml(item.topicName)}</h3><p><strong>${minutes}</strong> · ${escapeHtml(label)} · prioridade ${action.priority??'—'}/100</p><p class="overview-action-reason">${escapeHtml(mastery)} · ${escapeHtml(action.evidence.label||model.evidenceLabel).toLowerCase()}</p></div><div class="overview-action-buttons"><button class="btn" type="button" data-delegated-click="executeStudyRecommendation('${escapeAttr(action.id)}','${action.source}')">▶ ${escapeHtml(label)}</button></div><details class="overview-action-explanation"><summary>Por que esta é a próxima ação?</summary><p>${escapeHtml(reasons||'Selecionada pela prioridade atual, pelos pré-requisitos e pela disponibilidade de hoje.')}</p></details></article>`;
}
function renderOverviewDecisionArea(){const {availableMinutes}=refreshStudyRecommendationItems();renderOverviewNextAction(availableMinutes);renderAlertasInteligentes()}
function renderStudyRecommendation(){
  const container=document.getElementById('studyRecommendation');if(!container)return;
  const {availableMinutes,candidates}=refreshStudyRecommendationItems();
  renderOverviewNextAction(availableMinutes);
  const visible=currentStudyRecommendations.slice(0,3);
  const summary=summarizeRecommendationFeedback(state.recommendationFeedback),impact=renderRecommendationImpact(buildRecommendationOutcomeViewModel(state.recommendationFeedback));
  const outcome=impact+renderPendingRecommendationOutcome();
  const history=summary.shown?`<small class="recommendation-history">Histórico: ${summary.acceptanceRate}% aceitas · ${summary.completionRate??0}% concluídas${summary.rated?` · ${summary.usefulnessRate}% úteis`:''}</small>`:'';
  const visibleIds=new Set(visible.map(item=>item.id));
  const excluded=candidates.filter(item=>!visibleIds.has(item.id)).map(item=>{
    if(item.blockedPrerequisites?.length)return {...item,stateIcon:'🔒',stateText:'Aguarda '+item.blockedPrerequisites.map(id=>getTopicName(id)||id).join(', ')};
    if(item.completed)return {...item,stateIcon:'✓',stateText:'Atividade já realizada hoje'};
    if(item.covered&&!needsMaintenance(item))return {...item,stateIcon:'✓',stateText:'Concluído e consolidado'};
    if(item.remainingMinutes===null&&!item.covered)return {...item,stateIcon:'○',stateText:'Carga de estudo ainda não configurada'};
    if(dismissedRecommendationIds.has(item.id))return {...item,stateIcon:'○',stateText:'Ocultado nesta sessão'};
    return {...item,stateIcon:item.examImpact!=null&&item.examImpact<30?'○':'★',stateText:item.examImpact!=null&&item.examImpact<30?'Baixa relevância configurada para a prova':'Prioridade inferior às três recomendações atuais'};
  }).filter(Boolean).slice(0,6);
  const excludedHtml=excluded.length?`<details class="recommendation-exclusions"><summary>Por que outros tópicos não aparecem?</summary>${excluded.map(item=>`<div><span>${item.stateIcon}</span><strong>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</strong><small>${escapeHtml(item.stateText)}</small></div>`).join('')}</details>`:'';
  if(!visible.length){
    const hasContent=activeTopics().length>0,tab=availableMinutes<15||!hasContent?'metas':'disciplinas',label=availableMinutes<15?'Ajustar disponibilidade':!hasContent?'Configurar disciplinas e tópicos':'Revisar elegibilidade e pré-requisitos';
    const message=availableMinutes<15?'Defina pelo menos 15 minutos disponíveis para hoje.':!hasContent?'Cadastre ou importe disciplinas e tópicos para gerar uma recomendação.':'Não há atividade elegível agora. Confira pré-requisitos, esforço e itens já concluídos.';
    container.innerHTML=`${outcome}<div class="empty-state empty-state--compact recommendation-empty-state" role="status"><strong>Nenhuma recomendação disponível</strong><p>${escapeHtml(message)}</p><button class="btn ghost small" data-delegated-click="navigateKpi('${tab}')">${escapeHtml(label)}</button></div>${excludedHtml}${history}`;return
  }
  const cards=visible.map((item,index)=>{
    const action=buildStudyAction(item,{source:'today'}),model=buildPriorityViewModel(item,index+1),label=recommendationActionLabel(action),minutes=action.suggestedMinutes==null?'Tempo não estimado':formatPlanMinutes(action.suggestedMinutes);
    const contributionRows=model.contributionRows.map(row=>`<div><span>${escapeHtml(row.label)}</span><span class="contribution-track"><i style="width:${Math.min(100,row.value*4)}%"></i></span><strong>+${row.value}</strong></div>`).join('');
    const stateIcon={review:'↻',limited:'⚠',high:'★',calculated:'○',blocked:'🔒'}[model.state]||'○';
    return `<article class="study-recommendation ${index===0?'is-primary':''}" data-study-action-source="${action.source}" data-study-action-id="${escapeAttr(action.id)}" data-activity-type="${action.activityType}"><div class="priority-score-gauge" style="--priority:${model.score}"><strong>${model.score}</strong><span>/100</span></div><div class="recommendation-content"><span class="recommendation-rank">#${model.position} na fila de estudo</span><h4>${escapeHtml(item.subjectName)} — ${escapeHtml(item.topicName)}</h4><strong>${escapeHtml(item.action||'Estudar agora')}</strong><p>${minutes}${item.recommendedQuestions?` · ${pluralize(item.recommendedQuestions,'questão','questões')}`:''} · ${stateIcon} ${escapeHtml(model.stateLabel)}</p><div class="priority-reasons">${action.reasons.slice(0,4).map(reason=>`<span>+ ${escapeHtml(reason)}</span>`).join('')}</div><details class="recommendation-explanation"><summary>Ver composição da prioridade</summary><p>Dados disponíveis: ${model.completeness}% · força da evidência: ${escapeHtml(action.evidence.label||model.evidenceLabel).toLowerCase()}. Algoritmo v${action.algorithmVersion||item.algorithmVersion}.</p><div class="recommendation-contributions">${contributionRows}<div class="recommendation-total"><span>Prioridade final</span><strong>${action.priority??model.score}/100</strong></div></div>${item.missingFactors.length?`<small>${item.missingFactors.length} fator${item.missingFactors.length===1?'':'es'} sem dados; os pesos disponíveis foram redistribuídos.</small>`:''}</details></div><div class="recommendation-actions"><button class="btn" data-delegated-click="executeStudyRecommendation('${escapeAttr(action.id)}','${action.source}')">▶ ${escapeHtml(label)}</button><button class="btn ghost" data-delegated-click="dismissStudyRecommendation('${escapeAttr(item.id)}')">Trocar</button><button class="btn ghost" data-delegated-click="markRecommendationNotUseful('${escapeAttr(item.id)}')">Não foi útil</button></div></article>`;
  });
  const moreCards=cards.slice(1).join(''),moreRecommendations=moreCards?`<details class="study-recommendation-more"><summary>Ver outras ${cards.length-1} prioridades</summary><div class="study-recommendation-list">${moreCards}</div></details>`:'';
  container.innerHTML=`${cards[0]}${moreRecommendations}${outcome}<div class="recommendation-capacity"><strong>${formatPlanMinutes(availableMinutes)}</strong><span> disponíveis hoje · ${visible.length} ${visible.length===1?'prioridade elegível':'prioridades elegíveis'}</span></div>${excludedHtml}${history}`;
}
function recommendationBaseline(recommendation){
  const topicId=recommendation.topicId,performance=getTopicPerformance(topicId),found=getTopicById(topicId),last=found?.topic?.lastReviewedAt||found?.topic?.lastCompletedAt||null;
  return captureRecommendationBaseline({mastery:recommendation.mastery,accuracy:performance.accuracy,questionVolume:performance.resolved,retention:recommendation.retention,
    reviewHealth:recommendation.reviewHealth?.value,risk:recommendation.risk?.value,trend:recommendation.diagnosis?.trend||null,evidence:recommendation.evidence||null,daysSinceContact:last?Math.max(0,-(diasParaRevisao(localDateFromTimestamp(last))??0)):null,measuredAt:nowISO()});
}
function recordRecommendationFeedback(recommendation,{accepted,reasonSkipped=null,source=null}={}){const baseline=recommendationBaseline(recommendation),createdAt=nowISO(),feedback=recordRecommendationDecision(state.recommendationFeedback,recommendation,{accepted,reasonSkipped,baseline,snapshot:captureRecommendationSnapshot(recommendation,{baseline,createdAt}),now:createdAt,idGenerator:uid});if(source)feedback.presentationSource=source;return feedback}
function measureRecommendationResults(session){
  if(!session?.topicId)return;const measuredAt=nowISO();
  state.recommendationFeedback.filter(item=>item.accepted&&item.completed&&item.topicId===session.topicId&&item.baseline&&(!item.outcome||['pending','insufficient'].includes(item.outcome.state))).forEach(feedback=>{
    const since=Date.parse(feedback.baseline.measuredAt)||0,records=validQuestionRecords().filter(item=>item.topicId===session.topicId&&Date.parse(item.createdAt||`${item.date}T23:59:59Z`)>=since),volume=records.reduce((sum,item)=>sum+(Number(item.resolved)||0),0),correct=records.reduce((sum,item)=>sum+(Number(item.correct)||0),0),activities=state.studySessions.filter(item=>item.topicId===session.topicId&&item.id!==session.id&&Date.parse(item.createdAt||item.startedAt||0)>=since).length,candidate=intelligenceCandidates().find(item=>item.topicId===session.topicId);
    measureRecommendationOutcome(feedback,{masteryAfter:candidate?.mastery,accuracyAfter:volume?Math.round(correct/volume*1000)/10:null,questionVolumeAfter:volume,retentionAfter:candidate?.retention,reviewHealthAfter:candidate?.reviewHealth?.value,riskAfter:candidate?.risk?.value,measuredAt,daysElapsed:Math.max(0,(Date.parse(measuredAt)-since)/86400000),otherActivities:activities});
  });
}
function dismissStudyRecommendation(id){const recommendation=currentStudyRecommendations.find(item=>item.id===id);if(!recommendation)return;showPrompt('Por que trocar esta recomendação?',{label:'Motivo opcional',placeholder:'Ex.: não tenho tempo hoje',confirmLabel:'Trocar',required:false},(reason)=>{recordRecommendationFeedback(recommendation,{accepted:false,reasonSkipped:reason?.trim()||'swapped'});dismissedRecommendationIds.add(id);scheduleSave();renderStudyRecommendation()})}
function markRecommendationNotUseful(id){const recommendation=currentStudyRecommendations.find(item=>item.id===id);if(recommendation){const feedback=recordRecommendationFeedback(recommendation,{accepted:false,reasonSkipped:'not_useful'});feedback.useful=false;scheduleSave()}dismissedRecommendationIds.add(id);renderStudyRecommendation()}
function rateRecommendationOutcome(recommendationId,useful){if(rateRecommendationFeedback(state.recommendationFeedback,recommendationId,{useful,ratedAt:nowISO()})){scheduleSave();renderStudyRecommendation();showToast('Obrigado. Esse retorno melhora a avaliação das recomendações.')}}
function startStudyRecommendation(id,source='today'){
  const recommendation=currentStudyRecommendations.find(item=>item.id===id);if(!recommendation)return;
  const fresh=recommendStudy(intelligenceCandidates(),{availableMinutes:Math.round(metaHoursToday()*60)}).find(item=>item.id===id);
  if(!fresh){renderStudyRecommendation();showToast('As condições mudaram. Confira a recomendação atual.');return;}
  Object.assign(recommendation,fresh);
  const recommendedType=recommendationActionKind(recommendation);
  guidedStudyService.next({id,source,type:recommendedType});guidedStudyService.start();
  recommendation.strategy=buildStudyStrategy(recommendation,{availableMinutes:recommendation.estimatedMinutes});
  recordRecommendationFeedback(recommendation,{accepted:true,source});
  let plan=todayDailyStudyPlan();if(!plan){plan={id:uid('plan'),date:todayISO(),availableMinutes:Math.round(metaHoursToday()*60),plannedMinutes:0,flexMinutes:0,createdAt:nowISO(),updatedAt:nowISO(),items:[]};state.dailyPlans.push(plan)}
  let item=plan.items.find(candidate=>candidate.topicId===recommendation.topicId&&!['completed','skipped'].includes(candidate.status));
  if(item){item.recommendationId=recommendation.recommendationId;item.type=recommendation.studyType||item.type||'study'}
  if(!item){item={id:uid('plan-item'),subjectId:recommendation.subjectId,topicId:recommendation.topicId,subjectName:recommendation.subjectName,topicName:recommendation.topicName,type:recommendation.studyType||'study',plannedMinutes:recommendation.estimatedMinutes,executedSeconds:0,status:'planned',sessionIds:[],score:recommendation.score,tier:recommendation.score>=70?'Alta':recommendation.score>=40?'Média':'Baixa',position:plan.items.length+1,statusIcon:'🎯',statusLabel:'Recomendação inteligente',reason:recommendation.reasons.join(' · '),action:recommendation.action,recommendedQuestions:0,originalDate:todayISO(),currentDate:todayISO(),rescheduleCount:0,skippedReason:null,recommendationId:recommendation.recommendationId,createdAt:nowISO()};plan.items.push(item);plan.plannedMinutes+=item.plannedMinutes;plan.updatedAt=nowISO();scheduleSave()}
  Object.assign(state.activeTimer,{recommendationId:recommendation.recommendationId||recommendation.id,recommendationSource:source,recommendationType:recommendedType,prioritySnapshot:Number.isFinite(Number(recommendation.score))?Number(recommendation.score):null,strategy:structuredClone(recommendation.strategy),strategyStep:0});startPlannedActivity(item.id);
}
const recommendationController=createRecommendationController({getRecommendations:()=>currentStudyRecommendations,actionKind:recommendationActionKind,
  onQuestions:(recommendation,kind,context={})=>{const feedback=recordRecommendationFeedback(recommendation,{accepted:true,source:context.source}),question=addQuestaoRow({subjectId:recommendation.subjectId,topicId:recommendation.topicId,recommendationId:recommendation.recommendationId});feedback.actionKind=kind;feedback.resultingQuestionId=question.id;scheduleSave();activateTab('questoes');showToast('Registro de questões aberto e vinculado à recomendação.');return question},
  onReview:(recommendation,kind,context={})=>{const feedback=recordRecommendationFeedback(recommendation,{accepted:true,source:context.source});let review=state.reviewAgenda.find(item=>(item.topicId||item.topicRef)===recommendation.topicId&&item.status!=='Concluído');if(!review)review=reviewService.createManualReview({subjectId:recommendation.subjectId,topicId:recommendation.topicId,date:todayISO(),suggestedDate:todayISO(),baseIntervalDays:1,adaptive:true,manualDate:false,tipo:'Revisão livre'});feedback.actionKind=kind;feedback.resultingReviewId=review.id;scheduleSave();activateTab('agenda');completeAgendaReview(review.id);return review},
  onPrerequisite:(recommendation,kind,context={})=>{const blocker=getTopicById(recommendation.blockedPrerequisites?.[0]);if(!blocker)return null;const feedback=recordRecommendationFeedback(recommendation,{accepted:true,source:context.source});feedback.actionKind=kind;feedback.targetTopicId=blocker.topic.id;scheduleSave();activateTab('disciplinas');showToast(`Pré-requisito selecionado: ${blocker.subject.name} — ${blocker.topic.name}.`);return blocker.topic},
  onStudy:(recommendation,kind,context={})=>startStudyRecommendation(recommendation.id,context.source)
});
function executeStudyRecommendation(id,source='today'){return recommendationController.execute(id,{source})}

const replanController=createReplanController({service:replanService,repository:planningRepository,getState:()=>state,clock:{today:todayISO,startOfWeek,addDays},getDailyCapacity:date=>metaHoursForDate(date)*60,onChanged:renderWeeklyReplan,onConfirmed:({result})=>{scheduleSave();renderWeeklyReplan();renderPlanoHoje();showToast(`${pluralize(result.createdItems,'atividade')} redistribuída${result.createdItems===1?'':'s'} para os próximos dias.`)},onUndone:result=>{scheduleSave();renderWeeklyReplan();renderPlanoHoje();showToast(result.protectedItems.length?'Itens já executados foram preservados; os demais retornaram à origem.':'Redistribuição desfeita com segurança.')}});
function calculateReplanPreview(){return replanController.calculate()}
function clearReplanPreview(){return replanController.clear()}
function confirmReplan(){return replanController.confirm()}
function undoPlanAdjustment(id){return replanController.undo(id)}
function renderWeeklyReplan(){
  const container=document.getElementById('weeklyReplan');if(!container)return;
  const latest=[...state.planAdjustments].sort((a,b)=>(b.confirmedAt||'').localeCompare(a.confirmedAt||''))[0];
  const preview=replanController.view();
  if(!preview){container.innerHTML=`${latest?`<div class="confirmed-plan-note"><strong>Último ajuste ${latest.undoneAt?'desfeito':'aplicado'}</strong><span>${formatPlanMinutes(latest.redistributedMinutes)} redistribuídos · ${formatPlanMinutes(latest.discardedMinutes)} sem capacidade</span></div>`:''}<div class="study-plan-actions"><button class="btn" data-delegated-click="calculateReplanPreview()">Analisar execução da semana</button>${latest&&!latest.undoneAt&&latest.status!=='undone'&&latest.changes?.length?`<button class="btn ghost" data-delegated-click="undoPlanAdjustment('${latest.id}')">Desfazer redistribuição</button>`:''}</div>`;return}
  if(preview.state==='balanced'){container.innerHTML='<div class="upcoming-empty">Não há déficit de execução nos planos registrados nesta semana.</div><button class="btn ghost small" data-delegated-click="clearReplanPreview()">Fechar</button>';return}
  container.innerHTML=`${renderReplanProposal(preview,{escapeHtml,formatDate:formatDatePt,formatMinutes:formatPlanMinutes,subjectName:getSubjectName,topicName:getTopicName})}<div class="study-plan-actions">${preview.allocations.length?'<button class="btn" data-delegated-click="confirmReplan()">Confirmar redistribuição</button>':''}<button class="btn ghost" data-delegated-click="clearReplanPreview()">${preview.allocations.length?'Cancelar':'Fechar'}</button></div>`;
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
  const agendaBtn=document.getElementById('executionAgendaBtn'),sequenceBtn=document.getElementById('executionSequenceBtn');
  if(agendaBtn&&sequenceBtn){agendaBtn.setAttribute('aria-pressed',String(state.executionMode==='agenda'));sequenceBtn.setAttribute('aria-pressed',String(state.executionMode==='sequence'))}
  const priorities=computeStudyPriorities();
  const availableMinutes=Math.max(0,Math.round(metaHoursToday()*60));
  const plan=ensureTodayDailyStudyPlan(priorities,availableMinutes);

  if(!plan&&priorities.length===0){
    container.innerHTML='<div class="upcoming-empty">Nenhuma atividade elegível para o tempo disponível. Confira os pré-requisitos e a meta de hoje.</div>';
    return;
  }
  if(!plan){
    container.innerHTML='<div class="upcoming-empty">Defina uma meta diária de pelo menos 15 minutos para montar o plano.</div>';
    return;
  }

  const items=state.executionMode==='sequence'?[...plan.items].sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0)):plan.items;
  const todayModel=buildTodayViewModel({date:todayISO(),availableMinutes,plan,priorities,pastPlans:state.dailyPlans.filter(row=>row.date>=startOfWeek(todayISO()))});
  const listaHtml=items.map(item=>{
    const progress=item.plannedMinutes>0?Math.min(100,Math.round(item.executedSeconds/(item.plannedMinutes*60)*100)):0;
    const active=state.activeTimer.planItemId===item.id&&state.activeTimer.isRunning;
    const canStart=!['completed','deferred','replaced','skipped'].includes(item.status)&&!active;
    return `
    <div class="plano-item ${active?'is-active':''} ${item.status==='completed'?'is-completed':''}">
      <div class="plano-item-head">${escapeHtml(item.statusIcon||'📌')} ${escapeHtml(item.statusLabel||planItemStatusLabel(item.status))} · ${Number.isFinite(Number(item.score))?Math.round(Number(item.score))+'/100':'prioridade não calculada'}</div>
      <div class="plano-item-title">${escapeHtml(item.subjectName||getSubjectName(item.subjectId)||'Disciplina')} — ${escapeHtml(item.topicName||getTopicName(item.topicId)||'Tópico')}</div>
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
    <div class="study-plan-summary today-execution-summary"><div><strong>${formatPlanMinutes(todayModel.availableMinutes)}</strong><span>Disponível hoje</span></div><div><strong>${formatPlanMinutes(todayModel.plannedMinutes)}</strong><span>Planejado</span></div><div><strong>${formatPlanMinutes(todayModel.executedMinutes)}</strong><span>Executado · ${todayModel.progress??0}%</span></div></div>
    ${todayModel.recoveryMinutes?`<div class="replan-group is-warning"><strong>${formatPlanMinutes(todayModel.recoveryMinutes)} pendentes de dias anteriores</strong><span>Revise a redistribuição abaixo antes de aplicar qualquer ajuste.</span></div>`:''}
    ${listaHtml}
    ${plan.flexMinutes>0?`<div class="plano-depois"><div class="plano-depois-label">Tempo flexível:</div><div class="plano-depois-item">⏱️ ${formatPlanMinutes(plan.flexMinutes)} para pausas, correção ou continuidade</div></div>`:''}
    <div class="plano-meta">
      <div class="plano-depois-label">Planejamento:</div>
      <div class="plano-depois-item">⏱️ ${formatPlanMinutes(plan.plannedMinutes)} planejados · ${formatDuration(executedSeconds)} executado (${executionPct}%)</div>
    </div>
  `;
}
function renderGuidedOnboarding(){
  const entry=document.getElementById('guidedOnboarding'),overlay=document.getElementById('guidedOnboardingOverlay');
  if(!entry||!overlay)return;
  const model=onboardingModel();
  if(!uiState.onboarding.currentStep)uiState.onboarding.currentStep=model.current.id;
  const visible=model.visible&&!IS_DEMO_MODE;
  entry.hidden=!visible;
  document.getElementById('guidedOnboardingEntry').innerHTML=visible?renderOnboardingEntry(model,{escapeHtml}):'';
  overlay.hidden=!visible||!uiState.onboarding.open;
  overlay.classList.toggle('show',visible&&uiState.onboarding.open);
  if(!visible){uiState.onboarding.open=false;return}
  document.getElementById('guidedOnboardingProgress').innerHTML=renderOnboardingProgress(model);
  document.getElementById('guidedOnboardingContent').innerHTML=renderOnboardingContent(model,{escapeHtml,escapeAttr,formatMinutes:formatPlanMinutes});
  document.getElementById('guidedOnboardingHelp').innerHTML=renderOnboardingHelp(model,{escapeHtml});
  document.getElementById('guidedOnboardingActions').innerHTML=renderOnboardingActions(model);
  const manualBanner=document.getElementById('guidedManualReturn');
  if(manualBanner){manualBanner.hidden=!uiState.onboarding.manualReturn;manualBanner.querySelector('[data-guided-manual-return]').disabled=!model.hasContent}
}
function onboardingModel(){
  const canPreview=Boolean(state.examDate)&&Object.values(state.metas.horasPorDia).some(value=>Number(value)>0)&&state.subjects.some(subject=>!subject.archived&&subject.topics?.some(topic=>!topic.archived));
  return buildOnboardingViewModel({examDate:state.examDate,hoursByDay:state.metas.horasPorDia,subjects:state.subjects,sessions:state.studySessions,questions:state.questoes,dailyPlans:state.dailyPlans,studyPlans:state.studyPlans,planPreview:canPreview?buildCurrentStudyPlanProposal({guidedDefaults:true}):null,currentStep:uiState.onboarding.currentStep,today:todayISO(),presets:EXAM_PRESETS,presetId:uiState.onboarding.presetId});
}
function moveOnboarding(direction){const model=onboardingModel(),index=Math.max(0,Math.min(model.steps.length-1,model.currentIndex+direction));uiState.onboarding.currentStep=model.steps[index].id;renderGuidedOnboarding()}
async function openGuidedOnboarding({step=null}={}){try{await ensureExamCatalog();const model=onboardingModel();uiState.onboarding.previousFocus=document.activeElement;uiState.onboarding.open=true;uiState.onboarding.manualReturn=false;uiState.onboarding.currentStep=step||model.next?.id||model.current.id;document.body.classList.add('onboarding-open');renderGuidedOnboarding();requestAnimationFrame(()=>document.getElementById('guidedOnboardingClose')?.focus())}catch(error){showToast(error.message||'Não foi possível abrir a configuração inicial.')}}
function suspendGuidedOnboarding(){uiState.onboarding.open=false;renderGuidedOnboarding()}
function resumeGuidedOnboarding(step='content'){const model=onboardingModel();uiState.onboarding.currentStep=step==='plan'&&!model.hasContent?'content':step;uiState.onboarding.open=true;document.body.classList.add('onboarding-open');renderGuidedOnboarding();requestAnimationFrame(()=>document.getElementById('guidedOnboardingClose')?.focus())}
function closeGuidedOnboarding({manual=false}={}){const previousFocus=uiState.onboarding.previousFocus;uiState.onboarding.open=false;uiState.onboarding.dismissedForSession=!manual;uiState.onboarding.manualReturn=manual;document.body.classList.remove('onboarding-open');renderGuidedOnboarding();syncModalShell();const focusTarget=previousFocus?.isConnected?previousFocus:document.querySelector('#guidedOnboarding [data-guided-action="open"]');focusTarget?.focus?.();uiState.onboarding.previousFocus=null}
function setGuidedSubjectLevel(subjectId,level,{refresh=true}={}){if(!DIFFICULTY_OPTIONS.includes(level))return;const subject=getSubjectById(subjectId);if(!subject)return;for(const topic of subject.topics.filter(item=>!item.archived)){subjectService.updateTopic(subjectId,topic.id,{...topic,difficulty:level,estimatedStudyMinutes:topic.estimatedStudyMinutes??(level==='Difícil'?120:level==='Fácil'?45:75),fieldOrigins:{...(topic.fieldOrigins||{}),difficulty:'manual'}})}if(refresh)persistAndRender();else scheduleSave()}
function applyGuidedEffortDefaults(){for(const subject of activeSubjects())for(const topic of subject.topics.filter(item=>!item.archived))if(topic.estimatedStudyMinutes==null)topic.estimatedStudyMinutes=topic.difficulty==='Difícil'?120:topic.difficulty==='Fácil'?45:75}
function createGuidedInitialPlan(){if(!onboardingModel().canCreatePlan)return;applyGuidedEffortDefaults();calculateStudyPlanPreview();if(!studyPlanPreview||studyPlanPreview.state==='insufficient'||!studyPlanPreview.items.length){uiState.onboarding.currentStep='plan';renderGuidedOnboarding();showToast('Confira os dados indicados antes de confirmar o plano.');return}confirmStudyPlan();calculateDailyPlanPreview();if(dailyPlanPreview?.state==='proposal')confirmDailyPlanPreview();uiState.onboarding.currentStep='plan';uiState.onboarding.open=false;document.body.classList.remove('onboarding-open');render();activateTab('hoje');requestAnimationFrame(()=>document.querySelector('#planoHojeContent .btn')?.focus())}

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
  const completed = examScopedSimulations()
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
  const questions=examEvidenceContext().questions.included,total=questions.reduce((sum,q)=>sum+(Number(q.resolved)||0),0);
  const correct=questions.reduce((sum,q)=>sum+(Number(q.correct)||0),0);
  if(total===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem questões registradas'};
  const raw=(correct/total)*100;
  const confidence=Math.min(1,total/300);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:`${total} questões · acerto bruto ${Math.round(raw)}%`};
}

function approvalEditalMetric(){
  const topics=examScopedTopics();
  if(topics.length===0) return {score:50,confidence:0,available:false,raw:null,detail:'Sem tópicos cadastrados'};
  const concluded=topics.filter(t=>t.status==='Concluído').length;
  const raw=(concluded/topics.length)*100;
  const subjectsWithTopics=activeSubjects().filter(s=>s.topics.some(t=>!t.archived)).length;
  const confidence=Math.min(1,(topics.length/40)*0.55+(subjectsWithTopics/5)*0.45);
  return {score:clampScore(50+(raw-50)*confidence),confidence,available:true,raw,detail:`${concluded} de ${topics.length} tópicos concluídos`};
}

function approvalDominioMetric(){
  const topics=examScopedTopics();
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
  const due=examScopedRecords(getRevisoesUnificadas()).filter(r=>r.date&&r.date<=today);
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
  const simulations=examScopedSimulations()
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
  const weeklyMinutes=Object.values(state.metas.horasPorDia||{}).reduce((sum,hours)=>sum+(Number(hours)||0)*60,0),scenarios=buildPerformanceScenarios(result,{weeklyMinutes});
  return {
    available:true,low,high,central:result.currentBand.central,confidence,
    confidenceLabel:result.currentBand.confidenceLabel,gap:result.gap,movingAverage:result.movingAverage,forecast30:result.forecast30,evidence:result.evidence,scenarios,
    detail:'Base: '+sources.map(source=>source.label).join(', ')+' · margem ajustada pela confiança'
  };
}

function performanceForecastObservations(){
  return Array.from({length:12},(_,index)=>getWeekRange(11-index)).map(({start,end})=>{
    const questions=validQuestionRecords().filter(item=>item.date>=start&&item.date<=end);
    let total=questions.reduce((sum,item)=>sum+(Number(item.resolved)||0),0);
    let correct=questions.reduce((sum,item)=>sum+(Number(item.correct)||0),0);
    examScopedSimulations().filter(item=>item.date>=start&&item.date<=end).forEach(item=>{const counts=simuladoEffectiveCounts(item);total+=counts.total;correct+=counts.correct});
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
  const cutoff=addDays(today,-59);
  const questions=validQuestionRecords().filter(q=>q.topicId===topicId&&q.date>=cutoff&&q.date<=today);
  const resolved=questions.reduce((n,q)=>n+(Number(q.resolved)||0),0),correct=questions.reduce((n,q)=>n+(Number(q.correct)||0),0);
  const dates=done.map(r=>localDateFromTimestamp(r.completedAt)).filter(Boolean).sort();
  const lastReview=dates[dates.length-1]||localDateFromTimestamp(found.topic.lastReviewedAt)||null;
  const daysSince=lastReview?Math.max(0,-(diasParaRevisao(lastReview)??0)):null;
  return calculateTopicRetention({due,resolved,correct,lastReview,daysSince,onTime,periodStart:cutoff,periodEnd:today});
}

function topicReviewHealthScore(topic,masteryResult=topicMasteryIndex(topic.subjectId,topic.id),retentionResult=topicRetentionScore(topic.subjectId,topic.id),diagnosis=diagnoseTopic(topic.subjectId,topic.id)){
  const lastReviewDate=localDateFromTimestamp(topic.lastReviewedAt);
  const daysSinceReview=lastReviewDate?Math.max(0,-(diasParaRevisao(lastReviewDate)??0)):null;
  const evidenceValues=[masteryResult?.confidence,retentionResult?.confidence].filter(value=>Number.isFinite(Number(value)));
  const evidenceStrength=evidenceValues.length?evidenceValues.reduce((sum,value)=>sum+Number(value),0)/evidenceValues.length:null;
  return calculateReviewHealth({daysSinceReview,hasPriorStudy:topic.status!=='Não iniciado'||Boolean(diagnosis?.performance?.resolved)||Boolean(diagnosis?.studySeconds),retention:retentionResult?.available?retentionResult.score:null,
    mastery:masteryResult?.confidence>0?masteryResult.score:null,recentPerformance:diagnosis?.performance?.accuracy??null,
    examImpact:topic.examImportance==null?null:Number(topic.examImportance)*100,evidenceStrength});
}

function approvalRetencaoMetric(){
  const topics=examScopedTopics(),values=topics.map(t=>topicRetentionScore(t.subjectId,t.id)).filter(x=>x.available);
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
  const today=todayISO(),byDate=studySecondsByDate(examEvidenceContext().sessions.included);
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
  ${projection.available?`<section class="performance-forecast" aria-label="Projeção de desempenho"><div><span class="section-eyebrow">PROJEÇÃO DE DESEMPENHO</span><strong>Faixa atual: ${projection.low}–${projection.high}%</strong><small>${projection.gap.minimum===0?'A meta de '+projection.gap.target+'% está dentro da faixa atual.':'Gap estimado até a meta: '+projection.gap.minimum+'–'+projection.gap.maximum+' p.p.'}</small></div><div><strong>${projection.forecast30.available?'Em 30 dias: '+projection.forecast30.low+'–'+projection.forecast30.high+'%':'Projeção de 30 dias aguardando dados'}</strong><small>${projection.forecast30.available?'Média móvel: '+projection.movingAverage+'% · tendência '+(projection.forecast30.slopePerWeek>=0?'+':'')+projection.forecast30.slopePerWeek+' p.p./semana · confiança '+projection.forecast30.confidenceLabel:escapeHtml(projection.forecast30.reason)}</small></div>${renderPerformanceScenarios(projection.scenarios,{escapeHtml})}<p>${projection.evidence.observationCount} semanas · ${projection.evidence.sampleSize} questões/simulações na amostra. Cenários são simulações de capacidade; não representam garantia nem efeito causal.</p></section>`:''}
  <details class="readiness-explanation"><summary>Como este índice foi calculado?</summary><p>Os pesos são redistribuídos somente entre fatores com dados. Fatores ausentes reduzem a confiança e nunca recebem nota zero.</p><ul>${factors.map(([label,item,key])=>`<li><strong>${label}</strong>: ${item.available?item.score+'/100 · confiança '+Math.round(item.confidence*100)+'%':'aguardando dados'}${item.detail?' · '+escapeHtml(item.detail):''}</li>`).join('')}</ul></details>
  <div class="approval-scale"><span class="approval-scale-danger">🔴 0–49</span><span class="approval-scale-warn">🟠 50–69</span><span class="approval-scale-good">🟢 70–84</span><span class="approval-scale-great">🏆 85+</span></div>
  <ul class="upcoming-list" style="margin-top:14px">${gerarDiagnosticoAprovacao(m).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  renderTopicRetentionDashboard();
  renderRecommendationCalibration();
  renderStudyTrack32Insights();
}
function renderRecommendationCalibration(){const el=document.getElementById('recommendationCalibration');if(!el)return;const subjectNames=Object.fromEntries(state.subjects.map(item=>[item.id,item.name])),topicNames=Object.fromEntries(state.subjects.flatMap(subject=>(subject.topics||[]).map(topic=>[topic.id,topic.name]))),model=buildRecommendationCalibration(state.recommendationFeedback,{minimumSample:5,subjectNames,topicNames});el.innerHTML=renderRecommendationCalibrationModel(model,{escapeHtml})}
let currentStudyTrackModel=null;
let weeklyCloseController=null;
function renderStudyTrack32Insights(){
 const close=document.getElementById('weeklyCloseDashboard'),comparison=document.getElementById('periodComparisonDashboard'),gaps=document.getElementById('gapMapDashboard'),history=document.getElementById('decisionHistoryDashboard'),simReplan=document.getElementById('postSimulationReplanDashboard');
 const scope=examEvidenceContext(),scopedSubjectIds=new Set(scope.content.eligibleTopics.map(item=>item.subjectId)),model=buildStudyTrack32ViewModel({today:todayISO(),sessions:scope.sessions.included,questions:scope.questions.included,dailyPlans:planningRepository.getDailyPlans?.()||[],planAdjustments:state.planAdjustments,recommendations:state.recommendationFeedback,simulations:examScopedSimulations(),subjects:state.subjects.filter(subject=>scopedSubjectIds.has(subject.id)),weeklyCapacityMinutes:Object.values(state.metas.horasPorDia||{}).reduce((sum,hours)=>sum+(Number(hours)||0)*60,0),targetAccuracy:Number(state.metas.metaAprovacao)||80,algorithmServices:{addDays,buildWeeklyClose,buildGapMap,buildDecisionHistory,buildPostSimulationReplan,buildCandidates:intelligenceCandidates},nameResolvers:{subject:getSubjectName,topic:getTopicName}}),options={escapeHtml,formatMinutes:formatPlanMinutes};currentStudyTrackModel=model;
 if(close)close.innerHTML=renderWeeklyClose(model.weeklyClose,{...options,selectedPriorityIds:weeklyCloseController?.view().selectedIds||[]})+(model.weeklyClose.state==='insufficient'?'':renderWeeklyCloseActions(model.weeklyClose)) + renderWeeklySnapshotHistory();
 if(comparison)comparison.innerHTML=renderPeriodComparison(model.weeklyClose,options);
 if(gaps)gaps.innerHTML=renderGapMap(model.gapMap,options);
 if(history)history.innerHTML=renderDecisionHistory(model.decisionHistory,options);
 if(simReplan)simReplan.innerHTML=renderPostSimulationReplan(model.postSimulation,options);
}
function renderWeeklySnapshotHistory(){return ''}
function renderWeeklyCloseActions(close){const priorities=close.priorities||[];if(!priorities.length)return `<button class="btn ghost small" data-delegated-click="saveWeeklyCloseSnapshot()">Salvar fechamento desta semana</button>`;const draft=weeklyCloseController.view(),checks=priorities.map((item,index)=>{const id=item.priorityId||item.topicId||String(index);return `<label class="weekly-priority-choice"><input type="checkbox" data-delegated-change="toggleWeeklyPriority('${escapeAttr(id)}',this.checked)" ${draft.selectedIds.includes(id)?'checked':''}><span>${escapeHtml(item.action)} · ${formatPlanMinutes(item.estimatedMinutes)}</span></label>`}).join('');const proposal=draft.proposal;return `<section class="weekly-close-actions"><h4>Decida as prioridades</h4>${checks}<button class="btn ghost small" data-delegated-click="previewWeeklyCloseActions()">Conferir impacto</button>${proposal?`<div class="weekly-action-preview"><strong>${proposal.allocations.length} alocações · ${formatPlanMinutes(proposal.unallocatedMinutes)} sem capacidade</strong><button class="btn small" data-delegated-click="confirmWeeklyCloseActions()">Aplicar prioridades selecionadas</button></div>`:''}<button class="btn ghost small" data-delegated-click="saveWeeklyCloseSnapshot()">Salvar fechamento desta semana</button></section>`}
function previewWeeklyCloseActions(){weeklyCloseController.preview()}
function toggleWeeklyPriority(id,checked){weeklyCloseController.toggle(id,checked)}
function confirmWeeklyCloseActions(){weeklyCloseController.apply()}
weeklyCloseController=createWeeklyCloseController({getModel:()=>currentStudyTrackModel,getState:()=>state,buildProposal:buildWeeklyCloseActionProposal,createSnapshot:createWeeklyCloseSnapshot,upsertSnapshot:upsertWeeklyCloseSnapshot,clock:{today:todayISO,nowISO,addDays},idGenerator:uid,getDailyCapacity:date=>metaHoursForDate(date)*60,onChanged:renderStudyTrack32Insights,onApplied:()=>{scheduleSave();renderStudyTrack32Insights();renderPlanoHoje();showToast('Prioridades aceitas aplicadas ao plano diário.')}})
function saveWeeklyCloseSnapshot(){const snapshot=createWeeklyCloseSnapshot(currentStudyTrackModel,{savedAt:nowISO(),id:uid('weekly-close')});if(!snapshot)return showToast('Ainda não há dados suficientes para salvar o fechamento.');upsertWeeklyCloseSnapshot(state.weeklyCloseSnapshots,snapshot);scheduleSave();showToast('Fechamento semanal salvo como retrato deste período.')}
function renderTopicRetentionDashboard(){
  const el=document.getElementById('topicRetentionDashboard');if(!el)return;
  const baseRows=activeTopics().map(t=>{const r=topicRetentionScore(t.subjectId,t.id);return {...t,r,h:topicReviewHealthScore(t,topicMasteryIndex(t.subjectId,t.id),r)}}).filter(x=>x.r.available||x.h.value!==null);
  const confidenceMatch=row=>retentionView.confidence==='all'||row.r.confidenceLabel.toLowerCase()===retentionView.confidence;
  const rows=baseRows.filter(row=>(!retentionView.subjectId||row.subjectId===retentionView.subjectId)&&confidenceMatch(row)).sort((a,b)=>{
    const av=a.r.available?a.r.score:a.h.value,bv=b.r.available?b.r.score:b.h.value;
    const score=retentionView.order==='desc'?bv-av:av-bv;
    return score||a.r.confidence-b.r.confidence||a.subjectName.localeCompare(b.subjectName)||a.name.localeCompare(b.name);
  });
  el.innerHTML=renderTopicRetentionDashboardView({rows,subjects:activeSubjects(),filters:retentionView,showAll:retentionShowAll,renderFooter:renderCollectionFooter,escapeHtml,escapeAttr});
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
const DELEGATED_ACTION_HANDLERS={
  addAgendaRow,addBreakdownRow,addCalRow,addQuestaoRow,addSimuladoRow,addSubject,addTopic,applyTodayGoalToAllDays,archiveSubject,archiveTopic,clearWeekendGoals,
  calculateStudyPlanPreview,clearStudyPlanPreview,confirmStudyPlan,useAdaptivePlanAdvice,calculateDailyPlanPreview,clearDailyPlanPreview,confirmDailyPlanPreview,undoLatestDailyPlanGeneration,
  calculateReplanPreview,clearReplanPreview,confirmReplan,undoPlanAdjustment,saveWeeklyCloseSnapshot,previewWeeklyCloseActions,confirmWeeklyCloseActions,toggleWeeklyPriority,executeStudyRecommendation,
  cancelAgendaEdit,cancelCalendarEdit,cancelQuestionEdit,cancelSimulationEdit,cancelStudySessionEdit,changeAgendaLimit,changeCalendarLimit,changeOverdueGroupLimit,changePerformanceLimit,changeSubjectTopicLimit,changeUpcomingLimit,clearSessionHistoryFilters,completeAgendaReview,completeCalendarItem,completeUnifiedReview,deleteAgendaRow,
  deleteBreakdownRow,deleteCalRow,deleteMetaDisciplina,deleteQuestaoRow,deleteSimuladoRow,deleteStudySession,duplicateSubject,
  editAgenda,editCalendarItem,editQuestion,editSimulation,editStudySession,focusStudyTimer,toggleTimerFocus,gerarAgendaAutomatica,moveSubject,navigateKpi,renameSubject,selectHeatmapDay,setHeatmapFilter,viewSelectedHeatmapSessions,
  advanceGuidedStrategy,dismissIntelligentAlert,dismissStudyRecommendation,markRecommendationNotUseful,rateRecommendationOutcome,startStudyRecommendation,
  requestPermanentSubjectDelete,requestPermanentTopicDelete,resetAdaptiveReviewDate,resetAgendaLimit,resetCalendarLimit,resetOverdueGroupLimit,resetPerformanceLimit,resetRetentionLimit,resetSubjectTopicLimit,resetUpcomingLimit,restoreSubject,restoreTopic,saveAgendaEdit,saveCalendarEdit,saveQuestionEdit,setPerformanceViewMode,setRadarSubject,setRetentionFilter,setSubjectExamFilter,setSubjectTopicFilter,toggleActiveExamTag,
  saveSimulationEdit,saveStudySessionEdit,selectSessionHistoryDate,showAllOverdueGroups,showAllPerformance,showAllRetention,showAllSubjectTopics,showAllUpcoming,startPlannedActivity,toggleBreakdown,toggleNotes,
  toggleCompletedReviews,toggleFilterPanel,toggleOverdueDate,toggleQuestionErrors,toggleSessionDay,toggleSessionDetails,toggleStreakActiveDays,toggleStreakExpanded,toggleSubject,updateAgenda,updateAgendaDraft,updateBreakdownRow,updateCal,updateCalendarDraft,updateMeta,
  updateMetaDisciplina,updateMetaHoursDay,updateQuestionDraft,updateQuestionError,updateSessionHistoryFilter,
  setErrorAnalysisFilter,updateSimulationDraft,updateStudySessionDraft,updateTopic,updateTopicStatus,updateTopicTags,updateTopicStrategy,toggleTopicPrerequisite,updateExamBlueprint,updateExamSubject
};
function delegatedArgument(expression,element){
  const value=expression.trim();
  if(value==='this.value')return element.value;
  if(value==='this.value||null')return element.value||null;
  if(value==='this.textContent')return element.textContent;
  if(value==='this.checked')return Boolean(element.checked);
  if(value==='this')return element;
  if(value==='true')return true;
  if(value==='false')return false;
  if(value==='null')return null;
  if(value==='parseLocalDate(todayISO()).getDay()')return parseLocalDate(todayISO()).getDay();
  if(/^-?\d+(?:\.\d+)?$/.test(value))return Number(value);
  if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1).replace(/\\(['"\\])/g,'$1');
  throw new Error('Argumento de evento não permitido: '+value);
}
function resolveDelegatedSpecial(normalized,event,element){
  if(normalized==='performanceSubjectId=this.value;renderQuestionAnalytics()'){performanceSubjectId=element.value;renderQuestionAnalytics();return true}
  const listMatch=normalized.match(/^changeListLimit\('(questions|simulations|sessionDays)',(-?)(?:LIST_VIEW_STEPS\.\1|listViewState\.\1Visible),(renderQuestoes|renderSimulados|renderStudySessionsHistory)\)$/);
  if(listMatch){
    const delta=(listMatch[2]? -listViewState[`${listMatch[1]}Visible`] : LIST_VIEW_STEPS[listMatch[1]]);
    const renderers={renderQuestoes,renderSimulados,renderStudySessionsHistory};
    changeListLimit(listMatch[1],delta,renderers[listMatch[3]]); return true;
  }
  return false;
}
createDelegatedEventsController({document,handlers:DELEGATED_ACTION_HANDLERS,parseArgument:delegatedArgument,resolveSpecial:resolveDelegatedSpecial,onError:error=>{console.error('Evento delegado bloqueado',error);showToast('Uma ação inválida foi bloqueada por segurança.')}}).register();
/* ===== MASTER RENDER ===== */
const RENDER_SCOPE_SECTIONS={
  dashboard:new Set(['primeiro uso','ação e atenção','dashboard de aprovação','controles do cronômetro','evolução do progresso','heatmap','conquistas','radar','visão geral','horas estudadas','histórico de sessões']),
  disciplinas:new Set(['disciplinas','primeiro uso']),
  calendario:new Set(['indicadores do calendário','tarefas de hoje','tarefas atrasadas','filtros do calendário','calendário','calendário mensal']),
  agenda:new Set(['filtros da agenda','agenda']),
  questoes:new Set(['questões','análise de questões','simulados','gráfico de simulados','desempenho por disciplina']),
  metas:new Set(['metas','configuração estratégica','plano até a prova','metas de horas por dia','metas por disciplina','histórico de metas','ritmo']),
  hoje:new Set(['resumo executivo','central de diagnóstico','recomendação de estudo','replanejamento','tarefas da aba hoje','atrasos da aba hoje','simulados planejados','metas de hoje','alertas','plano de hoje'])
};
function activeTabName(){return document.querySelector('.tab-btn.active')?.dataset.tab||'dashboard'}
let applicationRenderer;
const errorBoundary=createErrorBoundaryController({document,onRetry:()=>render('active')});
applicationRenderer=createApplicationRenderer({
  sections:[
    ['indicadores',renderKPIs],
    ['primeiro uso',renderGuidedOnboarding],
    ['ação e atenção',renderOverviewDecisionArea],
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
    ['tarefas da aba hoje',()=>renderCalTarefasHoje('hojeTarefasHoje')],
    ['atrasos da aba hoje',()=>renderCalAtrasadas('hojeAtrasadas')],
    ['simulados planejados',renderSimuladosPlanejados],
    ['metas de hoje',renderMetasHoje],
    ['alertas',renderAlertasInteligentes],
    ['plano de hoje',renderPlanoHoje]
  ],scopes:RENDER_SCOPE_SECTIONS,globalSections:['indicadores','cabeçalho'],getActiveScope:activeTabName,afterRender:labelDynamicControls,onError:(error,name)=>errorBoundary.report(error,name)
});
function render(scope='all'){const result=applicationRenderer.render(scope);try{renderStudyTrack32Insights()}catch(error){errorBoundary.report(error,'análises estratégicas')}return result}
function persistAndRender(){
  render('active');
  scheduleSave();
}
function renderAll(){ render(); }

/* ===== ATALHOS DE TECLADO ===== */
navigationController.registerShortcuts();
const modalLayers=[...document.querySelectorAll('.modal-overlay'),document.getElementById('guidedOnboardingOverlay')].filter(Boolean);
const syncModalShell=()=>{const active=modalLayers.some(layer=>layer.classList.contains('show')&&!layer.hidden);document.getElementById('mainContent').inert=active;document.body.classList.toggle('modal-open',active)};
const modalObserver=new MutationObserver(syncModalShell);
modalLayers.forEach(layer=>modalObserver.observe(layer,{attributes:true,attributeFilter:['class','hidden']}));
syncModalShell();

document.querySelectorAll('[data-go-home]').forEach(button=>button.addEventListener('click',()=>{
  activateTab('dashboard');
  window.scrollTo({top:0,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}));
document.getElementById('guidedOnboardingOverlay')?.addEventListener('change',event=>{
  if(event.target.id==='guidedExamPreset'){uiState.onboarding.presetId=event.target.value;return}
  if(event.target.id==='guidedExamDate'){updateExamBlueprint('examDate',event.target.value,{refresh:false});document.querySelector('#guidedOnboardingActions [data-guided-action="next"]').disabled=!onboardingModel().canAdvance;return}
  if(event.target.dataset.guidedDay!==undefined){updateMetaHoursDay(event.target.dataset.guidedDay,event.target.value,{refresh:false});const model=onboardingModel();document.querySelector('#guidedOnboardingActions [data-guided-action="next"]').disabled=!model.canAdvance;document.querySelector('#guidedOnboardingContent .guided-capacity strong').textContent=formatPlanMinutes(model.availableMinutes);return}
  if(event.target.dataset.guidedLevel)setGuidedSubjectLevel(event.target.dataset.guidedLevel,event.target.value,{refresh:false});
});
document.getElementById('guidedOnboarding')?.addEventListener('click',event=>{if(event.target.closest('[data-guided-action="open"]'))openGuidedOnboarding()});
document.getElementById('guidedOnboardingOverlay')?.addEventListener('click',event=>{
  const action=event.target.closest('[data-guided-action]')?.dataset.guidedAction;if(!action)return;
  if(action==='cancel')closeGuidedOnboarding();
  if(action==='back')moveOnboarding(-1);
  if(action==='next')moveOnboarding(1);
  if(action==='import')openExamImport(uiState.onboarding.presetId,'onboarding');
  if(action==='structured'){structuredImportOrigin='onboarding';structuredImportController.choose()}
  if(action==='manual'){closeGuidedOnboarding({manual:true});activateTab('disciplinas');document.getElementById('addSubjectBtn')?.focus()}
  if(action==='availability'){uiState.onboarding.currentStep='availability';renderGuidedOnboarding()}
  if(action==='create-plan')createGuidedInitialPlan();
});
document.getElementById('guidedOnboardingClose')?.addEventListener('click',closeGuidedOnboarding);
document.querySelector('[data-guided-manual-return]')?.addEventListener('click',()=>{activateTab('dashboard');openGuidedOnboarding({step:'content'})});
document.getElementById('guidedOnboardingOverlay')?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeGuidedOnboarding()}});
document.getElementById('executionAgendaBtn')?.addEventListener('click',()=>{state.executionMode='agenda';scheduleSave();renderPlanoHoje()});
document.getElementById('executionSequenceBtn')?.addEventListener('click',()=>{state.executionMode='sequence';scheduleSave();renderPlanoHoje()});

/* ===== VOLTAR AO TOPO ===== */
const backToTopBtn=document.getElementById('backToTopBtn');
if(backToTopBtn){
  const syncBackToTop=()=>{backToTopBtn.hidden=window.scrollY<600};
  window.addEventListener('scroll',syncBackToTop,{passive:true});
  backToTopBtn.addEventListener('click',()=>{
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0,behavior:reducedMotion?'auto':'smooth'});
    document.getElementById('mainContent')?.focus({preventScroll:true});
  });
  syncBackToTop();
}
registerApplicationLifecycle({window,onBeforeUnload:()=>{if(!TEST_MODE&&!suppressBeforeUnloadSave)writeLocalState(JSON.stringify(pickPersistentState(state)))},onResponsiveChange:()=>{renderQuestoes();renderSimulados();renderStudySessionsHistory();renderAgenda();renderCalendar()}});

setCalendarMobileView('month');
const initialTab = location.hash.replace('#','');
if(document.querySelector(`.tab-btn[data-tab="${initialTab}"]`)) activateTab(initialTab, false);

if(TEST_MODE){
  const pristineTestState=structuredCloneSafe(state);
  window.__EXTRATO_TEST__={
    CURRENT_SCHEMA_VERSION,STATUS_OPTIONS,DIFFICULTY_OPTIONS,APP_MODE,IS_DEMO_MODE,
    getState:()=>state,
    settleSaves:async()=>{if(saveTimeout){clearTimeout(saveTimeout);saveTimeout=null}await saveQueue},
    setState:value=>{state=migrateState(structuredCloneSafe(value));ensureStateDefaults();return state},
    refreshTimerDisplay:()=>{timerSeconds=currentTimerSeconds();updateTimerDisplay()},
    resetState:()=>{state=structuredCloneSafe(pristineTestState);ensureStateDefaults();return state},
    migrateState:value=>migrateState(structuredCloneSafe(value)),validateBackupData,validateNormalizedBackup,
    startOfWeek,isSameWeek,addDays,diasParaRevisao,parseLocalDate,todayISO,localDateFromTimestamp,
    calculateAdaptiveInterval,adaptiveReviewSuggestion,
    syncQuestionFromStudySession,getSubjectDependencies,getTopicDependencies,
    computeApprovalMetrics,indiceProntidao,readinessResult,calculateReadinessScore,computeStudyPriorities,topicRetentionScore,topicMasteryIndex,intelligenceCandidates,studyPlanCandidates,buildStudyPlan,renderAll,
    sha256,rotateAutomaticBackup,StorageManager,structuredCloneSafe
  };
  ensureStateDefaults();restoreTimerFromState();render();
  const testScript=document.createElement('script');testScript.src='tests/tests.js';document.body.appendChild(testScript);
}else{
  bootstrapApplication({context:appContext,start:loadState,onError:error=>console.error('Falha na inicialização do aplicativo',error)});
}
