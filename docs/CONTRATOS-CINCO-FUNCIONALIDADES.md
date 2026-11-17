# Contratos e Inventário Arquitetural — Cinco Funcionalidades (F0 / PR-00–PR-11)

Este documento registra o inventário arquitetural (`reutilizar / estender / novo`) e as invariantes verificadas para a entrega incremental das cinco funcionalidades previstas no plano mestre: **Ciclo de Estudos 2.0**, **Modo Estudo Rápido**, **Diário de Aprendizagem**, **Fechamento Semanal Inteligente** e **Copiloto de Estudos Guiado**.

---

## 1. Matriz de Contratos e Decisões Arquiteturais (F0)

| Módulo Existente | Classificação | Contrato e Responsabilidade Mantida |
|---|---|---|
| [`src/core/types.ts`](../src/core/types.ts) | Estender | Preserva `AppState`, `StudySession`, `ActiveTimerState`; adiciona `StudySessionOrigin`, `LearningJournalEntry` e campos opcionais compatíveis (`origin`, `cycleId`, `cycleVersion`, `cycleBlockId`, `learningJournal`, `studyCycle`). |
| [`src/domain/sessions/study-session.ts`](../src/domain/sessions/study-session.ts) | Estender | Mantém `normalizeStudySession` e normaliza `origin` (`regular \| cycle \| quick \| copilot`) sem criar coleções separadas de sessão. |
| [`src/application/sessions/session-service.ts`](../src/application/sessions/session-service.ts) | Estender | Garante idempotência em `complete()` por `sessionId` (`findById`) assegurando `1 sessão = 1 crédito`. |
| [`src/application/sessions/timer-coordinator.ts`](../src/application/sessions/timer-coordinator.ts) & [`src/ui/controllers/study-timer-runtime-controller.ts`](../src/ui/controllers/study-timer-runtime-controller.ts) | Estender | Cronômetro único para todas as origens; propaga `sessionOrigin`/`cycleBlockId` e dispara avanço/saldo parcial idempotente do ciclo ao salvar sessão. |
| [`src/application/recommendations/recommendation-action.ts`](../src/application/recommendations/recommendation-action.ts) & [`src/application/diagnostics/build-next-best-action.ts`](../src/application/diagnostics/build-next-best-action.ts) | Reutilizar | Produtor único da Próxima Melhor Ação compartilhado entre Visão Geral, Hoje, Estudo Rápido e Copiloto. |
| [`src/domain/planning/study-cycle-engine.ts`](../src/domain/planning/study-cycle-engine.ts) | Estender | Preserva `buildStudyCycleQueue`, `getCurrentCycleBlock`, `peekUpcomingCycleBlocks` e `advanceStudyCycleQueue`; adiciona validação `15–120 min`, modos `manual \| balanced \| adaptive`, versionamento, pausa sem atrasos, conclusão parcial/total idempotente, salto com razão, resumo da volta (`completed` × `skipped`) e explicação `explainCycleVsPriority`. |
| [`src/domain/recovery/recovery-mission-engine.ts`](../src/domain/recovery/recovery-mission-engine.ts) | Reutilizar | Reutilizado no Modo Estudo Rápido (`RAP-07`) para unificar aquecimento de `15 min` e resgate de revisões vencidas. |
| [`src/domain/quick-study/quick-study-engine.ts`](../src/domain/quick-study/quick-study-engine.ts) | Novo | Seleciona atividade compatível com `10–180 min` sem mutar plano ou ciclo; fallback explícito de estudo livre (`RAP-05`). |
| [`src/domain/journal/learning-journal-engine.ts`](../src/domain/journal/learning-journal-engine.ts) | Novo | Anotações opcionais pós-sessão ou avulsas com sanitização de texto contra scripts/HTML, snapshots de nomes contra exclusão, filtros locais e proposta de revisão com confirmação (`DIA-01..DIA-08`). |
| [`src/domain/analytics/weekly-close.ts`](../src/domain/analytics/weekly-close.ts), [`src/application/performance/build-weekly-performance-brief.ts`](../src/application/performance/build-weekly-performance-brief.ts) & [`src/application/analytics/weekly-close-snapshot.ts`](../src/application/analytics/weekly-close-snapshot.ts) | Reutilizar | Motores canônicos de fechamento versionado, resumo móvel de 7 dias e persistência imutável de snapshots. |
| [`src/application/weekly-closing/weekly-closing-ritual.ts`](../src/application/weekly-closing/weekly-closing-ritual.ts) | Novo | Ritual sobre janela civil local (segunda a domingo) distinguindo prévia parcial de fechamento encerrado, com no máximo 2 observações positivas/atenção + 1 melhoria acionável e finalização idempotente (`SEM-01..SEM-09`). |
| [`src/application/copilot/study-copilot-service.ts`](../src/application/copilot/study-copilot-service.ts) | Novo | Copiloto guiado somente-leitura (7 perguntas estruturadas sem IA externa ou chat livre) com revalidação no clique (`COP-01..COP-10`). |
| [`src/state/state-boundaries.ts`](../src/state/state-boundaries.ts) & [`src/storage/backup-validator.ts`](../src/storage/backup-validator.ts) | Estender | Inclui `learningJournal` em `PERSISTENT_COLLECTIONS` e `studyCycle` em `PERSISTENT_OBJECTS`, mantendo compatibilidade retroativa com backups legados sem esses campos (`schemaVersion = 31`). |
| [`src/ui/components/TodayStudyAssistantBar.tsx`](../src/ui/components/TodayStudyAssistantBar.tsx) & [`src/ui/tabs/today/today-tab-controller.ts`](../src/ui/tabs/today/today-tab-controller.ts) | Novo / Estender | Barra compacta na aba **Hoje** (sem inflar a Visão Geral nem duplicar painéis em Desempenho) integrando Ciclo 2.0, Estudo Rápido, Orientação guiada, Diário e Fechamento semanal. |

---

## 2. Invariantes Protegidas

1. **Uma sessão canônica = um crédito (`1:1`):** Cronômetro cria um registro único em `studySessions`; `origin` (`regular | cycle | quick | copilot`) é apenas metadado informativo. Chamadas repetidas ao mesmo `sessionId` retornam o registro existente tanto em `sessionService.complete` quanto em `recordStudyCycleBlockExecution`.
2. **Nenhuma mutação involuntária:** Prévias do Ciclo 2.0, propostas do Modo Estudo Rápido, leitura do Copiloto e prévia da semana parcial no Fechamento Semanal nunca alteram `studyPlans`, `dailyPlans`, `studyCycle` ou snapshots persistidos.
3. **Datas civis locais e snapshots imutáveis:** Cálculos de semana civil usam `parseLocalDate`, `formatLocalDate` e `addLocalDays` (`src/core/date-utils.ts`), impedindo comparação de janela parcial em andamento com semana inteira concluída.
4. **Diário sem penalidade algorítmica:** Etiquetas, ratings de dificuldade/energia e notas do `learningJournal` jamais alteram `mastery`, `retention` ou prioridades automáticas; a criação de tarefa de revisão a partir de dúvida exige confirmação explícita do usuário.
5. **Reversibilidade e rollback seguro:** As coleções adicionadas (`learningJournal`, `studyCycle`) são aditivas e opcionais na validação de backup; ocultar a interface da barra auxiliar preserva integralmente sessões, revisões e planos históricos.
