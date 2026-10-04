# Sustentabilidade do planejamento

## Pacote 1 — Integridade histórica

Novos blocos preservam versão do plano, disciplina, tópico, atividade, prioridade completa, duração original e vigência diária inclusiva. O identificador da versão é o `studyPlanId`; vigência diária não representa vigência do plano semanal inteiro. Replanejamentos copiam o contexto congelado, mantendo a raiz da linhagem. Capturar uma atividade legada durante seu adiamento não comprova seu contexto original; essa lacuna permanece explícita.

`planningCapacityHistory` registra a grade declarada de sete dias, total, data de efeito e instante de captura. A primeira observação ocorre no carregamento real; edições de disponibilidade registram a grade anterior e a nova. Registros iguais não se repetem. A política diária usa a última configuração registrada até cada data; mudanças no próprio dia afetam esse dia inteiro, sem reconstrução intradiária. Datas anteriores à primeira observação têm capacidade desconhecida. A capacidade é global; aderência e planos continuam respeitando o concurso ativo.

A coleção é opcional em backups antigos, normalizada para lista vazia, validada na restauração e incluída na persistência. Nenhuma migração inventa disponibilidade antiga. O contexto de planejamento entra em novos fechamentos congelados; os anteriores permanecem intactos.

`planningContext` preserva todos os blocos, inclusive substituídos, descartados e adiados, separando minutos das raízes originais de transferências e da carga atualmente elegível para crédito. Esse registro explica ajustes sem substituir o denominador do contrato atual de aderência. Originais desconhecidos têm valor `null`.

## Modelo longitudinal — pacote 2

O modelo puro em `src/application/planning-sustainability/` consome a aderência reconciliada existente. Não altera sessões, prioridades, disponibilidade ou planejamento e não persiste resultados.

- Janelas de 4, 8 ou 12 semanas completas, de segunda a domingo. A semana corrente e períodos móveis de sete dias não entram na comparação.
- Escopo de concurso exato. A revisão congelada mais recente prevalece sobre dados reconstruídos; uma revisão incompatível não permite voltar silenciosamente à anterior.
- Capacidade histórica desconhecida, mudanças dentro da semana, contexto legado, identidades ambíguas e classificação insuficiente impedem a comparação. Semanas com outra capacidade ficam visíveis, mas fora do grupo da semana elegível mais recente.
- Três semanas permitem uma leitura preliminar; quatro permitem evidência confirmada. Esses estados indicam quantidade de evidência, sem classificar sustentabilidade ou recomendar mudanças.
- Aderência temporal e de prioridades usam médias ponderadas pelos respectivos minutos planejados. Tempo efetivamente estudado e estudo adicional continuam separados do crédito atribuído ao plano.
- A faixa de execução observada usa o intervalo interquartil, arredondado para fora em passos de 30 minutos. Não representa capacidade ideal, promessa de execução ou toda a amplitude observada; mínimo e máximo são fornecidos separadamente. Menos de três semanas não produz faixa.

Classificação, explicações e integração visual pertencem aos próximos pacotes.

