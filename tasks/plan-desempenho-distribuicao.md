# Plano: redistribuir o conteúdo de Desempenho para subir a nota (meta 32/40)

Origem: `tasks/analise-desempenho-distribuicao.md` (8 rodadas de crítica, 26 a 27 de 40) e as respostas do dia 10/11/2026.

## Decisões já tomadas

1. **Mover** Matriz Pedagógica, Balanço, Radar de Vulnerabilidades e Queda de retenção de "Por disciplina" para "Diagnóstico".
2. **Vocabulário oficial dos selos de janela:** "7 dias", "período", "semana atual", "histórico".
3. **Preservar o estado aberto das dobras** em Desempenho agora, e só depois recolher a aderência.
4. **Celular:** "O que fazer" sobe logo abaixo da Prontidão (número, barra e tendência); os números de apoio ficam depois.
5. Já decididas antes: uma única ação sólida ("Abrir em Hoje"), aderência visível até a dobra existir, CSV adiado.

## Meta e como medir

| Heurística | Hoje | Meta | O que prova |
|---|---|---|---|
| 4. Consistência | 2 | 3 | Nenhum percentual de aderência, simulado ou turno sem selo de janela |
| 6. Memória | 2 | 3 | O aluno nunca precisa lembrar a janela de outro bloco |
| 8. Minimalismo | 2 | 3 | Orçamentos de altura e de blocos abertos cumpridos (tabela abaixo) |
| 1. Visibilidade do estado | 3 | 4 | Selo de evidência no cabeçalho dos blocos analíticos |
| 10. Ajuda | 3 | 4 | Termos técnicos com definição no ponto de uso |

| Subaba | Altura hoje | Orçamento | Blocos abertos |
|---|---|---|---|
| Visão geral | 1.969 px | até 1.600 px | 4 |
| Por disciplina | 5.079 px | até 2.500 px | 4 |
| Diagnóstico | 2.093 px | até 3.200 px (recebe 4 blocos) | 6 |
| Ritmo e aderência | 3.702 px | até 2.600 px | 5 |
| Inteligência da prova | 2.957 px | até 2.500 px | 1 resumo + lista |

Honestidade sobre a meta: a nota vem de uma revisão por modelo e variou ±1 sem mudar conteúdo. O critério de sucesso é cumprir os orçamentos e as regras de selo; a nota é o termômetro.

## Grafo de dependências

```
F1 estado das dobras ───────────────┐
F2 selos de janela (componente) ─┬─ F3 aplicar selos ──────────┐
                                  │                             ├─ F9 crítica final
F4 mover blocos para Diagnóstico ─┤                             │
F5 fundir blocos de turno ────────┤                             │
F6 recolher aderência (após F1) ──┘                             │
F7 selo de evidência + F8 definições no ponto de uso ───────────┤
F10 celular: ação sobe ──────────────────────────────────────────┘
F11 Inteligência da prova (filtros recolhidos), independente
```

## Fase A: fundamentos

### F1. Preservar o estado aberto das dobras
- **O que:** antes de `target.innerHTML = renderPerformancePage(...)` em `performance-tab-controller.ts`, guardar quais `details` de `#performanceSectionContent` estão abertos (chave = seção + texto do `summary`); depois do redesenho, reabrir os mesmos. O `hydrateLazy` já reage ao evento `toggle`.
- **Por que primeiro:** foi o que impediu recolher a aderência (o seletor de semanas perdia o foco quando a dobra fechava).
- **Aceite:** E2E novo: abrir uma dobra, trocar o período, a dobra continua aberta; o foco do seletor de semanas se mantém. Nenhuma dobra reabre sozinha ao trocar de subaba.
- **Risco:** dobras com mesmo texto em seções diferentes (a chave inclui a seção); dobras com conteúdo `<template data-lazy>` (reabrir dispara a hidratação).

### F2. Componente de selo de janela
- **O que:** `renderWindowBadge(kind, { title })` em `src/ui/performance/window-badge.ts`, com os quatro tipos oficiais. Substituir os `<span class="performance-window">` espalhados (leitura, síntese de Consistência, meta de aderência, `ShiftEnergyCard`). O `title` carrega o rótulo real ("Últimos 30 dias").
- **Aceite:** teste unitário do componente; nenhum `performance-window` escrito à mão fora dele (grep).

## Fase B: aplicar os selos

### F3. Selo em todo número de aderência, simulado, turno e Prontidão
- **Onde (inventário):**
  - Execução do plano (4 KPIs: aderência ao plano, execução prioritária, carga planejada, tempo realizado): "período".
  - Meta de aderência e "O que mudou?": "semana atual".
  - Período atual × anterior (volume de carga): "período".
  - Leitura: Prontidão "agora" e "fechamento", projeção "simulados", ritmo "7 dias" (parte já feita).
  - Simulados (81% no resumo, 83,8% no card de simulados): definir a janela real de cada um (últimos simulados comparáveis ou período) antes de rotular.
  - Foco profundo por turno: "período"; Eficiência por turno: "histórico".
- **Aceite:** teste que percorre o HTML de cada seção e falha se um `%` de aderência, simulado ou turno aparecer sem selo no mesmo elemento ou no cabeçalho do bloco.
- **Risco:** E2E com goldens de aderência (5 tamanhos) mudam; atualizar só os specs afetados.

## Fase C: reestruturação

### F4. Mover Matriz, Balanço, Radar e Queda de retenção para Diagnóstico
- **O que:**
  - Matriz: hoje sai de `renderPerformanceSubjects` (`matrixSection`); construir o `pedagogicalMatrix` também no ramo `diagnosis` do page model e renderizar em `render-performance-section.ts`.
  - Balanço, Radar e Queda: são nós do painel de Início anexados em `#performanceSubjectsSupplementalMount` (`decisionDetails`, `gapsDetails`); passar a anexá-los em `#performanceDiagnosisMount` (ou um mount novo na seção `diagnosis`).
  - Âncoras `#desempenho/diagnosis/<bloco>` para os quatro; manter `#desempenho/subjects/...` apenas para Comparação e Mapa.
- **Aceite:** "Por disciplina" com 4 blocos e até 2.500 px; "Diagnóstico" com os quatro blocos movidos; E2E `stability-phase-comparison`, `visual-density`, `performance-tablist`, `strategic-cycle`, `recent-flows` e `study-action-cycle` atualizados.
- **Risco:** o Diagnóstico passa a ser a subaba mais pesada (limite 3.200 px); os blocos movidos ficam em dobras fechadas se estourar.

### F5. Fundir "Eficiência & Energia por Turno" e "Foco profundo por turno"
- **O que:** um bloco "Turno de estudo" com duas linhas por turno, cada uma com o selo ("histórico" e "período"), no lugar dos dois blocos em Ritmo e aderência.
- **Aceite:** um `h3` só; os dois números por turno lado a lado, cada um com selo; testes de `ShiftEnergyCard` e `focus-shift` atualizados.

### F6. Recolher a aderência em "Como o plano foi cumprido" (depende de F1)
- **O que:** a análise de aderência (Execução do plano, O que mudou?, tendência, por disciplina) vai para uma dobra; a síntese de Consistência continua aberta com o número principal e o déficit.
- **Aceite:** orçamento de 2.600 px e 5 blocos abertos em Ritmo e aderência; E2E de aderência abre a dobra e o seletor de semanas mantém o foco.

### F11. Inteligência da prova: filtros recolhidos
- **O que:** cinco filtros e "Mais filtros" viram uma linha de resumo ("Concurso, disciplina, ordenação") com "Alterar filtros", como nos filtros do celular; abrir mostra os controles. Resumo e divergências priorizadas aparecem primeiro.
- **Aceite:** altura até 2.500 px; E2E `exam-intelligence-readonly` e os de importação ajustados para abrir os filtros.

## Fase D: estado e definição

### F7. Selo de evidência no cabeçalho dos blocos analíticos
- **O que:** `renderEvidenceBadge(state)` com três estados já calculados no produto: "amostra pequena" (menos de 30 questões), "confiança baixa", "sem dados suficientes". Aplicar em Resumo do período, Comparação, Mapa de estabilidade, Matriz, Radar, Evolução da precisão, Simulados e Inteligência da prova.
- **Aceite:** teste por bloco; o selo reutiliza os limiares existentes (nenhum critério novo); cabeçalho com no máximo um selo de evidência e um de janela.

### F8. Definições no ponto de uso
- **O que:** helper `renderTerm(term)` que escreve o termo com explicação curta ao lado ou em `abbr[title]` acessível: Prontidão, Domínio, Retenção, Incidência, crédito ao plano. O glossário fechado continua como complemento e ganha o link para a Ajuda (já feito).
- **Aceite:** os cinco termos aparecem com definição na primeira ocorrência de cada subaba; teste de nome acessível; as definições de Domínio e Retenção revisadas por você (são minhas).

## Fase E: celular

### F10. "O que fazer" logo abaixo da Prontidão
- **O que:** dividir "Como estou" em duas partes: **principal** (número, barra e tendência) e **apoio** (fechamento, faixa e ritmo). No celular a ordem fica: principal, "O que fazer", "O que mais pesa", apoio; no desktop continuam as três colunas com o apoio dentro da primeira.
- **Aceite:** em 375×812 o botão "Abrir em Hoje" fica no máximo em y=900 (hoje 1.166); sem rolagem lateral; E2E novo mede a posição.

## Fase F: verificação

### F9. Crítica final
- Rodar a crítica com as duas avaliações isoladas, medir os orçamentos de altura e de blocos, e conferir F3 por teste. Meta de 32. Se ficar em 29 ou 30, listar o que a revisão ainda aponta antes de decidir a próxima rodada.

## Ordem sugerida e commits

1. F1, F2 (fundamentos): um commit.
2. F3 (selos): um commit, com goldens de aderência.
3. F4 (mover blocos): um commit, o de maior risco para os E2E.
4. F5, F6, F11: um commit por tarefa.
5. F7, F8: um commit.
6. F10: um commit.
7. F9 e atualização do `DESIGN.md` com faixa de leitura, selos e âncoras (precisa da sua aprovação: o arquivo tem mudanças suas ainda não commitadas).

## Riscos gerais
- Os goldens (aderência em 5 tamanhos, resumo em desktop e celular, projeção) mudam em quase toda tarefa; atualizar só dos specs afetados e conferir na tela.
- Mover blocos muda rotas e âncoras: preservar redirecionamento de `#desempenho/subjects/...` antigos para o novo destino, para não quebrar links já copiados.
- Dados fictícios da demo explicam parte do que a revisão critica (semana atual com 0% de crédito); confirmar com dados reais antes de tratar como defeito de produto.

## Perguntas ainda abertas
Nenhuma bloqueia a Fase A. Duas para depois: (a) rótulo definitivo da subaba "Diagnóstico" depois de receber os quatro blocos ("Diagnóstico" ou "Lacunas"); (b) janela real do número de simulados da Visão geral antes de rotulá-lo (F3).

## Andamento (10/11/2026)
- Fase A (F1, F2) e Fase B (F3) implementadas, sem commit. F1: dobras lembram o estado ao redesenhar (chave = seção + título do resumo), com E2E. F2: `window-badge.tsx` com os quatro nomes oficiais. F3: selos em leitura (simulados "histórico", ritmo "7 dias"), resumo do período (simulados "histórico"), síntese e foco por turno ("período"), Execução do plano ("período"), O que mudou? e meta de aderência ("semana atual"), Período atual × anterior ("período") e Eficiência por turno ("histórico").
- Desvios: a Prontidão ficou sem selo (a frase já traz as datas do fechamento); o teste de "nenhum percentual sem selo" cobre os renderers alterados, não a página inteira; Simulados (KPIs) mantém a janela por extenso ("no período").
- Efeito do F1 nos testes: tests que alternavam a dobra "Prontidão, trajetória e carga" na mesma página passaram a abri-la só se estiver fechada (`openPerformanceFold`).

## Andamento: Fase C (10/11/2026, sem commit)
- Fases A e B commitadas (`0e6144c`).
- **F4:** Matriz foi para Diagnóstico (novo `performance-matrix-renderer.ts`, modelo montado também no ramo `diagnosis`); Balanço, Radar e Queda de retenção (nós `performanceDecisionDetails` e `desempenho-gaps`) passam a ser exibidos só em Diagnóstico (`#performanceDiagnosisGapsMount`; regra de CSS invertida); a dobra de Balanço/Radar/Queda nasce fechada. O atalho "Ver Desempenho" do Início agora abre `#desempenho/diagnosis`. Âncora `bloco-matriz`.
- **F5:** versão reduzida: um título "Turno de estudo" sobre os dois blocos, que viraram `h4` ("Rendimento por turno" com selo "histórico" e "Foco profundo por turno" com selo "período"). Não fundi os dois blocos em um só.
- **F6:** a análise de aderência está na dobra "Como o plano foi cumprido: aderência, execução prioritária e crédito semanal" (fechada); a síntese continua aberta. Funciona porque a F1 preserva o estado.
- **F11:** os filtros de Inteligência da prova ficam na dobra "Filtros e busca (N ativos)", fechada; o estado é preservado também quando a matriz se redesenha.
- **Alturas medidas (desktop, demo) contra os orçamentos:** Visão geral 1.992 px (orçamento 1.600, não atingido); Por disciplina 2.859 px (de 5.079; orçamento 2.500); Diagnóstico 3.443 px (orçamento 3.200); Ritmo e aderência 2.626 px (orçamento 2.600, 4 blocos); Inteligência da prova 2.831 px (de 2.957; orçamento 2.500).

## Andamento: Fases D e E (10/11/2026)
- Fase C commitada (`474c06b`).
- **F7:** `evidence-badge.ts` (amostra pequena, confiança baixa, sem dados suficientes) no cabeçalho de Resumo do período, Comparação entre disciplinas, Mapa de estabilidade e Simulados. Matriz e Radar ficaram sem selo: não há sinal de amostra nesses modelos.
- **F8:** definições no ponto de uso na leitura ("Índice de 0 a 100 que combina cobertura, domínio, retenção, consistência e simulados"; "domínio 38 (desempenho no tópico, de 0 a 100)"). Os termos Retenção, Incidência e crédito ao plano já tinham definição na própria frase dos blocos; não criei o helper `renderTerm`.
- **F10:** a leitura foi dividida em número principal e números de apoio; no celular a ordem é Prontidão, "O que fazer", "O que mais pesa" e apoio; "Abrir em Hoje" ficou em y=807 (era 1.166), com os botões antes da nota do plano.
- **Documentação:** `docs/PERFORMANCE-INVENTORY.md`, `docs/INFORMATION-OWNERSHIP.md`, `docs/MICROCOPY-CONTRACT.md`, `README.md` e `docs/PLANOS-CONCLUIDOS.md` atualizados; `DESIGN.md` editado e não commitado (já tinha mudanças pendentes).
- Falta: F9 (crítica final) e os orçamentos de altura da Visão geral, Diagnóstico e Inteligência da prova.
