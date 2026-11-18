# Plano de implementação: listas longas com paginação, listas curtas com "Mostrar mais"

Tarefas detalhadas: [todo-listas.md](todo-listas.md). O plano de Desempenho (`plan.md` / `todo.md`) continua aberto e não é tocado por este.

## Visão geral

Hoje o app tem 5 mecanismos para o mesmo gesto "Mostrar mais" (~45 listas): a lista progressiva automática (`progressive-list.ts`, ~31 listas), o rodapé legado `renderCollectionFooter` (re-renderiza com limite maior), `lazyMore` (`<template>`), `<details>` manuais e botões próprios (histórico estratégico). Sete grupos crescem sem limite com o uso: Histórico de sessões, Questões, Simulados, Agenda (revisões próximas e concluídas), Calendário em lista, Tópicos por disciplina e os históricos de Decisões e de Aderência nos fechamentos salvos. Neles, "Mostrar mais" vira uma página cada vez mais longa depois de meses de uso. Esses sete vão para paginação (decisão confirmada); o resto fica em "Mostrar mais".

O plano faz duas coisas:

1. **Regra única**: lista que pode passar de ~20 itens usa **paginação**; as demais usam **Mostrar mais**. A decisão é por tipo de lista (declarada), nunca pela contagem do momento, para a tela não trocar de padrão quando os dados crescem.
2. **Código único**: um modelo e um rodapé para os dois modos (`more` e `pages`), em vez de 5 implementações.

## Base lida (somente leitura)

| Peça | Arquivo | Papel hoje |
|---|---|---|
| Modelo + montagem automática | `src/ui/progressive-list.ts` | `createProgressiveList`, lista `LISTS` de seletores, `mountProgressiveLists` (botão, `hidden`, foco, reset em filtro) |
| Rodapé legado | `src/ui/list-components.ts` | `renderCollectionFooter` ("Exibindo X de Y" + botão com `data-progressive-legacy`) |
| Limites de Questões/Simulados/Sessões | `src/bootstrap/wire-ui-controllers.ts` | `listViewState`, `LIST_VIEW_STEPS`, `changeListLimit` (+1 clique = tudo), `resetRecordListLimits` |
| Ação delegada | `src/ui/events/delegated-actions.ts` | regex de `changeListLimit('questions'\|'simulations'\|'sessionDays', …)` |
| Registro de ações | `src/ui/navigation/delegated-actions-registry.ts` | `changeAgendaLimit`, `changeCalendarLimit`, `changeOverdueGroupLimit`, `changeSubjectTopicLimit`, etc. |
| Telas a paginar | `questions-controller.ts`, `QuestionLogTable.tsx`, `SimulationLogTable.tsx`, `session-history-controller.ts`, `ReviewsTable.tsx`, `reviews-tab-controller.ts` | cada uma fatia (`slice(0, limite)`) e põe o rodapé legado |
| Outros mecanismos | `lazy-more.ts` (3 usos), `<details>` em 6 renderers, `strategic-history-renderer.ts` | a unificar |
| Testes | `tests/unit/{progressive-list,lazy-more,list-components,delegated-actions,reviews-calendar-components,approval-tab-controller,question-analytics-controller}.test.js`, `tests/e2e/{progressive-list,recent-flows,performance-diagnosis-lean}.spec.js` | cobrem o comportamento atual |

Comandos de verificação do projeto: `npm run test:unit`, `npm run lint`, `npm run build`, `npm run test:affected`, `npm run test:experience`. Depois de mexer em código: `graphify update .`.

## Grafo de dependências

```
Regra (limiar 20) + modelo de páginas + rodapé 'pages'   (T1)
    │
    ├── Simulados paginados (piloto)        (T2)
    │       ├── Questões                    (T3)  mesmo controller/tabela
    │       ├── Histórico de sessões        (T4)  paginar por dia, edição em linha
    │       ├── Agenda: revisões            (T5)  grupos próximas / concluídas
    │       ├── Calendário em lista         (T6)
    │       ├── Tópicos por disciplina      (T7)  uma paginação por disciplina
    │       └── Históricos de decisões e de aderência (T8)  listas de HTML estático: páginas via DOM
    │
    └── Unificar 'more' (independe das páginas depois de T1)
            ├── Rodapés legados restantes → componente único   (T9)
            ├── lazyMore (Matriz) e <details> manuais → registro (T10)
            └── Botões do histórico estratégico                (T11)
                    │
                    └── Regra aplicada + limpeza + docs (T12)
```

T8 depende de T1 e do modo `pages` no montador automático; usa os mesmos componentes das demais. Os grupos T2–T8 e T9–T11 não compartilham arquivos entre si e podem ir em sessões separadas depois do Checkpoint 1.

## Decisões de arquitetura

- **Regra em um lugar só.** Constante `PAGINATION_THRESHOLD = 20` e uma tabela declarada `LIST_MODE` (chave da lista → `'pages'` ou `'more'`). Um teste falha se uma lista nova não estiver declarada. "Itens possíveis" é o teto realista de uso, não o `length` atual.
- **Dois modos, um modelo.** `createProgressiveList` ganha `mode: 'pages'`, `pageSize`, `page`, `pageCount`, `pageItems`, `goTo(n)`, `next()`, `prev()`. O modo `more` continua como está. Estado fora do DOM, para a tabela re-renderizar sem perder a página.
- **Um rodapé só.** `renderCollectionFooter` ganha `mode: 'pages'`: "Exibindo 11–20 de 63 sessões", **‹ Anterior**, "Página 2 de 7", **Próxima ›**. Sem botões numerados (YAGNI; reavaliar se alguém pedir ir para a página 12). Em `more` o visual atual é mantido.
- **Tamanhos de página (confirmado):** 10 itens em Simulados, Questões, Revisões (próximas e concluídas), Calendário, Tópicos por disciplina, Histórico de decisões e Aderência nos fechamentos salvos; Histórico de sessões **7 dias** por página (a unidade hoje é o dia, não a linha).
- **Paginação também no montador automático.** As listas de HTML estático (decisões, aderência) não têm controller com estado. O `mountProgressiveLists` passa a aceitar `mode: 'pages'` por entrada de `LISTS`: esconde os itens fora da página e desenha o mesmo rodapé. Assim `lazyMore` sai sem precisar de estado novo nos renderers.
- **Tópicos por disciplina:** cada disciplina tem a sua página (estado por `subjectId`); trocar de página numa disciplina não mexe nas outras.
- **Estado de página** vive em `listViewState` (já existe) e sai da regex de `changeListLimit`; entra uma ação `goToListPage(key, page)`. Reset para a página 1 ao trocar de aba (`resetRecordListLimits`) e ao mudar filtro/busca. **Clamp** da página quando o total encolhe (apagar o último item da última página).
- **Sem página na URL.** O hash já é usado pelo roteador (`#agenda`, `#hoje/...`); misturar página nele quebraria `onHashRewrite`. Voltar ao início da lista ao trocar de página, respeitando `prefers-reduced-motion` (lógica de foco/scroll que já existe em `progressive-list.ts`).
- **Acessibilidade.** `<nav aria-label="Paginação de {label}">`, botões desabilitados com `aria-disabled`, contagem em `aria-live="polite"`, foco no início da lista ao paginar. Mobile (≤850px): só Anterior / Próxima e "Página X de Y".
- **Linha em edição nunca some.** No histórico de sessões, a linha em edição (`historyEditState.sessionId`) mantém a página; salvar ou cancelar não muda de página.
- **Migrar sem mudar a aparência das listas curtas.** O modo `more` mantém textos ("Mostrar mais · +N ↓", "Mostrar menos ↑"), limites (5, 3, 8, 2) e comportamento de reset. A unificação é interna.

## Lista de tarefas

### Fase 1: Fundação e piloto
- [x] T1: Regra (limiar 20), modelo de páginas e rodapé `pages`
- [x] T2: Simulados paginados (piloto de ponta a ponta)

### Checkpoint 1: Piloto
- [ ] Unit/lint/build limpos; Simulados paginando no navegador (desktop e mobile); revisão humana do visual da paginação

### Fase 2: Paginação nas listas longas
- [x] T3: Questões paginadas
- [x] T4: Histórico de sessões paginado por dia
- [x] T5: Agenda: revisões próximas e concluídas paginadas
- [ ] T6: Calendário em lista paginado
- [ ] T7: Tópicos por disciplina paginados
- [ ] T8: Históricos de decisões e de aderência paginados (montador automático)

### Checkpoint 2: Paginação
- [ ] `npm run test:affected` e `test:experience` verdes; reset ao trocar de aba e ao filtrar conferido nas 7 listas; revisão humana

### Fase 3: Unificar "Mostrar mais"
- [ ] T9: Rodapés legados restantes passam pelo componente único
- [ ] T10: `lazyMore` (Matriz) e `<details>` manuais substituídos
- [ ] T11: Botões próprios do histórico estratégico

### Checkpoint 3: Um mecanismo só
- [ ] Nenhum `data-progressive-legacy`, `lazyMore` ou "Mostrar mais" fora do componente; E2E de listas verde

### Fase 4: Regra aplicada
- [ ] T12: Tabela `LIST_MODE`, teste de conformidade, limpeza e documentação

### Checkpoint 4: Completo
- [ ] `npm run test:full`, lint, build; `graphify update .`; revisão final humana

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| `changeListLimit` tem regex rígida e é fachada de segurança das ações delegadas; trocar quebra cliques em silêncio | Alto | T2 troca a ação no piloto e ajusta `delegated-actions.test.js` antes de migrar as outras |
| Histórico de sessões pagina por dia e tem edição em linha e filtros | Alto | T4 isolada; teste de edição na última linha da página e de filtro que zera a página |
| Reset de limites espalhado (`resetRecordListLimits` toca 6 controllers) | Médio | T1 define um `resetListViews()` único; T9 troca as chamadas uma a uma |
| Tabela com cabeçalho repetido na matriz do concurso (T10) | Médio | manter o comportamento, só trocar o mecanismo; se não couber no registro, deixar como exceção declarada em `LIST_MODE` |
| Paginação via DOM (T8) esconde itens que o `MutationObserver` re-renderiza e re-mede | Médio | estado de página guardado por id da lista (como `states` já faz); teste de re-render com a página 2 aberta |
| Calendário em lista e Tópicos mexem em telas com muitas ações delegadas (`changeCalendarLimit`, `changeSubjectTopicLimit`) | Médio | T6 e T7 trocam e removem as ações antigas junto com o teste, uma lista por commit |
| Testes E2E dependem de textos ("Mostrar mais · +N") | Médio | mantidos no modo `more`; E2E novo só para `pages` |
| `src/app.bundle.js` pode estar versionado | Baixo | regenerar com `npm run build` se for rastreado; conferir no `git status` |
| Mudança grande em um commit só | Médio | uma tarefa = um commit; push direto no `main`, stage só dos arquivos da tarefa |

## Decisões já confirmadas

1. Calendário em lista e Tópicos por disciplina passam para paginação.
2. Histórico de decisões e Aderência nos fechamentos salvos passam para paginação.
3. Tamanho de página: 10 itens, 7 dias no histórico de sessões.

## Perguntas em aberto

- Interpretei "fechamentos semanais" como `.weekly-adherence-history` ("Aderência nos fechamentos salvos"). Outros históricos que crescem por semana (`.weekly-focus-history`, `.adaptive-history`, `.strategic-timeline`, `.weekly-decision-results`) ficam em "Mostrar mais" até você pedir. Se algum deles deve paginar, é só uma linha a mais em `LISTS`.
