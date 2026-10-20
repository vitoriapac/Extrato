# Graph Report - Extrato  (2026-10-20)

## Corpus Check
- 751 files · ~403,109 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .css 2, .toml 1)

## Summary
- 4131 nodes · 11521 edges · 185 communities (163 shown, 22 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 714 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4591804f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- app.bundle.js
- escapeHtml
- todayISO
- persistAndRender
- nowISO
- Q
- utils.js
- report-template.js
- L
- build-adherence-model.js
- ref_node_assert
- apply-recovery-plan.js
- addLocalDays
- question-import-normalizer.js
- @playwright/test
- Ts
- resolveExamPhase
- exam-catalog.js
- me
- help-content.js
- isTopicInExamScope
- parseLocalDate
- en
- decision-coherence/scenarios.js
- intelligence-integration.test.js
- ve
- performance-subjects-renderer.js
- build-studytrack32-view-model.js
- recommendation-history.js
- renderHeatmap
- weekly-close-adherence.test.js
- freezePlanExecution
- adaptive-planning.js
- consolidated-signal.js
- renderSubjects
- oe
- achievement-projection-history.test.js
- analytical-presentation.js
- report-data.js
- buildWeeklyStrategicFocus
- demo-mode.test.js
- achievement-projection-renderer.js
- buildRecommendationExplanation
- qp
- build-consolidated-signals.js
- check-test-tiers.mjs
- H
- build-study-candidates.js
- build-sustainability-model.js
- collection-repository.js
- README.md
- renderChartFrame
- simulations-renderer.js
- build-performance-consistency.js
- compareReadinessSnapshots
- buildTopicExamProfile
- build-achievement-projection.js
- structured-content-import.js
- README.md
- performance-overview-renderer.js
- Mo
- renderGuidedOnboarding
- daily-execution.test.js
- build-exam-matrix.js
- scripts
- StudyTrack — Extrato de Estudos
- readiness-overview-renderer.js
- Recomendações de melhorias --- StudyTrack
- renderStudyTrack32Insights
- renderEvidenceQuality
- adapt-diagnostic-signals.js
- buildRecommendationExplanation
- storage-services.test.js
- reviews.js
- error-analysis.test.js
- buildCalibratedScoreProjection
- topic-strategy.js
- build-analytics-view-model.js
- exam-matrix-renderer.js
- exam-intelligence-stress.test.js
- Gráficos de desempenho e planejamento
- Sustentabilidade do planejamento
- Spec: build-hygiene
- packages-3-5.test.js
- analytics.test.js
- exam-import-feature.test.js
- visual-consistency-renderers.test.js
- performance-simulations-renderer.js
- Consolidação da experiência — ciclo iniciado em c28b51d
- Auditoria de jornadas e simplificação
- Validação do ciclo estratégico
- planning-sustainability.spec.js
- compilerOptions
- run-test-gate.mjs
- study-session.js
- demo-intelligence-scenarios.test.js
- product-consolidation.test.js
- progressive-list.js
- adherence-renderer.js
- Estratégia de validação por risco
- build.mjs
- adherence-target.test.js
- CAPABILITY-MAP-review-remediation.md
- build-weekly-decision-cycle.js
- outcome-service.js
- strategic-cycle.js
- Inteligência consolidada
- Recovery e execução diária
- select-affected-tests.mjs
- ensureStateDefaults
- app-state.js
- Arquitetura
- Spec: remote-sync
- Design System do StudyTrack
- Contrato da experiência de decisão
- Inventário de propriedade das informações
- run-experience-gate.mjs
- affected-test-plan.js
- readiness-history.js
- freezePlanExecution
- crypto-utils.js
- projection-scenarios.test.js
- Pacotes de implementação
- Hierarquia visual do StudyTrack
- ref_node_path
- audit-test-suite.mjs
- build-onboarding-view-model.js
- recommendation-calibration.js
- remote-sync-controller.test.js
- Contrato de hierarquia da informação
- check-test-selection.mjs
- renderRecommendationFollowup
- distribute-study-plan.js
- buildPerformanceForecast
- backup-schema24-cycle.spec.js
- study-history.js
- Requisitos
- build-recommendation-outcome-view-model.js
- exam-import-renderer.js
- demo-controller.test.js
- buildCalibratedScoreProjection
- StudyTrack — estratégia de testes
- Plano do dia, sugestões e metas iniciais
- Refinamento visual: referência inicial
- Consolidação do ciclo estratégico
- review-service.test.js
- ref_node_fs
- capacity-review-preview.test.js
- topic-history-service.test.js
- Plano: question-import
- backup-controller.test.js
- delegated-events-controller.js
- navigation-controller.js
- studytrack32-renderer.js
- Demo e validação da trajetória
- Navegação de conteúdo e leitura dos indicadores
- Evidência de retenção e composição da execução
- Plano: build-hygiene
- Jornada do StudyTrack
- Fundação visual — pacote 1
- Auditoria de segurança — StudyTrack
- study-strategy.js
- build-performance-analysis.js
- calculateSubjectRadar
- performance-scenarios.js
- refinement-visual.spec.js
- tests.js
- Fechamento da auditoria de confiança e acessibilidade
- Segurança
- question-import-controller.js
- structured-import-controller.js
- editable-collection-controller.test.js
- renderPhaseStrategy
- Testes
- renderStudyDistribution
- service-worker.js
- service-worker.template.js

## God Nodes (most connected - your core abstractions)
1. `addLocalDays()` - 91 edges
2. `todayISO()` - 83 edges
3. `parseLocalDate()` - 77 edges
4. `escapeHtml()` - 69 edges
5. `@playwright/test` - 63 edges
6. `persistAndRender()` - 62 edges
7. `showToast()` - 60 edges
8. `activateTab()` - 55 edges
9. `escapeAttr()` - 51 edges
10. `renderStudyTrack32Insights()` - 50 edges

## Surprising Connections (you probably didn't know these)
- `R1 — Confirmação antes de sobrescrever a nuvem (#3)` --references--> `showConfirm()`  [INFERRED]
  docs/SPEC-remote-sync.md → src/app.js
- `R3 — Data padrão local (#6)` --references--> `todayISO()`  [INFERRED]
  docs/SPEC-question-import.md → src/app.js
- `Riscos` --references--> `applyImportedBackup()`  [INFERRED]
  tasks/plan-question-import.md → src/app.js
- `Estado atual` --references--> `escapeAttr()`  [INFERRED]
  SECURITY-AUDIT.md → src/app.js
- `Consolidação de produto — pacotes 3–5` --references--> `compareReadinessSnapshots()`  [INFERRED]
  docs/CONSOLIDATED-INTELLIGENCE.md → src/application/analytics/build-readiness-evolution.js

## Import Cycles
- None detected.

## Communities (185 total, 22 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.01
Nodes (187): agendaUiState, appClock, appContext, backToTopBtn, BADGES, calendarEditController, calendarService, calendarUiState (+179 more)

### Community 1 - "app.bundle.js"
Cohesion: 0.02
Nodes (120): a0(), ab(), aC(), ah(), b0(), bb(), bc(), Bh() (+112 more)

### Community 2 - "escapeHtml"
Cohesion: 0.06
Nodes (89): activeTimerMatchesRecommendation(), agendaViewModel(), analysisContextBanner(), calcAcertoPct(), calculateDailyPlanPreview(), calendarViewModel(), cancelExamSubjectConfig(), cancelPhaseStrategy() (+81 more)

### Community 3 - "todayISO"
Cohesion: 0.05
Nodes (96): accuracyFromCounts(), adaptiveReviewSuggestion(), addDays(), addSimuladoRow(), approvalConsistenciaMetric(), approvalRevisoesMetric(), buildCurrentStudyPlanProposal(), calculateWeightedTrend() (+88 more)

### Community 4 - "persistAndRender"
Cohesion: 0.03
Nodes (94): R5 — Importação atômica (#8), activateTab(), activeTabName(), addMetaDisciplina(), addSubject(), addTopic(), applyConfirmedRecoveryPlan(), applyImportedBackup() (+86 more)

### Community 5 - "nowISO"
Cohesion: 0.06
Nodes (73): addQuestaoRow(), advanceGuidedStrategy(), allTopics(), buildDailyStudyPlan(), buildReadinessBeforeStrategySnapshot(), classificacaoAprovacao(), clearStudyPlanPreview(), closeSessionModal() (+65 more)

### Community 6 - "Q"
Cohesion: 0.05
Nodes (79): ag(), ak(), b1(), bM(), Bn(), Bx(), c1(), Co() (+71 more)

### Community 7 - "utils.js"
Cohesion: 0.06
Nodes (51): validateBackupData(), validateNormalizedBackup(), aggregate(), buildPeriodComparisonViewModel(), entryDate(), resolveRange(), shiftRange(), within() (+43 more)

### Community 8 - "report-template.js"
Cohesion: 0.22
Nodes (16): printStrategicReport(), bars(), comparisonValue(), date(), duration(), escape(), metricLabels, renderAdaptiveReport() (+8 more)

### Community 9 - "L"
Cohesion: 0.07
Nodes (54): B(), be(), bf(), ce(), cf(), cu(), cx(), Da() (+46 more)

### Community 10 - "build-adherence-model.js"
Cohesion: 0.10
Nodes (28): ADHERENCE_STATUS_POLICY, adherenceStatus(), labels, buildAdherenceChangeExplanation(), direction(), finite(), buildAdherenceModel(), adherencePercent() (+20 more)

### Community 11 - "ref_node_assert"
Cohesion: 0.06
Nodes (19): buildAchievementViewModel(), buildHeaderViewModel(), buildExecutiveSummary(), buildWeeklyAvailability(), clampHours(), createReplanController(), createRecommendationController(), registerApplicationLifecycle() (+11 more)

### Community 12 - "apply-recovery-plan.js"
Cohesion: 0.05
Nodes (54): questionImportService, buildWeeklyCloseActionProposal(), createWeeklyCloseController(), createDailyPlanService(), createReplanService(), createStudyPlanService(), applyRecoveryPlan(), confirmRecoveryDraft() (+46 more)

### Community 13 - "addLocalDays"
Cohesion: 0.08
Nodes (43): buildWeeklyCloseAdherence(), buildHistoricalReadinessMetrics(), createReadinessSnapshot(), buildDecisionCoherenceReport(), NEXT_BEST_ACTION_STATES, DECISION_REASON_CODES, DECISION_REASON_LABELS, decisionReasonCode() (+35 more)

### Community 14 - "question-import-normalizer.js"
Cohesion: 0.07
Nodes (37): Comandos, Critérios de sucesso, Decisões (aprovadas em 2026-10-20), Estilo, Estrutura, Fora de escopo, Limites, Objetivo (+29 more)

### Community 15 - "@playwright/test"
Cohesion: 0.10
Nodes (14): @axe-core/playwright, @playwright/test, prepare(), activateTab(), expectNoPageOverflow(), openDemo(), openExamImport(), prepareDemo() (+6 more)

### Community 16 - "Ts"
Cohesion: 0.05
Nodes (66): AA(), aE(), As(), av(), bv(), $c(), Cc(), Cg() (+58 more)

### Community 17 - "resolveExamPhase"
Cohesion: 0.24
Nodes (12): buildPhasePlanningPreview(), scope(), createPhaseStrategyController(), signature(), resolveExamPhase(), buildPhaseStrategyProposal(), excluded, mix() (+4 more)

### Community 18 - "exam-catalog.js"
Cohesion: 0.08
Nodes (40): buildCatalogMetadata(), canonical(), clone(), createExamImportService(), findMatch(), matchesCatalogItem(), needsMetadataUpdate(), normalizeName() (+32 more)

### Community 19 - "me"
Cohesion: 0.06
Nodes (46): bg(), bi(), Bs(), cv(), db(), dc(), Dg(), ff() (+38 more)

### Community 20 - "help-content.js"
Cohesion: 0.09
Nodes (39): analysisGuide, BASE_HELP_CATEGORIES, calendarEntry, dataGuide, examGuide, first, HELP_CATEGORIES, HELP_FAQ (+31 more)

### Community 21 - "isTopicInExamScope"
Cohesion: 0.12
Nodes (25): updateExamClassificationReview(), assertDemoScenario(), integer(), narrativeRoles, tags, validateDemoScenario(), buildExamMasteryMatrix(), EXAM_TAGS (+17 more)

### Community 22 - "parseLocalDate"
Cohesion: 0.09
Nodes (33): Auditoria de datas, Datas civis, Instantes absolutos, Regra para novas alterações, delegatedArgument(), goalsService, buildStudyTimeViewModel(), daySpan() (+25 more)

### Community 23 - "en"
Cohesion: 0.06
Nodes (35): $0(), a1(), aN(), aw(), Bl(), br(), ca(), dw() (+27 more)

### Community 24 - "decision-coherence/scenarios.js"
Cohesion: 0.22
Nodes (7): adaptivePlan, context, decisionCoherenceScenarios, examIntelligence, risk, trajectory, weeklyClose

### Community 25 - "intelligence-integration.test.js"
Cohesion: 0.19
Nodes (16): calculatePriorityScore(), calculateWeightedConfidence(), calculateWeightedScore(), clampMetric(), READINESS_WEIGHTS, calculateReviewHealth(), clamp(), REVIEW_HEALTH_ALGORITHM_VERSION (+8 more)

### Community 26 - "ve"
Cohesion: 0.06
Nodes (54): bk(), ck(), cn(), dy(), Ea(), Eh(), ep(), fk() (+46 more)

### Community 27 - "performance-subjects-renderer.js"
Cohesion: 0.20
Nodes (14): escape(), renderPerformanceSampleState(), options, renderPerformanceSubjectComparison(), signed(), value(), renderPerformanceSubjects(), signed() (+6 more)

### Community 28 - "build-studytrack32-view-model.js"
Cohesion: 0.06
Nodes (51): Contratos de migração, Definições para os primeiros três pacotes, Desempenho — inventário e regras de composição, Situação após os pacotes 4–9, buildStudyTrack32ViewModel(), inRange(), selectWeeklyPlans(), buildSubjectAccuracy() (+43 more)

### Community 29 - "recommendation-history.js"
Cohesion: 0.14
Nodes (24): asBoolean(), canReuseRecommendationPresentation(), completeRecommendationFeedback(), createRecommendationPresentation(), rateRecommendationFeedback(), recordRecommendationDecision(), summarizeRecommendationFeedback(), attachRecommendationSession() (+16 more)

### Community 30 - "renderHeatmap"
Cohesion: 0.07
Nodes (29): clearSessionHistoryFilters(), editStudySession(), getActivityDates(), getDailyStudySummary(), getGoalDates(), renderHeatmap(), renderSessionHistoryFilterControls(), renderStudySessionsHistory() (+21 more)

### Community 31 - "weekly-close-adherence.test.js"
Cohesion: 0.08
Nodes (34): buildCloseComparison(), captureCloseComparisonMetrics(), number(), buildPhaseComparison(), finite(), phaseOrder, rounded(), validPhase() (+26 more)

### Community 32 - "freezePlanExecution"
Cohesion: 0.33
Nodes (14): buildDailyPriority(), dailyItemEligible(), reconcileDailyExecution(), scopeKey(), buildStrategicExecution(), minutes(), dailyActivityType(), EXCLUDED_DAILY_STATUSES (+6 more)

### Community 33 - "adaptive-planning.js"
Cohesion: 0.25
Nodes (13): useAdaptivePlanAdvice(), ADAPTIVE_COOLDOWN_DAYS, ADAPTIVE_TRANSFER_MAX_MINUTES, ADAPTIVE_TRANSFER_MINUTES, applyAdaptivePlanningAdvice(), buildAdaptivePlanningAdvice(), byIdentity(), decisionTime() (+5 more)

### Community 34 - "consolidated-signal.js"
Cohesion: 0.15
Nodes (23): createConsolidatedSignal(), day(), distinct(), ordered(), ratio(), SIGNAL_CONTRACT_VERSION, SIGNAL_KINDS, signalEntityKey() (+15 more)

### Community 35 - "renderSubjects"
Cohesion: 0.06
Nodes (39): activeSubjects(), addAgendaRow(), addBreakdownRow(), addCalRow(), approvalEditalMetric(), archivedSubjects(), changeAgendaLimit(), changeSubjectTopicLimit() (+31 more)

### Community 36 - "oe"
Cohesion: 0.07
Nodes (38): aM(), aP(), cS(), dl(), Dr(), eM(), ew(), fo() (+30 more)

### Community 37 - "achievement-projection-history.test.js"
Cohesion: 0.14
Nodes (18): achievementProjectionHistory(), captureAchievementProjection(), scope(), validAchievementProjectionSnapshot(), validPercent(), buildProjectionCloseContext(), buildProjectionPageModel(), buildProjectionTopicRisks() (+10 more)

### Community 38 - "analytical-presentation.js"
Cohesion: 0.14
Nodes (21): Componentes, Fundação, Hierarquia editorial — pacotes 1–6, Pacote 6 — revisão dirigida, Pacotes 4–5 — registros e microcopy, Validação local dos pacotes 1–3, Validação local dos pacotes 4–6, Visão Geral (+13 more)

### Community 39 - "report-data.js"
Cohesion: 0.14
Nodes (20): buildRecommendationOutcomeAudit(), resultOf(), typeOf(), TYPES, buildPeriodComparison(), compare(), number(), PERIOD_COMPARISON_VERSION (+12 more)

### Community 40 - "buildWeeklyStrategicFocus"
Cohesion: 0.26
Nodes (12): buildStrategicAchievements(), buildWeeklyStrategicFocus(), seconds(), ALERT_TYPES, buildIntelligentAlerts(), createDiagnosticAlert(), presentation, EXAM_INTELLIGENCE_CONFIG (+4 more)

### Community 41 - "demo-mode.test.js"
Cohesion: 0.12
Nodes (15): createAppContext(), REQUIRED_STORAGE_METHODS, APP_MODES, enterDemoMode(), exitDemoMode(), readAppMode(), resetDemoMode(), bootstrapApplication() (+7 more)

### Community 42 - "achievement-projection-renderer.js"
Cohesion: 0.15
Nodes (18): buildProjectionEvidenceExplanation(), buildProjectionRequirements(), renderDecisionExplanation(), formatEvidencePercent(), confidenceLabels, labels, phaseLabels, recoveryLabels (+10 more)

### Community 43 - "buildRecommendationExplanation"
Cohesion: 0.23
Nodes (10): PHASES, renderAdaptiveAllocationAdvice(), renderExamPhase(), renderExamPhaseCompact(), renderConsolidatedDiagnosis(), renderDiagnosisCenter(), escape(), renderOpportunityCost() (+2 more)

### Community 44 - "qp"
Cohesion: 0.07
Nodes (32): ad(), aT(), bT(), cP(), Dn(), dt(), gP(), iT() (+24 more)

### Community 45 - "build-consolidated-signals.js"
Cohesion: 0.17
Nodes (19): buildTopicGapInputs(), buildConsolidatedDiagnosis(), archived(), buildConsolidatedSignals(), distinct(), identity(), scopeKey(), stable() (+11 more)

### Community 46 - "check-test-tiers.mjs"
Cohesion: 0.12
Nodes (20): impact, selection, visualFiles, cases, classified, collect(), discovery, evidence (+12 more)

### Community 47 - "H"
Cohesion: 0.08
Nodes (34): Af(), Ai(), ay(), bo(), $d(), ef(), Ei(), Et() (+26 more)

### Community 48 - "build-study-candidates.js"
Cohesion: 0.18
Nodes (18): buildStudyCandidates(), buildStudyPlan(), positive(), RECOMMENDATION_WEIGHTS, recommendStudy(), scoreStudyDecision(), PRIORITY_WEIGHTS, buildTopicSignals() (+10 more)

### Community 49 - "build-sustainability-model.js"
Cohesion: 0.21
Nodes (15): buildCapacityPattern(), quantile(), buildExecutionPattern(), buildSustainabilityInsights(), messages, buildSustainabilityModel(), completeWeek(), finite() (+7 more)

### Community 50 - "collection-repository.js"
Cohesion: 0.29
Nodes (8): createRecordService(), createSessionService(), createAppRepositories(), createCollectionRepository(), createPlanningRepository(), createSessionsRepository(), createSettingsRepository(), fixture()

### Community 51 - "README.md"
Cohesion: 0.12
Nodes (15): Microcopy das análises, Revisão do pacote 7, Textos mantidos após a revisão, Cobertura dirigida, Consolidação da Visão Geral e Central de Ajuda, Contratos preservados, Entregas, Fechamento local — 4 de outubro de 2026 (+7 more)

### Community 52 - "renderChartFrame"
Cohesion: 0.21
Nodes (18): escape(), renderChartEmptyState(), renderChartFrame(), renderChartLegend(), renderChartTooltip(), renderEmptyState(), renderSectionHeader(), fmt() (+10 more)

### Community 53 - "simulations-renderer.js"
Cohesion: 0.06
Nodes (36): buildErrorProfile(), changeListLimit(), changePerformanceLimit(), classifyAccuracy(), getSubjectErrorProfile(), getSubjectTopicPerformance(), performanceConfidence(), questionCategorizedErrors() (+28 more)

### Community 54 - "build-performance-consistency.js"
Cohesion: 0.16
Nodes (15): buildPlanExecution(), excluded, minutes(), plannedMinutesForPlan(), weekStart(), buildPerformanceConsistency(), inRange(), weekStart() (+7 more)

### Community 55 - "compareReadinessSnapshots"
Cohesion: 0.36
Nodes (10): availableKeys(), buildReadinessEvolution(), compareReadinessSnapshots(), finite(), labels, weightsFor(), buildReadinessChangeExplanation(), renderReadinessHistory() (+2 more)

### Community 56 - "buildTopicExamProfile"
Cohesion: 0.28
Nodes (11): buildExamConfigurationAudit(), order, sourceLabels, buildExamIntelligenceViewModel(), buildTopicExamProfile(), historicalImpactEstimate(), isHistoricalImpactUsable(), resolveValidatedExamImpact() (+3 more)

### Community 57 - "build-achievement-projection.js"
Cohesion: 0.20
Nodes (14): buildAchievementProjection(), percent(), buildProjectionConfidence(), buildProjectionExplanation(), buildProjectionRecovery(), ACHIEVEMENT_PROJECTION_VERSION, daysBetweenCalendarDates(), PROJECTION_STATUS (+6 more)

### Community 58 - "structured-content-import.js"
Cohesion: 0.18
Nodes (17): clean(), compareTopic(), createStructuredContentImportService(), DIFFICULTIES, fieldLabel, finite(), headerAliases, IMPORTABLE_FIELDS (+9 more)

### Community 59 - "README.md"
Cohesion: 0.06
Nodes (24): Contribuindo, Consolidação da experiência de decisão, Entregas, Pacote 7 — acessibilidade e responsividade, Pacote 8 — fechamento técnico, Contratos versionados, Decisões observadas, Validação da inteligência da prova e do planejamento V4 (+16 more)

### Community 60 - "performance-overview-renderer.js"
Cohesion: 0.21
Nodes (12): renderMetricCard(), formatStudyMinuteDelta(), formatStudyMinutes(), card(), change(), renderPerformanceOverview(), shown(), renderReadinessChangeExplanation() (+4 more)

### Community 61 - "Mo"
Cohesion: 0.12
Nodes (25): ar(), bd(), CM(), cy(), dh(), _e(), eu(), fs() (+17 more)

### Community 62 - "renderGuidedOnboarding"
Cohesion: 0.15
Nodes (19): applyGuidedEffortDefaults(), calculateStudyPlanPreview(), closeGuidedOnboarding(), createGuidedInitialPlan(), ensureExamCatalog(), moveOnboarding(), onboardingModel(), openGuidedOnboarding() (+11 more)

### Community 63 - "daily-execution.test.js"
Cohesion: 0.23
Nodes (7): buildDailyExecutionModel(), buildDailyProgress(), buildTodayViewModel(), createDailyExecutionController(), watchDailyExecutionDate(), renderDailyExecution(), render()

### Community 64 - "build-exam-matrix.js"
Cohesion: 0.23
Nodes (10): buildExamIntelligence(), classifyExamConfidence(), EXAM_CONFIDENCE_LABELS, comparableExamEvidence(), buildTopicImpact(), level(), calculateTopicIncidence(), percent() (+2 more)

### Community 65 - "scripts"
Cohesion: 0.06
Nodes (33): description, devDependencies, @axe-core/playwright, esbuild, @playwright/test, typescript, engines, node (+25 more)

### Community 66 - "StudyTrack — Extrato de Estudos"
Cohesion: 0.10
Nodes (20): Arquitetura, Atalhos, Como funciona o planejamento adaptativo, Como o planejamento decide o que estudar, Como o StudyTrack funciona, Da análise ao fechamento, Desenvolvimento e validação, Do estudo à recomendação (+12 more)

### Community 67 - "readiness-overview-renderer.js"
Cohesion: 0.31
Nodes (8): renderContextualHelp(), renderReadinessOverview(), escape(), renderScoreProjectionEvidence(), escape(), minutes(), reasons, renderSustainability()

### Community 68 - "Recomendações de melhorias --- StudyTrack"
Cohesion: 0.11
Nodes (18): 🔵 Arquitetura e qualidade, 🟡 Demo 2.0, 🟡 Design e UI, Direção estratégica, 🟡 Fechamento semanal, 🔵 Funcionalidades futuras de alto potencial, 🟠 Inteligência da Prova, 🟠 Metas e produtividade (+10 more)

### Community 69 - "renderStudyTrack32Insights"
Cohesion: 0.06
Nodes (55): activeTopics(), approvalAcertosMetric(), approvalConhecimentoMetric(), approvalDominioMetric(), approvalPrazoMetric(), approvalRetencaoMetric(), approvalSimuladosMetric(), approvalTendenciaMetric() (+47 more)

### Community 70 - "renderEvidenceQuality"
Cohesion: 0.26
Nodes (10): buildEvidenceQuality(), escape(), renderEvidenceQuality(), escapeHtml(), renderExamIntelligence(), escape(), renderPerformanceAnalysis(), score() (+2 more)

### Community 71 - "adapt-diagnostic-signals.js"
Cohesion: 0.22
Nodes (15): buildPriorityHistory(), number(), adaptDiagnosticSignals(), identity(), rows(), scope(), strength(), signalNumber() (+7 more)

### Community 72 - "buildRecommendationExplanation"
Cohesion: 0.34
Nodes (11): buildRecommendationExplanation(), number(), row(), buildStudyAction(), finiteOrNull(), freezeDeep(), recommendationActionKind(), recommendationActionLabel() (+3 more)

### Community 73 - "storage-services.test.js"
Cohesion: 0.16
Nodes (11): backupFileName(), parseBackupText(), serializeBackup(), createIndexedDbProvider(), createLocalStorageProvider(), runStateMigrations(), validateBackupEnvelope(), createStorageManager() (+3 more)

### Community 74 - "reviews.js"
Cohesion: 0.13
Nodes (17): addHistoryEvent(), applyAgendaField(), completedReviewsForTopic(), evidenceScopeForTopic(), markTopicCompleted(), migrateV14toV15(), refreshAllTopicReviewStats(), refreshTopicReviewStats() (+9 more)

### Community 75 - "error-analysis.test.js"
Cohesion: 0.15
Nodes (13): buildErrorAnalysisViewModel(), ICONS, LABELS, buildCognitiveProfile(), COGNITIVE_CONFIDENCE_LIMITS, cognitiveConfidence(), analyzeErrors(), ERROR_ACTIONS (+5 more)

### Community 76 - "buildCalibratedScoreProjection"
Cohesion: 0.20
Nodes (9): Cenários de regressão, Contexto estratégico e prazo, Estados, Fontes e limites, Histórico e apresentação, Projeção de atingimento — contrato V2, Prévia de recuperação, Regressão e CI (+1 more)

### Community 77 - "topic-strategy.js"
Cohesion: 0.23
Nodes (10): renderTopicStrategyEditor(), finite(), resolveTopicExamImpact(), TOPIC_IMPACT_SOURCES, wouldCreatePrerequisiteCycle(), createTopicStrategyController(), escapeHtml(), renderTopicStrategyEditor() (+2 more)

### Community 78 - "build-analytics-view-model.js"
Cohesion: 0.12
Nodes (24): Execução diária compartilhada, Explicações e consequências das decisões, Metas pessoais e sinais de preparação, Prévia integrada da estratégia por fase, buildApprovalSignals(), buildDiagnosisViewModel(), buildHeatmapViewModel(), evidenceRow() (+16 more)

### Community 79 - "exam-matrix-renderer.js"
Cohesion: 0.24
Nodes (12): cellText(), escape(), level(), options(), renderExamMatrix(), renderExamOpportunity(), tagLabel(), escape() (+4 more)

### Community 80 - "exam-intelligence-stress.test.js"
Cohesion: 0.13
Nodes (23): buildExamDataQuality(), buildExamMatrix(), byName(), options(), percentage(), examsInScope(), buildExamReportSummary(), escape() (+15 more)

### Community 81 - "Gráficos de desempenho e planejamento"
Cohesion: 0.13
Nodes (14): Aderência estratégica, Apresentação compartilhada e prontidão explicável, Estratégia por fase e reta final, Faixa de pontuação e checagem retrospectiva, Fechamento orientado a decisões, Gráficos de desempenho e planejamento, Histórico de prontidão e série futura de retenção, Incidência × Domínio (+6 more)

### Community 82 - "Sustentabilidade do planejamento"
Cohesion: 0.13
Nodes (13): Avaliações, planejamento e histórico, Cenário da demonstração 2.0, Conteúdo já migrado, Sustentabilidade do planejamento, Modelo longitudinal — pacote 2, Pacote 1 — Integridade histórica, Pacote 3 — Classificação e explicações, Pacote 4 — Fechamento e decisão (+5 more)

### Community 83 - "Spec: build-hygiene"
Cohesion: 0.11
Nodes (18): Comandos, Critérios de sucesso, Decisões (aprovadas em 2026-10-20), Estilo, Estrutura afetada, Fora de escopo, Limites, O que já foi resolvido em outros módulos (+10 more)

### Community 84 - "packages-3-5.test.js"
Cohesion: 0.20
Nodes (7): createGuidedStudyService(), GUIDED_STUDY_VERSION, createQuestionController(), buildQuestionMetrics(), n(), normalizeQuestion(), createEditalImportFacade()

### Community 85 - "analytics.test.js"
Cohesion: 0.21
Nodes (11): calculateActivityStreak(), calculateGoalConsistency(), calculateTopicCoverage(), summarizeStudyRecords(), accuracy(), aggregateTrendScores(), calculateWindowTrend(), clamp() (+3 more)

### Community 86 - "exam-import-feature.test.js"
Cohesion: 0.29
Nodes (10): selectExamTopics(), toggleExamSubject(), toggleExamTopic(), createExamImportController(), createExamImportState(), resetExamImportState(), syncExamImportSelection(), buildExamImportViewModel() (+2 more)

### Community 87 - "visual-consistency-renderers.test.js"
Cohesion: 0.24
Nodes (9): descriptions, EVIDENCE_STATES, presentEvidence(), renderCompactHeader(), renderHeroHeader(), renderTopicRetentionDashboard(), createSubjectSearchController(), matchesSubjectSearch() (+1 more)

### Community 88 - "performance-simulations-renderer.js"
Cohesion: 0.22
Nodes (13): delta(), percent(), renderPerformanceQuestions(), percent(), renderPerformanceSimulations(), signed(), renderPerformanceStory(), renderPerformanceSummary() (+5 more)

### Community 89 - "Consolidação da experiência — ciclo iniciado em c28b51d"
Cohesion: 0.14
Nodes (14): Achados e tratamento, Consolidação da experiência — ciclo iniciado em c28b51d, Correções encontradas na auditoria, Pacote 1 — infraestrutura remota, Pacote 2 — propriedade operacional, Pacote 3 — narrativa de Desempenho, Pacote 4 — apresentação analítica, Pacote 5 — responsabilidades de Metas, fechamento e Visão Geral (+6 more)

### Community 90 - "Auditoria de jornadas e simplificação"
Cohesion: 0.14
Nodes (14): Achado que orienta o pacote 4, Auditoria de jornadas e simplificação, Consolidação da experiência — cinco perfis, Encerramento local da fase, Execução reproduzível, Interpretação das medidas, Pacote 8 — coerência do produto, Pacotes 5 a 7 — apresentação, listas e microcopy (+6 more)

### Community 91 - "Validação do ciclo estratégico"
Cohesion: 0.14
Nodes (13): Jornada integrada após Desempenho e Diagnóstico 2.0, Pacote 10 — Sinais de preparação e custo de oportunidade, Pacote 1 — Estratégia por fase, Pacote 2 — Ciclo completo, Pacote 3 — Linha do Tempo Estratégica, Pacote 4 — Fechamentos e comparação, Pacote 5 — Evolução das prioridades, Pacote 8 (+5 more)

### Community 92 - "planning-sustainability.spec.js"
Cohesion: 0.18
Nodes (9): Consolidação da experiência — captura de sustentabilidade, Encerramento da consolidação — aderência, Plataforma oficial de comparação de pixels, Responsividade representativa, Revisão dirigida — sustentabilidade em 430 px, Screenshots de diagnóstico, Superfícies e plataformas de regressão visual, prepare() (+1 more)

### Community 93 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, allowJs, checkJs, lib, maxNodeModuleJsDepth, module, moduleResolution, noImplicitAny (+5 more)

### Community 94 - "run-test-gate.mjs"
Cohesion: 0.14
Nodes (12): allUnitFiles, dirty, dryRun, impact, phases, playwright, results, revision (+4 more)

### Community 95 - "study-session.js"
Cohesion: 0.18
Nodes (15): migrateV16toV17(), migrateV19toV20(), finiteOrNull(), isLocalDate(), nonNegative(), nonNegativeInteger(), normalizeStudySession(), normalizeStudySessions() (+7 more)

### Community 96 - "demo-intelligence-scenarios.test.js"
Cohesion: 0.24
Nodes (12): CONFIDENCE_THRESHOLDS, confidenceLabel(), createMetricEvidence(), calculateTopicMastery(), calculateTopicRetention(), clamp(), classifyTopicMastery(), MASTERY_ALGORITHM_VERSION (+4 more)

### Community 97 - "product-consolidation.test.js"
Cohesion: 0.18
Nodes (9): createPerformanceViewState(), PERFORMANCE_PERIODS, PERFORMANCE_SECTIONS, updatePerformanceViewState(), createPerformanceController(), factors, recommendation, row (+1 more)

### Community 98 - "progressive-list.js"
Cohesion: 0.23
Nodes (6): createCalendarController(), createCalendarState(), createProgressiveList(), DEFAULT_LIST_VISIBLE_ITEMS, LISTS, mountProgressiveLists()

### Community 99 - "adherence-renderer.js"
Cohesion: 0.23
Nodes (15): diagnosticSignalLabel(), renderDisclosure(), renderPerformanceConsistency(), renderPerformanceDetails(), delta(), renderAdherenceChangeExplanation(), percent(), renderAdherenceAnalysis() (+7 more)

### Community 100 - "Estratégia de validação por risco"
Cohesion: 0.15
Nodes (13): Cobertura cara e limitações atuais, Comandos e roteamento do CI, Contrato dos gates, Estado da implementação, Estratégia de validação por risco, Funcionamento e falhas, Manifesto e verificação, Política e execução contextual (+5 more)

### Community 101 - "build.mjs"
Cohesion: 0.15
Nodes (11): buildVersion, bundles, checkOnly, filesUnder(), generatedIndex, generatedServiceWorker, indexPath, normalizedIndex (+3 more)

### Community 102 - "adherence-target.test.js"
Cohesion: 0.33
Nodes (8): buildAdherenceTarget(), normalizeAdherenceTarget(), validAdherenceTarget(), clamp(), createGoalService(), renderAdherenceTargetSetting(), renderGoals(), fixture()

### Community 103 - "CAPABILITY-MAP-review-remediation.md"
Cohesion: 0.31
Nodes (3): Capability Map: correções da revisão (sync WebDAV, importação de questões, tipagem), Tarefas: question-import, Tarefas: build-hygiene

### Community 104 - "build-weekly-decision-cycle.js"
Cohesion: 0.39
Nodes (8): buildWeeklyDecisionGuidance(), buildWeeklyDecisionSummary(), escape(), renderAdherenceCloseHistory(), renderWeeklyAdherence(), shown(), escape(), renderWeeklyDecisionCycle()

### Community 105 - "outcome-service.js"
Cohesion: 0.33
Nodes (9): captureRecommendationBaseline(), captureRecommendationSnapshot(), measureRecommendationOutcome(), recommendationOutcomeConfidence(), evaluateRecommendationOutcome(), METRICS, normalizeRecommendationMetrics(), numeric() (+1 more)

### Community 106 - "strategic-cycle.js"
Cohesion: 0.29
Nodes (6): assertHistoryPreserved(), capacity(), getState(), prepare(), buildStrategicCycleFixture(), STRATEGIC_CYCLE_TODAY

### Community 107 - "Inteligência consolidada"
Cohesion: 0.17
Nodes (11): Cobertura, Consolidação de produto — pacotes 3–5, Consolidação de produto — pacotes 6–7, Estado dos pacotes 4–8, Inteligência consolidada, Pacote 1 — Estabilização, Pacote 2 — Contrato dos sinais e vocabulário, Pacote 3 — Consolidação e precedência (+3 more)

### Community 108 - "Recovery e execução diária"
Cohesion: 0.15
Nodes (12): Análise semanal — pacote 4, Card Hoje e sessões, Consolidação da aderência — pacotes 1 e 2, Demo e regressão — pacote 7, Desempenho — pacote 5, Fechamento e pendências recorrentes — pacote 6, Meta pessoal opcional — pacote 8, Modelo compartilhado da execução diária (+4 more)

### Community 109 - "select-affected-tests.mjs"
Cohesion: 0.18
Nodes (9): args, cache, changedFiles, dependencies(), derivedFiles, graph, plan, root (+1 more)

### Community 110 - "ensureStateDefaults"
Cohesion: 0.31
Nodes (9): ensureBackupStateDefaults(), ensureStateDefaults(), migrateV8toV9(), PRIORITY_ALGORITHM_VERSION, EXAM_INTELLIGENCE_VERSION, ADAPTIVE_PLANNING_VERSION, normalizeAlgorithmVersions(), normalizeExamBlueprint() (+1 more)

### Community 111 - "app-state.js"
Cohesion: 0.29
Nodes (3): waitForAppReady(), waitForImportReady(), assertCriticalResponsive()

### Community 112 - "Arquitetura"
Cohesion: 0.18
Nodes (11): Arquitetura, Auditoria final da modularização, Build e verificações, Ciclo de estabilização, Contrato de ação de estudo, Estrutura, Fluxo de dependências, Persistência (+3 more)

### Community 113 - "Spec: remote-sync"
Cohesion: 0.20
Nodes (10): Comandos, Critérios de sucesso, Decisões (aprovadas em 2026-10-20), Estilo, Estrutura, Fora de escopo, Limites, Objetivo (+2 more)

### Community 114 - "Design System do StudyTrack"
Cohesion: 0.18
Nodes (10): Componentes, Contrato compartilhado dos gráficos, Design System do StudyTrack, Espaçamento, Explicações de recomendações, Histórico explicável de prontidão, Inventário de componentes, Listas progressivas (+2 more)

### Community 115 - "Contrato da experiência de decisão"
Cohesion: 0.18
Nodes (11): Contrato da experiência de decisão, Contratos comuns, Fluxo apresentado ao estudante, Pacote 2 — apresentação compartilhada, Pacote 3 — leitura de Desempenho e Projeção, Pacote 4 — plano, sugestão e execução, Pacote 5 — síntese do fechamento, Pacote 6 — coerência integrada (+3 more)

### Community 116 - "Inventário de propriedade das informações"
Cohesion: 0.18
Nodes (11): Achados para a próxima revisão, Backlog verificável, Contrato operacional — consolidação da experiência, Critério para reduzir uma ocorrência, Escopo da auditoria, Inventário de propriedade das informações, Inventário observado, Limites e próximo uso (+3 more)

### Community 117 - "run-experience-gate.mjs"
Cohesion: 0.18
Nodes (8): browser, phases, playwright, results, revision, root, started, summary

### Community 118 - "affected-test-plan.js"
Cohesion: 0.31
Nodes (8): buildAffectedTestPlan(), experienceSources, matchPath(), globalImpactSources, impactAreas, impactMapVersion, plan(), tierManifest

### Community 119 - "readiness-history.js"
Cohesion: 0.12
Nodes (21): Demo da trajetória e fechamento orientado à decisão, Escopo analítico por concurso, Experiência de decisão, Fluxo do Edital Inteligente, Prioridade registrada no plano, Prontidão dos testes E2E, Transição de escopo, applyPresetBlueprintDefaults() (+13 more)

### Community 120 - "freezePlanExecution"
Cohesion: 0.49
Nodes (6): applyReplan(), buildReplanProposal(), recoveryReason(), undoReplan(), capturePlanExecution(), freezePlanExecution()

### Community 121 - "crypto-utils.js"
Cohesion: 0.30
Nodes (10): base64ToBytes(), bytesToBase64(), decryptPayload(), deriveKey(), encryptPayload(), PBKDF2_ITERATIONS, basicAuthHeader(), createRemoteSyncProvider() (+2 more)

### Community 122 - "projection-scenarios.test.js"
Cohesion: 0.19
Nodes (8): dates, evidenceAuditScenarios, evidenceSimulations(), base, dates, projectionScenarios, studySessions, trajectory

### Community 123 - "Pacotes de implementação"
Cohesion: 0.20
Nodes (9): Evoluções posteriores, P1 — Entrada guiada completa — concluído, P2 — Importador totalmente modular — concluído, P3 — Recuperação explicável — concluído, P4 — Gate de qualidade e publicação — concluído, P5 — Ações especializadas das recomendações — concluído, P6 — Fechamento semanal aplicável — concluído, Pacotes de implementação (+1 more)

### Community 124 - "Hierarquia visual do StudyTrack"
Cohesion: 0.12
Nodes (14): Contrato de leitura, Decisões e limites, Inventário de densidade — consolidação de produto, Inventário por área, Aplicação por pacote, Auditoria de dados densos, Central de Ajuda visual — ciclo concluído, Contratos e estados (+6 more)

### Community 125 - "ref_node_path"
Cohesion: 0.18
Nodes (7): esbuild, collect(), files, ignored, roots, root, types

### Community 126 - "audit-test-suite.mjs"
Cohesion: 0.22
Nodes (8): areas, evidence, files, inventory, output, read(), root, rows

### Community 127 - "build-onboarding-view-model.js"
Cohesion: 0.47
Nodes (3): dismissAlert(), reconcileAlerts(), severityOrder

### Community 128 - "recommendation-calibration.js"
Cohesion: 0.33
Nodes (7): buildRecommendationCalibration(), confidence(), dateOf(), label(), priorityBand(), RECOMMENDATION_CALIBRATION_VERSION, summarize()

### Community 129 - "remote-sync-controller.test.js"
Cohesion: 0.24
Nodes (12): createRemoteSyncController(), readRemoteSyncPreferences(), REMOTE_SYNC_CONFIG_KEY, sameServer(), validLastSync(), writeRemoteSyncPreferences(), fakeDocument(), fakeElement() (+4 more)

### Community 130 - "Contrato de hierarquia da informação"
Cohesion: 0.22
Nodes (9): Aceite das próximas correções, Aplicação nas superfícies existentes, Contrato de hierarquia da informação, Contrato de interação e acessibilidade, Escopo e autoridade, Evidência que muda a interpretação, Quatro níveis de leitura, Regras de densidade (+1 more)

### Community 131 - "check-test-selection.mjs"
Cohesion: 0.18
Nodes (6): all, discover(), visit(), impact, root, selected

### Community 132 - "renderRecommendationFollowup"
Cohesion: 1.00
Nodes (3): escape(), renderRecommendationFollowup(), value()

### Community 133 - "distribute-study-plan.js"
Cohesion: 0.42
Nodes (7): ACTIVE_STATUSES, applyDailyPlanProposal(), buildDailyPlanProposal(), clampMinutes(), existingSourceKeys(), undoDailyPlanGeneration(), studyPlan

### Community 134 - "buildPerformanceForecast"
Cohesion: 0.50
Nodes (6): buildPerformanceForecast(), clamp(), confidenceLabel(), dayNumber(), normalizeObservations(), PERFORMANCE_FORECAST_VERSION

### Community 136 - "study-history.js"
Cohesion: 0.42
Nodes (8): allocateErrors(), buildDemoStudyHistory(), clamp(), dateAt(), genericErrors, narrativeAccuracy(), narrativeQuestionSlots(), phaseSlots()

### Community 137 - "Requisitos"
Cohesion: 0.25
Nodes (8): R1 — Confirmação antes de sobrescrever a nuvem (#3), R2 — Enviar só o estado persistente (#4), R3 — PBKDF2 com 600 mil iterações e teto na leitura (#10), R4 — Basic auth só em HTTPS (#11), R5 — Senhas com qualquer caractere (#11), R6 — Mensagem clara para CORS/rede (#13), R7 — CSP permite conectar ao servidor WebDAV (achado na verificação, aprovado em 2026-10-20), Requisitos

### Community 138 - "build-recommendation-outcome-view-model.js"
Cohesion: 0.38
Nodes (5): buildRecommendationOutcomeViewModel(), LABELS, numeric(), STATE_LABELS, STATE_MAP

### Community 139 - "exam-import-renderer.js"
Cohesion: 0.57
Nodes (4): renderExamImport(), renderPresetStep(), renderPreviewStep(), renderSelectionStep()

### Community 141 - "buildCalibratedScoreProjection"
Cohesion: 0.43
Nodes (5): buildCalibratedScoreProjection(), clamp(), composition(), median(), PROJECTION_EVIDENCE_POLICY

### Community 142 - "StudyTrack — estratégia de testes"
Cohesion: 0.33
Nodes (6): Antes de concluir uma tarefa normal, Durante a implementação, Escolha de cobertura nova, Orçamentos, Quando executar Full, StudyTrack — estratégia de testes

### Community 143 - "Plano do dia, sugestões e metas iniciais"
Cohesion: 0.33
Nodes (5): Escolha operacional, Evidência local, Metas de partida, Plano do dia, sugestões e metas iniciais, Validação

### Community 144 - "Refinamento visual: referência inicial"
Cohesion: 0.33
Nodes (5): Contratos para os pacotes 1–3, Escopo protegido, Fechamento do pacote 7, Referências existentes, Refinamento visual: referência inicial

### Community 145 - "Consolidação do ciclo estratégico"
Cohesion: 0.33
Nodes (5): Consolidação do ciclo estratégico, Fronteiras do código, Gate de publicação, Jornada atual, Leitura dos indicadores

### Community 146 - "review-service.test.js"
Cohesion: 0.46
Nodes (5): createReviewService(), REVIEW_TYPES, reviewTypeForDays(), createReviewsRepository(), fixture()

### Community 149 - "topic-history-service.test.js"
Cohesion: 0.60
Nodes (4): createTopicHistoryService(), historyEventLocalDate(), IGNORED_ACTIVITY_TYPES, fixture()

### Community 150 - "Plano: question-import"
Cohesion: 0.33
Nodes (6): Checkpoints de verificação, Componentes e dependências, Decisões de implementação, Ordem (sequencial — as tarefas compartilham arquivos), Plano: question-import, Riscos

### Community 153 - "navigation-controller.js"
Cohesion: 0.67
Nodes (4): createNavigationController(), MAIN_TABS, nextNavigationIndex(), shortcutTabIndex()

### Community 154 - "studytrack32-renderer.js"
Cohesion: 0.15
Nodes (19): escape(), labels, renderExamDataQuality(), focusMinutes(), focusPercent(), renderDecisionHistory(), renderFocusTrend(), renderGapMap() (+11 more)

### Community 155 - "Demo e validação da trajetória"
Cohesion: 0.40
Nodes (4): Demo e validação da trajetória, Evidência local (2026-10-04, Windows/Chromium), Jornada integrada, Perfis determinísticos

### Community 156 - "Navegação de conteúdo e leitura dos indicadores"
Cohesion: 0.40
Nodes (4): Disciplinas, Navegação de conteúdo e leitura dos indicadores, Tempo e revisões, Validação

### Community 157 - "Evidência de retenção e composição da execução"
Cohesion: 0.40
Nodes (4): Evidência de retenção e composição da execução, Execução, Retenção, Validação

### Community 158 - "Plano: build-hygiene"
Cohesion: 0.40
Nodes (5): Checkpoints de verificação, Decisões de implementação, Ordem, Plano: build-hygiene, Riscos

### Community 159 - "Jornada do StudyTrack"
Cohesion: 0.40
Nodes (4): Cenários de referência, Jornada do StudyTrack, Medidas mínimas, Percurso principal

### Community 160 - "Fundação visual — pacote 1"
Cohesion: 0.33
Nodes (5): Contrato de superfícies, Espaçamento e componentes, Fundação visual — pacote 1, Inventário de migração, Verificação local

### Community 161 - "Auditoria de segurança — StudyTrack"
Cohesion: 0.40
Nodes (4): Auditoria de segurança — StudyTrack, Cache PWA, Estado atual, Pendência de CSP

### Community 163 - "build-performance-analysis.js"
Cohesion: 0.70
Nodes (4): accuracy(), buildPerformanceAnalysis(), count(), performancePeriodRecords()

### Community 164 - "calculateSubjectRadar"
Cohesion: 0.80
Nodes (3): calculateSubjectRadar(), clamp(), interpretRadar()

### Community 165 - "performance-scenarios.js"
Cohesion: 0.60
Nodes (3): buildPerformanceScenarios(), clamp(), PERFORMANCE_SCENARIOS_VERSION

### Community 168 - "Fechamento da auditoria de confiança e acessibilidade"
Cohesion: 0.50
Nodes (3): Fechamento da auditoria de confiança e acessibilidade, Pacote 7 — configuração e teclado, Validação

### Community 173 - "Segurança"
Cohesion: 0.50
Nodes (3): Dados locais, Relatar vulnerabilidades, Segurança

### Community 181 - "renderPhaseStrategy"
Cohesion: 0.83
Nodes (3): activities(), escape(), renderPhaseStrategy()

### Community 183 - "Testes"
Cohesion: 0.50
Nodes (3): Matriz de estabilidade da inteligência da prova, Testes, Testes E2E

## Knowledge Gaps
- **1 isolated node(s):** `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 964 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Escopo analítico por concurso` connect `readiness-history.js` to `README.md`, `isTopicInExamScope`, `build-analytics-view-model.js`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `addLocalDays()` (e.g. with `Regra para novas alterações` and `weekly-close-controller.test.js`) actually correct?**
  _`addLocalDays()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `typescript` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.011756569847856155 - nodes in this community are weakly interconnected._
- **Why does `resolveExamScope()` connect `isTopicInExamScope` to `readiness-history.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `parseLocalDate()` (e.g. with `Datas civis` and `Regra para novas alterações`) actually correct?**
  _`parseLocalDate()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.bundle.js` be split into smaller, more focused modules?**
  _Cohesion score 0.01866985582353332 - nodes in this community are weakly interconnected._