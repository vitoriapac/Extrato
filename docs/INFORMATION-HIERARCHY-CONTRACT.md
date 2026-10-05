# Contrato de hierarquia da informação

## Escopo e autoridade

Este é o contrato de apresentação da fase Simplificação e Coerência de Produto. Define o tratamento pretendido para as próximas correções; não declara que todas as telas já o implementam. A inspeção inicial foi feita sobre o código de `1c38079`, em 5 de outubro de 2026.

O [contrato da experiência de decisão](DECISION-EXPERIENCE-CONTRACT.md) continua definindo autoridade, cálculos, confirmação e histórico. A [hierarquia visual](VISUAL-HIERARCHY.md) documenta os tratamentos visuais e sua evolução. O [inventário de propriedade](INFORMATION-OWNERSHIP.md) registra ocorrências, atalhos e candidatos à simplificação. Estes documentos têm responsabilidades diferentes; não estabelecem regras alternativas para a mesma informação.

## Quatro níveis de leitura

| Nível | Pergunta | Conteúdo | Apresentação |
|---|---|---|---|
| 1 — decisão | O que acontece e qual próximo passo considerar? | Situação atual, atividade do plano, sinal principal ou decisão sugerida | Visível, com uma ação dominante por contexto de decisão |
| 2 — evidência | O que sustenta essa leitura? | Resultado, meta, diferença, tendência, período, escopo e confiança relevante | Visível e subordinada, com unidade e origem compreensíveis |
| 3 — explicação | Por que esta conclusão ou ação? | Fatores utilizados, sinais auxiliares e alternativas | Detalhes expansíveis próximos à conclusão |
| 4 — metodologia | Como interpretar o cálculo e seus limites? | Critérios, fórmulas, composição da amostra, comparabilidade e limitações detalhadas | Segundo disclosure quando necessário ou artigo específico da Central de Ajuda |

A ordem de leitura é decisão → evidência → explicação → metodologia. Não exige quatro cards, quatro títulos ou dois disclosures em cada módulo. Um conteúdo simples pode caber em uma única superfície.

### Evidência que muda a interpretação

- Confiança baixa ou insuficiente, falta de base comparável e ausência de dados ficam junto ao resultado que qualificam. Não ficam disponíveis somente depois de abrir a metodologia.
- Quando o tamanho da amostra determina se a conclusão pode ser usada, seu resumo acompanha o resultado. Distribuição e critérios completos podem ficar na metodologia.
- Zero medido não se transforma em ausência. Estimativas mantêm seu rótulo; Prontidão não representa chance de aprovação.
- Tendência não se apresenta como nota prevista. A distinção entre observado, tendência e meta permanece na legenda visível do gráfico.
- Restrições de capacidade, sessão em andamento e mudanças que exigem confirmação permanecem próximas ao CTA correspondente.

## Aplicação nas superfícies existentes

| Superfície | Primeiro plano | Investigação |
|---|---|---|
| Visão Geral | Síntese, configuração pendente, atividade e atenção principal | Resumos com acesso às análises canônicas; ocorrências completas existentes são avaliadas no inventário |
| Hoje | Execução, plano e atividade elegível | Sugestão opcional identificada; Diagnóstico e replanejamento continuam acessíveis no disclosure existente |
| Desempenho | Resultado no período, evolução e trajetória quando disponível | História, disciplinas, comparações, incidência e bases metodológicas |
| Metas | Capacidade declarada, plano confirmável, execução atual e objetivos editáveis | Sustentabilidade, configurações e histórico das decisões |
| Fechamento na Visão Geral | Resultado da semana, principal sinal e decisão sugerida | Sinais auxiliares, resultados posteriores e snapshots salvos |
| Central de Ajuda | Artigo ou conceito buscado | Explicações didáticas, sem executar cálculos do domínio |

Diagnóstico e Fechamento são superfícies, não novas abas. Esta fase não autoriza criar outra navegação principal ou mover automaticamente a Inteligência da Prova.

## Regras de densidade

1. Priorizar a atividade confirmada do plano sobre uma sugestão opcional. Uma sugestão não recebe aparência de alteração já aplicada.
2. Evitar duas ações primárias que competem pela mesma execução. Ações de confirmação, cancelamento e retorno mantêm seu significado próprio.
3. Exibir um diagnóstico principal por entidade, com sinais auxiliares na explicação. A repetição do nome de um tópico em execução e análise não prova redundância.
4. Manter o texto principal em aproximadamente uma ou duas frases quando isso preservar significado. Alertas críticos e condições de aplicação não são encurtados a ponto de desaparecer.
5. Reutilizar a [lista progressiva existente](../src/ui/progressive-list.js), normalmente com cinco itens. Listas de execução ativa, seleção, edição e comparação podem exigir exceção documentada; ocultar conteúdo não pode reduzir os dados avaliados.
6. Usar títulos, espaço e divisores antes de introduzir novos cards internos. Preserve os tokens e a identidade visual atuais.
7. Resumo e detalhe só compartilham um número quando fonte, unidade, período, concurso e entidade são compatíveis. Volume realizado, crédito ao plano, atividades concluídas e prioridades executadas não são intercambiáveis.

## Contrato de interação e acessibilidade

Disclosures usam `details` e `summary` ou o componente acessível existente. Preservam título, foco visível e funcionamento por teclado. Detalhes fechados não ocultam o único CTA necessário à tarefa principal. Links para investigação preservam contexto quando o controlador atual o suporta; lacunas de navegação entram no inventário, sem afirmar que já foram resolvidas.

No mobile, preservar ordem de leitura, retorno e acesso à explicação. Indicadores e estados têm texto equivalente; cor não é a única informação. A busca da Ajuda oferece artigo específico. Axe e teclado automatizados não equivalem a avaliação manual com leitor de tela.

## Aceite das próximas correções

- Conclusão, evidência e ação continuam compreensíveis sem abrir metodologia.
- Não há novo cálculo, score, limiar, mudança de persistência ou recálculo de snapshots para atender à apresentação.
- Informações completas continuam acessíveis, com destino e retorno definidos antes de reduzir uma ocorrência.
- Alterações de UI são justificadas por achados do inventário e das jornadas; o contrato sozinho não exige redesenhar uma tela.

## Validação dos pacotes iniciais

O pacote 1 altera somente Markdown. Validar referências locais, consistência entre contratos e o diff. Testes de aplicação, build, Fast, Demo e Full não são necessários nesta entrega documental, conforme [AGENTS.md](../AGENTS.md). As implementações posteriores seguem a [estratégia de testes por risco](TEST-STRATEGY.md).
