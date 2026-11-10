# Desempenho: análise de conteúdo, personas e críticas, e como distribuir para subir a nota

Base: 8 rodadas de crítica em 10/11/2026 (26, 27, 26, 26, 27, 27, 27, 27 de 40), as avaliações A e B de cada uma, as três personas (Alex, Sam, Casey) e o inventário da aba medido na demo de 140 dias.

## 1. Por que a nota não passa de 27

A nota é a soma de 10 heurísticas. Nas últimas quatro rodadas o placar foi sempre o mesmo:

| Heurística | Nota | O que a segura |
|---|---|---|
| 4. Consistência e padrões | 2 | Mesma grandeza com valores diferentes (aderência 96%, 76,9%, 67,7%, 0%; Prontidão 46, 53, 56; turno 68% e 69%) |
| 6. Reconhecimento em vez de memória | 2 | É preciso lembrar qual janela vale em cada bloco (7 dias, 30 dias, histórico, semana atual) |
| 8. Estética e minimalismo | 2 | Visão geral com mais de 8 blocos; Disciplinas com 5.079 px; as mesmas estatísticas 3 vezes |
| 1, 2, 3, 5, 7, 9, 10 | 3 | Bons, mas nenhum chega a 4 |

Os defeitos mecânicos (contraste, ARIA, nomes, overflow, alvos de toque) já estão zerados e não movem mais a nota. O que move é a distribuição do conteúdo. Para chegar a 32 são necessários 5 pontos: subir as três heurísticas de 2 para 3 (+3) e duas de 3 para 4 (+2).

| Meta | Pontos | O que precisa ser verdade |
|---|---|---|
| H4 de 2 para 3 | +1 | Uma grandeza, um valor por tela, sempre com o selo da janela |
| H6 de 2 para 3 | +1 | Nenhum número exige que o aluno lembre a janela de outro bloco |
| H8 de 2 para 3 | +1 | Cada subaba tem orçamento de blocos abertos e uma pergunta só |
| H1 de 3 para 4 | +1 | O estado da preparação visível em uma frase e uma barra, e o estado de evidência de cada bloco no cabeçalho dele |
| H10 de 3 para 4 | +1 | Definição no ponto de uso (termo com explicação ao lado), em vez de glossário fechado no fim |

## 2. O conteúdo da aba hoje (inventário medido)

| Subaba | Altura | Blocos abertos | Dobras | O que contém |
|---|---|---|---|---|
| Visão geral | 1.969 px | 4 | 19 | Leitura da preparação; O que mudou depois das recomendações; Resumo do período (com 7 dias); Como sua preparação evoluiu (5 KPIs); dobras de trajetória, comparação e glossário |
| Por disciplina | 5.079 px | 10 | 6 | Comparação entre disciplinas; Mapa de estabilidade; disciplina escolhida; Evolução da precisão; Matriz Pedagógica; Balanço tempo × peso; Radar de vulnerabilidades; Queda de retenção |
| Diagnóstico | 2.093 px | 3 | 11 | Situação do preparo; Extrato Diagnóstico do Edital (3 cartões e +294); Replanejamento da semana |
| Questões | 2.097 px | 3 | 1 | Resultado das questões; Precisão por disciplina; Evolução da precisão |
| Simulados | 1.037 px | 2 | 1 | Resultado e evolução dos simulados |
| Inteligência da prova | 2.957 px | 1 (com muitos controles) | 5 | Filtros, matriz, quadrantes, lista de divergências |
| Ritmo e aderência | 3.702 px | 10 | 10 | Síntese; Linha do tempo; Execução do plano (4 KPIs); O que mudou?; Eficiência e energia por turno; Foco profundo por turno; Consistência de estudos (referência de ritmo); calendário |
| Conquistas e histórico | 999 px | 3 | 3 | Progresso, conquistas e sessões |

Leitura do inventário: duas subabas estão fora de proporção. **Por disciplina** acumula análise, diagnóstico e radar. **Ritmo e aderência** abre com 10 blocos. A Visão geral já está curta (1.969 px), mas ainda repete números.

## 3. As personas e o que cada uma precisa da aba

| Persona | Pergunta que traz | O que ainda falha | Onde está o conteúdo certo |
|---|---|---|---|
| **Alex**, concurseiro de rotina, quer agir | "O que faço agora?" | Vê 46, 53 e 56 na mesma tela; além de "Abrir em Hoje", o resumo e o Radar ainda oferecem outros caminhos; no celular a ação fica a mais de 1.000 px | Leitura da preparação (o que fazer) |
| **Sam**, analítico e ansioso | "Posso confiar nesses números?" | Aderência com quatro valores; "0%" e "−90 p.p." da semana atual; "Críticas: 16, Consolidadas: 0" assusta; faixa de 24 pontos | Selo de janela por número; estado da evidência no cabeçalho do bloco |
| **Casey**, celular, pouco tempo | "Em 30 segundos, como estou?" | Antes do conteúdo vêm cabeçalho, abas e filtros; "O que fazer" vem depois de seis linhas | Número da Prontidão com barra e frase de estado no topo |

Regra que sai das três: **o aluno lê, na ordem, um estado, um motivo e uma ação; o resto é consulta.**

## 4. O que as críticas anteriores repetem (e o que já foi tratado)

| Tema recorrente | Status |
|---|---|
| Números concorrentes para a mesma grandeza | Parcial: janelas escritas em frases; falta o selo em todos os números |
| Mais de uma "próxima ação" | Tratado: um botão sólido ("Abrir em Hoje"), links nos demais, Radar secundário |
| Evidência insuficiente tratada como ausência | Parcial: vazios explicados; faltam os títulos de "queda de retenção" (feito agora) e de "oportunidade" |
| Hierarquia: o número central não domina | Em andamento: barra e tendência na Prontidão (feito agora) |
| Profundidade e repetição | Parcial: resumo sem repetir variação, questões e sessões (feito agora) |
| Mobile: ação longe do topo | Parcial: filtros em uma linha; "O que fazer" sobe, mas continua abaixo de 1.000 px |
| Visualizações que não discriminam | Parcial: matriz com zoom; o donut ficou |
| Referência sem fonte (benchmark) | Tratado: "Referência interna de ritmo" |

## 5. Como o conteúdo deve ser distribuído

### Princípio: cada subaba responde uma pergunta e tem um orçamento

| Subaba | Pergunta única | Orçamento (desktop) | Papel |
|---|---|---|---|
| Visão geral | Como estou, o que pesa, o que faço? | até 1.600 px, 4 blocos abertos | Resumo; nenhum número novo que não esteja em outra subaba |
| Por disciplina | Onde estou melhor e pior? | até 2.500 px, 4 blocos | Comparação, Mapa de estabilidade, detalhe da disciplina escolhida |
| Diagnóstico | Quais lacunas existem e por quê? | até 2.500 px | Matriz, Balanço, Radar, queda de retenção, diagnóstico por tópico |
| Questões | Como vão minhas questões? | até 2.000 px | Como hoje |
| Simulados | Como vão meus simulados? | até 1.100 px | Como hoje |
| Inteligência da prova | O que a banca privilegia? | até 2.500 px | Resumo e lista; filtros recolhidos |
| Ritmo e aderência | Estou cumprindo o plano? | até 2.600 px, 5 blocos | Síntese, linha do tempo, execução do plano; o resto em dobras |
| Conquistas e histórico | O que já construí? | como hoje | Fecho positivo |

### Movimentos concretos, por impacto na nota

1. **Selo de janela em todo número de aderência, simulado e turno** (H4 e H6). Quatro janelas fixas: "7 dias", "período", "semana atual", "histórico". Cada percentual traz o selo e nenhuma frase precisa explicar a janela. Hoje só a leitura e a síntese têm selo.
2. **Mover Matriz, Balanço, Radar e Queda de retenção de "Por disciplina" para "Diagnóstico"** (H8). Por disciplina cai de 5.079 para perto de 2.500 px e passa a ter uma pergunta só. Radar e Matriz são diagnóstico, não comparação entre disciplinas.
3. **Fundir "Eficiência e energia por turno" e "Foco profundo por turno"** em Ritmo e aderência (H4 e H8). São o mesmo assunto em duas janelas (histórico e período). Um bloco, com dois selos.
4. **Recolher "Execução do plano" em dobra** quando o estado de dobras abertas for preservado ao redesenhar (H8). Foi tentado e revertido porque o seletor de semanas perdia o foco. Preservar o estado das dobras é o pré-requisito.
5. **Estado da evidência no cabeçalho de cada bloco** (H1): um selo curto ("amostra pequena", "sem dados suficientes", "confiança baixa") junto do título, em vez de só no corpo.
6. **Definição no ponto de uso** (H10): termos técnicos (Prontidão, Domínio, Retenção, Incidência, crédito ao plano) com explicação curta em linha (`<abbr>` ou texto de apoio), mantendo o glossário como complemento.
7. **Leitura no celular**: hoje a ação vem depois de seis linhas. Opções: barra fixa "Abrir em Hoje" ao rolar, ou subir o "O que fazer" logo abaixo do número da Prontidão.
8. **Inteligência da prova**: recolher os filtros (5 mais "Mais filtros") em uma linha de resumo, como nos filtros do celular, e mostrar primeiro o resumo e as divergências priorizadas.

### O que sai da vista (sem perder acesso)

- "Período atual × anterior" e o detalhamento da Prontidão já estão em dobra; mantêm.
- "O que mudou depois das recomendações" só aparece com resultado medido; mantém.
- Conteúdo duplicado: 463 questões, 68,7% e +5,3 p.p. aparecem em Resumo, KPIs e Questões. Fica no KPI da Visão geral e em Questões; o Resumo não repete (feito agora).
- Donut de tempo por disciplina: já em dobra.

## 6. Estimativa honesta

- Os movimentos 1, 2 e 3 mexem em H4, H6 e H8: de 27 a cerca de 30 se a revisão reconhecer os três.
- Os movimentos 5 e 6 são os que levam H1 e H10 a 4: de 30 a 32.
- Não há garantia: a nota vem de uma revisão por um modelo com os dados da demo, e a variação entre rodadas foi de ±1 mesmo sem mudança de conteúdo. Medir de novo depois dos movimentos 1 a 3 antes de decidir o resto.
- Parte do que a revisão critica vem dos dados fictícios da demo (semana atual com 0% de crédito apesar de 6 dias ativos). Convém confirmar com dados reais antes de tratar como defeito de produto.

## 7. Decisões que dependem de você

1. Mover Matriz, Balanço, Radar e Queda de retenção de "Por disciplina" para "Diagnóstico" muda rotas, testes E2E e capturas. Pode?
2. Quatro janelas fixas ("7 dias", "período", "semana atual", "histórico") como vocabulário oficial: aceita esses nomes?
3. Preservar o estado das dobras em Desempenho (pré-requisito para recolher a aderência): entra agora ou fica para depois?
4. No celular, a ação sobe para logo abaixo do número da Prontidão ou vira barra fixa?
