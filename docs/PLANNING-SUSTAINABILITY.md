# Sustentabilidade do planejamento

## Pacote 1 — Integridade histórica

Novos blocos preservam versão do plano, disciplina, tópico, atividade, prioridade completa, duração original e vigência diária inclusiva. O identificador da versão é o `studyPlanId`; vigência diária não representa vigência do plano semanal inteiro. Replanejamentos copiam o contexto congelado, mantendo a raiz da linhagem. Capturar uma atividade legada durante seu adiamento não comprova seu contexto original; essa lacuna permanece explícita.

`planningCapacityHistory` registra a grade declarada de sete dias, total, data de efeito e instante de captura. A primeira observação ocorre no carregamento real; edições de disponibilidade registram a grade anterior e a nova. Registros iguais não se repetem. A política diária usa a última configuração registrada até cada data; mudanças no próprio dia afetam esse dia inteiro, sem reconstrução intradiária. Datas anteriores à primeira observação têm capacidade desconhecida. A capacidade é global; aderência e planos continuam respeitando o concurso ativo.

A coleção é opcional em backups antigos, normalizada para lista vazia, validada na restauração e incluída na persistência. Nenhuma migração inventa disponibilidade antiga. O contexto de planejamento entra em novos fechamentos congelados; os anteriores permanecem intactos.

`planningContext` preserva todos os blocos, inclusive substituídos, descartados e adiados, separando minutos das raízes originais de transferências e da carga atualmente elegível para crédito. Esse registro explica ajustes sem substituir o denominador do contrato atual de aderência. Originais desconhecidos têm valor `null`.
