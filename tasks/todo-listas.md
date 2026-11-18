# Tarefas: listas longas com paginação, listas curtas com "Mostrar mais"

Plano e decisões: [plan-listas.md](plan-listas.md). Convenção: uma tarefa = um commit, push direto no `main`, stage só dos arquivos da tarefa. Verificação padrão de toda tarefa: `npm run test:unit`, `npm run lint`, `npm run build`; depois `graphify update .`.

---

## Fase 1: Fundação e piloto

### T1: Regra (limiar 20), modelo de páginas e rodapé `pages`
**Descrição:** Cria a base que as demais usam: constante `PAGINATION_THRESHOLD = 20`, modo `pages` no modelo e no rodapé, e um reset único de visões de lista. Nenhuma tela muda ainda.

**Critérios de aceite:**
- [x] `createProgressiveList` aceita `mode: 'pages'` com `pageSize`, e expõe `page`, `pageCount`, `pageItems`, `goTo`, `next`, `prev`; o modo `more` se comporta exatamente como antes.
- [x] `page` é limitada a `1..pageCount` (total encolhendo não deixa página vazia); total 0 não mostra rodapé.
- [x] `renderCollectionFooter({ mode: 'pages', ... })` renderiza `<nav aria-label>`, "Exibindo a–b de N {label}", Anterior, "Página X de Y", Próxima; botões nas pontas ficam com `aria-disabled`; some quando só há 1 página.
- [x] Em `mode: 'more'` (padrão) a saída HTML não muda.
- [x] Constante `PAGINATION_THRESHOLD` exportada e comentada (a regra em uma linha).

**Verificação:**
- [x] `node --import ./scripts/ts-resolve-hook.mjs --test tests/unit/progressive-list.test.js tests/unit/list-components.test.js`
- [x] Testes novos: limites de página, clamp, 1 página, 0 itens, HTML do rodapé nos dois modos
- [x] `npm run lint` e `npm run build`

**Dependências:** nenhuma
**Arquivos:** `src/ui/progressive-list.ts`, `src/ui/list-components.ts`, `tests/unit/progressive-list.test.js`, `tests/unit/list-components.test.js`, CSS do rodapé (`.list-view-controls`)
**Escopo:** M

### T2: Simulados paginados (piloto de ponta a ponta)
**Descrição:** Caminho completo em uma lista só: estado de página, ação delegada `goToListPage`, tabela, rodapé, reset. Serve para validar o desenho antes de replicar. Simulados é a menor das quatro.

**Critérios de aceite:**
- [x] A tabela de Simulados mostra 10 por página; Anterior/Próxima trocam a página e o foco volta ao início da lista.
- [x] Ação `goToListPage('simulations', n)` registrada e validada (nome e chave em lista fechada; página inteira ≥ 1) no resolvedor de ações delegadas; sai a regex antiga de `simulations`.
- [x] Voltar para a aba, mudar de aba ou salvar um novo simulado reinicia na página 1 / mantém coerente; apagar o último item da última página cai na página anterior.
- [x] Mobile (≤850px): só Anterior, "Página X de Y" e Próxima, sem estourar a largura.

**Verificação:**
- [x] `tests/unit/delegated-actions.test.js` atualizado (aceita `goToListPage`, rejeita chave desconhecida)
- [x] Teste unitário do controller: página, reset, clamp
- [x] Manual: preview em desktop e mobile com demo de 25+ simulados; screenshot do rodapé
- [x] `npm run test:affected`

**Dependências:** T1
**Arquivos:** `src/ui/tabs/questions/questions-controller.ts`, `src/ui/tabs/questions/SimulationLogTable.tsx`, `src/ui/events/delegated-actions.ts`, `src/bootstrap/wire-ui-controllers.ts`, `src/ui/navigation/delegated-actions-registry.ts`
**Escopo:** M

---

### Checkpoint 1: Piloto
- [ ] `npm run test:unit`, `lint` e `build` limpos
- [ ] Simulados paginando no navegador (desktop e mobile)
- [ ] Revisão humana do visual da paginação (antes de replicar nas outras três)

---

## Fase 2: Paginação nas listas longas

### T3: Questões paginadas
**Descrição:** Replica o piloto em Questões (mesmo controller e a mesma estrutura de tabela).

**Critérios de aceite:**
- [x] 10 por página, mesmo rodapé e mesmo comportamento de T2.
- [x] Filtros e busca da lista de questões levam à página 1.
- [x] `changeListLimit('questions', ...)` removido; sem referência órfã em `LIST_VIEW_STEPS`.

**Verificação:**
- [x] `npm run test:unit` com teste de filtro → página 1
- [x] Manual: 25+ questões na demo, filtrar e paginar

**Dependências:** T2
**Arquivos:** `src/ui/tabs/questions/questions-controller.ts`, `QuestionLogTable.tsx`, `questions-tab-controller.ts`, `tests/unit/delegated-actions.test.js`
**Escopo:** S

### T4: Histórico de sessões paginado por dia
**Descrição:** A unidade hoje é o dia (grupos com cabeçalho expansível). Pagina por **7 dias** por página, mantendo expansão do primeiro dia e edição em linha.

**Critérios de aceite:**
- [x] 7 dias por página; o rodapé diz "Exibindo X–Y de N dias" (ou sessões, mantendo o rótulo atual "sessões" se for o que a pessoa vê; decidir na tarefa e deixar igual em desktop e mobile).
- [x] A linha em edição fica na sua página; salvar/cancelar não troca de página.
- [x] Os filtros de histórico (`clearSessionHistoryFilters` e busca) levam à página 1; "Limpar filtros" também.
- [x] A expansão inicial do primeiro dia vale para o primeiro dia da página 1 apenas.

**Verificação:**
- [x] Teste unitário: edição na última linha de uma página; filtro que zera; total encolhendo
- [x] `tests/e2e/recent-flows.spec.js` ajustado se citar "Mostrar mais" do histórico
- [x] Manual: demo com 30+ dias de sessão

**Dependências:** T2
**Arquivos:** `src/ui/tabs/today/session-history-controller.ts`, `src/bootstrap/wire-execution-and-onboarding-ui.ts`, `src/ui/renderers/*` do dia (se tocar), `tests/unit/*session-history*`
**Escopo:** M

### T5: Agenda: revisões próximas e concluídas paginadas
**Descrição:** Troca `changeAgendaLimit('upcoming'|'completed', 5)` por páginas de 10 nos dois grupos. Atrasadas ficam como estão (lista curta e prioritária).

**Critérios de aceite:**
- [x] "Próximas revisões" e "Histórico de revisões concluídas" têm cada um sua página; o estado de uma não afeta a outra.
- [x] Recolher e reabrir o grupo concluído mantém a página; mudar de aba reinicia.
- [x] `agendaUiState.upcomingVisible/completedVisible` substituídos por página; `resetAgendaLimit` removido.

**Verificação:**
- [x] `tests/unit/reviews-calendar-components.test.js` e testes do `reviews-tab-controller` atualizados
- [x] Manual: 25+ revisões concluídas na demo

**Dependências:** T2
**Arquivos:** `src/ui/tabs/reviews/ReviewsTable.tsx`, `reviews-tab-controller.ts`, `src/ui/navigation/delegated-actions-registry.ts`, `src/bootstrap/wire-ui-controllers.ts`, `tests/unit/reviews-calendar-components.test.js`
**Escopo:** M

---

### T6: Calendário em lista paginado
**Descrição:** A tabela do Calendário ("Ver mais", `changeCalendarLimit`) passa a páginas de 10. A visão de Mês não muda.

**Critérios de aceite:**
- [x] A lista do Calendário mostra 10 por página com o rodapé padrão; trocar de visão (Mês/lista) ou de filtro volta à página 1.
- [x] `changeCalendarLimit` e `calendarUiState.visible` saem; `onShowMore` do `CalendarTable` vira navegação de página.

**Verificação:**
- [x] `tests/unit/reviews-calendar-components.test.js` e testes do `calendar-tab-controller` atualizados
- [x] Manual: calendário com 25+ itens na demo

**Dependências:** T2
**Arquivos:** `src/ui/tabs/calendar/CalendarTable.tsx`, `calendar-tab-controller.ts`, `src/ui/calendar/calendar-controller.ts`, `src/ui/renderers/calendar-renderer.ts`, `src/ui/navigation/delegated-actions-registry.ts`
**Escopo:** M

### T7: Tópicos por disciplina paginados
**Descrição:** Em Disciplinas, cada disciplina lista seus tópicos com `changeSubjectTopicLimit` (passo 10). Passa a ter uma paginação por disciplina.

**Critérios de aceite:**
- [x] Cada disciplina com mais de 10 tópicos mostra rodapé próprio; mudar de página numa não afeta as outras.
- [x] Adicionar, apagar ou concluir tópico mantém a página (com clamp quando a página some).
- [x] `changeSubjectTopicLimit` removido do registro de ações.

**Verificação:**
- [x] Teste unitário: estado por `subjectId`, clamp ao apagar o último tópico da última página
- [x] Manual: disciplina com 30+ tópicos

**Dependências:** T2
**Arquivos:** `src/ui/tabs/subjects/SubjectsTab.tsx`, `subjects-controller.ts`, `subjects-tab-controller.ts`, `src/ui/navigation/delegated-actions-registry.ts`
**Escopo:** M

### T8: Históricos de decisões e de aderência paginados (montador automático)
**Descrição:** `#decisionHistoryDashboard` e `.weekly-adherence-history > ol` já estão no registro `LISTS`, e o Histórico de decisões e a Aderência semanal usam `lazyMore`. Passam a `mode: 'pages'` (10 por página) no montador automático, que ganha suporte a páginas para listas de HTML estático. Remove esses dois usos de `lazyMore`.

**Critérios de aceite:**
- [x] `LISTS` aceita `mode: 'pages'` por entrada; esconde itens fora da página e desenha o rodapé padrão.
- [x] As duas listas deixam de usar `lazyMore`; o Histórico de decisões lista todas, da mais recente para a mais antiga, em páginas de 10.
- [x] Re-render com a página 2 aberta mantém a página 2 (estado por id da lista); filtro/busca volta à página 1.

**Verificação:**
- [x] `tests/unit/progressive-list.test.js` (modo `pages` no montador) e `tests/e2e/progressive-list.spec.js`
- [x] Manual: modal de Fechamento semanal e Aderência nos fechamentos, com 25+ itens

**Dependências:** T1
**Arquivos:** `src/ui/progressive-list.ts`, `src/ui/renderers/studytrack32-renderer.ts`, `src/ui/renderers/weekly-adherence-renderer.ts`, `tests/unit/progressive-list.test.js`, `tests/e2e/progressive-list.spec.js`
**Escopo:** M

---

### Checkpoint 2: Paginação
- [ ] `npm run test:affected` e `npm run test:experience` verdes
- [ ] Reset ao trocar de aba e ao filtrar conferido nas 7 listas
- [ ] Revisão humana (desktop e mobile)

---

## Fase 3: Unificar "Mostrar mais"

### T9: Rodapés legados restantes passam pelo componente único
**Descrição:** Retenção, Desempenho de questões, Próximos (Visão geral) e Datas atrasadas ainda usam `renderCollectionFooter` com `data-progressive-legacy`. Troca por um único caminho (mesmo modelo, mesmo botão), sem mudar texto nem limite.

**Critérios de aceite:**
- [x] Nenhum `data-progressive-legacy` no código; `mountProgressiveLists` deixa de ter ramo "legacy".
- [x] "Mostrar mais · +N ↓" / "Mostrar menos ↑" iguais ao de hoje nessas telas.
- [x] `resetRecordListLimits` reduz-se a `resetListViews()` (uma chamada).

**Verificação:**
- [x] `tests/unit/{approval-tab-controller,question-analytics-controller}.test.js` e `tests/e2e/progressive-list.spec.js` verdes
- [x] Manual: as 4 telas com mais de 5 itens

**Dependências:** Checkpoint 2 (as telas paginadas já saíram do rodapé legado)
**Nota:** a Retenção por tópico saiu de "Mostrar mais" e foi para páginas (`'pages'`, 10 por página) a pedido, por ter centenas de linhas. `LIST_MODE` (T12) a registra como paginada. Depois do Checkpoint 3, Próximos e Desempenho por tópico também foram para páginas, e o botão "Mostrar mais" passou ao estilo dos botões da paginação. Datas atrasadas e os grupos Hoje e Atrasadas das revisões também paginam (Agenda inteira em páginas).
**Arquivos:** `src/ui/list-components.ts`, `src/ui/progressive-list.ts`, `src/bootstrap/wire-ui-controllers.ts`, `approval-tab-controller.ts`, `question-analytics-controller.ts`, `dashboard-tab-controller.ts`, `calendar-tab-controller.ts` (Atrasadas)
**Escopo:** L → dividir em T9a (Retenção, Desempenho de questões) e T9b (Próximos, Atrasadas, reset único) ao executar

### T10: `lazyMore` (Matriz) e `<details>` manuais substituídos
**Descrição:** A Matriz do concurso é o último uso de `lazyMore`. Diagnóstico, Quadrantes de incidência, Matriz (tabela), Comparação de disciplinas, Mapa de estabilidade e Execução diária têm `<summary>Mostrar mais · +N</summary>` escrito à mão. Migram para o registro quando for lista de itens; tabela com cabeçalho repetido pode ficar como exceção declarada.

**Critérios de aceite:**
- [x] `lazy-more.ts`, `bindLazyMore` e `tests/unit/lazy-more.test.js` removidos.
- [x] Nenhum "Mostrar mais" escrito à mão fora do componente, exceto os declarados como exceção em `LIST_MODE` com o motivo.
- [x] Textos específicos ("Mostrar mais sinais", "barras") passam ao texto padrão com `+N`.

**Verificação:**
- [x] `tests/e2e/performance-diagnosis-lean.spec.js` ajustado e verde
- [x] Manual: Metas (matriz com 8+ disciplinas), Desempenho > Diagnóstico e Comparação

**Dependências:** T8, T9
**Arquivos:** `src/ui/lazy-more.ts`, `exam-matrix-controller.ts` e os 6 renderers
**Escopo:** L → dividir em T10a (matriz e `lazyMore`) e T10b (os `<details>`) ao executar

### T11: Botões próprios do histórico estratégico
**Descrição:** `showMorePriorityHistoryTopics` e `togglePriorityTopicObservations` passam pelo mesmo componente.

**Critérios de aceite:**
- [x] Os dois botões usam o componente padrão; as ações delegadas próprias saem do registro.
- [x] Abrir/fechar observações por tópico continua funcionando.

**Verificação:**
- [x] Testes do `weekly-close-modal-controller` e `strategic-history-renderer` verdes
- [x] Manual: modal de Fechamento semanal com 6+ tópicos

**Dependências:** T10
**Arquivos:** `src/ui/renderers/strategic-history-renderer.ts`, `src/features/weekly-close/weekly-close-modal-controller.ts`, `src/ui/navigation/delegated-actions-registry.ts`
**Escopo:** S

---

### Checkpoint 3: Um mecanismo só
- [ ] `grep` por `data-progressive-legacy`, `lazyMore`, `data-lazy-more` e "Mostrar mais" fora do componente volta vazio (ou só exceções declaradas)
- [ ] `tests/e2e/progressive-list.spec.js` verde
- [ ] Revisão humana

---

## Fase 4: Regra aplicada

### T12: Tabela `LIST_MODE`, teste de conformidade, limpeza e documentação
**Descrição:** Declara o modo de cada lista, com teste que impede lista nova sem decisão; remove código morto; documenta a regra.

**Critérios de aceite:**
- [ ] `LIST_MODE` (chave → `pages` | `more`, com exceções e motivo) cobre todas as listas de `LISTS` e as paginadas (Sessões, Questões, Simulados, Agenda, Calendário, Tópicos, Decisões e Aderência).
- [ ] Teste de conformidade: toda lista de `LISTS` está em `LIST_MODE`; as paginadas têm `pages`; nenhuma lista `more` declara teto realista acima de `PAGINATION_THRESHOLD`.
- [ ] Sem código morto (`LIST_VIEW_STEPS`, `changeListLimit`, `changeAgendaLimit`, `resetAgendaLimit`, `changeCalendarLimit`, `changeSubjectTopicLimit` e afins).
- [ ] Regra escrita em uma frase no doc de UI do projeto e no comentário de `progressive-list.ts`.

**Verificação:**
- [ ] `npm run test:full`, `npm run lint`, `npm run build`, `npm run test:tiers`
- [ ] `graphify update .`
- [ ] Manual: varredura das abas (Hoje, Agenda, Disciplinas, Questões, Simulados, Desempenho, Metas) em desktop e mobile

**Dependências:** T3 a T8, T11
**Arquivos:** `src/ui/progressive-list.ts`, `tests/unit/list-mode.test.js` (novo), `src/bootstrap/wire-ui-controllers.ts`, doc de UI
**Escopo:** M

---

### Checkpoint 4: Completo
- [ ] Todos os critérios acima atendidos
- [ ] `npm run test:full`, lint, build verdes
- [ ] Revisão final humana
