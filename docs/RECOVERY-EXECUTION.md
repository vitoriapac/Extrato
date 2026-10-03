# Recovery e execução diária

## Timeline auditável

`build-recovery-timeline-detail.js` usa exclusivamente o registro confirmado da decisão. Origem, destino, carga, motivos, trajetória e versão do algoritmo não são reconstruídos com métricas atuais. Campos legados ausentes aparecem como não registrados.

Aplicação e reversão são eventos distintos. A reversão usa sua própria data e explica que o estudo já realizado foi preservado. A Timeline apresenta um resumo curto e detalhes recolhidos, mantendo os filtros e agrupamentos existentes. O componente compartilhado limita a lista inicial a cinco eventos.

A Timeline apenas apresenta os registros existentes; abrir detalhes não altera decisões nem recalcula seu histórico.

## Modelo compartilhado da execução diária

`application/daily-execution/build-daily-execution-model.js` recebe uma data local explícita, planos diários, sessões, catálogo, concurso ativo e a Próxima Melhor Ação já calculada. Não gera nem confirma planos. Retorna atividades reconciliadas, progresso, próxima atividade e prioridades ainda não acomodadas no plano.

- `reconcile-daily-execution.js` exige vínculo explícito por `planItemId` ou referência única em `sessionIds`, além de disciplina, tópico e tipo de atividade compatíveis. Tempo na mesma disciplina sem vínculo é estudo adicional. Um vínculo incompatível é identificado separadamente.
- Sessões são a fonte da execução; campos derivados como `executedSeconds` ou `completed` no plano não substituem evidência real. Sessões anteriores podem quitar uma atividade, mas não aumentam o tempo estudado hoje. Crédito é limitado à duração planejada.
- `build-daily-progress.js` separa tempo realizado, crédito de hoje, progresso total do plano, excedentes e pendências.
- `build-daily-priority.js` contextualiza a Próxima Melhor Ação existente. Quando ela corresponde a uma atividade pendente, essa atividade é destacada. As demais preservam a ordem do plano; não há novo score nem replanejamento. Uma recomendação fora do plano é retornada separadamente.
- Conteúdos arquivados e outro concurso não recebem novas ações. O estudo real preserva seu escopo gravado; o modelo não altera sessões ou histórico após Recovery.
- Atividades geradas por uma versão semanal anterior são sinalizadas com `needsPlanReview`, sem apagar execução nem redistribuir o dia automaticamente após Recovery.

`buildTodayViewModel` adapta o modelo compartilhado ao resumo de execução existente. Consumidores legados sem sessões e catálogo mantêm o contrato anterior. O futuro card Hoje usará o mesmo modelo, sem duplicar o cálculo da prioridade.

Todos esses builders operam sem persistência. A atualização da execução acompanha as renderizações existentes após registrar, editar ou excluir sessões. Não há migração de schema nesta entrega.

## Card Hoje e sessões

O card na Visão Geral mostra o planejado, o estudo real e o cumprimento das atividades. A próxima tarefa vem do mesmo modelo da aba Hoje. Iniciar revalida a tarefa no dia e concurso atuais; uma sessão já aberta deve ser retomada ou finalizada. Recomendações fora do plano são apresentadas para revisão, sem criar carga silenciosamente.

`daily-execution-controller.js` coordena a leitura e o início com os serviços existentes. `daily-execution-renderer.js` apresenta a próxima atividade, justificativa, pendências e estudo adicional. A fila fica recolhida, com cinco itens antes de Mostrar mais. O card participa das renderizações globais para acompanhar alterações de sessões, metas, concursos e Recovery.

O serviço de sessões usa o mesmo contrato de compatibilidade de disciplina, tópico e tipo. Uma sessão incompatível permanece no histórico, mas não marca a atividade como cumprida. Edição e exclusão recalculam o crédito; atividades descartadas, adiadas ou substituídas não são reabertas pelo sincronizador.

Itens legados sem disciplina, tópico ou tipo mantêm a compatibilidade do serviço de sessões nos campos ausentes. O modelo diário exige disciplina elegível e explicita estudo adicional quando não há vínculo seguro. Não infere retroativamente tipos ausentes.

## Consolidação da aderência — pacotes 1 e 2

O contrato `domain/planning/execution-contract.js` centraliza compatibilidade de atividade, data civil, identidade única, vínculo de sessão e crédito limitado. A execução estratégica usada no fechamento reutiliza essas regras. Tempo vinculado acima do previsto é excedente; tempo sem vínculo é adicional; vínculo com atividade incompatível não recebe crédito. Uma identidade de atividade duplicada não recebe crédito por escolha arbitrária.

Novas atividades geradas pelo plano semanal ou pelas recomendações recebem `executionSnapshot` versão 1: duração, tipo, disciplina/tópico, prioridade já capturada, concurso, data, versão semanal e origem. O snapshot é capturado uma vez e não acompanha mudanças posteriores da configuração. Atividades legadas mantêm os campos existentes e não recebem uma classificação histórica inventada.

O replanejamento mantém `rescheduledFromId` e uma origem comum no snapshot. `transferredMinutes` registra a parte transferida: o fechamento considera a parcela retida na origem e a parcela criada no destino, preservando o crédito de sessões anteriores sem duplicar tempo planejado. Desfazer uma transferência devolve apenas os minutos efetivamente desfeitos; destinos executados continuam protegidos. Conteúdos arquivados permanecem na execução estratégica histórica, embora não recebam novas ações diárias.

Esses campos são adicionais no registro existente, sem mudança de schema. O modelo de aderência e sua apresentação em Desempenho pertencem aos pacotes seguintes.

## Modelo de aderência — pacote 3

`application/adherence/build-adherence-model.js` interpreta a reconciliação estratégica existente, sem reconstruir vínculos de sessões. Retorna resumo, execução prioritária e disciplina. `volumeRatio` compara todo o estudo realizado com o planejado e pode superar 100%; `temporalAdherence` usa apenas crédito compatível, limitado por atividade. Excedentes, estudo adicional, vínculos incompatíveis e execução de atividades de outro período são separados.

A política `frozen-priority-minutes`, versão 1, calcula a execução prioritária usando a classificação booleana congelada e os minutos creditados. Também retorna contagens de atividades completas/parciais e equivalentes fracionários. As contagens são de blocos alocados; não representam quantidade de tópicos distintos. Não há novos pesos ou score. `classifiedCoverage` explicita a proporção com classificação histórica conhecida; atividades legadas não são classificadas retroativamente.

O período é limitado à data local informada, para que dias futuros não aumentem o denominador. O concurso gravado e o catálogo histórico delimitam o escopo; arquivamento não apaga o estudo passado. `buildPlanExecution` expõe o novo modelo em `adherenceModel`, mantendo os campos legados para os consumidores existentes. A apresentação visual será consolidada no pacote 5.

## Análise semanal — pacote 4

`build-weekly-adherence.js` retorna a semana atual, histórico de 4/8/12 semanas (padrão 8) e comparação com a anterior. A semana começa na segunda-feira local; permanece em andamento até o dia seguinte ao domingo. Durante a semana, o comparativo usa os mesmos dias decorridos da semana anterior. Semanas concluídas são comparadas integralmente. Nenhuma sessão futura entra na análise.

`adherence-status.js` publica a política versão 1: cumprimento de 80% como referência fixa inicial para crédito temporal e execução prioritária, com pelo menos 80% do tempo planejado historicamente classificado. Esse limiar é um contrato analítico; a meta opcional do usuário pertence ao pacote 8. Estados: `aligned` (ambos atendem), `time_gap` (somente carga abaixo), `priority_gap` (somente prioridade abaixo) e `mixed` (ambos abaixo). Ausência de plano avaliado, classificação insuficiente, identidade ambígua ou ausência de alocação prioritária produzem `insufficient_data` com códigos de motivo.

Os deltas só existem quando os dois períodos têm evidência suficiente. Não se compara uma quarta-feira com sete dias completos, nem se afirma que ausência de classificação representa execução ruim. O modelo não persiste, altera metas ou redistribui capacidade. `buildPlanExecution.weeklyAdherence` disponibiliza o contrato para os próximos consumidores; os campos legados de volume permanecem até a consolidação visual.

## Validação da jornada

### Demo e regressão — pacote 7

A Demo captura prioridades roteirizadas no momento de criação dos blocos e gera fechamentos com aderência congelada. Essa classificação demonstrativa não usa os scores atuais para reconstruir o passado. Fixtures determinísticas distinguem volume excedente sem crédito prioritário, execução prioritária com menor volume, execução equilibrada e parcial. Edição e exclusão de sessões atualizam a reconciliação atual sem modificar fechamentos salvos. A regressão inclui os fluxos de Recovery, backup legado, teclado, acessibilidade e telas estreitas.

### Meta pessoal opcional — pacote 8

Em Metas, a meta de aderência aceita 50–100%, começa em 80% e pode ser desativada. O campo `metas.aderenciaSemanal` armazena o percentual ou `null`. Dados legados sem o campo recebem 80%; backups com valores fora do contrato são rejeitados. A mudança não altera a disponibilidade, os planos ou os históricos.

Consistência e Trajetória apresentam o crédito compatível da semana atual, até hoje, em relação à meta pessoal. Sem plano comparável, explicam como obter evidência. Esse contexto não entra no cálculo da projeção, Prontidão ou prioridade e não estima ganho de nota. A política analítica versionada continua usando seu limiar de 80%, independente da meta pessoal. Novos fechamentos guardam `personalTarget` junto ao modelo; alterar a meta não reinterpreta retratos antigos. Reativar a meta usa o padrão de 80%.

### Desempenho — pacote 5

Em Desempenho → Consistência, o resumo separa tempo realizado, crédito compatível com o plano, execução prioritária e cobertura da classificação histórica. A explicação distingue estudo adicional, excedente vinculado e vínculo incompatível. Evidência limitada mantém os minutos observados visíveis e deixa a interpretação prioritária indisponível.

A comparação semanal usa barras de planejado e realizado na mesma escala, valores textuais e execução prioritária. O seletor de 4/8/12 semanas controla uma janela independente do período do resumo. A semana atual inclui somente os dias decorridos e seu comparativo usa os mesmos dias da anterior. A tabela por disciplina mostra minutos, crédito e prioridade. Listas e tabelas exibem cinco itens antes de Mostrar mais, pelo componente compartilhado; alterações de janela não persistem nem modificam planos.

O campo legado de horas realizadas / previstas continua disponível, mas a Visão Geral agora o identifica como **Volume de carga**, pois pode ultrapassar 100% e não mede crédito seguro às atividades. A Consolidação em Consistência usa os registros originais com escopo histórico para preservar atividades arquivadas.

### Fechamento e pendências recorrentes — pacote 6

O fechamento usa o mesmo modelo de aderência no período de sete dias mostrado na tela. Esse período móvel pode diferir das semanas de segunda a domingo em Consistência. O resumo apresenta crédito ao plano e o ciclo de decisões explicita execução prioritária, classificação e tipos de tempo não creditado. Resultados estratégicos não são destacados quando a classificação é insuficiente.

Novos retratos de fechamento têm versão 3 e preservam o modelo, a política analítica, a interpretação e as pendências daquele momento em `weeklyClose.adherence`. Alterar sessões, metas, prioridade ou catálogo não reescreve esses retratos. A nova lista de aderência salva mostra a revisão mais recente de cada período, mantendo as anteriores no histórico. Fechamentos antigos sem esse campo não recebem dados reconstruídos. Comparativos estratégicos não misturam a política nova com percentuais legados de método não registrado.

Uma pendência recorrente exige o mesmo tópico abaixo de 80% de execução prioritária no período atual e em pelo menos um período anterior salvo. A análise usa até três períodos anteriores, sem sobreposição, nas últimas quatro semanas e no mesmo escopo exato. Revisões do mesmo fechamento contam uma vez; dados insuficientes, períodos futuros, histórico antigo e outros concursos não criam alertas. Não se infere reincidência a partir dos planos atuais de semanas passadas.

O botão Revisar planejamento abre Metas. Nenhuma recomendação é aceita ou aplicada automaticamente; seleção, prévia, revalidação e confirmação continuam no fluxo existente. Mudança do período ou concurso invalida a confirmação da prévia, mesmo que as alocações permaneçam iguais. Novas atividades confirmadas pelo fechamento também recebem o snapshot de execução. As listas de pendências e de fechamentos salvos usam cinco itens antes de Mostrar mais. Detalhes históricos não oferecem ação para aplicar uma orientação antiga. A Timeline consulta a aderência congelada quando disponível, sem substituir dados insuficientes por um percentual legado.

O fluxo permanece: Desempenho → Diagnóstico → prévia de Recovery → confirmação → plano versionado → execução diária → sessão real → fechamento semanal. A Timeline permite consultar a decisão congelada e sua reversão; executar ou reverter não reescreve sessões anteriores. Alterações de plano não regeneram automaticamente o dia: o card sinaliza a necessidade de revisar a distribuição.

A aplicação verifica a virada da data local ao retornar à janela e a cada minuto, atualizando o contexto sem mudar registros. Não há fechamento diário obrigatório. Para levar pendências adiante, abra a aba Hoje e use o fluxo existente de replanejamento com confirmação.

Cobertura automatizada desta fase: modelo e controlador diário, crédito parcial/completo, atividade diferente, edição/exclusão, duplicatas, prioridades, mudança de prova, conteúdos arquivados e calendário local. A jornada de navegador cobre início pelo card, avanço sem reload, retomada após carregar o estado salvo e acessibilidade em 320/375/430 px. As regressões existentes continuam cobrindo Recovery, Demo e backup legado.
