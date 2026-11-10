# Plano: Desempenho que responde "como estou" e "como melhoro"

Origem: quatro rodadas de crítica da aba Desempenho em 10/11/2026 (nota 26 → 27 de 40; snapshots em `.impeccable/critique/`), mais o pedido de tornar a aba analítica e ligada ao planejamento e às sugestões que o app já calcula.

## 1. Onde estamos

Os achados mecânicos zeraram: detector 0, overflow 0, contraste de texto pequeno 0 falhas, ARIA quebrado 0, controles sem nome 0. O que segura a nota é de **conteúdo e estrutura**:

- A aba é um inventário de medições, não uma leitura. Quem abre vê blocos de mesmo peso e precisa montar a resposta sozinho.
- A mesma pergunta tem várias respostas: aderência aparece como 0%, 67,7%, 76,9%, 82%, 82,3% e 96%; Prontidão como 46, 53, 56, 57, −3 e −4. Cada valor tem janela própria, mas a tela não ensina a diferença.
- As sugestões que o app já calcula (próxima ação, plano, recuperação, foco estratégico) vivem em Hoje, no Diagnóstico e em Metas. Desempenho só as cita de passagem.

Regras que o plano respeita (de `docs/INFORMATION-OWNERSHIP.md`, `PRODUCT.md` e `docs/MICROCOPY-CONTRACT.md`):

- **Hoje é dono da próxima atividade e da recomendação estratégica.** Desempenho pode mostrar um resumo curto, com o mesmo ID e tipo da recomendação, e levar ao dono. Sugestão não substitui atividade confirmada.
- **Metas/Planejamento é dono do plano, da capacidade e da fase.** Desempenho mostra o contexto e abre a prévia; não aplica nada sozinho.
- Sem afirmação de causa. Evidência insuficiente é declarada. Uma prioridade só. Terminologia fixa (Prontidão, Domínio, Retenção, Aderência).
- Nenhuma fórmula nova: a camada nova só **compõe** o que já é calculado.

## 2. Análise das personas

Três personas, nas duas últimas rodadas. Cada linha traz o sintoma, a causa e o destino no plano (tarefa `T…` da seção 5). O que já foi corrigido está marcado.

### Alex, concurseiro de rotina, quer ação rápida

| Sintoma | Causa | Destino |
|---|---|---|
| Abre o resumo e precisa escolher entre 3 botões iguais | O resumo semanal trazia 3 atalhos do mesmo peso | Feito: o primeiro virou botão sólido. Falta ligá-lo à ação do plano (T5) |
| No Diagnóstico encontra 5 cartões "Importante / Evidência: Baixa" quase idênticos e "+292 diagnósticos" | Sem ordenação visível nem corte | T5: a faixa traz os 3 principais e o Diagnóstico mantém a lista completa em dobra |
| Vê Prontidão 46 no cabeçalho e 53 no fechamento sem saber qual vale | Valores com janelas diferentes lado a lado | T2 |
| Sem ordenação nem exportação em Questões e Simulados; "Mostrar mais · +300" sem busca | Só há filtro de período | T12 |
| Sem link permanente para um bloco | Só a seção tem URL | T13 |

### Sam, analítico, quer reconciliar os números

| Sintoma | Causa | Destino |
|---|---|---|
| 67,7% (aderência), 76,9% (volume de carga) e 82,3% (execução prioritária) sem explicação | Três fórmulas, três janelas | Parcial: Consistência abre com síntese que separa tempo total das outras bases. Falta recolher e rotular (T2) |
| Prontidão −3 no resumo, −4 na dobra, "−3 sobre 56" no KPI | Pares de snapshots diferentes | T2 |
| 33% e 38% (tarde), 68% e 69% (manhã) lado a lado | Todo o histórico contra o período | T7 |
| 304 e 305 tópicos; "12 de 17 com amostra" e "9 de 17 comparáveis" | Universos diferentes sem rótulo | T7 |
| Calendário com 364 células focáveis de 14×14 | Uma célula por dia, cada uma em `button` | T10 |
| Checkbox "Comparar período anterior" com 20×20 | Alvo pequeno | T10 |
| SVGs `progress-chart-svg` e `radar-svg` sem nome próprio | Só o contêiner tem `aria-label` | T10 |

### Casey, iniciante, celular, pouco tempo

| Sintoma | Causa | Destino |
|---|---|---|
| "Semana atual 0% · Meta ainda não atingida" soa como reprovação quando estudou 6 de 7 dias | Crédito ao plano só conta estudo vinculado a atividade | Feito: janela explícita e nota. Falta mostrar o tempo total junto (T2) |
| "Incidência × Domínio" e "Ritmo frente aos aprovados" são barreiras | Jargão e promessa sem fonte | Feito em parte (rótulo "referência interna, sem fonte oficial"). Falta glossário curto (T11) |
| Consistência com ~9,7 telas no celular | Cerca de 12 blocos sem síntese | Parcial (síntese feita); T8 reduz o resto |
| Primeira dobra ocupada por faixa de demo, busca, cabeçalho e abas | Chrome do app, fora do escopo de Desempenho | T5 encurta o bloco de Desempenho (título, subtítulo e filtros) e põe a leitura na primeira dobra |
| Células do calendário em 24×24 | Mesma causa de Sam | T10 |

## 3. Observações menores para correção

Cada item vira uma linha de tarefa. ✔ = já corrigido nesta rodada.

**Números e rótulos**
1. Prontidão −3 e −4 para o mesmo período: escolher um par de snapshots e rotular o outro. (T2)
2. 33%/38% e 68%/69% do turno: manter só a versão do período no Diagnóstico e a de todo o histórico em Consistência, cada uma com a janela no rótulo. (T7)
3. Contagens do mesmo universo (304 e 305; 12 de 17 e 9 de 17): uma legenda por contagem explicando o recorte. (T7)
4. Legenda do heatmap salta de 75% para 100% (`<25 · 25–50 · 50–75 · ≥100`): preencher a faixa de 75% a 100%. (T7)
5. "Desempenho" como palavra para aba, gráfico e tópico: nomear cada ocorrência pelo conteúdo ("Precisão por disciplina", "Resultado das questões"). (T11)
6. "Seletor de período próprio" em Histórico, sem seletor visível: trocar o texto pela faixa de datas. (T11)
7. ✔ Rótulos do benchmark em sentence case e sem promessa de aprovação.

**Estados vazios e coerência**
8. ✔ Mapa de estabilidade: quadrantes vazios dizem "Nenhuma disciplina neste grupo no período".
9. ✔ Prova × Você: mensagem diz o critério real (presença ≥ 50%, domínio < 70, confiança moderada ou alta).
10. Duas narrativas de prioridade ("Prova × Você: nenhuma oportunidade" contra "86 tópicos prioritários" no Radar): explicar em uma frase que o Radar usa a prioridade existente e a matriz usa incidência. (T7)
11. "Gráfico ainda não disponível" sem ação: acrescentar o que falta para o gráfico aparecer. (T7)
12. Título "Incidência × Domínio" repetido (rótulo da visão, `h3` do quadro): manter um. (T7)

**Texto e tom**
13. Conquista "Estratégia funcionando — Recomendação com resultado positivo" sugere causa: reescrever como observação ("depois desta recomendação, o domínio do tópico subiu"). (T6)
14. "Analisar Língua Portuguesa" no resumo semanal sem dizer por que essa disciplina: acrescentar o motivo curto. (T5)
15. "Resumo executivo" e "Seu resumo da última semana" são dois resumos seguidos com janelas de 30 e 7 dias: fundir em um bloco com duas linhas e as janelas escritas. (T3)

**Gráficos**
16. Evolução de Língua Portuguesa com 2 pontos num eixo 0–100, contra a regra de escala real do DESIGN.md: aplicar a escala ajustada que já existe nos simulados. (T7)
17. Eixo de datas sem 26/10: mostrar as semanas sem registro como lacuna, não pular. (T7)
18. ✔ Gráfico de 12 séries limitado a 5.

**Acessibilidade e interface**
19. Fonte mono com zero cortado ("46/100" parece riscado no cabeçalho em 375px): conferir o recurso de fonte `zero` e desligá-lo. (T10)
20. Matriz Pedagógica com siglas (MAT, PRO, RED, TEC, BAN) que só se explicam com clique ou foco: nome completo em `title` e legenda visível. (T10)
21. Segundo `h2` em "Conquistas e histórico": rebaixar para `h3`. (T10)
22. Células do calendário (14×14 no desktop, 24×24 no celular) e checkbox (20×20): alvo de 24px no desktop e de toque ampliado sem inflar o desenho. (T10)

## 4. Como deixar Desempenho analítico e ligado ao planejamento

### Princípio

Quem abre a aba deve sair com três respostas, nesta ordem, sem abrir nenhuma dobra:

1. **Como estou?** Prontidão, projeção e ritmo, cada um com a janela.
2. **O que está puxando para baixo (e para cima)?** Os 3 fatores ou disciplinas que mais pesam, com evidência.
3. **O que faço agora e na semana?** A ação que o app já escolheu, medida contra o plano da semana.

As três respostas viram uma faixa no topo da Visão geral, **"Leitura da preparação"**, que substitui a pilha atual de Resumo executivo + resumo semanal. O resto da aba passa a ser o **detalhe que sustenta a leitura**, com âncoras a partir dela.

### Origem de cada dado (nada novo é calculado)

| Resposta | Dado | Já calculado em |
|---|---|---|
| Como estou | Prontidão atual e variação desde o último fechamento | `build-performance-overview.ts`, `readiness-history.ts` |
| | Faixa projetada e confiança | `achievementProjection`, `build-performance-executive-summary.ts` |
| | Tempo estudado frente ao planejado (7 dias e período) | `build-weekly-performance-brief.ts`, `build-performance-consistency.ts` |
| O que puxa | Mudanças de fatores da Prontidão | `readiness-history.ts` (fatores) |
| | Disciplinas abaixo da meta e queda de precisão | `build-stability-map.ts`, `build-performance-subject-comparison.ts` |
| | Tópicos de alta incidência e baixo domínio | `intelligenceCandidates`, `buildExamMasteryMatrix` |
| | Tempo em tópicos prioritários frente ao total | `build-weekly-strategic-focus.ts` |
| O que fazer | Próxima melhor ação e justificativa | `build-next-best-action.ts` (dono: Hoje) |
| | Item do plano ativo que cobre essa ação, capacidade semanal | `build-study-plan.ts`, `study-plan-builder-controller.ts` |
| | Plano de recuperação | `recoveryPlan`, `build-recovery-timeline-detail.ts` |
| | Ajuste do plano com prévia | `replan-study.ts`, `useAdaptivePlanAdvice` |

### Estrutura da faixa

```
LEITURA DA PREPARAÇÃO · últimos 30 dias · prova em 84 dias

Como estou
  Prontidão 46/100 (−3 desde o fechamento de 08/11) · Projeção 69% a 93%, confiança baixa
  Ritmo: 6 h 20 min de 9 h planejadas na semana (70% do tempo planejado)

O que está puxando
  1. Matemática Financeira: precisão 58% (meta 80%), −4 p.p.   [ver disciplina]
  2. Probabilidade e Estatística: alta incidência, domínio 41    [ver na matriz]
  3. Retenção: 12 revisões vencidas                              [abrir revisões]

O que fazer
  Próxima ação (a mesma de Hoje): Revisar Juros compostos, 40 min   [abrir em Hoje]
  No plano da semana: cobre 40 de 120 min planejados para Matemática  [ver plano]
  Se o ritmo continuar: falta 1 h 10 min para fechar a semana         [ajustar plano (prévia)]
```

Regras da faixa:
- **Uma prioridade**: a ação é a de Hoje, com o mesmo ID. O botão sólido é "abrir em Hoje". Os demais são links.
- **Cada número carrega a janela** ("últimos 30 dias", "semana de 03/11 a 09/11"). Aderência ao plano e crédito semanal ficam no detalhe de Consistência.
- **Estados de evidência** (declarados, nunca omitidos): sem dados, amostra pequena (menos de 30 questões), sem plano ativo, sem simulados comparáveis. Cada um diz o que registrar para sair do estado.
- **Sem causa**: "puxando" é lido como associação ("a precisão caiu 4 p.p. enquanto o volume diminuiu"), nunca "caiu porque".
- A faixa não calcula nada: um construtor (`build-preparation-reading.ts`) compõe os modelos acima e é testado por unidade.

### Plano contra realidade, no vocabulário do extrato

Por disciplina e no período, uma tabela de lançamentos:

| Disciplina | Planejado | Realizado | Saldo | Precisão | Sugestão |
|---|---|---|---|---|---|
| Matemática Financeira | 6 h | 3 h 40 min | −2 h 20 min | 58% (meta 80%) | Revisar Juros compostos |

- "Saldo" é o tempo planejado menos o realizado, nas mesmas semanas. A coluna Sugestão reaproveita a recomendação do tópico dessa disciplina, com o mesmo ID de Hoje.
- Substitui os cartões e barras de "Comparação entre disciplinas" por uma tabela que o aluno lê como extrato. Linhas ordenadas pela distância da meta.
- Cada linha abre o detalhe da disciplina (já existe) e tem o atalho "Agendar no plano" (prévia em Metas, sem aplicar).

### Fecho do ciclo (planejar, estudar, medir, ajustar)

1. **Medir**: Desempenho mostra o que aconteceu e o que puxa.
2. **Decidir**: o fechamento semanal já grava a decisão. Desempenho passa a mostrar, abaixo da faixa, "Na semana passada você decidiu X; desde então, Y mudou" (observação, sem causa), a partir de `build-weekly-decision-cycle.ts` e dos resultados de `build-weekly-strategic-focus.ts` (positivo, neutro, negativo).
3. **Ajustar**: o botão "ajustar plano" abre a prévia de Metas com a capacidade e o déficit já preenchidos.

### O que NÃO entra

- Nova fórmula de prontidão, projeção ou prioridade.
- Atividade confirmada alterada a partir de Desempenho.
- Texto causal ("porque", "garante", "graças a").
- Mover a Prontidão para Desempenho: a matriz de propriedade mantém a Visão geral como dona do valor global; Desempenho resume.

## 5. Tarefas

Cada tarefa fecha com `npm run build`, `npm run check:types`, `npm test` e os E2E afetados (`performance-tablist`, `refinement-visual`, `achievement-projection`, `visual-density`, `strategic-cycle`, `essential-mode`, `exam-intelligence-readonly`). Goldens atualizados só dos specs afetados.

### Fase 0 — Consolidar o que falta da crítica

- **T1. Commit da rodada atual** (aderência por janela, síntese em Consistência, vazios, benchmark). Critério: árvore limpa, push em `main`.
- **T2. Uma verdade por métrica.** Prontidão: um par de snapshots como principal e o outro rotulado. Aderência: tempo total como principal em Visão geral e Consistência; aderência ao plano, execução prioritária e crédito semanal recolhidos numa dobra "Como o plano foi cumprido", cada uma com a janela. Critério: nenhum número de aderência aparece sem janela escrita ao lado; teste de snapshot do texto da Visão geral.
- **T3. Fundir os dois resumos** (executivo de 30 dias e semanal de 7 dias) em um bloco. Critério: uma sentença de veredito, duas linhas de janela, um botão sólido.

### Fase 1 — Correções menores

- **T6.** Reescrever a conquista "Estratégia funcionando" sem causa. Teste de texto.
- **T7.** Itens 2, 3, 4, 10, 11, 12, 16 e 17 da seção 3. Critério: cada contagem tem legenda; eixo de LP com escala ajustada.
- **T10.** Itens 19 a 22: fonte mono sem zero cortado, nomes completos na Matriz, `h3` no lugar do `h2` extra, nome para os SVGs de gráfico, alvos de toque. Critério: detector e medição de alvos sem itens abaixo de 24px no desktop; ver risco de 364 células.
- **T11.** Itens 5 e 6 e um glossário curto ("Como calculamos") em dobra única, com Aderência, Prontidão, Domínio, Retenção, Incidência.

### Fase 2 — Leitura da preparação

- **T4. Construtor `build-preparation-reading.ts`** (application, sem UI): recebe os modelos existentes e devolve `{ howAmI, pulling[], whatToDo, evidenceStates }`. Critério: testes de unidade para cada estado de evidência (sem dados, amostra pequena, sem plano, sem simulado) e para "mesmo ID da recomendação de Hoje".
- **T5. Renderer e integração** em `performance-overview-renderer.ts`: faixa no topo, âncoras para os detalhes, botão sólido único. Substitui a pilha de resumos (T3). Critério: a faixa cabe na primeira dobra a 1440×900 e a 375×812; E2E novo `performance-preparation-reading.spec.js` cobrindo os 4 estados.
- **T8. Consistência com síntese ligada ao plano**: a síntese atual passa a mostrar o déficit do plano da semana e leva à prévia de ajuste. Reduz os blocos abaixo por dobras.

### Fase 3 — Plano contra realidade

- **T9. Tabela Planejado × Realizado × Saldo** por disciplina, com a coluna Sugestão. Construtor novo sobre `build-performance-subject-comparison.ts` e o plano ativo. Substitui "Comparação entre disciplinas". Critério: soma da coluna Saldo igual ao déficit mostrado na faixa (teste de reconciliação).
- **T12.** Ordenação e exportação CSV em Questões e Simulados; busca na lista de divergentes.
- **T13.** Âncoras permanentes por bloco (`#desempenho/subjects?bloco=...`).

### Fase 4 — Fecho do ciclo

- **T14. "Última decisão e o que mudou"** abaixo da faixa, a partir do fechamento semanal. Critério: só aparece com decisão gravada; texto observacional; teste de causalidade (sem "porque").
- **T15. Prévia de ajuste do plano** aberta a partir de Desempenho com capacidade e déficit preenchidos. Critério: nada é aplicado sem confirmação; E2E de ida e volta.

### Fase 5 — Verificação

- **T16. Nova crítica.** Meta: 32 de 40 ou mais, sem P0 nem P1. Sinal de sucesso concreto: um usuário novo, ao abrir Desempenho na demo, lê em menos de 10 segundos (a) o estado da preparação, (b) o que mais pesa e (c) a próxima ação, sem abrir dobra.

## 6. Ordem e dependências

```
T1 → T2 → T3 ─┐
T6, T7, T10, T11 (independentes, em paralelo) ─┤
              └→ T4 → T5 → T8 → T9 → T14 → T15 → T16
                          T12, T13 (a qualquer momento depois de T5)
```

## 7. Riscos

- **364 células focáveis do calendário.** Ampliar cada alvo para 44px é inviável; a solução é foco por semana (uma parada por semana, setas dentro dela) e lista semanal no celular. É mudança de interação, com teste de teclado.
- **Duplicar a recomendação de Hoje.** Mitigação: a faixa só lê o `nextBestAction` e leva ao dono; teste garante o mesmo `recommendationId`.
- **Faixa longa demais.** Mitigação: limite de 3 itens em "puxando" e 1 ação; o resto vai para os detalhes.
- **Goldens.** A faixa muda as capturas de Desempenho em desktop e celular, claro e escuro: atualizar só dos specs afetados.
- **Substituir a tabela de disciplinas** pode quebrar E2E de `stability-phase-comparison` e `visual-density`: rodar esses specs antes e depois.

## 8. Perguntas em aberto

1. **Janela principal da faixa**: o período filtrado (30 dias) ou sempre os 7 dias da semana corrente? A recomendação é o período filtrado para "como estou" e a semana corrente para "o que fazer".
2. **Tabela Planejado × Realizado**: substitui "Comparação entre disciplinas" ou convive com ela? A recomendação é substituir, para não criar uma terceira leitura por disciplina.
3. **Exportação CSV** em Questões e Simulados entra agora ou depois? Não afeta o restante.
4. **Glossário "Como calculamos"**: uma dobra na Visão geral ou uma página de Ajuda? A recomendação é uma dobra única no fim de Desempenho, ligada ao glossário de Ajuda.
