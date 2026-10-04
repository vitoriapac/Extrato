# Inventário da suíte de testes

Gerado por `node scripts/audit-test-suite.mjs`. Base medida: `4b4fe2334fc1be960ae8b416975bc8f1f5bb9555`.

159 arquivos Node e 55 arquivos E2E. Integrações existentes estão em tests/unit; não há uma suíte de integração separada.

## Tempos observados

| Grupo | Casos | Tempo |
|---|---:|---:|
| Unit UTC | 644 | 11.4806372 s |
| Unit America/Sao_Paulo | 644 | 16.6828374 s |
| E2E full UTC | 234 | 1836 s |
| E2E timezone America/Sao_Paulo | 47 | 324 s |

Medições locais em Windows, não tempos do GitHub Actions. Duração por arquivo E2E é a soma dos tempos reportados dos casos; não somar para obter duração total, pois há dois workers. Unitários têm somente tempo agregado, não medição por arquivo. Valores arredondados do reporter não são benchmarks precisos. Fixtures e helpers não contam como testes executáveis.

## Arquivos

Área e criticidade são indicações iniciais pelo nome; o contrato e os imports devem ser revistos antes de eliminar cobertura. Declarações estáticas não equivalem ao número de casos executados. Estabilidade/flakiness não foi inferida de uma única execução.

| Arquivo | Runner | Área sugerida | Criticidade | Segundos observados | Papéis | Screenshot |
|---|---|---|---|---:|---|---|
| tests/e2e/accessibility.spec.js | browser | Aplicação | functional | 193.4 | journey, demo, viewport | none |
| tests/e2e/achievement-projection.spec.js | browser | Trajetória | visual | 157.7 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/achievement-strategy.spec.js | browser | Aplicação | functional | 4 | journey, viewport | none |
| tests/e2e/action-first-mobile.spec.js | browser | Aplicação | functional | 52.2 | journey, demo, viewport | none |
| tests/e2e/adherence-target.spec.js | browser | Aderência | critical | 2.5 | journey, viewport | none |
| tests/e2e/adherence.spec.js | browser | Aderência | critical | 128.4 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/backup-schema24-cycle.spec.js | browser | Backup | critical | 5.1 | journey | none |
| tests/e2e/consolidated-signals.spec.js | browser | Datas | critical | 2.6 | journey | none |
| tests/e2e/csp.spec.js | browser | Aplicação | functional | 2.3 | journey | none |
| tests/e2e/daily-execution.spec.js | browser | Aplicação | critical | 106.6 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/demo.spec.js | browser | Demo | functional | 150 | journey, demo, viewport | none |
| tests/e2e/error-analysis.spec.js | browser | Aplicação | functional | 11.6 | journey, demo | none |
| tests/e2e/evidence-calibration.spec.js | browser | Aplicação | functional | 7.8 | journey, viewport | none |
| tests/e2e/exam-import.spec.js | browser | Inteligência da prova | critical | 45.2 | journey | none |
| tests/e2e/exam-intelligence-hierarchy.spec.js | browser | Inteligência da prova | functional | 7.9 | journey, viewport | none |
| tests/e2e/exam-intelligence-readonly.spec.js | browser | Inteligência da prova | functional | 3.3 | journey | none |
| tests/e2e/exam-json-import.spec.js | browser | Inteligência da prova | critical | 5.1 | journey, viewport | none |
| tests/e2e/exam-matrix.spec.js | browser | Inteligência da prova | functional | 3.8 | journey, viewport | none |
| tests/e2e/exam-scope.spec.js | browser | Inteligência da prova | critical | 2.1 | journey | none |
| tests/e2e/final-visual-polish.spec.js | browser | Visual | visual | 330.2 | journey, demo, viewport | none |
| tests/e2e/goals-groups.spec.js | browser | Metas | functional | 4.6 | journey, viewport | none |
| tests/e2e/historical-capacity.spec.js | browser | Capacidade | critical | 1.6 | journey | none |
| tests/e2e/legacy-backup.spec.js | browser | Backup | critical | 2.9 | journey | none |
| tests/e2e/onboarding.spec.js | browser | Onboarding | functional | 60.1 | journey, viewport | none |
| tests/e2e/planning-sustainability.spec.js | browser | Sustentabilidade | critical | 168.8 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/planning.spec.js | browser | Planejamento | critical | 63.5 | journey, demo, viewport | none |
| tests/e2e/preparation-signals.spec.js | browser | Aplicação | functional | 3.7 | journey, viewport | none |
| tests/e2e/product-consolidation.spec.js | browser | Aplicação | functional | 23.9 | journey, demo, viewport | none |
| tests/e2e/progressive-list.spec.js | browser | Aplicação | functional | 5.6 | journey, viewport | none |
| tests/e2e/pwa.spec.js | browser | Aplicação | functional | 9.5 | journey | none |
| tests/e2e/recent-flows.spec.js | browser | Aplicação | functional | 144.4 | journey, demo, viewport | none |
| tests/e2e/recommendation-outcome.spec.js | browser | Recomendações | functional | 19.5 | journey, demo | none |
| tests/e2e/recovery-preview-ux.spec.js | browser | Recuperação | critical | 74.4 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/refinement-visual.spec.js | browser | Visual | visual | 122.4 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/release-gate.spec.js | browser | Aplicação | functional | 97.8 | journey, demo, viewport | none |
| tests/e2e/reports.spec.js | browser | Aplicação | functional | 79.3 | journey, demo | none |
| tests/e2e/responsive-smoke.spec.js | browser | Responsividade | visual | — | journey | none |
| tests/e2e/responsive.spec.js | browser | Responsividade | visual | 806.5 | journey, demo, viewport | none |
| tests/e2e/sessions.spec.js | browser | Sessões | functional | 14.9 | journey | none |
| tests/e2e/smoke.spec.js | browser | Aplicação | functional | 4.6 | journey | none |
| tests/e2e/stability-phase-comparison.spec.js | browser | Aplicação | functional | 21.1 | journey, demo, viewport | none |
| tests/e2e/strategic-cycle.spec.js | browser | Aplicação | functional | 42.7 | journey, viewport | none |
| tests/e2e/strategic-focus-history.spec.js | browser | Aplicação | critical | 3.3 | journey, viewport | none |
| tests/e2e/strategic-history.spec.js | browser | Aplicação | critical | 8 | journey, viewport | none |
| tests/e2e/structured-content-import.spec.js | browser | Aplicação | critical | 11.8 | journey | none |
| tests/e2e/study-action-cycle.spec.js | browser | Aplicação | functional | 13.2 | journey | none |
| tests/e2e/subject-accuracy-target.spec.js | browser | Aplicação | functional | 6.4 | journey, viewport | none |
| tests/e2e/topic-strategy.spec.js | browser | Aplicação | functional | 18.1 | journey, demo | none |
| tests/e2e/ux-baseline.spec.js | browser | Aplicação | visual | 70.6 | journey, visual-comparison, demo, viewport | windows-only |
| tests/e2e/visual-consolidation.spec.js | browser | Visual | visual | 125.4 | journey, demo, viewport | none |
| tests/e2e/visual-density.spec.js | browser | Visual | visual | 183.6 | journey, viewport | none |
| tests/e2e/visual-language.spec.js | browser | Visual | visual | 24.2 | journey, viewport | none |
| tests/e2e/visual-regression.spec.js | browser | Visual | visual | 66.9 | journey, visual-comparison, demo, viewport | inspect-platform-baselines |
| tests/e2e/weekly-adherence.spec.js | browser | Aderência | critical | 21.9 | journey, demo, viewport | none |
| tests/e2e/weekly-focus-visual.spec.js | browser | Visual | visual | 8.3 | journey, viewport | none |
| tests/unit/achievement-projection-history.test.js | node | Trajetória | critical | — | contract | none |
| tests/unit/achievement-projection.test.js | node | Trajetória | functional | — | contract | none |
| tests/unit/achievement-renderer.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/achievement-view-model.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/adaptive-planning-renderer.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/adaptive-planning.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/adherence-change-explanation.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/adherence-model.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/adherence-presentation.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/adherence-target.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/alert-lifecycle.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/analytics-view-model.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/analytics.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/app-foundation.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/application-lifecycle.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/application-renderer.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/backup-controller.test.js | node | Backup | critical | — | contract | none |
| tests/unit/calendar-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/capacity-review-preview.test.js | node | Capacidade | critical | — | contract | none |
| tests/unit/clock-timezone.test.js | node | Datas | critical | — | contract | none |
| tests/unit/close-comparison.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/cognitive-profile.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/consolidated-signal-contract.test.js | node | Datas | critical | — | contract | none |
| tests/unit/consolidated-signals.test.js | node | Datas | critical | — | contract | none |
| tests/unit/daily-execution.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/daily-plan-distribution.test.js | node | Planejamento | functional | — | contract | none |
| tests/unit/daily-session-reconciliation.test.js | node | Sessões | critical | — | contract | none |
| tests/unit/date-utils.test.js | node | Datas | critical | — | contract | none |
| tests/unit/decision-coherence-debug-renderer.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/decision-coherence-report.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/decision-coherence-scenarios.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/delegated-events-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/demo-adherence.test.js | node | Aderência | critical | — | contract, demo | none |
| tests/unit/demo-controller.test.js | node | Demo | functional | — | contract | none |
| tests/unit/demo-intelligence-scenarios.test.js | node | Demo | functional | — | contract, demo | none |
| tests/unit/demo-mode.test.js | node | Demo | functional | — | contract, demo | none |
| tests/unit/demo-scenario-v2.test.js | node | Demo | functional | — | contract, demo | none |
| tests/unit/demo-sustainability.test.js | node | Sustentabilidade | functional | — | contract, demo | none |
| tests/unit/diagnosis-center.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/editable-collection-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/error-analysis.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/error-boundary-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/evidence-quality.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/evidence-scope-migration.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/exam-evidence-scope.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/exam-import-feature.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/exam-import-renderer.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/exam-import-service.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/exam-intelligence-model.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/exam-intelligence-stress.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/exam-intelligence-system.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/exam-mastery-matrix.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/exam-matrix.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/exam-planning-integration.test.js | node | Inteligência da prova | critical | — | contract, integration | none |
| tests/unit/exam-report-weekly-focus.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/exam-scope-transition.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/exam-scope.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/execution-contract.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/executive-summary.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/filter-panel.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/goal-service.test.js | node | Metas | functional | — | contract | none |
| tests/unit/goals-renderer.test.js | node | Metas | functional | — | contract | none |
| tests/unit/guided-study-service.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/header-view-model.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/heatmap.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/historical-adherence-integrity.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/import-exam-json.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/intelligence-integration.test.js | node | Aplicação | functional | — | contract, integration | none |
| tests/unit/intelligent-alerts.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/list-components.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/multidimensional-radar.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/navigation-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/onboarding-renderer.test.js | node | Onboarding | functional | — | contract | none |
| tests/unit/onboarding-view-model.test.js | node | Onboarding | functional | — | contract | none |
| tests/unit/overview-view-model.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/packages-3-5.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/performance-forecast.test.js | node | Desempenho | functional | — | contract | none |
| tests/unit/performance-scenarios.test.js | node | Desempenho | functional | — | contract | none |
| tests/unit/period-comparison-insights.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/phase-strategy.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/plan-execution-snapshot.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/planning-repository.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/planning-services.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/planning-sustainability.test.js | node | Sustentabilidade | critical | — | contract | none |
| tests/unit/post-simulation-replan.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/preparation-signals.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/priority-history.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/priority-view-model.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/product-consolidation.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/progressive-list.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/projection-calibration-history.test.js | node | Trajetória | critical | — | contract | none |
| tests/unit/projection-context.test.js | node | Trajetória | functional | — | contract | none |
| tests/unit/projection-scenarios.test.js | node | Trajetória | functional | — | contract | none |
| tests/unit/projection-ux-simulator.test.js | node | Trajetória | functional | — | contract | none |
| tests/unit/recommend-study.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-action.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-calibration.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-controller.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-feedback.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-followup.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-outcome-view-model.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/recommendation-outcome.test.js | node | Recomendações | functional | — | contract | none |
| tests/unit/record-service.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/recovery-dense-scenarios.test.js | node | Recuperação | critical | — | contract, demo | none |
| tests/unit/recovery-plan.test.js | node | Recuperação | critical | — | contract, demo | none |
| tests/unit/recovery-renderer.test.js | node | Recuperação | critical | — | contract | none |
| tests/unit/recovery-transaction.test.js | node | Recuperação | critical | — | contract | none |
| tests/unit/release-intelligence.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/replan-controller.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/replan-renderer.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/replan-study.test.js | node | Planejamento | critical | — | contract | none |
| tests/unit/report-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/result-goals-and-period-comparison.test.js | node | Metas | functional | — | contract | none |
| tests/unit/review-health.test.js | node | Revisões | functional | — | contract | none |
| tests/unit/review-service.test.js | node | Revisões | functional | — | contract | none |
| tests/unit/review-view-model.test.js | node | Revisões | functional | — | contract | none |
| tests/unit/reviews.test.js | node | Revisões | functional | — | contract | none |
| tests/unit/risk-score.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/session-history.test.js | node | Sessões | critical | — | contract | none |
| tests/unit/session-service.test.js | node | Sessões | functional | — | contract | none |
| tests/unit/stability-phase-comparison.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/state-boundaries.test.js | node | Estado | critical | — | contract | none |
| tests/unit/storage-services.test.js | node | Persistência | critical | — | contract | none |
| tests/unit/strategic-achievements.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/strategic-cycle-fixture.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/strategic-focus-history.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/strategic-report.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/strategic-state.test.js | node | Estado | critical | — | contract | none |
| tests/unit/strategic-timeline.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/strategy-config.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/structured-content-import.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/study-day-count.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/study-plan.test.js | node | Planejamento | functional | — | contract | none |
| tests/unit/study-session.test.js | node | Sessões | functional | — | contract | none |
| tests/unit/study-strategy.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/studytrack-3-2-analytics.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/studytrack32-view-model.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/subject-accuracy-target.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/subject-service.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/sustainability-insights.test.js | node | Sustentabilidade | functional | — | contract | none |
| tests/unit/today-view-model.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/topic-exam-profile.test.js | node | Inteligência da prova | functional | — | contract | none |
| tests/unit/topic-history-service.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/topic-incidence.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/topic-mastery-calibration.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/topic-signals.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/topic-strategy-controller.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/topic-strategy-renderer.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/topic-strategy.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/ui-presentation.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/utils.test.js | node | Aplicação | functional | — | contract | none |
| tests/unit/validated-exam-impact.test.js | node | Inteligência da prova | critical | — | contract | none |
| tests/unit/visual-consistency-renderers.test.js | node | Visual | visual | — | contract | none |
| tests/unit/weekly-adherence.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/weekly-availability.test.js | node | Aplicação | critical | — | contract | none |
| tests/unit/weekly-close-actions.test.js | node | Fechamento | functional | — | contract | none |
| tests/unit/weekly-close-adherence.test.js | node | Aderência | critical | — | contract | none |
| tests/unit/weekly-close-controller.test.js | node | Fechamento | functional | — | contract | none |
| tests/unit/weekly-close-snapshot.test.js | node | Fechamento | critical | — | contract | none |

## Sobreposições a investigar

| Família | Responsabilidades a separar | Decisão inicial |
|---|---|---|
| recovery-transaction / recovery-plan / achievement-projection / recovery-preview-ux | Invariantes e atomicidade; confirmação e aplicação; apresentação mobile | Preservar, separar jornada de matriz |
| adherence-model / weekly-adherence / adherence / planning-sustainability | Cálculo; integração do fechamento; navegação e leitura | Preservar contratos, selecionar jornadas |
| responsive / final-visual-polish / visual-density / refinement-visual | Overflow global; densidade da Demo; comparação de pixels | Matriz extensa candidata a Full |
| strategic-cycle / study-action-cycle / daily-execution / sessions | Ciclo estratégico; entrada da ação; registro e vínculo | Rever sobreposição sem apagar jornadas |
| legacy-backup / backup-schema24-cycle / testes de estado | Migrações; ciclo de exportação/restauração; normalização | Preservar proteção de integridade |

Nenhum teste foi removido. Sem prova de redundância exata, as famílias acima são candidatas à revisão, não classificações REMOVE. Alguns screenshots são condicionados a Windows e não comparam pixels no CI Ubuntu; inventariar baselines Linux antes de afirmar proteção visual remota.
