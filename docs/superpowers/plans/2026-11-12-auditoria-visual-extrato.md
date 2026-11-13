# Plano de implementação — auditoria visual do Extrato

> Estado em 13/11/2026: melhorias implementadas nas fases 1–4; a linha de base, os itens ainda abertos da fase 1 e a validação transversal permanecem parciais. O aceite de acessibilidade da fase 5 permanece aberto, conforme os limites abaixo.

**Entregas:** Visão Geral apresenta um alerta prioritário e o total restante; o planejamento distingue estudo vinculado e não vinculado; Agenda identifica tarefas e revisões, Disciplinas resume os estados dos tópicos e Questões contextualiza evidência; Desempenho reúne prontidão, ação e pontos de atenção sem criar outra prioridade. A ação planejada continua podendo ser iniciada diretamente pela Visão Geral.

**Validação registrada:** `npm run test:fast` passou em 50,84 s (UTC e America/Sao_Paulo); os testes dirigidos de responsividade e acessibilidade passaram, assim como as três comparações Windows após revisão dos diffs. A Demo densa e os testes de Desempenho foram executados na fase 4. Esses resultados não comprovam o CI nem conformidade integral de acessibilidade.

**Pendente:** zoom real do navegador a 200%, revisão abrangente de foco, ordem e alvos de toque, leitor de tela e dispositivo físico; ampliar a verificação de estados vazios conforme o [registro da fase 5](../../../auditorias/2026-11-13-fase5-visual/RELATORIO.md). A fase 0 usa zoom CSS simulado, que não substitui o zoom real.

**Objetivo:** reduzir o esforço para decidir e executar o estudo, mantendo a identidade e a confiabilidade das análises.

**Fontes:** auditoria visual de 12/11/2026 fornecida na conversa; 14 imagens de referência fornecidas pelo usuário; `PRODUCT.md`, `DESIGN.md`, `docs/INFORMATION-OWNERSHIP.md`, `docs/MICROCOPY-CONTRACT.md`, `docs/TEST-STRATEGY.md` e `docs/VISUAL-TEST-POLICY.md`. A auditoria relata observação desktop em Demo; suas capturas D1–D7 não foram fornecidas com este documento. Mobile, teclado, contraste e leitor de tela não foram medidos nela. As imagens enviadas são referências de outros produtos, não capturas do Extrato.

## Diagnóstico e direção

A auditoria é convincente quanto ao risco de competição entre ação, indicadores e explicações; sua extensão e gravidade precisam ser verificadas no código e na tela atual antes de cada fase. O projeto já tem `NextActionCard`, `TodayExecutionSummary`, `LedgerLine`, `buildAgendaBuckets`, `EvidenceBadge`, componentes de gráficos e navegação inferior descrita em `DESIGN.md`. A proposta de construir versões novas desses elementos deve ser substituída pela revisão dos existentes. A barra inferior já é documentada para abaixo de 760 px; validar seu comportamento antes de propor troca de itens. A atividade planejada já pode ser iniciada diretamente pela Visão geral; Desempenho usa “Abrir em Hoje”. A fase 0 confirmou esses contextos distintos; preservar ambos.

Adotar das referências: hierarquia evidente da ação e do dado principal (imagens 1, 8 e 12); organização de listas e filtros (6, 7 e 10); agrupamento de informação por período e legenda (7, 12 e 14); formulários por grupos com mensagens próximas aos campos (2); composição de tema escuro para testar legibilidade (13). Não importar automaticamente sidebars, cores azuis/roxas, cartões com brilho, mini gráficos decorativos, navegação ou funções de outros produtos. Manter musgo, papel, âmbar, Fraunces e Plex, bordas discretas e tokens existentes. Os hexadecimais sugeridos pela auditoria são hipóteses, não uma nova paleta aprovada.

## Restrições

- Uma prioridade compartilhada entre telas; distinguir plano confirmado, sugestão opcional e sessão livre. Nenhuma alteração de plano ou dados sem prévia e confirmação.
- Preservar período, unidade, origem, tamanho da amostra e limites necessários junto aos números; projeção não é chance de aprovação. Não mover ressalvas essenciais para conteúdo oculto.
- Não reescrever fechamentos ou snapshots históricos; não mudar cálculos nem schema como efeito de uma reorganização visual.
- Usar tokens semânticos e componentes Preact existentes; ícones Lucide, sem emoji; sem novas funções em `src/app.ts`. Garantir temas claro e escuro, teclado e estados sem dependência exclusiva de cor.
- Em dados vazios, pouco evidenciados, nomes longos, sessão em andamento e muitos itens, manter a ação correta e a leitura compreensível.

## Fase 0 — Linha de base e decisões

Relatório e evidências: [fase 0](../../../auditorias/2026-11-12-fase0-visual/RELATORIO.md). Os itens abaixo registram o escopo; consulte o relatório para resultados e limitações.

- [ ] Reproduzir a Demo densa no checkout atual e registrar Visão geral, Hoje, Planejamento, Disciplinas, Questões, Agenda e Desempenho em desktop e mobile; identificar diferenças entre auditoria, `DESIGN.md` e interface. Conferir 320, 375 e 430 px, 1440 px, temas claro/escuro e zoom 200%; registrar estado, viewport e evidências.
- [ ] Fazer percurso por teclado e verificações de contraste nas superfícies alteradas; complementar com leitor de tela e toque real quando disponíveis. Tratar o observado como linha de base, não como aprovação global de acessibilidade.
- [ ] Registrar para cada bloco candidato à remoção ou recolhimento entidade, fonte, janela, unidade e destino completo conforme `docs/INFORMATION-OWNERSHIP.md`.
- [ ] Verificar o comportamento atual da navegação inferior, do cabeçalho fixo e da ação entre Visão geral e Hoje. Preservar a navegação existente até existir evidência de problema e proposta aprovada.

**Aceite:** inventário com capturas e divergências verificáveis, estados e riscos; decisões ainda abertas identificadas. O alvo de cinco segundos é hipótese de pesquisa, não teste automatizado nem resultado comprovado.

## Fase 1 — Próxima ação e Hoje (P0)

**Pontos de partida:** `src/ui/tabs/dashboard/NextActionCard.tsx`, `PlannedActionCard.tsx`, `dashboard-tab-controller.ts`; `src/ui/tabs/today/TodayExecutionSummary.tsx`, `TodayAgendaSections.tsx`, `today-tab-controller.ts`, `day-reconciliation.ts` e modelos de execução existentes.

- [ ] Ajustar hierarquia da primeira dobra: ação compartilhada, contexto do plano, progresso do dia e até um alerta prioritário; manter análises acessíveis abaixo ou em disclosure quando a comparação da fase 0 justificar.
- [ ] Em Hoje, separar visualmente atividade em execução/seguinte, restante do plano, sugestão fora do plano e sessão livre, sem criar filas com semântica inventada. Manter o texto acolhedor e a informação de duração.
- [ ] Reusar o extrato diário existente; conferir capacidade, planejado, realizado e tempo livre com unidades e períodos claros, inclusive execução fora do plano e excesso de tempo.
- [ ] Verificar primeiro uso, dia sem plano, sessão ativa e sugestão de baixa evidência; manter a mesma identidade de ação entre telas e o início direto da atividade planejada na Visão geral; manter “Abrir em Hoje” em Desempenho.

**Aceite:** a ação operacional é identificável sem confundir sugestão opcional; nenhum dado ou ação existente fica inacessível; percursos críticos e comparações visuais dirigidas passam. Avaliar a meta de cinco segundos com pessoas, se houver participantes.

## Fase 2 — Planejamento e conciliação semanal (P1)

**Pontos de partida:** `src/ui/planning-subtabs.ts`, `src/ui/renderers/adaptive-planning-renderer.ts`, modelos de aderência e fechamento em `src/application/adherence/`; testes `planning.spec.js`, `planning-sustainability.spec.js` e contratos de aderência existentes.

- [x] Identificar fontes reais e escopos de capacidade, tempo planejado, estudo vinculado e estudo fora do plano. Apresentar essas grandezas em extrato comparável sem somá-las como se fossem categorias mutuamente exclusivas quando não forem.
- [x] Relacionar aderência à sua regra de vínculo, preservando diferença entre minutos e atividades. Manter prévia e confirmação das propostas e simulações.
- [x] Não adicionar “Vincular ao plano” nesta fase: auditar se já existe e especificar separadamente efeitos em dados e histórico antes de qualquer implementação.

**Aceite:** uma semana com estudo extra e nenhuma prioridade vinculada explica por que volume e aderência diferem; semanas encerradas não mudam. Executar Demo densa e testes direcionados de planejamento e aderência.

## Fase 3 — Agenda, disciplinas e questões (P1–P2)

**Pontos de partida:** `src/application/reviews/build-agenda-buckets.ts`, `src/ui/tabs/reviews/ReviewsTable.tsx`, `src/ui/renderers/reviews-renderer.ts`; `src/ui/tabs/subjects/SubjectsTab.tsx`, `SubjectBlock.tsx`, `SubjectTopicRow.tsx`; `src/ui/tabs/questions/QuestionLogTable.tsx`, `question-weak-topics.ts`, `questions-tab-controller.ts`.

- [x] Na Agenda, apresentar atrasadas, hoje e próximas com contagem de tarefas e revisões de tópico; identificar flashcards como fila própria, sem somar filas com definições diferentes. Em celular, testar lista antes de alterar o calendário.
- [x] Em Disciplinas, reduzir densidade visual das linhas sem ocultar progresso, acerto, ações e estados necessários; verificar todos os estados que compõem o resumo. Ordenações propostas dependem de dados disponíveis e definição de empates/ausências; não prometer incidência ou menor domínio sem inspecionar suas fontes.
- [x] Em Questões, colocar uma recomendação existente em contexto com período, amostra e evidência; manter a diferença entre evidência suficiente e necessidade de mais dados. Ajustar histórico em telas estreitas sem perder cabeçalhos, filtros ou ações.

**Aceite:** totais reconciliáveis, sem mistura de filas; nomes longos e ausência de amostra não causam falsa precisão; ações seguem acessíveis em teclado e em telas estreitas. Testar jornadas específicas e Demo densa quando contratos forem afetados.

## Fase 4 — Desempenho (P1)

**Pontos de partida:** `src/ui/performance/preparation-reading-renderer.ts`, `performance-overview-renderer.ts`, `evidence-badge.tsx`, `window-badge.tsx`, `src/ui/tabs/performance/performance-tab-controller.ts`; `tests/e2e/performance-preparation-reading.spec.js` e `performance-tablist.spec.js`.

- [x] Reorganizar a leitura existente em síntese, motivo e acesso à mesma ação de Hoje; manter qualificadores de plano e evidência junto da recomendação.
- [x] Preservar rótulo de período, amostra, confiança e ressalva de projeção; metodologia extensa pode ficar em disclosure acessível. Não comparar janelas diferentes como equivalentes nem produzir nova prioridade.
- [x] Conferir análise com dados ausentes, amostra pequena, recomendação fora do plano e telas densas; preservar navegação, âncoras e detalhes.

**Aceite:** leitura e ação permanecem coerentes com Hoje; confiança e limites continuam visíveis junto ao resultado. Executar testes direcionados, Demo densa e visual das superfícies alteradas.

## Fase 5 — Sistema visual e validação transversal

- [x] Refinar somente tokens e primitivas necessários às fases anteriores; conferir a cascata existente e usar `styles/tokens.css`. Padronizar espaçamento, foco e estados sem criar nova biblioteca. A revisão dirigida não identificou necessidade de novos tokens ou componentes.
- [ ] Testar visibilidade de foco, nomes acessíveis, ordem de leitura, alvos de toque, contraste de texto e controles, zoom 200% e ausência de overflow global a partir de 320 px. Verificar ambos os temas e estados vazios/densos.
- [x] Para mudanças visuais relevantes, comparar referências oficiais Windows com capturas e diffs individualmente; não atualizar snapshots automaticamente. Anotar o que foi realmente inspecionado e o que não foi. Ver [registro da fase 5](../../../auditorias/2026-11-13-fase5-visual/RELATORIO.md).

## Validação por entrega

Cada fase: `npm run test:fast`, seleção da área conferida e E2E dirigido da jornada; `npm run check:types` quando houver código TypeScript e `npm run build` quando artefatos precisarem de regeneração. Classificar novos testes em `tests/config/test-tiers.json` e rodar `node scripts/check-test-tiers.mjs`. Executar Demo densa nas mudanças de Demo, planejamento, análises históricas, trajetória ou contratos. Alterações de persistência, migrações, snapshots ou contratos globais exigem `npm run test:full`; se surgirem, separar o escopo e validar antes de prosseguir. Registrar tempos, comandos, resultados e limitações; gate local não prova CI.

## Decisões pendentes para execução

1. Concluir as verificações transversais ainda abertas na fase 5; registrar ambiente, resultados e eventuais correções.
2. Avaliar separadamente qualquer mudança de navegação, ordenação nova ou associação retroativa de sessão; não presumir autorização funcional a partir de uma referência estética.
3. Incorporar referências adicionais se o usuário as fornecer, sem presumir uma mudança de identidade.
