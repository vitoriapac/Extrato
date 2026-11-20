# Tarefas: divergências, redundâncias e repetições

Contexto: [plan.md](plan.md) e [RELATORIO.md](../auditorias/2026-11-20-analise-analitica-divergencias/RELATORIO.md). Plano anterior arquivado em [arquivo/](arquivo/).

Verificação padrão: `npm test` · `npm run check:types` · `npm run build` · `npx playwright test <spec>`. Antes de ler código: `graphify query "<pergunta>"`; depois de editar: `graphify update .`. Caminhos marcados "provável" não foram abertos nesta rodada; confirmar com o grafo.

Tamanhos: S = 1–2 arquivos, M = 3–5.

---

## Fase 0: decisões

### T0: Fechar as decisões D-A … D-K
**Descrição:** Responder a tabela "Decisões pendentes" de [plan.md](plan.md) e anotar a escolha na própria tabela.
**Aceite:**
- [ ] Cada decisão com opção escolhida registrada em plan.md
- [ ] D-B marcada como "depende de T10"
**Dependências:** nenhuma · **Tamanho:** S (documento)

---

## Fase 1: números e janelas

### T1: Selo de janela no acerto por disciplina (D4) — FEITA em 20/11
**Descrição:** Cada tela diz a janela real do seu acerto (D-C). Causa raiz achada: o card da Visão geral dizia "últimas 4 semanas", mas calculava sobre todo o histórico (e caía para simulados sem questões); Disciplinas mostra a última semana. Não foi criado helper compartilhado: bastou corrigir os dois rótulos.
**Aceite:**
- [x] Produtos e Serviços Bancários deixa de ser 71,1% × 85,0% sem rótulo: Visão geral "todo o histórico", Disciplinas "última semana com questões", Desempenho com o filtro do período
- [x] Acerto vindo de simulados aparece como "% acerto em simulados" na Visão geral (campo `accuracySource`)
- [ ] ~~Banco do Brasil — Específicos mostra o acerto em Disciplinas~~ — removido: Disciplinas é "última semana"; sem questões na semana não há valor, e agora isso é coerente com o rótulo
- [x] Teste unitário da origem do acerto (`syllabus-health-view-model.test.js`)
**Verificação:** unit; E2E na demo comparando a mesma disciplina em 3 telas
**Dependências:** D-C · **Arquivos (provável):** `src/ui/tabs/dashboard/*`, `src/ui/tabs/subjects/*`, `src/ui/performance/*`, novo helper em `src/core/` · **Tamanho:** M

### T2: Critério único de "abaixo da meta" (D5) — FEITA (20/11)
**Aceite:**
- [ ] Uma função de domínio com amostra mínima declarada (D-D); Visão geral ("16 abaixo da meta") e Desempenho ("7 abaixo da meta com dados suficientes") usam a mesma
- [ ] O texto diz o critério onde o número aparece
- [ ] Teste: 17 disciplinas, 12 com amostra, resultado igual nas duas telas
**Dependências:** D-D, T1 · **Tamanho:** M

### T3: Simulados com uma contagem e uma média (D6) — FEITA (20/11)
**Aceite:**
- [ ] Nenhuma tela mostra 81% e 73,0% e 72,9% para a mesma pergunta sem nomes distintos ("resultado central da projeção", "média do período")
- [ ] 84,0% × 83,8% resolvido (uma casa decimal em todo lugar)
- [ ] A frase "… na meta (+3,8 p.p.)" não aparece junto de valores abaixo de 80%
**Verificação:** unit nos formatadores; E2E na demo (Questões, Visão geral, Desempenho)
**Dependências:** nenhuma (retoma a T7 do plano arquivado, que deixou 5 valores na demo) · **Tamanho:** M

### T4: Progresso até a prova com uma base (D8) — FEITA (20/11)
**Aceite:**
- [ ] Cabeçalho (61%) e Prova e metas (25%) deixam de usar o mesmo vocabulário para bases diferentes, conforme D-F
- [ ] Teste unitário da base escolhida
**Dependências:** D-F · **Arquivos (conferido):** `src/ui/renderers/header-renderer.ts` (barra 61%), `src/ui/primitives/charts/PhaseRoadmapTimeline.tsx` ("25% do cronograma decorrido") · **Tamanho:** S

### T5: Aderência e "faltam": dois números com janela (D9, D10) — FEITA em parte (20/11): rótulos de janela; a unificação de nomes na Visão geral/Planejamento ficou para a T20
**Aceite:**
- [ ] Na Visão geral e no Planejamento só aparecem "volume do plano" e "aderência", cada um com definição de uma linha e a janela
- [ ] "Faltam X" mostra uma base por tela (capacidade, tarefas, 7 d, 30 d) com selo; "perto do plano" não convive com "faltam 2 h 30 min" sem explicação
- [ ] Teste: 83% × 87,5% × 71% × 86% reproduzidos com rótulo
**Dependências:** T1 · **Tamanho:** M (sobrepõe a Tarefa 44 arquivada)

### T6: Contagem de tópicos por disciplina (D12)
**Aceite:**
- [ ] Diagnóstico e Disciplinas mostram o mesmo total, ou o Diagnóstico explica o que exclui (D-E)
- [ ] Teste: LP 18/17, Tecnologia e IA 13/12, Matemática Financeira 14/12 resolvidos
**Dependências:** D-E · **Tamanho:** S

### T7: Formato numérico único (D13 restante)
**Aceite:**
- [ ] `1.750` em toda a UI (nunca `1750`); percentuais com uma casa decimal ou sem decimal por regra única, nunca `72,0%` falso nem `55%` ao lado de `45,3%`
- [ ] Teste de `format-number` e varredura (grep) por `toFixed(0)` e `Math.round(... * 100)` em telas
**Verificação:** unit; E2E `performance-numbers.spec.js` atualizado
**Nota de escopo:** as Tarefas 57 e 59 do plano arquivado já deram um formatador por grandeza e "uma prioridade só" **dentro da aba Desempenho**. Esta tarefa cobre o que escapou (legenda do gráfico de Questões, já corrigida em `c924e5f`) e as outras abas (Visão geral, Hoje, Questões); começar com um grep antes de reescrever.
**Dependências:** nenhuma · **Tamanho:** M

### T8: Metas e denominadores do dia; vazio sem padrões embutidos (D14)
**Aceite:**
- [ ] Sem plano/disponibilidade, Hoje não mostra "meta 2h30" nem "0 / 21 questões"; mostra estado vazio com um CTA
- [ ] Com dados, "Tempo estudado hoje" tem um denominador só (plano ou meta diária), com rótulo
**Dependências:** nenhuma · **Arquivos (provável):** `src/ui/tabs/today/*`, `src/application/daily-execution/*` · **Tamanho:** M

### T9: Saldo × "Resgatar" × "Replanejamento indisponível" (D15)
**Aceite:**
- [ ] "Resgatar em 30 min" só aparece quando o saldo justifica; "6 min" não oferece 30
- [ ] Fechamento semanal e Planejamento concordam sobre haver ou não capacidade para redistribuir
**Dependências:** nenhuma · **Arquivos (provável):** `src/ui/components/RealWeekBanner.tsx`, `src/ui/tabs/calendar/calendar-pending-lists.ts` · **Tamanho:** M

### T9b: Streak e conquista × histórico (D16, D18)
**Aceite:**
- [ ] A regra "sequência até ontem" está escrita junto de "7 dias em sequência"
- [ ] Conquista "Resultado após recomendação" e Histórico ("0 com resultado medido") usam a mesma janela ou dizem a diferença
**Dependências:** T10 (pode ser dado da demo) · **Tamanho:** S

### Checkpoint 1: números
- [ ] `npm test`, `check:types`, `build` verdes
- [ ] Nova passada na demo: nenhuma grandeza com dois valores sem selo de janela
- [ ] Revisão humana

---

## Fase 2: prioridade única

### T10: Investigar demo × produto (D2, D17, D-B)
**Descrição:** Reproduzir com fixture pequena e com a demo; classificar cada caso como dado da demo, defeito de cálculo, defeito de apresentação ou correto mal explicado.
**Aceite:**
- [ ] Tabela em `tasks/investigacao-divergencias.md` com os 4 casos: Classes de palavras (85%) como lacuna; "Iniciar revisão" em tópicos sem registro; Analytics × LP; Garantias bancárias como fila #1
- [ ] Plano de correção por caso
**Verificação:** reprodução por teste unitário antes de qualquer correção
**Dependências:** nenhuma · **Tamanho:** M

### T11: Fonte única de "prioridade" (D2)
**Nota de escopo:** as Tarefas 59, 62–64 arquivadas já reduziram as prioridades **dentro de Desempenho** (Próxima ação ao lado da fila, sem tópico nomeado em "O que mais pesa"). O que sobra é entre abas: Visão geral × Hoje × Desempenho × Fechamento.
**Aceite:**
- [ ] Visão geral, Hoje, Desempenho, Diagnóstico e Fechamento semanal consomem o mesmo objeto, conforme D-A
- [ ] Teste de contrato: mesma entrada, mesma resposta nas 5 telas
- [ ] "Foco da próxima semana" não recomenda tópico acima da meta (resultado de T10)
**Dependências:** D-A, D-B, T10 · **Tamanho:** L → dividir por tela se passar de 5 arquivos

### T12: Nomes fixos "Plano de hoje" × "Sugestão do diagnóstico"
**Aceite:**
- [ ] Os dois nomes aparecem iguais em todas as telas; "Próxima ação" segue D-A
- [ ] Testes e E2E que citam o texto antigo atualizados
**Dependências:** T11 · **Tamanho:** M

### Checkpoint 2: prioridade
- [ ] Mesma pergunta, mesma resposta nas 5 telas (verificado na demo)
- [ ] Revisão humana

---

## Fase 3: redundância

### T13: Pendências atrasadas num lugar (R1)
**Aceite:** card completo só em Hoje (D-G); Visão geral, Agenda e Questões mostram número com link; "9 pendências atrasadas" some da aba Questões. **Dependências:** D-G · **Tamanho:** M

### T14: Ciclo de Estudos num lugar só (R3)
**Aceite:** Hoje e Planejamento não repetem "39 h · prévia" e a lista de 4 disciplinas; um CTA ("Ativar ciclo recomendado" ou "Confirmar nova versão") conforme D-H; teste E2E do fluxo mantido. **Dependências:** D-H · **Tamanho:** M

### T15: Sugestão Analytics com uma explicação (R2)
**Aceite:** o "Por quê?" completo em um lugar; as demais telas mostram o nome e um link. **Dependências:** T12 · **Tamanho:** M

### T16: Bloco de tempo do dia sem repetição (R4)
**Aceite:** "Tempo flexível", "Livre" e "A realizar" não repetem o mesmo valor; "0%" aparece no máximo 2 vezes em Hoje. **Dependências:** T8 · **Tamanho:** S

### T17: Empty states com uma mensagem e um CTA (R5)
**Aceite:** Agenda vazia ≤ 2 mensagens; Desempenho vazio sem as duas frases quase idênticas de "pontos de atenção"; um CTA por página. **Dependências:** nenhuma · **Tamanho:** M

### T18: Rodapé, "Copiar link" e Instruções (R7, R8, R9)
**Aceite:** rodapé do vazio não ocupa metade da tela; "Copiar link" um por subaba; Instruções sem "Iniciante · 1 min" repetido; botões duplicados de Questões ("Registrar sessão" ×2) unificados. **Dependências:** nenhuma · **Tamanho:** M

### T19: "Resultados das provas" × "Questões & Simulados" (R10)
**Aceite:** a subaba "Resultados das provas" deixa de conter "Questões respondidas" duplicado, ou é renomeada; rotas antigas redirecionam. **Dependências:** D-C · **Tamanho:** M

### Checkpoint 3: redundância
- [ ] Altura das telas medida antes e depois; alternativas acessíveis mantidas; axe nos E2E
- [ ] Revisão humana

---

## Fase 4: vocabulário e primeira visita

### T20: Revisão × Tarefa de estudo; nomes de aba
**Aceite:** "Tarefa de estudo" para tarefas e "Revisão espaçada" para 24h/7d/30d (D-I) em Hoje, Agenda e filtros; "Planejamento" e "Questões & Simulados" iguais no desktop e na barra inferior; "pendência/atrasada/vencida/pendente" reduzidos a "atrasada". **Dependências:** D-I · **Tamanho:** M

### T21: Onboarding com entrada única (R6, V1–V4)
**Aceite:** modal ou cartão conforme D-J, nunca ambos; um só botão "Explorar demonstração" na primeira visita; contagem de passos igual (4) em modal, cartão e Planejamento; rodapé reduzido no vazio. **Dependências:** D-J · **Tamanho:** M

---

## Fase 5: demo e mobile

### T22: Demo menos sintética
**Aceite:** sessões com número de questões variado; semanas com execução diferente; datas das conquistas sem "antes de 20/11"; `docs/DEMO-SCENARIO.md` e os validadores continuam passando. **Verificação:** validador do blueprint, unit do gerador, demo reiniciada. **Dependências:** D-K, Fase 1, T10 · **Arquivos (provável):** `src/demo/demo-builders/*` · **Tamanho:** M

### T23: Cabeçalho mobile compacto — CANCELADA (D-K, 20/11: manter o cabeçalho)
**Aceite (não será feito):** a "Próxima ação" visível sem rolagem em 375×812; botões Dados/Preferências/Tema recolhidos; sem rolagem horizontal; alvos ≥ 44 px. **Verificação:** captura 375×812 e E2E mobile. **Dependências:** D-K · **Tamanho:** M

---

## Checkpoint final
- [ ] `npm test`, `npm run check:types`, `npm run build` verdes
- [ ] E2E afetados verdes
- [ ] `impeccable critique` com H4 ≥ 3 e H8 ≥ 3
- [ ] Nova passada de usuário analítico (vazio e demo): relatório novo sem P0/P1 de divergência
- [ ] Revisão humana
