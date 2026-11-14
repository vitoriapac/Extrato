# Investigação: incoerências da aba Desempenho, demo ou produto? (Tarefa 6)

Data: 14/11/2026. Método: gerei a demo (`generateDemoData`, hoje = 13/11/2026), conferi os dados que alimentam cada número (sessões, planos, histórico de tópicos, snapshots) e li o código que calcula e mostra cada um. Os testes que fixam cada correção estão em `tests/unit/demo-coherence.test.js`.

Classes: **demo** (a demo gera dado incoerente), **cálculo** (o produto calcula errado), **apresentação** (o produto calcula certo e mostra mal ou sem contexto), **correto** (comportamento esperado, mal explicado).

| # | Incoerência vista | Classe | Causa encontrada | Destino |
|---|---|---|---|---|
| 1 | Aderência de 0% na semana atual com 6 dias de estudo | **demo** | Os planos diários históricos terminam antes de hoje e os planos futuros começam hoje. Os 4 dias entre eles (09 a 12/11) tinham 9 sessões e nenhum plano; as sessões ficaram sem `planItemId`, então o crédito ao plano é 0 | **Corrigido** em `src/demo/demo-builders/planning.ts`: um plano por dia estudado entre o último plano histórico e hoje, e a conciliação existente liga as sessões |
| 2 | 4 h 25 min planejadas em 7 dias, contra 12 h de capacidade | **demo** | Mesma causa: só 3 dos 7 dias tinham plano (109 + 76 + 80 min) | **Corrigido** (planejado dos 7 dias passa de 265 para 920 min; estudado 758 min) |
| 3 | Volume de carga de 286% (7 dias) e 96,2% (30 dias) | **demo** | Consequência de 1 e 2: o 30 dias cobria semanas inteiras de plano; o 7 dias não | **Corrigido**: o 7 dias fica em cerca de 82%, coerente com o 30 dias |
| 4 | Matriz com 16 de 17 disciplinas em "Prioridade alta", nenhuma consolidada | **demo + apresentação** | O corte é fixo (domínio 70, retenção 60) e `classifyPedagogicalQuadrant` está correto. Na demo, nenhuma disciplina tem domínio ≥ 70 (47 a 61). O domínio da Matriz é o índice de domínio dos tópicos, não a precisão em questões: Conhecimentos Bancários tem 85% de acerto e domínio 60 | **Não alterado agora.** Produto: tratar na Tarefa 20 (Matriz só quando discriminar) e na Tarefa 9 (vocabulário de domínio). Demo: acrescentar disciplinas fortes quando a Matriz mudar, para o gráfico ter o que discriminar |
| 5 | 305 oportunidades e "+294 diagnósticos" para 305 tópicos | **apresentação** | `opportunityCount` conta todo tópico com importância de prova configurada. A demo configura importância em todos (0,40 a 0,95). Um aluno real que configurou o edital inteiro veria o mesmo | **Produto**, Tarefa 19 (Diagnóstico agrupado por disciplina e com filtro). Sem mudança na demo |
| 6 | Meta semanal de tópicos "0 de 12" | **demo (dois defeitos)** | (a) A demo gravava `metas.semanal = 12` e `metas.mensal = 48`, que são **horas**, num campo que o app lê como **tópicos** (Diagnóstico, Metas, Hoje, relatório). O padrão do app é 5 e 20. (b) Os tópicos concluídos recebem data entre 20 e 129 dias depois do início, então nenhum caía nos últimos 10 dias | **Corrigido**: `weeklyTopics: 5` e `monthlyTopics: 20` no cenário; três tópicos concluídos nos últimos 3 dias. A semana mostra "3 de 5" |
| 7 | Informática: tópico com domínio 38, disciplina com 85% de acerto | **correto** | O tópico "Ferramentas de trabalho remoto" é uma lacuna deliberada do cenário em uma disciplina forte. Domínio de tópico e precisão da disciplina são medidas diferentes, com janelas diferentes | **Apresentação**, Tarefa 12: dizer na tela que é um tópico fraco dentro de uma disciplina forte |
| 8 | Prontidão 47 hoje, 56 no último fechamento, "tendência estável" | **demo** | Os retratos semanais da demo vêm de `buildHistoricalReadinessMetrics`, que só a demo usa e que calcula o domínio como acerto geral e a retenção como revisões feitas no prazo. O cálculo ao vivo usa o índice de domínio por tópico e a estimativa de retenção por tópico. No retrato de 08/11: domínio 64 e retenção 86. Hoje: domínio 51 e retenção 52. O produto real grava o retrato com o cálculo ao vivo, então esse salto não acontece com dados reais | **Não corrigido** (ver abaixo) |

## O que ficou em aberto e por quê

**Item 8.** Para a demo ter retratos coerentes com o cálculo ao vivo, o gerador precisaria usar as mesmas funções do app (`topicMasteryIndex`, `topicRetentionScore`), que hoje existem só dentro do serviço montado com o estado. As opções são instanciar esse serviço no gerador (acopla a demo ao app inteiro) ou calibrar os retratos com um fator (inventa número). Nenhuma das duas é pequena nem segura, então não mexi. Proponho decidir junto com a Tarefa 8 (selos de janela): a frase "Prontidão hoje 47; fechamento da semana 56" já explica a diferença para quem usa dados reais, e o retrato da demo pode ser marcado como fictício.

**Item 4 e 5.** São decisões de produto, não defeito de dado. Ficam nas Tarefas 19 e 20.

## Como foi corrigido (demo)

- `buildDemoPlanning`: depois dos planos históricos, cria um plano por dia estudado até ontem, com uma atividade por sessão. A cada terceira atividade o plano previa 25% a mais do que foi feito, então a execução fica parcial em parte dos dias, como numa semana real.
- `generateDemoData`: `placeRecentDemoCompletions` move três tópicos já concluídos para os últimos 3 dias.
- `demo-scenario.json`: `weeklyTopics` e `monthlyTopics`.

## Verificação

- 12 testes novos, rodados com quatro datas de "hoje" (sexta, domingo, segunda e quarta) para não depender do dia da semana: toda sessão dos últimos 14 dias está ligada ao plano, o plano dos 7 dias cobre os dias estudados com volume entre 60% e 130%, a meta semanal é de tópicos e há tópico concluído nos últimos 3 dias.
- Antes da correção os dois primeiros testes falhavam (9 sessões sem vínculo e 3 de 7 dias com plano).
- Durante a verificação apareceram falhas que **não** vinham desta tarefa: 5 capturas da aderência estavam velhas por causa do aumento do texto em Desempenho (commit `fb27951`), e um E2E de Planejamento esperava um texto antigo ("revise antes de confirmar"). Confirmei que falhavam também com a demo original, atualizei as capturas depois de ver o diff (só o texto mudou de tamanho) e corrigi o texto esperado.
