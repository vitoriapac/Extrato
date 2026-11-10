# Desempenho — inventário e regras de composição

Este documento define o proprietário das análises antes de introduzir a aba Desempenho. A nova aba reutiliza modelos e registros existentes. Seu estado de navegação é temporário; não altera o schema do backup.

| Bloco atual | Tela e elemento | Fonte e composição existente | Recorte atual | Proprietário após migração |
|---|---|---|---|---|
| Prontidão atual e faixa projetada | Visão Geral `#approvalDashboard` | `readinessResult`, `buildCalibratedScoreProjection`, `buildProjectionCalibration` | Concurso ativo; instante atual | Visão Geral mantém resumo e ação; Desempenho recebe evolução. A captura retrospectiva não pode ocorrer duas vezes por renderização. |
| Evolução da prontidão | Visão Geral `#readinessHistoryDashboard` | `readinessSnapshots`, `buildReadinessEvolution`, `compareReadinessSnapshots` | Concurso ativo; retratos datados | Desempenho. O resumo atual permanece compacto na Visão Geral. |
| Fechamento, foco e aderência estratégica | Visão Geral `#weeklyCloseDashboard` | `buildStudyTrack32ViewModel`, `buildWeeklyDecisionCycle`, `buildStrategicExecution` | Semana e concurso ativos; fechamentos salvos | Fechamento e decisões continuam na Visão Geral/Metas; série histórica de execução vai para Desempenho. |
| Comparação, decisões e linha estratégica | Visão Geral `#periodComparisonDashboard`, `#decisionHistoryDashboard`, `#strategicTimelineDashboard` | `buildStudyTrack32ViewModel`, snapshots e histórico de decisões | Concurso ativo; semanas comparáveis | Comparações históricas em Desempenho; diagnóstico e decisões permanecem nos fluxos atuais. |
| Lacunas e evolução da prioridade | Visão Geral `#gapMapDashboard`, `#priorityHistoryDashboard` | motor de lacunas e `buildPriorityHistory` | Concurso ativo; tópicos elegíveis | Diagnóstico/estratégia mantêm a interpretação; Desempenho pode mostrar apenas trajetória observada. |
| Tempo, sessões e heatmap | Visão Geral `#studyHoursChart`, `#studySessionsCard`, `#heatmapContainer` | sessões e histórico de estudo | Filtros próprios de sessão; calendário local | Cronômetro e registro continuam operacionais; histórico temporal completo vai para Consistência. |
| Evolução de questões | Questões `#questionEvolutionCard` | `buildQuestionEvolution` | 30/90/180 dias ou tudo; concurso e disciplina/tópico | Desempenho → Questões; registro e resumo imediato ficam em Questões. |
| Tendência, volume e perfil de erros | Questões `#topicPerformanceCard` | analytics de questões e categorias de erro | Disciplina e janela atuais; limiares de amostra existentes | Desempenho → Questões, com atalho a partir do registro. |
| Simulados e comparação por disciplina | Questões `#simuladosChartCard`, `#simulationComparisonCard`, `#desempenhoDisciplinaCard` | simulados, `buildSimulationComparison`, renderers existentes | Concurso ativo; dois simulados com detalhamento comum para comparação | Desempenho → Simulados; cadastro e últimos registros permanecem em Questões. |
| Calibração da faixa | Visão Geral `#approvalDashboard` | `projectionSnapshots`, `buildProjectionCalibration` | Concurso/composição iguais; projeção emitida antes do simulado | Desempenho → Simulados; faixa compacta permanece no contexto atual. |
| Plano e execução | Metas `#planExecutionResults` | `buildPlanExecution`, `buildStrategicExecution` | Semanas concluídas e atual; planos/sessões | Planejamento mantém distribuição e ações; Desempenho → Consistência mostra a série. |
| Comparação por período | Metas `#periodComparisonResults` | `buildPeriodComparisonViewModel` | 7/30 dias, mês ou intervalo escolhido; hoje usa registros sem filtro de concurso | Desempenho recebe comparação no escopo ativo; Metas mantém objetivos e progresso atuais. |
| Diagnóstico e sinais | Hoje `#diagnosisCenter` | sinais consolidados, recomendações e explicações | Concurso ativo; tópico e disciplina | Hoje continua proprietário dos problemas e ações. |
| Inteligência da prova | Desempenho → Inteligência da prova `.exam-intelligence-hub` | provas históricas, incidência e configuração | Concurso ativo; filtros próprios de prova | Desempenho apresenta a evidência e a matriz; Metas mantém a configuração estratégica. |
| Linha do Tempo Diária | Desempenho → Consistência | `buildStudyTimelineModel`, `StackedColumnChart` | Sessões do período e concurso ativo | Consistência: colunas empilhadas diárias coloridas por disciplina e resumo lateral de horas. |
| Tempo de Estudo por Disciplina | Desempenho → Consistência | `buildStudyDistributionModel`, `DonutChart` | Sessões do período e concurso ativo | Consistência: gráfico Donut em SVG com arcos coloridos e legenda percentual de carga horária. |
| Desempenho por Disciplina | Desempenho → Questões | `buildMultiSubjectPerformanceModel`, `MultiLineChart` | Questões pessoais no período | Questões: curvas multilineares de taxa de acerto por matéria, média geral e proporções. |
| Matriz Domínio × Retenção | Desempenho → Diagnóstico | `buildPedagogicalMatrixModel`, `PedagogicalMatrixChart` | Métricas de tópicos e sessões | Diagnóstico (desde 10/11/2026): dispersão em 4 quadrantes pedagógicos com esferas nas cores das matérias, com a escala ajustada ao intervalo dos dados (valores das pontas dos eixos escritos). |
| Distribuição Planejado × Realizado | Planejamento → Resumo da semana | `buildSubjectStudyDistributionVisual`, `GroupedBarChart` | Planos diários e sessões da semana | Planejamento: barras horizontais agrupadas por matéria com cores oficiais e status pedagógico. |
| Alinhamento Plano × Impacto no Edital | Planejamento → Resumo da semana | `buildPlanImpactAlignmentVisual`, `renderPlanImpactAlignment` | Planos da semana e relevância do edital | Planejamento: barras duplas contrastantes de esforço vs. relevância e diagnóstico de alinhamento. |
| Capacidade Semanal e Mix Pedagógico | Planejamento → Plano até a prova | `buildWeeklyAllocationBarVisual`, `AllocationBar` | Plano semanal (confirmado e proposta) | Planejamento: barra segmentada contínua com cores das disciplinas e divisão Teoria / Questões / Revisão. |
| Régua da Jornada e Fases até a Prova | Planejamento → Prova e ritmo | `buildPhaseRoadmapVisual`, `PhaseRoadmapTimeline` | Data da prova e cronograma de estudo | Planejamento: contagem regressiva, progresso decorrido e 4 fases pedagógicas de preparação. |
| Resumo da Última Semana (3 parágrafos + mini-gráfico e versão de 1 parágrafo) | Desempenho → Visão geral `.performance-weekly-brief` e Visão Geral `#overviewClosingNote` | `buildWeeklyPerformanceBrief`, `renderWeeklyPerformanceBriefCard` | Janela fixa móvel dos últimos 7 dias (`[hoje - 6, hoje]`) comparada aos 7 dias anteriores (`[hoje - 13, hoje - 7]`) no concurso ativo | Desempenho abre com 3 parágrafos em linguagem acessível, mini-gráfico SVG (Tempo de estudo, Questões feitas, Taxa de acerto) e atalhos híbridos para abas/subseções; Visão Geral exibe síntese de 1 parágrafo com atalho para Desempenho. |

## Definições para os primeiros três pacotes

- **Período:** dias de calendário inclusivos. 7/30/90 dias terminam no dia local atual; o intervalo anterior tem exatamente a mesma duração. “Tudo” não tem intervalo anterior equivalente e desativa a comparação.
- **Escopo:** usar os seletores já usados pelo concurso ativo para sessões, questões, tópicos, disciplinas e simulados. Registros sem vínculo seguro não recebem escopo presumido.
- **Prontidão:** usar apenas retratos salvos no histórico. O valor atual pode aparecer separado; diferenças exigem algoritmo, pesos e fatores disponíveis compatíveis. Não recalcular retrospectivamente.
- **Precisão:** acertos divididos por questões pessoais resolvidas no período; provas históricas importadas não entram. Sem questões, o valor é ausente.
- **Tempo:** soma da duração das sessões do período. A diferença em relação ao período anterior só aparece quando a comparação estiver ativa.
- **Volume de carga:** minutos estudados divididos pelos minutos planejados válidos; sem plano, é ausente. Pode ultrapassar 100% e deve ser identificado como excedente, não truncado.
- **Aderência estratégica:** créditos de sessões vinculadas a itens prioritários divididos pelos minutos prioritários planejados, conforme `buildStrategicExecution`. Sem snapshot/classificação suficiente, mostrar ausência e cobertura, nunca derivar da aderência de carga.
- **Principais mudanças:** apenas séries observáveis e comparáveis no período; até cinco itens iniciais. Sem evidência, explicar o dado faltante.

## Contratos de migração

Mover o proprietário de cada análise junto com seu renderer, sem duplicar IDs ou recalcular a métrica. A tela de origem conserva somente um resumo que tenha função própria e um link contextual. Gráficos apresentam valores também em texto. O filtro global de Desempenho é estado de UI, não dado de backup. A navegação preserva o concurso ativo e, quando aplicável, período, disciplina e tópico.

## Situação após os pacotes 4–9

Desempenho apresenta questões, simulados, disciplinas, detalhe de tópico, consistência e Inteligência da Prova. A Visão Geral aponta para o histórico completo e conserva o índice atual, o fechamento e decisões estratégicas. Questões e Simulados conservam os registros; a análise especializada de erros fica recolhida. Metas conserva a configuração estratégica, o plano, a execução atual e a comparação com datas personalizadas. Os gráficos históricos de prontidão, tempo de estudo, heatmap e simulados deixaram as telas de origem.

A visão geral também compara precisão, tempo, volume e aderência com o período anterior equivalente. Precisão só recebe classificação com pelo menos 30 questões em cada intervalo; aderência requer 60 minutos planejados em cada um. Os insights são regras descritivas sobre mudanças observadas, sem atribuir causa. Com escopo ou evidência insuficientes, a interface explica a ausência do indicador. O heatmap limita a visualização diária a 90 dias e mantém o histórico semanal em uma lista expansível.

## Composição atual da aba (10/11/2026)

A aba responde, na ordem, **como estou, o que mais pesa e o que fazer**, e leva o restante a subabas com uma pergunta cada.

| Subaba | Pergunta | Blocos principais | Orçamento (desktop) |
|---|---|---|---|
| Visão geral | Como estou, o que pesa, o que faço? | Leitura da preparação (`build-preparation-reading.ts`); O que mudou depois das recomendações; Resumo do período (com os últimos 7 dias); indicadores; dobras de trajetória, comparação e glossário | até 1.600 px (medido: 1.992) |
| Por disciplina | Onde estou melhor e pior? | Comparação entre disciplinas (precisão, meta, evolução, planejado, realizado, saldo do plano e sugestão); Mapa de estabilidade; detalhe da disciplina | até 2.500 px (medido: 2.859) |
| Diagnóstico | Quais lacunas existem? | Situação do preparo; Extrato Diagnóstico; Replanejamento da semana; Matriz Domínio × Retenção; dobra com Balanço, Radar e Queda de retenção | até 3.200 px (medido: 3.443) |
| Questões, Simulados | Como vão minhas questões e simulados? | Como na seção anterior | 2.097 px e 1.037 px |
| Inteligência da prova | O que a banca privilegia? | Resumo e lista; filtros na dobra "Filtros e busca" | até 2.500 px (medido: 2.831) |
| Ritmo e aderência | Estou cumprindo o plano? | Síntese; linha do tempo; Turno de estudo (rendimento e foco profundo); dobras "Como o plano foi cumprido", distribuição do tempo e calendário | até 2.600 px (medido: 2.626) |
| Conquistas e histórico | O que já construí? | Progresso, conquistas e sessões | 999 px |

Regras de composição:

- **Hoje é dono da próxima ação.** A leitura mostra a mesma recomendação (mesmo `recommendationId`) e leva a Hoje com o único botão sólido ("Abrir em Hoje"). "Ajustar plano" abre a prévia em Metas; nada é aplicado a partir de Desempenho.
- **Selos de janela** (`window-badge.tsx`): "7 dias", "período", "semana atual" e "histórico" acompanham os números de aderência, simulado e turno. A Prontidão traz as datas do fechamento por extenso.
- **Selos de evidência** (`evidence-badge.ts`): "amostra pequena", "confiança baixa" e "sem dados suficientes" no cabeçalho dos blocos que têm esse sinal (resumo, comparação, mapa de estabilidade e simulados). Matriz e Radar ainda não têm sinal de amostra e ficam sem selo.
- **Dobras lembram o estado** ao redesenhar (`foldMemory` em `performance-tab-controller.ts`; chave = seção + título, ou `data-fold-key`). A dobra de filtros da prova também sobrevive ao redesenho da matriz.
- **Âncoras:** `#desempenho/<seção>/<bloco>` (`leitura`, `resumo`, `comparacao`, `estabilidade`, `sintese`, `matriz`, `turno`, `recomendacoes`); os cinco primeiros blocos têm "Copiar link".
- **Celular:** os filtros viram uma linha ("Alterar filtros"); a leitura segue a ordem número da Prontidão, "O que fazer", "O que mais pesa" e números de apoio.
- **O que mudou depois das recomendações** reutiliza `buildRecommendationFollowup` (o mesmo modelo da aba de Aprovação), só com resultados medidos e sem afirmar causa.
