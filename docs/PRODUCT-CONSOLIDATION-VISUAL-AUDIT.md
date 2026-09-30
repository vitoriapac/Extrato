# Inventário de densidade — consolidação de produto

Este inventário descreve a hierarquia da interface após a criação de Desempenho e do Diagnóstico consolidado. A revisão combinou estrutura dos renderers com inspeção da Demo no navegador; contagem de cards acima da dobra depende do tamanho da janela e dos dados presentes. O cenário denso descrito em [Hierarquia visual](VISUAL-HIERARCHY.md) amplia a massa para uma auditoria posterior.

## Contrato de leitura

1. **Resposta:** situação principal e próxima ação, quando houver. Confiança insuficiente aparece aqui se mudar a interpretação.
2. **Evidência:** indicadores que justificam a resposta, com período, concurso e valores ausentes identificados.
3. **Detalhe:** séries, listas longas, metodologia e configurações sob demanda. Mais de cinco itens usam “Mostrar mais” ou controle equivalente.

Cards completos separam decisões ou fluxos independentes. Indicadores do mesmo assunto usam linhas e divisores dentro da seção; gráficos precisam de valores em texto. Um único CTA visualmente dominante deve orientar a ação do bloco.

## Inventário por área

| Área | Resposta e CTA | Evidência e detalhe | Ajuste desta rodada / acompanhamento |
| --- | --- | --- | --- |
| Visão Geral | Prontidão, foco e próxima ação | Evolução e fechamento têm leitura própria; histórico é aprofundamento | Manter resumos com link para Desempenho, evitando repetir gráficos históricos completos. |
| Hoje | Recomendação executável | Diagnóstico, revisões e replanejamento | Diagnóstico passa a mostrar conclusão antes das evidências; recuperação e dívida de revisão ficam em seção expansível com a contagem vencida visível. |
| Desempenho | Frase interpretativa e indicadores do período | Um gráfico ou comparação principal por visão; tabelas e séries longas nos detalhes | A sexta visão reúne Inteligência da Prova com filtros próprios de histórico e concurso explícito. |
| Diagnóstico | Um sinal principal por conteúdo e ação existente | Motivo e qualidade da evidência visíveis; medidas, sinais auxiliares e metodologia sob demanda | `DiagnosticSummary` separa conclusão, evidências e metodologia. Listas com mais de cinco diagnósticos continuam expansíveis. |
| Planejamento/Metas | Prévia e confirmação do plano, com capacidade | Distribuição, execução e comparação personalizada | Preservar prévia transitória; execução e comparação de datas específicas já ficam recolhidas. |
| Questões | Registro e resultado imediato | Erros e tópicos detalhados | Análises históricas pertencem a Desempenho; análise detalhada permanece recolhida em Questões. |
| Simulados | Registro e último resultado | Evolução, comparação e calibração | Desempenho concentra os gráficos; Questões conserva cadastro e leitura operacional. |
| Disciplinas | Conteúdo elegível e ação no tópico | Progresso, questões, revisões e estratégia | Manter configurações junto ao tópico; histórico comparativo pertence a Desempenho. |
| Revisões | Pendências e ação de revisão | Saúde da revisão e histórico | Contagem sozinha não determina prioridade; Diagnóstico distingue pendências de alto impacto e risco de consolidação. |
| Inteligência da Prova | Saúde da evidência e incidência × domínio | Divergências, matriz histórica, classificações e importação | A análise reside em Desempenho; a configuração estratégica continua em Metas. |

## Decisões e limites

- A ordem de leitura do Diagnóstico é **próxima ação → conclusão por conteúdo → recuperação/revisões → critérios completos**. O resumo de cada conteúdo mantém o rótulo da evidência à vista, mesmo quando seus números estão recolhidos.
- Desempenho usa seus indicadores como uma faixa editorial, sem bordas individuais. O período e o concurso continuam visíveis antes da leitura dos números.
- O inventário não altera fórmulas, pesos, prioridade, plano ou schema. Estados vazios continuam informando qual registro falta para produzir a análise.
- Na Demo, as nove abas e as cinco visões de Desempenho foram percorridas em 320, 375, 430 e 1366 px, nos temas claro e escuro. Não houve rolagem horizontal da página. O primeiro diagnóstico foi inspecionado recolhido e expandido em 375 px; em 320 px, o selo de evidência insuficiente e as ações permaneceram legíveis após o ajuste de layout.
- A massa densa com 15 disciplinas, foco de teclado, tabelas roláveis e todos os detalhes expandidos continua sendo uma verificação específica do cenário de regressão visual; esta inspeção da Demo não a substitui.
