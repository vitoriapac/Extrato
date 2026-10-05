# Contrato da experiência de decisão

## Papéis e autoridade

| Superfície | Pergunta | Fonte existente | Autoridade |
|---|---|---|---|
| Visão Geral | O que merece atenção agora? | View-models das áreas | Sintetiza; não calcula outra prioridade |
| Desempenho | Como estou evoluindo? | application/performance | Compara resultados no período e escopo ativos |
| Projeção | Para onde aponta o histórico comparável? | application/projection/build-projection-page-model.js | Informa trajetória, limites e evidência; não cria atividades |
| Diagnóstico | O que merece atenção e por quê? | application/diagnostics/build-consolidated-diagnosis.js | Consolida sinais por entidade |
| Recomendação | Que ação considerar? | application/diagnostics/build-next-best-action.js e application/recommendations | Aconselha; sugestão não equivale a plano confirmado |
| Planejamento | O que foi incorporado à capacidade? | application/planning e application/recovery | Propõe; revalida antes da aplicação confirmada |
| Hoje | O que executar agora? | Plano diário e controlador de execução | Executa atividade elegível ou estudo adicional explicitamente identificado |
| Fechamento | O que ocorreu e qual decisão considerar? | application/adherence e modelos de fechamento | Avalia o período, com snapshots comparáveis |

## Fluxo apresentado ao estudante

Evidência → interpretação → sugestão → prévia → decisão humana → plano → execução → avaliação.

Diagnóstico e projeção podem consumir evidências em paralelo. Esta narrativa não cria dependências entre motores. Prontidão resume a preparação; não representa probabilidade de aprovação. Resultados comparáveis, tendência e faixa só são exibidos quando fornecidos pelo modelo correspondente.

## Contratos comuns

- Ausência de evidência não é zero. Zero medido permanece um resultado válido.
- Amostra insuficiente significa registros presentes que não atendem aos critérios do motor. Não aplicável significa que a métrica não se aplica ao contexto.
- Sugestão fora do plano não recebe aparência de atividade já confirmada. Seu estudo pode ser adicional, explicitamente rotulado.
- Prévia e simulação não persistem mudanças. Aplicação exige confirmação, revalidação e invariantes de capacidade e histórico.
- Meta sugerida é editável; não é uma prescrição calculada para a rotina.
- Valores e textos relacionados compartilham período, concurso, entidade e fonte. Arredondamento de apresentação não altera cálculos.
- Revisão crítica, cooldown ou restrição de capacidade podem justificar divergências. O relatório de coerência explica divergências; não substitui prioridade.
- Snapshots antigos não são recalculados com dados atuais; mudança de meta ou escopo exige comparação compatível.

## Reuso e limites

Reutilizar build-next-best-action, build-recommendation-explanation, build-decision-coherence-report e os modelos de projeção. Não introduzir outro score nem um modelo persistido de recomendação neste ciclo. Uma centralização adicional depende de duplicação comprovada no inventário de consumidores.

A primeira padronização de evidência fica em src/ui/evidence-state.js e atende retenção, percentuais de Desempenho e Projeção. O domínio mantém seus próprios critérios de disponibilidade e confiança. A apresentação não escolhe limiares, nem converte evidência baixa em ausência.

## Validação por risco

Usar Node para contratos e valores ausentes, zero, estimativa e amostra insuficiente. Jornadas browser verificam integração e foco. Fast ao concluir implementação; Full no fechamento integrado ou nas alterações abrangentes previstas em TEST-STRATEGY.md. Acrescentar um caso em arquivo existente também aumenta o número de casos Full, mesmo sem mudar seu manifesto.

Avaliação manual com leitor de tela deve ser registrada separadamente de axe e nomes acessíveis automatizados.

## Pacote 2 — apresentação compartilhada

presentEvidence retorna estado, rótulo, texto, mensagem contextual e confiança recebida. Aceita medido, estimado, sem dados, amostra insuficiente e ainda não aplicável. Somente números finitos são apresentados como valores; zero é válido. Um resultado declarado medido/estimado sem valor finito é apresentado como sem dados. Estados desconhecidos geram erro de contrato.

Retenção usa a mesma disponibilidade e o mesmo valor no resumo e na linha do tópico. Saúde da revisão continua separada. Desempenho reutiliza o helper para seus indicadores e Projeção para percentuais e orientação de disponibilidade. A orientação de Projeção deriva das exigências existentes de observações, questões e período; quando elas estão completas mas meta/data bloqueiam a análise, a mensagem orienta a configuração.

Mensagens específicas podem ser fornecidas pelos consumidores. O helper não calcula confiança, não contém HTML e não acessa persistência. Não há migração ou mudança de snapshots.

Validação dirigida: 22 testes Node de renderers, histórico e simulador passaram. Demo densa desktop claro e comparação visual passaram em 40,1 s, sem atualização de referências. Full, matriz visual completa e leitor de tela manual não foram executados nesta entrega.

Fast passou em 52,61 s; check:bundle confirmou os quatro artefatos reproduzíveis. Resultados locais não confirmam GitHub Actions.

## Pacote 3 — leitura de Desempenho e Projeção

O resumo de Desempenho identifica a evolução no período e seus indicadores como estado atual. O histórico salvo de Prontidão tem identificação própria, separado da trajetória dos simulados.

Na Projeção, o resultado observado dos simulados precede a meta. A faixa e a tendência mantêm os nomes e valores do motor existente; o observado não é renomeado para nota prevista. Confiança é contexto secundário após os valores. Entender esta projeção reúne fatores, tamanho da amostra e limites; o resumo não é repetido dentro do disclosure. O componente decision-explanation recebe fatores prontos e conteúdo metodológico escapado pelo consumidor. O link da Central de Ajuda continua na metodologia.

## Pacote 4 — plano, sugestão e execução

A atividade de execução diária recebe o rótulo Próxima atividade do plano. Uma sugestão divergente explica que o plano pode ser mantido. Em Diagnóstico, o rótulo identifica sugestão fora do plano, sugestão opcional ou recomendação estratégica. O CTA de uma sugestão opcional usa tratamento secundário mesmo quando coincide com a atividade planejada.

Os handlers de início, cronômetro, prévia e aplicação permanecem os existentes. A apresentação não altera prioridade, capacidade ou persistência. A matriz Node cobre atividade alinhada, tipo divergente, plano vazio, cronômetro vinculado e cronômetro de outra atividade, além de preservar as proteções anteriores de plano antigo e elegibilidade.

Validação dos pacotes 3 e 4: 32 testes Node passaram; sete casos visuais de Projeção/Hoje passaram em 1,8 min após inspeção das cinco referências alteradas. A jornada de dispensar sugestão e o resumo de Desempenho com Demo densa também passaram. Fast final: 105,99 s. check:bundle e inventário passaram. Full, matriz visual global e leitor de tela manual não executados.
