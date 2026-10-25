# Mapeamento do que Falta ser Implementado — StudyTrack

Este documento consolida tudo o que ainda resta implementar no **StudyTrack**, organizando as pendências do plano recente de engenharia (Fases 5 e 6), os fechamentos de cobertura das fases já entregues, as novas especificações para transformar o app em um **Hub Completo de Estudos**, e o backlog estratégico mapeado em [docs/recomendacoes-futuras.md](file:///c:/Users/vitor/Documents/Extrato/docs/recomendacoes-futuras.md).

---

## 1. Resumo do Status Atual das Fases e Marcos Técnicos

O plano de evolução e robustez do StudyTrack já concluiu a maioria de suas fases estruturais, incluindo a **migração completa para TypeScript e Preact com Tailwind CSS**:

| Fase / Marco | Título | Status | Entregas Principais |
|:---:|---|:---:|---|
| **Fase 1** | Higiene do Repositório & Build | Concluída | `.gitignore` ajustado, limpeza de transitórios, script de build reproduzível (`npm run build`). |
| **Fase 2** | Importador de Questões (QConcursos/Tec) | Concluída | [`question-import-normalizer.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/questions/question-import-normalizer.ts), [`question-import-service.ts`](file:///c:/Users/vitor/Documents/Extrato/src/application/questions/question-import-service.ts), UI de importação CSV e preview com resolução de conflitos. |
| **Fase 3** | Tipagem Estática & Migração TypeScript | Concluída | `tsconfig.json` (`strict: true`), 437 módulos `.ts`, contratos estritos em [`src/core/types.ts`](file:///c:/Users/vitor/Documents/Extrato/src/core/types.ts) e checagem contínua via `npm run check:types`. |
| **Fase 4** | Sincronização WebDAV com Criptografia E2EE | Concluída | [`crypto-utils.ts`](file:///c:/Users/vitor/Documents/Extrato/src/core/crypto-utils.ts) (PBKDF2 + AES-GCM 256-bit), [`remote-sync-provider.ts`](file:///c:/Users/vitor/Documents/Extrato/src/storage/remote-sync-provider.ts), [`remote-sync-controller.ts`](file:///c:/Users/vitor/Documents/Extrato/src/ui/controllers/remote-sync-controller.ts). |
| **Fase 6** | Otimização de CI/CD (Sharding & Typecheck) | Concluída | Matriz paralela do Playwright (`1/4` a `4/4` no Full, `--browser-only` nos shards secundários) e `Typecheck` (`tsc --noEmit`) integrado em [`ci.yml`](file:///c:/Users/vitor/Documents/Extrato/.github/workflows/ci.yml) e [`run-test-gate.mjs`](file:///c:/Users/vitor/Documents/Extrato/scripts/run-test-gate.mjs). |
| **Modernização M1 & M2** | Preact, Tailwind CSS & Fatiamento de `app.ts` | Concluída | Preact 11 (`jsx: 'automatic'`), 22 componentes `.tsx` (`src/ui/primitives/*.tsx` e abas), Tailwind CSS v4 conectado a `styles/tokens.css`, extração de `TabRouter`, `AppStateStore`, `delegated-actions` e controllers de aba. |
| **PiP Timer** | Cronômetro Flutuante em Janela PiP | Concluída | [`pip-timer-controller.ts`](file:///c:/Users/vitor/Documents/Extrato/src/ui/controllers/pip-timer-controller.ts) com suporte a Document Picture-in-Picture e fallback por título dinâmico da aba. |
| **Fase 5** | Simulador "E se?" & Modo Reta Final | **Pendente** | Algoritmo what-if em memória e gatilho de reta final por contagem regressiva do edital (a implementar em TS/Preact). |

---

## 2. Pendências Imediatas (Próximas Fases do Roadmap)

### 2.1. Fase 5: Simulador "E se?" e Modo Reta Final

* **Prioridade:** Alta (P3 do plano de engenharia / Top 10 de produto).
* **Objetivo:** Dar poder preditivo ao estudante sem poluir o histórico ou persistir alterações experimentais antes de sua confirmação.
* **Pilha Tecnológica:** TypeScript (`.ts`) para os algoritmos de domínio e Preact (`.tsx`) + Tailwind CSS para a interface reativa.
* **Componentes a criar/alterar:**
  1. **Simulador "E se?" (`what-if-simulator.ts`):**
     - Localização: `src/domain/forecasts/what-if-simulator.ts` (ou extensão de [`performance-scenarios.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/forecasts/performance-scenarios.ts)).
     - Executar projeções em memória clonando o estado via `structuredClone`.
     - Simular: acréscimo de minutos diários, realocação de esforço entre disciplinas de pesos distintos e impacto direto no Índice de Prontidão ([`readiness-score.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/readiness-score.ts)) e Projeção Calibrada ([`calibrated-score-projection.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/forecasts/calibrated-score-projection.ts)).
  2. **Modo Reta Final (`final-stretch-policy.ts`):**
     - Localização: `src/domain/planning/final-stretch-policy.ts`.
     - Regra: quando a prova estiver a menos de 15 dias (ou limiar configurável), o planejador adapta automaticamente as metas:
       - 80%+ da capacidade diária dedicada à resolução de questões e simulados.
       - Congelamento de introdução de novos tópicos teóricos extensos ainda não iniciados.
       - Foco agressivo nas lacunas críticas de alto peso de edital.
  3. **UI / Controles (Preact + Tailwind):**
     - Modal declarativo `WhatIfSimulatorModal.tsx` utilizando as primitivas de `src/ui/primitives/*.tsx` (`Dialog`, `Button`, `ProgressBar`, `Card`).
     - Controlador `src/ui/controllers/what-if-controller.ts` para orquestrar simulações em tempo real sem renderização síncrona bloqueante.
     - Indicador visual ativo de "Modo Reta Final Ativado" com contagem regressiva destacada no cabeçalho ou aba Hoje.
  4. **Testes:**
     - Testes unitários puros no Node (`tests/unit/what-if-simulator.test.js`) rodando com `ts-resolve-hook.mjs`, confirmando que cenários simulados não mutam o estado persistido e não alteram snapshots históricos.

### 2.2. Fase 6: Otimização de CI/CD & Pipeline

* **Prioridade:** Média-Alta (DevOps e estabilidade de releases).
* **Objetivo:** Reduzir a latência do pipeline no GitHub Actions e garantir barreira estática para contratos de tipos.
* **Componentes a alterar:**
  1. **Playwright Sharding no Workflow (`.github/workflows/ci.yml`):**
     - Configurar matriz de paralelização para a suíte browser Full:
       ```yaml
       strategy:
         fail-fast: false
         matrix:
           shardIndex: [1, 2, 3, 4]
           shardTotal: [4]
       ```
     - Passar argumentos `--shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}` no Playwright.
     - Reduzir o tempo de execução do gate Full de ~40 minutos para ~10-12 minutos.
  2. **Step de Checagem Estática de Tipos no CI:**
     - Adicionar `npm run check:types` como etapa obrigatória e bloqueante no job de lint/testes rápidos no [`.github/workflows/ci.yml`](file:///c:/Users/vitor/Documents/Extrato/.github/workflows/ci.yml).

---

## 3. Fechamentos e Reforço das Fases Concluídas (Robustez)

Status de fechamento das entregas das Fases 2, 3, 4 e 6:

1. **Testes E2E (Playwright) para Novos Modais (Concluído):**
   - Adicionados casos E2E em [`tests/e2e/recent-flows.spec.js`](file:///c:/Users/vitor/Documents/Extrato/tests/e2e/recent-flows.spec.js) cobrindo:
     - O fluxo de abertura, upload de CSV, prévia, confirmação e prevenção de duplicatas do modal de Importação de Questões (`#questionsImportOverlay`).
     - O fluxo de configuração (sem persistir senhas no `localStorage`), teste de conexão, envio criptografado (`AES-GCM-256`) e restauração confirmada do modal de WebDAV (`#remoteSyncOverlay`).
2. **Atualização da Documentação Central de Arquitetura (Concluído):**
   - Atualizado [ARCHITECTURE.md](file:///c:/Users/vitor/Documents/Extrato/ARCHITECTURE.md) documentando a camada de armazenamento remoto ([`remote-sync-provider.js`](file:///c:/Users/vitor/Documents/Extrato/src/storage/remote-sync-provider.js), [`crypto-utils.js`](file:///c:/Users/vitor/Documents/Extrato/src/core/crypto-utils.js), [`remote-sync-controller.js`](file:///c:/Users/vitor/Documents/Extrato/src/ui/controllers/remote-sync-controller.js)), o módulo de importação de questões ([`question-import-normalizer.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/questions/question-import-normalizer.js), [`question-import-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/questions/question-import-service.js)) e a checagem estática de tipos (`check:types`).
   - Atualizado [README.md](file:///c:/Users/vitor/Documents/Extrato/README.md) documentando o script `npm run check:types`, a importação de questões CSV e o modelo de privacidade do WebDAV E2EE.
3. **Execução de Homologação com Gate Completo (`npm run test:full`) (Concluído):**
   - Executada e validada localmente em Windows/Chromium com 100% de aprovação: sintaxe, checagem de tipos (`Typecheck`), inventário, contratos de tiers, artefatos reproduzíveis, **791 testes Node em UTC**, **791 testes Node em `America/Sao_Paulo`**, **252 casos E2E browser em UTC** (incluindo os snapshots visuais Windows) e os **48 casos do recorte E2E em `America/Sao_Paulo`**.

---

## 4. Evolução para Hub Completo de Estudos (Especificação Técnica Detalhada)

Esta seção detalha a arquitetura e o passo a passo de implementação das funcionalidades estruturantes para transformar o StudyTrack em um **Hub Completo de Estudos**, respeitando a stack modernizada (**TypeScript + Preact + Tailwind CSS**) e a separação de camadas (`State → Domain → Application → UI`) definida em [ARCHITECTURE.md](file:///c:/Users/vitor/Documents/Extrato/ARCHITECTURE.md).

> [!IMPORTANT]
> **Diretrizes para Novas Implementações:**
> 1. Todo código de domínio (`src/domain/`) e aplicação (`src/application/`) deve ser escrito em **TypeScript (`.ts`)** com checagem estrita (`npm run check:types`).
> 2. Todas as interfaces de usuário devem ser componentes declarativos **Preact (`.tsx`)**, consumindo o UI kit de primitivas (`src/ui/primitives/*.tsx`) e utilizando Tailwind CSS v4 vinculado às variáveis de `styles/tokens.css`.
> 3. É vedado o uso de `innerHTML` ou interpolação de strings para novas telas; deve-se usar renderização nativa de componentes JSX.
> 4. Testes unitários no Node devem ser executados com o hook de resolução nativo (`node --import ./scripts/ts-resolve-hook.mjs --test`).

---

### 4.1. Rastreador de Ponto de Parada (Bookmarks de Estudo em PDFs, Videoaulas e Lei Seca)

* **Status:** Domínio Concluído ([`src/domain/topic-bookmark.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/topic-bookmark.ts)); Integração de UI em Preact Pendente.
* **Objetivo:** Eliminar o atrito de o estudante esquecer exatamente em qual página de PDF, minuto de videoaula ou artigo da lei parou na última sessão, apresentando esse ponto de retomada diretamente no card de "Próxima Ação" e no início do cronômetro.

#### O que já foi entregue:
1. **Contrato de Tipos:** [`TopicBookmark`](file:///c:/Users/vitor/Documents/Extrato/src/core/types.ts) e `BookmarkResourceType` tipados em `src/core/types.ts`.
2. **Normalização e Regras de Domínio:** [`normalizeTopicBookmark`](file:///c:/Users/vitor/Documents/Extrato/src/domain/topic-bookmark.ts), `bookmarkProgress` e testes em `tests/unit/topic-bookmark.test.js`.

#### O que falta implementar (UI Preact):
1. **Componente Preact `BookmarkBadge.tsx` (`src/ui/components/BookmarkBadge.tsx`):**
   - Exibir badge contextual no card de "Próxima Ação" (Visão Geral) e no cronômetro da aba Hoje (ex.: `📄 Pág. 42 de 110 (38%) · Continuar de onde parou`).
2. **Formulário de Checkout de Sessão em Preact:**
   - Adicionar ao modal de conclusão de sessão campos opcionais: *"Onde você parou?"* (Tipo: PDF/Vídeo/Lei, Página/Posição atual, Total de páginas/unidades).
3. **Edição Inline na Aba Disciplinas:**
   - Permitir ajuste rápido do marcador direto na lista de tópicos em `src/ui/subjects/SubjectsTab.tsx`.

---

### 4.2. Edital Verticalizado Interativo & Parser de Conteúdo Programático

#### Objetivo
Substituir planilhas externas de controle de edital por uma visão matricial interativa dentro do StudyTrack, onde cada tópico do edital exibe em linha única o checklist de etapas cumpridas (Teoria, Resumo, Revisões, Questões) cruzado com métricas reais de domínio e peso na prova.

#### Como Implementar

1. **Contrato de Estado ([`src/state/schema.ts`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.ts) e [`src/state/defaults.ts`](file:///c:/Users/vitor/Documents/Extrato/src/state/defaults.ts)):**
   - Adicionar ao `Topic` em `src/core/types.ts` o campo opcional `stageChecklist`:
     ```ts
     stageChecklist?: {
       theoryDone: boolean;
       summaryDone: boolean;
       lawOrNotesDone: boolean;
       questionsDone: boolean;
     };
     ```

2. **Motor de Domínio (`src/domain/exams/verticalized-syllabus.ts`):**
   - Combinar dados de [`exam-mastery-matrix.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/exam-mastery-matrix.ts), [`topic-metrics.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/topic-metrics.ts) e [`review-health.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/review-health.ts) para produzir uma estrutura tabular plana e tipada (`VerticalizedSyllabusRow[]`).

3. **Parser de Edital Bruto em [`src/application/subjects/structured-content-import.ts`](file:///c:/Users/vitor/Documents/Extrato/src/application/subjects/structured-content-import.ts):**
   - Adicionar função `parseRawSyllabusText(rawText: string)` capaz de receber textos colados diretamente de editais em PDF (ex.: `"CONHECIMENTOS BANCÁRIOS: 1. Sistema Financeiro Nacional. 2. Mercado de Capitais; 2.1 Ações e Debêntures."`) e transformá-los em árvore `{ subjects: [{ name, topics: [...] }] }` com preview idempotente antes de importar.

4. **Interface em Preact (`src/ui/views/VerticalizedSyllabusView.tsx`):**
   - Alternador de visualização na aba Disciplinas: `Visão em Árvore/Cards` vs. `Edital Verticalizado (Tabela)`.
   - Filtros rápidos com pílulas do UI Kit: *Apenas pendentes*, *Apenas peso alto*, *Apenas críticos (< 70% acerto)* e busca instantânea.
   - Botões de ação em cada linha: `▶ Estudar agora` (popula o timer) e `+ Questões`.

---

### 4.3. Ciclo de Estudos Flexível (Modo Ciclo / Fila Rotativa vs. Modo Agenda)

#### Objetivo
Permitir que o estudante alterne entre **Agenda Semanal Fixa** (ex.: Segunda = Português, Terça = Bancários) e **Ciclo de Estudos em Fila Rotativa** (uma sequência de blocos onde um imprevisto em um dia apenas desloca a fila sem gerar "atrasos cascata" na semana).

#### Como Implementar

1. **Contrato de Estado ([`src/state/schema.ts`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.ts)):**
   - Suportar `executionMode: 'agenda' | 'cycle'` em `AppState`.
   - Estrutura tipada `StudyCycle` em `src/core/types.ts`:
     ```ts
     interface StudyCycleBlock {
       id: string;
       subjectId: string;
       topicId: string | null;
       targetMinutes: number;
       accumulatedMinutesInCurrentLoop: number;
       sessionType: 'study' | 'questions' | 'review';
       priorityWeight: number;
       rationale: string;
     }

     interface StudyCycle {
       version: number;
       activeIndex: number;
       completedLoops: number;
       updatedAt: string | null;
       blocks: StudyCycleBlock[];
     }
     ```

2. **Motor de Domínio (`src/domain/planning/study-cycle-engine.ts`):**
   - `generateStudyCycleFromPriorities(...)`: calcula blocos de 45–90 min intercalando matérias distintas.
   - `advanceStudyCycle(...)`: avança o ponteiro `activeIndex` e incrementa `completedLoops`.

3. **Interface Preact (`src/ui/goals/StudyCycleView.tsx`):**
   - Alternador em `GoalsPlanningTab.tsx`: `📅 Agenda por Dia` vs. `🔄 Ciclo de Estudos`.
   - Trilha visual de blocos numerados e card de progresso da volta ativa.

---

### 4.4. Mini-Timer em Picture-in-Picture (Document PiP API) — Concluído

* **Status:** **Concluído** (Entregue em [`src/ui/controllers/pip-timer-controller.ts`](file:///c:/Users/vitor/Documents/Extrato/src/ui/controllers/pip-timer-controller.ts)).
* **Entregas:**
  - Janela flutuante (`Always on Top`) compacta com suporte à **Document Picture-in-Picture API**.
  - Sincronização em tempo real com o relógio do cronômetro (`state.activeTimer`).
  - Fallback por título dinâmico da aba (`document.title`) para navegadores sem Document PiP.
  - Testes unitários em `tests/unit/pip-timer-controller.test.js`.

---

### 4.5. Registro de Energia, Fadiga e Qualidade do Foco (Análise Cronobiológica)

#### Objetivo
Capturar a qualidade subjetiva do foco e o nível de energia em cada sessão e cruzá-los com dados objetivos (precisão em questões, taxa de retenção e horário do dia) para identificar janelas de pico cognitivo e prevenir esgotamento (burnout).

#### Como Implementar

1. **Contrato de Estado ([`src/core/types.ts`](file:///c:/Users/vitor/Documents/Extrato/src/core/types.ts) e [`src/state/schema.ts`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.ts)):**
   - Adicionar a `StudySession`:
     ```ts
     focusQuality?: 'deep' | 'normal' | 'fragmented' | null;
     energyLevel?: 'high' | 'medium' | 'low' | null;
     interruptionCount?: number;
     timeOfDayBucket?: 'morning' | 'afternoon' | 'evening' | 'night';
     ```

2. **Motor Analítico (`src/domain/analytics/focus-energy-analytics.ts`):**
   - `analyzePerformanceByTimeOfDay(...)`: agrupa dados em janelas de 6 horas e gera correlações por turno com salvaguarda de evidência mínima.
   - `detectFatigueRisk(...)`: alerta proativo em `generate-diagnosis.ts` quando houver fadiga contínua.

3. **Interface Preact (`src/ui/sessions/SessionEnergySelector.tsx`):**
   - Pílulas de 1 clique no encerramento da sessão: Foco (`[🔥 Profundo]`, `[⚡ Normal]`, `[💭 Distraído]`) e Energia (`[🔋 Alta]`, `[⚖️ Normal]`, `[🪫 Cansado]`).
   - Painel de produtividade cronobiológica integrado à aba Desempenho.

---

## 5. Backlog Adicional de Produto e Algoritmos (de `docs/recomendacoes-futuras.md`)

Consolidado em ordem de valor estratégico e impacto no aprendizado do estudante:

### 5.1. Curto a Médio Prazo (Inteligência & Diagnóstico)

* **Detecção de "Falsa Consolidação" (Ilusão de Competência):**
  - Identificar tópicos que atingem alto acerto (> 90%) logo após o estudo teórico, mas sofrem queda abrupta em revisões com intervalos > 14 dias.
  - Gerar marcação diagnóstica de *"Domínio Volátil"*, sugerindo baterias de checagem cega.
* **Caderno de Erros Ativo & Flashcards de Bolso:**
  - Transformar erros registrados em cards revisáveis (Enunciado resumido, Armadilha da banca, Regra de bolso) acionados diretamente na Agenda de Revisões.
* **Matriz Incidência × Domínio:**
  - Visualização em quadrantes:
    1. *Crítica:* alta incidência na prova + baixo domínio do estudante.
    2. *Oportunidade:* alta incidência + médio domínio (maior ganho marginal por hora).
    3. *Manutenção:* alta incidência + alto domínio (revisão espaçada).
    4. *Secundária:* baixa incidência na prova.
* **Rastreabilidade e Explicabilidade das Recomendações:**
  - Explicar o porquê de cada recomendação no painel:
    `Edital (Peso 3) → Lacuna Detectada (42% acerto) → Ação: 15 questões de Fixação`.
* **Listas Progressivas Globais com Limite de 5 Itens:**
  - Padronizar listas de histórico, tópicos atrasados e revisões para renderizar até 5 itens inicialmente com botão expansor `Mostrar mais (+N)`.
* **Histórico e Snapshots Reais do Índice de Prontidão:**
  - Registrar snapshots semanais imutáveis do índice de prontidão e seus fatores para exibir gráfico de tendência histórica confiável.

### 5.2. Médio a Longo Prazo (UX, Operação e Métricas Avançadas)

* **Detecção de Platô e Custo de Oportunidade:**
  - Identificar quando o estudante gasta muitas horas em uma matéria sem ganho percentual perceptível, alertando que o retorno marginal decresceu e sugerindo redirecionamento para outra matéria.
* **Consolidação do Design System & Tokens Semânticos:**
  - Padronizar tokens CSS para `critical`, `warning`, `success`, `info`, `surface` e consolidar microcomponentes (chips, badges, tooltips e skeletons de carregamento).
* **Auditoria Manual de Acessibilidade (Leitores de Tela Reais):**
  - Conforme apontado no [DECISION-EXPERIENCE-CLOSURE.md](file:///c:/Users/vitor/Documents/Extrato/docs/DECISION-EXPERIENCE-CLOSURE.md), realizar teste assistido com NVDA, VoiceOver ou Orca para garantir navegabilidade de teclado e semântica de leitor em todos os fluxos de estudo.

---

## 6. Matriz de Decisão: O que Atacar em Seguida?

Dependendo do objetivo do ciclo, a ordem recomendada de execução é:

1. **Se o foco for Transformar em Hub Completo de Estudos (Uso Diário Intenso):**
   - **Passo 1:** Rastreador de Ponto de Parada (`topic-bookmark.js`) + Registro de Energia/Foco no check-out da sessão (`focus-energy-analytics.js`).
   - **Passo 2:** Ciclo de Estudos Flexível (`study-cycle-engine.js`) + Mini-Timer em Picture-in-Picture (`pip-timer-controller.js`).
   - **Passo 3:** Edital Verticalizado Interativo (`verticalized-syllabus.js`).
2. **Se o foco for Concluir o Pacote de Engenharia Anterior:**
   - Implementar a **Fase 5** (Simulador "E se?" e Reta Final) → Implementar a **Fase 6** (CI Sharding & Typecheck no GitHub Actions) → Escrever testes E2E para os modais novos.
3. **Se o foco for Preparar Release Estável:**
   - Documentar em [README.md](file:///c:/Users/vitor/Documents/Extrato/README.md) e [ARCHITECTURE.md](file:///c:/Users/vitor/Documents/Extrato/ARCHITECTURE.md), e rodar o gate `npm run test:full`.
