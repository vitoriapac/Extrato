# Plano de implementação: aba Planejamento coerente, visual e para dois perfis

## Visão geral

A aba Planejamento hoje faz quatro trabalhos ao mesmo tempo (configurar, planejar, acompanhar e auditar) e conta a mesma semana com números diferentes. A crítica impeccable de 14/11 deu 22/40.

Este plano transforma a [análise](analise-planejamento-enxugar.md) e a [crítica](../.impeccable/critique/2026-11-14T08-26-09Z__index-html-planejamento.md) em tarefas verticais com três objetivos:

1. **Números que fecham.** A mesma semana com os mesmos valores em Semana, Fechamento e Histórico.
2. **Dois perfis sem duas telas.** O iniciante vê um caminho curto e guiado. O analítico liga o modo completo e encontra tudo, com edição em lote e "Ver dados".
3. **Mais visual sem perder o extrato.** Gráficos que substituem listas de texto, sempre presos às linhas de razão, à mono nos números e aos tokens de série do DESIGN.md.

Tarefas detalhadas: [todo-planejamento.md](todo-planejamento.md). Este plano é independente do plano da aba Desempenho em [plan.md](plan.md), que continua em andamento.

## Decisões já tomadas

1. Fechamento continua como subaba própria.
2. Vai para Desempenho só o que serve ao estudante avançado (seção 8.1 da análise); a lista de eventos da linha do tempo é cortada.
3. A meta global de questões é a fonte; as metas por disciplina são uma repartição dela.
4. Começar pelos números coerentes e seguir o plano inteiro.
5. O tempo estudado é o número principal; a aderência é a segunda leitura.
6. A mudança para Desempenho espera a reorganização das subabas de Desempenho (Checkpoint 5 do plano da Desempenho).
7. **Reserva e plano (investigação da T2):** o plano semanal passa a ocupar 90% da capacidade, para a distribuição conseguir cumprir o que o plano promete. Planos já confirmados não são reescritos. Vira a Tarefa 7b.
8. **Revisões:** as revisões vencendo na agenda substituem a parcela de revisões do plano, em vez de somar por cima. Também na Tarefa 7b.
9. **Demo:** os planos diários futuros de 80 min por dia passam a ser vinculados ao plano semanal, junto da Tarefa 4.

## Decisões de arquitetura

- **Uma fonte para a semana.** `buildWeekReconciliation` (`src/ui/tabs/goals/week-reconciliation.ts`) passa a alimentar o Resumo da semana, o "A semana" do Fechamento e o período atual do Histórico. Nenhum bloco recalcula "planejado" por conta própria.
- **Três medidas com nome fixo, os que o DESIGN.md (seção Conciliação) já define:**
  - **Capacidade da semana:** horas disponíveis nos 7 dias.
  - **Com tarefa marcada:** tempo com tarefa nos dias (semana inteira ou até hoje, dito no rótulo).
  - **Estudado até hoje:** tempo registrado.

  Não se cria o termo "Agendado": o Resumo e o DESIGN.md já usam esses nomes, e o Fechamento e os Retratos devem passar a usá-los (Tarefas 5 e 19b). O recorte vai no rótulo. A palavra "planejado" sozinha sai da aba. O plano confirmado é chamado de **Plano**, com valor por semana.
- **Um formato de duração:** `formatPlanMinutes` (`src/core/format-duration.ts`), que gera `1h20`, `2h` e `48min`, como o DESIGN.md já exige.
- **Meta de questões:** `state.metas.questoesSemanal` é a fonte. O editor por disciplina mostra a soma ao lado da global e avisa quando não fecha. Defeito confirmado no código: `subject-target-editor-controller.ts:73` lê `state.metas?.questoesPorSemana`, um campo que não existe, por isso a tela diz "sem meta global" com a meta 220 configurada.
- **Iniciante × analítico pelo modo Essencial que já existe.** `src/ui/essential-mode.ts` já esconde `[data-advanced]` atrás de "Mostrar …" e adiciona "?" aos termos em `[data-term]`. O plano só decide quais blocos são avançados e acrescenta termos ao `TERM_HINTS`. Não cria um terceiro modo.
- **Gráficos só com os primitivos existentes** em `src/ui/primitives/charts/`: `StackedBar`, `ColumnChart`, `AllocationBar`, `BulletBar`, `WeeklyTrendChart`, `PhaseRoadmapTimeline`, `RingGauge` e `Sparkline`. Um primitivo novo só entra se nenhum servir, e com teste de geometria. Ao implementar, usar a skill `dataviz` e as regras de gráfico do DESIGN.md:
  - `role="img"` com descrição e "Ver dados" quando houver tabela;
  - texto do SVG nunca abaixo de 12px;
  - escala real;
  - no máximo cerca de 6 rótulos de data;
  - cor nunca como única leitura;
  - séries em `--chart-series-*`.
- **Identidade de extrato.** O gráfico entra abaixo da linha de razão que ele detalha, nunca no lugar dela. Valores em Plex Mono, saldo em Fraunces, nenhum card dentro de card.
- **Cinco subabas viram quatro:** Semana · Prova e metas · Fechamento · Histórico. A chave `prova` é mantida, com rótulo "Prova e metas", e `#planejamento/metas` redireciona para ela. Assim links e testes antigos não quebram.
- **Mover não é fundir.** Decisões, linha do tempo e evolução das prioridades vão para a mesma seção de Desempenho sem misturar os registros (`docs/INFORMATION-OWNERSHIP.md`).

## O que cada perfil vê na Semana (alvo)

| Bloco | Iniciante (Essencial ligado) | Analítico (Essencial desligado) |
|---|---|---|
| Roteiro de 3 passos (prova, horas, plano) | Enquanto faltar um passo | Oculto |
| Plano da semana + "Agendar nos próximos 7 dias" | Sim | Sim |
| Extrato da semana: Capacidade, Com tarefa marcada, Estudado + barra do saldo | Sim | Sim |
| Semana em 7 colunas | Sim | Sim, com "Ver dados" |
| Plano × estudado por disciplina | 5 maiores + "outras" | Lista completa |
| Execução das prioridades | Atrás de "Mostrar" | Sim |
| Estratégia por fase, histórico de adaptações | Atrás de "Mostrar" | Sim |
| Disponibilidade | Fora da dobra enquanto a capacidade não foi informada | Na dobra "Ajustar" |

## Grafo de dependências

```
T1 meta global ─────────────────────────────────┐
T2 investigação do Distribuir ── T8 estado do plano + ações
T3 legenda ── T11 plano × estudado por disciplina
T4 vocabulário + fonte única ──┬── T5 Fechamento usa a fonte
                               ├── T6 prioritário e excesso
                               ├── T9 barra do saldo
                               ├── T10 semana em 7 colunas
                               └── T19a série semanal no Histórico
T7 formato de duração (paralela a T4..T6)
T7b plano a 90% e revisões substituem ──┐
T4 (inclui demo vinculada) ─────────────┴── T8 estado do plano + ações
T12 roteiro do iniciante ── depende de T8, T9
T13 metas e disponibilidade ── depende de T1
T14 subaba "Prova e metas" ── T15a tabela de leitura ── T15b edição em lote ── T16 três alvos
T17 ritmo × meta ── depende de T13
T18 Fechamento enxuto ── depende de T5
T19a ── T19b retratos e estado vazio
[Checkpoint 5 do plano da Desempenho] ── T20, T21a, T21b ── T22 docs e ajuda
T23 celular, T24 polimento, T25 crítica final ── depois de tudo
```

## Lista de tarefas

### Fase 0: Defeitos e investigação (falhar cedo)
- [ ] Tarefa 1: Meta global de questões chega ao editor por disciplina
- [ ] Tarefa 2: Investigar o "Distribuir nos próximos 7 dias" (2h20 em 5 dias contra 12h)
- [ ] Tarefa 3: Corrigir a legenda invertida em "Distribuição entre disciplinas"

### Checkpoint 0: Defeitos
- [ ] Testes, tipos e build limpos; relatório da T2 revisado com você

### Fase 1: Números coerentes
- [x] Tarefa 4: Resumo da semana com os nomes fixos, estudado em destaque e demo vinculada ao plano
- [x] Tarefa 5: "A semana" do Fechamento usa a mesma fonte, com o estudado em destaque
- [x] Tarefa 6: Tempo prioritário e excesso com um valor e um formato
- [x] Tarefa 7: Um formato de duração em toda a aba
- [x] Tarefa 7b: Plano semanal ocupa 90% da capacidade e revisões da agenda substituem as do plano
- [x] Tarefa 8: Plano confirmado sem texto de prévia, com linha de estado e ações renomeadas

### Checkpoint 1: Números
- [x] Na demo, a mesma semana mostra os mesmos valores em Semana, Fechamento e Histórico (conferido em 14/11/2026: capacidade 12 h, com tarefa marcada 13 h 30 min, estudado 10 h 23 min; E2E permanente em planning.spec.js). Recortes que continuam diferentes e rotulados: prioridades (semana inteira x dias até hoje) e aderência (até hoje).
- Decisão de 14/11/2026: formato único de duração é "1 h 20 min", "2 h", "48 min" (não "1h20"); formatPlanMinutes passou a emitir esse formato. Pendência fora de Planejamento: formatDuration (segundos, cronômetro) ainda emite "7min".

### Fase 2: Semana visual
- [x] Tarefa 9: Barra do saldo abaixo das linhas de razão
- [x] Tarefa 10: Semana em 7 colunas no lugar da lista "Planejado × realizado"
- [x] Tarefa 11: Um bloco "Plano × estudado por disciplina" no lugar de dois

- [x] Tarefa 11b: Frase-resumo no topo do Resumo e alerta de excesso com ação (P1 da crítica, 26/40)
- [x] Tarefa 11c: Linguagem da Semana sem jargão ("vínculo", "Semana Real") e botão claro (P3 da crítica)

- [x] Tarefa 11d: Resumo no topo da Semana, plano como contexto, um número herói e uma barra só (P1 da 2ª crítica, 27/40)
- [x] Tarefa 11e: Assinatura de extrato nas linhas de razão (pontilhado visível, dupla linha no total, valores em mono tabular) (P2 da 2ª crítica)

### Checkpoint 2: Semana
- [x] Crítica impeccable só da Semana, detector e axe sem regressão (4 rodadas: 26, 27, 28, 27/40; piso de 30 e meta de 4 dobras não atingidos, fechado com ressalva em 15/11/2026)

### Fase 3: Iniciante e analítico
- [x] Tarefa 12: Roteiro de 3 passos e blocos avançados no modo Essencial
- [x] Tarefa 13: Disponibilidade perto do plano e metas enxutas

### Checkpoint 3: Perfis
- [x] Percurso do iniciante (perfil vazio) e do analítico (demo) verificados (15/11/2026; o plano confirmado do Jordan depende de conteúdo cadastrado: ver pendência no todo)

### Fase 4: Prova e metas
- [x] Tarefa 14: Subaba "Prova e metas" (5 → 4 subabas)
- [x] Tarefa 15a: Tabela única de leitura por disciplina, com acerto contra meta em barra
- [x] Tarefa 15b: Edição na linha, lote em todas as colunas e um único salvar
- [x] Tarefa 16: Três alvos viram um no modo Essencial
- [x] Tarefa 17: Ritmo ao lado da meta de tópicos, com aviso

### Checkpoint 4: Prova e metas
- [ ] Meta de acerto editável em um lugar só; ajustar 17 disciplinas com uma seleção e uma ação

### Fase 5: Fechamento e Histórico
- [x] Tarefa 18: Análise do Fechamento em uma dobra, com a tendência de 4 semanas
- [x] Tarefa 19a: Uma série semanal no Histórico no lugar de quatro
- [x] Tarefa 19b: Retratos paginados, período atual fora das variações e estado vazio

### Checkpoint 5: Fechamento e Histórico
- [ ] Histórico com menos de 20 dobras na demo

### Fase 6: Mover para Desempenho (bloqueada pelo Checkpoint 5 do plano da Desempenho)
- [ ] Tarefa 20: Histórico de decisões e evolução das prioridades em Desempenho › Calibração
- [ ] Tarefa 21a: Plano × impacto e Matriz em Desempenho
- [ ] Tarefa 21b: Comparação por fase e comparação entre períodos em Desempenho
- [ ] Tarefa 22: Posse da informação e Central de Ajuda atualizadas

### Checkpoint 6: Mudança
- [ ] Nenhum bloco existe nas duas abas; links de uma linha no lugar de origem

### Fase 7: Celular e acabamento
- [ ] Tarefa 23: Primeira tela e tabelas no celular
- [ ] Tarefa 24: Polimento visual e de texto
- [ ] Tarefa 25: Crítica final e atualização das referências visuais

### Checkpoint final
- [ ] Crítica impeccable ≥ 30/40 (alvo 32), sem P0/P1; suíte completa passando

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| O "Distribuir" de 2h20 é regra de negócio (revisões, tópicos elegíveis, reserva de 10%) e não defeito | Médio | A T2 classifica antes de corrigir; se for regra, a correção é explicar na prévia, não mudar o cálculo |
| Mudar rótulos quebra testes E2E e referências visuais | Médio | Cada tarefa atualiza seus specs; as referências visuais são regeneradas uma vez, na T25, com revisão das imagens |
| A Tarefa 21 da Desempenho ("Replanejamentos em Planejamento") traz conteúdo para a Semana enquanto este plano a enxuga | Médio | A T8 define a linha de estado do plano como lugar do replanejamento; quem fizer a T21 da Desempenho encaixa ali |
| Retratos congelados guardam rótulos antigos ("Planejado") | Alto | Retratos salvos não são reescritos (princípio 4); só a apresentação traduz o rótulo, e o valor congelado não muda |
| Gráficos novos pioram o celular | Médio | Regra do texto de 12px com região rolável focável; verificação em 320 e 375 px em cada tarefa visual |
| A Tarefa 7b muda o orçamento do plano (100% → 90%) e interage com a estratégia por fase, que preserva "carga e capacidade" | Alto | A 7b verifica `phase-strategy` e o teste de fase antes de mudar o orçamento; planos confirmados não são reescritos; só "Recalcular plano" gera o valor novo, com prévia |
| Vincular os planos diários da demo ao plano semanal muda "Com tarefa marcada", aderência e referências visuais | Médio | Fica na Tarefa 4, junto da fonte única da semana; as referências da demo são regeneradas e revisadas na Tarefa 25 |
| Outra sessão edita os mesmos arquivos (plano da Desempenho em andamento) | Médio | Adicionar ao commit só os arquivos da própria tarefa; nunca `git add -A` |
| A meta global de questões passa a valer e a soma por disciplina (1.190) fica sem sentido na demo | Baixo | A T1 revê os padrões da demo e do perfil novo para a soma fechar com a global, e oferece repartição proporcional com prévia para dados já salvos |

## Decisões das perguntas em aberto (14/11/2026)

- **Metas por disciplina que somam mais que a global (T1):** o app avisa e oferece repartir proporcionalmente, com prévia e confirmação; nunca aplica sozinho.
- **Rótulo da subaba unida (T14):** "Prova e metas".
- **Meta da crítica final (T25):** 30/40 como piso e 32/40 como alvo, sem P0 nem P1.
