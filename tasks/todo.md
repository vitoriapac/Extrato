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
- [x] `/impeccable critique` da aba (rodada 9, 14/11): 28/40, H6 = 3, H4 = 2, H8 = 2. Fechado como parcial por decisão do usuário; pendências em `tasks/plan.md`

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
- [x] Visão geral ≤ 1.600 px no desktop: conteúdo da subaba com 1.412 px em 1440 e 1.447 px em 1024 (era 1.843 px), com 12 dobras fechadas. O painel inteiro, com cabeçalho, abas e filtros, mede 1.692 px em 1440 (14/11/2026)
- [x] Medição de gráficos sem estouro: `chart-sizes` passa em 1440, 1024, 375 e 320 (nenhum gráfico passa do cartão, sem rolagem lateral, texto de 12,5 px, altura mínima de 180 px no celular)

---

## Fase 5: Reorganizar as abas

### Tarefa 17: Aba "Provas" sem segundo nível
**Aceite:**
- [x] Questões, Simulados e Inteligência da prova numa página com três seções
- [x] `#desempenho/questions|simulations|exam` levam à seção certa
**Verificação:** `performance-tablist.spec.js` e specs de questões atualizados
**Dependências:** Checkpoint 4
**Tamanho:** M

### Tarefa 18: Modos da Comparação em Disciplinas
**Aceite:**
- [x] Modos: precisão (padrão), tendência (antes × agora), progresso, radar
- [x] Mapa de estabilidade vira o modo tendência; progresso e radar saem de Conquistas
**Verificação:** E2E de Disciplinas; unit dos modos
**Dependências:** T4
**Tamanho:** M

### Tarefa 19: Diagnóstico agrupado por disciplina com filtro
**Aceite:**
- [x] Extrato agrupado por disciplina, filtro por prioridade e evidência; 3 primeiros abertos
- [x] "+294" substituído por grupos com contagem
**Feito:** grupos por disciplina (só a do 1º da fila abre, com 3 conteúdos; "Mostrar mais · +N" por grupo), filtros de prioridade e evidência, "296 de 296 conteúdos"; número do cartão = lugar na fila.
**Verificação:** E2E do Diagnóstico
**Dependências:** T14
**Tamanho:** M

### Tarefa 20: Matriz condicional; Balanço e Radar de vulnerabilidades como ordenações
**Aceite:**
- [x] Matriz só aparece quando ao menos um quadrante não crítico tem disciplinas; senão, lista
- [x] Balanço e Radar viram ordenações do Extrato
**Feito:** Matriz sem dispersão quando tudo é crítico (só a lista); Balanço = ordenar por tempo × edital; Radar = ordenar por críticos; fold só com Queda de retenção.
**Verificação:** Unit da condição da Matriz; E2E
**Dependências:** T19
**Tamanho:** M

### Tarefa 21: Replanejamentos em Planejamento
**Aceite:**
- [x] Replanejamento da semana e pós-simulado em Planejamento; Desempenho mantém um link
- [x] Prévia e confirmação continuam obrigatórias
**Feito:** replanejamento da semana em Planejamento > Semana; pós-simulado em Fechamento; Desempenho tem link; atalhos de recalibrar abrem Planejamento. Prévia e confirmação intactas (mesmos controladores).
**Verificação:** E2E de planejamento e de "Ajustar plano"
**Dependências:** Checkpoint 4
**Tamanho:** M

### Tarefa 22: Ritmo com extrato de sessões e tempo por disciplina
**Aceite:**
- [x] Extrato de sessões e tempo por disciplina só em Ritmo
- [x] Referência de ritmo continua visível (decisão 4C)
**Feito:** Ritmo já concentrava sessões e tempo por disciplina; removido o cartão "Tempo de estudo" (mounts sem renderer, com autolink para Ritmo); dobra virou "Extrato de sessões"; referência de ritmo segue visível.
**Verificação:** E2E de Ritmo
**Dependências:** T4, T8
**Tamanho:** S

### Checkpoint 5
- [x] 5 abas sem segundo nível; rotas antigas redirecionam; E2E e capturas atualizados
- [ ] Revisão humana

---

## Fase 6: Referência de ritmo e notas de corte

### Tarefa 23: Textos da referência sem afirmação sem fonte
**Aceite:**
- [x] Comentário de `career-benchmarks.ts` corrigido; "Faixa Competitiva", "Nível Reta Final", "Padrão de nota de corte…" e "Recomendado" trocados
- [x] Horas e questões como "sugestão de cursinhos, sem pesquisa com aprovados", comparadas também com a capacidade do plano
**Verificação:** Unit de `career-benchmarks`; busca pelos textos antigos sem ocorrências
**Dependências:** nenhuma
**Arquivos:** `src/domain/analytics/career-benchmarks.ts`, `src/ui/components/CareerBenchmarkCard.tsx`
**Tamanho:** S

### Tarefa 24: Campo de nota de corte no catálogo com validação de fonte
**Aceite:**
- [x] Campo por concurso: banca, cargo, praça, ano, modalidade, nota, escala, link oficial
- [x] Validação recusa nota sem link oficial
**Verificação:** Unit da validação do catálogo
**Dependências:** T23
**Arquivos:** `src/domain/exams/exam-catalog.ts`, `exam-catalog-data.json`, testes
**Tamanho:** M

### Tarefa 25: Notas de corte oficiais de BB, Caixa e CNU
**Aceite:**
- [ ] Valores lidos no resultado oficial (Cesgranrio, MGI), com link: ADIADO PARA O FINAL, o usuário vai enviar as notas; BB e Caixa não publicam nota de corte nas fontes lidas e o CNU só publica a pontuação mínima de habilitação à discursiva (registro em `tasks/notas-de-corte-fontes.md`)
- [x] O que não tiver fonte oficial fica "sem dado" (BB e Caixa)
**Verificação:** revisão manual das fontes; validação do catálogo passa
**Dependências:** T24
**Tamanho:** S (dados)

### Tarefa 26: Pesquisa de notas de corte dos outros concursos (T5) (ADIADA PARA O FINAL, junto com a T25: o usuário vai enviar as notas)
**Aceite:**
- [ ] INSS, PF, PRF, Receita Federal, tribunais e demais editais do catálogo: link oficial, escala, cargos, praças, ano
- [ ] Lista entregue para cadastro; sem fonte oficial = "sem dado"
**Verificação:** revisão manual
**Dependências:** T24 (pode correr em paralelo com o resto)
**Tamanho:** M (pesquisa)

### Tarefa 27: Precisão comparada com a nota de corte do concurso ativo
**Aceite:**
- [x] Referência mostra "Nota de corte <concurso> <ano>, sua praça: X (<banca>)" quando houver
- [x] Sem nota cadastrada, compara com a meta do aluno e diz isso
**Verificação:** Unit dos dois caminhos; E2E na demo
**Dependências:** T25
**Tamanho:** S

### Checkpoint 6
- [x] Nenhum rótulo afirma dado de aprovados sem fonte (busca sem ocorrências)

---

## Fase 7: Visual e iniciante

### Tarefa 28: Régua da Prontidão e minigráficos dos KPIs
**Aceite:**
- [x] Régua com Prontidão, faixa projetada e meta, com texto alternativo
- [x] KPIs com tendência das últimas 4 a 6 semanas, valor atual em destaque
**Verificação:** contraste nos dois temas; axe; manual em 375
**Dependências:** T16, T13
**Tamanho:** M

### Tarefa 29: Gráficos de Disciplinas e Diagnóstico
**Aceite:**
- [x] Barras de precisão com linha da meta; inclinação antes × agora
- [x] Barras de lacuna × impacto dos 10 primeiros tópicos
**Verificação:** contraste, axe, alternativa em texto
**Dependências:** T18, T20
**Tamanho:** M

### Tarefa 30: Gráficos de Provas
**Aceite:**
- [x] Precisão com meta e amostra pequena sombreada; perfil de erros fora da dobra
- [x] Simulados com faixa projetada sobreposta; incidência por disciplina com domínio ao lado
**Verificação:** contraste, axe, alternativa em texto
**Dependências:** T17
**Tamanho:** M

### Tarefa 31: Gráficos de Ritmo
**Aceite:**
- [x] Barras semanais planejado × realizado com linha da capacidade
- [x] Barras de tempo por disciplina (top 8 + outras) no lugar do donut; faixas por turno
**Verificação:** contraste, axe, alternativa em texto
**Dependências:** T22
**Tamanho:** M

### Tarefa 32: Estados vazios do modo iniciante
**Aceite:**
- [x] Com menos de 30 questões pessoais ou 2 semanas de registro, abas analíticas mostram estado vazio que diz quando ficam úteis
- [x] Visão geral e Ritmo sempre completas
**Verificação:** E2E com usuário novo; unit do limite
**Dependências:** Checkpoint 5
**Tamanho:** S

### Checkpoint final
- [ ] Todos os critérios atendidos
- [ ] `/impeccable critique` ≥ 32/40 (depois da Fase 9)
- [ ] Pronto para revisão

---

## Fase 8: Vocabulário e contagens nas outras telas

A Tarefa 9 aplicou o vocabulário fixo só em Desempenho. Esta fase leva a mesma regra às demais telas.

### Tarefa 33: Vocabulário fora de Desempenho
**Aceite:**
- [x] Domínio e retenção sempre em /100 em Aprovação, Metas/Matriz da prova, Hoje (recomendação), Planejamento, relatório PDF, landing e ajuda
- [x] "Confiança" só na faixa projetada (e na ajuda dessa faixa); demais ocorrências viram "Evidência" (Aprovação, plateau, alertas, recomendações, qualidade dos dados da prova, relatório)
- [x] "Meta de domínio" em Planejamento fica em % ou muda para /100, com a regra escrita (decidir: é alvo, não medida)
- [x] Ajuda e simulador "Evidência × confiança" reescritos com o vocabulário
**Feito (14/11/2026):** exame histórico da banca passou a se chamar "base histórica"; "confiança" ficou só na faixa projetada (e na Ajuda dela); demais usos viraram "evidência". Domínio e retenção em /100 (opportunity-cost, landing). A meta de domínio em Planejamento **fica em %** por ser alvo, com a regra escrita no artigo de evidência da Ajuda (80% equivale a 80/100). Ajuda, FAQ e simulador reescritos.
**Decisão T34:** o fator Simulados da Prontidão **não** passa a usar só os comparáveis: segue a média ponderada dos 5 últimos simulados de todo o histórico, e o rótulo diz isso. A faixa projetada usa a mediana dos 3 últimos comparáveis e a aba Simulados, a média simples do período; a Ajuda explica as três contas. Teste unitário fixa valor e rótulo.
**Verificação:** busca no bundle por `domínio d+%` e `[Cc]onfiança` com lista de exceções; unit de formatação; E2E das telas tocadas
**Dependências:** Tarefa 9
**Arquivos (levantados em 14/11/2026):** `approval-tab-controller.ts`, `exam-matrix-controller.ts`, `exam-matrix-renderer.ts`, `incidence-quadrants-renderer.ts`, `exam-intelligence-renderer.ts`, `exam-data-quality-renderer.ts`, `exam-classification-review-renderer.ts`, `study-recommendation-controller.ts`, `study-plan-builder-controller.ts`, `recommendation-calibration-renderer.ts`, `error-analysis-renderer.ts`, `overview-standing-renderer.ts`, `strategic-history-renderer.ts`, `readiness-history-renderer.ts`, `report-template.ts`, `SalesLandingPage.tsx`, `help-content.ts`, `EvidenceConfidenceSimulator.tsx`, `domain/diagnostics/alerts.ts`, `domain/analytics/plateau-detector.ts`, `build-analytics-view-model.ts`
**Tamanho:** M

### Tarefa 34: Contagens de simulados nas outras telas
**Aceite:**
- [x] Toda contagem de simulados (Aprovação, relatório PDF, fechamento semanal, ciclo de decisão, ajuda) diz critério e janela
- [x] Decisão registrada: o fator Simulados da Prontidão passa ou não a usar só os simulados comparáveis (3 × 5); se passar, capturas, testes e retratos salvos reconferidos
**Verificação:** unit fixando valor e rótulo; manual na demo
**Dependências:** Tarefa 9
**Tamanho:** S

### Checkpoint 8
- [x] Busca no bundle sem "domínio N%" nem "confiança" fora da faixa projetada
- [x] E2E atualizados; `/impeccable critique` sem novo achado de vocabulário (a conferir na crítica do checkpoint final)

---

## Fase 9: Correções das críticas 8 e 9

Origem: críticas de 14/11 (rodadas 8 e 9, 28/40), observações menores e red flags das personas Alex (power user), Casey (mobile), Sam (acessibilidade) e Jordan (iniciante). Itens marcados "confirmar" foram vistos só pelo DOM de um avaliador e precisam de checagem antes de mudar.

### Tarefa 35: Nomes da navegação e da rota
**Origem:** P1 de H4 nas duas rodadas.
**Aceite:**
- [x] Decisão de nomes registrada antes de codar (perguntar ao usuário): a área hoje é "Questões & Simulados" (global), "Provas" (subaba), "Questões" (âncora interna) e `#desempenho/questions` (rota)
- [x] Um nome para a subaba, a âncora e a rota (o hash antigo continua redirecionando); âncora interna "Questões" renomeada para não repetir o nome da área
- [x] Subabas "Visão geral" e "Disciplinas" não repetem o rótulo das abas globais "Visão geral" e "Matérias" (ou a diferença fica explícita no rótulo); mobile "Início/Matérias" revisado junto
- [x] Rótulos de acessibilidade do roteiro da demo ("Ir para Questões e Simulados") iguais aos visíveis
**Feito (15/11/2026):** subabas Resumo, Por disciplina, Diagnóstico, Resultados das provas e Ritmo e aderência; âncoras Questões respondidas, Simulados realizados e Inteligência da prova; rotas públicas `#desempenho/resultados|simulados|inteligencia`, com `questions`, `simulations`, `exam`, `exams` e `provas` como aliases que se reescrevem para o endereço novo. Ficaram de fora: o nome "Início/Matérias" da barra mobile e os rótulos do roteiro da demo (nomes de aba de topo, decisão separada).
**Verificação:** unit de rotas; E2E de navegação e redirecionamento; busca no bundle pelos nomes antigos
**Arquivos prováveis:** `performance-tab-controller.ts`, `performance-controller.ts`, rotas em `src/ui/tabs`, `index.html`, `help-content.ts`, specs de navegação
**Tamanho:** M

### Tarefa 36: Linha-chave dos universos de contagem
**Origem:** P1 de H4 (296 × 305 × 194; 463 × 842 × 686 questões); memória de trabalho de Alex e Jordan.
**Aceite:**
- [x] Uma linha-chave no Diagnóstico e em Provas: "296 tópicos no edital · 194 por concluir · 305 mapeados ao histórico da banca" (valores reais, com a diferença de 9 explicada na tela)
- [x] Questões: "463 respondidas no período · 842 classificadas · 686 analisadas", com o critério de cada; verbo único ("respondidas", não "resolvidas")
- [x] Todo "N de M tópicos" nomeia o M
**Verificação:** unit do texto com os três universos; E2E na demo conferindo que nenhum número aparece sem recorte
**Arquivos prováveis:** `consolidated-diagnosis-renderer.ts`, `exam-matrix-controller.ts`, `exam-data-quality-renderer.ts`, `build-exam-data-quality.ts`
**Tamanho:** S

### Tarefa 37: Um formato por grandeza
**Origem:** P2 de H4; observações de formatos.
**Aceite:**
- [x] Precisão: sempre uma casa (69,3%) em KPI, texto e gráfico; tabela de Disciplinas com a mesma regra
- [x] Variação em % sempre em p.p. com sinal e uma casa, inclusive "execução prioritária: −6 p.p." e "Queda de 20 p.p."; variação da Prontidão (escala /100) diz "pontos", com a regra na ajuda
- [x] Faixas num estilo só ("69% a 93%", "78% a 84%", "20 a 26 h/sem") em Desempenho; legenda do heatmap igual
- [x] Tempo sempre "34 h 2 min", inclusive donut e listas de metas; contagens com unidade ("+72 questões")
- [x] "—" e "—%" viram "Sem dados" com motivo curto; "−35 pts" das metas (confirmar) padronizado
**Verificação:** unit nos formatadores (`format-number.ts`, `formatStudyMinutes`); busca por `pts`, `—%` e horas coladas ("34h"); E2E e goldens conferidos antes de atualizar
**Dependências:** Tarefa 36
**Tamanho:** M

### Tarefa 38: Um vocabulário de estado, prioridade e evidência
**Origem:** P2 de H4 (quatro vocabulários paralelos, seis usos de "evidência"); jargão de Jordan.
**Aceite:**
- [x] Decisão de produto registrada (perguntar ao usuário): quais estados existem (prioridade × tendência × quadrante da Matriz) e o nome de cada um; tabela de correspondência no código
- [x] Prioridade e tipo de problema em chips separados ("Prioridade provisória", "Lacuna prioritária", "Atenção prioritária", "Importante", "Cobertura a expandir" não dividem a mesma coluna); ordem de urgência visível
- [x] Evidência: um componente com Baixa, Média e Alta; "N tópicos com evidência" só como contagem em outro estilo; "Sem evidência registrada" e "base histórica" alinhados
- [x] Limiar de amostra dito uma vez (30 e 10 questões: confirmar se são conceitos diferentes e nomear cada um)
**Verificação:** unit do mapa de vocabulário; busca no bundle; E2E do Diagnóstico e da Matriz
**Dependências:** Tarefa 36
**Tamanho:** M

### Tarefa 39: Selo de janela com a janela real
**Origem:** crítica 9 (23 de 33 selos dizem "período"; "Faltam 2 h 32 min" × "Faltam 12 h 14 min" lado a lado); H1.
**Aceite:**
- [x] O selo diz a janela ("30 dias", "7 dias", "todo o histórico") em vez de "período"; mantém a posição colada ao rótulo decidida na T9
- [x] Onde duas janelas aparecem lado a lado, uma frase diz que são janelas diferentes
- [x] Linha de escopo única por bloco ("Últimos 30 dias · comparação: …") e o mesmo padrão no Diagnóstico ("Situação atual · …")
**Verificação:** unit do `renderWindowBadge`; E2E contando selos sem "período"; goldens revisados
**Dependências:** Tarefa 37
**Tamanho:** S

### Tarefa 40: Provas em um painel por vez, sem repetições
**Origem:** P1 de H8 (10,8 mil px no mobile); Casey; redundâncias da crítica 9; H10.
**Aceite:**
- [x] "Questões", "Simulados" e "Inteligência da prova" mostram um painel por vez (controle segmentado ou âncoras que recolhem os outros), sem virar segundo nível de abas; Provas ≤ 5.000 px no mobile
- [x] "Incidência × domínio" e a lista de 85 itens recolhidos por padrão no mobile
- [x] Sem repetição: meta pessoal de aderência 80% (Provas e Ritmo), "Faltam 12 h 14 min" duas vezes, Aderência 73,6% = Volume do plano 73,6% (confirmar), "Evolução dos simulados" duas vezes (confirmar)
- [x] Os cerca de 40 `<details>` "Como/Entenda/Limites" com nomes uniformes; a frase longa de causalidade vira versão curta com link para a explicação completa
**Feito (15/11/2026):** controle segmentado (aria-pressed) com um painel por vez; só o painel aberto é calculado; quadrantes de Incidência × domínio recolhidos no mobile (a escolha do aluno é lembrada); títulos externos repetidos removidos; dobras de método com prefixo "Como ler:"; frase de causalidade curta. Alturas no mobile: 3.400, 3.633 e 4.107 px (antes 10,8 mil). Não havia duplicata de meta de aderência na demo; a lista de 85 itens não foi recolhida à parte.
**Verificação:** medição de altura na demo (375 e 1440); E2E de visibilidade por painel; E2E de dobras
**Dependências:** Tarefas 35 e 38
**Tamanho:** L

### Tarefa 41: Mobile e acessibilidade
**Origem:** Casey e Sam; P3 de H8; pendências de H8.
**Aceite:**
- [x] Heatmap: alvos de toque ≥ 44 px no mobile (semanas em 7 colunas ou últimas 12 semanas, com a lista textual como padrão); sobra de 21 px do heatmap em 1009 px corrigida
- [x] Selos `.performance-window` e botão de ajuda de 24 px com área de toque de 44 px no mobile
- [x] Botão flutuante não cobre o contador de tópicos; aba "Ritmo e aderência" em uma linha (rótulo curto ou rolagem)
- [x] Contraste claro medido com axe nos 5 painéis; os 2 textos escuros apontados ("O crédito só conta estudo vinculado…", "18 questões aguardam classificação.") conferidos
- [x] Siglas da Matriz com ponto médio ("MAT·F") com nome acessível completo
**Verificação:** E2E mobile com `AxeBuilder` nos dois temas; contagem de alvos < 44 px
**Tamanho:** M

### Tarefa 42: Poder de uso e jargão
**Origem:** Alex e Jordan; H2, H3, H7.
**Aceite:**
- [x] Diagnóstico: filtros num controle "Filtros" (≤ 4 opções visíveis por vez) com "Restaurar padrão" e contagem de filtros ativos; busca textual de tópicos no topo
- [x] Atalho para a janela de tempo (7/30/90) e para trocar de subaba (decidir teclas; documentar na ajuda e no Ctrl+K)
- [x] Ordenação de 6 critérios de Disciplinas também no Diagnóstico onde fizer sentido (decidido: não replicar; o Diagnóstico já tem "Ordenar disciplinas" e agora a busca)
- [x] Jargão com definição inline curta: "Saúde da revisão", "Incidência × domínio", "Lacuna prioritária", "Prioridade provisória"
**Verificação:** E2E de teclado e de restaurar filtros; unit do filtro por texto
**Dependências:** Tarefa 38
**Tamanho:** M

### Tarefa 43: Jornada emocional
**Origem:** crítica 9 (chegada em alerta, meio desanimador, boas notícias escondidas em Simulados).
**Aceite:**
- [x] Visão geral e Diagnóstico mostram o que já está firme (ex.: disciplinas na meta, simulados em alta) junto do alerta, sem elogio vazio
- [x] "Meta atingida" e a melhor notícia da semana aparecem fora do último subtab
**Verificação:** unit do texto; revisão humana do tom
**Dependências:** Tarefa 40
**Tamanho:** S

### Checkpoint 9
- [ ] E2E, tipos e goldens revisados; busca no bundle pelos nomes e formatos antigos
- [ ] `/impeccable critique` ≥ 32/40, com H4 ≥ 3 e H8 ≥ 3

## Fase 12: Dobras fechadas (enxugar, fundir, mover)

**Origem:** análise de 16/11/2026 das dobras fechadas de Desempenho, medida na demo em desktop 1280 px, pensando em Iniciante (I), Analítico (A) e Experiente (E). Cada dobra foi classificada como necessária (N), útil (U), redundante (R) ou trivial (T). Cuidado: dados fictícios da demo exageram as listas sem evidência.

### Tarefa 49: Despejos de "sem evidência"
**Origem:** "Sem evidência para posicionar (217)" abre +15,5 mil px; "Sem evidência · 16" no Diagnóstico, +4,5 mil px; "Mostrar mais · +57" e "+18" na matriz, +4 mil e +1,3 mil px.
**Aceite:**
- [x] Os três despejos viram uma linha com a contagem ("217 tópicos sem evidência") e a ação de coletar evidência; a lista completa só sai por um botão que abre o Diagnóstico filtrado em "Sem evidência"
- [x] A matriz de quadrantes não repete os mesmos tópicos em listas longas; a Inteligência da prova aberta fica abaixo de 6 mil px na demo
- [x] Nenhum tópico deixa de ser alcançável: o filtro "Sem evidência" do Diagnóstico lista todos
**Verificação:** E2E que conta os tópicos antes e depois e mede a altura; unit do texto da contagem
**Tamanho:** M

### Tarefa 50: Uma só explicação da projeção
**Origem:** em Simulados, "Como ler: esta projeção", "Faixa, confiança e limites", "Como a faixa foi calculada e calibrada", "Qualidade da evidência", "Base e limites" e "Cenário de redução" explicam o mesmo cálculo.
**Aceite:**
- [x] Uma dobra "Como a faixa foi calculada" com base e limites, qualidade da evidência, calibração e cenário, em uma ordem só
- [x] "O que seria necessário?" continua separada (é ação, não explicação)
- [x] A cópia oculta do card de Prontidão deixa de existir (a investigação passa a ser renderizada só em Simulados)
**Verificação:** E2E `evidence-calibration` e goldens da projeção; unit do card de Prontidão
**Dependências:** Tarefa 49
**Tamanho:** M

### Tarefa 51: Um "Como ler esta aba" por subaba
**Origem:** "Como ler: limites" aparece em Por disciplina, Diagnóstico, Provas e Resumo, com uma ou duas frases cada.
**Aceite:**
- [x] Cada subaba tem uma só dobra "Como ler esta aba" com os limites e os critérios daquela subaba
- [x] Os "Como ler: …" que explicam um gráfico específico ficam junto do gráfico
**Verificação:** E2E que conta as dobras "Como ler" por subaba (no máximo uma de aba mais as de gráfico)
**Tamanho:** S

### Tarefa 52: Tirar as redundâncias
**Aceite:**
- [x] Diagnóstico: "Visão complementar: lacunas e retenção por tópico" sai; "Como a retenção é calculada" vira link da Queda de retenção
- [x] Diagnóstico: "Ver evidências" por cartão passa a um aviso comum por grupo; o grupo "Língua Inglesa · 0 com evidência" vira uma linha no cabeçalho
- [x] Resumo: "Comparação e principais mudanças" mantém só "Principais mudanças" e os critérios; a tabela "Período atual × anterior" e o bloco-link de Carga saem
- [x] Simulados: "Histórico da trajetória" vira uma linha no bloco da projeção
**Verificação:** E2E por tela (ausência das dobras antigas; conteúdo útil mantido); busca no bundle pelos nomes antigos
**Dependências:** Tarefas 49 a 51
**Tamanho:** M

### Tarefa 53: Por disciplina e tempo sem repetição
**Decidido (16/11):** visão única com alternância Tabela | Barras; tabela como padrão para todos (o modo iniciante nem mostra a aba). O tempo por disciplina de Ritmo não foi alterado.
**Aceite:**
- [x] Por disciplina mostra os mesmos dados uma vez, com a alternância escolhida
- [x] "Distribuição do tempo por disciplina" (Ritmo) e "Atividade" (Por disciplina) não repetem o mesmo número; uma linha leva à outra
**Verificação:** E2E de alternância e de teclado; golden mobile de Por disciplina
**Dependências:** Tarefa 52
**Tamanho:** M

### Tarefa 54: Mover e normalizar
**Aceite:**
- [x] "Definições de Prontidão, domínio, retenção e aderência" sai do fim do Resumo e vira definição inline junto do primeiro termo (ou "?" no cabeçalho), sem sumir da Ajuda
- [x] "Referência de carreira": movida para Planejamento > Prova e metas (dobra "Referência de ritmo por carreira"); a frase "Sugestão de cursinhos" não existe no código, só "sem pesquisa com aprovados" no card
- [x] "Mais filtros" (Inteligência da prova) deixa de ser uma dobra aberta por padrão; "Filtros do mapa" segue o mesmo padrão dos outros filtros
**Verificação:** unit do vocabulário; E2E das definições inline
**Dependências:** Tarefa 52
**Tamanho:** S

### Tarefa 55: Achatar o aninhamento
**Aceite:**
- [x] "Como o plano foi cumprido" tem no máximo um nível de dobra interna (hoje 7 dobras, em dois níveis)
- [x] "Evolução da Prontidão" tem no máximo duas dobras internas (hoje 4)
- [x] Nenhuma dobra importante some: a composição do tempo, a aderência por disciplina e a execução por semana continuam alcançáveis
**Verificação:** E2E que mede o nível máximo de `<details>` aninhados por subaba (≤ 2)
**Dependências:** Tarefas 50 e 52
**Tamanho:** M


**Notas de entrega (T49 a T55):** o Mapa de lacunas (#gapMapDashboard) ficou estacionado e escondido, porque o fechamento semanal e três E2E ainda o usam. Quem tem poucos registros vê o Diagnóstico sem cartões nos grupos até clicar em "Ver os N". Os goldens da projeção ficaram mais altos porque a dobra única contém a calibração.

### Checkpoint 11
- [ ] Altura com dobras abertas medida antes e depois, por subaba, no desktop e no celular
- [ ] As alternativas acessíveis ("Ver valores do gráfico", "Dias com atividade por semana, em texto") seguem presentes
- [ ] E2E, tipos e goldens revisados
- [ ] `/impeccable critique` ≥ 32/40, com H4 ≥ 3 e H8 ≥ 3

## Fase 13: Números e prioridade única

**Origem:** crítica 13 (16/11/2026, 27/40; H4, H6 e H8 em 2). A Fase 12 enxugou as dobras, mas a nota não se mexeu: o que pesa é consistência numérica e prioridade.

### Tarefa 56: Tendência da Prontidão independente do período
**Origem:** com 30 dias o Resumo diz "−3 pontos, em queda"; com 90 dias, "+10 pontos, em alta"; a dobra Evolução da Prontidão diz "−4" para os mesmos fechamentos.
**Aceite:**
- [x] "Tendência entre os dois últimos fechamentos" e o "N pontos" usam sempre os dois últimos fechamentos semanais salvos, qualquer que seja o período
- [x] A frase do Resumo e a dobra Evolução da Prontidão mostram o mesmo valor (mesma fonte)
- [x] A lista "Principais mudanças" mantém a comparação por período, com o rótulo que já diz isso
**Verificação:** unit com dois períodos e os mesmos fechamentos; E2E trocando 30 para 90 dias sem mudar o texto da tendência
**Tamanho:** S

### Tarefa 57: Um formatador por grandeza
**Aceite:**
- [x] Milhar sempre com ponto em Desempenho ("1.247" em todo lugar)
- [x] Percentuais com uma casa em todo lugar de Desempenho (sem "75%" ao lado de "66,9%" e sem "70,0%" ao lado de "72%")
- [x] Singular e plural certos ("1 revisão", "1 questão")
- [x] Escalas nomeadas igual: "36/100" para índices e "36%" para percentuais, sem misturar na mesma dobra
**Verificação:** E2E `pt-br-format` ampliado com milhar, plural e ",0"; unit dos formatadores
**Tamanho:** M

### Tarefa 58: Um rótulo por contagem de "sem evidência"
**Aceite:**
- [x] O Diagnóstico chama de "sem nenhum registro" o que não tem dado; a Inteligência da prova chama de "sem evidência suficiente para posicionar" o que não entra nos quadrantes
- [x] Cada contagem diz o critério na própria linha
**Verificação:** unit dos textos; E2E que lê as duas contagens
**Dependências:** Tarefa 57
**Tamanho:** S

### Tarefa 59: Uma prioridade só
**Aceite:**
- [x] A diferença entre a fila e a Próxima ação está dita em texto (a Próxima ação sai da fila, por decisão da T38; não ganhou marca dentro dela)
- [x] "O que mais pesa", "Lacuna × impacto", "Maior oportunidade na banca" e o ponto de atenção da projeção dizem em uma palavra por qual critério ordenam, em vez de uma nota "não substitui a Prioridade de hoje"
**Verificação:** unit dos rótulos; revisão humana
**Dependências:** Tarefa 58
**Tamanho:** M


**Notas de entrega (T56 a T59):** não tratados, por escolha: foco perdido após "Ver os N", "Restaurar padrão" e Tabela/Barras; hint de atalhos por período; os 3 achados de axe da crítica 13 (h5 no bloco de faixa, tabela rolável de Questões, "?" de 24 px); selo de janela como span; laranja como série.

### Checkpoint 13
- [ ] E2E, tipos e goldens revisados
- [ ] `/impeccable critique` ≥ 32/40, com H4 ≥ 3 e H8 ≥ 3

## Fase 14: Enxugar o Diagnóstico

**Origem:** crítica 14 (18/11/2026, 28/40). Medido na demo: #diagnosisCenter 3,8 mil px; Lacuna × impacto 909 px; primeiro grupo aberto 951 px; cada card 268 px com 3 botões.

### Tarefa 60: Lista enxuta
**Aceite:**
- [x] As disciplinas do Diagnóstico mostram 8 à vista e o resto sob "Mostrar mais · +N" (lista progressiva)
- [x] Lacuna × impacto mostra 5 tópicos (era 10) e diz que são os primeiros da fila que têm lacuna e impacto medidos
- [x] O contador diz "N de M itens com registro (K sem registro, ocultos)" quando os sem registro estão fora da lista, e volta ao texto antigo com filtro ligado
**Verificação:** unit do contador e do corte; E2E que mede a altura do Diagnóstico fechado
**Tamanho:** S

### Tarefa 61: Um primário por card
**Aceite:**
- [x] Cada card mostra só o botão primário ("Iniciar revisão" etc.); "Ver evolução" e "Planejar ação" ficam numa dobra "Mais ações" do card
- [x] As ações continuam alcançáveis por teclado e com os mesmos atributos
**Verificação:** E2E de teclado nas duas ações; `visual-consolidation` ajustado
**Dependências:** Tarefa 60
**Tamanho:** S

### Checkpoint 14
- [ ] E2E, tipos e goldens revisados; altura do Diagnóstico medida antes (5,1 mil px fechado) e depois
- [ ] `/impeccable critique` ≥ 32/40, com H4 ≥ 3 e H8 ≥ 3

## Fase 15: Prioridade única

**Origem:** crítica 15 (18/11/2026, 27/40). Seis vozes: Próxima ação, fila do Diagnóstico, "O que mais pesa", "Maior oportunidade na banca", ponto de atenção da projeção e Inteligência da prova.

### Tarefa 62: "O que mais pesa" sem nomear tópico
- [x] A Leitura conta os tópicos fracos de alto impacto ("N tópicos … puxam a Prontidão") e leva à fila do Diagnóstico; não cita nome de tópico
- [x] A contagem respeita a fila do Diagnóstico (tópico fora dela não entra)

### Tarefa 63: Projeção e Inteligência sem voz própria
- [x] O passo "O que seria necessário?" conta os tópicos de risco, sem nomear um
- [x] O bloco "Maior oportunidade na banca" e a seção "Prova × Você" (que ficava vazia) saem de Inteligência da prova

### Tarefa 64: Próxima ação × fila numa linha
- [x] O Diagnóstico diz "A Próxima ação (X) vem do plano de hoje; a fila abaixo começa por Y…" quando os dois diferem

**Verificação:** unit da Leitura e da projeção; E2E `performance-numbers` (T62 a T64)
**Fica de fora:** o formato único de percentual, o foco após as ações e a manchete da Prontidão (seguem abertos).

### Checkpoint 15
- [ ] `/impeccable critique` ≥ 32/40, com H4 ≥ 3 e H8 ≥ 3
