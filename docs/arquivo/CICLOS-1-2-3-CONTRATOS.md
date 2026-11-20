# Contratos dos Ciclos 1, 2 e 3 — Ficha Inteligente, Identidade Canônica e Materiais

Este documento registra os contratos técnicos implementados para os três ciclos evolutivos do Extrato de Estudos, preservando os motores existentes (`buildStudyAction`, `study-copilot-service`, `study-cycle-engine`, `quick-study-engine`, `learning-journal-engine` e `exam-intelligence`).

## Ciclo 1 — Próxima Ação e Ficha Inteligente do Tópico

* **Revalidação da Próxima Ação (`src/application/diagnostics/build-next-best-action.ts`):**
  * `buildNextBestAction` filtra recomendações pelo escopo ativo (`activeExamTags` / `examScopeKey`).
  * `revalidateNextBestAction` revalida no momento do clique se a ação pertence ao concurso ativo, não foi recusada (`recommendationFeedback`) e permanece elegível.
* **Ficha Inteligente do Tópico (`topic-intelligence`):**
  * Domínio: `src/domain/topic-intelligence/topic-intelligence-types.ts`
  * Aplicação (somente-leitura): `src/application/topic-intelligence/build-topic-intelligence.ts`
  * Seletor memoizado por revisão e escopo: `src/application/selectors/topic-intelligence-selector.ts`
  * UI e controlador Preact: `src/features/topic-intelligence/topic-intelligence-view-model.ts`, `topic-intelligence-controller.ts`, `topic-intelligence-view.tsx` e `mount-topic-intelligence-modal.tsx`.
  * Não possui fórmula própria de prioridade e apresenta estado neutro (`insufficientData: true`) quando não há evidência suficiente (`FIT-10`).

## Ciclo 2 — Identidade Canônica (Modelo Híbrido) e Painel do Edital

* **Identidade Canônica (`src/domain/exam-intelligence/topic-canonical-identity.ts` e `canonical-topics-catalog.ts`):**
  * Sugestões ranqueadas (`suggestCanonicalMatches`) sem fusão automática por semelhança textual.
  * Confirmação explícita (`confirmTopicEquivalence`) preservando `preservedOriginalName` e resolução de ID canônico (`resolveCanonicalTopicId`).
* **Painel Estratégico do Edital (`src/ui/views/EditalPriorityPanel.tsx`):**
  * Separa visualmente **Importância na prova (sinal externo)** e **Necessidade pessoal (sinal interno)**, exibindo `"Incidência não estimada"` quando faltam amostras e conectando à Ficha Inteligente e à prévia de replanejamento.
* **Schema v33:** `topicEquivalences: TopicEquivalenceRecord[]` adicionado ao `AppState` via `migrateV32toV33`.

## Ciclo 3 — Central de Materiais por URL e Modo Estudo Rápido

* **Central de Materiais (`src/domain/study-material.ts` e `src/ui/components/TopicMaterialsSection.tsx`):**
  * Suporte exclusivo a URLs externas sanitizadas (`http:` / `https:` via `sanitizeMaterialUrl`), rejeitando `javascript:`, `data:` e controles.
  * Não duplica a posição de leitura de `TopicBookmark`.
* **Modo Estudo Rápido (`src/ui/components/QuickStudyModal.tsx`):**
  * Wrapper Preact para `quick-study-engine.ts` (`15`, `30`, `45`, `60` min), iniciando sessão única pelo fluxo canônico.
* **Schema v34:** `studyMaterials: StudyMaterial[]` adicionado ao `AppState` via `migrateV33toV34`, com validação item-a-item em `src/storage/backup-validator.ts` (`validateTopicEquivalences` e `validateStudyMaterials`).
