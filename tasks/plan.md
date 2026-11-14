# Plano de implementação: enxugar e tornar coerente a aba Desempenho

## Visão geral

A aba Desempenho tem ~19.800 px de conteúdo, 48 dobras e responde várias vezes à mesma pergunta com números que não batem (Prontidão 47 × 56, simulados 81/80/80,7%, quatro aderências, domínio em % e /100, quatro respostas para "ponto mais fraco"). A análise, as personas e as decisões estão em [analise-desempenho-enxugar.md](analise-desempenho-enxugar.md). Este plano transforma aquela análise em tarefas verticais, na ordem decidida: primeiro as Conquistas em Hoje, depois a investigação demo × produto e os números divergentes, depois coerência, cortes, reorganização das abas, referência de ritmo com notas de corte oficiais, gráficos e modo iniciante.

Tarefas detalhadas: [todo.md](todo.md).

## Decisões de arquitetura

- **Conquistas viram estado registrado.** Hoje `achievements-controller.ts` calcula `unlocked: item.check()` a cada render, sem data. Passa a existir um registro por conquista (`id`, `unlockedAt`, `source: 'live' | 'migrated'`), gravado uma vez e nunca recalculado (princípio 4 do PRODUCT.md). Exige migração do esquema 30 → 31 em `src/state/migrations.ts`.
- **Avisos só para desbloqueios `live`.** Migração, importação de backup e entrada na demo gravam `migrated` e não disparam aviso.
- **Uma prioridade só.** O critério do Diagnóstico (lacuna × impacto) é a resposta oficial para "ponto mais fraco"; as outras telas citam por link.
- **Vocabulário fixo** (seção 6 da análise): domínio e retenção em /100; "confiança" só na faixa projetada; demais selos são "Evidência".
- **Investigar antes de corrigir números.** T2 classifica cada incoerência (dado da demo, cálculo, apresentação, correto mal explicado) antes de qualquer correção em T3.
- **Notas de corte só de fonte oficial.** O catálogo recusa nota sem link da banca ou do órgão.
- **Gráficos responsivos por regra**, não por largura fixa: largura do cartão, proporções por tipo, mínimo de 3 pontos (seção 14.3 da análise). Usar a skill `dataviz` e `src/ui/primitives/charts/charts.tsx`.
- **Rotas antigas redirecionam** (`#desempenho/history`, `/questions`, `/simulations`, `/exam`) em vez de quebrar links copiados.

## Lista de tarefas

### Fase 1: Conquistas em Hoje
- [x] Tarefa 1: Registro de desbloqueio e migração 30 → 31
- [x] Tarefa 2: Aviso de conquista desbloqueada
- [x] Tarefa 3: Resultado da sessão mostra conquista ganha ou a mais perto
- [x] Tarefa 4: Subaba "Conquistas" em Hoje e redirecionamento
- [x] Tarefa 5: Marca no plano do dia

### Checkpoint 1: Conquistas
- [ ] Testes, tipos e build limpos; E2E de sessão com aviso; revisão humana

### Fase 2: Origem e correção dos números
- [x] Tarefa 6: Investigação demo × produto (T2)
- [x] Tarefa 7: Simulados com um arredondamento e contagem explicada
- [x] Tarefa 8: Selos de janela e dois números de execução do plano

### Checkpoint 2: Números
- [ ] Relatório T2 revisado; nenhuma tela com o mesmo número em arredondamentos diferentes

### Fase 3: Coerência (vocabulário e janelas)
- [x] Tarefa 9: Vocabulário de domínio, retenção, confiança e evidência
- [x] Tarefa 10: Linha de comparação e "Copiar link" um por subaba
- [x] Tarefa 11: Turnos num bloco, uma leitura
- [x] Tarefa 12: "O que mais pesa" alinhado ao Diagnóstico

### Checkpoint 3: Coerência
- [ ] `/impeccable critique` da aba; H4 e H6 ≥ 3 (14/11: 23/40, H4 = 1, H6 = 1; correções abaixo)
- [x] C3.1 P0: deltas da Prontidão com um limiar, fatores do cálculo de hoje rotulados, janela no 73%, contagem 5 de 6 simulados
- [x] C3.2 P0: simulados com numeração coerente e três médias com um nome cada (conta canônica 6 · 3 · 5)
- [x] C3.3 P1: vocabulário e escala em Prova e metas, Diagnóstico, radar e Disciplinas (antecipa a Tarefa 33)
- [x] C3.4 P1: projeção num bloco só e metodologia do Diagnóstico uma vez (antecipa as Tarefas 13 e 14)
- [x] C3.5 P2: card do Diagnóstico com um botão primário e alerta só para risco real
- [x] C3.6 P2: selo do Resumo do período igual ao conteúdo; resumo dos 7 dias aberto
- [x] C3.7 P2: alvos de toque do Ritmo (mapa de calor, 3 botões de 18 px)
- [x] Nova crítica (14/11, 2ª rodada): 23/40, H4 = 1, H6 = 2; varredura final de escala feita. Fechar o Checkpoint 3 com H4 e H6 ≥ 3 depois da Fase 4

### Fase 4: Cortar repetições
- [ ] Tarefa 13: Resumo da semana na Visão geral
- [ ] Tarefa 14: Diagnóstico sem "Situação do preparo" nem sugestão duplicada
- [ ] Tarefa 15: Faixa projetada só em Simulados
- [ ] Tarefa 16: Gráficos existentes com tamanho responsivo

### Checkpoint 4: Repetições
- [ ] Visão geral ≤ 1.600 px no desktop; nenhum gráfico mais largo que o cartão em 375 e 320

### Fase 5: Reorganizar as abas
- [ ] Tarefa 17: Aba "Provas" sem segundo nível
- [ ] Tarefa 18: Modos da Comparação em Disciplinas (precisão, tendência, progresso, radar)
- [ ] Tarefa 19: Diagnóstico agrupado por disciplina com filtro
- [ ] Tarefa 20: Matriz condicional; Balanço e Radar de vulnerabilidades como ordenações
- [ ] Tarefa 21: Replanejamentos em Planejamento
- [ ] Tarefa 22: Ritmo com dois números, extrato de sessões e tempo por disciplina

### Checkpoint 5: Navegação
- [ ] 5 abas sem segundo nível; rotas antigas redirecionam; E2E atualizados

### Fase 6: Referência de ritmo e notas de corte
- [ ] Tarefa 23: Textos da referência sem afirmação sem fonte
- [ ] Tarefa 24: Campo de nota de corte no catálogo com validação de fonte
- [ ] Tarefa 25: Notas de corte oficiais de BB, Caixa e CNU
- [ ] Tarefa 26: Pesquisa de notas de corte dos outros concursos (T5)
- [ ] Tarefa 27: Precisão comparada com a nota de corte do concurso ativo

### Checkpoint 6: Referência
- [ ] Nenhum rótulo afirma dado de aprovados sem fonte

### Fase 7: Visual e iniciante
- [ ] Tarefa 28: Régua da Prontidão e minigráficos dos KPIs
- [ ] Tarefa 29: Gráficos de Disciplinas e Diagnóstico
- [ ] Tarefa 30: Gráficos de Provas
- [ ] Tarefa 31: Gráficos de Ritmo
- [ ] Tarefa 32: Estados vazios do modo iniciante

### Checkpoint final
- [ ] Todos os critérios atendidos; `/impeccable critique` ≥ 32/40; pronto para revisão

### Fase 8: Vocabulário e contagens nas outras telas
- [ ] Tarefa 33: Vocabulário (domínio e retenção /100, evidência × confiança) fora de Desempenho
- [ ] Tarefa 34: Contagens de simulados e janelas nas outras telas; decisão sobre a base do fator Simulados

### Checkpoint 8: Outras telas
- [ ] Busca no bundle sem "domínio N%" nem "confiança" fora da faixa projetada; E2E e capturas atualizados

## Grafo de dependências

```
T1 registro/migração ──┬── T2 aviso
                       ├── T3 resultado da sessão ── T5 marca no plano
                       └── T4 subaba em Hoje ─────── T22 (extrato sai de Conquistas)
T6 investigação ── T7, T8 ── T9..T12 ── T13..T16 ── T17..T22
T23 ── T24 ── T25 ── T27      T26 (paralela, dados)
T16 ── T28..T31 (gráficos usam as regras de tamanho)
T17..T22 ── T32
```

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Migração 30 → 31 corromper backups | Alto | Teste com backup v30 real da demo, backup sem conquistas e backup já migrado; migração idempotente |
| Avisos em massa ao importar backup ou entrar na demo | Médio | Só `source: 'live'` gera aviso; teste explícito |
| Hoje não tem subabas hoje | Médio | Tarefa 4 usa o primitivo `Tabs` já usado em Desempenho; conferir o controller antes |
| Incoerências serem da demo e não do produto | Médio | T6 antes de T7–T8; correções no gerador da demo quando for o caso |
| Reorganização quebrar E2E e capturas | Alto | Redirecionamentos de rota; atualizar specs na mesma tarefa |
| Notas de corte de fonte não oficial | Alto | Validação do catálogo exige link oficial; números de blog proibidos |
| Gráficos novos sem contraste nos dois temas | Médio | Skill `dataviz` com validador de cor; teste axe nos E2E |
| Variação ±1 da nota da crítica entre rodadas | Baixo | Usar a crítica como sinal, não como aceite único |

## Perguntas em aberto

- Hoje: a subaba de Conquistas fica ao lado de quais seções existentes (plano, agenda, histórico de sessões)? Decidir ao ler `today-tab-controller.ts` na Tarefa 4.
- ~~Data inferida na migração~~ **Decidido (13/11/2026):** inferir a data das conquistas cumulativas (horas, questões, tópicos, simulados) pelo registro que atingiu o critério; as demais ficam sem data. A data fica salva no registro e aparece no painel de Conquistas ("Desbloqueada em 02/10/2026"; sem data: "Desbloqueada antes de <data da migração>").
