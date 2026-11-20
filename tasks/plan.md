# Plano: divergências, redundâncias e repetições entre abas

Origem: [RELATORIO.md](../auditorias/2026-11-20-analise-analitica-divergencias/RELATORIO.md) (seção 13, "Não implementado"). O plano anterior ("enxugar Desempenho") foi arquivado em [arquivo/plan-desempenho-enxugar.md](arquivo/plan-desempenho-enxugar.md) e [arquivo/todo-desempenho-enxugar.md](arquivo/todo-desempenho-enxugar.md) por decisão do usuário em 20/11/2026. As análises que ele cita continuam em `tasks/analise-desempenho-enxugar.md`.

Tarefas detalhadas: [todo.md](todo.md).

## Visão geral

Os cálculos do app fecham, mas o mesmo assunto aparece em 4 a 6 telas com números e rótulos diferentes, e cinco itens concorrem como "prioridade". O trabalho é: (1) decidir regras únicas, (2) aplicá-las por fatias verticais (uma grandeza ou um bloco por tarefa, da regra de domínio até o texto na tela, com teste), (3) cortar a repetição, (4) alinhar vocabulário e primeira visita. Já feito em `c924e5f`: contador de pendências na Desempenho, textos de sugestão, uma casa decimal no acerto agregado, rótulo "tendência: N semanas".

## Grafo de dependências

```
Fase 0: decisões D-A … D-K (bloqueiam as fases 1–4)
   │
   ├─ Fase 1: números e janelas   (D-C, D-D, D-E, D-F)
   │      └─ depende de: selo/regra de janela (T1) → T2…T9
   ├─ Fase 2: prioridade única    (D-A, D-B)  ── T10 (investigar) → T11 → T12
   │      └─ T12 usa os rótulos fixos da Fase 4 (T20) para os nomes
   ├─ Fase 3: redundância         (D-G, D-H)  ── independente da 1 e da 2, exceto T14 (R3) depois de T11
   ├─ Fase 4: vocabulário/1ª visita (D-I, D-J)
   └─ Fase 5: demo e mobile       (D-K)       ── T22 (demo) só depois da Fase 1 e da T10
```

Regra de ordem: o que muda uma regra de domínio vem antes do que muda texto; investigação antes de correção (princípio do plano anterior).

## Decisões de arquitetura

- **Um módulo de janela.** O rótulo de janela ("7 d", "30 d", "4 sem", "todo o histórico") passa a vir de um único helper usado por Visão geral, Disciplinas, Desempenho e Planejamento. Hoje cada tela escreve o seu.
- **Um módulo de "meta atingida".** `abaixo da meta` e `na meta` calculados por uma função de domínio com amostra mínima declarada; as telas só exibem.
- **Dois nomes fixos para ação:** o plano chama-se "Plano de hoje"; o motor de recomendação chama-se "Sugestão do diagnóstico". "Próxima ação" fica reservada ao que a Visão geral mostrar como a atividade a fazer (depende de D-A).
- **Testes fixam valor e rótulo.** Cada divergência corrigida ganha um teste unitário que reproduz o caso do relatório e um E2E na demo quando a divergência cruza telas.
- **Demo não esconde defeito de cálculo.** Se a causa é dado da demo, corrige-se `src/demo`; se é cálculo, corrige-se a camada de aplicação (mesma regra da T2 antiga).

## Fases e tarefas (resumo; critérios em todo.md)

### Fase 0: decisões
- T0 Fechar as decisões D-A … D-K abaixo, registrando a escolha neste arquivo.

### Fase 1: números e janelas
- T1 Helper único de janela + selo nos percentuais de acerto por disciplina (D4)
- T2 Critério único de "abaixo da meta" (D5)
- T3 Simulados: uma contagem, uma média, um arredondamento (D6)
- T4 Progresso até a prova: uma base (D8)
- T5 Aderência e "faltam": dois números definidos e com a janela (D9, D10)
- T6 Contagem de tópicos por disciplina (D12)
- T7 Formato numérico único: milhar, casas decimais, ",0" falso (D13 restante)
- T8 Metas e denominadores do dia, e estado vazio sem padrões embutidos (D14)
- T9 Saldo × "Resgatar" × "Replanejamento indisponível" (D15)
- T9b Streak e conquista × histórico (D16, D18)

### Checkpoint 1: números
- Testes, tipos, build; nenhuma grandeza com dois valores sem rótulo de janela; revisão humana

### Fase 2: prioridade única
- T10 Investigar demo × produto: "Classes de palavras" (85%) como lacuna, "Iniciar revisão" em tópicos sem registro (D17), 5 prioridades (D2)
- T11 Fonte única de "prioridade" conforme D-A (Visão geral, Hoje, Desempenho, Diagnóstico, Fechamento)
- T12 Nomes fixos "Plano de hoje" × "Sugestão do diagnóstico" em todas as telas

### Checkpoint 2: prioridade
- Conferir nas 5 telas que a mesma pergunta tem a mesma resposta; revisão humana

### Fase 3: redundância
- T13 Pendências atrasadas: card completo num lugar, link nos demais (R1)
- T14 Ciclo de Estudos num lugar só (R3)
- T15 Sugestão Analytics: uma explicação, links nas outras telas (R2)
- T16 Bloco "tempo livre/0%" e denominadores repetidos em Hoje (R4)
- T17 Empty states: uma mensagem e um CTA por página (R5)
- T18 Rodapé, "Copiar link" e Instruções: cortar repetição (R7, R8, R9)
- T19 "Resultados das provas" × "Questões & Simulados" (R10)

### Checkpoint 3: redundância
- Altura das telas medida antes e depois; nenhum teste de acessibilidade perdido; revisão humana

### Fase 4: vocabulário e primeira visita
- T20 Vocabulário Revisão × Tarefa de estudo e nomes de abas (decidido em D-I)
- T21 Onboarding: entrada única e passos coerentes (R6, V1–V4)

### Fase 5: demo e mobile
- T22 Demo menos sintética (questões por sessão, execução semanal, datas das conquistas)
- T23 Cabeçalho mobile compacto

### Checkpoint final
- `npm test`, `npm run check:types`, `npm run build`, E2E afetados, `impeccable critique` com H4 ≥ 3 e H8 ≥ 3, nova passada de usuário analítico no vazio e na demo

## Decisões pendentes (bloqueiam a fase indicada)

| ID | Decisão | Opções | Bloqueia |
|---|---|---|---|
| D-A ✅ **Decidido (20/11): dois nomes fixos, "Plano de hoje" e "Sugestão do diagnóstico"** | Fonte da "prioridade" | (1) Diagnóstico é a oficial; o plano de hoje vira "agenda". (2) Dois nomes fixos: "Plano de hoje" e "Sugestão do diagnóstico" | T11, T12 |
| D-B | "Classes de palavras" com 85% como lacuna | Depende do resultado de T10 (defeito de cálculo ou dado da demo) | T11 |
| D-C ✅ **Decidido (20/11): cada tela com a sua janela, sempre com selo** | Janela padrão por tela | (1) Visão geral 7 d, Desempenho 30 d, histórico só com rótulo. (2) Cada tela com a sua, sempre com selo | T1 |
| D-D ✅ **Decidido (20/11): amostra mínima de 10 questões** | "Abaixo da meta" | Amostra mínima de 10 questões por disciplina, ou sem mínimo | T2 |
| D-E ✅ **Decidido (20/11): explicar a exclusão no Diagnóstico** | Contagem de tópicos | Diagnóstico exclui concluídos e explica, ou iguala a Disciplinas | T6 |
| D-F ✅ **Decidido (20/11): os dois com nomes ("Tempo até a prova" 61% e "Fase atual" 25%)** | Progresso até a prova | Tempo decorrido total (61%) ou por fase (25%), ou os dois com nomes distintos | T4 |
| D-G ✅ **Decidido (20/11): card completo só em Hoje; número com link nas outras telas** | Pendências atrasadas | Card completo só em Hoje + número com link; ou número em todas as telas | T13 |
| D-H ✅ **Decidido (20/11): bloco completo na Central do Ciclo (Planejamento); Hoje resume a próxima volta** | Ciclo de Estudos | Bloco completo em Hoje ou na Central do Ciclo (Planejamento) | T14 |
| D-I ✅ **Decidido (20/11): aplicar "Tarefa de estudo" × "Revisão espaçada" e nomes de aba iguais** | Vocabulário | "Tarefa de estudo" × "Revisão espaçada" (memória do projeto); nomes de aba iguais em desktop e mobile | T20 |
| D-J ✅ **Decidido (20/11): cartão é a entrada única; banner da demo só na Visão geral** | Onboarding | Modal ou cartão como entrada única; banner da demo em todas as abas ou só na Visão geral | T21 |
| D-K ✅ **Decidido (20/11): gerador da demo autorizado (T22); cabeçalho mobile mantido, T23 cancelada** | Demo | Autorizar mudar o gerador sem quebrar `docs/DEMO-SCENARIO.md`; aprovar o cabeçalho mobile compacto | T22, T23 |

Pendências herdadas do plano arquivado (não abertas por este): notas de corte oficiais BB/Caixa/CNU (T25/T26 antigas, aguardam o usuário enviar os números); posição da subaba Conquistas em Hoje; revisão humana dos checkpoints antigos 1–4.

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Mudar texto quebra E2E e testes que afirmam strings | Médio | Atualizar na mesma tarefa; rodar `npm test` e o E2E afetado antes de fechar |
| Regra de "meta atingida" muda números históricos congelados | Alto | Retratos congelados não são recalculados (princípio 4); a regra vale só para cálculo ao vivo |
| Cortar blocos remove alternativa acessível | Médio | Manter "Ver valores do gráfico" e equivalentes; checar axe nos E2E |
| Reorganizar muda rotas copiadas por usuários | Médio | Redirecionar rotas antigas |
| Corrigir sintoma e esconder defeito da demo | Médio | Investigar antes (T10) e classificar causa |
| Fase 3 (cortes) conflita com a Fase 1 nos mesmos arquivos | Baixo | Ordem: Fase 1 antes; uma sessão por conjunto de arquivos |

## Verificação padrão (cada tarefa)

- Unit: `npm test`
- Tipos: `npm run check:types`
- Build: `npm run build` (regenera bundles; não editar bundles à mão)
- E2E: `npx playwright test <spec>`
- Antes de ler código: `graphify query "<pergunta>"`; depois de editar: `graphify update .`
- Commit só dos arquivos da tarefa (nunca `git add -A`); push direto no `main` somente quando o usuário pedir
