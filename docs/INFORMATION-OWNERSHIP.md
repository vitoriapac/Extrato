# Inventário de propriedade das informações

## Escopo da auditoria

Este inventário registra onde as informações aparecem e qual função cada ocorrência exerce. A inspeção do produto e dos testes foi feita sobre o código-fonte de `1c38079`, em 5 de outubro de 2026. O contrato de hierarquia associado está em [INFORMATION-HIERARCHY-CONTRACT.md](INFORMATION-HIERARCHY-CONTRACT.md); a autoridade de cada motor continua definida no [contrato da experiência de decisão](DECISION-EXPERIENCE-CONTRACT.md).

Os rótulos descrevem a ocorrência na interface:

- **Canônica**: superfície que oferece a interpretação ou detalhe completo para aquele contexto.
- **Resumo**: apresentação parcial cuja função é orientar e encaminhar à superfície de detalhe.
- **Atalho**: ação de navegação ou operação, sem pretensão de ser outra fonte de análise.
- **Redundância candidata**: conteúdos com possível sobreposição que ainda precisam de comparação de entidade, período, escopo, unidade e evidência antes de qualquer consolidação.

Uma palavra ou um tópico repetido não basta para declarar redundância. O mesmo indicador pode ter denominadores, janelas ou finalidades diferentes.

## Contrato operacional — consolidação da experiência

Revisão em `c28b51d`, 5/10/2026. A tabela abaixo define responsabilidades para os pacotes desta fase. **Superfície** não significa nova aba: Prova é a subvisão Inteligência da prova em Desempenho; Fechamento está na Visão Geral; planejamento e fase continuam acessíveis em Metas. Não criar destinos inexistentes.

| Informação | Proprietário de detalhe | Resumo permitido fora dele | Destino e contexto obrigatório |
|---|---|---|---|
| Próxima atividade e execução diária | Hoje | Atividade elegível, progresso e início na Visão Geral | Hoje; preservar ID da atividade e plano confirmado |
| Recomendação estratégica | Hoje / Diagnóstico | Próxima ação e justificativa curta | Mesmo ID/tipo da recomendação; sugestão não substitui atividade confirmada |
| Prontidão atual global | Visão Geral | Indicador em Desempenho | Distinguir valor global de snapshots no período; fatores atuais permanecem na origem |
| Evolução da Prontidão | Desempenho / Visão geral | Variação resumida em fechamento | Período, concurso e par de snapshots congelados |
| Projeção e trajetória | Desempenho / Visão geral | Valor, confiança e referência em Metas/fechamento | Atual vs. snapshot semanal, meta e prova; sem recálculo do passado |
| Meta de nota | Metas | Alvo e distância em Desempenho | Objetivo ativo; edição somente no proprietário |
| Incidência × domínio | Desempenho / Inteligência da prova | Fator relevante na recomendação | Concurso, tópico, origem histórica e confiança |
| Aderência temporal | Desempenho / Consistência | Resultado no período correspondente | Janela, denominador e classificação da evidência |
| Execução da semana / metas | Metas | Balanço no fechamento | Semana civil, plano/versionamento, carga e prioridades separados |
| Decisão semanal | Fechamento na Visão Geral | Sinal e acesso em Metas | Semana/snapshot de origem; resultado posterior sem atribuição causal |
| Fase e capacidade | Planejamento em Metas | Contexto da ação/projeção | Data da prova, capacidade declarada e prévia confirmável |
| Diagnóstico principal | Hoje / Central de Diagnóstico | Principal sinal e acesso contextual | Uma entidade, diagnóstico dominante e evidências auxiliares |

Esta fase preserva a propriedade global da Prontidão já implementada. Transferir seus fatores para Desempenho exigiria migração de superfície e revisão dos destinos; não é consequência automática desta matriz. O pacote 3 reorganiza apenas a narrativa de Desempenho.

### Critério para reduzir uma ocorrência

Registrar **entidade + concurso + período + unidade + denominador + fonte**, classificar conteúdo como resultado, contexto, evidência ou ação e identificar o detalhe preservado. Só consolidar análises completas quando essa chave e a finalidade coincidirem. Resumos operacionais e snapshots semanais não são duplicações por exibirem o mesmo nome.

### Backlog verificável

| Candidata | Tratamento | Pacote |
|---|---|---|
| Históricos antes da trajetória em Desempenho | Mostrar trajetória atual antes da investigação histórica | 3 |
| Texto explicativo recorrente | Aplicar o contrato de hierarquia; manter ressalvas que qualificam o resultado | 4 |
| Projeção atual vs. fechamento | Preservar snapshot e resumir com link quando o mesmo detalhe estiver repetido | 5 |
| Execução em Metas vs. Consistência | Comparar semanas e denominadores antes de reduzir apresentação | 5 |
| Diagnóstico vs. evolução do tópico | Usar navegação contextual, sem fundir leitura atual e série histórica | 6 |

Aceite: nenhum destino novo, nenhuma edição fora da autoridade existente, nenhum resultado histórico reinterpretado como atual. O inventário de ocorrências abaixo é evidência da inspeção inicial; o backlog registra decisões novas sem apagar essa proveniência.

## Inventário observado

| Informação | Ocorrência principal | Outras ocorrências | Classificação observada | Tratamento e ressalva |
|---|---|---|---|---|
| Próxima atividade do plano | **Hoje** — plano e execução diária | **Visão Geral** — `#dailyExecutionDashboard` e `#overviewNextAction` | Canônica em Hoje; resumo/atalho operacional na Visão Geral | A atividade do plano e a recomendação estratégica são conceitos diferentes. Verificar qual delas é exibida em cada bloco antes de remover uma repetição. |
| Próxima recomendação estratégica | **Hoje** — `#studyRecommendation` | **Visão Geral** — `#overviewNextAction` | Canônica em Hoje; resumo acionável na Visão Geral | Testes E2E verificam que ambas apontam para o mesmo `data-study-action-id` e tipo. A repetição ajuda a iniciar o ciclo a partir de qualquer ponto de entrada. |
| Atenção e alertas | **Hoje** — lista completa de alertas e análises | **Visão Geral** — `#overviewAttention` mostra dois itens e contagem, com acesso a Hoje | Canônica em Hoje; resumo/atalho na Visão Geral | A quantidade limitada no resumo é uma redução deliberada. O inventário não recomenda duplicar a lista completa. |
| Índice de Prontidão e fatores | **Visão Geral** — `#approvalDashboard` | **Desempenho → Visão geral** — KPI e histórico no período selecionado | Canônica global na Visão Geral; ocorrência contextual em Desempenho | A leitura global e a filtrada por período não são intercambiáveis. Mostrar escopo temporal junto ao dado de Desempenho. |
| Desempenho agregado no período | **Desempenho** — resumo e visões filtradas | Indicadores do fechamento semanal na **Visão Geral** | Canônica por período em Desempenho; resumo de semana encerrada no fechamento | Precisão, tempo, evolução e aderência podem usar recortes distintos. Confirmar janela e base antes de unificar números semelhantes. |
| Trajetória e projeção | **Desempenho** — projeção e histórico de trajetória | **Visão Geral** — contexto da projeção dentro de `#weeklyCloseDashboard` | Canônica em Desempenho; resumo/atalho contextual no fechamento | Projeção atual e snapshot semanal salvo têm datas e finalidades diferentes; não recalcular snapshots para fazê-los coincidir. |
| Inteligência da Prova | **Desempenho** — `#examIntelligenceParking` e seu conteúdo montado | **Metas** — configuração estratégica, metas por disciplina e matriz de domínio | Canônica analítica em Desempenho; configuração/atalho em Metas | Configuração do edital, incidência histórica e domínio pessoal são dados relacionados, mas cada qual tem autoridade própria. |
| Diagnóstico consolidado por tópico | **Hoje** — `#diagnosisCenter`, recolhido junto às análises secundárias | **Visão Geral** — mapa de lacunas e sinais de atenção; **Desempenho** — evolução por disciplina/tópico | Canônica por entidade em Hoje; resumos ou análises longitudinais nas outras superfícies | Um tópico pode legitimamente aparecer na execução e no diagnóstico. Evitar mais de um diagnóstico principal para a mesma entidade; tratar os outros sinais como evidências ou navegação. |
| Mapa de lacunas | **Visão Geral** — `#gapMapDashboard` | Diagnóstico em Hoje e desempenho por disciplina em Desempenho | Canônica como síntese global de lacunas; possível sobreposição temática | Os módulos podem usar estado pessoal, impacto e período diferentes. Candidata a revisão somente se a mesma entidade e evidência forem repetidas sem contexto adicional. |
| Execução do plano e capacidade | **Metas** — `#planExecutionResults` | Fechamento da semana em **Visão Geral**; consistência/aderência em **Desempenho** | Canônica para plano e capacidade; resumos de fechamento; análise temporal em Desempenho | Volume planejado, volume realizado, crédito ao plano e atividades concluídas são medidas distintas. Não substituir por um único percentual de “execução”. |
| Aderência | **Desempenho → Consistência** — análise de aderência por janela e disciplina | **Metas** — resultados de execução; **Visão Geral** — fechamento de semanas específicas | Canônica para tendência de aderência por janela em Desempenho; evidências relacionadas nas outras áreas | A janela semanal do gráfico pode ser independente do período do resumo. Comparar denominador, cobertura classificada, semana e escopo antes de chamar de redundância. |
| Fechamento semanal | **Visão Geral** — `#weeklyCloseDashboard` | **Metas** — `#metasWeeklyCloseSummary`, com botão que retorna à Visão Geral | Canônica completa na Visão Geral; resumo/atalho em Metas | A existência de resumo junto às metas serve ao fluxo de decisão de capacidade. A navegação explícita preserva um destino único para o fechamento completo. |
| Histórico de decisões, linha estratégica e evolução de prioridades | **Visão Geral** — `#decisionHistoryDashboard`, `#strategicTimelineDashboard`, `#priorityHistoryDashboard` | Histórico específico junto aos módulos de planejamento e desempenho | Canônica por tipo de registro em cada visualização; possível sobreposição nominal | Decisões auditáveis, sequência cronológica e snapshots congelados de prioridade respondem a perguntas diferentes. Não as fundir sem mapear tipo, data, entidade e snapshot de origem. |
| Metas e objetivos | **Metas** — `#metasContainer` e controles de objetivo | Resumo/indicadores na Visão Geral e comparação de desempenho | Canônica para edição; resumo e acompanhamento nas demais áreas | Valor editável, resultado realizado e projeção devem manter rótulos e período próprios. A auditoria não confirmou duplicação de autoridade. |
| Metas de domínio por disciplina/tópico | **Metas** — alvos de precisão e matriz de domínio | **Desempenho** — precisão observada no período; **Desempenho** — configuração e histórico da prova | Canônica para configuração dos alvos; comparações observadas nas outras áreas | Meta pessoal, desempenho medido e peso/incidência da prova são dimensões separadas. Evitar chamá-las todas de “meta” sem qualificador. |
| Feedback de recomendação e resultado posterior | **Hoje** — recomendação e resultado ligado à ação | **Visão Geral** — ação recomendada e acesso ao mesmo ciclo | Canônica no fluxo da recomendação; atalho de início na Visão Geral | Origem da ação e resultado posterior precisam permanecer ligados ao mesmo identificador. Feedback repetido pode ser útil quando a recomendação é iniciada na Visão Geral. |

## Achados para a próxima revisão

1. **Proteger contexto antes de consolidar.** Para cada número repetido, confirmar entidade, concurso ativo, intervalo, unidade, denominador e origem. O inventário não identifica números visualmente iguais como o mesmo indicador sem esses dados.
2. **Preservar as entradas compartilhadas da ação.** Visão Geral e Hoje iniciam a mesma recomendação; o teste `action-first-mobile.spec.js` protege o ID/tipo compartilhado e o encaminhamento entre telas.
3. **Distinguir as medidas de execução.** O renderer de aderência explicita planejado, realizado, crédito compatível, prioridades e cobertura classificada. Essa distinção é fundamental para fechar qualquer auditoria de “aderência duplicada”.
4. **Verificar densidade da Visão Geral com dados extensos.** Ela agrupa próxima ação, execução diária, prontidão, fechamento, lacunas e três registros históricos. Antes de mover ou ocultar blocos, reproduzir viewport e perfil denso e validar o caminho de retorno.
5. **Manter o fechamento completo em um destino.** O resumo em Metas já oferece navegação direta para o fechamento na Visão Geral; evitar manter duas versões extensas concorrentes.

## Ocorrências que ainda não estão comprovadas como redundantes

- Prontidão global e seu valor no resumo filtrado de Desempenho.
- Execução do plano, aderência por janela e execução da semana encerrada.
- Projeção atual e contexto/snapshot incluído no fechamento.
- Mapa de lacunas, Diagnóstico e evolução de desempenho do mesmo tópico.
- Histórico de decisões, linha estratégica e histórico de prioridades.
- Configuração estratégica, incidência histórica e domínio pessoal.

Cada item acima exige verificar dados reais e recortes compatíveis antes de recomendar remoção, fusão ou uma nova hierarquia de navegação.

## Proteções existentes consultadas

| Proteção | Evidência | O que cobre |
|---|---|---|
| Entrada compartilhada da recomendação | [action-first-mobile.spec.js](../tests/e2e/action-first-mobile.spec.js) | Identidade da próxima ação entre Visão Geral e Hoje, além da navegação para diagnóstico. |
| Hierarquia de execução e análises secundárias | [action-first-mobile.spec.js](../tests/e2e/action-first-mobile.spec.js) | Hoje preserva ação/plano antes de análises recolhidas. |
| Separação entre plano e sugestão | [daily-execution.test.js](../tests/unit/daily-execution.test.js) | A sugestão fora do plano não substitui a atividade operacional; sinais adicionais permanecem no detalhe. |
| Contagem de atividades e crédito de tempo | [weekly-close-actions.test.js](../tests/unit/weekly-close-actions.test.js) | O resumo de fechamento não confunde atividades concluídas com minutos creditados. |
| Execução comparada à semana | [adherence-renderer.js](../src/ui/renderers/adherence-renderer.js) | Mostra plano/real, crédito, prioridades e cobertura classificada separadamente. |
| Fechamento integrado e histórico | [strategic-cycle.spec.js](../tests/e2e/strategic-cycle.spec.js) e [achievement-projection.spec.js](../tests/e2e/achievement-projection.spec.js) | Cobre jornadas estratégicas, fechamento e contexto de projeção. |

Estas referências protegem contratos específicos; não equivalem a uma auditoria completa de todas as combinações visuais, períodos ou leitores de tela.

## Limites e próximo uso

Este pacote documenta o estado encontrado e não altera renderers, cálculo, persistência, snapshots ou navegação. O pacote seguinte pode usar esta matriz para selecionar mudanças de UX, começando por perfis densos e pelas ocorrências marcadas como candidatas. Uma futura declaração de redundância deve citar a mesma entidade, escopo, período, unidade e fonte, além do destino completo preservado.

A [auditoria de jornadas](PRODUCT-JOURNEY-AUDIT.md) registra a execução dos seis perfis e as correções de apresentação dos pacotes 3 e 4. Esta matriz conserva a propriedade observada na inspeção inicial; a ordem do plano e da sugestão em Hoje foi corrigida depois dela.

## Validação do pacote 2

Somente Markdown foi alterado. Foram revisados links locais para os arquivos citados e o diff; testes da aplicação não são necessários para este pacote documental, conforme [AGENTS.md](../AGENTS.md).
