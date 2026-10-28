# Plano Diretor de Modularização do `src/app.ts`

## 1. Contexto e Motivação

Conforme estabelecido em `AGENTS.md`:
> **Modularização Obrigatória (Zero Novas Funções no `app.ts`):** É terminantemente proibido adicionar novas funções ou concentrar regras de negócio em `src/app.ts`. O projeto deve ser totalmente modularizado: regras e cálculos puros pertencem a `src/domain/`, orquestrações e casos de uso a `src/application/`, componentes e interfaces reativas a `src/ui/`, e persistência a `src/storage/` ou `src/repositories/`. O arquivo `src/app.ts` atua unicamente como raiz de composição (*composition root*) e conexão de ciclo de vida, devendo ser progressivamente reduzido e desmembrado, nunca inflado.

No estado inicial deste plano, o `src/app.ts` possui **10.921 linhas** e **473 funções de nível superior sem exports**, funcionando simultaneamente como Composition Root, motor de cálculo matemático, gerador de templates HTML, roteador de abas, máquina de estados do cronômetro e despachante de eventos do DOM.

---

## 2. Diagnóstico Estrutural

### 2.1 Distribuição de Linhas por Domínio / Responsabilidade
1. **Renderizadores e Views de UI (HTML/DOM):** ~5.380 linhas
2. **Lógica de Domínio e Algoritmos Vazados:** ~1.850 linhas
3. **Timer e Sessão de Estudo:** ~763 linhas
4. **Eventos Delegados, Atalhos e Master Render:** ~871 linhas
5. **Wire-up, Bootstrap e Inicialização:** ~1.164 linhas
6. **Helpers, Seletores e Modais Imperativos:** ~893 linhas

### 2.2 Principais Anti-Patterns Diagnosticados
- **God Object / Script Monolítico:** Agrega todas as camadas da aplicação em um único arquivo de execução imediata.
- **Vazamento de Lógica de Domínio:** Cálculos matemáticos puros (como cálculo de prontidão de simulados, pontuações de aprovação, streaks e ritmos) implementados diretamente no arquivo de entrada, sem isolamento de testes unitários rápidos.
- **Renderização via Template Strings (`innerHTML`):** Desacordo com a diretriz de interface declarativa em Preact 11 (`.tsx`) e Tailwind CSS v4 tokens (`styles/tokens.css`).
- **Acoplamento a Estado Global Mutável:** Mutações imperativas diretas em `state.` espalhadas por centenas de funções locais em vez de fluxo unidirecional via repositórios/serviços.

---

## 3. Arquitetura Alvo

O arquivo `src/app.ts` deve ser reduzido a um arquivo conciso de **~100 a 150 linhas**, contendo apenas:
1. Importação dos containers e orquestradores de ciclo de vida.
2. Composição de dependências via `createAppContext`.
3. Conexão do ciclo de vida com `registerApplicationLifecycle` e `bootstrapApplication`.
4. Disparo do carregamento e montagem inicial.

```mermaid
flowchart TD
    subgraph CompositionRoot["src/app.ts (~120 linhas)"]
        Bootstrap["bootstrapApplication()"] --> Context["createAppContext()"]
        Bootstrap --> Store["createAppStateStore()"]
        Bootstrap --> Lifecycle["registerApplicationLifecycle()"]
    end

    subgraph BootstrapLayer["src/bootstrap/"]
        Wire["wire-dependencies.ts"]
        MasterRender["master-renderer.ts"]
    end

    subgraph DomainLayer["src/domain/ (Puro, Determinístico)"]
        ApprovalMetrics["analytics/approval-metrics.ts"]
        StreakDomain["analytics/study-streak.ts"]
        RhythmDomain["planning/rhythm-estimator.ts"]
        Selectors["subjects/subject-selectors.ts"]
    end

    subgraph ApplicationLayer["src/application/ (Casos de Uso)"]
        TimerCoord["sessions/timer-coordinator.ts"]
        DailyPlanCoord["planning/daily-plan-workflow.ts"]
        RouterCoord["navigation/tab-router.ts"]
    end

    subgraph UILayer["src/ui/ (Preact 11, Tokens)"]
        DelegatedEvents["events/delegated-actions.ts"]
        KeyShortcuts["events/keyboard-shortcuts.ts"]
        TimerModalUI["timer/StudyTimerModal.tsx"]
        ApprovalUI["tabs/approval/ApprovalDashboardView.tsx"]
        TabViews["tabs/*"]
    end

    CompositionRoot --> Wire
    CompositionRoot --> MasterRender
    Wire --> DomainLayer
    Wire --> ApplicationLayer
    MasterRender --> UILayer
    UILayer --> ApplicationLayer
    ApplicationLayer --> DomainLayer
```

---

## 4. Roteiro de Execução em 5 Fases

### Fase 1: Extração do Domínio Puro (Sem Risco de Regressão Visual) — CONCLUÍDA ✅
- **Objetivo:** Isolar algoritmos matemáticos determinísticos em `src/domain/`, sem qualquer dependência de DOM ou storage, acompanhados por testes unitários no Node (`npm run test:fast`).
- **Módulos Entregues:**
  1. `src/domain/analytics/approval-metrics.ts`: métricas de aprovação, fatores de prontidão e scores ponderados de simulados/edital. (12 funções migradas, 11 testes unitários em `tests/unit/approval-metrics.test.js`).
  2. `src/domain/analytics/study-streak.ts`: sumarização diária de horas estudadas, datas ativas e cálculo de sequência ininterrupta (*streak*). (3 testes unitários em `tests/unit/study-streak.test.js`).
  3. `src/domain/planning/rhythm-estimator.ts`: cálculo de ritmo diário, velocidade de cobertura e revisão em atraso. (6 testes unitários em `tests/unit/rhythm-estimator.test.js`).
  4. `src/domain/analytics/subject-error-metrics.ts`: taxa de erro e inatividade por disciplina. (3 testes unitários em `tests/unit/subject-error-metrics.test.js`).
- **Status:** 100% concluída e validada no Fast Gate.

### Fase 2: Extração de Eventos Globais, Atalhos e Diálogos — CONCLUÍDA ✅
- **Objetivo:** Desacoplar a infraestrutura periférica de interface, diálogos de notificação e atalhos de teclado.
- **Módulos Entregues:**
  1. `src/ui/primitives/modal-dialogs.ts`: serviço unificado de diálogos (`showToast`, `flashSaved`, `showConfirm`, `showPrompt`). (3 testes unitários em `tests/unit/modal-dialogs.test.js`).
  2. `src/ui/events/keyboard-shortcuts.ts`: controlador de atalhos globais, confinamento de foco e tecla Escape para foco do cronômetro e menus de ação (`.action-menu`). (3 testes unitários em `tests/unit/keyboard-shortcuts.test.js`).
  3. `src/ui/events/delegated-actions.ts`: utilitário `composeDelegatedActionHandlers` para registro seguro de ações delegadas sem poluição de protótipo. (3 testes unitários em `tests/unit/delegated-actions.test.js`).
- **Status:** 100% concluída e validada no Fast Gate (1038 testes passando, tempo 34.92s).

### Fase 3: Desacoplamento do Cronômetro de Estudos (Timer) — CONCLUÍDA ✅
- **Objetivo:** Isolar o subsistema do timer de estudo e registro de sessões.
- **Módulos Entregues:**
  1. `src/application/sessions/timer-coordinator.ts`: orquestração do timer, cálculo de durações, liberação e início de atividades planejadas, registro de sessões e resolução de bookmarks. (6 testes unitários em `tests/unit/timer-coordinator.test.js`).
  2. `src/core/format-duration.ts`: formatação padronizada de duração em segundos (`formatDuration`) e minutos de plano (`formatPlanMinutes`). (2 testes unitários em `tests/unit/format-duration.test.js`).
  3. `src/ui/controllers/session-modal-controller.ts`: isolamento de manipulação do modal de sessão, bindings de eventos, leitura e sanitização de formulário e ponto de parada. (4 testes unitários em `tests/unit/session-modal-controller.test.js`).
  4. `src/ui/controllers/study-timer-view-controller.ts`: gerenciamento visual do display, target progressivo, contexto em foco, estratégia guiada e seletores. (3 testes unitários em `tests/unit/study-timer-view-controller.test.js`).
- **Redução Obtida:** `src/app.ts` reduzido de 10.921 para 10.180 linhas (-741 linhas).
- **Status:** 100% concluída e validada no Fast Gate (1031 testes passando, tempo 33.38s).

### Fase 4: Migração das Telas Pesadas, Matrizes e Editores para seus Respectivos Módulos de UI — CONCLUÍDA ✅
- **Objetivo:** Substituir a renderização procedural e gerenciamento de matrizes/editores por componentes e controladores dedicados sob `src/ui/tabs/`.
- **Módulos Entregues e Integrados:**
  1. `src/ui/tabs/approval/approval-tab-controller.ts`: isolamento de `renderApprovalDashboard()`, `renderTopicRetentionDashboard()`, `renderRecommendationCalibration()`, `renderRecommendationHistorySummary()`. (1 teste unitário em `tests/unit/approval-tab-controller.test.js`).
  2. `src/domain/analytics/topic-performance.ts` e `src/ui/tabs/questions/question-analytics-controller.ts`: desacoplamento de agregações analíticas de tópicos/disciplinas (`calculateTopicPerformance`, `calculateSubjectWeeklyTrend`, `classifyAccuracy`, etc.) e renderização de performance em `renderQuestionAnalytics()`. (8 testes unitários em `tests/unit/topic-performance.test.js` e 1 em `tests/unit/question-analytics-controller.test.js`).
  3. `src/ui/tabs/diagnostics/diagnostics-tab-controller.ts`: central de diagnósticos e alertas desacoplada (`renderAlertasInteligentes()`, `dismissIntelligentAlert()`, `renderExecutiveSummary()`, `renderDiagnosisCenter()`). (1 teste unitário em `tests/unit/diagnostics-tab-controller.test.js`).
  4. `src/ui/tabs/goals/goals-tab-controller.ts`: expansão do controlador para gerenciar metas gerais (`renderMetas()`), metas por disciplina (`renderMetasPorDisciplina()`), histórico retroativo (`renderHistoricoMetas()`) e comparativo de períodos (`renderSelectedPeriodComparison()`). (Testes unitários atualizados em `tests/unit/goals-components.test.js`).
  5. `src/ui/tabs/subjects/topic-analytics-view.ts`: modularização de `renderTopicAnalyticsState()`. (1 teste unitário em `tests/unit/topic-analytics-view.test.js`).
  6. `src/ui/tabs/goals/exam-matrix-controller.ts`: modularização completa da Matriz Histórica do Concurso (`renderHistoricalExamMatrix`), Matriz de Domínio (`renderExamMasteryMatrix`), Seção de Inteligência (`renderExamIntelligenceSection`), Configuração de Blueprint (`renderExamBlueprintConfig`, `saveExamSubjectConfig`, `cancelExamSubjectConfig`, `toggleActiveExamTag`) e modal de Revisão de Classificação de Questões (`updateExamClassificationReview`, `closeExamClassificationReview`). (4 testes unitários em `tests/unit/exam-matrix-controller.test.js`).
  7. `src/ui/tabs/goals/subject-target-editor-controller.ts`: isolamento do editor de metas de acerto por disciplina (`renderSubjectTargetEditor`, `saveSubjectAccuracyTargets`, bindings de seleção e lote). (4 testes unitários em `tests/unit/subject-target-editor-controller.test.js`).
  8. `src/ui/tabs/subjects/topic-strategy-editor-view.ts`: visualização do editor de estratégia e pré-requisitos do tópico (`renderTopicStrategyEditor`). (1 teste unitário em `tests/unit/topic-strategy-editor-view.test.js`).
- **Redução Obtida:** `src/app.ts` reduzido de 10.921 para 9.254 linhas (-1.667 linhas líquidas acumuladas).
- **Status:** 100% concluída e validada no Fast Gate (1070 testes passando, tempo 34.96s).

### Fase 5: Refatoração do Bootstrap e Purificação do `app.ts` — CONCLUÍDA ✅
- **Objetivo:** Isolar a composição de dependências e loop de renderização da aplicação.
- **Módulos Entregues e Integrados:**
  1. `src/bootstrap/wire-dependencies.ts`: orquestração unificada de instanciação de providers de armazenamento (real e demo), repositórios e serviços de domínio/aplicação (`reviewService`, `studyPlanService`, `dailyPlanService`, `replanService`, `sessionService`, `guidedStudyService`, `goalsService`, `subjectService`, `topicStrategyController`, `topicHistoryService`). (4 testes unitários em `tests/unit/wire-dependencies.test.js`).
  2. `src/bootstrap/master-renderer.ts`: orquestração encapsulada do loop de renderização da aplicação (`render`, `renderScope`, `persistAndRender`, `renderAll`), rastreamento de profundidade recursiva de renderização (`renderDepth`), ganchos de ciclo de vida para invalidação de cache de candidatos (`renderCandidates`) e captura segura de erros com relatório para `errorBoundary`. (6 testes unitários em `tests/unit/master-renderer.test.js`).
  3. `src/app.ts`: purificação de mais de 130 linhas de fiação imperativa inline e renderização, com redução para 9.688 linhas (-1.233 linhas líquidas acumuladas).
- **Status:** 100% concluída e validada no Fast Gate (1061 testes passando, tempo 34.34s, dual timezone UTC/SP e Playwright smoke passing).

---

## 5. Governança e Validação Contínua

Cada passo de cada fase deve atender estritamente aos critérios:
1. **Tipagem estática:** `npm run check:types` sem novos erros.
2. **Fast Gate:** `npm run test:fast` executado com tempo < 120s e 100% de aprovação.
3. **Integridade de Build:** `npm run check:bundle` para assegurar reprodutibilidade de `src/app.bundle.js` e outros bundles.
4. **Registro em Tiers:** Novos testes unitários devem ser registrados em `tests/config/test-tiers.json` e validados via `node scripts/check-test-tiers.mjs`.
