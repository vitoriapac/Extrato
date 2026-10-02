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
