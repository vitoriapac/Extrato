# Mapeamento do que Falta ser Implementado — StudyTrack

Este documento consolida tudo o que ainda resta implementar no **StudyTrack**, organizando as pendências do plano recente de engenharia (Fases 5 e 6), os fechamentos de cobertura das fases já entregues, as novas especificações para transformar o app em um **Hub Completo de Estudos**, e o backlog estratégico mapeado em [docs/recomendacoes-futuras.md](file:///c:/Users/vitor/Documents/Extrato/docs/recomendacoes-futuras.md).

---

## 1. Resumo do Status Atual das Fases

O plano de evolução recente foi dividido em 6 fases de engenharia. Cinco delas já foram concluídas:

| Fase | Título | Status | Entregas Principais |
|:---:|---|:---:|---|
| **Fase 1** | Higiene do Repositório & Build | Concluída | `.gitignore` ajustado, limpeza de transitórios, script de build reproduzível (`npm run build`). |
| **Fase 2** | Importador de Questões (QConcursos/Tec) | Concluída | [`question-import-normalizer.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/questions/question-import-normalizer.js), [`question-import-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/questions/question-import-service.js), UI de importação CSV e preview com resolução de conflitos. |
| **Fase 3** | Tipagem Estática Progressiva (JSDoc/tsc) | Concluída | [`jsconfig.json`](file:///c:/Users/vitor/Documents/Extrato/jsconfig.json), script `npm run check:types`, [`src/core/types.js`](file:///c:/Users/vitor/Documents/Extrato/src/core/types.js), tipagem de contratos essenciais sem dependências externas de runtime. |
| **Fase 4** | Sincronização WebDAV com Criptografia E2EE | Concluída | [`crypto-utils.js`](file:///c:/Users/vitor/Documents/Extrato/src/core/crypto-utils.js) (PBKDF2 + AES-GCM 256-bit), [`remote-sync-provider.js`](file:///c:/Users/vitor/Documents/Extrato/src/storage/remote-sync-provider.js), [`remote-sync-controller.js`](file:///c:/Users/vitor/Documents/Extrato/src/ui/controllers/remote-sync-controller.js) e interface de credenciais/backup remoto. |
| **Fase 5** | Simulador "E se?" & Modo Reta Final | **Pendente** | Algoritmo what-if em memória e gatilho de reta final por contagem regressiva do edital. |
| **Fase 6** | Otimização de CI/CD (Sharding & Typecheck) | Concluída | Matriz paralela do Playwright (`1/4` a `4/4` no Full, `--browser-only` nos shards secundários) e `Typecheck` (`tsc --noEmit`) integrado em [`ci.yml`](file:///c:/Users/vitor/Documents/Extrato/.github/workflows/ci.yml) e [`run-test-gate.mjs`](file:///c:/Users/vitor/Documents/Extrato/scripts/run-test-gate.mjs). |

---

## 2. Pendências Imediatas (Próximas Fases do Roadmap)

### 2.1. Fase 5: Simulador "E se?" e Modo Reta Final

* **Prioridade:** Alta (P3 do plano de engenharia / Top 10 de produto).
* **Objetivo:** Dar poder preditivo ao estudante sem poluir o histórico ou persistir alterações experimentais antes de sua confirmação.
* **Componentes a criar/alterar:**
  1. **Simulador "E se?" (`what-if-simulator.js`):**
     - Localização: `src/domain/forecasts/what-if-simulator.js` (ou extensão de [`performance-scenarios.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/forecasts/performance-scenarios.js)).
     - Executar projeções em memória clonando o estado via `structuredClone`.
     - Simular: acréscimo de minutos diários, realocação de esforço entre disciplinas de pesos distintos e impacto direto no Índice de Prontidão ([`readiness-score.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/readiness-score.js)) e Projeção Calibrada ([`calibrated-score-projection.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/forecasts/calibrated-score-projection.js)).
  2. **Modo Reta Final (`final-stretch-policy.js`):**
     - Localização: `src/domain/planning/final-stretch-policy.js`.
     - Regra: quando a prova estiver a menos de 15 dias (ou limiar configurável), o planejador adapta automaticamente as metas:
       - 80%+ da capacidade diária dedicada à resolução de questões e simulados.
       - Congelamento de introdução de novos tópicos teóricos extensos ainda não iniciados.
       - Foco agressivo nas lacunas críticas de alto peso de edital.
  3. **UI / Controles:**
     - Painel ou modal de "Simulador de Cenários" integrado à aba de Planejamento ou Visão Geral.
     - Indicador visual ativo de "Modo Reta Final Ativado" com contagem regressiva destacada.
  4. **Testes:**
     - Testes unitários puros no Node confirmando que cenários simulados não mutam o estado persistido e não alteram snapshots históricos.

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

Esta seção detalha a arquitetura e o passo a passo de implementação das cinco funcionalidades estruturantes para transformar o StudyTrack em um **Hub Completo de Estudos**, respeitando a separação de camadas (`State → Domain → Application → UI`) definida em [ARCHITECTURE.md](file:///c:/Users/vitor/Documents/Extrato/ARCHITECTURE.md).

---

### 4.1. Rastreador de Ponto de Parada (Bookmarks de Estudo em PDFs, Videoaulas e Lei Seca)

#### Objetivo
Eliminar o atrito de o estudante esquecer exatamente em qual página de PDF, minuto de videoaula ou artigo da lei parou na última sessão, apresentando esse ponto de retomada diretamente no card de "Próxima Ação" e no início do cronômetro.

#### Como Implementar

1. **Contrato de Estado e Migração ([`src/state/schema.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.js), [`src/state/defaults.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/defaults.js) e [`src/storage/migration-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/storage/migration-service.js)):**
   - Adicionar ao objeto `topic` dentro de `subjects[].topics[]` a propriedade estruturada `bookmark` (inicializada como `null` ou objeto normalizado):
     ```js
     bookmark: {
       resourceType: 'pdf' | 'video' | 'law' | 'custom',
       label: 'Aula 03 - Sistema Financeiro Nacional.pdf',
       currentUnit: 42,       // ex.: página 42 ou aula 3
       totalUnits: 110,       // ex.: 110 páginas ou 12 aulas (opcional)
       positionText: '',      // ex.: "18m30s" para vídeo ou "Art. 37, § 6º" para lei seca
       updatedAt: '2026-10-21T12:00:00.000Z'
     }
     ```
   - Garantir retrocompatibilidade na migração de schema: tópicos existentes sem `bookmark` recebem `bookmark: null` sem invalidar backups antigos.

2. **Regras de Domínio (`src/domain/subjects/topic-bookmark.js`):**
   - Criar funções puras:
     - `normalizeTopicBookmark(raw)`: valida limites numéricos (`currentUnit >= 0`, `totalUnits >= currentUnit`), limpa strings e retorna objeto imutável.
     - `computeBookmarkProgress(bookmark)`: calcula percentual de avanço do insumo (`Math.round((currentUnit / totalUnits) * 100)`) quando `totalUnits > 0`.
     - `formatBookmarkResumeLabel(bookmark)`: gera o microcopy acionável (ex.: `"Continuar PDF da pág. 42/110 (38%)"`, `"Retomar Aula 04 em 18m30s"`, ou `"Continuar Lei Seca: Art. 37"`).

3. **Camada de Aplicação ([`src/application/sessions/session-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/sessions/session-service.js) e [`src/application/subjects/subject-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/subjects/subject-service.js)):**
   - Em `subjectService`, expor `updateTopicBookmark(subjectId, topicId, bookmarkPayload)`.
   - Em `sessionService.completeSession(...)` (ou ao salvar uma sessão de estudo), aceitar um campo opcional `nextBookmark`. Se preenchido, atualizar automaticamente o `topic.bookmark` na mesma transação atômica em que a sessão é gravada em `studySessions` e o extrato diário é atualizado.
   - Em [`src/application/recommend-study.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/recommend-study.js) e [`src/application/build-executive-summary.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/build-executive-summary.js), enriquecer a recomendação prioritária com `resumeHint: formatBookmarkResumeLabel(topic.bookmark)`.

4. **Interface do Usuário (`src/ui/`):**
   - **No Card de Próxima Ação (Visão Geral) e no Cronômetro:** exibir um badge contextual logo abaixo do nome do tópico (ex.: `📄 Pág. 42 de 110 · Continuar de onde parou`).
   - **No Modal de Conclusão de Sessão:** incluir campos rápidos opcionais: *"Onde você parou?"* (Tipo: PDF/Vídeo/Lei, Página/ Posição atual, Total).
   - **Na Lista de Tópicos da Disciplina:** permitir edição inline rápida do marcador de página.

5. **Estratégia de Testes:**
   - Testes unitários em `tests/unit/topic-bookmark.test.js` validando normalização, cálculo de porcentagem e persistência atômica ao finalizar sessão.

---

### 4.2. Edital Verticalizado Interativo & Parser de Conteúdo Programático

#### Objetivo
Substituir planilhas externas de controle de edital por uma visão matricial interativa dentro do StudyTrack, onde cada tópico do edital exibe em linha única o checklist de etapas cumpridas (Teoria, Resumo, Revisões, Questões) cruzado com métricas reais de domínio e peso na prova.

#### Como Implementar

1. **Contrato de Estado ([`src/state/schema.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.js) e [`src/state/defaults.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/defaults.js)):**
   - Adicionar ao `topic` o objeto opcional `stageChecklist`:
     ```js
     stageChecklist: {
       theoryDone: false,
       summaryDone: false,
       lawOrNotesDone: false,
       questionsDone: false
     }
     ```
   - Os indicadores podem ser marcados manualmente pelo estudante **ou** derivados/sugeridos automaticamente (ex.: `theoryDone = true` quando `completionCount >= 1`; `questionsDone = true` quando o volume de questões do tópico atingir o mínimo de evidência).

2. **Motor de Domínio (`src/domain/exams/verticalized-syllabus.js`):**
   - Combinar dados de [`exam-mastery-matrix.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/exam-mastery-matrix.js), [`topic-metrics.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/topic-metrics.js) e [`review-health.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/review-health.js) para produzir uma estrutura tabular plana e filtrável:
     - Colunas calculadas por tópico:
       1. `Código/Ordem e Nome do Tópico` (ex.: `1.2 Sistema Financeiro Nacional`)
       2. `Peso / Importância no Edital` (`Alta`, `Média`, `Baixa` + pontos estimados)
       3. `Etapas` (`Teoria`, `Resumo/Lei`, `Revisão em dia`, `Bateria de Questões`)
       4. `Tempo Acumulado` (soma de `studySessions` do tópico)
       5. `Desempenho em Questões` (`Acertos / Total` e `% de precisão`)
       6. `Status Diagnóstico` (`Crítico`, `Em construção`, `Consolidado`, `Domínio volátil`)
       7. `Ponto de Parada` (`bookmark` resumido)
   - Criar agregadores de cabeçalho por disciplina: `% de cobertura do edital`, `% de tópicos consolidados` e `lacunas prioritárias restantes`.

3. **Parser de Edital Bruto em [`src/application/subjects/structured-content-import.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/subjects/structured-content-import.js):**
   - Adicionar função `parseRawSyllabusText(rawText)` capaz de receber textos colados diretamente de editais em PDF (ex.: `"CONHECIMENTOS BANCÁRIOS: 1. Sistema Financeiro Nacional. 2. Mercado de Capitais; 2.1 Ações e Debêntures."`) e transformá-los em árvore `{ subjects: [{ name, topics: [...] }] }` com preview idempotente antes de importar.

4. **View-Model e Renderer (`src/ui/view-models/verticalized-syllabus-view-model.js` e `src/ui/renderers/verticalized-syllabus-renderer.js`):**
   - Criar alternador de visualização na seção de Disciplinas / Inteligência da Prova: `Visão em Cards` vs. `Edital Verticalizado (Tabela)`.
   - Filtros rápidos no topo: *Apenas pendentes*, *Apenas peso alto*, *Apenas críticos (< 70% acerto)* e busca textual instantânea.
   - Botão de ação rápida em cada linha: `▶ Estudar agora` (já preenche o cronômetro com a disciplina/tópico) e `+ Questões`.

5. **Estratégia de Testes:**
   - Testes unitários no Node para `verticalized-syllabus.js` e para o parser de texto de editais numerados (`1.`, `1.1`, separadores `;` e `.`).

---

### 4.3. Ciclo de Estudos Flexível (Modo Ciclo / Fila Rotativa vs. Modo Agenda)

#### Objetivo
Permitir que o estudante alterne entre **Agenda Semanal Fixa** (ex.: Segunda = Português, Terça = Bancários) e **Ciclo de Estudos em Fila Rotativa** (uma sequência de blocos onde um imprevisto em um dia apenas desloca a fila sem gerar "atrasos cascata" na semana).

#### Como Implementar

1. **Contrato de Estado ([`src/state/schema.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.js) e [`src/state/defaults.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/defaults.js)):**
   - Aproveitar o campo já existente `executionMode: 'agenda'` em [`defaults.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/defaults.js#L20), suportando os valores `'agenda' | 'cycle'`.
   - Adicionar ao estado a estrutura `studyCycle`:
     ```js
     studyCycle: {
       version: 1,
       activeIndex: 0,
       completedLoops: 0,
       updatedAt: null,
       blocks: [
         {
           id: 'cycle_block_1',
           subjectId: '...',
           topicId: null, // opcional: pode ser aberto à disciplina ou fixado no tópico mais prioritário
           targetMinutes: 60,
           accumulatedMinutesInCurrentLoop: 0,
           sessionType: 'study' | 'questions' | 'review',
           priorityWeight: 0.85,
           rationale: 'Alta incidência no edital + lacuna de 58% em questões'
         }
       ]
     }
     ```

2. **Motor de Domínio (`src/domain/planning/study-cycle-engine.js`):**
   - `generateStudyCycleFromPriorities({ candidates, weeklyMinutesBudget, minBlockMinutes = 45, maxBlockMinutes = 90 })`:
     - Usa os scores de [`priority-score.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/priority-score.js) para calcular quantas peças (blocos de 45–90 min) cada disciplina recebe no ciclo.
     - Intercala disciplinas distintas (evitando dois blocos seguidos da mesma matéria para reduzir fadiga cognitiva).
   - `advanceStudyCycle(studyCycle, completedSession)`:
     - Soma os minutos estudados ao bloco ativo (`accumulatedMinutesInCurrentLoop`).
     - Se atingiu `targetMinutes` (ou tolerância de 85%), avança `activeIndex = (activeIndex + 1) % blocks.length`.
     - Quando `activeIndex` volta a `0`, incrementa `completedLoops++` e zera `accumulatedMinutesInCurrentLoop` de todos os blocos para iniciar uma nova volta do ciclo.

3. **Camada de Aplicação (`src/application/planning/study-cycle-service.js` e integração com [`session-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/sessions/session-service.js)):**
   - Quando `state.executionMode === 'cycle'`:
     - O card de "Próxima Ação" na Visão Geral lê o bloco em `studyCycle.blocks[studyCycle.activeIndex]` e resolve automaticamente o tópico de maior prioridade daquela disciplina no momento da execução.
     - Ao concluir uma sessão no cronômetro, `sessionService` invoca `advanceStudyCycle` automaticamente.
     - O estudante também pode clicar em `"Pular bloco (mover para o fim da fila atual)"` ou `"Rebalancear Ciclo com base nos novos resultados"`.

4. **Interface do Usuário (`src/ui/renderers/study-cycle-renderer.js`):**
   - Na tela de Planejamento, adicionar seletor de modo: `📅 Agenda por Dia da Semana` vs. `🔄 Ciclo de Estudos Contínuo`.
   - Renderizar uma trilha visual de blocos numerados (`Bloco 1: Português 60m [Concluído]` → `Bloco 2: Conhecimentos Bancários 90m [ATUAL - faltam 30m]` → `Bloco 3: Informática 60m [Próximo]`), mostrando em qual volta do ciclo o estudante está (`Volta #4 · 62% concluída`).

5. **Estratégia de Testes:**
   - Testes unitários em `tests/unit/study-cycle-engine.test.js` cobrindo geração proporcional aos pesos, intercalação de disciplinas, avanço parcial de bloco e fechamento de volta completa (`completedLoops`).

---

### 4.4. Mini-Timer em Picture-in-Picture (Document PiP API) e Notificações de Etapa

#### Objetivo
Manter o cronômetro e o guia de estratégia de estudo visíveis em uma janela flutuante sempre no topo (`Always on Top`) enquanto o estudante lê PDFs ou resolve questões em outras abas ou aplicativos, sem precisar alternar janelas.

#### Como Implementar

1. **Adaptador de Plataforma (`src/ui/controllers/pip-timer-controller.js`):**
   - Detectar suporte à **Document Picture-in-Picture API** (`'documentPictureInPicture' in window`), com fallback gracioso para:
     1. `Canvas + HTMLVideoElement.requestPictureInPicture()` (para navegadores sem Document PiP mas com Video PiP), e
     2. Atualização dinâmica de `document.title` (`"⏳ 24:15 · Português — StudyTrack"`) + **Web Notifications API** quando uma etapa da estratégia ou o tempo alvo terminar.

2. **Sincronização com o Estado do Cronômetro ([`src/application/sessions/session-service.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/sessions/session-service.js)):**
   - A janela PiP não cria um segundo timer independente; ela observa o mesmo `state.activeTimer` e o relógio injetável ([`src/core/clock.js`](file:///c:/Users/vitor/Documents/Extrato/src/core/clock.js)).
   - Exibir na mini-janela (dimensões compactas `320x180px`):
     - Nome da Disciplina e Tópico atual + `bookmark` (ex.: `Pág. 42`).
     - Contador regressivo/progressivo grande com barra de progresso da etapa atual ([`study-strategy.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/recommendations/study-strategy.js), ex.: *Etapa 1/3: Teoria Focada — 25 min*).
     - Controles diretos: `⏸ Pausar / ▶ Retomar`, `⏭ Próxima Etapa` e `⏹ Concluir Sessão`.

3. **Ciclo de Vida e Segurança ([`src/bootstrap/register-lifecycle.js`](file:///c:/Users/vitor/Documents/Extrato/src/bootstrap/register-lifecycle.js)):**
   - Copiar os tokens de tema (`styles/tokens.css`) para o `pipWindow.document.head` para respeitar o modo claro/escuro ativo.
   - Se o usuário fechar a janela PiP no `X`, o cronômetro principal na aba original continua rodando normalmente sem perda de estado.
   - Ao atingir o `targetMinutes` da sessão ou transição de etapa, disparar alerta visual na janela PiP e notificação nativa opcional (se autorizada pelo usuário).

4. **Estratégia de Testes:**
   - Testes unitários com mock de `window.documentPictureInPicture` garantindo que pausar/retomar no PiP chama os mesmos handlers do `sessionService` e que o fallback de título da aba funciona em 100% dos navegadores.

---

### 4.5. Registro de Energia, Fadiga e Qualidade do Foco (Análise Cronobiológica de Rendimento)

#### Objetivo
Capturar a qualidade subjetiva do foco e o nível de energia em cada sessão e cruzá-los com dados objetivos (precisão em questões, taxa de retenção e horário do dia) para identificar janelas de pico cognitivo e prevenir esgotamento (burnout).

#### Como Implementar

1. **Contrato de Estado ([`src/state/schema.js`](file:///c:/Users/vitor/Documents/Extrato/src/state/schema.js)):**
   - Adicionar aos registros de `studySessions[]` os campos opcionais (compatíveis com sessões antigas onde serão `null`):
     ```js
     focusQuality: 'deep' | 'normal' | 'fragmented' | null, // Foco profundo, Normal, Fragmentado/Distraído
     energyLevel: 'high' | 'medium' | 'low' | null,         // Energia alta, Média, Fadiga
     interruptionCount: 0,                                  // Quantidade de pausas/interrupções na sessão
     timeOfDayBucket: 'morning' | 'afternoon' | 'evening' | 'night' // Derivado da hora local de startedAt
     ```

2. **Motor Analítico (`src/domain/analytics/focus-energy-analytics.js`):**
   - Criar funções puras de correlação com requisitos mínimos de amostra (seguindo o contrato de [`evidence.js`](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/evidence.js)):
     - `analyzePerformanceByTimeOfDay({ studySessions, questoes, subjects })`:
       - Agrupa sessões e baterias de questões por turno (`Manhã 06h–12h`, `Tarde 12h–18h`, `Noite 18h–24h`, `Madrugada 00h–06h`).
       - Calcula a precisão média em questões e a proporção de sessões em `focusQuality === 'deep'` por turno e por disciplina.
       - Gera insights acionáveis somente quando houver evidência suficiente (ex.: $\ge 5$ sessões por turno): *"Sua precisão em disciplinas exatas é 22% maior pela manhã do que após as 20h"*.
     - `detectFatigueRisk({ studySessions, windowDays = 7 })`:
       - Detecta se nos últimos dias houve aumento consecutivo de sessões marcadas como `energyLevel === 'low'` ou `focusQuality === 'fragmented'` acompanhado de queda na precisão de questões.
       - Emite um alerta diagnóstico em [`generate-diagnosis.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/generate-diagnosis.js): *"Sinal de fadiga acumulado: 4 das últimas 5 sessões tiveram foco fragmentado. Considere reduzir a carga de teoria densa hoje e priorizar revisões leves."*

3. **Integração no Planejamento e Cronômetro:**
   - **Durante a Sessão:** contabilizar automaticamente `interruptionCount` cada vez que o cronômetro é pausado manualmente durante uma etapa de foco.
   - **No Check-out da Sessão:** exibir 3 pílulas de 1 clique (sem obrigar digitação):
     - Qualidade do Foco: `[🔥 Profundo]` `[⚡ Normal]` `[💭 Distraído]`
     - Energia: `[🔋 Alta]` `[⚖️ Normal]` `[🪫 Cansado]`
   - **No Recomendador ([`src/application/recommend-study.js`](file:///c:/Users/vitor/Documents/Extrato/src/application/recommend-study.js)):** permitir que o estudante informe no início do estudo *"Como está sua energia agora?"*. Se selecionar `🪫 Cansado`, o recomendador filtra temporariamente tópicos de `difficulty === 'Difícil'` de teoria inédita e sugere revisão espaçada ou bateria curta de questões de manutenção.

4. **Estratégia de Testes:**
   - Testes unitários em `tests/unit/focus-energy-analytics.test.js` validando o agrupamento por turno no fuso local (`America/Sao_Paulo` e `UTC`), os limiares mínimos de amostra para não gerar conclusões precipitadas e o filtro de recomendação sob baixa energia.

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
