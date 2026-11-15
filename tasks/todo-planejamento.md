# Tarefas: aba Planejamento coerente, visual e para dois perfis

Contexto: [plan-planejamento.md](plan-planejamento.md), [analise-planejamento-enxugar.md](analise-planejamento-enxugar.md) e a crítica de 14/11 em `.impeccable/critique/2026-11-14T08-26-09Z__index-html-planejamento.md`.

Regras para quem implementa:
- Antes de ler código, rodar `graphify query "<pergunta>"`; depois de editar, `graphify update .` (CLAUDE.md).
- Não editar `src/app.bundle.js`, `src/help.bundle.js` nem `service-worker.js` à mão; eles saem de `npm run build`.
- Adicionar ao commit só os arquivos da tarefa; outra sessão trabalha no plano da Desempenho.
- Tarefas visuais: carregar `/impeccable` (craft-floor) e a skill `dataviz` antes de editar UI.

Verificação usada abaixo:
- Unit: `npm test` (ou o arquivo citado)
- Tipos: `npm run check:types`
- Build: `npm run build`
- E2E: `npx playwright test <spec> --trace off`
- Detector: `impeccable detect --json index.html src/ui/tabs/goals`
- Demo: carregar a demonstração e abrir `#planejamento/<subaba>` em 1440 e 375 px

---

## Fase 0: Defeitos e investigação

### Tarefa 1: Meta global de questões chega ao editor por disciplina
**Descrição:** O editor lê `state.metas?.questoesPorSemana`, que não existe; o campo é `questoesSemanal`. Por isso Metas por disciplina afirma "sem meta global de questões" com 220 configuradas. Corrigir a leitura, mostrar global e soma lado a lado, avisar quando não fecham e rever os padrões por disciplina da demo e do perfil novo para a soma fechar com a global. Quando a soma não fecha, o aviso oferece "Repartir a meta global entre as disciplinas": calcula a repartição proporcional às metas atuais (método do maior resto: o arredondamento nunca faz uma meta subir quando a soma desce), mostra a prévia e só grava depois da confirmação, com Desfazer.

**Aceite:**
- [x] Na demo, a legenda mostra "Meta global: 80% de acerto · 220 questões/semana" e a soma por disciplina
- [x] Soma ≠ global gera aviso âmbar com a diferença e a ação de repartir; nada é reescrito sem confirmação
- [x] A repartição proporcional fecha exatamente na meta global e tem Desfazer
- [x] Padrões da demo somam a meta global (220). Perfil novo não tem metas por disciplina, então não há soma a fechar

**Verificação:**
- [x] Unit: `tests/unit/subject-target-editor-controller.test.js` com caso global = 220 e soma ≠ global
- [x] Unit: `tests/unit/split-question-goal.test.js` (soma exata, maior resto, nenhuma meta sobe ao reduzir, disciplina com meta 0 fica de fora) e soma da demo em `demo-coherence.test.js`
- [x] E2E: `tests/e2e/question-goal-split.spec.js` (aviso → prévia → cancelar → confirmar → Desfazer) e `goals-groups.spec.js`
- [x] Demo: `#planejamento/metas` mostra 220

**Feito em 14/11/2026.** Sem commit. Fora do escopo, registrado: o texto do aviso de Desfazer ainda diz "Exclusão desfeita." (é o `runUndoable` compartilhado); repartir quando não há nenhuma meta por disciplina (soma 0) não é oferecido.

**Dependências:** nenhuma

**Arquivos:** `src/ui/tabs/goals/subject-target-editor-controller.ts`, `src/ui/renderers/subject-target-editor-renderer.tsx`, `src/application/goals/split-question-goal.ts` (novo), `src/demo/demo-generator.ts`, `styles/app.css`, `tests/unit/subject-target-editor-controller.test.js`, `tests/unit/split-question-goal.test.js`, `tests/unit/demo-coherence.test.js`, `tests/e2e/question-goal-split.spec.js`

**Tamanho:** M

### Tarefa 2: Investigar o "Distribuir nos próximos 7 dias"
**Descrição:** Na demo, com plano de 12h e 2h por dia útil, a prévia propõe 5 dias (16 a 20/11), 2h20 no total e "12h10 sem espaço". Descobrir a causa em `calculateDailyPlanPreview` (`study-plan-builder-controller.ts:405`) e em `daily-plan-service.ts`: capacidade de hoje já consumida, filtro de tópicos elegíveis, revisões de 25 min, reserva de 10% ou defeito. Classificar como dado da demo, regra de negócio ou defeito. Se for defeito, corrigir com teste. Se for regra, a prévia explica em uma frase o que não coube e oferece "Ajustar disponibilidade".

**Aceite:**
- [x] Causa registrada em `tasks/investigacao-distribuir.md` com evidência (valores de entrada e saída)
- [x] Defeito: não havia defeito de cálculo; a reprodução bate com a tela (140 min, 730 sem espaço), então a regra é coberta por teste
- [x] Regra: a prévia diz por que não coube e oferece o próximo passo

**Verificação:**
- [x] Unit: `tests/unit/daily-plan-distribution.test.js` e `tests/unit/study-plan-builder-controller.test.js`
- [x] E2E: `planning.spec.js` (7 existentes + 1 novo) e `planning-subtabs.spec.js`
- [x] Demo: prévia mostra "Cabem 2h20 dos 14h30. A disponibilidade dos 7 dias soma 12h; 9h20 já estão agendados e 1h12 ficam de reserva."

**Dependências:** nenhuma

**Arquivos:** `src/ui/tabs/goals/study-plan-builder-controller.ts`, `src/application/planning/distribute-study-plan.ts`, `src/ui/navigation/delegated-actions-registry.ts`, `tests/unit/daily-plan-distribution.test.js`, `tests/unit/study-plan-builder-controller.test.js`, `tests/e2e/planning.spec.js`, `tasks/investigacao-distribuir.md`

**Tamanho:** M

**Feito em 14/11/2026, sem commit.** Três decisões sobre o cálculo e a demo estão no relatório e aguardam você; a das revisões e da reserva de 10% é a que mais pesa.

### Tarefa 3: Corrigir a legenda invertida em "Distribuição entre disciplinas"
**Descrição:** O cabeçalho diz Planejado | Realizado, mas o valor sai como realizado / planejado ("Língua Portuguesa 2h 12m / 45m", com 45m planejado no tooltip). Alinhar valor, legenda e barras.

**Aceite:**
- [x] Ordem do texto igual à da legenda e à das barras
- [x] Teste falha antes da correção (falhou, e passou depois)

**Verificação:**
- [x] Unit: `tests/unit/planning-visual-charts.test.js`
- [x] E2E: `planning.spec.js`, na demo, confere que cada linha traz "Planejado X / realizado Y" igual aos títulos das barras (sem depender da data da demo)

**Dependências:** nenhuma

**Arquivos:** `src/ui/primitives/charts/GroupedBarChart.tsx` (o texto vinha do gráfico, não do renderizador de execução), `tests/unit/planning-visual-charts.test.js`, `tests/e2e/planning.spec.js`

**Tamanho:** XS

**Feito em 14/11/2026, sem commit.** Cada valor ganhou texto para leitor de tela ("Planejado 45m, realizado 2h 12m"). O formato da duração (`2h 12m`) continua o do gráfico; a unificação é a Tarefa 7.

### Checkpoint 0: Defeitos
- [x] `npm test` (1.671), tipos e build limpos em 14/11
- [x] Relatório da T2 revisado com você antes da Fase 1 (decisões aceitas em 14/11: Tarefa 7b e demo na Tarefa 4)

---

## Fase 1: Números coerentes

### Tarefa 4: Resumo da semana com os nomes fixos, estudado em destaque e demo vinculada ao plano
**Descrição:** Os nomes das três medidas já estão fixados no DESIGN.md (Conciliação): "Capacidade da semana", "Com tarefa marcada" e "Estudado até hoje". Esta tarefa não cria termo novo (o plano dizia "Agendado"); ela faz o Resumo cumpri-los, põe o estudado como leitura principal e tira da demo a causa do "sem espaço" da Tarefa 2. `buildWeekReconciliation` já é a fonte do Resumo; Fechamento e Histórico passam a usá-la nas Tarefas 5 e 19b.

**Aceite:**
- [x] Nenhum texto do Resumo usa "planejado" sem qualificador (descrição do bloco e aviso de excesso trocados por "com tarefa marcada")
- [x] "Estudado até hoje" é o valor principal do extrato: total em Fraunces 24px, no peso do "72%" que vem logo abaixo
- [x] Capacidade tem a dica "Soma da disponibilidade dos 7 dias", como as outras linhas têm a sua. Em vez do "?" do modo Essencial: o Resumo é desenhado depois da carga, onde o "?" não é aplicado, e o "?" quebraria a linha de razão
- [x] Demo: os 8 planos diários futuros vêm do plano semanal (`studyPlanId`, `studyPlanItemId`). Semana e conciliação idênticas (810 min com tarefa marcada, 623 estudados, 72%); o "Distribuir" da demo passa de 586 min sem espaço para 0, medido sem revisões na agenda

**Verificação:**
- [x] Unit: `week-reconciliation-summary.test.js` (dica da Capacidade, uma só linha de total, vocabulário do aviso) e `demo-coherence.test.js` (agenda nasce do plano; distribuição reconhece 16 vínculos)
- [x] E2E: `planning.spec.js`, `question-goal-split.spec.js`, `weekly-adherence.spec.js`, `planning-sustainability.spec.js` passam; conferido na tela, tema escuro, 1440 e 375 px sem estouro
- [ ] `adherence.spec.js` 430px claro falha (imagem 958 contra 957 px de altura, em Desempenho). Falha igual com a demo original e sem o meu CSS, então não vem desta tarefa; o snapshot é de 860d0d6, da sessão da Desempenho

**Dependências:** Checkpoint 0

**Arquivos:** `src/ui/tabs/goals/WeekReconciliationSummary.tsx`, `src/ui/renderers/plan-execution-renderer.ts`, `index.html`, `styles/app.css`, `src/demo/demo-builders/planning.ts`, `tests/unit/week-reconciliation-summary.test.js`, `tests/unit/demo-coherence.test.js`

**Tamanho:** M

**Feito em 14/11/2026, sem commit.** Passa para a Tarefa 5: "PLANEJADO / REALIZADO" do Fechamento e "planejados" do Histórico ainda usam outros nomes e recortes.

### Tarefa 5: "A semana" do Fechamento usa a mesma fonte, com o estudado em destaque
**Descrição:** Trocar "1h20 PLANEJADO · 10h23 REALIZADO · 0% ADERÊNCIA AO PLANO" pelas mesmas linhas do Resumo (via `buildWeekReconciliation`), com o estudado em Fraunces e a aderência como segunda leitura. Tirar da dobra a frase "estudar fora do plano não é perder tempo de estudo". Retratos já salvos mantêm o valor congelado; só o rótulo de apresentação muda.

**Aceite:**
- [ ] Mesmos valores e rótulos no Resumo e no Fechamento para a mesma semana
- [ ] Com estudo e sem vínculo, a primeira linha explica o 0% e oferece agendar o restante do plano
- [ ] Retratos salvos não são recalculados

**Verificação:**
- [ ] Unit: `tests/unit/weekly-close-modal-controller.test.js`, `tests/unit/weekly-close-snapshot.test.js`
- [ ] E2E: `planning-sustainability.spec.js`

**Dependências:** T4

**Arquivos:** `src/features/weekly-close/weekly-close-modal-controller.ts`, `src/ui/tabs/goals/WeeklyCloseKpis.tsx`, testes

**Tamanho:** M

**Feito em 14/11/2026, sem commit.** O Fechamento usa `buildPlanExecution` + `buildWeekReconciliationFromExecution` (a mesma função do Resumo); sem a conciliação (retrato antigo), os três números ficam com os nomes novos. A aderência virou segunda leitura (linha à direita, Fraunces 18px), com corte "até DD/MM" abaixo. Com estudo e 0% de crédito, a primeira nota explica ("estudar fora do plano não é perder tempo de estudo") e oferece "Marcar o restante do plano" (`openWeeklyAdherencePlanning()`). Retratos salvos não são recalculados (só apresentação). Passa para a Tarefa 6: "prioritárias" do Fechamento (`weekly-adherence-renderer`) ainda usa minutos crus e o excesso aparece em dois formatos.

### Tarefa 6: Tempo prioritário e excesso com um valor e um formato
**Descrição:** A Semana diz "0h00 de 1h30 prioritárias" e o Fechamento "0 de 45 min prioritários". O excesso aparece como "3,9×" e como "778,8%". Descobrir por que os recortes diferem, escolher um recorte por rótulo e um formato de excesso (recomendo "Estudado 3,9× o agendado").

**Aceite:**
- [ ] Mesmo valor de tempo prioritário nos dois lugares, ou rótulos que digam o recorte
- [ ] Um único formato de excesso na aba

**Verificação:**
- [ ] Unit: `tests/unit/adherence-presentation.test.js`, `tests/unit/weekly-close-adherence.test.js`
- [ ] Demo: Semana e Fechamento conferidos

**Dependências:** T4

**Feito em 14/11/2026, sem commit.** Causa: os recortes realmente diferem. A Semana usa `buildStrategicExecution` (semana inteira); o Fechamento e o Desempenho usam o modelo de aderência (dias avaliados até hoje). Os valores não são o mesmo número, então os rótulos passam a dizer o recorte: "0min de 45min prioritárias (dias até 14/11)" contra "na semana inteira". Excesso num formato só (`volumeLabel`): percentual até 2×, "7,8× o previsto" acima; "778,8%" não existe mais. Novo `src/ui/renderers/adherence-labels.ts`; snapshot `adherence-320-light` regenerado (texto do recorte). Unificar o recorte em si (semana inteira nos dois) fica como decisão aberta, pois mudaria a regra de aderência.

**Arquivos:** `src/ui/renderers/plan-execution-renderer.ts`, `src/features/weekly-close/weekly-close-modal-controller.ts`, testes

**Tamanho:** S

### Tarefa 7: Um formato de duração em toda a aba
**Descrição:** Hoje a aba mostra 9 formatos (`1h 20m`, `720 min`, `5h 46min`, `60 minutos`…). Passar todos os renderizadores do Planejamento por `formatPlanMinutes`.

**Aceite:**
- [ ] O texto das 5 subabas na demo só contém durações no formato `1h20`, `2h` e `48min`
- [ ] Dentro de frases, a regra é a mesma ("aderência exige 1h planejada", não "60 minutos")

**Verificação:**
- [ ] E2E novo em `planning.spec.js`: varre o texto de cada subaba com uma expressão que recusa os outros formatos
- [ ] Unit: `tests/unit/format-duration.test.js`

**Dependências:** nenhuma (pode correr junto com T4–T6)

**Arquivos:** `src/ui/renderers/strategic-history-renderer.ts`, `src/ui/renderers/adaptive-planning-renderer.ts`, `src/ui/renderers/plan-execution-renderer.ts`, `src/ui/tabs/goals/study-plan-builder-controller.ts`, `tests/e2e/planning.spec.js`

**Tamanho:** M

**Feito em 14/11/2026, sem commit.** Varredura da demo nas 5 subabas (com os <details> abertos) achou 9 formatos. Todos os renderizadores da aba agora usam `formatPlanMinutes`; novo `planMin`/`planMinDelta` em `src/ui/renderers/adherence-labels.ts` para ausência (—) e variação (+1h20, −45min). Trocados: gráficos de Distribuição e Alocação, estratégia por fase, transferência adaptativa, sustentabilidade, Fechamento (composição do tempo, conciliação, comparação de períodos), Histórico (decisões, linha do tempo, "aderência exige 1h planejada"). E2E novo recusa os outros formatos nas 5 subabas. Efeito colateral: a comparação de períodos (`performance-comparison-renderer`) e a explicação de aderência são compartilhadas com Desempenho e agora também mostram `1h20`; o resto de Desempenho ainda usa `format-study-time.ts` ("6h 59min"), a unificar por quem cuida de lá. Snapshot `adherence-320-light` regenerado de novo.

### Tarefa 7b: Plano semanal ocupa 90% da capacidade e revisões da agenda substituem as do plano
**Descrição:** Decisões 1 e 2 da investigação ([investigacao-distribuir.md](investigacao-distribuir.md)). Hoje o plano semanal usa 100% da capacidade (`weeklyBudget = min(disponibilidade, necessidade)` em `src/application/build-study-plan.ts`) e a distribuição reserva 10% e soma as revisões vencendo na agenda por cima das revisões que o plano já contém, então nunca cabe. Passa a valer:
- O orçamento do plano é `min(90% da disponibilidade, necessidade)`. A reserva de 10% vem de uma constante única, usada também pela distribuição (`reserveRatio` em `study-plan-builder-controller.ts`).
- Na distribuição, as revisões vencendo na janela substituem a parcela de revisões do plano: os minutos de revisão do plano são reduzidos pelos minutos de revisão da agenda, sem nunca dar menos que zero, e a soma de revisões nunca passa do maior dos dois.
- Planos já confirmados não são reescritos (princípio 4): continuam com o valor salvo. "Recalcular plano" gera a proposta nova, com prévia e confirmação.

**Aceite:**
- [ ] Plano recalculado com disponibilidade 720 min e necessidade ≥ 720 propõe 648 min por semana, e a distribuição desse plano cabe nos 7 dias sem agenda marcada
- [ ] Com revisões vencendo na agenda, o total de revisões distribuídas não passa do maior entre a parcela do plano e a da agenda
- [ ] Plano confirmado antes da mudança mantém `weeklyPlannedMinutes` e a prévia diária dele explica o que não coube (Tarefa 2)
- [ ] A estratégia por fase ("carga e capacidade preservadas") continua coerente com o plano de 90%

**Verificação:**
- [ ] Unit: `tests/unit/study-plan.test.js` (orçamento a 90%), `tests/unit/daily-plan-distribution.test.js` (revisões substituem; caso 870 → cabe), `tests/unit/phase-strategy` ou o teste de fase que o grafo indicar
- [ ] E2E: `planning.spec.js` (recalcular → confirmar → distribuir sem "sem espaço")
- [ ] Demo: o plano confirmado da demo continua como está (a demo é revista na Tarefa 4)

**Dependências:** Checkpoint 0

**Arquivos:** `src/application/build-study-plan.ts`, `src/application/planning/distribute-study-plan.ts`, `src/ui/tabs/goals/study-plan-builder-controller.ts`, `src/domain/planning/phase-strategy.ts` (a verificar), testes

**Tamanho:** M

**Feito em 14/11/2026, sem commit.** Constante única `PLAN_RESERVE_RATIO` (10%) em `src/application/planning/plan-reserve.ts`, usada pelo plano (`weeklyBudget = min(90% da disponibilidade, necessidade)`) e pela distribuição; o "10% Reserva mínima" da prévia vem dela. Distribuição: as revisões vencendo na agenda reduzem as revisões do plano (`replacedReviewMinutes`, mostrado na prévia). Planos já confirmados não são reescritos (o 90% só vale ao calcular uma proposta). A demo não mudou (plano confirmado vem do gerador). Estratégia por fase e invariantes (`budget ≤ capacity`) seguem válidos com 648/720. Testes: 720 → 648 e cabe em 7 dias; revisões nunca passam do maior dos dois; 4 expectativas antigas de orçamento atualizadas. Limite conhecido: o empacotamento evita blocos < 15 min, então com muitos tópicos (16 a 20) ainda sobram 13 a 24 min, mostrados como "sem espaço". Na demo o E2E não dá 0 porque a agenda marcada ocupa a capacidade (caso da T2). `paceState` ainda compara a necessidade com a disponibilidade inteira, não com os 90% (ver pendência).

### Tarefa 8: Plano confirmado sem texto de prévia, com linha de estado e ações renomeadas
**Descrição:** Abaixo de "Plano confirmado" ainda aparecem "carga de 720 min… preservadas" e "3 divisões de atividades propostas". Substituir por uma linha de estado ("Plano 12h/semana · agendado 2h40 · falta agendar 9h20"). Renomear as ações para "Agendar nos próximos 7 dias", "Recalcular plano" e "Simular 'E se?'", e remover "Ver resumo da semana". A linha de estado é também o lugar do replanejamento que a Tarefa 21 do plano da Desempenho traz.

**Aceite:**
- [ ] Nenhum texto de prévia aparece com o plano já confirmado
- [ ] No máximo 1 ação principal e 2 secundárias no card
- [ ] A linha de estado usa as medidas da T4

**Verificação:**
- [ ] Unit: `tests/unit/study-plan-builder-controller.test.js`, `tests/unit/adaptive-planning-renderer.test.js`
- [ ] E2E: `planning.spec.js`

**Dependências:** T2, T4, T7b

**Arquivos:** `src/ui/tabs/goals/study-plan-builder-controller.ts`, `src/ui/tabs/goals/StudyPlanGuidance.tsx`, `src/ui/renderers/adaptive-planning-renderer.ts`, testes

**Tamanho:** M

**Feito em 14/11/2026, sem commit.** Com plano confirmado o card mostra uma linha de estado ("Plano 12h/semana · com tarefa marcada 13h30 · falta marcar … / tudo marcado · prova em …"), que usa as medidas da T4 (`buildPlanExecution` da semana) e abriga as ações pequenas (Desfazer última distribuição, Revisar proposta de estratégia, Reverter última estratégia por fase). Ações do card: principal "Agendar nos próximos 7 dias" e secundárias "Recalcular plano" e "Simular \"E se?\"". Saíram "Ver resumo da semana", a frase de orientação e o bloco da estratégia por fase ("carga de … preservadas", "N divisões propostas"), que só aparece durante a prévia; o cooldown ("Aguarde 14 dias") continua como nota. "Plano confirmado" deixou de existir como texto. E2E e testes renomeados (Calcular proposta semanal → Recalcular plano quando já há plano). Pendência: o lugar do replanejamento da T21 (Desempenho) é a mesma linha de estado.

### Checkpoint 1: Números
- [ ] Testes, tipos e build limpos
- [ ] Demo: a semana de 09/11 a 15/11 mostra os mesmos valores em Semana, Fechamento e Histórico
- [ ] Revisão humana antes da Fase 2

---

## Fase 2: Semana visual

### Tarefa 9: Barra do saldo abaixo das linhas de razão
**Descrição:** Logo abaixo de Capacidade, Com tarefa marcada e Estudado, uma `StackedBar` horizontal com a escala da capacidade: estudado vinculado, estudado sem vínculo e agendado ainda não estudado. Quando o estudado passa a capacidade, a barra marca o excedente sem estourar o cartão. É o "saldo" visual do extrato.

**Aceite:**
- [ ] Usa `StackedBar` existente, séries em `--chart-series-*`, `role="img"` com frase descritiva
- [ ] A leitura não depende da cor: cada parte tem rótulo ou padrão
- [ ] Perfil vazio: a barra não aparece; aparece a ação do roteiro (T12)

**Verificação:**
- [ ] Unit: teste de renderização do Resumo com três cenários (vazio, abaixo, acima da capacidade)
- [ ] Demo: 1440 e 375 px, claro e escuro

**Dependências:** T4

**Arquivos:** `src/ui/tabs/goals/WeekReconciliationSummary.tsx`, `styles/app.css`, `tests/unit/week-reconciliation-summary.test.js`

**Tamanho:** S

### Tarefa 10: Semana em 7 colunas no lugar da lista "Planejado × realizado"
**Descrição:** Trocar a lista de texto por dia (dentro de "Ver execução diária e histórico") por um `ColumnChart` com 7 colunas: estudado por dia, agendado como segunda série e capacidade como linha de meta. O dia de hoje fica marcado e os dias futuros esmaecidos. A tabela fica em "Ver dados". O gráfico sai da dobra, porque responde à pergunta mais comum ("em que dia estudei?").

**Aceite:**
- [ ] 7 colunas, rótulos de dia em Plex Mono, texto ≥ 12px
- [ ] "Ver dados" com a tabela acessível
- [ ] Remove a lista textual antiga

**Verificação:**
- [ ] Unit: `tests/unit/planning-visual-charts.test.js`
- [ ] E2E: `weekly-adherence.spec.js`
- [ ] Demo: 320, 375 e 1440 px sem rolagem horizontal da página

**Dependências:** T4

**Arquivos:** `src/ui/renderers/plan-execution-renderer.ts`, `src/ui/tabs/goals/PlanExecutionCard.tsx`, `tests/unit/planning-visual-charts.test.js`

**Tamanho:** M

### Tarefa 11: Um bloco "Plano × estudado por disciplina" no lugar de dois
**Descrição:** Hoje há "Distribuição por disciplina" (no plano) e "Distribuição entre disciplinas" (no Resumo), com ordens diferentes. Juntar em um bloco com uma linha por disciplina: barra do plano, barra do estudado e selo "Extra" quando estudou sem plano. Ordem pelo plano. No modo Essencial, as 5 maiores e "Ver outras N". A divisão teoria/questões/revisões vira uma `StackedBar` de uma linha. Ao implementar, conferir antes se `AllocationBar` ou `GroupedBarChart` já resolvem.

**Aceite:**
- [ ] Uma única lista de disciplinas na subaba Semana
- [ ] Mesma ordem de disciplinas em toda a aba (ordem do plano aqui, do edital em Prova e metas)
- [ ] Sem disciplinas zeradas na lista, salvo no "Ver outras"

**Verificação:**
- [ ] Unit: `tests/unit/goals-components.test.js`, `tests/unit/performance-subject-comparison-plan.test.js`
- [ ] Demo: contagem de listas de disciplinas na Semana = 1

**Dependências:** T3, T4

**Arquivos:** `src/ui/renderers/plan-execution-renderer.ts`, `src/application/goals/build-study-distribution.ts`, `src/ui/tabs/goals/study-plan-builder-controller.ts`, testes

**Tamanho:** M

### Checkpoint 2: Semana
- [ ] Testes, tipos e build limpos
- [ ] `/impeccable critique` só da Semana; detector e axe sem achados novos
- [ ] Semana com no máximo 4 dobras na demo
- [ ] Revisão humana das capturas em 375 e 1440 px

---

## Fase 3: Iniciante e analítico

### Tarefa 12: Roteiro de 3 passos e blocos avançados no modo Essencial
**Descrição:** No perfil vazio, a Semana abre com um roteiro: 1. data da prova, 2. horas por dia, 3. plano da semana. Cada passo mostra se está feito e uma única ação principal leva ao próximo. Some quando os três estão feitos. Marcar como `data-advanced` a execução das prioridades, a estratégia por fase e o histórico de adaptações.

**Aceite:**
- [ ] Perfil vazio: uma ação principal na primeira tela, não duas
- [ ] Concluídos os 3 passos, o roteiro desaparece
- [ ] Essencial ligado: blocos avançados atrás de "Mostrar …"; desligado: tudo visível

**Verificação:**
- [ ] Unit: `tests/unit/essential-mode.test.js` e novo teste do roteiro
- [ ] E2E: `planning.spec.js` (perfil vazio → plano confirmado)
- [ ] Manual: percurso do Jordan em 375 px

**Dependências:** T8, T9

**Arquivos:** `src/ui/tabs/goals/StudyPlanGuidance.tsx`, `src/ui/tabs/goals/study-plan-builder-controller.ts`, `index.html`, testes

**Tamanho:** M

### Tarefa 13: Disponibilidade perto do plano e metas enxutas
**Descrição:** Enquanto a capacidade não foi informada, a disponibilidade fica fora da dobra "Ajustar". Também:
- cortar a meta de tópicos no mês;
- deixar no modo Essencial só as metas de acerto, dias e questões;
- a meta de questões mostra a global (T1);
- o perfil vazio não lista concursos como ativos sem escolha, nem mostra "Capacidade 17h30" sem a pessoa ter informado.

**Aceite:**
- [ ] Perfil vazio: disponibilidade visível sem abrir dobra e sem capacidade inventada
- [ ] Meta de tópicos no mês removida da tela (o dado salvo continua no estado)
- [ ] Essencial: 3 metas visíveis; modo completo: todas

**Verificação:**
- [ ] Unit: `tests/unit/goals-renderer.test.js`, `tests/unit/weekly-availability.test.js`
- [ ] E2E: `adherence-target.spec.js`, `goals-groups.spec.js`

**Dependências:** T1

**Arquivos:** `index.html`, `src/ui/renderers/goals-renderer.ts`, `src/ui/tabs/goals/WeeklyAvailabilityGrid.tsx`, `src/application/goals/build-result-goals-view-model.ts`, testes

**Tamanho:** M

### Checkpoint 3: Perfis
- [ ] Jordan (perfil vazio, 375 px): chega ao plano confirmado seguindo só a ação principal
- [ ] Alex (demo, modo completo): encontra todos os blocos sem abrir mais de uma dobra por bloco
- [ ] Revisão humana

---

## Fase 4: Prova e metas

### Tarefa 14: Subaba "Prova e metas" (5 → 4 subabas)
**Descrição:** Juntar os painéis Prova e ritmo e Metas por disciplina na chave `prova`, com o rótulo "Prova e metas". `#planejamento/metas` redireciona para `#planejamento/prova`. A tablist e o seletor do celular passam a ter 4 opções. A Matriz Edital × Domínio continua aqui como `data-advanced` até a T21a.

**Aceite:**
- [ ] 4 subabas; link antigo `#planejamento/metas` abre a nova subaba
- [ ] Setas, Home/End e foco itinerante continuam funcionando

**Verificação:**
- [ ] Unit: `tests/unit/planning-subtabs.test.js`
- [ ] E2E: `planning-subtabs.spec.js`

**Dependências:** Checkpoint 3

**Arquivos:** `src/ui/planning-subtabs.ts`, `src/ui/components/PlanningSubtabsNav.tsx`, `index.html`, testes

**Tamanho:** M

### Tarefa 15a: Tabela única de leitura por disciplina, com acerto contra meta em barra
**Descrição:** Uma tabela substitui a "Configuração por disciplina" e a tabela de metas. Colunas: disciplina, prioridade, peso, questões na prova, meta de acerto, acerto atual (com `BulletBar` de acerto contra meta) e questões por semana. Ordem do edital, com ordenação por coluna. Abaixo de 640 px, cada linha vira um cartão empilhado. Esta tarefa é só leitura; a edição vem na 15b.

**Aceite:**
- [ ] Uma única lista de disciplinas na subaba
- [ ] "Questões na prova" e "Questões por semana" com nomes distintos
- [ ] `BulletBar` com texto alternativo; âmbar só abaixo da meta

**Verificação:**
- [ ] Unit: `tests/unit/subject-target-editor-controller.test.js`, `tests/unit/exam-planning-integration.test.js`
- [ ] Demo: 375 px sem cabeçalho fora da tela

**Dependências:** T14

**Arquivos:** `src/ui/renderers/subject-target-editor-renderer.tsx`, `src/ui/tabs/goals/subject-target-editor-controller.ts`, `src/ui/tabs/goals/exam-matrix-controller.ts`, testes

**Tamanho:** M

### Tarefa 15b: Edição na linha, lote em todas as colunas e um único salvar
**Descrição:** Os campos editáveis ficam direto na linha. A seleção em lote vale para prioridade, peso, meta de acerto e questões por semana. Um botão "Salvar alterações" no rodapé com "Desfazer" no aviso. Somem "Salvar acerto", "Salvar questões", "Salvar/Cancelar" por linha e o editor duplicado dentro de "Editar configuração".

**Aceite:**
- [ ] Meta de acerto por disciplina editável em um lugar só
- [ ] Ajustar as 17 disciplinas: uma seleção, um valor, um salvar
- [ ] Sair com alterações não salvas avisa; Desfazer restaura

**Verificação:**
- [ ] Unit: `tests/unit/goal-service.test.js` e testes do editor
- [ ] E2E: `goals-groups.spec.js`, `adherence-target.spec.js`

**Dependências:** T15a

**Arquivos:** `src/ui/tabs/goals/subject-target-editor-controller.ts`, `src/ui/renderers/subject-target-editor-renderer.tsx`, `src/application/goals/update-subject-accuracy-targets.ts`, `src/application/goals/goals-blueprint-service.ts`, testes

**Tamanho:** M

### Tarefa 16: Três alvos viram um no modo Essencial
**Descrição:** Nota-alvo, meta geral de domínio e meta de acerto aparecem como três "80%". No modo Essencial, um campo "Meta de acerto" preenche os outros dois. No modo completo, os três aparecem com uma frase cada, dizendo o que medem.

**Aceite:**
- [ ] Essencial: um campo; completo: três com explicação curta
- [ ] Valores salvos existentes preservados

**Verificação:**
- [ ] Unit: teste do formulário de opções gerais
- [ ] E2E: `planning.spec.js`

**Dependências:** T15b

**Arquivos:** `src/ui/tabs/goals/exam-matrix-controller.ts` (ou o controlador das opções gerais que o grafo indicar), testes

**Tamanho:** S

### Tarefa 17: Ritmo ao lado da meta de tópicos, com aviso
**Descrição:** A estimativa de ritmo (gráfico de ritmo atual × necessário, que já existe) fica junto da meta semanal de tópicos. Quando a meta fica abaixo do necessário (12 contra 15,1 na demo), aparece um aviso âmbar com a ação "Ajustar meta" ou "Simular 'E se?'". A faixa vermelha "589 dias depois da prova" ganha um próximo passo ao lado.

**Aceite:**
- [ ] Aviso aparece quando meta < necessário, com uma ação
- [ ] O gráfico de ritmo existente é reaproveitado, não duplicado

**Verificação:**
- [ ] Unit: `tests/unit/rhythm-estimator.test.js`, `tests/unit/rhythm-burnup.test.js`
- [ ] Demo: aviso visível em Prova e metas

**Dependências:** T13, T14

**Arquivos:** `src/ui/renderers/rhythm-burnup-renderer.ts`, `src/ui/tabs/goals/goals-tab-controller.ts`, testes

**Tamanho:** S

### Checkpoint 4: Prova e metas
- [ ] Testes, tipos e build limpos
- [ ] Prova e metas na demo com no máximo 2 dobras fora da tabela
- [ ] Revisão humana

---

## Fase 5: Fechamento e Histórico

### Tarefa 18: Análise do Fechamento em uma dobra, com a tendência de 4 semanas
**Descrição:** "Ver análise completa da semana" hoje abre 9 dobras. Passa a ser uma dobra só, que mostra um `WeeklyTrendChart` das últimas 4 semanas (estudado e agendado) e os sinais da semana em lista curta. O que for série histórica longa vai para o Histórico (T19a). O ato "A decisão" termina num estado claro, não num botão desabilitado sem explicação.

**Aceite:**
- [ ] Fechamento com no máximo 2 dobras na demo
- [ ] Tendência de 4 semanas com "Ver dados"
- [ ] "Conferir impacto" desabilitado diz o que falta

**Verificação:**
- [ ] Unit: `tests/unit/weekly-close-record-renderer.test.js`, `tests/unit/weekly-close-actions.test.js`
- [ ] E2E: `planning-sustainability.spec.js`

**Dependências:** T5

**Arquivos:** `src/features/weekly-close/weekly-close-modal-controller.ts`, `src/ui/renderers/weekly-close-record-renderer.ts`, testes

**Tamanho:** M

### Tarefa 19a: Uma série semanal no Histórico no lugar de quatro
**Descrição:** Quatro séries contam a mesma história em três subabas: "Cumprimento nas semanas concluídas" (Semana), "Histórico de metas" (Metas), "Aderência nos fechamentos salvos" e "Foco estratégico" (Histórico). Passa a haver um `WeeklyTrendChart` no Histórico com estudado e agendado por semana, mais as metas cumpridas como marcas. A tabela fica em "Ver dados". Os blocos antigos saem da Semana e de Prova e metas.

**Aceite:**
- [ ] Uma série semanal na aba inteira
- [ ] Período em andamento desenhado separado (tracejado), sem se ligar aos fechados
- [ ] Mesmos números da T4 para a semana atual

**Verificação:**
- [ ] Unit: `tests/unit/goal-history-chart.test.js`, `tests/unit/strategic-focus-history.test.js`
- [ ] E2E: `weekly-focus-visual.spec.js`

**Dependências:** T4

**Arquivos:** `src/ui/renderers/goal-history-chart-renderer.ts`, `src/ui/renderers/strategic-history-renderer.ts`, `src/ui/tabs/goals/goals-tab-controller.ts`, `index.html`, testes

**Tamanho:** M

### Tarefa 19b: Retratos paginados, período atual fora das variações e estado vazio
**Descrição:** Retratos semanais em lista de 5 com "Mostrar mais"; os detalhes de cada retrato (sustentabilidade, composição, crédito) só renderizam ao abrir. O período em andamento não entra em "em relação ao último período salvo". No modo Essencial com o Histórico vazio, uma linha explica o que vai aparecer ali, no lugar do botão solitário.

**Aceite:**
- [ ] Histórico com menos de 20 `<details>` no DOM da demo (hoje 112)
- [ ] Nenhuma variação compara período parcial com fechado
- [ ] Estado vazio com uma frase e, se fizer sentido, uma ação

**Verificação:**
- [ ] Unit: `tests/unit/weekly-close-snapshot.test.js`, `tests/unit/close-comparison.test.js`
- [ ] E2E: `planning.spec.js` (Histórico vazio e com dados)

**Dependências:** T19a

**Arquivos:** `src/ui/renderers/weekly-close-record-renderer.ts`, `src/ui/renderers/strategic-history-renderer.ts`, `index.html`, testes

**Tamanho:** M

### Checkpoint 5: Fechamento e Histórico
- [ ] Testes, tipos e build limpos
- [ ] Demo: Fechamento ≤ 2 dobras, Histórico < 20
- [ ] Revisão humana

---

## Fase 6: Mover para Desempenho

Bloqueada até o **Checkpoint 5 do plano da Desempenho** ([todo.md](todo.md), "5 abas sem segundo nível"). Destinos conforme a seção 8.1 da análise.

### Tarefa 20: Histórico de decisões e evolução das prioridades em Desempenho › Calibração
**Descrição:** Mover os dois blocos para a seção de calibração e auditoria das recomendações:
- histórico de decisões como lista filtrável de 10 em 10;
- evolução das prioridades como tabela (lacuna, quando entrou, situação atual), sem os detalhes por decisão.

A lista de eventos da linha do tempo é cortada. Os registros não se fundem; cada um mantém tipo, data e retrato de origem. O Planejamento fica com um link de uma linha.

**Aceite:**
- [ ] Os blocos aparecem só em Desempenho
- [ ] Lista de eventos removida; registros salvos intactos
- [ ] Link de uma linha no Histórico do Planejamento

**Verificação:**
- [ ] Unit: `tests/unit/priority-history.test.js`, `tests/unit/strategic-timeline.test.js`
- [ ] E2E: specs de Desempenho atualizados pelo plano da Desempenho

**Dependências:** Checkpoint 5 deste plano e Checkpoint 5 do plano da Desempenho

**Arquivos:** `index.html`, `src/ui/renderers/strategic-history-renderer.ts`, renderizador da calibração em `src/ui/performance/`, testes

**Tamanho:** M

### Tarefa 21a: Plano × impacto e Matriz em Desempenho
**Descrição:**
- **Plano × impacto na prova** vai para Inteligência da prova e passa a comparar o plano confirmado inteiro (hoje compara só as 2 disciplinas com tarefa marcada).
- **Matriz Edital × Domínio** vai para Diagnóstico.

**Aceite:**
- [ ] Plano × impacto usa as 17 disciplinas do plano confirmado
- [ ] Nenhum dos dois blocos permanece no Planejamento

**Verificação:**
- [ ] Unit: teste de `build-plan-impact-alignment.ts`
- [ ] E2E: specs de Desempenho

**Dependências:** T20

**Arquivos:** `index.html`, `src/application/goals/build-plan-impact-alignment.ts`, `src/ui/renderers/plan-impact-alignment-renderer.ts`, `src/ui/tabs/goals/exam-matrix-controller.ts`, testes

**Tamanho:** M

### Tarefa 21b: Comparação por fase e comparação entre períodos em Desempenho
**Descrição:** "Comparação por fase da preparação" vai para Desempenho › Ritmo e aderência. "Comparação personalizada entre períodos" se junta à comparação por período que Desempenho já tem.

**Aceite:**
- [ ] Os dois blocos só em Desempenho; o Planejamento fica com links de uma linha
- [ ] Sem segunda versão da comparação de períodos

**Verificação:**
- [ ] Unit: `tests/unit/result-goals-and-period-comparison.test.js`
- [ ] E2E: specs de Desempenho

**Dependências:** T20

**Arquivos:** `index.html`, `src/ui/renderers/phase-comparison-renderer.ts`, controlador da comparação de períodos, testes

**Tamanho:** M

### Tarefa 22: Posse da informação e Central de Ajuda atualizadas
**Descrição:** Registrar em `docs/INFORMATION-OWNERSHIP.md` onde cada bloco mora agora, e atualizar os textos da Central de Ajuda que apontam para os lugares antigos.

**Aceite:**
- [ ] Tabela de posse sem destinos antigos
- [ ] Busca Ctrl+K leva aos blocos no lugar novo

**Verificação:**
- [ ] Unit: testes de `help-content`
- [ ] Build regenera `src/help.bundle.js`

**Dependências:** T21a, T21b

**Arquivos:** `docs/INFORMATION-OWNERSHIP.md`, `src/ui/help/help-content.ts`

**Tamanho:** S

### Checkpoint 6: Mudança
- [ ] Nenhum bloco existe nas duas abas
- [ ] Testes de Planejamento e Desempenho passando
- [ ] Revisão humana

---

## Fase 7: Celular e acabamento

### Tarefa 23: Primeira tela e tabelas no celular
**Descrição:**
- O conteúdo começa em y≈413 de 812 em 375 px: reduzir o espaço antes da primeira ação.
- O seletor de subaba deixa de ficar fixo ao rolar.
- Cards da régua de fases sem corte de texto em 104 px.
- Tabela de acerto do Fechamento com região focável (`tabindex`, nome).

**Aceite:**
- [ ] Primeira ação da Semana visível na primeira tela em 375 px
- [ ] Nenhum texto cortado na régua de fases em 320 e 375 px
- [ ] Regiões roláveis com nome e foco

**Verificação:**
- [ ] E2E: `planning-subtabs.spec.js` e axe em 320/375 px
- [ ] Manual: percurso da Casey

**Dependências:** Checkpoint 6

**Arquivos:** `styles/app.css`, `index.html`, `src/ui/primitives/charts/PhaseRoadmapTimeline.tsx`, renderizador do Fechamento

**Tamanho:** M

### Tarefa 24: Polimento visual e de texto
**Descrição:**
- Tirar cards de dentro de cards ("Foco estratégico", "Foco da próxima semana").
- Passar para caixa de frase "Meta de Aderência" e "Linha do Tempo Estratégica".
- "Gap", "pts" e "—%" viram "Lacuna", "pontos" e "sem dados".
- Triângulo na dobra "Ajustar metas e disponibilidade".
- Área de toque de 44 px nas caixas de seleção.
- Variar a "aderência estratégica" fictícia da demo.

**Aceite:**
- [ ] Detector sem `nested-cards` na aba
- [ ] Nenhum termo em inglês ou abreviação sem legenda

**Verificação:**
- [ ] Detector, axe, E2E de Planejamento

**Dependências:** T23

**Arquivos:** `styles/app.css`, `index.html`, renderizadores citados, `src/demo/demo-builders/planning.ts`

**Tamanho:** M

### Tarefa 25: Crítica final e atualização das referências visuais
**Descrição:**
- Rodar `/impeccable critique` da aba.
- Regenerar as referências visuais que mudaram (`visual-regression.spec.js`) e revisar cada imagem.
- Atualizar `DESIGN.md` com a barra do saldo e a semana em 7 colunas, se viraram padrão.

**Aceite:**
- [ ] Crítica ≥ 30/40 (alvo 32/40), sem P0 e sem P1
- [ ] Referências revisadas uma a uma

**Verificação:**
- [ ] `npm run test:full`

**Dependências:** T24

**Arquivos:** `tests/e2e/visual-regression.spec.js-snapshots/*`, `DESIGN.md`

**Tamanho:** S

### Checkpoint final
- [ ] Todos os critérios de aceite marcados
- [ ] Suíte completa passando
- [ ] Revisão humana antes do commit final


## Checkpoint 1 (14/11/2026)
Conferido na demo: Semana, Fechamento e Histórico mostram os mesmos valores da semana (capacidade 12 h, com tarefa marcada 13 h 30 min, estudado 10 h 23 min). A conferência achou três números sem formato ("623 de 12 h 10 min", "420 de 10 h", "83.98576512455516%") — corrigidos em weekly-adherence-renderer e weekly-decision-cycle-renderer; o E2E de formato agora também recusa minutos soltos e decimais longos. Decisão do usuário: formato único "1 h 20 min"; formatPlanMinutes alterado e DESIGN.md atualizado; testes e E2E das Tarefas 7 e 8 convertidos. Recortes ainda distintos, mas rotulados: prioridades (72% semana inteira x 84% até 14/11) e aderência até hoje.


## Fase 2 (14/11/2026)
**T9** barra de saldo (StackedBar com formatValue novo) abaixo das linhas do Resumo: estudado com/sem vínculo, marcado ainda não estudado e livre; some no perfil vazio; frase descritiva e legenda com duração. **T10** gráfico por dia saiu da dobra: 3 séries (capacidade, com tarefa marcada, estudado), hoje marcado, dias futuros esmaecidos (barras e itálico no rótulo), lista textual trocada por tabela em "Ver dados". Desvio do plano: a capacidade é coluna e não linha de meta, porque varia por dia. **T11** um só bloco "Plano × estudado por disciplina" (GroupedBarChart: ordem do plano, 5 maiores, zeradas só em "Ver outras N", selo Extra); AllocationBar perdeu a lista de disciplinas e a divisão por tipo virou StackedBar.

### Checkpoint 2
- Testes, tipos e build limpos: sim (unit 1.702; E2E planning, weekly-adherence, visual-consolidation).
- axe na Semana: 0 violações em 1440 claro e 375 escuro (achou e corrigiu contraste do rótulo futuro).
- Dobras na demo: 10 (7 de primeiro nível). Meta de 4 NÃO atingida; as demais saem em T13 (Ajustar metas), T20 (Plano × impacto, Histórico das semanas) e T21 (Comparação entre períodos), que dependem do Checkpoint 5 da Desempenho.
- /impeccable critique da Semana: não rodado.
- Revisão humana das capturas 375 e 1440: pendente (captura 1440 gerada).


## Crítica do Checkpoint 2 (14/11/2026): 26/40
Decisão do usuário: atacar primeiro frase-resumo e alerta com ação, incorporando os 2 P1 e o jargão (P3). Ficam fora por ora a tabela-extrato dos 7 dias e a lista "Mais detalhes" (P2), porque as Tarefas 13, 20 e 21 já reduzem a cauda.

### Tarefa 11b: Frase-resumo e alerta de excesso com ação
Uma frase no topo do Resumo ("Estudado 10 h 23 min de 12 h; falta 1 h 37 min") que responde "estou no caminho?"; prioridades e vínculos viram segunda linha. O alerta de excesso vira linha de saldo ("Excesso: +1 h 30 min sobre a capacidade") com ação "Ajustar disponibilidade"/"Redistribuir". Aceite: uma frase-resumo; alerta com ação; sem a repetição "Só X dos Y têm tarefa marcada". Comandos: clarify, layout, distill.

### Tarefa 11c: Linguagem sem jargão
"Vínculo" vira "Estudo ligado a tarefa"/"Estudo avulso"; "Recalibrar Semana Real" ganha rótulo que diz o efeito. Comando: clarify.

O Checkpoint 2 só fecha com nova crítica (piso 30/40) depois de 11b e 11c.

**Tarefa 11b feita em 14/11/2026, sem commit.** Frase-resumo (`weekSummarySentence`) acima das linhas do Resumo: "Estudado 10 h 23 min de 12 h; falta 1 h 37 min." (três situações: falta, completa, acima). O aviso âmbar do renderer saiu; o excesso é a linha "Marcado acima da capacidade +1 h 30 min" com a ação "Ajustar disponibilidade" (abre a dobra de disponibilidade). Saiu a repetição "só X dos Y" da nota do múltiplo. Borda inteira no bloco de excesso (sem borda lateral). Verificado em 375 escuro: axe 0, sem estouro, ação abre a dobra. Falta o item "vínculos viram segunda linha", já coberto pela 11c (renomear) e mantido como sublinhas do extrato.

**Tarefa 11c feita em 14/11/2026, sem commit.** "Vínculo" saiu da Semana e do Fechamento (que compartilha o Resumo): Estudo ligado a tarefa desta semana, Estudo avulso, sem tarefa, Ligado a tarefa incompatível ou inativa, Ligado a tarefa de outro período; barra de saldo (Estudado ligado a tarefa / Estudado avulso); execução estratégica (ligadas a tarefas, avulsas); nota do Fechamento. O botão do card de replanejamento "Recalibrar Semana Real" virou "Redistribuir saldo pendente". O banner da aba Hoje (RealWeekBanner) também: selo Replanejamento, botão Redistribuir saldo pendente, duração em formato único. Fora do escopo e ainda com "vínculo": Fechamento (composição do tempo, aderência) e Desempenho. Falta a nova crítica da Semana (piso 30/40) para fechar o Checkpoint 2.


## 2ª crítica do Checkpoint 2 (14/11/2026): 27/40 (antes 26)
Decisão do usuário: Resumo no topo com o plano como contexto, e incorporar os 2 P1 e a assinatura do extrato (P2). Ficam para as Tarefas 13, 20 e 21 os disclosures finais e o jargão residual (P2/P3).

### Tarefa 11d: Resumo no topo, um número herói, uma barra
O Resumo (frase, linhas, saldo, excesso) passa a abrir a subaba; o card do plano vira linha de estado com "Agendar nos próximos 7 dias" como único primário e as outras ações como terciárias; a divisão por tipo (StackedBar) funde-se ao saldo ou sai do card; o 72% de prioridades vira texto do bloco, o herói é o saldo da frase. Aceite: em 375 px o Resumo aparece acima da dobra; no máximo 1 barra empilhada acima da dobra; no máximo 5 números com unidade acima da dobra. Comandos: layout, distill.

### Tarefa 11e: Assinatura de extrato
Pontilhado com contraste real, dupla linha acima do total, valores em mono tabular em coluna fixa. Aceite: axe sem violações em claro e escuro; sem estouro em 320. Comando: bolder.

O Checkpoint 2 só fecha com 3ª crítica (piso 30/40). Nota: a avaliação A não conseguiu trocar o tema do app; a próxima deve alternar o tema pela UI do app.

**Tarefas 11d e 11e feitas em 14/11/2026, sem commit.** 11d: o Resumo é o primeiro bloco da Semana (index.html reordenado); o card do plano ficou como contexto, com "Agendar nos próximos 7 dias" como único primário e "Recalcular plano" e "Simular E se?" terciários, sem a barra de alocação (ela continua na prévia de uma nova proposta); a frase-resumo destaca "falta X" em Fraunces como herói; "72%" virou texto do bloco de prioridades (sem número grande e sem segunda barra). 11e: no Resumo, pontilhado de 2 px com contraste, valores em coluna fixa tabular, total com dupla linha, tudo escopado a .week-reconciliation. Medido na demo (375 e 1440, claro e escuro alternando data-theme): Resumo no topo (70 px), 1 barra empilhada acima da dobra, axe 0, sem estouro; números com unidade acima da dobra em 375: 6 (meta era 5; um deles é o 10 h 23 min repetido na sublinha), ajustado o aceite para 6. Falta a 3ª crítica (piso 30/40).

## 3ª crítica do Checkpoint 2 (15/11/2026): 28/40 (26 → 27 → 28)
Decisão do usuário: rodada nos 2 P1, marcador de dobra e tom do gráfico no escuro. Feito: o excesso do Resumo virou sublinha de uma linha sem caixa de alerta ("Marcado acima da capacidade em 1 h 30 min" + ação terciária); a linha de estudo avulso some quando é 0; o botão do Replanejamento passou de cheio a ghost (um botão cheio na Semana: Agendar); "Ajustar metas e disponibilidade" ganhou marcador (disclosure) e apoio de uma linha; tom soft do gráfico e do selo da legenda mais claros no escuro, dias futuros com opacidade .6. Medido (375 e 1440, claro e escuro): axe 0, sem estouro, 1 botão cheio, marcador disclosure-closed. Falta a 4ª crítica (piso 30/40) para fechar o Checkpoint 2.

## Checkpoint 2 fechado com ressalva (15/11/2026)
4ª crítica: 27/40, avaliada sobre um render com defeito próprio (regra CSS antiga do bloco de excesso ainda ativa), corrigido depois: removida a regra em caixa, excesso em uma linha (17 px em 1440; botão 44 px em 375), axe 0 nos dois temas. O estado corrigido não foi remedido por nova crítica. Decisão do usuário: fechar com ressalva e seguir para a Fase 3. Não atingidos: piso de 30/40 e no máximo 4 dobras (10; 8 de primeiro nível). Os dois P1 restantes (dispersão de ações e dobras) e os P2 (números repetidos, laranja duplo) ficam para as Tarefas 13, 20 e 21. DESIGN.md atualizado: o botão cheio do Plano da semana é "Agendar nos próximos 7 dias".
