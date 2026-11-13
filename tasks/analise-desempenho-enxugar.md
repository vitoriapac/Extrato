# Desempenho: o que sobra, o que diverge e como enxugar

Base: leitura completa das 8 seções da aba na demo de 140 dias (13/11/2026, desktop 1440 e celular 375), o inventário e as personas de [analise-desempenho-distribuicao.md](analise-desempenho-distribuicao.md) e as cinco críticas `/impeccable` de 12 e 13/11 (27, 28, 27 de 40 na aba; observações menores e personas Alex, Sam, Casey e "concurseira em sessão longa").

Leitura como estudante analítico: para cada número, perguntei "de qual janela, sobre qual base, e ele bate com o mesmo número em outra subaba?".

## 1. Resumo em cinco linhas

1. A aba responde quatro vezes à pergunta "qual é o meu ponto mais fraco?" e dá quatro respostas diferentes.
2. Há pelo menos sete janelas de tempo convivendo (7 dias, 30 dias, 12/10–09/11, 16/10–30/10, semana atual, 52 semanas, todo o histórico), e várias telas misturam duas ou três.
3. As mesmas grandezas (Prontidão, precisão, simulado, carga, domínio, retenção, confiança) aparecem com valores, escalas e nomes diferentes.
4. Existem quatro portas para replanejar e quatro visões "por disciplina", espalhadas por quatro subabas.
5. Para um iniciante, quase tudo abaixo da Leitura da preparação é ruído. Para um avançado, o conteúdo útil existe, mas está escondido em ~48 dobras e misturado com repetições.

## 2. Inventário atual (medido)

| Seção | Altura desktop | Blocos visíveis | O que contém |
|---|---|---|---|
| Visão geral | 1.843 px | 4 + 3 dobras grandes | Leitura da preparação; O que mudou depois das recomendações; Resumo do período (alerta de simulados + 7 dias em dobra); Como sua preparação evoluiu (3 KPIs); dobras: Prontidão/trajetória/carga (projeção, plano de recuperação, simulador, histórico, fatores, calibração), Comparação/plano/mudanças, Glossário |
| Disciplinas | 3.070 px | 4 | Comparação entre disciplinas (ordenável, 6 critérios); Mapa de estabilidade (4 grupos); disciplina escolhida (precisão, domínio, retenção, tendência); Atividade e tópicos |
| Diagnóstico | 3.554 px | 5 + 2 dobras | Situação do preparo (47/100, 90 dias, 194 tópicos, meta semanal 0 de 12, riscos 14, oportunidades 305); Extrato Diagnóstico do Edital (sugestão fora do plano + 3 tópicos + "+294"); Recuperação e revisões; Sinais; Replanejamento da semana; Matriz Domínio × Retenção; dobras: Balanço tempo × peso, Radar de vulnerabilidades, Queda de retenção, Mapa de lacunas, Replanejamento pós-simulado, Retenção por tópico |
| Questões | 2.386 px | 3 + 1 dobra | Resultado; Precisão por disciplina; Evolução da precisão; dobra: volume × precisão, perfil de erros, tópicos em evolução |
| Simulados | 1.336 px | 2 + 1 dobra | Resultado; Evolução; dobra: comparação por disciplina, projeção × resultado |
| Inteligência da prova | 3.170 px | 1 bloco com 5 níveis | Saúde da evidência; Qualidade do histórico; Incidência × domínio (filtros, quadrantes, 217 sem posição); Configuração × histórico; Prova × Você; Importar prova |
| Ritmo e aderência | 2.969 px | 6 + 4 dobras | Resumo do período (96,2%, faltam 1h23); Linha do tempo diária; Tempo por disciplina; Execução do plano (dobra); O que mudou (semana atual); Turnos (rendimento histórico + foco no período); Calendário/heatmap (52 semanas); Referência interna de ritmo (7 dias) |
| Conquistas | 1.463 px | 2 + 2 dobras | Tempo por disciplina + extrato de sessões (dobra); 17 conquistas; próximas 7; Evolução, progresso por disciplina e radar (dobra) |

Total: ~19.800 px de conteúdo, 48 `<details>` no painel, 386 botões só em Ritmo e aderência (334 do heatmap).

## 3. Divergências (o mesmo assunto, respostas diferentes)

### 3.1 "Qual é o meu ponto mais fraco?" tem quatro respostas

| Onde | Resposta | Critério implícito |
|---|---|---|
| Visão geral → O que mais pesa | Informática e TIC (Ferramentas de trabalho remoto, domínio 38) e Vendas (domínio 38) | Domínio do tópico × impacto configurado |
| Disciplinas → Comparação | Língua Inglesa (52,4%) e Comportamentos Digitais (53,7%) | Distância da meta de precisão |
| Questões → Precisão por disciplina | Informática e TIC aparece com **85%** de precisão, entre as melhores | Precisão na disciplina inteira |
| Diagnóstico → Matriz | Matemática Financeira (domínio 47%, retenção 55%) no canto mais fraco | Domínio × retenção médios |
| Disciplinas → Mapa de estabilidade | Matemática Financeira em "Evoluindo, +24 p.p." | Tendência |

O estudante analítico vê "Informática é o que mais pesa" e, duas abas depois, "Informática 85%, uma das melhores". As duas coisas podem ser verdade (um tópico fraco dentro de uma disciplina forte), mas a tela não diz isso. Fere o princípio "Uma prioridade só" do PRODUCT.md.

### 3.2 Mesmas grandezas com valores, escalas e nomes diferentes

| Grandeza | Valores encontrados | Problema |
|---|---|---|
| Prontidão | 47 (Leitura, Situação do preparo, cabeçalho do app); 56 (último fechamento); "0 pontos" de variação | A tendência "estável" fala do fechamento; o número grande é o cálculo de hoje. Já há frase explicando (commit fb27951), mas o 56 continua na mesma tela |
| Precisão em questões | 68,3% (Visão geral, Questões ×3); 73% (Referência de ritmo, 7 dias); 72/61/51% por turno (todo o histórico) | Três janelas, sem que a de 73% diga ao lado que é de 7 dias no número |
| Simulados | 81% central, 3 comparáveis, todo o histórico (Resumo); 80% média recente de 5 simulados (fator da Prontidão); 83,8% último, 80,7% média, 2 simulados (Simulados, 30 dias) | Três contagens (3, 5, 2) e três médias (81, 80, 80,7) para "como vou nos simulados" |
| Carga / volume do plano | 286% (7 dias, Leitura); 96,2% (30 dias, Ritmo); "faltam 1 h 23 min" (Ritmo); "720 min/semana de capacidade" (Diagnóstico) | 7 dias tem só 4 h 25 min planejados contra 12 h de capacidade semanal: o leitor não sabe se o plano está curto ou se ele estudou demais. "Ajustar plano" aparece nas duas leituras opostas |
| Aderência | 0% semana atual; 66,7% aderência ao plano; 80% execução prioritária; 80% meta pessoal | Quatro números com nome parecido; 80% coincide com a meta |
| Domínio | "domínio 38 (de 0 a 100)" (Leitura); "domínio 47%" (Matriz); "61/100" (Disciplinas) | Mesma grandeza em /100 e em %; tópico e disciplina misturados |
| Retenção | "caiu de 100 para 86" (fator da Prontidão); "retenção 50–62%" (Matriz); "55/100" (Disciplinas) | Fator do índice e retenção estimada dos tópicos levam o mesmo nome |
| Confiança | "confiança Média" (índice, Diagnóstico); "confiança baixa" (faixa projetada); "Qualidade da evidência: Baixa"; "Evidência: baixa" (ação) | Quatro confianças com o mesmo vocabulário, sem dizer de quê |
| Meta | 80% (simulado); 80% (aderência pessoal); "alvo 78–84%" (referência de ritmo); "meta semanal de tópicos 0 de 12" | O aluno não sabe qual meta é a dele |
| Situação geral | "Tendência: estável" (Leitura); "Atenção" (Resumo); "Ritmo abaixo do necessário" (Diagnóstico); "Construindo consistência" (Ritmo) | Quatro rótulos de estado, com tons diferentes, na mesma visita |

### 3.3 Janelas de tempo

Na mesma visita com o filtro em "Últimos 30 dias" (15/10 a 13/11) aparecem:

- 30 dias (KPIs, Questões, Disciplinas, Ritmo)
- 12/10 a 09/11 (gráfico de Questões, por semanas fechadas)
- 19/10 a 09/11 (evolução de uma disciplina)
- 16/10 a 30/10 (Simulados)
- 7 dias (Leitura, Referência de ritmo, Resumo dos 7 dias)
- semana atual (O que mudou?, aderência 0%)
- 52 semanas (heatmap)
- todo o histórico (turnos, faixa projetada, conquistas)
- "período definido nos filtros de sessões" (Conquistas)

A linha "comparação: 15/09/2026 a 14/10/2026" aparece no topo de todas as subabas, inclusive onde nada é comparado (Diagnóstico, Inteligência da prova).

### 3.4 Coerência interna duvidosa (conferir com dados reais)

- "Matriz Pedagógica": 17 de 17 disciplinas fora de "Consolidada" (Consolidadas 0, Prioridade alta 16). Uma visualização em que tudo é crítico não discrimina nada e assusta o Sam.
- "305 oportunidades" e "+294 diagnósticos" num edital de 305 tópicos: quase todo tópico vira oportunidade.
- "Meta semanal de tópicos 0 de 12 (0%)" ao lado de 286% de carga em 7 dias.
- Parte disso pode vir dos dados fictícios da demo. Precisa ser conferido com dados reais antes de virar defeito de produto.

## 4. Repetições (o mesmo conteúdo em mais de um lugar)

| Conteúdo | Onde aparece |
|---|---|
| Ferramentas de trabalho remoto como prioridade | Leitura (O que fazer e O que mais pesa), Diagnóstico (Sugestão fora do plano e item 1 do Extrato) |
| Queda de 21 p.p. à noite | Ritmo (três frases seguidas no mesmo bloco de turnos) e Diagnóstico |
| "Melhor rendimento na manhã" | Ritmo, três vezes no mesmo bloco |
| Faixa projetada 69–93% | Leitura, Resumo do período, Prontidão/trajetória, Simulados (Projeção × resultado) |
| "Faixa emitida × resultado posterior" | Visão geral (dobra de fatores) e Simulados |
| 463 questões / 68,3% / +4,9 p.p. | Visão geral (KPI e frase "Como sua preparação evoluiu"), Questões (resumo, cartões e rótulo do gráfico) |
| Tempo por disciplina | Ritmo ("Distribuição do tempo por disciplina") e Conquistas ("Tempo de estudo por disciplina e extrato") |
| Visão por disciplina | Disciplinas (comparação + mapa), Questões (precisão por disciplina), Diagnóstico (Matriz, Balanço, Radar de vulnerabilidades), Conquistas (Progresso por disciplina, Radar de disciplinas) |
| Dois "radares" | Radar de Vulnerabilidades (Diagnóstico) e Radar de disciplinas (Conquistas), com critérios diferentes |
| Replanejar | "Ajustar plano" (Leitura, Ritmo), "Ver plano de recuperação" (Visão geral), "Replanejamento da semana" e "Replanejamento pós-simulado" (Diagnóstico), "Pré-visualizar no plano" (Extrato) |
| Abrir Hoje | "Abrir em Hoje" (Leitura), "Abrir Hoje" (Situação do preparo), "Seguir o plano é decidido na aba Hoje" (Extrato) |
| Retenção | Queda de retenção entre avaliações, Retenção por tópico, Matriz (eixo), Disciplinas (retenção média), fator da Prontidão |
| "Copiar link" | Em cada cartão; 5+ vezes por subaba |

## 5. O que é útil para quem

### Iniciante (primeiras semanas, poucos dados, quer saber o que fazer)

| Útil | Por quê |
|---|---|
| Leitura da preparação: O que fazer + Prontidão com barra | Uma ação, um número |
| Tempo estudado e questões no período | Confirma que o registro funciona |
| Conquistas | Única parte que dá sensação de ganho |
| Mensagens de "amostra pequena" | Protegem de conclusões precoces |

Ruído para o iniciante: Matriz, Radar, Balanço, Inteligência da prova inteira, turnos, referência de ritmo por carreira, calibração da projeção, simulador de cenário, "+294 diagnósticos". Com poucos dados, quase tudo isso mostra "sem amostra" ou números instáveis que assustam.

### Avançado (meses de dados, quer decidir onde mexer)

| Útil | Onde está hoje | Problema |
|---|---|---|
| Comparação entre disciplinas ordenável | Disciplinas | Boa; concorre com Matriz, Radar e Precisão por disciplina |
| Evolução da precisão (média móvel, mínimo 30) | Questões | Boa |
| Incidência × domínio | Inteligência da prova | Boa, mas com 5 filtros, quadrantes e 217 sem posição antes da lista |
| Diagnóstico por tópico | Diagnóstico | Útil nos 3 primeiros; "+294" sem filtro nem agrupamento |
| Execução do plano por semana | Ritmo (dobra) | Útil, mas atrás de 4 números de aderência |
| Rendimento por turno | Ritmo | Útil uma vez; repetido 3×, histórico e período lado a lado |
| Projeção × resultado | Simulados / Visão geral | Útil para calibrar confiança; duplicado |

Ruído também para o avançado: os quatro estados de situação, as quatro confianças, as frases que repetem o número do cartão ao lado, os "Copiar link", a referência de ritmo "sem fonte oficial" (bom saber, mas compete com a meta pessoal).

### O que as personas das críticas anteriores pediam e ainda falta

| Persona | Pedido | Situação |
|---|---|---|
| Alex (rotina, quer agir) | Uma ação só; diagnóstico com filtro ou agrupamento | Ação única na Leitura: ok. Diagnóstico "+294" sem filtro: falta. Sem atalho entre subabas |
| Sam (analítico, ansioso, teclado) | Saber a janela e a base de cada número; não ser assustado | Selos existem em parte; quatro "confianças"; Matriz com 16 críticas; 48 dobras |
| Casey (celular, 30 segundos) | Estado e ação no topo | Ação a 516 px: ok. Página de até 4.885 px; abas em 2 linhas |
| Concurseira em sessão longa | Não rolar 3.000 px; texto confortável | Piso de 13–14 px feito; páginas ainda longas |

Observações menores recorrentes ainda abertas: "calculada agora" sem data; "Concurso ativo · 2 escopos" sem explicação; "Copiar link" repetido; gráfico de precisão sem linha da meta; Conquistas sem os emblemas ilustrados na subaba; linha de comparação no topo de subabas que não comparam.

## 6. Princípio para enxugar

Cada subaba responde uma pergunta, tem uma janela padrão escrita no título e não repete um número que é de outra subaba (no máximo um link para ela).

Regra de leitura: **estado → motivo → ação; o resto é consulta.**

Vocabulário fixo (proposta):

| Termo | Significa | Escala |
|---|---|---|
| Prontidão | Índice global, calculado agora | /100 |
| Fechamento | Retrato congelado de uma semana | /100, com data |
| Precisão | Acertos ÷ questões pessoais | % |
| Domínio | Desempenho estimado de tópico ou disciplina | /100 (nunca %) |
| Retenção | Memória estimada do tópico | /100 (o fator da Prontidão vira "fator Retenção") |
| Volume do plano | Minutos estudados ÷ planejados | % |
| Aderência | Minutos com crédito ao plano ÷ planejados | % |
| Evidência | Quanto confiar num número (um só selo: suficiente, pequena, insuficiente) | — |

"Confiança" passa a valer só para a faixa projetada.

## 7. Nova distribuição (proposta)

De 6 abas + 3 subabas (9 destinos) para 5 abas sem segundo nível.

| Aba nova | Pergunta | Janela padrão | Fica | Sai ou muda |
|---|---|---|---|---|
| **Visão geral** | Como estou e o que faço agora? | período escolhido | Leitura da preparação (ação, Prontidão + data do fechamento numa linha, até 2 pontos que pesam); 3 KPIs (tempo, questões, precisão) com variação; 1 linha de alerta | Resumo do período (o alerta vira a linha de alerta); "Como sua preparação evoluiu" vira legenda dos KPIs; dobras de trajetória, comparação e glossário vão para as abas donas (Projeção → Provas; Planejado × realizado → Ritmo; glossário → Ajuda, com definição no ponto de uso) |
| **Disciplinas** | Onde estou melhor e pior? | período | Comparação ordenável (uma régua por disciplina: precisão, domínio /100, saldo do plano); disciplina escolhida com tópicos | Mapa de estabilidade vira um modo de ordenação ("Tendência") da Comparação; Precisão por disciplina sai de Questões; Progresso por disciplina e Radar de disciplinas saem de Conquistas |
| **Diagnóstico** | Quais lacunas atacar e por quê? | estado atual | Extrato do Edital agrupado por disciplina, com filtro (prioridade, evidência) e os 3 primeiros abertos; Matriz só quando discrimina (com ao menos um quadrante não crítico) ou como alternativa em lista; Queda de retenção | "Situação do preparo" sai (Prontidão já está na Visão geral; dias e tópicos vão para o cabeçalho do Extrato); Radar de vulnerabilidades e Balanço viram colunas/ordenações do Extrato; Replanejamento da semana e pós-simulado vão para Planejamento (Metas), com um link; Sugestão fora do plano não repete o item 1 |
| **Provas** (antes "Questões e provas") | Como vou nas questões e simulados, e o que a banca cobra? | período (questões e simulados); histórico (banca) | Uma página com três seções: Questões (resultado + evolução + erros), Simulados (resultado + evolução + projeção × resultado, a única faixa projetada detalhada), Inteligência da prova (lista priorizada primeiro, filtros recolhidos, matriz em dobra) | Fim do segundo nível de abas; faixa projetada sai do Resumo e da dobra de fatores |
| **Ritmo** | Estou cumprindo o plano? | período, com semana atual em destaque | Um número de volume do plano + um de aderência (com explicação da diferença em uma linha); execução por semana; turnos (um bloco, uma frase de leitura); calendário | Os quatro números de aderência viram dois; "O que mudou?" funde com execução por semana; Referência de ritmo por carreira vai para uma dobra "Comparar com referência" (é a única fonte de "alvo" que não é do aluno); Tempo por disciplina fica só aqui |
| Conquistas | — | — | Vira seção no fim da Visão geral ou vai para Início (Visão Geral do app), com os emblemas | Extrato de sessões vai para Ritmo (é registro de execução) |

Estimativa: de ~19.800 px para ~10.000 px; de 48 para ~15 dobras; uma resposta para "ponto mais fraco" (a do Diagnóstico, citada por link nas outras).

## 8. Plano em fases

Cada fase é verificável sozinha e pode ser medida com `/impeccable critique` antes da próxima.

### Fase 1: coerência sem mudar a navegação (baixo risco)

1. Vocabulário da seção 6 aplicado nos textos: domínio sempre /100; retenção do fator vira "fator Retenção"; "confiança" só na faixa projetada; demais selos viram "Evidência".
2. Uma linha de Prontidão: "Prontidão 47 hoje · fechamento de 08/11: 56". A tendência passa a dizer "entre fechamentos".
3. Selo de janela em todo número de precisão, simulado, aderência e turno (completa o movimento 1 da análise anterior); o 73% da referência ganha "7 dias" no número.
4. Linha "comparação: dd/mm a dd/mm" só nas subabas que comparam.
5. Turnos: uma frase de leitura em vez de três; rendimento e foco num bloco com dois selos.
6. "O que mais pesa" e Questões: quando um tópico fraco está numa disciplina forte, dizer isso ("tópico fraco dentro de Informática, que tem 85% de precisão").

### Fase 2: cortar repetições (médio risco, sem mudar rotas)

1. Visão geral: remover "Resumo do período" como cartão (o alerta vira linha na Leitura); remover a frase de "Como sua preparação evoluiu" que repete o KPI.
2. Diagnóstico: tirar "Situação do preparo"; não repetir a Sugestão fora do plano quando ela é o item 1.
3. Faixa projetada e "Faixa emitida × resultado" só em Simulados; Visão geral mostra a faixa em uma linha com link.
4. Tempo por disciplina só em Ritmo; Conquistas perde a dobra de sessões e de radar.
5. "Copiar link" sai dos cartões e fica um por subaba (no título), ou vai para o menu do cartão.

### Fase 3: reorganizar as abas (alto risco; muda rotas, E2E e capturas)

1. Questões, Simulados e Inteligência da prova numa aba "Provas" sem segundo nível.
2. Matriz/Balanço/Radar viram ordenações ou colunas do Extrato do Diagnóstico; Extrato agrupado por disciplina com filtro.
3. Mapa de estabilidade vira ordenação da Comparação.
4. Replanejamentos vão para Planejamento.
5. Conquistas sai das abas de análise.
6. Rotas antigas (`#desempenho/questions`, `/simulations`, `/exam`, `/history`) redirecionam para as novas.

### Fase 3B: Conquistas em Hoje (detalhe na seção 11)

1. Registrar a data de desbloqueio de cada conquista (no estado, sem recalcular o passado; backup e demo não disparam avisos antigos).
2. Aviso de desbloqueio (popup não bloqueante, acessível, agrupando várias).
3. Resultado da sessão em Hoje: conquista ganha ou a mais perto, com quanto falta.
4. Marca no plano do dia quando uma atividade completa uma conquista (no máximo uma por dia).
5. Subaba "Conquistas" em Hoje com a galeria; Desempenho perde a subaba; `#desempenho/history` redireciona.
6. Extrato de sessões e tempo por disciplina vão para Ritmo; progresso e radar por disciplina vão para Disciplinas ou saem.

Aceite: um teste unitário para a regra de "perto" e de desbloqueio único; E2E que registra uma sessão na demo e vê o aviso e o resultado.

### Fase 3C: referência de ritmo com base verificável (detalhe na seção 12)

1. Corrigir textos sem fonte: comentário de `career-benchmarks.ts`, "Faixa Competitiva", "Nível Reta Final", "Padrão de nota de corte para as primeiras colocações", "Recomendado".
2. Horas e questões por semana: rótulo "sugestão de cursinhos, sem pesquisa com aprovados" e comparação com a capacidade do próprio plano.
3. Precisão: comparar com a nota de corte do concurso ativo quando cadastrada (banca, cargo, praça, ano, fonte); sem ela, a meta do aluno.
4. Tarefa de dados separada: cadastrar notas de corte oficiais no catálogo, lidas nos resultados das bancas.

### Fase 4: iniciante × avançado

- Até haver dados suficientes (por exemplo, menos de 30 questões ou 2 semanas de registro), a aba mostra só Visão geral e Ritmo; as outras abas aparecem com um estado vazio que explica quando ficam úteis.
- Para o avançado: atalho de teclado entre abas e lembrança da última ordenação/filtro.

## 9. Decisões tomadas (13/11/2026)

| # | Decisão | Escolha |
|---|---|---|
| 1 | Resposta oficial para "ponto mais fraco" | **A.** O critério do Diagnóstico (lacuna × impacto na prova) é o oficial. As outras telas mostram seus números, citam o Diagnóstico por link e não usam a palavra "prioridade" |
| 2 | Vocabulário e escalas | **A.** Domínio e retenção sempre em /100; o fator da Prontidão vira "fator Retenção"; "confiança" só para a faixa projetada; o resto é "Evidência" (suficiente, pequena, insuficiente) |
| 3 | Reorganizar as abas | **A.** Aba "Provas" sem segundo nível; Conquistas sai de Desempenho (destino na seção 11); replanejamentos vão para Planejamento; rotas antigas redirecionam |
| 4 | Referência de ritmo por carreira | **C.** Fica visível, mas com base verificável (análise na seção 12) |
| 5 | Modo iniciante | **A.** Todas as abas visíveis; as analíticas mostram estado vazio que diz quando ficam úteis |

## 10. Limites desta análise

- Medido na demo fictícia de 140 dias. Parte das incoerências (aderência 0% na semana atual, 16 de 17 disciplinas críticas, 4 h 25 min planejados em 7 dias contra 12 h de capacidade) pode ser dos dados, não do produto.
- Não abri todas as dobras de cada subaba, então algumas repetições dentro delas podem ter ficado de fora.
- As alturas são do desktop no painel do app; no celular as páginas ficam de 1,5 a 1,8× maiores.

## 11. Onde colocar as Conquistas

### O que existe hoje

- Subaba "Conquistas" em Desempenho: 17 desbloqueadas e 7 próximas, em três grupos (Consistência, Aprendizado, Estratégia), mais duas dobras que não são conquistas: "Tempo de estudo por disciplina e extrato de sessões" e "Evolução, progresso por disciplina e radar".
- Histórico: as conquistas saíram da Visão Geral do app em 02/11/2026 (tarefa C2 em [todo-visual.md](todo-visual.md)) para deixar o Início mais curto. Voltar com elas inteiras ao Início desfaz essa decisão.
- Não encontrei aviso no momento do desbloqueio (nenhum toast ou destaque no `achievements-controller.ts`). Hoje o aluno só descobre uma conquista se abrir a última subaba de Desempenho.

### O papel de uma conquista

Ela é um reforço de constância. Funciona quando aparece **no momento em que é ganha** e quando o aluno vê **a próxima ao alcance**. Uma galeria no fim de uma aba analítica não faz nenhum dos dois, e mistura motivação com diagnóstico, que tem tom sóbrio.

### Opções avaliadas

| Opção | A favor | Contra |
|---|---|---|
| A. Início (Visão Geral do app), galeria completa | Visível sempre | Desfaz o C2; Início volta a crescer |
| B. Hoje, no resultado da sessão | Aparece quando é ganha (fim positivo da sessão) | Não comporta a galeria inteira |
| C. Página própria no menu "Mais" (como Dados e Ajuda) | Galeria completa sem pesar em nenhuma aba | Pouco visível sozinha |
| D. Seção no fim de Desempenho, sem aba | Muda pouco | Continua escondida e no tom errado |

### Decisão (13/11/2026): Conquistas vivem em Hoje

1. **Aviso no desbloqueio (popup):** quando uma ação desbloqueia uma conquista (salvar sessão, registrar questões ou simulado, concluir tópico ou recomendação), aparece um aviso com o emblema ilustrado, o nome, o critério cumprido e o link "Ver conquistas".
   - Não bloqueia: fecha sozinho depois de alguns segundos, fecha com Esc e com o botão Fechar, e não rouba o foco do que o aluno estava fazendo.
   - Anunciado a leitores de tela (`role="status"`), respeita `prefers-reduced-motion` (sem animação do emblema).
   - Várias conquistas na mesma ação viram um aviso só ("2 conquistas: Cem horas e Mil questões").
   - Aparece uma vez por conquista: o desbloqueio fica registrado com data, e restaurar backup ou entrar na demo não dispara avisos antigos.
2. **Integrada ao plano de Hoje:**
   - No **resultado da sessão** (ao registrar): mostra o que foi desbloqueado nessa sessão ou, se nada foi, a conquista mais perto com o quanto falta ("Faltam 2 dias para Uma semana de foco", "Faltam 37 questões para Mil questões").
   - No **plano do dia**: quando uma atividade planejada, se concluída, completa uma conquista, ela leva uma marca discreta ("conclui Uma semana de foco"). No máximo uma marca por dia, para não competir com a prioridade do plano.
   - "Perto" tem regra fixa: falta até 10% do critério ou algo cumprível hoje (1 dia, 1 sessão, até 1 h, até 30 questões).
3. **Painel de conquistas numa subaba de Hoje** ("Conquistas"): galeria com os emblemas ilustrados, desbloqueadas (com data) e próximas (com barra de progresso e quanto falta), por grupo (Consistência, Aprendizado, Estratégia).
4. **Início:** sem bloco novo; no máximo a linha "17 de 24 conquistas", com link para a subaba.

Isso substitui a recomendação anterior (página no menu "Mais"). A rota `#desempenho/history` redireciona para a subaba de Hoje.
4. **O que sai junto da subaba:**
   - "Tempo de estudo por disciplina" e o extrato de sessões vão para Ritmo (é registro de execução).
   - "Evolução do progresso", "Progresso por disciplina" e "Radar de disciplinas" vão para Disciplinas como modos da Comparação, ou saem (o radar repete a Comparação com outro critério; ver decisão 1).
5. Rota antiga `#desempenho/history` redireciona para a página nova.

## 12. Referência de ritmo: o que dá para afirmar sobre aprovados

### O que o app diz hoje

[career-benchmarks.ts](../src/domain/analytics/career-benchmarks.ts) descreve as faixas como "benchmarks estatísticos de ritmo de aprovados por carreira". Para Bancária & Administrativa: 18–24 h/semana, 160–220 questões/semana, precisão 78–84%, mix 35/45/20. A interface já avisa "sem fonte oficial", mas o comentário do código e o rótulo "Faixa Competitiva" sugerem que são dados de aprovados. Não são: não há fonte citada no repositório.

### O que existe de dado público (pesquisa de 13/11/2026)

| Pergunta | Existe dado confiável? | O que encontrei |
|---|---|---|
| Horas por semana de aprovados | **Não** | Só recomendações de cursinhos e blogs (2 a 3 h/dia, 15–20 h/sem para nível médio, 25–35 h/sem para carreiras concorridas), sem pesquisa com aprovados. O Censo dos Concursos 2025 do Qconcursos (13.128 respondentes) mede frequência de quem estuda (45,7% estudam 3 a 5 vezes por semana), não de quem foi aprovado |
| Questões resolvidas por aprovados | **Não** | Números como "5.000 a 15.000 questões no total" vêm de sites comerciais sem metodologia |
| Mix teoria/questões/revisão | **Não** | Sugestões de cursinho (por exemplo 30% teoria e 70% questões para o BB), sem levantamento |
| Desempenho necessário na prova | **Sim, indiretamente** | As notas de corte publicadas pelas bancas são o único dado verificável sobre aprovados |

Notas de corte encontradas (precisam ser conferidas no resultado oficial da banca antes de entrar no app):

| Concurso | Banca | Dado | Fonte |
|---|---|---|---|
| Banco do Brasil 2023, Escriturário – Agente Comercial | Cesgranrio | Mínimo de 50% na objetiva e 70 na redação; notas de corte variaram de 52 a 85 pontos por microrregião (média citada 73,26) | Portais de concursos; o resultado oficial não ordena as notas |
| Caixa 2024, Técnico Bancário Novo | Cesgranrio | Mínimo de 50% no total e em cada bloco; menor nota citada 44,0 na ampla concorrência; estimativas de ranking acima de 85% em algumas praças | Blogs e rankings de candidatos (não oficiais) |
| CNU 2024 | Cesgranrio | Notas de corte por órgão e cargo publicadas pelo MGI; de 36,75 a 64,95 pontos (escala ponderada do bloco) | MGI, via portais |

Leitura honesta:
- A nota de corte varia muito por praça, cargo e cota, e as escalas são ponderadas (não são "percentual de acerto" direto).
- Precisão em questões de treino não é a mesma coisa que acerto na prova, porque o treino mistura dificuldades e bancas.
- Ou seja: dá para usar a nota de corte como **referência de prova**, não como meta de horas ou de questões.

### Decisão (13/11/2026): seguir a recomendação abaixo, mantendo a referência visível (decisão 4C)

1. **Precisão:** trocar a faixa genérica por carreira pela **nota de corte do concurso ativo**, quando ela estiver no catálogo de editais. Exemplo: "Nota de corte BB 2023 na sua microrregião: 73 pontos (Cesgranrio)". Mostrar a fonte e o ano. Sem nota cadastrada, usar a meta do próprio aluno (80%) e dizer isso.
2. **Horas e questões por semana:** deixar de chamar de "aprovados" e de "faixa competitiva". Rotular como "faixa sugerida por cursinhos, sem pesquisa com aprovados", ou comparar com o **próprio plano** do aluno (capacidade semanal já configurada), que é o dado que o app tem.
3. **Mix teoria/questões/revisão:** mesma regra; rótulo "sugestão", não "recomendado".
4. **Código:** corrigir o comentário de [career-benchmarks.ts](../src/domain/analytics/career-benchmarks.ts) e os rótulos "Faixa Competitiva", "Nível Reta Final" e "Padrão de nota de corte para as primeiras colocações", que hoje afirmam algo que não tem fonte. Isso também atende ao PRODUCT.md ("Não inventar").
5. **Dado novo:** cadastrar notas de corte oficiais no catálogo de editais (campo por cargo, praça, ano e fonte). Essa é uma tarefa de dados: exige ler os resultados oficiais da Cesgranrio, Cebraspe e FGV, e não pode ser preenchida com números de blog.

Fontes consultadas:
- [Passa no Concurso: quantas horas estudar](https://passanoconcurso.com.br/quantas-horas-estudar-concurso-publico)
- [Nominato: como estudar para concurso](https://nominato.app/guia/como-estudar-para-concurso/)
- [Criar Provas: quantas questões por dia](https://criarprovas.com/blog/quantas-questoes-resolver-por-dia-para-ser-aprovado-a-resposta-definitiva/)
- [Concurseiro Zero: rotina pré-edital BB](https://concurseirozero1.com.br/blog/rotina-estudos-pre-edital-banco-do-brasil/)
- [Capriata: prova BB 2023](https://capriatacursos.com.br/blog/prova-banco-do-brasil-2023-cesgranrio-escriturario-agente-comercial/)
- [Aprovados.org: nota de corte BB 2023](https://www.aprovados.org/nota-de-corte-banco-do-brasil-2023/)
- [Concursos.com.br: pontuação mínima BB](https://www.concursos.com.br/concurso-previsto/banco-do-brasil/concurso-do-banco-do-brasil-confira-a-pontuacao-minima-para-escriturario.html)
- [Central de Concursos: resultado Caixa técnicos](https://centraldeconcursos.com.br/noticia/concurso-caixa-divulgado-resultado-final-para-tecnicos-confira)
- [Gran: concurso Caixa](https://blog.grancursosonline.com.br/concurso-caixa/)
- [Nova Concursos: CNU nota de corte por cargo](https://www.novaconcursos.com.br/portal/noticias/cnu-nota-de-corte-por-cargo/)
- [IMP Concursos: CNU nota de corte](https://impconcursos.com.br/blogs/noticias/concurso-cnu-nota-de-corte)

Não pesquisei INSS, Polícia Federal e Receita Federal; ficam para quando as notas forem cadastradas no catálogo.

## 13. Decisões da segunda rodada (13/11/2026) e ordem de execução

| # | Ponto | Decisão |
|---|---|---|
| 1 | Por onde começar | Pelas Conquistas em Hoje (Fase 3B vira a primeira) |
| 2 | Data de desbloqueio | Registrar no estado, com migração do backup |
| 3 | Evolução do progresso, progresso por disciplina e radar | Viram modos da Comparação em Disciplinas; o radar fica como um desses modos |
| 4 | "Copiar link" | Um por subaba, no título |
| 5 | Modo iniciante | Limite sugerido: até 30 questões pessoais ou 2 semanas de registro, as abas analíticas mostram estado vazio explicando quando ficam úteis |

### Ordem nova

| Ordem | Tarefa | Detalhe |
|---|---|---|
| 1 | **T1. Conquistas em Hoje** | Seção 11 e Fase 3B. Começa pela migração (T1.1) |
| 2 | **T2. Investigar demo × produto** | Antes de corrigir números, saber a origem de cada incoerência |
| 3 | **T3. Números divergentes** | Corrigir o que T2 apontar como defeito de produto |
| 4 | Fase 1. Coerência de vocabulário e janelas | Inclui "Copiar link" um por subaba |
| 5 | Fase 2. Cortar repetições | |
| 6 | Fase 3. Aba Provas, replanejamentos em Planejamento, modos da Comparação | Inclui progresso e radar como modos |
| 7 | Fase 3C. Referência de ritmo com base verificável | Depende de T4 para a precisão |
| 8 | **T4. Notas de corte no catálogo** e **T5. Pesquisa de outros concursos** | Pode andar em paralelo, é tarefa de dados |
| 9 | Fase 4. Iniciante × avançado | Limite da decisão 5 |

### T1.1. Data de desbloqueio e migração

- Novo registro por conquista: id, data do desbloqueio e origem (`live` para desbloqueio observado no app, `migrated` para o que já estava desbloqueado antes da migração).
- Migração do esquema do backup: as conquistas já cumpridas recebem `migrated`, com a data mais antiga que o histórico permitir inferir (ex.: data da sessão que atingiu 100 horas) ou sem data quando não der para inferir. Nenhuma delas dispara aviso.
- Importar backup antigo passa pela mesma migração; entrar na demo não dispara avisos.
- O passado não é recalculado depois de gravado (princípio 4 do PRODUCT.md).
- Aceite: teste unitário da migração (backup sem o campo, backup já migrado, conquista cumprida sem data inferível) e teste de desbloqueio único.

### T2. Investigar se as incoerências vêm da demo ou do produto

Para cada item, reproduzir com dados controlados (fixture pequena com valores conhecidos) e com a demo, e classificar como **dado da demo**, **defeito de cálculo**, **defeito de apresentação** ou **comportamento correto mal explicado**.

| Incoerência | Hipótese a testar |
|---|---|
| Aderência de 0% na semana atual com 6 dias ativos | Gerador da demo não vincula sessões ao plano da semana atual, ou crédito só conta em semana fechada |
| 4h25 planejadas em 7 dias contra capacidade de 12 h/semana | Plano da demo incompleto, ou "planejado" usa outra base que a capacidade |
| 286% (7 dias) × 96,2% (30 dias) | Consequência do item anterior, ou janelas com bases diferentes |
| 16 de 17 disciplinas em "Prioridade alta" na Matriz | Distribuição artificial da demo, ou limiares da Matriz que não discriminam |
| 305 oportunidades e +294 diagnósticos em 305 tópicos | Todo tópico com importância vira oportunidade (regra) ou a demo marca todos |
| Meta semanal de tópicos 0 de 12 | Demo não conclui tópicos na semana, ou contagem só por conclusão formal |
| Informática com domínio 38 no tópico e 85% de precisão na disciplina | Correto (tópico fraco em disciplina forte) e mal explicado, ou domínio desatualizado |
| Prontidão 47 hoje × 56 no fechamento com "tendência estável" | Correto e mal explicado (já tem frase), ou fechamento antigo demais |

Entrega: tabela com a classificação de cada item, a evidência (teste ou captura) e o plano de correção:
- dado da demo → corrigir o gerador da demo (`src/demo`), sem mexer no cálculo;
- defeito de cálculo → corrigir na camada de aplicação, com teste;
- defeito de apresentação ou mal explicado → vai para T3 ou para a Fase 1.

### T3. Números divergentes dentro do app

Investigar e tratar, depois de T2:

| Divergência | Tratamento proposto |
|---|---|
| Simulado de 30/10 como 84% e 83,8% | Uma regra de arredondamento para simulados (uma casa decimal em todo lugar) |
| 3, 5 e 2 simulados em três telas | Escrever o critério e a janela junto da contagem ("3 comparáveis, todo o histórico"; "2 no período"); decidir se o fator da Prontidão usa o mesmo conjunto dos comparáveis |
| 81% central, 80% média recente, 80,7% média | Um nome por cálculo (resultado central da projeção, média do período) e só um deles por tela |
| Precisão 73% na referência de ritmo | Selo "7 dias" no número; conferir se a extensão automática para 28 dias (quando não há questões em 7 dias) está sinalizada |
| Precisão 68,3% × 72/61/51% por turno | Selo de janela; turnos já dizem "todo o histórico" |
| Aderência 0% / 66,7% / 80% / meta 80% | Dois números na tela (volume do plano e aderência), com a definição em uma linha |
| Domínio em % e em /100 | Sempre /100 (decisão 2 da seção 9) |
| Janelas de gráfico diferentes do filtro (12/10–09/11 com filtro de 30 dias) | Dizer "semanas fechadas dentro do período" ou alinhar o recorte ao filtro |

Aceite: cada divergência com teste unitário que fixa o valor e o rótulo; nenhuma tela mostra o mesmo número com arredondamento diferente.

### T4. Notas de corte no catálogo de editais

- Campo novo no catálogo por concurso: banca, cargo, praça ou microrregião, ano, modalidade de concorrência, nota de corte, escala (pontos, percentual, nota ponderada) e link da fonte oficial.
- Só entram valores lidos no resultado oficial da banca ou do órgão. Números de blog e ranking de candidatos ficam de fora.
- Começar pelos concursos já presentes no catálogo (BB, Caixa, CNU) e usar na Fase 3C.
- Aceite: validação do catálogo recusa nota sem fonte; a Referência de ritmo mostra "Nota de corte BB 2023, sua praça: X (Cesgranrio)" quando houver dado.

### T5. Pesquisa de notas de corte de outros concursos

- INSS, Polícia Federal, PRF, Receita Federal, tribunais (TJ, TRT, TRF) e os demais editais do catálogo.
- Para cada um: resultado oficial (link), escala da nota, cargos e praças, ano.
- Entrega: lista de fontes oficiais e dados prontos para T4; o que não tiver fonte oficial fica registrado como "sem dado".

## 14. Deixar a aba mais visual e ajustar o tamanho dos gráficos

### 14.1 Medição dos gráficos atuais (demo, 13/11/2026)

Desktop (janela de 1024 px, conteúdo com ~915–958 px):

| Subaba | Gráfico | Tamanho | Texto |
|---|---|---|---|
| Visão geral (dobras) | Projeção até a prova | 760 × 226 | 13 px |
| Visão geral (dobras) | Evolução do Índice de Prontidão | 956 × 227 | 13 px |
| Visão geral (dobras) | Planejado × realizado | 924 × 257 | 12 px |
| Disciplinas / Questões | Precisão ao longo do tempo | 915 × 327 | 13 px |
| Questões | Precisão por disciplina | 602 × 233 (no cartão de 958) | 12 px |
| Simulados | Evolução dos simulados (2 pontos) | 915 × 229 | 13 px |
| Diagnóstico | Matriz Domínio × Retenção | 915 × 588 | 12 px |
| Ritmo | Linha do tempo diária | 602 × 194 (no cartão de 958) | 12 px |
| Ritmo | Tempo por disciplina (donut) | 200 × 200 | 12–20 px |
| Conquistas | Evolução do progresso | 958 × 239 | 13 px |
| Conquistas | Radar de disciplinas | 560 × 430 | 13 px |
| Inteligência da prova | nenhum gráfico (só listas) | — | — |
| Visão geral (aberta) | nenhum gráfico; só a barra da Prontidão | — | — |

Celular (375 px, conteúdo com ~343 px):

| Gráfico | Tamanho | Observação |
|---|---|---|
| Projeção, Evolução dos simulados, Linha do tempo, Precisão por disciplina, Evolução do progresso | 640 de largura | Maior que a tela: o gráfico fica em área com rolagem lateral ou cortado |
| Radar de disciplinas | 560 × 430 | Idem, e é o mais difícil de ler em tela pequena |
| Precisão ao longo do tempo | 420 × 150 | Também maior que a tela; 150 px de altura achata a linha |
| Planejado × realizado | 540 × 150 | Idem |
| Matriz Domínio × Retenção | não aparece | No celular vira lista (correto), mas sem aviso de que existe a versão gráfica |

### 14.2 Problemas de tamanho e leitura

1. **Proporções sem regra.** As alturas vão de 150 a 588 px sem relação com a quantidade de dados. A Matriz tem 588 px para 17 pontos amontoados num canto. A evolução dos simulados ocupa 915 × 229 px para mostrar 2 pontos.
2. **Largura fixa no celular.** Sete gráficos são desenhados com 420 a 640 px de largura numa tela de 343 px. O usuário precisa rolar de lado ou perde as pontas.
3. **Faixas de gráfico estreitas no desktop.** A Linha do tempo e a Precisão por disciplina usam 602 px num cartão de 958 px, deixando um vazio à direita sem função.
4. **Texto de eixo em 12 px.** É o mínimo aceitável para eixos, mas 12 px também aparece em rótulos que o aluno precisa ler, como os nomes das disciplinas.
5. **Gráfico sem dado suficiente.** Evolução com 2 simulados e Matriz em que 16 de 17 pontos são "críticos" ocupam muito espaço e dizem pouco.
6. **A Visão geral, que deveria ser a mais visual, não tem gráfico aberto.** O único elemento visual é a barra da Prontidão. Os gráficos dela estão todos dentro de dobras.
7. **Inteligência da prova não tem nenhum gráfico.** É a subaba mais densa em números (incidência, domínio, quadrantes) e tem só listas.
8. **Donut de tempo por disciplina com 17 fatias.** Fatias pequenas e cores próximas, difícil comparar.

### 14.3 Regras de tamanho (propostas)

| Regra | Valor |
|---|---|
| Largura | O gráfico sempre ocupa a largura do cartão (`width: 100%`, `viewBox` com `preserveAspectRatio`), nunca uma largura fixa em px |
| Altura de série temporal | Proporção entre 3:1 e 4:1 no desktop (≈ 240–300 px em 915 px); no celular, altura mínima de 180 px |
| Altura de barras horizontais | 28–32 px por barra + rótulos; cresce com o número de itens em vez de comprimir |
| Dispersão (Matriz) | Quadrado até 480 × 480 no desktop; no celular, lista com link "ver gráfico" |
| Texto | Eixos e ticks em 12–13 px; rótulos de dado e nomes em 14 px; valores em destaque em 16 px ou mais |
| Mínimo de dados | Série com menos de 3 pontos vira texto ("2 simulados: 77,5% e 83,8%") em vez de gráfico |
| Tela pequena | Abaixo de 600 px, o gráfico simplifica (menos ticks, rótulo só no último ponto, legenda abaixo) em vez de rolar de lado |
| Dark/light | Cores da paleta de gráficos já existente (`--chart-series-*`), verificadas nos dois temas |

### 14.4 Gráficos novos ou trocados, por subaba

Critério: cada gráfico responde a pergunta da subaba e é lido em 5 segundos por um iniciante; o detalhe numérico continua disponível em tabela ou texto (acessibilidade e Sam).

| Subaba | Proposta | Substitui | Por quê |
|---|---|---|---|
| Visão geral | **Régua da Prontidão** com a faixa projetada e a meta marcadas (uma barra horizontal) | Barra simples + frase da faixa | Junta "como estou", "onde posso chegar" e "qual é a meta" num só desenho |
| Visão geral | **Três minigráficos de tendência** nos KPIs (tempo, questões, precisão) das últimas 4 a 6 semanas, com o valor atual em destaque | KPIs só com número e variação | Mostra direção sem abrir dobra; continua um número por cartão |
| Disciplinas | **Barras horizontais de precisão por disciplina com a linha da meta** (ordenáveis, pelos modos da decisão 3) | Lista em texto da Comparação | É a pergunta da subaba ("onde estou melhor e pior?") em forma visual; o radar fica como modo alternativo |
| Disciplinas | **Gráfico de inclinação (antes × agora)** como modo "Tendência" | Mapa de estabilidade em 4 listas | Mostra quem melhorou e quem caiu de uma vez |
| Diagnóstico | **Barras de lacuna × impacto** dos 10 primeiros tópicos, agrupadas por disciplina | Cartões 1·2·3 e "+294" | Dá a escala das lacunas; o restante continua na lista filtrável |
| Diagnóstico | Matriz Domínio × Retenção **só quando discrimina** e em tamanho quadrado menor | Matriz fixa de 915 × 588 | Evita o gráfico em que tudo é crítico |
| Questões | **Linha da precisão com a meta desenhada** e área de amostra pequena sombreada | Linha sem meta | A meta hoje só aparece em Simulados |
| Questões | **Perfil de erros em barras empilhadas** por tipo de erro (já existe na dobra) promovido para fora da dobra | — | É a parte mais acionável para o avançado |
| Simulados | **Pontos com a faixa projetada sobreposta** (projeção × resultado) no mesmo gráfico da evolução | Dois gráficos separados | Um gráfico responde "como vou" e "a projeção acertou?" |
| Inteligência da prova | **Barras de incidência por disciplina** (presença nas provas) com o domínio do aluno ao lado | Só listas | Primeira leitura visual de "o que a banca cobra × o que eu sei" |
| Ritmo | **Barras semanais planejado × realizado** com a linha da capacidade | Quatro números de aderência | Mostra volume e aderência sem quatro percentuais |
| Ritmo | **Barras horizontais de tempo por disciplina** (top 8 + "outras") | Donut de 17 fatias | Barras comparam melhor que fatias |
| Ritmo | **Faixas por turno** (manhã, tarde, noite) com horas e precisão | Três cartões de texto com a mesma frase repetida | Uma figura no lugar de três frases |
| Conquistas (Hoje) | **Barras de progresso** de cada conquista próxima | Lista de texto | Já previsto na seção 11 |

Fora do escopo: animações decorativas, 3D, gráficos de pizza novos, mapa de calor adicional.

### 14.5 Tarefa T6: visual e tamanho dos gráficos

Antes de implementar, carregar a skill `dataviz` (forma, paleta, validação de cor) e usar o componente de gráficos existente (`src/ui/primitives/charts/charts.tsx`).

1. **T6.1 Tamanho responsivo:** aplicar as regras de 14.3 a todos os gráficos existentes (largura 100%, proporções, mínimo de 3 pontos, simplificação abaixo de 600 px). Medir de novo em 1440, 1024, 375 e 320: nenhum gráfico mais largo que o cartão.
2. **T6.2 Gráficos da Visão geral:** régua da Prontidão e minigráficos dos KPIs.
3. **T6.3 Gráficos das outras subabas:** um por vez, na ordem da tabela de 14.4, junto da fase que reorganiza cada subaba (Disciplinas e Ritmo na Fase 3; Diagnóstico depois de T3).
4. Aceite: cada gráfico com alternativa em texto ou tabela; contraste verificado nos dois temas; `/impeccable critique` antes e depois.

Encaixe na ordem da seção 13: T6.1 entra logo depois de T3 (é ajuste de tamanho, sem mudar conteúdo); T6.2 e T6.3 acompanham as Fases 1 a 3.

## 15. Resumo da semana na Visão geral (decidido em 13/11/2026)

Entra na **Fase 2 (cortar repetições)**. Reaproveita o gerador existente (`build-weekly-performance-brief.ts` e `weekly-performance-brief-renderer.ts`), hoje numa dobra fechada.

### O que é

Um bloco aberto logo abaixo da Leitura da preparação, com três parágrafos curtos sobre os últimos 7 dias.

### O que ele substitui

- O cartão "Resumo do período" (o alerta de simulados vai para a Leitura ou para Simulados).
- A frase "Como sua preparação evoluiu", que repete o KPI.
- A linha de ritmo de 7 dias da Leitura ("12h 38min de 4h 25min… 286%"), que passa a viver só no resumo.

Resultado: a Visão geral fica com Leitura (Prontidão e ação), Resumo da semana e três KPIs do período, e a janela de 7 dias aparece num lugar só.

### Regras

| Regra | Valor |
|---|---|
| Janela | Sempre os últimos 7 dias, independente do filtro; selo "7 dias" no título e as datas ("07/11 a 13/11") |
| Tamanho | Três parágrafos de uma a duas frases cada |
| Parágrafo 1: o que você fez | Fato, sem julgamento: tempo, dias com estudo, questões, cumprimento do plano ("Você estudou 12h 38min em 6 dias, mais do que o plano previa") |
| Parágrafo 2: o que mudou | Um sinal só, o mais relevante (precisão, queda numa disciplina, conquista perto); nunca atribui causa |
| Parágrafo 3: o que fazer | A mesma ação da Leitura, citada pelo nome; sem botão novo ("uma prioridade só") |
| Números | No máximo três no texto todo; nenhum contradiz outro número da tela (mesmo arredondamento e mesma base) |
| Pouca evidência | Com amostra pequena ou sem plano, uma frase diz isso e o parágrafo 2 some |
| Sem estudo na semana | Um parágrafo só, sem culpa ("Nenhuma sessão nos últimos 7 dias. A próxima ação está em Hoje.") |
| Geração | Regras determinísticas a partir dos dados, sem IA; mesmo estado gera o mesmo texto |
| Tom | Sóbrio e encorajador; "Atenção" e "confiança baixa" ficam nos blocos de detalhe, não no resumo |

### Aceite

- Testes unitários dos casos: semana normal, acima do plano, abaixo do plano, amostra pequena, sem estudo, sem plano.
- Teste que garante que o resumo não traz número diferente do mostrado em outro bloco da Visão geral.
- E2E na demo: resumo visível abaixo da Leitura, três parágrafos, selo "7 dias", nenhum cartão "Resumo do período".
