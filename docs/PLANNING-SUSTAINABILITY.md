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

O pacote 3 acrescenta classificação e explicações; o pacote 4 integra a leitura ao fechamento. Refinamento de Desempenho e Metas e regressão completa pertencem aos pacotes posteriores.


## Pacote 3 — Classificação e explicações

Política V1, escala percentual 0–100: compatibilidade requer aderência temporal ≥85% e prioridades ≥80%. Possível incompatibilidade de capacidade requer quatro semanas comparáveis, média temporal <75%, prioridades ≥80% e pelo menos três semanas com essa combinação e volume realizado abaixo do previsto. Desalinhamento prioritário requer quatro semanas, pelo menos três com volume ≥85% e prioridades <65%, e média prioritária <65%. Estudo adicional não vira crédito ao plano.

Uma única semana ≥30 pontos abaixo da mediana, com as demais ≥85%, é desvio pontual. Depois dessa proteção, coeficiente de variação populacional do volume ≥0,35 sinaliza execução irregular. A precedência é: insuficiência, anomalia, irregularidade, incompatibilidade de capacidade, desalinhamento prioritário, compatibilidade, acompanhamento. Evidência preliminar não recomenda mudanças estruturais. Textos determinísticos descrevem associação e não afirmam causalidade.

## Pacote 4 — Fechamento e decisão

O fechamento mantém seu período móvel de sete dias; a sustentabilidade exibida junto a ele usa exclusivamente semanas encerradas de segunda a domingo. Novos snapshots congelam essa análise e sua política junto à aderência. Registros antigos continuam sem análise longitudinal, sem reconstrução retroativa na interface histórica.

O card separa capacidade histórica, planejamento, execução e prioridades. Os detalhes explicam critérios e exclusões; listas longas usam o controle compartilhado Mostrar mais. Registros históricos não oferecem ações.

Revisar capacidade abre uma prévia somente para leitura. O limite superior da faixa observada é apresentado como cenário hipotético, com diferença de disponibilidade e aviso de que nenhum bloco foi redistribuído. Não há persistência nem aplicação. Abrir disponibilidade leva às configurações existentes; edições seguem seu fluxo usual. Se a disponibilidade atual difere da capacidade histórica comparada, a prévia fica indisponível e explica a mudança de base. Desalinhamento prioritário leva à distribuição do plano, sem sugerir redução de capacidade.

Pendências recorrentes oferecem navegação contextual para planejamento e desempenho do tópico, preservando concurso, disciplina, tópico, período e origem. Crédito zero e execução parcial são descritos separadamente; falta de crédito não afirma ausência de estudo adicional. Tópicos removidos, arquivados ou fora do concurso ativo não oferecem navegação operacional.


## Pacote 5 — Mudanças de aderência

A comparação semanal fornece uma explicação pura de crédito temporal, execução prioritária, volume adicional e classificação. Os percentuais não são somados em um score. Direções opostas são explicitadas como mudanças mistas; carga e capacidade diferentes são contexto, sem atribuição causal. Classificação insuficiente ou identidade ambígua bloqueiam interpretações estratégicas. Semanas em andamento usam o mesmo número de dias da anterior. A meta pessoal não modifica as diferenças observadas.


## Pacote 6 — Desempenho e Metas

Consistência em Desempenho segue resumo → gráfico principal → interpretação → investigação. O resumo distingue crédito temporal, execução prioritária, carga planejada e tempo realizado. O gráfico mostra até cinco disciplinas com maior carga planejada, com valores textuais; a tabela completa e as semanas ficam expansíveis. A janela semanal mantém seu seletor de 4/8/12 semanas e as listas longas usam Mostrar mais. Classificação, vínculos e estudo adicional ficam nos detalhes.

Metas agrupa os indicadores em Volume (tópicos, questões e simulados), Rotina (consistência e aderência) e Resultado (acerto). semanal/mensal continuam contando tópicos concluídos; disponibilidade em horas permanece no editor existente. Resultado oferece acesso às metas individuais de acerto. O renderer modular substitui a montagem de cards em app.js, sem alterar persistência, fórmulas ou handlers de edição.

