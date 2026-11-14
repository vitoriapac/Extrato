# Tarefas: enxugar e tornar coerente a aba Desempenho

Contexto: [plan.md](plan.md) e [analise-desempenho-enxugar.md](analise-desempenho-enxugar.md). Antes de ler código, rodar `graphify query "<pergunta>"` (regra do CLAUDE.md); depois de editar, `graphify update .`.

Verificação usada abaixo:
- Unit: `npm test`
- Tipos: `npm run check:types`
- Build: `npm run build`
- E2E: `npx playwright test <spec>`
- Detector: `impeccable detect --json <alvos>`

---

## Fase 1: Conquistas em Hoje

### Tarefa 1: Registro de desbloqueio e migração 30 → 31
**Descrição:** Cada conquista passa a ter um registro gravado no estado (`id`, `unlockedAt`, `source`). A migração grava como `migrated` o que já está cumprido, com data inferida quando o critério é cumulativo.
**Aceite:**
- [x] `CURRENT_SCHEMA_VERSION` = 31 e migração idempotente (rodar duas vezes dá o mesmo estado)
- [x] Conquistas cumpridas antes da migração ficam `migrated`; nenhum registro é recalculado depois de gravado
- [x] Cumulativas (horas, questões, tópicos, simulados) recebem a data do registro que atingiu o critério; as demais ficam sem data
- [x] Importar backup v30 e entrar na demo passam pela mesma migração
**Verificação:**
- [x] Unit: casos backup sem o campo, já migrado, cumprida sem data inferível, demo
- [x] Tipos e build limpos
**Dependências:** nenhuma
**Arquivos:** `src/state/schema.ts`, `src/state/migrations.ts`, `src/state/defaults.ts`, `src/ui/controllers/achievements-controller.ts`, `tests/unit/state-migrations.test.js`
**Tamanho:** M

### Tarefa 2: Aviso de conquista desbloqueada
**Descrição:** Depois de salvar sessão, questões, simulado ou concluir tópico/recomendação, comparar o estado com os registros; cada conquista nova gera registro `live` e um aviso com emblema, nome e critério.
**Aceite:**
- [x] Aviso não bloqueante, fecha sozinho, com Esc e com botão; `role="status"`; sem animação com `prefers-reduced-motion`
- [x] Várias conquistas na mesma ação geram um aviso só
- [x] Nenhum aviso para registros `migrated`
**Verificação:**
- [x] Unit: detecção de novos desbloqueios e agrupamento
- [x] E2E: na demo, registrar sessão que completa uma conquista e ver o aviso uma vez
**Dependências:** T1
**Arquivos:** `src/ui/controllers/achievements-controller.ts`, `src/ui/primitives/toast.tsx` (ou componente novo), fiação em `src/bootstrap/wire-ui-controllers.ts`, teste unit e spec E2E
**Tamanho:** M

### Tarefa 3: Resultado da sessão mostra conquista ganha ou a mais perto
**Descrição:** O resultado da sessão em Hoje mostra o que foi desbloqueado ou a conquista mais perto, com quanto falta, pela regra de "perto" (até 10% do critério ou cumprível hoje).
**Aceite:**
- [x] Mostra desbloqueio da sessão quando houver; senão, a mais perto; senão, nada
- [x] Texto com quanto falta ("Faltam 37 questões para Mil questões")
**Verificação:**
- [x] Unit: regra de "perto" nos limites (10%, 1 dia, 1 h, 30 questões)
- [x] Manual: salvar sessão na demo e ler o resultado
**Dependências:** T1
**Arquivos:** `src/ui/renderers/session-result-renderer.ts`, helper de conquistas próximas, teste unit
**Tamanho:** S

### Tarefa 4: Subaba "Conquistas" em Hoje e redirecionamento
**Descrição:** Galeria com emblemas ilustrados, desbloqueadas com data e próximas com barra de progresso, numa subaba de Hoje. Desempenho perde a subaba; `#desempenho/history` redireciona.
**Aceite:**
- [x] Subaba acessível por teclado (tablist) e por URL
- [x] `#desempenho/history` abre a subaba de Hoje
- [x] Desempenho mostra 5 abas (sem Conquistas)
- [x] Cada desbloqueada mostra a data salva ("Desbloqueada em 02/10/2026"); sem data inferida: "Desbloqueada antes de <data da migração>"
**Verificação:**
- [x] E2E: `performance-tablist.spec.js` atualizado; spec novo da subaba
- [x] Manual: 375 px sem rolagem lateral
**Dependências:** T1
**Arquivos:** `src/ui/tabs/today/today-tab-controller.ts`, `index.html`, `src/ui/performance/PerformancePageNav.tsx`, roteamento, specs
**Tamanho:** M

### Tarefa 5: Marca no plano do dia
**Descrição:** Quando concluir uma atividade planejada completa uma conquista, a atividade mostra "conclui <conquista>"; no máximo uma por dia.
**Aceite:**
- [x] No máximo uma marca por dia
- [x] Não muda a ordem nem a prioridade do plano
**Verificação:**
- [x] Unit: escolha da atividade marcada
**Dependências:** T3
**Arquivos:** renderer do plano de Hoje, helper de conquistas próximas
**Tamanho:** S

### Checkpoint 1
- [ ] `npm test`, tipos e build limpos
- [ ] E2E de sessão com aviso e resultado passa
- [ ] Revisão humana antes da Fase 2

---

## Fase 2: Origem e correção dos números

### Tarefa 6: Investigação demo × produto (T2)
**Descrição:** Reproduzir as 8 incoerências da seção 13 da análise com fixture controlada e com a demo; classificar e escrever o plano de correção.
**Aceite:**
- [x] Tabela com classificação, evidência e destino de cada item em `tasks/investigacao-demo-produto.md`
- [x] Defeitos do gerador da demo corrigidos em `src/demo` quando forem a causa
**Verificação:**
- [x] Unit: um teste por item classificado como defeito de cálculo
**Dependências:** nenhuma
**Arquivos:** `src/demo/*`, `tests/unit/*`, relatório
**Tamanho:** M

### Tarefa 7: Simulados com um arredondamento e contagem explicada
**Aceite:**
- [x] Uma casa decimal para simulados em toda a aba
- [x] Toda contagem de simulados diz o critério e a janela ("3 comparáveis, todo o histórico")
- [x] Um nome por cálculo (resultado central, média do período), um por tela
**Verificação:** Unit fixando valor e rótulo; manual na demo
**Dependências:** T6
**Arquivos:** renderers de simulados, resumo executivo, preparação
**Tamanho:** S

### Tarefa 8: Selos de janela e dois números de execução do plano
**Aceite:**
- [x] Toda precisão, simulado, aderência e turno com selo de janela no número
- [x] Execução do plano com dois números (volume do plano e aderência) e definição em uma linha
- [x] Gráficos com recorte diferente do filtro dizem "semanas fechadas dentro do período"
**Verificação:** Unit dos rótulos; `window-badge.test.js`; E2E de Desempenho
**Dependências:** T6
**Arquivos:** `window-badge.tsx`, `performance-consistency-renderer.ts`, `CareerBenchmarkCard.tsx`, `adherence-renderer.ts`
**Tamanho:** M

### Checkpoint 2
- [ ] Relatório T6 revisado com você
- [ ] Nenhum número com arredondamentos diferentes na demo

---

## Fase 3: Coerência

### Tarefa 9: Vocabulário de domínio, retenção, confiança e evidência
**Aceite:**
- [x] Domínio e retenção sempre em /100
- [x] Fator da Prontidão chamado "fator Retenção"
- [x] "Confiança" só na faixa projetada; demais selos "Evidência"
**Verificação:** Unit de formatação; busca no bundle por "domínio \d+%" sem ocorrências
**Dependências:** Checkpoint 2
**Tamanho:** M

### Tarefa 10: Linha de comparação e "Copiar link" um por subaba
**Aceite:**
- [x] Linha "comparação: dd/mm a dd/mm" só onde há comparação
- [x] Um "Copiar link" por subaba, no título; âncoras de bloco continuam funcionando
**Verificação:** E2E "Copiar link gera a âncora" atualizado
**Dependências:** nenhuma
**Tamanho:** S

### Tarefa 11: Turnos num bloco, uma leitura
**Aceite:**
- [x] Rendimento e foco por turno num bloco com dois selos
- [x] Uma frase de leitura (hoje são três)
**Verificação:** Unit do renderer; manual
**Dependências:** T8
**Arquivos:** `src/ui/tabs/performance/ShiftEnergyCard.tsx`
**Tamanho:** S

### Tarefa 12: "O que mais pesa" alinhado ao Diagnóstico
**Aceite:**
- [x] Itens vêm do mesmo cálculo do Diagnóstico e linkam para ele
- [x] Tópico fraco em disciplina forte é dito ("tópico fraco dentro de Informática, 85% de precisão")
**Verificação:** Unit `preparation-reading.test.js`
**Dependências:** T9
**Arquivos:** `src/application/performance/build-preparation-reading.ts`
**Tamanho:** S

### Checkpoint 3
- [ ] `/impeccable critique` da aba; H4 e H6 ≥ 3

---

## Fase 4: Cortar repetições

### Tarefa 13: Resumo da semana na Visão geral (seção 15)
**Aceite:**
- [x] Três parágrafos (feito, sinal, ação) com selo "7 dias" e datas, até três números
- [x] Substitui "Resumo do período", a frase de "Como sua preparação evoluiu" e a linha de 7 dias da Leitura
- [x] Casos: normal, acima, abaixo, amostra pequena, sem estudo, sem plano
**Verificação:** Unit dos seis casos e de não divergência; E2E na demo
**Dependências:** T7, T8
**Arquivos:** `build-weekly-performance-brief.ts`, `weekly-performance-brief-renderer.ts`, `performance-overview-renderer.ts`, `PreparationReadingView.tsx`
**Tamanho:** M

### Tarefa 14: Diagnóstico sem "Situação do preparo" nem sugestão duplicada
**Aceite:**
- [x] "Situação do preparo" removida; dias e tópicos restantes no cabeçalho do Extrato
- [x] Sugestão fora do plano não repete o item 1
**Verificação:** E2E do Diagnóstico atualizado
**Dependências:** T12
**Tamanho:** S

### Tarefa 15: Faixa projetada só em Simulados
**Aceite:**
- [x] Projeção e "Faixa emitida × resultado" só em Simulados
- [x] Visão geral mostra a faixa em uma linha com link
**Verificação:** Unit do overview; E2E
**Dependências:** T13
**Tamanho:** S

### Tarefa 16: Gráficos existentes com tamanho responsivo (T6.1)
**Aceite:**
- [x] Largura 100% do cartão; nenhum gráfico mais largo que o cartão em 1440, 1024, 375 e 320 (E2E `chart-sizes`)
- [x] Proporções da seção 14.3: no celular a altura tem mínimo de 180 px (Tarefa 16b); no desktop vale a proporção de projeto de cada gráfico
- [x] Série com menos de 3 pontos vira texto (Evolução dos simulados)
- [x] Texto dos eixos em 12,5 px em qualquer largura (a escala vem de `--fit`)
**Verificação:** script de medição no navegador (como na análise); axe nos E2E
**Dependências:** nenhuma (carregar skill `dataviz` antes)
**Arquivos:** `src/ui/primitives/charts/charts.tsx`, `planned-actual-chart.ts`, renderers que desenham SVG
**Tamanho:** M

### Tarefa 16b: Geometria dos gráficos que dependa da largura
**Aceite:**
- [x] Cada gráfico recebe a largura do cartão ao renderizar e calcula a altura pela proporção da seção 14.3 (3:1 a 4:1 no desktop; mínimo de 180 px no celular)
- [x] Abaixo de 600 px, menos ticks e rótulo só no último ponto, sem sobreposição
- [x] Recalcula ao cruzar o ponto de quebra (resize)
**Verificação:** `chart-sizes` com altura mínima; capturas em 320 e 375
**Dependências:** Tarefa 16
**Arquivos:** `geometry.ts`, `question-evolution-renderer.ts`, `planned-actual-chart.ts`, `study-charts-renderer.ts`, `readiness-history-renderer.ts`, `simulations-renderer.ts`, `achievement-projection-renderer.ts`, `performance-analytics-controller.ts`
**Tamanho:** M

### Checkpoint 4
- [ ] Visão geral ≤ 1.600 px no desktop
- [ ] Medição de gráficos sem estouro

---

## Fase 5: Reorganizar as abas

### Tarefa 17: Aba "Provas" sem segundo nível
**Aceite:**
- [ ] Questões, Simulados e Inteligência da prova numa página com três seções
- [ ] `#desempenho/questions|simulations|exam` levam à seção certa
**Verificação:** `performance-tablist.spec.js` e specs de questões atualizados
**Dependências:** Checkpoint 4
**Tamanho:** M

### Tarefa 18: Modos da Comparação em Disciplinas
**Aceite:**
- [ ] Modos: precisão (padrão), tendência (antes × agora), progresso, radar
- [ ] Mapa de estabilidade vira o modo tendência; progresso e radar saem de Conquistas
**Verificação:** E2E de Disciplinas; unit dos modos
**Dependências:** T4
**Tamanho:** M

### Tarefa 19: Diagnóstico agrupado por disciplina com filtro
**Aceite:**
- [ ] Extrato agrupado por disciplina, filtro por prioridade e evidência; 3 primeiros abertos
- [ ] "+294" substituído por grupos com contagem
**Verificação:** E2E do Diagnóstico
**Dependências:** T14
**Tamanho:** M

### Tarefa 20: Matriz condicional; Balanço e Radar de vulnerabilidades como ordenações
**Aceite:**
- [ ] Matriz só aparece quando ao menos um quadrante não crítico tem disciplinas; senão, lista
- [ ] Balanço e Radar viram ordenações do Extrato
**Verificação:** Unit da condição da Matriz; E2E
**Dependências:** T19
**Tamanho:** M

### Tarefa 21: Replanejamentos em Planejamento
**Aceite:**
- [ ] Replanejamento da semana e pós-simulado em Planejamento; Desempenho mantém um link
- [ ] Prévia e confirmação continuam obrigatórias
**Verificação:** E2E de planejamento e de "Ajustar plano"
**Dependências:** Checkpoint 4
**Tamanho:** M

### Tarefa 22: Ritmo com extrato de sessões e tempo por disciplina
**Aceite:**
- [ ] Extrato de sessões e tempo por disciplina só em Ritmo
- [ ] Referência de ritmo continua visível (decisão 4C)
**Verificação:** E2E de Ritmo
**Dependências:** T4, T8
**Tamanho:** S

### Checkpoint 5
- [ ] 5 abas sem segundo nível; rotas antigas redirecionam; E2E e capturas atualizados
- [ ] Revisão humana

---

## Fase 6: Referência de ritmo e notas de corte

### Tarefa 23: Textos da referência sem afirmação sem fonte
**Aceite:**
- [ ] Comentário de `career-benchmarks.ts` corrigido; "Faixa Competitiva", "Nível Reta Final", "Padrão de nota de corte…" e "Recomendado" trocados
- [ ] Horas e questões como "sugestão de cursinhos, sem pesquisa com aprovados", comparadas também com a capacidade do plano
**Verificação:** Unit de `career-benchmarks`; busca pelos textos antigos sem ocorrências
**Dependências:** nenhuma
**Arquivos:** `src/domain/analytics/career-benchmarks.ts`, `src/ui/components/CareerBenchmarkCard.tsx`
**Tamanho:** S

### Tarefa 24: Campo de nota de corte no catálogo com validação de fonte
**Aceite:**
- [ ] Campo por concurso: banca, cargo, praça, ano, modalidade, nota, escala, link oficial
- [ ] Validação recusa nota sem link oficial
**Verificação:** Unit da validação do catálogo
**Dependências:** T23
**Arquivos:** `src/domain/exams/exam-catalog.ts`, `exam-catalog-data.json`, testes
**Tamanho:** M

### Tarefa 25: Notas de corte oficiais de BB, Caixa e CNU
**Aceite:**
- [ ] Valores lidos no resultado oficial (Cesgranrio, MGI), com link
- [ ] O que não tiver fonte oficial fica "sem dado"
**Verificação:** revisão manual das fontes; validação do catálogo passa
**Dependências:** T24
**Tamanho:** S (dados)

### Tarefa 26: Pesquisa de notas de corte dos outros concursos (T5)
**Aceite:**
- [ ] INSS, PF, PRF, Receita Federal, tribunais e demais editais do catálogo: link oficial, escala, cargos, praças, ano
- [ ] Lista entregue para cadastro; sem fonte oficial = "sem dado"
**Verificação:** revisão manual
**Dependências:** T24 (pode correr em paralelo com o resto)
**Tamanho:** M (pesquisa)

### Tarefa 27: Precisão comparada com a nota de corte do concurso ativo
**Aceite:**
- [ ] Referência mostra "Nota de corte <concurso> <ano>, sua praça: X (<banca>)" quando houver
- [ ] Sem nota cadastrada, compara com a meta do aluno e diz isso
**Verificação:** Unit dos dois caminhos; E2E na demo
**Dependências:** T25
**Tamanho:** S

### Checkpoint 6
- [ ] Nenhum rótulo afirma dado de aprovados sem fonte

---

## Fase 7: Visual e iniciante

### Tarefa 28: Régua da Prontidão e minigráficos dos KPIs
**Aceite:**
- [ ] Régua com Prontidão, faixa projetada e meta, com texto alternativo
- [ ] KPIs com tendência das últimas 4 a 6 semanas, valor atual em destaque
**Verificação:** contraste nos dois temas; axe; manual em 375
**Dependências:** T16, T13
**Tamanho:** M

### Tarefa 29: Gráficos de Disciplinas e Diagnóstico
**Aceite:**
- [ ] Barras de precisão com linha da meta; inclinação antes × agora
- [ ] Barras de lacuna × impacto dos 10 primeiros tópicos
**Verificação:** contraste, axe, alternativa em texto
**Dependências:** T18, T20
**Tamanho:** M

### Tarefa 30: Gráficos de Provas
**Aceite:**
- [ ] Precisão com meta e amostra pequena sombreada; perfil de erros fora da dobra
- [ ] Simulados com faixa projetada sobreposta; incidência por disciplina com domínio ao lado
**Verificação:** contraste, axe, alternativa em texto
**Dependências:** T17
**Tamanho:** M

### Tarefa 31: Gráficos de Ritmo
**Aceite:**
- [ ] Barras semanais planejado × realizado com linha da capacidade
- [ ] Barras de tempo por disciplina (top 8 + outras) no lugar do donut; faixas por turno
**Verificação:** contraste, axe, alternativa em texto
**Dependências:** T22
**Tamanho:** M

### Tarefa 32: Estados vazios do modo iniciante
**Aceite:**
- [ ] Com menos de 30 questões pessoais ou 2 semanas de registro, abas analíticas mostram estado vazio que diz quando ficam úteis
- [ ] Visão geral e Ritmo sempre completas
**Verificação:** E2E com usuário novo; unit do limite
**Dependências:** Checkpoint 5
**Tamanho:** S

### Checkpoint final
- [ ] Todos os critérios atendidos
- [ ] `/impeccable critique` ≥ 32/40
- [ ] Pronto para revisão

---

## Fase 8: Vocabulário e contagens nas outras telas

A Tarefa 9 aplicou o vocabulário fixo só em Desempenho. Esta fase leva a mesma regra às demais telas.

### Tarefa 33: Vocabulário fora de Desempenho
**Aceite:**
- [ ] Domínio e retenção sempre em /100 em Aprovação, Metas/Matriz da prova, Hoje (recomendação), Planejamento, relatório PDF, landing e ajuda
- [ ] "Confiança" só na faixa projetada (e na ajuda dessa faixa); demais ocorrências viram "Evidência" (Aprovação, plateau, alertas, recomendações, qualidade dos dados da prova, relatório)
- [ ] "Meta de domínio" em Planejamento fica em % ou muda para /100, com a regra escrita (decidir: é alvo, não medida)
- [ ] Ajuda e simulador "Evidência × confiança" reescritos com o vocabulário
**Verificação:** busca no bundle por `domínio d+%` e `[Cc]onfiança` com lista de exceções; unit de formatação; E2E das telas tocadas
**Dependências:** Tarefa 9
**Arquivos (levantados em 14/11/2026):** `approval-tab-controller.ts`, `exam-matrix-controller.ts`, `exam-matrix-renderer.ts`, `incidence-quadrants-renderer.ts`, `exam-intelligence-renderer.ts`, `exam-data-quality-renderer.ts`, `exam-classification-review-renderer.ts`, `study-recommendation-controller.ts`, `study-plan-builder-controller.ts`, `recommendation-calibration-renderer.ts`, `error-analysis-renderer.ts`, `overview-standing-renderer.ts`, `strategic-history-renderer.ts`, `readiness-history-renderer.ts`, `report-template.ts`, `SalesLandingPage.tsx`, `help-content.ts`, `EvidenceConfidenceSimulator.tsx`, `domain/diagnostics/alerts.ts`, `domain/analytics/plateau-detector.ts`, `build-analytics-view-model.ts`
**Tamanho:** M

### Tarefa 34: Contagens de simulados nas outras telas
**Aceite:**
- [ ] Toda contagem de simulados (Aprovação, relatório PDF, fechamento semanal, ciclo de decisão, ajuda) diz critério e janela
- [ ] Decisão registrada: o fator Simulados da Prontidão passa ou não a usar só os simulados comparáveis (3 × 5); se passar, capturas, testes e retratos salvos reconferidos
**Verificação:** unit fixando valor e rótulo; manual na demo
**Dependências:** Tarefa 9
**Tamanho:** S

### Checkpoint 8
- [ ] Busca no bundle sem "domínio N%" nem "confiança" fora da faixa projetada
- [ ] E2E e capturas atualizados; `/impeccable critique` sem novo achado de vocabulário
