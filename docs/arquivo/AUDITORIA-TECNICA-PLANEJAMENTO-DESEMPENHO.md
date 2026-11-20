# Auditoria Técnica Complementar — Planejamento e Desempenho

Este documento registra a verificação técnica no código-fonte de todas as hipóteses e recomendações levantadas na auditoria funcional e de UX de 16/11/2026 (`auditoria_planejamento_desempenho_extrato.md`), complementando o contrato de propriedade em [`INFORMATION-OWNERSHIP.md`](../INFORMATION-OWNERSHIP.md) e o inventário histórico em [`PERFORMANCE-INVENTORY.md`](../PERFORMANCE-INVENTORY.md).

---

## 1. Inventário de Componentes Reais

### 1.1. Aba Planejamento (`#panel-metas` em `index.html`)

- **Navegação de subabas (4 seções):** [`src/ui/planning-subtabs.ts`](../../src/ui/planning-subtabs.ts) e [`src/ui/components/PlanningSubtabsNav.tsx`](../../src/ui/components/PlanningSubtabsNav.tsx) (`semana`, `prova`, `fechamento`, `historico`; aliases legados `#planejamento/metas` redirecionam para `prova`).
- **Orquestração e execução da semana:**
  - [`src/ui/tabs/goals/goals-tab-controller.ts`](../../src/ui/tabs/goals/goals-tab-controller.ts)
  - [`src/ui/tabs/goals/PlanExecutionCard.tsx`](../../src/ui/tabs/goals/PlanExecutionCard.tsx)
  - [`src/ui/tabs/goals/WeekReconciliationSummary.tsx`](../../src/ui/tabs/goals/WeekReconciliationSummary.tsx)
  - [`src/ui/tabs/goals/week-reconciliation.ts`](../../src/ui/tabs/goals/week-reconciliation.ts) (`assessWeekRecoverability`, `buildWeekReconciliation`, `buildWeekReconciliationFromExecution`)
  - [`src/application/goals/build-plan-execution.ts`](../../src/application/goals/build-plan-execution.ts)
  - [`src/ui/renderers/plan-execution-renderer.ts`](../../src/ui/renderers/plan-execution-renderer.ts)
- **Construtor do plano semanal, roteiro de iniciante e capacidade:**
  - [`src/ui/tabs/goals/study-plan-builder-controller.ts`](../../src/ui/tabs/goals/study-plan-builder-controller.ts)
  - [`src/ui/tabs/goals/PlanRoadmap.tsx`](../../src/ui/tabs/goals/PlanRoadmap.tsx)
  - [`src/ui/tabs/goals/WeeklyAvailabilityGrid.tsx`](../../src/ui/tabs/goals/WeeklyAvailabilityGrid.tsx)
  - [`src/application/planning/plan-reserve.ts`](../../src/application/planning/plan-reserve.ts)
  - [`src/application/replan-study.ts`](../../src/application/replan-study.ts)
- **Prova, metas e matriz estratégica:**
  - [`src/ui/tabs/goals/subject-target-editor-controller.ts`](../../src/ui/tabs/goals/subject-target-editor-controller.ts)
  - [`src/ui/tabs/goals/exam-matrix-controller.ts`](../../src/ui/tabs/goals/exam-matrix-controller.ts)
  - [`src/ui/renderers/exam-blueprint-config-renderer.ts`](../../src/ui/renderers/exam-blueprint-config-renderer.ts)
- **Gráficos e renderizadores visuais:**
  - [`src/domain/planning/planning-visual-models.ts`](../../src/domain/planning/planning-visual-models.ts)
  - [`src/ui/primitives/charts/GroupedBarChart.tsx`](../../src/ui/primitives/charts/GroupedBarChart.tsx)
  - [`src/ui/primitives/charts/AllocationBar.tsx`](../../src/ui/primitives/charts/AllocationBar.tsx)
  - [`src/ui/primitives/charts/PhaseRoadmapTimeline.tsx`](../../src/ui/primitives/charts/PhaseRoadmapTimeline.tsx)
  - [`src/ui/renderers/study-distribution-renderer.ts`](../../src/ui/renderers/study-distribution-renderer.ts)
  - [`src/ui/renderers/plan-impact-alignment-renderer.ts`](../../src/ui/renderers/plan-impact-alignment-renderer.ts)
  - [`src/ui/renderers/adaptive-planning-renderer.ts`](../../src/ui/renderers/adaptive-planning-renderer.ts)

### 1.2. Aba Desempenho (`#panel-desempenho` em `index.html`)

- **Orquestração, roteamento e estado de navegação:**
  - [`src/ui/tabs/performance/performance-tab-controller.ts`](../../src/ui/tabs/performance/performance-tab-controller.ts)
  - [`src/ui/controllers/performance-controller.ts`](../../src/ui/controllers/performance-controller.ts)
  - [`src/ui/performance/performance-page.ts`](../../src/ui/performance/performance-page.ts)
  - [`src/ui/performance/PerformancePageNav.tsx`](../../src/ui/performance/PerformancePageNav.tsx)
  - [`src/ui/performance/render-performance-section.ts`](../../src/ui/performance/render-performance-section.ts)
  - [`src/application/performance/performance-view-state.ts`](../../src/application/performance/performance-view-state.ts)
  - [`src/application/performance/build-performance-page-model.ts`](../../src/application/performance/build-performance-page-model.ts)
- **Subaba `overview` (Resumo):**
  - [`src/application/performance/build-performance-overview.ts`](../../src/application/performance/build-performance-overview.ts)
  - [`src/ui/performance/performance-overview-renderer.ts`](../../src/ui/performance/performance-overview-renderer.ts)
  - [`src/ui/performance/PreparationReadingView.tsx`](../../src/ui/performance/PreparationReadingView.tsx)
  - [`src/ui/performance/week-summary-renderer.ts`](../../src/ui/performance/week-summary-renderer.ts)
- **Subaba `subjects` (Por disciplina):**
  - [`src/application/performance/build-performance-subjects.ts`](../../src/application/performance/build-performance-subjects.ts)
  - [`src/ui/performance/performance-subjects-renderer.ts`](../../src/ui/performance/performance-subjects-renderer.ts)
  - [`src/ui/performance/performance-subject-comparison-renderer.ts`](../../src/ui/performance/performance-subject-comparison-renderer.ts)
  - [`src/ui/performance/stability-map-renderer.ts`](../../src/ui/performance/stability-map-renderer.ts)
- **Subaba `diagnosis` (Diagnóstico):**
  - [`src/ui/renderers/consolidated-diagnosis-renderer.ts`](../../src/ui/renderers/consolidated-diagnosis-renderer.ts)
  - [`src/ui/performance/performance-matrix-renderer.ts`](../../src/ui/performance/performance-matrix-renderer.ts)
  - [`src/domain/analytics/pedagogical-matrix.ts`](../../src/domain/analytics/pedagogical-matrix.ts)
  - [`src/ui/primitives/charts/PedagogicalMatrixChart.tsx`](../../src/ui/primitives/charts/PedagogicalMatrixChart.tsx)
- **Subaba `questions` / `simulations` / `exam` (Resultados das provas):**
  - [`src/ui/performance/performance-questions-renderer.ts`](../../src/ui/performance/performance-questions-renderer.ts)
  - [`src/ui/primitives/charts/MultiLineChart.tsx`](../../src/ui/primitives/charts/MultiLineChart.tsx)
  - [`src/application/performance/build-performance-simulations.ts`](../../src/application/performance/build-performance-simulations.ts)
  - [`src/ui/performance/performance-simulations-renderer.ts`](../../src/ui/performance/performance-simulations-renderer.ts)
  - [`src/ui/renderers/simulations-renderer.ts`](../../src/ui/renderers/simulations-renderer.ts)
  - [`src/ui/performance/achievement-projection-renderer.ts`](../../src/ui/performance/achievement-projection-renderer.ts)
  - [`src/ui/renderers/exam-matrix-renderer.ts`](../../src/ui/renderers/exam-matrix-renderer.ts)
- **Subaba `consistency` (Ritmo e aderência):**
  - [`src/ui/performance/performance-consistency-renderer.ts`](../../src/ui/performance/performance-consistency-renderer.ts)
  - [`src/ui/performance/time-by-subject-bars.ts`](../../src/ui/performance/time-by-subject-bars.ts)
  - [`src/ui/performance/planned-actual-chart.ts`](../../src/ui/performance/planned-actual-chart.ts)
  - [`src/ui/tabs/performance/ShiftEnergyCard.tsx`](../../src/ui/tabs/performance/ShiftEnergyCard.tsx)

### 1.3. Componentes Compartilhados entre Abas

| Recurso | Dono Canônico | Uso Secundário Verificado |
|---|---|---|
| Conciliação da semana (`WeekReconciliationSummary.tsx` / `week-reconciliation.ts`) | Planejamento (`semana`) | Resumo em uma linha no Fechamento (`WeeklyCloseKpis.tsx`), preservando snapshots salvos imutáveis |
| Próxima ação (`nextBestAction`, `recommendationId`) | Hoje (`#studyRecommendation`) | Visão Geral (`#overviewNextAction`) e Leitura da preparação em Desempenho (`PreparationReadingView.tsx` via botão "Abrir em Hoje") |
| Modo Essencial e Glossário (`src/ui/essential-mode.ts`) | Transversal (UI shell) | Oculta blocos `[data-advanced]` atrás de revelação progressiva ("Mostrar …") e adiciona `?` em `[data-term]` |
| Gate de Iniciante (`src/domain/analytics/beginner-gate.ts`) | Desempenho | Oculta `subjects`, `diagnosis` e `questions` até atingir amostra mínima, mantendo `overview` e `consistency` visíveis |

---

## 2. Fórmulas e Limiares Verificados no Código

| Conceito | Implementação Verificada | Fórmula / Regra Exata |
|---|---|---|
| **Domínio por tópico (`/100`)** | `calculateTopicMastery` ([`src/domain/analytics/topic-metrics.ts`](../../src/domain/analytics/topic-metrics.ts)) | `questionConfidence = min(1, resolved / 50)`; `performanceScore = accuracy * questionConfidence + 40 * (1 - questionConfidence)`. Média ponderada dos fatores disponíveis: **Questões (`65%`)**, **Tendência (`15%`)**, **Revisões (`20%`)**. Tempo de estudo não pontua domínio. |
| **Retenção por tópico (`/100`)** | `calculateTopicRetention` ([`src/domain/analytics/topic-metrics.ts`](../../src/domain/analytics/topic-metrics.ts)) | `raw = reviewRate * 0.45 + accuracy * 0.35 + recency * 0.2`, em que `recency = max(0, 100 - max(0, daysSince - 1) * 2.7)` (ou `50` se nulo) e `confidence = min(1, min(1, due.length / 4) * 0.4 + min(1, resolved / 50) * 0.4 + (lastReview ? 0.2 : 0))`. Resultado final: `clamp(50 + (raw - 50) * (0.35 + confidence * 0.65))`. |
| **Quadrantes Domínio × Retenção** | `classifyPedagogicalQuadrant` ([`src/domain/analytics/pedagogical-matrix.ts`](../../src/domain/analytics/pedagogical-matrix.ts)) | Limiares padrão: `thresholdMastery = 70` e `thresholdRetention = 60`:<br>• `Consolidada` (`≥ 70`, `≥ 60`) → Revisões de manutenção<br>• `Risco de Esquecimento` (`≥ 70`, `< 60`) → Consolidar com revisões<br>• `Em Construção` (`< 70`, `≥ 60`) → Prática direcionada<br>• `Vulnerabilidade Crítica` (`< 70`, `< 60`) → Retomar fundamentos |
| **Reserva do plano semanal** | `PLAN_RESERVE_RATIO` ([`src/application/planning/plan-reserve.ts`](../../src/application/planning/plan-reserve.ts)) | `PLAN_RESERVE_RATIO = 0.1` (`usableMinutes = floor(availableMinutes * 0.9)`). |
| **Recuperabilidade do saldo** | `assessWeekRecoverability` e `buildWeekReconciliationFromExecution` ([`src/ui/tabs/goals/week-reconciliation.ts`](../../src/ui/tabs/goals/week-reconciliation.ts)) | `executed = linkedMin === null ? studiedMin : min(linkedMin, studiedMin)`; `pendingPlannedMin = max(0, plannedMin - executed)`; `remainingCapacityMin` soma o saldo disponível de hoje (`max(0, capacityToday - studiedToday)`) e os dias futuros da semana. Classifica em `on_track` (`pending <= 0`), `recoverable` (`pending <= remainingCapacityMin`) ou `needs_replan` (`pending > remainingCapacityMin`). |
| **Status por disciplina** | `buildSubjectStudyDistributionVisual` ([`src/domain/planning/planning-visual-models.ts`](../../src/domain/planning/planning-visual-models.ts)) | `Extra` (`unplanned`: `planned === 0 && studied > 0`); `Superávit` (`surplus`: `diff > 15` min); `Déficit` (`deficit`: `diff < -15` min); `No ritmo` (`on_track`: `\|diff\| <= 15` min). Detecta `maskedNegligence` quando há ao menos uma matéria em déficit junto a superávit/extra ou saldo global cumprido. |
| **Alinhamento Plano × Edital** | `buildPlanImpactAlignmentVisual` ([`src/domain/planning/planning-visual-models.ts`](../../src/domain/planning/planning-visual-models.ts)) | `gap = plannedShare - impactShare`. `underallocated` (`gap < -8` p.p.), `overallocated` (`gap > 8` p.p.), `balanced` (`\|gap\| <= 8` p.p.). |
| **Gate de Iniciante e Amostra** | `assessBeginner` ([`src/domain/analytics/beginner-gate.ts`](../../src/domain/analytics/beginner-gate.ts)), `buildPerformanceOverview`, `buildPerformanceSubjects` | Iniciante: `< 30` questões (`BEGINNER_QUESTION_LIMIT`) e `< 14` dias desde o primeiro registro (`BEGINNER_DAYS_LIMIT`). Amostra mínima por disciplina/tópico: `10` questões (`build-performance-subjects.ts`, `TREND_MIN_QUESTIONS = 10` em `build-performance-overview.ts`). Amostra robusta para comparação e aviso de "amostra pequena": `30` questões (`performance-overview-renderer.ts`, `performance-questions-renderer.ts`). |
| **Simulados na Prontidão** | `calculateApprovalSimuladosMetric` ([`src/domain/analytics/approval-metrics.ts`](../../src/domain/analytics/approval-metrics.ts)) | Média ponderada temporal dos 5 últimos simulados válidos de todo o histórico (distinta da média simples do período na aba Simulados). |

---

## 3. Verificação de Sobreposições (Confirmadas vs. Descartadas / Resolvidas)

| Hipótese da Auditoria | Situação Encontrada no Código | Gravidade | Solução e Dependências |
|---|---|---|---|
| **Donut isolado de carga horária no topo de Desempenho** | **Descartada / já migrada:** o componente de tempo por disciplina em Desempenho foi convertido em barras horizontais (`renderTimeBySubjectBars`) dentro de `<details>` secundário na subaba `consistency` (`Ritmo e aderência`). | Baixa (resolvido) | Mantido recolhido em `Ritmo e aderência` (`performance-consistency-renderer.ts`). |
| **Linha do tempo diária competindo com aprendizado** | **Descartada / já migrada:** `StackedColumnChart` mora na subaba `consistency`, enquanto `overview` prioriza leitura da preparação, KPIs de precisão e evolução. | Baixa (resolvido) | Mantido em `Ritmo e aderência`. |
| **Muitas curvas simultâneas por matéria em Questões** | **Confirmada parcialmente:** `performance-questions-renderer.ts` limitava a 5 curvas fixas de menor precisão sem seleção interativa pelo usuário e exibia toda a lista aberta. | Média | Reduzido para até **3 disciplinas simultâneas** com alternância por clique (`selectedQuestionSubjects` em `performance-view-state.ts`), indicação explícita de amostra `< 30` e lista excedente (`> 5`) recolhida em `<details>` sob demanda. |
| **Recuperabilidade do saldo na semana e distinção Superávit × Extra** | **Confirmada:** `WeekReconciliationSummary.tsx` não avaliava se o saldo pendente cabia na capacidade restante da semana; `study-distribution-renderer.ts` não alertava sobre negligência mascarada por superávit/extra em outras matérias. | Alta | Adicionado `assessWeekRecoverability` em `week-reconciliation.ts`, aviso contextual em `WeekReconciliationSummary.tsx`, legenda explícita dos 4 status e detecção de `maskedNegligence` em `planning-visual-models.ts` / `study-distribution-renderer.ts`. |
| **Alinhamento do Edital sem ação direta e Mix sem alerta** | **Confirmada:** `plan-impact-alignment-renderer.ts` não oferecia CTA de ajuste de ciclo; `AllocationBar.tsx` não alertava quando questões ou revisões estavam zeradas; `PhaseRoadmapTimeline.tsx` não mostrava orientação pedagógica da fase. | Média | Adicionados botão `Ajustar ciclo` (`calculateStudyPlanPreview()`), alertas de ausência de questões/revisões em `AllocationBar.tsx` e `phaseGuidance` por fase em `PhaseRoadmapTimeline.tsx`. |
| **Matriz Domínio × Retenção sem ação explícita e limiares claros; Simulados sem volume na lista** | **Confirmada parcialmente:** quadrantes estavam rotulados, mas a lista ordenada não trazia a ação recomendada por quadrante nem os limiares (`70/100` e `60/100`), os tópicos da disciplina não traziam ação sugerida e a lista de tendência de simulados omitia o total de itens (ex.: baterias curtas `< 30`). | Média | Adicionado `recommendedAction` em `pedagogical-matrix.ts` e `build-performance-subjects.ts`, nota metodológica em `performance-matrix-renderer.ts`, e contagem `acertos/total` + tag `(bateria curta)` em `simulations-renderer.ts`. |
| **Comparação de períodos e Matriz Edital × Domínio em Planejamento** | **Monitorada (backlog estrutural):** blocos permanecem em `#panel-metas` vinculados a contratos E2E existentes (`planning.spec.js`, `refinement-visual.spec.js`, `result-goals-and-period-comparison.test.js`). | Baixa | Preservados sem quebra de contrato; consolidação total prevista na Fase 6 de `tasks/plan-planejamento.md`. |
| **Ausência de métricas de uso local dos componentes** | **Confirmada:** não havia registro local de abertura de subabas, filtros, acesso a detalhes, cliques em recomendações, ajustes pós-análise ou retorno. | Média (P2) | Criados [`src/domain/telemetry/local-usage-telemetry.ts`](../../src/domain/telemetry/local-usage-telemetry.ts) e [`src/application/telemetry/usage-telemetry-service.ts`](../../src/application/telemetry/usage-telemetry-service.ts) com persistência agregada em `localStorage` e exportação voluntária sem conteúdo de estudo. |
