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
| Inteligência da prova | Metas `.exam-intelligence-hub` | provas históricas, incidência e configuração | Concurso ativo | Metas continua proprietário do edital e da prova. |

## Definições para os primeiros três pacotes

- **Período:** dias de calendário inclusivos. 7/30/90 dias terminam no dia local atual; o intervalo anterior tem exatamente a mesma duração. “Tudo” não tem intervalo anterior equivalente e desativa a comparação.
- **Escopo:** usar os seletores já usados pelo concurso ativo para sessões, questões, tópicos, disciplinas e simulados. Registros sem vínculo seguro não recebem escopo presumido.
- **Prontidão:** usar apenas retratos salvos no histórico. O valor atual pode aparecer separado; diferenças exigem algoritmo, pesos e fatores disponíveis compatíveis. Não recalcular retrospectivamente.
- **Precisão:** acertos divididos por questões pessoais resolvidas no período; provas históricas importadas não entram. Sem questões, o valor é ausente.
- **Tempo:** soma da duração das sessões do período. A diferença em relação ao período anterior só aparece quando a comparação estiver ativa.
- **Aderência de carga:** minutos estudados divididos pelos minutos planejados válidos; sem plano, é ausente. Pode ultrapassar 100% e deve ser identificado como excedente, não truncado.
- **Aderência estratégica:** créditos de sessões vinculadas a itens prioritários divididos pelos minutos prioritários planejados, conforme `buildStrategicExecution`. Sem snapshot/classificação suficiente, mostrar ausência e cobertura, nunca derivar da aderência de carga.
- **Principais mudanças:** apenas séries observáveis e comparáveis no período; até cinco itens iniciais. Sem evidência, explicar o dado faltante.

## Contratos de migração

Mover o proprietário de cada análise junto com seu renderer, sem duplicar IDs ou recalcular a métrica. A tela de origem conserva somente um resumo que tenha função própria e um link contextual. Gráficos apresentam valores também em texto. O filtro global de Desempenho é estado de UI, não dado de backup. A navegação preserva o concurso ativo e, quando aplicável, período, disciplina e tópico.

## Situação após os pacotes 4–9

Desempenho passou a apresentar questões, simulados, disciplinas, detalhe de tópico e consistência no período e concurso ativos. A Visão Geral aponta para o histórico completo e conserva o índice atual, o fechamento e decisões estratégicas. Questões e Simulados conservam os registros; a análise especializada de erros fica recolhida. Metas conserva a execução do plano atual e uma comparação com datas personalizadas em painéis recolhidos. Os gráficos históricos de prontidão, tempo de estudo, heatmap e simulados deixaram as telas de origem.

A visão geral também compara precisão, tempo, volume e aderência com o período anterior equivalente. Precisão só recebe classificação com pelo menos 30 questões em cada intervalo; aderência requer 60 minutos planejados em cada um. Os insights são regras descritivas sobre mudanças observadas, sem atribuir causa. Com escopo ou evidência insuficientes, a interface explica a ausência do indicador. O heatmap limita a visualização diária a 90 dias e mantém o histórico semanal em uma lista expansível.
