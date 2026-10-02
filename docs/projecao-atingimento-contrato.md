# Projeção de atingimento — contrato V2

A projeção avalia se os resultados medidos em simulados comparáveis e a tendência de 30 dias são compatíveis com a meta de nota configurada. Não converte o Índice de Prontidão em chance de aprovação.

## Fontes e limites

- A faixa atual vem de `buildCalibratedScoreProjection`: simulados da mesma composição, no mesmo escopo, com os mínimos de amostra já exigidos por esse cálculo. O chamador deve fornecer somente simulados do concurso ativo.
- A tendência vem de `buildPerformanceForecast`, alimentada **pelas observações comparáveis da projeção calibrada**, para manter a mesma medida. Sua janela é de 30 dias. Ela não é extrapolada até a prova.
- Cobertura, aderência e prioridades abertas são sinais de cautela na classificação, não multiplicadores da nota. Consistência entra na explicação, sem compensar desempenho fraco.
- A Prontidão aparece apenas como contexto. Questões avulsas, horas e sessões não alteram a precisão medida nos simulados.
- `projection.examDayScore` e `projection.approvalProbability` ficam `null`. O modelo não possui base para esses números.

## Estados

`insufficient_data` ocorre sem data futura válida ou sem simulados comparáveis suficientes. `on_track` requer confiança moderada, cobertura e execução medidas sem alertas, ausência de prioridades de alto impacto abertas e faixa atual acima da meta ou tendência medida capaz de alcançá-la em 30 dias com tempo suficiente. `at_risk` exige déficit medido próximo à prova ou déficit relevante acompanhado de deterioração/execução baixa. Os demais casos são `attention`.

A confiança fica limitada pela calibração dos simulados: `insufficient`, `low` ou `moderate`. O modelo atual não atribui confiança alta. Os resultados são orientação condicional, não garantia de nota ou aprovação.

## Cenários de regressão

Os testes cobrem iniciante, evolução, platô, deterioração, alta precisão com pouca cobertura, prazo curto e datas inválidas. Os snapshots preservam os insumos e a versão do algoritmo sem recalcular decisões passadas.

## Histórico e apresentação

Os snapshots da trajetória usam a coleção existente `projectionSnapshots`, com `kind: "achievement"`. Guardam data, escopo, versão, entradas comparáveis, meta, cobertura, execução, consistência, status, confiança e explicações congeladas. A assinatura evita duplicar o mesmo estado no mesmo dia. Registros antigos de calibração continuam aceitos e são ignorados pelo histórico de trajetória; snapshots de trajetória não entram na calibração retrospectiva.

Em **Desempenho → Visão geral**, o card mostra status, meta, precisão central dos simulados, faixa atual e tendência de 30 dias. O gráfico usa linha contínua para observações, tracejada para os próximos 30 dias e linha horizontal para a meta. A data da prova aparece como prazo textual: não há ponto numérico projetado para ela. O detalhamento explica a evidência e mostra até três registros históricos do concurso ativo.

## Contexto estratégico e prazo

A versão 2 acrescenta lacunas de alto impacto com domínio pessoal baixo e evidência suficiente, respeitando a ordem dos candidatos já calculados. A Inteligência da Prova apenas destaca essas lacunas; a Próxima Melhor Ação mantém a recomendação original e acrescenta uma razão contextual quando o tópico coincide. O Fechamento Semanal compara a leitura atual somente com um snapshot anterior do mesmo concurso, meta, data da prova e versão. Não atribui causalidade às decisões.

A interpretação de prazo reutiliza as fases existentes (`construction`, `consolidation`, `final_stretch`, `final_review`). Em até 14 dias, um déficit medido de pelo menos 5 p.p. passa a indicar risco; mais longe da prova, o mesmo déficit pede atenção, salvo deterioração ou baixa execução relevantes. “O que seria necessário?” lista revisões do plano sustentadas por déficit, cobertura, execução e lacunas medidas, sem alterar horas ou estimar nota futura. Snapshots de versão 1 continuam legíveis e não são comparados com os de versão 2.

## Regressão e CI

O gate local `npm run check:all` valida sintaxe, 491 testes unitários, artefatos gerados e 207 testes E2E (resultado em 2026-10-01). Os novos baselines cobrem o card em 320, 375, 430 e 1440 px, nos temas claro e escuro. A suíte específica de fuso executa 27 jornadas em `America/Sao_Paulo`, incluindo projeção, migrações, sessões e ciclo estratégico.

No GitHub Actions, unitários e bundle rodam em UTC e São Paulo; o E2E completo roda em UTC e a seleção sensível a datas roda em São Paulo. Os jobs executam em paralelo. O comando local `check:all` permanece completo.
