# Fase 0 — linha de base visual da Demo

**Data:** 12/11/2026. **Estado:** checkout local em `main`, Demo fictícia carregada em contexto isolado de navegador. **Escopo:** primeira dobra das sete áreas do plano; não é auditoria integral do produto. Os dados variam com a data da Demo. Capturas e medições estão nesta pasta; não são referências oficiais de regressão visual.

## Método e limites

Chromium headless, viewport de 900 px de altura; 320, 375, 430 e 1440 px, claro e escuro: 56 capturas da janela e medição de largura da página em cada combinação. Temas foram definidos no DOM para a matriz, não testados como jornada completa de alternância. O cabeçalho compacto pode permanecer após troca de abas: as capturas registram esse estado; a primeira Visão geral registra o cabeçalho expandido. Inspecionadas visualmente as sete telas em 1440 claro e 375 claro, além de Agenda 375 escuro e o cabeçalho inicial da Visão geral 375 claro; as outras imagens são evidência coletada, não revisão visual individual.

Axe executado nos painéis das sete áreas em 375 e 1440, nos dois temas, com regras `wcag2a`, `wcag2aa` e `wcag21aa`: nenhuma violação retornada nos 28 recortes. Isso inclui regras automatizáveis de contraste, mas não comprova conformidade AA, nem cobre cabeçalho, navegação, conteúdo oculto, todos os estados ou contraste manual. Medidas completas em `medicoes.json`.

Um percurso exploratório de 25 Tab foi registrado em 375 px, na aba Hoje com uma sessão fictícia ativa; os elementos percorridos reportaram `outline-style: solid`. Não foi realizada avaliação visual completa do foco, ordem de todas as jornadas, armadilhas, leitor de tela ou toque em aparelho físico. `interacao.json` contém a sequência. Zoom CSS 2 foi usado como sonda nas sete abas sem overflow global, mas **não substitui zoom real do navegador a 200%**; não declarar esse requisito concluído. Captura de sonda: `desempenho-1440-zoom-simulado.png`.

## Achados priorizados

1. **P1 — Agenda nomeia o mesmo total de formas incompatíveis.** Em 1440 claro, “9 VENCIDAS” é decomposto em “7 revisões + 2 tarefas”, mas o cartão seguinte diz “9 revisões atrasadas”. O subtítulo corrige a composição, mas o título continua impreciso. Na lista “Próximas revisões · 43” aparece item de Calendário. Rever rótulos e escopo sem misturar filas. Evidência: `agenda-1440-light.png`, `medicoes.json`; fonte da decomposição: `src/application/reviews/build-agenda-buckets.ts`.
2. **P2 — Ação primária concorre com estrutura anterior.** A primeira Visão geral em 375 mostra faixa Demo, cabeçalho de prontidão e utilitários antes do cartão; a ação começa em torno de 532 px e o botão é visível na janela de 900 px. Em 1440 o cartão divide espaço com Atenção e carga de revisões. A auditoria original é compatível com essa observação, mas tempo de decisão e dificuldade dos usuários não foram medidos. Evidências: `dashboard-375-light.png`, `dashboard-1440-light.png`.
3. **P2 — Densidade de entrada no celular.** Em 375 px, Questões apresenta quatro ações e cinco indicadores antes do início de “Onde vale insistir”; Disciplinas apresenta ações, resumo e filtros antes da primeira linha. Não há overflow global, mas a prioridade prática fica abaixo de grande parte da primeira janela. Evidências: `questoes-375-light.png`, `disciplinas-375-light.png`.
4. **P2 — Resumo de disciplinas incompleto como distribuição.** A Demo exibe 305 tópicos, 111 concluídos e 63 não iniciados, sem identificar ali os 131 restantes. Não inferir o estado desses tópicos por subtração como se fosse rótulo de domínio. Evidência: `disciplinas-1440-light.png`.
5. **P2 — Desempenho reúne janelas diferentes no mesmo bloco.** A leitura mostra prontidão atual, fechamento anterior, projeção de todo o histórico e volume de sete dias; os qualificadores existem. A legibilidade e a proximidade dos rótulos devem ser preservadas ao simplificar, pois não são medidas equivalentes. Evidência: `desempenho-1440-light.png`.

## O que já funciona e correções do plano

- Na Demo, Visão geral apresenta uma atividade planejada de Português e uma sugestão de Redação explicitamente fora do plano. Acionar “Iniciar estudo” abriu Hoje e iniciou o cronômetro de Português; o registro está em `interacao.json`. Em Desempenho, a recomendação estratégica usa “Abrir em Hoje”. Portanto a regra anterior de usar esse rótulo para **toda** a Visão geral estava incorreta: preservar o comportamento existente da atividade planejada; a ação de Desempenho mantém seu próprio contrato. A identidade da recomendação entre telas continua protegida por `tests/e2e/action-first-mobile.spec.js`.
- A navegação inferior existe em 375 px: Início, Desempenho, Hoje, Agenda e Mais. A medição encontrou 56 px de altura nos quatro itens da lista principal; Mais aparece na captura como controle separado. O cabeçalho compacto medido após rolagem começa em y=0 e tem 40 px; a barra inferior inicia em y=844. Não foi exercitado o menu Mais por teclado nem medido bloqueio de conteúdo em todas as posições.
- Sem overflow global nas 56 combinações medidas (`scrollWidth <= innerWidth`); isso não garante ausência de rolagem interna em tabelas ou que todos os controles sejam alcançáveis.
- Hoje apresenta plano antes da sugestão opcional; sessão livre e sugestão existem como conceitos separados. Planejamento já mostra plano confirmado e distingue cálculo e simulação. Questões exibe amostra e “Evidência insuficiente”. Desempenho mostra que a projeção não é chance de aprovação e associa a recomendação a baixa evidência e ausência no plano.

## Inventário para eventuais recolhimentos

Nenhuma remoção está aprovada. As fontes e destinos abaixo são pontos de partida; o denominador ou a janela assinalados como pendentes precisam ser confirmados no motor antes da mudança. Concurso é o contexto ativo da Demo quando aplicável.

| Candidata | Entidade / fonte atual | Janela e unidade / denominador | Destino completo e restrição |
|---|---|---|---|
| Atenção na Visão geral | Alertas de disciplinas, `#overviewAttention`; renderização no controlador de dashboard | Dias desde estudo por disciplina; regra e base de cada alerta a confirmar | Hoje: lista de alertas. Resumo já limita itens; preservar número total e acesso. |
| Carga de revisões na Visão geral | Agenda/revisões; `UpcomingReviewsList.tsx` e controlador de dashboard | Próximos 7 dias, quantidade por dia; atrasadas têm outro recorte | Agenda: filas e calendário. Confirmar inclusão de tarefas e fronteiras antes de comparar totais. |
| Execução de hoje | Atividades e minutos do plano diário; `TodayExecutionSummary.tsx` e modelo diário | Hoje; minutos, atividades e base planejada são unidades distintas | Hoje: plano e extrato diário. Preservar situação de sessão ativa e atividades não vinculadas. |
| Qualidade da evidência / sinais e lacunas | Evidências e disciplinas/tópicos no dashboard; fonte exata e janela por indicador pendentes | Não presumir equivalência entre amostra, histórico e diagnóstico | Desempenho e Diagnóstico/Hoje conforme entidade; manter ressalvas na ocorrência resumida. |
| Trajetória e comparações | Simulados e prontidão; modelos analíticos do dashboard | Período, prova, base comparável e snapshots a confirmar | Desempenho; fechamento histórico é snapshot distinto e não deve ser recalculado. |
| Planejamento e aderência | Plano, capacidade, execução e crédito; modelos de aderência/fechamento | Semana civil; minutos e prioridades, denominadores distintos | Planejamento e Desempenho → Consistência; preservar prévia e histórico. |
| Questões / pontos a insistir | Tópico, precisão, amostra e data; `question-weak-topics.ts` | Questões por tópico e janela calculada; critérios de suficiência a confirmar | Questões e análise detalhada; manter aviso de evidência insuficiente junto ao percentual. |
| Agenda e flashcards | Tarefas do calendário, revisões espaçadas e caderno de erros | Data civil e contagem de itens por tipo; filas possuem escopos distintos | Agenda e Caderno de Erros, respectivamente; não somar sem regra explícita. |

## Próximos passos para a fase 1

1. Corrigir primeiro a terminologia inconsistente de Agenda em entrega própria ou incorporá-la à fase 3; não transformar isso em mudança do cálculo.
2. Trabalhar a primeira dobra de Visão geral e Hoje a partir do estado real, mantendo início direto da atividade planejada e indicação da sugestão opcional. Comparar antes/depois com Demo densa e situações sem plano ou com sessão ativa.
3. Antes de recolher qualquer análise, completar a chave entidade, concurso, período, unidade, denominador e origem acima e confirmar que o destino contém o mesmo detalhe.
4. Completar zoom real 200%, navegação por teclado nas jornadas, leitor de tela e teste em telefone real quando disponíveis. Avaliar reconhecimento da ação com pessoas; nenhum teste de cinco segundos foi realizado.
