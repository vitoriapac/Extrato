# Plano Unificado de Implementação e Evolução — StudyTrack

### _Da Persistência Local ao Hub Completo de Estudos de Alta Performance_

---

## 1. Resumo Executivo & Alinhamento Estratégico

Este documento formaliza o plano de evolução do **StudyTrack**, unificando as diretrizes de governança técnica (testes rigorosos, confiabilidade e explicabilidade analítica) com o **estado real e avançado do código-fonte**, integrando as especificações mapeadas em:

- [docs/O-QUE-FALTA-IMPLEMENTAR.md](file:///c:/Users/vitor/Documents/Extrato/docs/O-QUE-FALTA-IMPLEMENTAR.md)
- [docs/PLANO-PRIMEIRO-USO-GUIADO.md](file:///c:/Users/vitor/Documents/Extrato/docs/PLANO-PRIMEIRO-USO-GUIADO.md)
- [docs/DECISION-EXPERIENCE-CONTRACT.md](file:///c:/Users/vitor/Documents/Extrato/docs/DECISION-EXPERIENCE-CONTRACT.md)
- [docs/TEST-STRATEGY.md](file:///c:/Users/vitor/Documents/Extrato/docs/TEST-STRATEGY.md)
- [ARCHITECTURE.md](file:///c:/Users/vitor/Documents/Extrato/ARCHITECTURE.md)

### O que este plano ajusta em relação à proposta genérica anterior:

1. **Eliminação de 5 a 6 semanas de retrabalho:** O repositório já conta com inventário minucioso ([TEST-SUITE-INVENTORY.md](file:///c:/Users/vitor/Documents/Extrato/docs/TEST-SUITE-INVENTORY.md)), 790+ testes Node em fuso duplo (UTC e `America/Sao_Paulo`), 59 suítes E2E Playwright, migração total para TypeScript estrito (`strict: true`), sincronização WebDAV com criptografia de ponta a ponta (AES-GCM-256) e timer flutuante em Picture-in-Picture.
2. **Foco no valor real para o concurseiro:** Concentração imediata na redução da sobrecarga cognitiva diária (decisão rápida do que estudar), no poder preditivo sem efeitos colaterais em banco (_What-If Simulator_ e _Modo Reta Final_) e na transformação do app em um **Hub Completo de Estudos** (bookmarks de materiais, edital verticalizado e ciclo de estudos flexível).

---

## 2. Pilha Tecnológica e Diretrizes Inegociáveis de Engenharia

Conforme estabelecido nas regras de governança do repositório ([AGENTS.md](file:///c:/Users/vitor/Documents/Extrato/AGENTS.md)):

1. **Tipagem Estática Obrigatória:** Todo código novo de domínio (`src/domain/`) e aplicação (`src/application/`) deve ser escrito em **TypeScript (`.ts`)** e validado com `npm run check:types`.
2. **Interface Declarativa e Tokens:** Novas interfaces devem ser componentes **Preact 11 (`.tsx`)**, consumindo as primitivas compartilhadas (`src/ui/primitives/*.tsx`) e estilizadas via **Tailwind CSS v4** integrado a `styles/tokens.css`. É vedado o uso de `innerHTML` ou strings HTML interpoladas.
3. **Estratégia de Testes Proporcional:**
   - **Regras de negócio e algoritmos:** Testes unitários no Node rodando com hook nativo (`npm run test:fast`). Meta: < 120s.
   - **Jornadas centrais de UI:** Testes E2E dirigidos no Playwright para fluxos críticos, sem inflar a matriz browser desnecessariamente.
   - **Execuções completas (`npm run test:full`):** Reservadas para releases e mudanças estruturais de esquema/persistência.

---

## 3. Cronograma Executivo Macro (9 Semanas)

```mermaid
flowchart TD
    subgraph Fase1 ["Fase 1: Decisão Rápida, UX & Primeiro Uso (Semanas 1–2)"]
        F1A["Card de Próxima Ação (6 Perguntas)"] --> F1B["Bookmarks de Ponto de Parada (UI Preact)"]
        F1B --> F1C["Onboarding 2.0 & Missão do 1º Dia"]
    end

    subgraph Fase2 ["Fase 2: Inteligência Preditiva & Reta Final (Semanas 3–4)"]
        F2A["Simulador 'E se?' em Memória (What-If)"] --> F2B["Modo Reta Final (< 15 dias)"]
        F2B --> F2C["Detecção de Falsa Consolidação"]
    end

    subgraph Fase3 ["Fase 3: Hub Completo de Estudos & Flexibilidade (Semanas 5–7)"]
        F3A["Edital Verticalizado & Parser de PDF"] --> F3B["Ciclo de Estudos Rotativo vs Agenda"]
        F3B --> F3C["Análise Cronobiológica de Energia e Foco"]
    end

    subgraph Fase4 ["Fase 4: Caderno de Erros, A11y & Base SaaS (Semanas 8–9)"]
        F4A["Caderno de Erros Ativo & Flashcards"] --> F4B["Acessibilidade por Teclado (NVDA pendente)"]
        F4B --> F4C["Isolamento de Contratos de Storage / Nuvem"]
    end

    Fase1 --> Fase2 --> Fase3 --> Fase4
```

---

## 4. Detalhamento das Fases

### Fase 1: Decisão Rápida, UX do Painel & Primeiro Uso

_Duração estimada: 2 semanas | Prioridade: P0 (Retenção e Uso Diário)_

#### 1.1. Card de Próxima Ação com as 6 Perguntas Contratuais

- **Objetivo:** Eliminar a paralisia do estudante na tela inicial, apresentando uma recomendação cristalina baseada nos pesos do edital e nas lacunas reais de desempenho.
- **Contrato Visual:** Respeitar o [DECISION-EXPERIENCE-CONTRACT.md](file:///c:/Users/vitor/Documents/Extrato/docs/DECISION-EXPERIENCE-CONTRACT.md) e responder explicitamente às 6 perguntas:
  1. _O que devo estudar?_ (Disciplina e Tópico prioritário).
  2. _Por que devo estudar isso?_ (Racional: atraso, peso alto no edital, ou precisão abaixo da meta).
  3. _Quanto tempo devo reservar?_ (Duração sugerida conforme a disponibilidade de hoje).
  4. _Qual é a importância para a prova?_ (Peso relativo no edital).
  5. _Que evidência indica a necessidade?_ (Ex.: acerto de 54% nas últimas 30 questões).
  6. _O que devo fazer a seguir?_ (Ação imediata: teoria, revisão ou bateria de questões).
- **Arquivos Impactados:** `src/ui/dashboard/`, `src/domain/analytics/recommendations.ts`, `src/ui/primitives/Card.tsx`.

#### 1.2. Rastreador de Ponto de Parada (Bookmarks de Estudo em Preact)

- **Objetivo:** Integrar à interface o domínio já existente em [`src/domain/topic-bookmark.ts`](file:///c:/Users/vitor/Documents/Extrato/src/domain/topic-bookmark.ts), permitindo retomar leituras de PDF, videoaulas e lei seca exatamente do ponto em que parou.
- **Componentes a Implementar:**
  1. `src/ui/components/BookmarkBadge.tsx`: Exibir badge contextual no Card de Próxima Ação e no cabeçalho do timer (ex.: `📄 Pág. 42 de 110 (38%) · Continuar de onde parou`).
  2. **Check-out de Sessão:** Adicionar ao modal de conclusão do cronômetro campos opcionais rápidos: _Onde você parou?_ (Tipo: PDF/Vídeo/Lei, Posição atual e Total de páginas/unidades).
  3. **Edição Inline:** Permitir ajuste rápido do marcador direto na lista de tópicos em `src/ui/subjects/SubjectsTab.tsx`.

#### 1.3. Primeiro Uso Guiado & Missão do 1º Dia

- **Objetivo:** Concluir a implementação da Camada 1 e Camada 2 de [docs/PLANO-PRIMEIRO-USO-GUIADO.md](file:///c:/Users/vitor/Documents/Extrato/docs/PLANO-PRIMEIRO-USO-GUIADO.md).
- **Tarefas:**
  1. **Presets de 1 Clique no Wizard:** Pílulas de data pré-edital (3, 6 e 12 meses) e presets de rotina semanal (Leve: 2h/dia; Padrão: 4h/dia; Foco em Fim de Semana) para evitar digitação manual excessiva.
  2. **Missão do 1º Dia:** Widget reativo na aba Hoje orientando o novo usuário a realizar sua 1ª sessão no cronômetro e importar seu primeiro CSV de questões após a criação do plano.

#### Critérios de Aceite da Fase 1:

- [x] A tela inicial responde em < 3 segundos qual a próxima melhor ação do dia (`NextActionCard.tsx` com as 6 perguntas contratuais montado via Preact na Visão Geral).
- [x] O ponto de parada preenchido no encerramento de uma sessão reaparece automaticamente na próxima recomendação do mesmo tópico (integrado ao `NextActionCard` e na listagem de disciplinas via `BookmarkBadge.tsx` e `SubjectTopicRow.tsx`).
- [x] Novos usuários passam pelo wizard inicial em menos de 60 segundos usando os atalhos de rotina (`FirstStepsMission.tsx` e presets do wizard).
- [x] Todos os testes unitários (`npm run test:fast`) e suíte de onboarding (`tests/e2e/onboarding.spec.js`) passam 100% (incluindo testes de bookmark e execução diária).

---

### Fase 2: Inteligência Preditiva, Modo Reta Final & Explicabilidade

_Duração estimada: 2 semanas | Prioridade: P1 (Diferencial Analítico)_

#### 2.1. Simulador "E se?" (`what-if-simulator.ts`)

- **Objetivo:** Dar poder preditivo ao estudante sem poluir o histórico ou persistir alterações experimentais no banco de dados.
- **Implementação Técnica:**
  - Localização: `src/domain/forecasts/what-if-simulator.ts`.
  - Execução pura em memória clonando o estado via `structuredClone(appState)`.
  - Simulações dinâmicas:
    - _Acréscimo de minutos diários de estudo_.
    - _Realocação de horas para disciplinas de maior peso de edital_.
    - _Impacto projetado no Índice de Prontidão ([readiness-score.ts](file:///c:/Users/vitor/Documents/Extrato/src/domain/analytics/readiness-score.ts)) e na Projeção Calibrada ([calibrated-score-projection.ts](file:///c:/Users/vitor/Documents/Extrato/src/domain/forecasts/calibrated-score-projection.ts))_.
  - Modal Preact `src/ui/forecasts/WhatIfSimulatorModal.tsx` com sliders em tempo real e comparativo visual (Estado Atual vs. Estado Simulado).

#### 2.2. Modo Reta Final (`final-stretch-policy.ts`)

- **Objetivo:** Adaptar automaticamente a estratégia de preparação à medida que a prova se aproxima.
- **Regras de Domínio:**
  - Gatilho ativado quando a contagem regressiva da prova atingir **< 15 dias** (ou configurável).
  - 80%+ da capacidade semanal realocada automaticamente para simulados e questões de fixação.
  - Congelamento da abertura de novos tópicos teóricos densos ainda não iniciados.
  - Foco agressivo em lacunas de alta incidência na prova com acerto histórico < 70%.
  - Alerta visual no cabeçalho: `🚨 Modo Reta Final Ativado (Faltam X dias)`.

#### 2.3. Detecção de "Falsa Consolidação" (Ilusão de Competência)

- **Objetivo:** Identificar tópicos que atingem alto percentual de acerto (> 90%) logo após o estudo teórico, mas sofrem colapso de retenção em revisões espaçadas (> 14 dias).
- **Entrega:** Marcação diagnóstica de _"Domínio Volátil"_ no relatório analítico, sugerindo baterias cegas de questões sem consulta.

#### Critérios de Aceite da Fase 2:

- [x] Nenhuma alteração realizada dentro do modal do simulador _What-If_ é persistida em IndexedDB ou exportada no backup JSON (garantia de isolamento com `structuredClone` e verificação no teste unitário).
- [x] O gerador de cronograma inverte as proporções de teoria/questões ao cruzar o limiar de 15 dias da prova (85% em questões/revisões, congelamento de novos tópicos teóricos densos e boost de até 3.0x para lacunas críticas).
- [x] Testes unitários puros no Node validam o isolamento de mutação e a coerência matemática das projeções (`what-if-simulator.test.js`, `final-stretch-policy.test.js`, `volatile-mastery.test.js`, `what-if-modal-components.test.js` e E2E `what-if-and-final-stretch.spec.js`).

---

### Fase 3: Hub Completo de Estudos & Flexibilidade

_Duração estimada: 3 semanas | Prioridade: P1 (Profundidade de Uso)_

#### 3.1. Edital Verticalizado Interativo & Parser de PDF

- **Objetivo:** Substituir planilhas externas por uma visualização integrada do conteúdo programático com checklist de etapas e métricas em linha única.
- **Componentes:**
  1. **Contrato de Tipos:** Campo `stageChecklist: { theoryDone, summaryDone, lawOrNotesDone, questionsDone }` em `src/core/types.ts`.
  2. **Parser de Edital Bruto (`parseRawSyllabusText`):** Módulo em `src/application/subjects/structured-content-import.ts` capaz de processar texto copiado diretamente de editais em PDF (ex.: `"1. Atos administrativos. 1.1 Conceito e requisitos. 1.2 Revogação e anulação."`), gerando estrutura hierárquica com prévia de importação.
  3. **Interface Preact (`src/ui/views/VerticalizedSyllabusView.tsx`):** Tabela interativa com filtros de peso, taxa de domínio atual e ação de 1 clique `[▶ Estudar agora]`.

#### 3.2. Ciclo de Estudos Flexível (Modo Fila Rotativa vs. Modo Agenda)

- **Objetivo:** Atender concurseiros com jornadas imprevisíveis de trabalho, substituindo a agenda por dia fixo por uma fila contínua de blocos intercalados.
- **Implementação:**
  - `src/domain/planning/study-cycle-engine.ts`: Criação de blocos de 45 a 90 minutos intercalando disciplinas complementares.
  - Alternador em `GoalsPlanningTab.tsx`: `📅 Agenda por Dia da Semana` vs. `🔄 Ciclo Rotativo`.
  - O não cumprimento de um dia de estudo apenas pausa a fila, sem gerar avalanche de atrasos falsos na grade semanal.

#### 3.3. Análise Cronobiológica de Energia e Fadiga

- **Objetivo:** Identificar horários de pico cognitivo e prevenir esgotamento mental (_burnout_).
- **Implementação:**
  - Registro de 1 clique no encerramento da sessão: Foco (`[🔥 Profundo]`, `[⚡ Normal]`, `[💭 Distraído]`) e Energia (`[🔋 Alta]`, `[⚖️ Normal]`, `[🪫 Cansado]`).
  - Motor `src/domain/analytics/focus-energy-analytics.ts`: Correlação de precisão em questões por turno do dia (manhã, tarde, noite) com alerta no diagnóstico quando houver queda contínua de rendimento associada a cansaço.

#### Critérios de Aceite da Fase 3:

- [x] Colar texto bruto de edital gera matérias e tópicos estruturados sem erros de parsing (`src/application/subjects/raw-syllabus-parser.ts`, `tests/unit/raw-syllabus-parser.test.js`).
- [x] A fila rotativa de Ciclo intercalado preserva pesos e não gera acúmulo de atrasos falsos (`src/domain/planning/study-cycle-engine.ts`, `tests/unit/study-cycle-engine.test.js`).
- [x] Correlações de energia e turno exigem amostra mínima de 5 sessões antes de exibir diagnósticos ao usuário e alertam fadiga cognitiva (`src/domain/analytics/focus-energy-analytics.ts`, `tests/unit/focus-energy-analytics.test.js`).
- [x] Interface declarativa de Edital Verticalizado interativo com checklist de 4 etapas (Teoria, Resumo, Lei Seca, Questões) e botão alternador (`src/ui/views/VerticalizedSyllabusView.tsx`, `tests/e2e/verticalized-syllabus-and-cycle.spec.js`).

---

### Fase 4: Caderno de Erros, Acessibilidade Real & Base SaaS

_Duração estimada: 2 semanas | Prioridade: P2 (Maturidade, Inclusão e Escala)_

#### 4.1. Caderno de Erros Ativo & Flashcards de Bolso

- **Objetivo:** Transformar cada questão errada em oportunidade de fixação imediata.
- **Implementação:**
  - Extração de questões marcadas como incorretas em sessões ou no importador de CSV (Tec/QConcursos).
  - Interface compacta de cards com: _Enunciado resumido_, _Pegadinha da Banca_ e _Conceito Correto_.
  - Agendamento automático no motor de Revisão Espaçada até a fixação comprovada em nova bateria de questões.

#### 4.2. Listas Progressivas e Auditoria de Acessibilidade (NVDA / Leitores de Tela)

- **Objetivo:** Garantir usabilidade fluida e conformidade com leitores de tela reais conforme [docs/DECISION-EXPERIENCE-CLOSURE.md](file:///c:/Users/vitor/Documents/Extrato/docs/DECISION-EXPERIENCE-CLOSURE.md).
- **Tarefas:**
  - Padronizar listas extensas (histórico, revisões pendentes, tópicos atrasados) com limite de 5 itens e botão `Mostrar mais (+N)`.
  - Auditoria assistida com NVDA / VoiceOver garantindo que modais fechem com `Esc`, foquem o primeiro controle e anunciem status de timers e mensagens de alerta de forma clara via ARIA. **Status:** entregue apenas a verificação automatizada de teclado/Escape; a auditoria com leitor de tela real segue pendente.

#### 4.3. Isolamento da Camada de Armazenamento para Transição SaaS

- **Objetivo:** Preparar a base do StudyTrack para futura expansão multi-dispositivo sem reescrita de código, conforme [docs/PLANO-TRANSFORMACAO-SAAS.md](file:///c:/Users/vitor/Documents/Extrato/docs/PLANO-TRANSFORMACAO-SAAS.md).
- **Implementação:**
  - Padronizar os contratos de interface em `src/storage/` para permitir que o repositório local (IndexedDB + WebDAV) possa receber um conector de nuvem (API REST / Supabase / WebSocket) de forma modular.

#### Critérios de Aceite da Fase 4:

- [x] Flashcards de erro podem ser criados e revisados com repetição espaçada na visão do Caderno de Erros (`src/domain/notebook/error-notebook-engine.ts`, `src/ui/views/ErrorNotebookView.tsx`, `tests/unit/error-notebook-engine.test.js`).
- [ ] Integração dos flashcards vencidos à Agenda de Revisões e criação automática a partir de questões erradas — **pendente**, ver Fase C de [PLANO-MELHORIAS-POS-FASE4.md](PLANO-MELHORIAS-POS-FASE4.md).
- [ ] Auditoria manual com leitor de tela (NVDA/VoiceOver) — **não realizada**; ver Fase D do mesmo plano.
- [x] 100% dos fluxos essenciais são operáveis exclusivamente por teclado sem armadilhas de foco (_keyboard traps_) e com fechamento seguro via Escape (`tests/e2e/error-notebook-and-a11y.spec.js`, `tests/e2e/accessibility.spec.js`).
- [x] Camada de armazenamento e direitos de acesso SaaS padronizados modularmente, **como módulos preparatórios ainda sem consumidor na UI** (`src/storage/cloud-saas-provider.ts`, `src/domain/billing/entitlements.ts`, `tests/unit/cloud-saas-provider.test.js`, `tests/unit/entitlements.test.js`).
- [x] Homologação total do gate de qualidade com 927 testes unitários passando em < 30s e suíte E2E alinhada.

---

## 5. Matriz de Rastreabilidade e Governança de Testes

| Área Alterada                            | Tipo de Validação       | Comando de Execução                                  | Orçamento Máximo         |
| ---------------------------------------- | ----------------------- | ---------------------------------------------------- | ------------------------ |
| **Domínio / Algoritmos** (`src/domain/`) | Unitários puros em Node | `npm run test:fast`                                  | < 120 segundos           |
| **Tipagem Estática**                     | TypeScript Compiler     | `npm run check:types`                                | < 15 segundos            |
| **Jornadas de Interface**                | Playwright E2E Focado   | `npx playwright test tests/e2e/recent-flows.spec.js` | < 180 segundos           |
| **Regressão de Persistência**            | Suíte de Regressão      | `npm run test:regression`                            | < 420 segundos           |
| **Release / Fechamento de Fase**         | Gate Completo Full      | `npm run test:full`                                  | Monitorado (CI Sharding) |

---

## 6. Referências Técnicas do Projeto

- **Arquitetura Geral:** [ARCHITECTURE.md](file:///c:/Users/vitor/Documents/Extrato/ARCHITECTURE.md)
- **Estratégia e Política de Testes:** [docs/TEST-STRATEGY.md](file:///c:/Users/vitor/Documents/Extrato/docs/TEST-STRATEGY.md) e [AGENTS.md](file:///c:/Users/vitor/Documents/Extrato/AGENTS.md)
- **Inventário da Suíte de Testes:** [docs/TEST-SUITE-INVENTORY.md](file:///c:/Users/vitor/Documents/Extrato/docs/TEST-SUITE-INVENTORY.md)
- **Contratos de Decisão e Experiência:** [docs/DECISION-EXPERIENCE-CONTRACT.md](file:///c:/Users/vitor/Documents/Extrato/docs/DECISION-EXPERIENCE-CONTRACT.md)
- **Plano de Primeiro Uso Guiado:** [docs/PLANO-PRIMEIRO-USO-GUIADO.md](file:///c:/Users/vitor/Documents/Extrato/docs/PLANO-PRIMEIRO-USO-GUIADO.md)
- **Mapeamento de Pendências:** [docs/O-QUE-FALTA-IMPLEMENTAR.md](file:///c:/Users/vitor/Documents/Extrato/docs/O-QUE-FALTA-IMPLEMENTAR.md)
- **Visão de Transformação SaaS:** [docs/PLANO-TRANSFORMACAO-SAAS.md](file:///c:/Users/vitor/Documents/Extrato/docs/PLANO-TRANSFORMACAO-SAAS.md)
