# Recomendações de melhorias --- StudyTrack

## Objetivo

Este documento consolida as melhorias recomendadas para a evolução do
StudyTrack. A direção principal é integrar as funcionalidades existentes
em um ciclo coerente:

**Prova → Diagnóstico → Prioridade → Planejamento → Estudo →
Questões/Simulado → Resultado → Replanejamento**

## 🔴 Prioridade alta

1.  **Listas progressivas globais** --- exibir até 5 registros e usar
    `Mostrar mais · +N`.
2.  **Histórico real do Índice de Prontidão** --- snapshots semanais do
    índice e de seus fatores.
3.  **Gráfico de evolução da Prontidão** --- tendência e comparação com
    o último fechamento.
4.  **Explicabilidade das recomendações** --- mostrar por que cada
    recomendação foi produzida.
5.  **Rastreabilidade das decisões** --- prova → incidência → lacuna →
    recomendação → execução → resultado.
6.  **Mapa de lacunas aprimorado** --- Crítica, Alta prioridade,
    Monitorar, Consolidada e Evidência insuficiente.
7.  **Planejamento × realizado** --- comparar previsto, executado e
    pendente.
8.  **Aderência estratégica** --- medir não só horas, mas execução das
    prioridades.
9.  **Evolução das prioridades** --- registrar entradas e saídas das
    prioridades.
10. **Foco Estratégico explicativo** --- decompor tempo prioritário,
    consolidado e de baixa evidência.

## 🟠 Questões e Simulados

11. Gráfico de evolução da precisão geral e por disciplina.
12. Gráfico de volume × precisão.
13. Perfil de erros por disciplina.
14. Evolução das categorias de erro.
15. Heatmap Disciplina × Desempenho.
16. Comparação dos últimos simulados por disciplina.
17. Radar de desempenho como visual complementar.
18. Tendência de simulados.
19. Melhor resultado × atual × média.
20. Diagnóstico pós-simulado com ações práticas.

## 🟠 Metas e produtividade

21. Planejado × realizado por semana.
22. Taxa histórica de cumprimento das metas.
23. Metas específicas por disciplina.
24. Meta por dia da semana.
25. Calendário/heatmap de consistência.
26. Sequência atual, maior sequência e frequência média.
27. Comparação das últimas quatro semanas.
28. Indicador de sobrecarga do planejamento.

## 🟠 Inteligência da Prova

29. Evolução da confiança da evidência.
30. Matriz **Incidência × Domínio**.
31. Impacto potencial das lacunas em pontos.
32. Explicação dos pesos usados na prioridade.
33. Comparação BB × Caixa sem duplicar tópicos.
34. Indicadores de qualidade da base histórica.
35. Fila de auditoria de divergências.

## 🟠 Visão Geral

36. Transformar a Visão Geral em painel de decisão: como estou, se estou
    melhorando, onde perco pontos, o que estudar agora e se estou
    cumprindo o plano.
37. Card de **Próxima melhor ação**.
38. Tendência junto aos KPIs.
39. Resumo compacto da semana atual.
40. Evitar números sem meta, comparação ou contexto.

## 🟡 Fechamento semanal

41. Organizar como
    `Planejado → Executado → Resultado → Diagnóstico → Próxima semana`.
42. Comparação automática com a semana anterior.
43. Até três principais avanços.
44. Até três principais problemas.
45. Recomendações aceitas e recusadas.
46. Resultado das decisões anteriores.
47. Resumo estratégico baseado nos próprios dados.

## 🟡 Revisões

48. Painel: em dia, próximas, atrasadas e críticas.
49. Evolução da retenção.
50. Prioridade de revisão combinando atraso, importância, domínio e
    retenção.
51. Revisões que mais recuperaram desempenho.
52. Integrar revisões às listas progressivas.

## 🟡 Personalização

53. Dashboard parcialmente reorganizável, preservando a estrutura
    principal.
54. Densidade confortável/compacta para listas e tabelas.
55. Períodos globais consistentes: 7, 30, 90 dias e Tudo.
56. Comparação automática com período anterior.
57. Persistência de filtros relevantes, principalmente concurso e
    período.

## 🟡 Design e UI

58. Consolidar botões, selects, chips, badges, cards, modais, tooltips,
    listas e estados vazios.
59. Criar tokens semânticos (`success`, `warning`, `critical`, `info`,
    `surface`, `border`).
60. Padronizar hierarquia tipográfica.
61. Padronizar espaçamentos.
62. Skeletons em áreas analíticas pesadas.
63. Estados vazios que expliquem como gerar dados.
64. Tooltips para Prontidão, confiança, Foco Estratégico, impacto e
    retenção.
65. Padronizar gráficos, legendas, escalas e tooltips.
66. Melhorar acessibilidade dos gráficos com resumos textuais.

## 🟡 Navegação e UX

67. Busca global por disciplina, tópico, simulado, prova e
    funcionalidade.
68. Atalhos contextuais de lacunas para Estudar, Questões ou Planejar.
69. Breadcrumbs apenas em fluxos profundos.
70. Preservar filtros e contexto ao navegar.
71. Reduzir competição entre CTAs.
72. Melhorar descoberta da Inteligência da Prova e planejamento
    adaptativo.

## 🟡 Demo 2.0

73. Transformar a Demo 2.0 em fixture oficial de regressão.
74. Tour opcional: Visão Geral → Questões → Inteligência da Prova →
    Planejamento → Fechamento.
75. Validar automaticamente a narrativa da demo contra os cálculos
    reais.
76. Testes visuais desktop/mobile e claro/escuro.
77. Não aumentar o volume agora; priorizar coerência e rastreabilidade.

## 🔵 Arquitetura e qualidade

78. Continuar reduzindo responsabilidades do `app.js`.
79. Criar contratos claros entre domínio e UI.
80. Centralizar seletores analíticos.
81. Versionar algoritmos de Prontidão e priorização.
82. Criar snapshots históricos imutáveis.
83. Auditar dados derivados e evitar persistência desnecessária.
84. Validar IDs órfãos, tópicos inexistentes, sessões inválidas e
    duplicações.
85. Melhorar E2E por jornadas completas.
86. Testar históricos de 1, 2 e 3 anos.
87. Usar paginação/virtualização em volumes realmente grandes.
88. Monitorar performance dos gráficos.

## 🔵 Funcionalidades futuras de alto potencial

89. Projeção de nota/probabilidade de atingir a meta. [Concluído]
90. Simulador **"E se?"**. [Concluído — Fase 2]
91. Reta final automática. [Concluído — Fase 2]
92. Modo pós-simulado com plano de correção.
93. Análise aprofundada por tópico.
94. Detecção de platô.
95. Detecção de falsa consolidação (ilusão de competência). [Concluído — Fase 2]
96. Custo de oportunidade do estudo.
97. Previsão de cobertura do edital.
98. Planejamento automático da reta final. [Concluído — Fase 2]
99. Resumo mensal permanente.
100.  Linha do tempo da preparação.

# Top 10 --- Roadmap recomendado

1.  Listas progressivas globais. [Concluído — Fase 4]
2.  Snapshots + gráfico do Índice de Prontidão. [Concluído]
3.  Planejado × realizado × prioridade executada. [Concluído]
4.  Explicabilidade completa das recomendações. [Concluído — Fase 1]
5.  Matriz Incidência × Domínio. [Concluído]
6.  Evolução e comparação visual de Questões/Simulados. [Concluído]
7.  Fechamento semanal orientado a decisões. [Concluído]
8.  Centralização e padronização do sistema de componentes. [Concluído — Preact 11 + Tailwind CSS v4]
9.  Projeção de nota/atingimento da meta. [Concluído]
10. Reta final automática conforme a proximidade da prova. [Concluído — Fase 2]

# Direção estratégica

O StudyTrack já possui um conjunto amplo de funcionalidades. A próxima
fase deve priorizar menos a quantidade de recursos isolados e mais a
integração dos dados:

**PROVA → INCIDÊNCIA/PESO → DESEMPENHO → DIAGNÓSTICO → PRIORIDADE →
RECOMENDAÇÃO → PLANEJAMENTO → EXECUÇÃO → QUESTÕES/SIMULADOS → RESULTADO
→ FECHAMENTO → REPLANEJAMENTO**

## Princípio de produto

> **O diferencial do StudyTrack não deve ser apenas registrar o que o
> estudante fez, mas transformar evidências em decisões claras sobre o
> que ele deve fazer em seguida.**
