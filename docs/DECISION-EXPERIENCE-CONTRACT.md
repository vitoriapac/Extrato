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
