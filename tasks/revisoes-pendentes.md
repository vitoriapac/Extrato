# Revisões humanas pendentes do plano de Planejamento (15/11/2026)

Todas as capturas são do estado atual (depois das três rodadas de crítica), em `tasks/prints-critica8/` (demo, 375 e 1440 px, claro e escuro; Essencial; perfil vazio), `tasks/prints-checkpoint5/` e `tasks/prints-casey/`.

| Checkpoint | O que olhar | Capturas | Critério de aceite |
|---|---|---|---|
| **2 · Semana** | Resumo da semana (frase-herói, linhas de razão, barra de saldo), semana em 7 colunas, bloco único "Plano × estudado por disciplina" | `demo-semana-375-light`, `demo-semana-1440-light`, `demo-semana-375-dark` | Um número herói e uma barra só; sem jargão ("vínculo", "Semana Real"); excesso com uma ação |
| **3 · Perfis** | Iniciante (perfil vazio): roteiro de 3 passos; analítico (demo): tudo aberto; Essencial | `vazio-semana-375-light`, `vazio-prova-375-light`, `essencial-semana-375-light`, `essencial-prova-375-light` | Primeira ação clara sem rolar; blocos avançados atrás de "Mostrar …" |
| **4 · Prova e metas** | Tabela única de Metas por disciplina, Meta de acerto única, "Mais campos" e "Mostrar todas as N" no celular | `demo-prova-375-light`, `demo-prova-1440-light`, `essencial-prova-375-light` | 17 disciplinas ajustáveis com uma seleção e uma ação; dobras fora da tabela (não medido: ver abaixo) |
| **5 · Fechamento e Histórico** | Fechamento em 2 dobras (linha-resumo, tendência de 4 semanas, sinais, retrato, decisão); Histórico com série semanal e listas paginadas | `tasks/prints-checkpoint5/*`, `demo-fechamento-*`, `demo-historico-*` | Fechamento ≤ 2 dobras (medido: 2); Histórico < 20 (medido: 19) |
| **Final** | Percurso completo | todas | Crítica ≥ 30/40: ficou em **28/40** (fechada com ressalva) |

## Dívidas conhecidas para decidir durante a revisão
- Checkpoint 4: "Prova e metas com no máximo 2 dobras fora da tabela" foi medido na revisão assistida abaixo (1 dobra de configuração + 5 linhas expansíveis da Matriz).
- Crítica (rodada 3, 28/40): números parecidos com denominadores diferentes (89%, 88%, 88,8%) e meta 80%/70% na mesma tela; manchete do Fechamento igual à de Plano da semana e período repetido; vazios do Histórico e do Fechamento; P3 de gráfico e contraste.
- Fase 6 (T20–T22) e Checkpoint 6 seguem bloqueados pelo plano da Desempenho.
- Variar a "aderência estratégica" fictícia da demo (90% em todas as semanas) não foi feito.

---

# Revisão assistida contra os critérios (15/11/2026)
Feita por mim sobre as capturas e medições. **Não substitui a revisão humana**: as caixas "Revisão humana" dos checkpoints continuam abertas até você assinar.

| Checkpoint | Critério | Resultado |
|---|---|---|
| **2 · Semana** (1440 claro) | Um número herói e uma barra só | Atende: "Estudado 12 h 58 min de 12 h: 58 min a mais." em serifa, barra de saldo de duas cores |
| | Semana em 7 colunas; bloco único por disciplina | Atende: 7 colunas com HOJE marcado; "Plano × estudado por disciplina" é uma dobra só |
| | Excesso com uma ação, sem jargão | Atende: "Você marcou 2 h 36 min além da disponibilidade… Ajustar disponibilidade" |
| | Ressalvas | "Estudo ligado à tarefa desta semana 12 h 58 min" repete o "Estudado até hoje"; "Execução das prioridades 88%" fica ao lado de 88,8% e 89% (taxas com denominadores diferentes, sem rótulo que os distinga) |
| **3 · Perfis** (vazio 375) | Primeira ação clara sem rolar | Atende: roteiro de 3 passos, passo 1 com o campo de data aberto |
| | Blocos avançados atrás de "Mostrar …" no Essencial | Atende na demo (ver `essencial-*`); no vazio ainda aparecem, abaixo do roteiro, a grade de 7 dias com 2,5 h preenchidas, KPIs "—" e "Simular 'E se?'" antes de existir plano |
| **4 · Prova e metas** | Prova e metas com no máximo 2 dobras fora da tabela | Medido: fora da tabela há 1 dobra de configuração ("Opções gerais da prova") e as 5 linhas expansíveis da Matriz Edital × Domínio; dentro da tabela, 1 ("Aplicar a várias disciplinas"). Atende se as linhas da Matriz contarem como tabela; não atende se contarem como dobras (6) — **decisão sua** |
| | 17 disciplinas ajustáveis com uma seleção e uma ação | Atende (lote em todas as colunas, um único "Salvar alterações") |
| **5 · Fechamento e Histórico** | Fechamento ≤ 2 dobras | Atende: 2 (medido em 375 e 1440) |
| | Histórico < 20 dobras | Atende: 19 em 375 e 1440 (margem de 1) |
| **Final** | Crítica ≥ 30/40 | Não atende: 28/40, sem P0/P1 (fechada com ressalva) |

## O que sobra para você decidir
1. Contar ou não as linhas da Matriz como dobras (Checkpoint 4).
2. Aceitar o Histórico com 19 dobras (limite 20), sabendo que qualquer dobra nova o estoura.
3. Perfil vazio: esconder a grade de horas, os KPIs "—" e "Simular 'E se?'" até existir plano (P2 aberto da crítica).
4. Rotular as três taxas parecidas (89%, 88%, 88,8%) ou mostrar só uma no resumo.
