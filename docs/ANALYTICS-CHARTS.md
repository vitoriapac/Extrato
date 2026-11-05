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

## Aderência estratégica

A aderência de carga mantém o total estudado, inclusive fora do plano. A aderência estratégica divide os minutos creditados a itens prioritários pelos minutos prioritários previstos. O crédito exige sessão real, vínculo válido e tópico/disciplina compatíveis, e é limitado ao orçamento de cada item. A classificação usa o snapshot histórico, nunca o diagnóstico atual.

Estudo sem vínculo, vínculos incompatíveis, atividades de outro período e excedentes são informados separadamente. Planos antigos sem snapshot permanecem sem classificação. A cobertura da classificação indica quanto do plano pode sustentar a leitura estratégica. A distribuição apresenta planejado, realizado e diferença por disciplina; o histórico semanal mantém as duas leituras.

## Incidência × Domínio
A matriz histórica oferece quatro quadrantes textuais responsivos: presença alta (50% ou mais) × domínio adequado (70/100 ou mais). Esses cortes são referências de leitura, não pesos novos do motor de prioridade. Apenas confiança histórica moderada/alta e domínio disponível permitem posicionar; demais tópicos ficam no grupo de evidência insuficiente. Os filtros históricos são preservados. O detalhamento distingue questões históricas e pessoais; os dados pessoais continuam no concurso ativo.

## Leitura integrada de questões e simulados
A área de evolução apresenta volume, precisão, erros categorizados/não categorizados e notas atual/anterior/média/melhor dos simulados. A média é por simulado, não ponderada pelo volume. O período 30/90/180/todo o histórico é compartilhado com os gráficos e a comparação de simulados; ambos usam o concurso ativo. Os filtros de disciplina/tópico refinam somente o gráfico de questões; o resumo informa o conjunto do concurso.
As tendências por tópico comparam duas metades do período, exigindo 30 questões em cada metade. No histórico inteiro, a janela recente é de 45 dias e a anterior contém o restante. Impacto acompanha a variação sem produzir uma nova prioridade. Composição/dificuldade distintas limitam comparações; amostras insuficientes não recebem classificação de tendência. Categorias e tópicos têm detalhes expansíveis, e listas extensas reutilizam Mostrar mais.

## Fechamento orientado a decisões
O fechamento integra aderência prioritária calculada pelas sessões vinculadas e snapshots do plano, cobertura da classificação, simulados realizados, prontidão comparável da semana anterior e resultados posteriores medidos no período. Até três pontos de execução/evidência são destacados em cada lado; não são tratados como causalidade. Metas de questões ou simulados não registradas não são inventadas.
A prévia da próxima semana desconta planos existentes, revalida as alocações na confirmação e identifica prioridades já aplicadas pelo período/concurso. Alterações entre prévia e confirmação exigem nova revisão. Salvar o fechamento preserva essa leitura no snapshot; aplicar prioridades não apaga planos nem amplia disponibilidade.

## Faixa de pontuação e checagem retrospectiva
A faixa exige ao menos três simulados comparáveis em datas distintas, 120 questões e 14 dias de histórico dentro de 90 dias. Compara concurso/tags, disciplinas e quantidades registradas; mantém a última observação de cada dia. Diferenças de dificuldade continuam desconhecidas. Sem detalhamento, a confiança é baixa.
O centro usa a mediana dos três últimos resultados. A margem é o máximo entre 4 pontos, dispersão ampliada, percentil 80 dos erros retrospectivos e margens conservadoras para pouca evidência. Cada erro retrospectivo usa somente os três resultados anteriores. Isso é uma faixa descritiva, não um intervalo estatístico validado externamente. Confiança é limitada a moderada; extrapolação de 30 dias exige checagem retrospectiva suficiente e mantém margem/confiança conservadoras.
Domínio, prontidão e impacto explicam lacunas, mas não são convertidos diretamente em nota. O cenário de redução de lacunas é qualitativo quando faltam pesos oficiais completos e desempenho medido. Nenhum ganho de pontos é prometido por adicionar horas. A API usada pelo relatório continua retornando a faixa e os limites disponíveis.

## Estratégia por fase e reta final
A área de planejamento oferece uma proposta de divisão de atividades no plano semanal confirmado. Reaproveita as fases existentes: construção (>90 dias), consolidação (31–90), reta final (8–30), revisão final (0–7). O motor de prioridade continua definindo tópicos/minutos; a proposta altera somente teoria/questões/revisões e preserva exatamente a carga e todos os tópicos.
Exige evidência pessoal suficiente em dois tópicos; tópicos sem evidência preservam a divisão anterior. Conteúdo coberto recebe manutenção, retenção baixa amplia revisão e lacunas de alto impacto preservam teoria de base. A disponibilidade atual é revalidada, com cooldown de 14 dias após estratégia ou ajuste aplicado/revertido. Não agenda simulados nem muda planos diários automaticamente.
Revisar e confirmar cria nova versão com mudanças, evidências e prontidão congeladas. A confirmação recalcula a proposta e exige nova revisão se a base mudou. Reverter cria outra versão a partir da origem, respeitando a disponibilidade atual; versões, planos diários e sessões anteriores são preservados. A data passada impede nova proposta de fase.

## Gráficos Visuais com Cores das Disciplinas (Modernização Visual)

### 1. Linha do Tempo Diária (Colunas Empilhadas)
- **Localização:** Aba Desempenho → Seção **Consistência**.
- **Propósito:** Visualizar as horas diárias de estudo no período selecionado (7 dias, 30 dias, 90 dias ou todo o histórico), com cada dia decomposto em segmentos coloridos correspondentes às disciplinas estudadas.
- **Cores Semânticas:** Cada segmento e item da legenda consome o slot de cor atribuído à matéria (`--subject-1` até `--subject-8` em `styles/tokens.css`), garantindo contraste WCAG AA e fidelidade cromática entre os temas Claro e Escuro.
- **Painel Lateral:** Exibe o total consolidado de horas no período e o ranking decrescente das matérias com dot de cor, horas líquidas estudadas e percentual da carga.

### 2. Tempo de Estudo por Disciplina (Donut Chart)
- **Localização:** Aba Desempenho → Seção **Consistência**.
- **Propósito:** Apresentar a distribuição percentual da carga horária dedicada a cada matéria no período.
- **Visual:** Gráfico em SVG circular (estilo Donut) com espessura controlada, transição suave no hover e texto central com o tempo total de estudo.
- **Legenda:** Lista lateral estruturada com swatch colorido, nome da matéria, tempo formatado em horas decimais e participação percentual.

### 3. Desempenho por Disciplina (Evolução Multilinear de Precisão)
- **Localização:** Aba Desempenho → Seção **Questões**.
- **Propósito:** Exibir a trajetória temporal da taxa de acerto (%) de cada matéria estudada.
- **Estrutura:** Curvas vetorizadas contínuas onde cada matéria recebe sua cor oficial (`subject-stroke-X`), com pontos de medição em cada período contendo tooltips semânticos (ex: `Língua Portuguesa (04/11): 85,1%`).
- **Resumo Lateral:** Card de destaque com a média global de desempenho (`X%`), total de questões resolvidas e acertos, seguido da listagem das disciplinas com proporção de acertos/resoluções e taxa percentual.

### 4. Matriz Pedagógica: Domínio × Retenção (Dispersão em 4 Quadrantes)
- **Localização:** Aba Desempenho → Seção **Disciplinas**.
- **Propósito:** Cruzar pedagogicamente o aproveitamento em questões (Domínio, 0–100%) com a integridade da memória pelo algoritmo Ebbinghaus (Retenção, 0–100%).
- **Quadrantes:**
  1. *Consolidada:* Alto Domínio (≥ 70%) e Alta Retenção (≥ 60%).
  2. *Risco de Esquecimento:* Alto Domínio (≥ 70%) e Baixa Retenção (< 60%).
  3. *Em Construção:* Baixo Domínio (< 70%) e Alta Retenção (≥ 60%).
  4. *Vulnerabilidade Crítica:* Baixo Domínio (< 70%) e Baixa Retenção (< 60%).
- **Esferas:** Cada disciplina é representada por uma bolha posicionada nas coordenadas (Retenção, Domínio), colorida com sua cor oficial (`subject-fill-X`) e raio proporcional ao tempo de estudo dedicado.

### 5. Cores Oficiais nos Componentes Pré-Existentes
- **Radar Multidimensional de Disciplinas:** Suporte nativo aos slots de cor (`radar-shape[data-subject-color]`, `radar-dot[data-subject-color]`, `radar-key[data-subject-color]`), substituindo as cores neutras legadas pela cor escolhida pelo usuário.
- **Barras de Progresso por Disciplina:** Exibição da bolinha colorida (`subject-color-swatch`) ao lado do nome da disciplina e preenchimento da barra com a classe semântica correspondente (`subject-bg-X`).

## Gráficos Visuais da Aba de Planejamento (Modernização Visual)

### 1. Gráfico de Barras Agrupadas: Planejado × Realizado por Disciplina
- **Localização:** Aba Planejamento → Plano da semana → **Resumo da semana** (`#studyDistribution`).
- **Propósito:** Comparar visualmente o tempo planejado nos planos diários contra o tempo efetivamente estudado em sessões durante a semana atual.
- **Estrutura:** Par de barras horizontais por disciplina. A barra de planejado utiliza tom neutro de contorno (`bg-content-secondary/30`), e a barra de realizado é preenchida com a cor oficial da disciplina (`subject-bg-X`).
- **Indicadores:** Marcador circular colorido da matéria, minutos formatados e badge semântico com ícone Tabler de status pedagógico:
  - *No ritmo:* Execução dentro da margem planejada.
  - *Superávit (+Xh):* Estudo acima do planejado.
  - *Déficit (-Xh):* Estudo abaixo do planejado.
  - *Extra:* Disciplina estudada sem plano prévio.

### 2. Barras Duplas de Alinhamento com o Edital (Plano × Impacto)
- **Localização:** Aba Planejamento → Plano da semana → **Resumo da semana** (`#planImpactAlignment`).
- **Propósito:** Contrastar o percentual de esforço alocado no plano semanal contra o peso relativo e incidência de questões no edital.
- **Estrutura:** Cada disciplina é exibida com seu dot de cor oficial (`subject-bg-X`), barra do plano semanal na cor da matéria e barra de impacto relativo do edital em tom contrastante.
- **Classificação:**
  - *Alinhada:* Diferença ≤ 8 p.p. entre esforço e relevância.
  - *Subalocada:* Mais de 8 p.p. abaixo do impacto da prova (alerta para não negligenciar matérias de alto peso).
  - *Sobrealocada:* Mais de 8 p.p. acima do impacto da prova.

### 3. Barra Contínua de Capacidade Semanal e Mix Pedagógico
- **Localização:** Aba Planejamento → Plano da semana → **Plano semanal até a prova** (`#examStudyPlan`).
- **Propósito:** Proporcionar uma visão panorâmica e imediata da capacidade semanal alocada em horas, fatiada pelas disciplinas na sua cor oficial e decomposta no mix de atividades.
- **Estrutura:**
  - *Barra de Capacidade:* Segmentos contínuos proporcionais à carga de cada disciplina com `subject-bg-X`, além de indicador de tempo livre (*flex*).
  - *Chips de Disciplina:* Listagem com badge colorido, horas alocadas e percentual da capacidade total.
  - *Mix Pedagógico:* Barra tricolor dividindo o tempo em Teoria (azul), Questões (roxo/accent) e Revisões (verde), apoiando a execução da rotina de estudos.

### 4. Linha do Tempo da Jornada e Régua Pedagógica até a Prova
- **Localização:** Aba Planejamento → Prova e ritmo → **Configuração estratégica da prova** (`#metasExamStrategy`).
- **Propósito:** Exibir a contagem regressiva em dias, percentual decorrido de cronograma e as 4 fases pedagógicas de preparação até o dia do concurso.
- **Régua e Fases:**
  - *Construção de Base (>90 dias):* Foco em teoria e fundação.
  - *Consolidação e Fixação (31–90 dias):* Equilíbrio entre teoria, questões e revisões.
  - *Modo Reta Final (8–30 dias):* Transição para 85% questões/revisão e 15% teoria.
  - *Semana de Revisão Final (0–7 dias):* Manutenção rápida e descanso ativo.
- **Interatividade:** Destaque dinâmico da fase ativa com badge "Agora", indicação das fases já ultrapassadas e régua de progresso com gradiente.

### 5. Cores Oficiais nas Metas por Disciplina e Configuração Estratégica
- **Metas de Acerto por Disciplina (`#subjectTargetEditor`):** Cada linha da tabela agora apresenta o swatch de cor da disciplina ao lado da caixa de seleção e nome, harmonizando com os gráficos da aba Desempenho.
- **Configuração da Prova por Disciplina (`.exam-subject-config`):** Cada disciplina expansível recebe seu swatch oficial `subject-bg-X`, facilitando a identificação imediata ao revisar pesos e prioridades.


