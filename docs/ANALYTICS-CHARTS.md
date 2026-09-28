# Gráficos de desempenho e planejamento

Os gráficos complementam os números e a explicação textual. Todos preservam valores fora do desenho para leitura por teclado, leitores de tela e situações sem distinção de cores.

## Questões

- A evolução filtra Geral, Disciplina ou Tópico e 30 dias, 90 dias, 6 meses ou todo o histórico.
- Os períodos de 30 e 90 dias são agrupados por semana; 6 meses e todo o histórico, por mês. Períodos sem questões não recebem ponto.
- Cada ponto da linha usa acertos ÷ questões dos três períodos com registros mais recentes. A linha só aparece após dois pontos sustentados por pelo menos 30 questões em cada janela.
- Acertos e erros permanecem listados por período, junto com o volume e a taxa de acerto. O desempenho por disciplina mantém a tabela e acrescenta uma barra horizontal.

## Simulados

- A linha mostra até os 12 simulados mais recentes, com a nota de cada um em texto. A meta aparece apenas quando há configuração estratégica registrada.
- Último × anterior usa os dois simulados mais recentes com data. Uma disciplina só entra se houver detalhamento com questões nos dois. O resultado mostra os dois percentuais, volumes e a diferença em pontos percentuais.
- Sem detalhamento comparável, a interface explica a ausência da comparação.

## Metas e capacidade

- O planejamento diário vem dos itens dos planos diários registrados. Itens ignorados, substituídos ou descartados não entram no total planejado.
- O realizado vem da duração das sessões registradas no dia, inclusive quando a sessão não foi vinculada ao plano.
- A capacidade vem da disponibilidade semanal informada; ela é distinta do tempo efetivamente planejado.
- O histórico de cumprimento usa semanas concluídas e só calcula percentual quando existe plano naquela semana. A semana atual é exibida como em andamento na comparação diária, sem entrar na linha histórica.
- Uma semana sem plano permanece sem percentual. Um plano acima da capacidade gera aviso, sem alterar a distribuição automaticamente.

## Perfil de erros e distribuição

- O perfil mostra somente categorias com erros registrados. Cada barra representa a parcela daquela categoria sobre **todos os erros do recorte**, incluindo os sem categoria. Contagem, percentual, diferença para o período anterior e cobertura permanecem em texto.
- A ação diagnóstica continua condicionada à amostra e à cobertura exigidas pelo analisador de erros. Barras descritivas, por si só, não mudam a recomendação.
- A distribuição por disciplina usa os dias desta semana até hoje. O plano soma itens válidos dos planos diários; o estudo soma sessões reais, inclusive fora do plano. Cada coluna usa seu próprio total como denominador.
- Disciplinas sem plano ou sem sessão permanecem visíveis com valor zero. Mais de oito disciplinas ficam em uma lista expansível para preservar a leitura inicial.

## Plano × impacto na prova

- A comparação usa somente disciplinas com tempo planejado na semana atual e tópicos do concurso ativo. São necessárias pelo menos duas disciplinas planejadas.
- Em cada disciplina, o impacto é a média dos impactos estimados dos seus tópicos. Pelo menos metade dos tópicos deve ter impacto disponível; caso contrário, o painel explica a insuficiência dos dados.
- A parcela planejada usa o tempo de cada disciplina dividido pelo tempo planejado das disciplinas comparadas. A parcela de impacto usa a média de impacto da disciplina dividida pela soma dessas médias. É uma comparação **relativa**, não uma distribuição oficial de questões ou pontos do edital.
- A comparação não muda o plano. Disciplinas sem tempo planejado não entram no denominador; revise também o restante do edital antes de usar o painel para decidir uma redistribuição.

## Histórico de prontidão e série futura de retenção

- `progressHistory` registra conclusão de conteúdo e não serve como histórico do Índice de Prontidão. `readinessSnapshots` guarda o índice calculado quando o fechamento semanal é salvo, com data, tags do concurso ativo, fatores, confiança e versão do algoritmo. O gráfico filtra pelo concurso ativo e deixa períodos anteriores à captura sem ponto.
- Uma série de retenção exigirá retratos por tópico com data, escopo, valor, volume de revisões/questões e versão do cálculo. São necessários ao menos dois retratos comparáveis e evidência suficiente em ambos; uma alteração de fórmula inicia nova série.
- A série de prontidão indica mudança no indicador observado e não demonstra que uma recomendação causou a mudança. A interface ainda não desenha uma série histórica de retenção sem retratos próprios.

## Apresentação compartilhada e prontidão explicável

Questões, evolução de Simulados e Plano e execução usam chart-components.js para cabeçalho, período, legenda, evidência, estado vazio e dados textuais. As séries usam tokens semânticos de gráfico e os pontos oferecem detalhes via title, complementados pelos registros textuais. Os filtros existentes continuam responsáveis pelo recorte.

O painel de prontidão mostra o cálculo atual, último registro salvo, melhor registro comparável e variação entre fechamentos. Eventos anteriores a mudanças estratégicas são identificados pelo motivo e não entram na variação entre fechamentos. Só há delta e contribuição ponderada quando algoritmo, pesos e fatores disponíveis coincidem. Mudanças de versão ou disponibilidade interrompem a linha e explicam a ausência da comparação. Os 12 registros mais recentes aparecem no desenho; o resumo considera todo o histórico do mesmo concurso.

Snapshots v2 preservam pesos, tipo, motivo e identidade do evento. Snapshots v1 permanecem intactos; para o algoritmo 1, seus pesos conhecidos permitem comparação compatível. Não há captura diária automática nem recálculo retroativo. A disponibilidade semanal e as metas também são capturadas antes de mudanças confirmadas.
