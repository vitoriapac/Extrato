# Arquitetura

O aplicativo continua executando inteiramente no navegador e sem dependências externas de JavaScript.

## Visão geral da arquitetura

`src/app.ts` compõe estado, relógio, serviços e interface. As setas indicam dependências permitidas: a interface aciona a aplicação; regras de domínio não importam a interface nem acessam o estado global. Repositórios e providers isolam a persistência.

`application/adherence` reconcilia execução por período e escopo, calcula crédito e interpreta prioridades congeladas. A meta pessoal (`metas.aderenciaSemanal`, percentual de 50–100 ou `null`) é um contexto separado: não alimenta scores ou o cálculo da projeção. Backups antigos recebem o padrão 80; novos fechamentos capturam esse contexto sem reescrever os anteriores. A política analítica versionada mantém seu próprio limiar.

```mermaid
flowchart TD
    ROOT["Composition root: app.ts"] --> UI["UI: controllers, view-models e renderers"]
    ROOT --> APP["Application: casos de uso e orquestração"]
    ROOT --> STATE["State: schema e estado inicial"]
    UI --> APP
    APP --> DOMAIN["Domain: regras e cálculos puros"]
    APP --> REPO["Repositories: acesso às coleções"]
    REPO --> STORAGE["Storage providers"]
    STORAGE --> BROWSER["IndexedDB e armazenamento local"]
    ROOT --> CORE["Core: relógio, datas e utilidades"]
    APP --> CORE
    DOMAIN --> CORE
```

## Persistência e proteção dos dados

No modo real, o gerenciador lê as fontes disponíveis e seleciona o estado com `updatedAt` mais recente. Antes de adotá-lo, a aplicação migra e valida o schema; se o estado principal for inválido, tenta um snapshot automático íntegro. Ao salvar, mantém cópias nas fontes disponíveis. O backup automático rotativo guarda uma versão anterior, quando elegível, com checksum SHA-256 quando a API criptográfica está disponível. A exportação JSON é uma ação separada do usuário.

```mermaid
flowchart TD
    IDB["IndexedDB"] --> READ["Ler estado mais recente"]
    LOCAL["localStorage"] --> READ
    OPTIONAL["window.storage, se disponível"] --> READ
    READ --> VALID["Migrar e validar schema"]
    VALID -- Válido --> REAL["Estado real em memória"]
    VALID -- Inválido --> SNAP["Verificar snapshot automático"]
    SNAP -- Íntegro --> REAL
    SNAP -- Indisponível --> DEFAULT["Estado inicial e aviso"]
    REAL --> SAVE["Salvar pelas fontes disponíveis"]
    SAVE --> IDB
    SAVE --> LOCAL
    SAVE --> OPTIONAL
    REAL --> EXPORT["Exportação JSON solicitada pelo usuário"]
    SAVE --> PREVIOUS["Versão anterior, quando elegível"]
    PREVIOUS --> HASH["Backup rotativo e checksum SHA-256"]
    DEMO["Modo demonstração"] --> SESSION["sessionStorage isolado"]
    SESSION --> DEMOSTATE["Estado fictício separado"]
```

## Estrutura

- `index.html`: marcação e pontos de montagem da interface.
- `styles/tokens.css`: cores, temas e tokens visuais.
- `styles/tailwind.input.css` e `styles/tailwind.css`: estilos utilitários gerados sob demanda via Tailwind CSS v4, conectados aos tokens sem Preflight global.
- `src/ui/primitives/*.tsx`: catálogo de componentes base em Preact (`Button`, `Badge`, `Card`, `SectionHeader`, `ProgressBar`, `Dialog`, `EmptyState`, `MetricCard`, `Tabs`).
- `src/ui/primitives/a11y.ts`: utilitários de acessibilidade e gerenciamento de anúncios `aria-live` para leitores de tela em tempo real (cronômetro e cards).
- `src/ui/components/NextActionCard.tsx`: card de Próxima Ação com as 6 perguntas contratuais, microcopy guiada e ponto de parada.
- `src/ui/components/FirstStepsMission.tsx`: checklist de onboarding para o primeiro uso sem reload.
- `src/ui/components/SubjectTopicRow.tsx`: linha de tópico com bookmark contextual e ações rápidas.
- `src/ui/components/WhatIfSimulatorModal.tsx` e `src/ui/controllers/what-if-controller.ts`: modal e controlador de simulação de cenários em memória.
- `src/ui/components/FinalStretchBanner.tsx`: banner de urgência contextual do Modo Reta Final com atalho para o simulador.
- `src/ui/views/VerticalizedSyllabusView.tsx`: visão declarativa de edital verticalizado com checklist de 4 etapas de estudo, filtros e importação por texto colado.
- `src/ui/views/ErrorNotebookView.tsx`: visão declarativa do Caderno de Erros e Flashcards com repetição espaçada, pegadinha da banca e conceito correto.
- `src/ui/components/ErrorNotebookDueNotice.tsx`: componente Preact de aviso e contagem de flashcards pendentes com navegação direta para revisão na Agenda e Hoje.
- `src/ui/controllers/error-notebook-controller.ts`: controlador desacoplado para a visão do Caderno de Erros, gestão de rascunhos, criação e avisos de cartões pendentes.
- `src/ui/tabs/**/*.tsx`: componentes funcionais das abas em Preact (`SubjectTopicManager.tsx`, `QuestionsTable.tsx`, `SimulationsTable.tsx`, `ReviewsSchedule.tsx`, `CalendarView.tsx`, `WeeklyGoals.tsx`, `TodaySchedule.tsx`, `DashboardOverview.tsx`).
- `src/ui/components/presentation.ts` e `docs/UI-FOUNDATIONS.md`: renderização compartilhada de cabeçalhos, métricas e estados vazios, com o contrato de superfícies e espaçamento usado na migração gradual das telas.
- `styles/app.css`: layout e componentes.
- `src/theme-bootstrap.js`: aplica o tema antes da primeira pintura (executado diretamente pelo navegador via `<script>`).
- `src/pwa.js`: registro e ciclo de vida do Service Worker PWA (executado diretamente pelo navegador via `<script>`).
- `src/bootstrap/bootstrap-application.ts`: executa a inicialização com contexto explícito e contenção de falhas.
- `src/bootstrap/register-lifecycle.ts`: registra e permite desmontar eventos globais do ciclo de vida.
- `src/bootstrap.ts`: reexportação modular do bootstrap tipado.
- `src/application/create-app-context.ts`: registra provider, relógio, repositórios e gerador de IDs injetáveis.
- `src/application/demo/demo-mode.ts`: controla entrada, reinício e saída segura da demonstração.
- `src/state/schema.ts`: contrato do estado, versões, enums e chaves de armazenamento.
- `src/state/defaults.ts`: fábrica do estado inicial, sem compartilhar referências mutáveis.
- `src/state/strategic.ts`: normalização do plano de prova, importância/esforço dos tópicos, ponto de parada (`bookmark`) e versões dos algoritmos.
- `src/state/app-state-store.ts`: store de estado desacoplado, com controle de debounce, fila assíncrona sequencial, transações exclusivas e rotação de backups.
- `src/core/types.ts`: definições de tipos e interfaces centrais do projeto (`Topic`, `Subject`, `AppState`, `TopicBookmark`, etc.).
- `src/core/utils.ts`: utilidades puras e validações primitivas.
- `src/core/clock.ts`: relógio injetável para datas locais e instantes reproduzíveis.
- `src/core/date-utils.ts`, `src/core/format-date.ts` e `src/core/format-number.ts`: manipulação e formatação determinística de datas locais e números.
- `src/core/crypto-utils.ts`: derivação PBKDF2-SHA256 e criptografia autenticada AES-GCM 256 bits.
- `src/storage/repository.ts`: acesso a IndexedDB, `localStorage` e `window.storage`.
- `src/storage/storage-provider.ts`: contrato dos providers, incluindo carga, gravação, remoção, exportação e importação.
- `src/storage/indexed-db-provider.ts`: acesso isolado ao IndexedDB.
- `src/storage/local-storage-provider.ts`: fallback contido para armazenamento local.
- `src/storage/real-storage-provider.ts`: adaptação compatível da persistência real existente.
- `src/storage/demo-storage-provider.ts`: persistência temporária e isolada em `sessionStorage`.
- `src/storage/cloud-saas-provider.ts`: (preparatório, sem consumidor na UI) conector desacoplado para nuvem/SaaS com verificação de versão remota, health check e fallback local seguro.
- `src/storage/migration-service.ts`: execução ordenada e verificável das migrações de schema.
- `src/storage/backup-service.ts`: serialização, leitura segura e nomes dos arquivos de backup.
- `src/repositories/collection-repository.ts`: contrato uniforme de consulta e mutação das coleções do estado.
- `src/demo/demo-generator.ts`: cenário determinístico móvel de 140 dias para exploração do produto.
- `src/domain/reviews.ts`: regras puras de intervalos e revisões adaptativas.
- `src/domain/topic-bookmark.ts`: normalização, progresso e microcopy do ponto de parada por tópico.
- `src/ui/controllers/pip-timer-controller.ts`: controle do título da aba e da janela flutuante do cronômetro (Document Picture-in-Picture).
- `src/domain/analytics/evidence.ts`: contrato comum de amostra, período, confiança e fontes.
- `src/domain/analytics/score-evidence.ts`: separa disponibilidade de dados, força da evidência e incerteza heurística.
- `src/domain/analytics/priority-score.ts`: fórmula única de prioridade usada por recomendações e planejamento.
- `src/domain/analytics/topic-metrics.ts`: métricas puras de domínio e retenção por tópico.
- `src/domain/analytics/review-health.ts`: condição explicável da revisão a partir de recência, retenção, domínio, desempenho e impacto da prova.
- `src/domain/analytics/readiness-score.ts`: composição ponderada do índice e de sua confiança.
- `src/domain/analytics/coverage.ts`: cobertura de tópicos ativos.
- `src/domain/analytics/consistency.ts`: sequência de atividade e cumprimento das metas diárias.
- `src/domain/analytics/trends.ts`: comparação de janelas equivalentes de desempenho.
- `src/domain/analytics/study-metrics.ts`: consolidação pura de sessões, questões e simulados.
- `src/domain/analytics/heatmap.ts`: intensidade e níveis do mapa de atividade por indicador.
- `src/domain/analytics/multidimensional-radar.ts`: eixos, confiança e interpretação do radar comparativo.
- `src/domain/diagnostics/cognitive-profile.ts`: perfil de erros com amostra, período, cobertura e confiança.
- `src/domain/diagnostics/risk-score.ts`: risco composto com pesos redistribuídos, confiança e contribuições auditáveis.
- `src/domain/forecasts/performance-forecast.ts`: faixa atual, distância até a meta e projeção conservadora de 30 dias com requisitos mínimos de evidência.
- `src/domain/forecasts/what-if-simulator.ts`: simulação puramente em memória (`structuredCloneSafe`) para projetar variações de minutos/dia, foco e antecipação de prova.
- `src/domain/planning/final-stretch-policy.ts`: política do Modo Reta Final com rebalanceamento 85/15 entre questões/revisão e teoria.
- `src/domain/analytics/volatile-mastery.ts`: diagnóstico de ilusão de competência para tópicos com queda de retenção após 14 dias sem revisão.
- `src/application/subjects/raw-syllabus-parser.ts`: parser de edital bruto e texto de PDF (Cebraspe, FCC, FGV) com árvore estruturada e prévia.
- `src/domain/planning/study-cycle-engine.ts`: motor do ciclo de estudos com fila rotativa circular intercalada e avanço sem acúmulo de falsos atrasos.
- `src/domain/notebook/error-notebook-engine.ts`: motor puro de repetição espaçada (SM-2 adaptado) para flashcards de erro com pegadinha da banca e conceito correto (especificação e contratos em `docs/CADERNO-ERROS-SM2-CONTRATO.md`).
- `src/domain/billing/entitlements.ts`: (preparatório, sem consumidor na UI) resolução pura de direitos e limites por plano (`free`, `pro`, `mentor`) preparando a transição SaaS.
- `src/domain/analytics/focus-energy-analytics.ts`: análise cronobiológica por turnos (manhã, tarde, noite) e detecção de fadiga cognitiva.
- `src/application/build-executive-summary.ts`: modelo de apresentação do resumo executivo sem acesso ao DOM.
- `src/application/generate-diagnosis.ts`: classificação explicável de gargalos, oportunidades, riscos e foco semanal.
- `src/application/recommend-study.ts`: priorização normalizada e limitada pelo tempo disponível.
- `src/application/build-study-candidates.ts`: composição única dos candidatos, riscos, evidências e elegibilidade.
- `src/application/build-study-plan.ts`: proposta semanal até a prova, limitada por carga e disponibilidade.
- `src/application/replan-study.ts`: cálculo de déficit e proposta de redistribuição sem mutação automática do plano.
- `src/application/planning/distribute-study-plan.ts`: distribuição confirmável do plano semanal, materialização diária e desfazer protegido por execução.
- `src/domain/study-eligibility.ts`: sessões curtas, manutenção de tópicos concluídos e validação transitiva de pré-requisitos.
- `src/application/sessions/session-service.ts`: ciclo de vida das sessões e sincronização de questões, planejamento, histórico e recomendações.
- `src/application/records/record-service.ts`: operações normalizadas para calendário, questões, simulados e metas.
- `src/application/calendar/build-unified-reviews.ts`: normaliza itens do Calendário e da Agenda de Revisões para indicadores e telas compartilhadas.
- `src/application/subjects/subject-service.ts`: ciclo de vida de disciplinas e tópicos, incluindo arquivamento auditável.
- `src/repositories/subjects-repository.ts`: acesso à coleção e às entidades aninhadas de tópicos.
- `src/application/recommendations/outcome-service.ts`: linha de base, resultado e confiança das recomendações sem ajuste automático de pesos.
- `src/domain/recommendations/recommendation-outcome.ts`: comparação imutável entre os estados anterior e posterior, com deltas, confiança e estados de resultado.
- `src/application/subjects/exam-import-service.ts`: preview e importação atômica de estruturas de edital com merge idempotente.
- `src/domain/exams/exam-constants.ts`: tags, fontes e versão leve do catálogo de editais, sem carregar a lista completa de tópicos.
- `src/domain/exams/exam-preset-options.ts`: nomes dos editais usados nos primeiros passos da interface.
- `src/domain/exams/exam-catalog.ts` e `src/domain/exams/exam-presets.ts`: normalização, validação e estruturas completas de BB, Caixa e combinada.
- `src/domain/exams/exam-catalog-runtime.ts`: entrada do bundle sob demanda que expõe as estruturas completas ao navegador.
- `src/domain/analytics/recommendation-calibration.ts`: leitura agregada dos resultados reais sem ajuste automático de pesos.
- `src/domain/analytics/exam-mastery-matrix.ts`: matriz explicável de cobertura, domínio, retenção e lacunas por edital.
- `src/domain/recommendations/study-strategy.ts`: estratégia versionada e etapas executáveis pelo cronômetro existente.
- `src/ui/view-models/` e `src/ui/renderers/`: Questões, Agenda/Revisões, Calendário, calibração e cenários mantêm preparação de dados e HTML fora do composition root.
- `src/ui/navigation/tab-router.ts`: controle de roteamento de abas, sincronização de URL hash e atalhos de teclado.
- `src/ui/events/delegated-actions.ts`: análise declarativa de argumentos e resolução segura de eventos delegados.
- `src/ui/controllers/search-controller.ts`: busca global normalizada, comandos e acessibilidade por teclado.
- `src/ui/controllers/achievements-controller.ts`: orquestração do catálogo de conquistas, badges e progresso mensurável.
- `src/ui/controllers/navigation-controller.ts`: abas, menu móvel, atalhos numéricos, busca e fechamento por Escape.
- `src/ui/controllers/modal-controller.ts`: confirmações e prompts acessíveis com validação e restauração de foco.
- `src/ui/controllers/editable-collection-controller.ts`: estado de rascunho e ciclo de edição dos registros operacionais.
- `src/ui/controllers/preferences-controller.ts`: tema visual e persistência das preferências locais.
- `src/ui/controllers/backup-modal-controller.ts`: leitura, exportação e importação de arquivos de backup no navegador.
- `src/ui/controllers/delegated-events-controller.ts`: roteamento seguro das ações declarativas da interface sem funções globais.
- `src/ui/renderers/application-renderer.ts`: composição resiliente e seletiva das seções visuais.
- `src/application/goals/goal-service.ts`: regras de metas globais e disponibilidade diária.
- `src/application/subjects/structured-content-import.ts`: interpretação validada de JSON/CSV, diagnóstico agregado por linha e mesclagem transacional por nomes normalizados. O serviço distingue campos vindos da importação de ajustes manuais e preserva estes últimos.
- `src/features/structured-import/`: controlador, view-model e renderer do fluxo de prévia e confirmação. O estado pendente permanece somente na interface até a confirmação explícita.
- `src/application/analytics/build-overview-view-model.ts`: composição das métricas de tempo da Visão Geral sem dependência do DOM.
- `src/core/date-utils.ts`: interpretação, formatação e intervalos de datas civis locais usados pela aplicação e pelos view-models.
- `src/domain/analytics/topic-strategy.ts`: resolução única do impacto efetivo do tópico e validação de ciclos entre pré-requisitos.
- `src/features/topic-strategy/`: view-model, renderer e controller dos campos de impacto, esforço e pré-requisitos dos tópicos.
- `src/repositories/settings-repository.ts`: alterações controladas das metas e configurações persistentes.
- `src/ui/list-components.ts`: cabeçalhos agrupados e rodapés paginados reutilizáveis.
- `src/ui/filter-panel.ts`: contagem e rótulos puros dos filtros responsivos.
- `src/ui/session-history.ts`: filtragem e agrupamento puro do histórico de sessões.
- `src/reports/report-data.ts`: snapshot estratégico filtrado por período e independente da interface.
- `src/reports/weekly-focus-summary.ts`: recorte dos últimos sete dias do período, com o mesmo cálculo de foco do fechamento semanal.
- `src/reports/report-template.ts`: template seguro do relatório A4.
- `src/reports/print-report.ts`: coordenação isolada da impressão/“Salvar como PDF”.
- `src/ui/controllers/report-controller.ts`: eventos e composição do relatório, com estado e cálculos recebidos da raiz.
- `src/domain/help/`: motores puros de cálculo didático para a Central de Ajuda: `retention-simulator.ts` (Curva de Ebbinghaus e repetição espaçada), `evidence-simulator.ts` (Lei dos Grandes Números, 95% CI e margem de erro por amostra), `topic-metadata.ts` (tempo estimado de leitura e nível) e `help-feedback.ts` (gestão de avaliações de utilidade).
- `src/ui/help/`: componentes reativos em Preact 11 (`HelpTab.tsx`, `HelpTopicCard.tsx`, `EbbinghausSimulator.tsx`, `EvidenceConfidenceSimulator.tsx`, `HelpFeedbackWidget.tsx`), catálogo (`help-content.ts`), controlador (`help-controller.ts`) e runtime isolado sob demanda (`help-runtime.ts`).
- `src/help.bundle.js`: artefato compilado de code-splitting carregado sob demanda via `loadHelpBundle()` e cacheado pelo Service Worker.
- `docs/VISUAL-HIERARCHY.md`: mapa de decisão, análise e evidência para orientar mudanças visuais sem alterar os cálculos.
- `src/app.ts`: composition root, compatibilidade dos fluxos e registro explícito das dependências.
- `src/app.bundle.js`: artefato gerado para permitir abertura direta por `file://`.
- `service-worker.template.js`: fonte do service worker; `service-worker.js` é gerado com a versão do cache.
- `styles/print.css`: apresentação A4 do relatório exportado pela impressão do navegador.

## Fluxo de dependências

`app.ts` pode importar `state`, `core`, `storage` e `domain`. Os módulos inferiores não devem importar a interface nem acessar o estado global da aplicação.

Na jornada estratégica, os modelos de Desempenho leem registros do concurso ativo; o Diagnóstico consolida sinais por entidade e apresenta uma recomendação já elegível. A prévia usa o planejamento existente e permanece transitória até a confirmação. A sessão vinculada e o fechamento são persistidos pelos fluxos atuais. Snapshots históricos ficam congelados; o renderer não recalcula o passado.

## Build e verificações

Após alterar fontes, estilos ou assets, execute no PowerShell:

```powershell
npm install
npm run build
npm run check
```

`src/app.bundle.js`, `src/exam-catalog.bundle.js`, `src/report.bundle.js`, `src/help.bundle.js`, `index.html` e `service-worker.js` são artefatos gerados e não devem ser editados para alterar suas versões manualmente. O build calcula um fingerprint determinístico dos fontes e assets, aplica o mesmo valor às URLs versionadas e ao nome do cache PWA, e injeta essa versão no carregamento sob demanda dos módulos desacoplados (catálogo de editais e Central de Ajuda). A implantação no GitHub Pages executa `npm ci` e `npm run build` antes de preparar o site. `npm run check:bundle` verifica a reprodução dos bundles e dos arquivos versionados. O bundle principal não incorpora os dados completos do catálogo nem os guias da Central de Ajuda; ambos são carregados sob demanda via *code-splitting*.

## Persistência

IndexedDB é usado em conjunto com armazenamento local. Cada estado recebe `updatedAt`; o mais recente é carregado. Backups automáticos rotativos possuem checksum SHA-256. Antes de adotar dados locais ou importados, a aplicação migra e valida toda a estrutura. Abas abertas trocam versões por `BroadcastChannel`.

O schema 28 inclui `examBlueprint`, versões dos algoritmos, campos estratégicos dos tópicos, modo demonstrativo, vínculos auditáveis do planejamento, evidências e resultados das recomendações, estado individual da revisão adaptativa, normalização das sessões, snapshots do escopo de evidências históricas, histórico das decisões de redistribuição semanal, ciclo de vida das recomendações exibidas, coleções independentes de provas e questões históricas, `readinessSnapshots`, a meta configurável `metas.consistenciaSemanal` e snapshots de trajetória. Dados ausentes são mantidos em estado neutro (`null`) quando aplicável e backups anteriores continuam sendo migrados automaticamente pelas migrações sequenciais até a versão atual.

O schema 24 preserva por prova o total conhecido de questões, o total oficial opcional e as linhas ignoradas ainda sem classificação. A migração de provas antigas não inventa esses números: a cobertura permanece indisponível até nova importação. Provas declaradas completas mas com pendências ou total conhecido inferior ao declarado passam a parciais, evitando que lacunas de mapeamento pareçam ausência do tópico na prova.

`readinessSnapshots` guarda o índice, os fatores, a confiança, o concurso ativo e a versão do cálculo na data em que o fechamento semanal é salvo. Um novo fechamento não reescreve a prontidão já capturada para a mesma data e o mesmo escopo. A migração de v24 para v25 cria a coleção vazia, sem reconstruir índices passados com dados atuais. Novos registros usam a versão 2 do snapshot, com pesos, motivo, tipo de captura e identidade do evento. Fechamentos continuam únicos por data e escopo; eventos anteriores a mudanças estratégicas podem coexistir no mesmo dia sem sobrescrever o fechamento. A migração v25 → v26 acrescenta `projectionSnapshots`, inicialmente vazio. Faixas emitidas preservam valores, composição, escopo e entradas anteriores; apenas simulados em dias posteriores podem validar a faixa.

`src/application/projection/` compõe a calibração de simulados e a tendência de 30 dias em um estado de trajetória explicável. A mesma coleção `projectionSnapshots` guarda registros `kind: "achievement"` com entradas, escopo, versão e resultado congelados; a calibração retrospectiva ignora esse tipo. Desempenho mostra observações e tendência como trechos distintos e nunca apresenta nota projetada para o dia da prova ou probabilidade de aprovação. O contrato detalhado está em `docs/projecao-atingimento-contrato.md`; a auditoria de fontes, requisitos e limites está em [PROJECTION-EVIDENCE-CONTRACT.md](docs/PROJECTION-EVIDENCE-CONTRACT.md). `projection-evidence-policy.ts` centraliza os gates existentes de disponibilidade, e `build-projection-evidence-explanation.ts` apresenta a proveniência e os limites sem recalcular históricos.

A versão 2 da trajetória reutiliza candidatos da prioridade existente apenas para identificar lacunas medidas de alto impacto. A Inteligência da Prova e a Próxima Melhor Ação exibem esse contexto sem recalcular a ordem das recomendações. O Fechamento Semanal compara a trajetória atual com um snapshot anterior do mesmo escopo, meta, data de prova e versão. A interpretação temporal usa as fases do planejamento adaptativo. O Recovery reutiliza o motor adaptativo para oferecer uma redistribuição com capacidade preservada, sujeita a prévia, confirmação e revalidação.

`recovery-controller.ts` coordena prévia, aplicação e reversão. `application/recovery/recovery-invariants.ts` confere as alocações reais: carga semanal invariável, transferência exata entre duas disciplinas, mistura de atividades válida e preservação dos demais itens. A prévia captura também metas, configuração estratégica e data da prova; alterações exigem nova confirmação. `apply-recovery-plan.ts` prepara plano, auditoria e snapshot em uma cópia do estado. O serviço de confirmação existente recebe um repositório dessa cópia, nunca o estado publicado.

`recovery-state-committer.ts` grava o estado completo em uma operação serializada antes de publicá-lo em memória. A aplicação coordena essa operação com a fila existente de saves; saves anteriores terminam primeiro e saves novos aguardam a operação. Uma edição durante a gravação cancela o Recovery e tenta restaurar o estado atual no armazenamento. Falhas de gravação preservam o estado em memória e são informadas ao usuário. O sucesso segue o contrato do storage provider: ao menos um backend confirmou a gravação. Não há transação distribuída entre IndexedDB e os outros backends; falha na restauração é informada com orientação para exportar backup.

`revert-recovery-plan.ts` restaura as alocações em uma nova versão, somente se o plano aplicado ainda for o ativo e suas alocações corresponderem à decisão. Sessões, questões, planos diários e versões anteriores permanecem intactos. A decisão recebe `revertedAt`, `revertReason`, `originalDecisionId` e `reversionPlanId`, preservando a explicação original. A Timeline apresenta aplicação e reversão como eventos distintos. Os testes cobrem falhas em cada estágio, edição concorrente, confirmação duplicada, Demo e reversão após execução real.

O planejador adaptativo versão 5 usa identidades estáveis para desempatar disciplinas e itens. Aplicações e reversões protegem o mesmo par de disciplinas durante o cooldown; a data é interpretada no calendário local. A exceção por deterioração exige uma nova queda de pelo menos 12 pontos em relação ao domínio congelado na decisão anterior, com evidência forte. Histórico sem essa medida não autoriza a exceção. A reversão não libera uma reaplicação imediata.

`ui/performance/recovery-plan-renderer.ts` apresenta primeiro as duas alocações alteradas e o total preservado. As disciplinas preservadas ficam recolhidas, com cinco itens iniciais e Mostrar mais. Durações são exibidas em horas e minutos exatos; a confirmação lista apenas alterações. A Trajetória mantém evidência e ação como interpretação principal, sem repetir resultado e prazo em outros cards. Os testes visuais cobrem desktop, mobile, claro/escuro e cancelamento por teclado; cancelar não modifica o estado.

`build-readiness-evolution.ts` compara apenas registros do mesmo escopo, algoritmo, pesos e fatores disponíveis. A mudança de base interrompe a linha e recebe uma explicação. As contribuições dos fatores são ponderadas; a soma pode diferir ligeiramente do delta inteiro por arredondamento. Registros legados da versão 1 usam os pesos conhecidos do algoritmo 1.

A revisão manual de uma classificação registra método, confiança e instante de revisão na questão histórica. Questões pendentes são removidas da lista de pendências quando associadas a um tópico; se a cobertura originalmente declarada era completa e o total se tornou consistente, a prova volta a contar como completa. Reimportações preservam a classificação manual, sem tocar em `questoes`, sessões ou snapshots anteriores de recomendações.

`exams` e `examQuestions` guardam evidências de provas, separadas de `questoes`, que registra o desempenho pessoal. Cada prova tem instituição, nome, cargo, banca, ano, origem, referência, tags de escopo e cobertura (`unknown`, `partial` ou `complete`). A cobertura evita tratar uma prova incompleta como ausência de um tópico. Cada questão histórica aponta para uma prova e um tópico existentes e registra número, peso opcional, origem e método/confiança da classificação. A migração de v22 para v23 cria as coleções vazias; não infere questões históricas dos registros pessoais.

A incidência histórica usa apenas provas com cobertura `complete` dentro do concurso ativo. **Presença** é a quantidade de provas completas com o tópico dividida pela quantidade de provas completas; **participação** é a quantidade de questões classificadas no tópico dividida pelas questões classificadas nessas provas. Provas parciais entram somente na contagem de questões observadas. A recência informa quantas das três provas completas mais recentes contêm o tópico, sem alterar o score. Uma prova produz confiança `insufficient`; 2–3, `low`; 4–7, `moderate`; 8 ou mais, `high`, com redução quando a classificação das questões é fraca. Ausência de histórico mantém os percentuais nulos.

O perfil de impacto reúne o valor configurado e a evidência histórica. A origem do valor é `manual`, `estimated` (catálogo) ou `official` somente quando o peso da disciplina tem referência oficial. Incidência e peso observado em questões são `historical`, com confiança própria. Com pelo menos quatro provas completas e confiança moderada ou alta, presença e participação ajustam conservadoramente o `examImpact` estimado, limitando a variação a 15 pontos. Valores manuais e oficiais permanecem intactos. O motor de prioridade mantém os pesos e recebe apenas o impacto validado; a explicação da recomendação separa Prova, Você e Ação.

A auditoria de configuração calcula a estimativa histórica com a mesma fórmula usada na validação do impacto. Só classifica divergência quando a amostra histórica é utilizável; os limiares de 10 e 20 pontos servem à apresentação, sem modificar prioridade. O detalhe da matriz mostra separadamente impacto configurado, estimativa histórica e impacto efetivo. Quando o valor vem de peso oficial da disciplina, o indicador de 0 a 100 é identificado como _derivado_ desse peso, e nunca apresentado como pontos oficiais por questão.

`src/application/exam-intelligence/import-exam-json.ts` valida um JSON de prova e questões, gera prévia por correspondência normalizada e calcula um merge atômico. Cada disciplina ou tópico sem correspondência exige associação explícita, criação explícita de tópico ou descarte. Identidades estáveis para prova e número da questão impedem duplicatas na reimportação. A importação histórica usa coleções separadas do desempenho pessoal; quando o arquivo não contém tags, o concurso ativo é adotado como escopo. `src/features/exam-intelligence-import/` mantém o estado transitório, coleta decisões da prévia e controla arquivo, cancelamento e confirmação; `app.ts` apenas fornece o estado e persiste o resultado.

`src/application/exam-intelligence/build-exam-matrix.ts` monta a matriz histórica por tópico e prova, com filtros de concurso, banca, ano, cargo e disciplina, busca e ordenação. Somente provas completas aparecem como colunas e entram no denominador; a célula guarda a quantidade de questões e o peso somado, quando informado. O renderer alterna histórico e prioridades, oferece tabela em telas largas, cards no celular e detalhamento Prova × Você com incidência, confiança e indicadores pessoais. A cor do mapa não substitui a contagem textual.

Os limites compartilhados da inteligência histórica e da adaptação V4 ficam em `src/domain/exam-intelligence/config.ts`. Exam Intelligence V1, Priority Engine V5 e Adaptive Planning V4 têm versões independentes. Novos registros de recomendação e seus snapshots guardam a versão da prioridade e da inteligência da prova que produziram a decisão. A massa de validação e a tabela de decisões estão em `docs/EXAM-INTELLIGENCE-VALIDATION.md`.

Os significados transversais de alto impacto (70/100), domínio adequado (70/100), evidência suficiente (0,5) e mínimo histórico (4 provas) ficam em `src/domain/strategy/config.ts`. PDF, foco semanal, conquistas, alertas e planejamento usam o limite correspondente sem recalibrar o Priority Engine. Outros números iguais, como confiança da classificação de uma questão, mantêm regras próprias quando medem conceitos diferentes.

`src/reports/exam-report-summary.ts` seleciona os indicadores da prova e limita a três as lacunas no PDF. O PDF também resume os últimos sete dias do período selecionado, com minutos planejados e executados e o mesmo cálculo de foco usado na interface; ele não exporta a matriz histórica completa. `src/application/analytics/build-weekly-strategic-focus.ts` calcula a fração do tempo em tópicos de alto impacto e só classifica melhora/estabilidade quando existe resultado posterior medido no período. O fechamento semanal usa a versão 2.2.0 e o snapshot preserva o bloco calculado e o escopo do concurso ativo. `src/application/analytics/build-strategic-focus-history.ts` compara apenas períodos salvos, completos e sem sobreposição do mesmo escopo. `src/application/achievements/build-strategic-achievements.ts` avalia três conquistas por evidência de estudo, domínio ou provas completas, sem alterar o algoritmo de prioridade.

`recommendationHistory` guarda cada recomendação visível uma vez por identidade de apresentação, com estados pendente, executada, recusada ou expirada. O registro aponta para `recommendationFeedback` quando há decisão e para a sessão quando ela é salva. A migração cria registros apenas para decisões antigas conhecidas; ela não inventa recomendações pendentes anteriores. O resumo dos últimos 30 dias usa esse histórico e conta cada identidade uma vez.

O planejamento adaptativo registra somente decisões explícitas. A prévia calculada não entra no histórico. Transferências propostas ficam entre 15 e 40 minutos por semana, respeitando o orçamento semanal e a manutenção dos tópicos de origem. Outro ajuste entre as mesmas disciplinas aguarda 14 dias após uma aplicação, exceto quando a disciplina de destino apresenta queda relevante com evidência forte. Sem mudança justificada, a interface informa que o plano continua adequado.

No planejamento orientado à prova, os candidatos já trazem o `examImpact` validado pelo histórico. A adaptação V4 ordena destinos pela combinação de impacto e lacuna de domínio, exige necessidade mínima e evita retirar tempo de uma disciplina consolidada com impacto superior ao destino. Quando o impacto incorpora histórico confiável, a prévia e a justificativa citam presença, amostra e confiança. O cooldown de 14 dias protege o mesmo par de disciplinas em qualquer direção após um ajuste confirmado; uma nova importação não aplica transferências automaticamente. A exceção continua restrita à deterioração relevante com evidência forte.

## Contrato de ação de estudo

`buildStudyAction` em `src/application/recommendations/recommendation-action.ts` é a entrada única para transformar uma recomendação em `StudyAction`. Visão Geral, Hoje e Diagnóstico usam essa função e entregam `id` e `source` ao mesmo `recommendationController.execute`; Estudo Guiado recebe o contexto daí. Uma área nova não deve montar outra estrutura de ação.

| Campo                                  | Contrato                                                                                                              | Destino                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`                                   | Obrigatório; identifica o item acionável na lista atual.                                                              | Transitório; usado para localizar e revalidar a recomendação ao executar.                             |
| `source`                               | Obrigatório; `overview`, `today`, `diagnosis`, `planning` ou `review`.                                                | Registrado como `recommendationSource` na sessão e origem da apresentação no feedback.                |
| `subjectId`, `topicId`                 | Referências do alvo; podem ser `null` quando a recomendação não tem esse nível de detalhe.                            | Persistidos na sessão; servem de chave para a evidência recalculada.                                  |
| `activityType`                         | Obrigatório; derivado de atividade, pré-requisito ou tipo de estudo (`study`, `questions`, `review`, `prerequisite`). | Persistido como `recommendationType`; o tipo efetivamente executado também fica em `session.type`.    |
| `suggestedMinutes`, `priority`         | Números finitos ou `null`; são estimativas no momento da recomendação.                                                | Transitórios na ação; o cronômetro guarda a meta e a sessão guarda a duração real.                    |
| `reasons`, `evidence`                  | Lista de motivos e retrato analítico; métricas ausentes permanecem `null`.                                            | Usados na apresentação e no snapshot do feedback, sem substituir a evidência medida depois da sessão. |
| `recommendationId`, `algorithmVersion` | O primeiro é opcional até a apresentação receber um ID; a versão pode ser `null`.                                     | O ID vincula sessão e feedback; a versão permite interpretar o snapshot histórico.                    |

O objeto retornado é imutável. Ao clicar, o controlador revalida o candidato antes de iniciar a ação. A conclusão registra sessão e resultado, atualiza questões/revisões quando aplicável, mede a nova evidência e recalcula as recomendações. O próximo `StudyAction` é derivado do estado atualizado; `id` e `priority` anteriores não são reutilizados como verdade persistida.

O Índice de Prontidão usa cobertura (30%), domínio (25%), retenção (20%), consistência (15%) e simulados (10%). Pesos de fatores indisponíveis são redistribuídos entre as evidências existentes; a ausência reduz a confiança, mas não produz nota zero.

## Auditoria final da modularização

- A interface não publica controladores no escopo global; a única exceção é `window.__EXTRATO_TEST__`, criada apenas com `?test=1` para a suíte legada.
- Eventos declarativos aceitam somente handlers registrados e argumentos previamente permitidos.
- Renderizadores de alto nível isolam falhas por seção, evitando que um cartão interrompa toda a tela.
- Alterações de metas, disciplinas, sessões, revisões, planejamento e registros operacionais passam por serviços e repositórios.
- Acesso técnico a IndexedDB, `localStorage`, `sessionStorage`, arquivos e impressão está contido em providers ou controladores de infraestrutura.
- `app.bundle.js` continua sendo artefato gerado; a fonte de verdade permanece nos módulos de `src/`.

## Ciclo de estabilização

O Calendário mantém navegação e edição em `src/ui/calendar/calendar-controller.ts`; a composição da raiz injeta estado e serviços, enquanto `src/application/calendar/build-unified-reviews.ts` prepara os itens compartilhados e `src/ui/renderers/calendar-renderer.ts` gera a apresentação sem persistência.

O contrato de `src/reports/report-data.ts` resolve nomes e estados antes da impressão; `src/reports/report-template.ts` nunca usa IDs internos como texto visível. O fechamento semanal versionado recebe os dois períodos da camada de aplicação e devolve deltas tipados, diagnóstico e ação recomendada.

O ciclo analítico 3.2 é preparado por um view-model sem DOM e entregue a renderizadores independentes. O composition root conecta os controladores de Calendário e Questões, a fachada de importação do edital e o serviço de estudo guiado aos fluxos reais da interface; módulos de domínio continuam responsáveis pelos cálculos e pela persistência coordenada.

No primeiro uso, catálogo de edital, importação JSON/CSV e cadastro manual alimentam o mesmo modelo de conteúdo e a mesma proposta de planejamento. O onboarding suspende seu diálogo durante a importação, restaura a etapa de origem ao cancelar e apresenta a prévia somente quando há conteúdo; a confirmação exige atividades elegíveis. A importação estruturada reutiliza seu parser, prévia e serviço transacional existentes.

# Escopo analítico por concurso

`src/domain/exams/exam-scope.ts` é a única autoridade para elegibilidade de conteúdo. `resolveExamScope` separa tópicos elegíveis, pessoais, catalogados e excluídos. `src/domain/exams/exam-evidence-scope.ts` classifica registros históricos como `topic_scoped`, `subject_only` ou `unscoped` e impede que evidência sem tópico seja atribuída a um edital específico.

| Família                | Exemplos                                                            | Regra                                                                                         |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Estritamente filtrável | cobertura, domínio, retenção, gap, prioridade e revisões por tópico | usa tópicos elegíveis                                                                         |
| Parcialmente filtrável | tempo, sessões, questões e erros                                    | exige tópico elegível para métricas específicas; registros só da disciplina permanecem gerais |
| Global                 | tempo histórico total e quantidade patrimonial de sessões           | não muda ao trocar o concurso                                                                 |

Consumidores de planejamento, candidatos, matriz Edital × Domínio, prontidão, alertas, forecast, fechamento semanal e PDF recebem conteúdo ou evidência já resolvidos pelo contrato de escopo. O PDF apresenta separadamente valores atribuídos ao edital e registros sem tópico elegível.

Trocas em `activeExamTags` passam por `src/application/exams/exam-scope-transition.ts`, que invalida derivados persistidos. O importador mantém estado, ações e view-model em `src/features/exam-import/`; a camada de aplicação continua responsável pelo serviço e pela persistência.

O relógio separa o instante UTC da data civil local. A CI executa testes unitários e reprodução do bundle em `UTC` e `America/Sao_Paulo`; o E2E completo roda em UTC e um conjunto de jornadas sensíveis a datas roda em São Paulo. Esses jobs são paralelos. `npm run check:all` continua sendo o gate local completo.

## Prontidão dos testes E2E

Os helpers em `tests/e2e/helpers/app-state.js` centralizam quatro estados observáveis: aplicação pronta, importador pronto, estado persistido e renderização estável. Testes devem aguardar esses estados em vez de usar atrasos temporais. Elementos críticos do wizard usam `data-testid`; falhas retêm trace, screenshot e vídeo.

## Fluxo do Edital Inteligente

```text
DOM event → controller → action → state → view-model → renderer
```

`src/features/exam-import/exam-import-state.ts` é a autoridade da seleção. O controller apenas orquestra eventos; `src/features/exam-import/exam-import-view-model.ts` entrega `visibleSubjects`, contadores e estados `checked`/`indeterminate`; o renderer recebe esse contrato sem acessar o estado global.

## Transição de escopo

Toda mudança de concursos ativos passa por `setActiveExamTags()`. As tags são deduplicadas e ordenadas antes da comparação, e somente campos derivados do edital são invalidados. Sessões, questões, revisões e histórico nunca são apagados pela troca de escopo.

## Prioridade registrada no plano

Cada novo item confirmado registra prioritySnapshot, com score, fatores, razões, evidência, algoritmo e política de classificação. A política 1 classifica score ≥ 70 como prioritário; prioridades aceitas explicitamente no fechamento também são identificadas. Ausência de score não significa baixa prioridade. A distribuição diária copia o contexto do plano semanal e as sessões vinculadas recebem planPrioritySnapshot. Planos antigos permanecem sem classificação histórica, sem inferência a partir do diagnóstico atual.

## Explicações e consequências das decisões

### Execução diária compartilhada

O modelo em `application/daily-execution` consome planos e sessões existentes, o catálogo e a Próxima Melhor Ação. Crédito de atividade exige vínculo e compatibilidade de disciplina, tópico e tipo; tempo adicional permanece distinto. O card Hoje na Visão Geral e o resumo na aba Hoje usam esse modelo. `daily-execution-controller` revalida o contexto antes de iniciar pelo fluxo de cronômetro existente. Editar ou excluir sessões recalcula o crédito, sem reescrever registros históricos.

A leitura global do card não registra recomendações como apresentadas. O histórico continua pertencendo aos fluxos de apresentação e decisão existentes; restaurar um backup não fabrica decisões ao atualizar um card oculto. A data local é verificada ao retomar a janela e a cada minuto. O dia não é regenerado silenciosamente após Recovery; atividades da versão semanal anterior são sinalizadas para revisão. Consulte [Recovery e execução diária](docs/RECOVERY-EXECUTION.md).

`src/application/recommendations/build-recommendation-explanation.ts` fornece ação, razões, evidências e consequências operacionais. As apresentações guardam sua explicação original; a decisão guarda explanationSnapshot, evidenceSnapshot, suggestedAction e expectedImpact junto ao algoritmo e instante. Histórico de decisões e adaptações renderizam os valores capturados, sem consultar métricas atuais. Consequências descrevem cronômetro, revisão, vínculo ao plano e redistribuição confirmável; não são previsão de ganho de domínio, prontidão ou nota. Registros legados sem explicação detalhada não recebem uma reconstrução retroativa.

### Metas pessoais e sinais de preparação

`metas.consistenciaSemanal` guarda apenas o alvo de 1 a 7 dias, com padrão de 5. O resultado semanal é derivado das datas locais distintas das sessões de estudo com duração positiva, de segunda-feira até hoje. A mesma contagem de dias válidos alimenta Desempenho → Consistência no período selecionado; sessões múltiplas no mesmo dia contam uma vez. A migração 26 → 27 acrescenta o alvo sem reconstruir histórico.

A meta opcional `examBlueprint.subjects[].accuracyTarget` herda a meta global de acerto. É independente de `masteryTarget`, pesos e incidência. Os fechamentos e perfis de prioridade preservam a meta registrada. Não há migração retroativa desses indicadores.

`buildPreparationSignals` agrega questões e sessões do escopo ativo para apresentar possível platô e consolidação em risco. São sinais descritivos, sem redistribuição automática. O custo de oportunidade deriva da mesma proposta de planejamento adaptativo, preservando seus limites, cooldown e confirmação.

### Prévia integrada da estratégia por fase

A composição de fase e trajetória fica em `src/application/planning/build-phase-planning-preview.ts`. O motor existente continua definindo a divisão de atividades; projeção, meta, data e escopo servem à explicação e à revalidação da confirmação. As proporções existentes estão centralizadas em `src/domain/planning/phase-strategy-policy.ts`. O contrato e a validação estão em [PHASE-PLANNING-INTEGRATION.md](docs/PHASE-PLANNING-INTEGRATION.md).

## Demo da trajetória e fechamento orientado à decisão

Os perfis opcionais de `src/demo/demo-preparation-profiles.ts` produzem cenários fictícios determinísticos de recuperação, reta final e evidência limitada. O cenário público padrão e os contratos de persistência permanecem iguais. A validação e a jornada integrada estão em [DEMO-PROJECTION-VALIDATION.md](docs/DEMO-PROJECTION-VALIDATION.md).

A síntese semanal reutiliza ciclo de decisões, sustentabilidade e comparação histórica compatível. A ajuda contextual abre artigos existentes com categoria e foco corretos; consulte [WEEKLY-DECISION-AND-CONTEXTUAL-HELP.md](docs/WEEKLY-DECISION-AND-CONTEXTUAL-HELP.md).

## Experiência de decisão

Os papéis das superfícies, fontes de autoridade e contratos de evidência estão em [Contrato da experiência de decisão](docs/DECISION-EXPERIENCE-CONTRACT.md). A narrativa do produto não impõe uma cadeia linear de dependências entre diagnóstico e projeção.

## Importação de histórico de questões (CSV)

`src/domain/questions/question-import-normalizer.ts` normaliza arquivos CSV/TSV exportados de plataformas de questões (QConcursos, Tec Concursos ou modelo padrão), agrupando registros granulares ou agregados por data, disciplina e tópico. `src/application/questions/question-import-service.ts` gera uma prévia idempotente com detecção de duplicatas, identificação de novas disciplinas/tópicos e validação de categorias de erro, aplicando a importação de forma atômica após confirmação explícita em `src/features/question-import/`.

## Sincronização remota WebDAV com criptografia de ponta a ponta (E2EE)

`src/core/crypto-utils.ts` implementa derivação de chave PBKDF2-HMAC-SHA256 (600.000 iterações para novos envelopes, aceitando mínimo de 100.000 para envelopes v1) e cifragem autenticada AES-GCM de 256 bits usando exclusivamente a Web Crypto API nativa. `src/storage/remote-sync-provider.ts` encapsula a comunicação WebDAV (`PROPFIND`, `GET`, `PUT`) exigindo HTTPS para servidores remotos (permitindo HTTP apenas em `localhost`/`127.0.0.1`). `src/ui/controllers/remote-sync-controller.ts` coordena a configuração sem persistir senhas ou frases secretas no armazenamento local, verifica conflitos de versão remota antes de enviar e exige snapshot de segurança e validação de schema antes de restaurar dados baixados.

## Fatiamento arquitetural do orquestrador (`src/app.ts`)

O orquestrador principal `src/app.ts` foi decomposto em módulos desacoplados com responsabilidade única, eliminando acoplamentos diretos e facilitando a cobertura unitária isolada:

- `src/state/app-state-store.ts`: centraliza a persistência do estado, isolamento de `StorageProvider`, controle de debounce para gravações frequentes, fila assíncrona serializada para evitar condições de corrida em gravações concorrentes, transações atômicas com bloqueio (`runTransaction`), rotação e retenção de snapshots de backup em memória (`MAX_BACKUP_SNAPSHOTS = 10`), e disparo determinístico de eventos no canal global (`studytrack:state-saved`).
- `src/ui/navigation/tab-router.ts`: gerencia a navegação entre as 8 abas da aplicação, sincronização bidirecional do hash da URL (`#aba`), atalhos de teclado globais (`Ctrl+Shift+1..8` / `Cmd+Shift+1..8`), armadilha de foco acessível (trap focus para diálogos e modais), recolhimento automático de listas progressivas (`resetListLimits`) e hooks de ciclo de vida de ativação de abas (`onTabActivated`).
- `src/ui/events/delegated-actions.ts`: despachante declarativo de eventos de interface (`data-action`), substituindo parsers manuais inline por um analisador com cache LRU, sanitização de argumentos e tabela determinística de resolvedores de contexto (`registerActionArgResolver`).
- `src/ui/controllers/search-controller.ts`: motor desacoplado de indexação e busca global (`performGlobalSearch`), atalhos de teclado (`SEARCH_COMMANDS`), normalização NFD sem diacríticos para compatibilidade fonética/ortográfica e navegação por teclado no dropdown de resultados com anúncios ARIA.
- `src/ui/controllers/achievements-controller.ts`: catálogo determinístico de insígnias e conquistas (`BADGES`, `STRATEGIC_BADGES`, `CONSISTENCY_BADGE_IDS`), avaliação orientada a evidências de estudo e desacoplamento total da regra de concessão de insígnias em relação à árvore do DOM.

## Endurecimento de tipagem estrita (TypeScript Compiler Options)

O arquivo `tsconfig.json` opera com checagem estática contínua via `npm run check:types` (`tsc -p tsconfig.json --noEmit`), com um conjunto de regras estritas habilitadas para prevenir erros em tempo de compilação:

- `"noImplicitThis": true`: proíbe o uso implícito de `this` de tipo `any`.
- `"strictBindCallApply": true`: garante que chamadas `.bind()`, `.call()` e `.apply()` validem rigorosamente os tipos dos argumentos.
- `"strictFunctionTypes": true`: validação contravariante estrita para parâmetros de funções.
- `"alwaysStrict": true`: emite código em modo estrito ECMAScript (`"use strict"`).
- `"noFallthroughCasesInSwitch": true`: impede quedas silenciosas entre cláusulas `case` não vazias em estruturas `switch`.
- `"noImplicitOverride": true`: exige o modificador `override` explícito em subclasses que sobrescrevem métodos da superclasse.
- `"allowUnreachableCode": false`: proíbe código inalcançável após retornos, lançamentos ou quebras incondicionais.
- `"allowUnusedLabels": false`: acusa labels de controle não utilizados.

## Migração incremental para Preact (.tsx)

A interface do StudyTrack adota uma abordagem de migração progressiva e coexistência harmônica entre renderizadores imperativos e componentes funcionais declarativos em **Preact**:

- **Catálogo de Componentes Base (`src/ui/primitives/*.tsx`):**
  - `<Button />`: variantes primária, secundária (`ghost`), destrutiva (`danger`), tamanhos compacto/padrão e botões de ícone com foco acessível.
  - `<Badge />`: sinalizadores de status (`success`, `warning`, `danger`, `info`, `insufficient`).
  - `<Card />`: superfície modular de conteúdo com variantes `insight`, `attention` e `muted`.
  - `<SectionHeader />`: títulos estruturais com eyebrow e suporte a slots de ações contextuais.
  - `<ProgressBar />`: barra de progresso determinística com suporte nativo a ARIA (`valuenow`, `valuemin`, `valuemax`).
  - `<Dialog />`: diálogos modais acessíveis com trap focus, tecla `Esc` e restauração de foco no fechamento.
  - `<EmptyState />`: mensagens de ausência de dados explicativas e orientadas à próxima ação.
  - `<MetricCard />`: visualização destacada de KPIs com rótulo, valor principal e tendência semântica.
  - `<Tabs />`: barra de alternância de abas acessível com `role="tablist"` e navegação por teclado.

- **Componentes de Abas Funcionais (`src/ui/tabs/**/*.tsx`):**
  - **Onda 1:** Disciplinas e Tópicos (`SubjectTopicManager.tsx`), Histórico de Questões (`QuestionsTable.tsx`) e Registro de Simulados (`SimulationsTable.tsx`).
  - **Onda 2:** Agenda de Revisões Espaçadas (`ReviewsSchedule.tsx`), Visualização Mensal do Calendário (`CalendarView.tsx`) e Grade Operacional (`CalendarTable.tsx`).
  - **Onda 3:** Metas Semanais e Capacidade (`WeeklyGoals.tsx`), Execução de Hoje e Próxima Melhor Ação (`TodaySchedule.tsx`) e Visão Geral com Indicadores de Prontidão (`DashboardOverview.tsx`).

## Checagem estática de tipos e compilação (TypeScript + JSDoc)

`tsconfig.json` e `src/core/types.ts` definem contratos estáticos verificados por `npm run check:types` (`tsc -p tsconfig.json --noEmit`), integrado ao runner de gates (`scripts/run-test-gate.mjs`) e ao workflow de CI. O projeto suporta convivência incremental entre módulos `.ts` e `.js`: o `esbuild` (`scripts/build.mjs`) empacota ambos diretamente para o navegador, e o Node.js executa os testes unitários nativamente com suporte ao hook de resolução `scripts/ts-resolve-hook.mjs`. O roteiro completo da modernização está registrado na Seção 1 de [PLANOS-CONCLUIDOS.md](docs/PLANOS-CONCLUIDOS.md#1-plano-de-modernização-tecnológica-typescript-preact-e-tailwind-css).

## Roteiro de evolução arquitetural

A evolução contínua da arquitetura do StudyTrack está estruturada nos seguintes documentos centrais de engenharia e produto:

- **Histórico de Planos Concluídos:** [PLANOS-CONCLUIDOS.md](docs/PLANOS-CONCLUIDOS.md), consolidando a modernização tecnológica (TypeScript/Preact/Tailwind), primeiro uso guiado (Onboarding 2.0), as 4 fases do plano de evolução (Decisão, Bookmarks, Inteligência Preditiva, Caderno de Erros SM-2) e melhorias pós-Fase 4.
- **Mapeamento de Status e Pendências:** [O-QUE-FALTA-IMPLEMENTAR.md](docs/O-QUE-FALTA-IMPLEMENTAR.md), detalhando o status atual da aplicação local e os horizontes de evolução.
- **Próximas Evoluções (Backlog Ativo):** [PLANO-PROXIMAS-EVOLUCOES.md](docs/PLANO-PROXIMAS-EVOLUCOES.md), orientando platô de rendimento, custo de oportunidade, pós-simulado e fatiamento contínuo do `app.ts`.
- **Preparação SaaS / Cloud:** [PLANO-TRANSFORMACAO-SAAS.md](docs/PLANO-TRANSFORMACAO-SAAS.md), orientando o isolamento da camada de repositório para desacoplamento de storage local e suporte a nuvem híbrida.
