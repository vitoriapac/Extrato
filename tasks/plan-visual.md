# Plano: Implementação visual do StudyTrack (5 fases)

Fonte: "StudyTrack — Plano de implementação visual" (31/10/2026, @Vitoria). Este arquivo confere o plano contra o código e o reorganiza em tarefas verificáveis. As tarefas detalhadas estão em `tasks/todo-visual.md`. O plano de onboarding (`tasks/plan.md`) continua aberto e não foi alterado.

## Visão geral

O plano é bom no essencial: regras globais claras (só tokens, nenhum emoji, cor nunca como único sinal, AA nos dois temas, 320 px), âmbar reservado para atenção, gráficos sem biblioteca e tabela preservada em "Ver dados". Ele precisa de ajustes antes de virar trabalho:
1. Uma decisão de marca que ele trata como atualização de documentação.
2. Dependências entre fases que contradizem a promessa de "cada fase reversível sem afetar as outras".
3. Premissas que não batem com o código.

## O que conferi no código

| Afirmação do plano | O que o código mostra | Consequência |
|---|---|---|
| "Só quatro tons estão fixos no app.css" | Os quatro tons citados aparecem 7 vezes (3× `rgba(11,37,69)`, 1× `rgba(7,24,44)`, 2× `rgba(232,185,74)`, 1× `rgba(212,160,23)`). Mas há também **18× `rgba(246,243,236)`** (o papel `#F6F3EC` usado como texto sobre o navy do cabeçalho), 1× `rgba(12,20,30)`, os 5 hex citados e 2× `#fff` | O texto claro sobre o cabeçalho precisa virar token. Se o cabeçalho deixar de ser navy, essas 18 ocorrências decidem o contraste do topo |
| "`theme-salvia.css` já validado nas capturas" | Recebido em 01/11/2026 (`tasks/theme-salvia.css`). Contraste AA nos 46 pares medidos, mas `--gold-bright` vira âmbar em 22 usos que não são atenção | Ver Checkpoint 0, itens 3 e 4 |
| "Medir o bundle com `npm run check:bundle`" | `check:bundle` é `build.mjs --check`: só confere se os bundles estão atualizados. Não mede tamanho | Falta um passo de medição. `app.bundle.js` tem hoje 1.325.924 bytes |
| 4.4 "anel de prontidão (Fase 3)" na primeira tela | O anel (`RingGauge`) só nasce na Fase 3, mas a 4.4 entra na Fase 1 | Dependência circular. A Fase 1 entrega a faixa com o número, e o anel entra na tarefa G1 |
| 4.1 tipografia "nas classes que forçam `--font-data`" | `var(--font-data)` aparece **198 vezes** em `styles/app.css` | Não é ajuste de token; é uma revisão classe a classe. Fica como tarefa própria |
| 4.6 "Barra inferior" | Já existe: `.primary-nav-shell` é fixa no rodapé abaixo de 760 px, com menu "Mais" (DESIGN.md › Navigation) | A tarefa é trocar itens e pôr ícones, não criar a barra |
| 4.9 Redistribuir revisões | Já existe um motor de recuperação com prévia, aplicação e reversão (`src/application/recovery/`) | Reaproveitar a prévia e o desfazer dele; conferir se cobre revisões |
| 4.8 Heatmap e sequência | O heatmap de constância e "N dias em sequência" já existem | A tarefa é reposicionar, não criar |
| 5.3.2 "faltam 4 de 5 fatores" | O texto "N de 5 fatores disponíveis" já existe (`build-executive-summary.ts:21`); sobrepõe a T6 do plano de onboarding | Juntar as duas numa tarefa só |
| 5.3.3 "último backup há N dias" | `lastBackupAt` registra o **backup automático diário dentro do próprio navegador** (`app-state-store.ts:112`), não uma exportação | Usar `lastBackupAt` diria "há 0 dias" a quem nunca exportou nada. Precisa de um campo novo (`lastExportAt`), com migração |
| 5.3.5 "como já acontece com report e help" | Os dois são bundles separados carregados por `<script>` e listados um a um no pré-cache do `service-worker.template.js` | Dividir o `app.bundle.js` exige gerar a lista de pedaços no pré-cache, senão o app quebra offline |
| 3.1 "criar em `src/ui/chart-components.ts`" | O arquivo tem 44 linhas que montam HTML em string. O AGENTS.md:13 exige componentes Preact `.tsx` e veda strings HTML em interfaces novas | Os primitivos de gráfico entram como `.tsx` em `src/ui/primitives/`. Os renderers antigos que ainda são string usam um adaptador |
| Regerar snapshots | Há 38 capturas `win32` (referência oficial, AGENTS.md:53) e 14 `linux` | Regerar as duas plataformas e inspecionar antes (AGENTS.md:53 proíbe atualizar só para esconder falha) |
| Fontes | O plano não cita a **Fraunces** (marca e valores do extrato, carregada no `index.html`) | Decidir se a Fraunces fica |
| ~70 ícones registrados, 22 arquivos usam | 79 ícones registrados; 22 arquivos usam `Icon`/`renderIconSvg`; 1 `<svg>` no `index.html`; `EmptyState` em 29 arquivos | Confere |

## Decisões que vêm antes do código (Checkpoint 0 — fechado em 01/11/2026; só o item 8 fica para o Checkpoint 4)

1. **Identidade — DECIDIDO (01/11/2026): continua o extrato.** O Sálvia é a mesma metáfora em outra paleta. Ficam: a "Creative North Star" do DESIGN.md ("O Extrato Bancário"), o cabeçalho de saldo, o mono nos números, datas e durações, e as linhas finas entre lançamentos (listas de sessões, questões, revisões). Mudam: as cores (navy → musgo, dourado → âmbar só como sinal) e o texto da paleta no DESIGN.md ("navy, dourado, papel" → os nomes do Sálvia). Consequências: na V3, "menos bordas" tira molduras de caixa, mas mantém as linhas finas de lançamento; na V4, o mono é a voz dos dados e não sai deles; na V6, o DESIGN.md mantém a North Star e reescreve só a paleta.
2. **Fraunces — DECIDIDO (01/11/2026): fica.** Continua como voz da marca e do saldo: título "StudyTrack", saldo da prontidão e valores dos KPIs no cabeçalho. As três vozes do DESIGN.md continuam: Fraunces para marca e valores, Plex Mono para dados, Plex Sans para leitura. A V4 só tira o mono de botões, abas e textos de apoio, sem tocar na Fraunces.
3. **`theme-salvia.css` — RECEBIDO (01/11/2026)**, em `tasks/theme-salvia.css` (referência para a V1; não é carregado pelo app). Conferido contra `styles/tokens.css`:
   - **Cobertura:** cobre todos os tokens de cor dos dois temas, menos um: no claro falta `--action-danger-hover-text`, que ficaria `#FFFDF9` (o papel quente antigo). A V1 define esse token.
   - **Contraste:** 46 pares medidos (texto, cabeçalho, botões, alertas, assistente, bordas, séries de gráfico), todos AA nos dois temas. Os mais justos ficam no limite de 3:1: `--chart-series-secondary` (`#D97706` sobre o card claro, 3,10:1) e `--wizard-focus` (3,10:1).
   - **Conflito com a regra do âmbar:** `--gold-bright` vira `#E9953F` (âmbar) **nos dois temas, não só no escuro**. Hoje ele aparece em 22 pontos de `styles/app.css` que não são sinal de atenção: valores dos KPIs (`.kpi-cell .n`), aba ativa (`.tab-btn.active`, `.more-tab-btn.active`), cabeçalho compacto, selo da demo, "voltar ao topo", pontos do gráfico de progresso e do radar, barra de progresso da prova, crédito do resultado da sessão. Com o arquivo como está, o âmbar vira cor de destaque da marca, e a regra "âmbar só em dado abaixo da meta, atrasado ou na prontidão" deixa de valer. O ponto de decisão do plano cita só 3 lugares, e só no escuro.
   - **Foco em duas cores:** o app usa `--gold` no anel de foco (musgo no Sálvia), mas o assistente usa `--wizard-focus` (âmbar). São dois focos diferentes no mesmo app.
4. **Destaque sobre o cabeçalho — DECIDIDO (01/11/2026): separar o `--gold-bright`.** Cada um dos 22 usos vai para um de três destinos, conforme o fundo e o papel do elemento:
   - **Sobre o cabeçalho** (valores dos KPIs, eyebrow, aba ativa, cabeçalho compacto, selo da demo): token novo `--brand-on-header` = `#A8D3B8` nos dois temas (6,97:1 sobre o musgo claro, 11,28:1 sobre o cabeçalho escuro).
   - **Sobre papel ou card** (voltar ao topo, pontos dos gráficos, barra de progresso da prova, crédito do resultado da sessão, instruções): `--gold` (musgo `#2F5D4E` no claro, 6,91:1; `#8CC5A2` no escuro, 8,97:1). O `#A8D3B8` não serve aqui: dá 1,53:1 sobre o papel claro.
   - **Sinal de atenção:** continua no âmbar (`--gold-bright` = `#E9953F`, a renomear para `--attention` no PR de renome).
   Isso antecipa o renome só para este token. A decisão 5 (âmbar fora da navegação) fica coberta nos dois temas.
5. **Âmbar fora da navegação — DECIDIDO (01/11/2026)**, nos dois temas, pela separação do item 4.
6. **Gráficos acima da tabela, com "Ver dados" — DECIDIDO (01/11/2026).**
7. **Abas no celular — DECIDIDO (01/11/2026):** ícone com texto até 375 px e só ícone (com `aria-label`) abaixo disso.
8. **Modo Essencial ligado por padrão** (ponto de decisão da Fase 5): adiar até depois da Fase 4. Com a Visão Geral encurtada, o problema pode encolher.

## Ajustes à estrutura do plano

- **A Fase 1 vira um PR com vários commits, um por tarefa**, e os snapshots são regerados uma vez, no fim. Isso mantém a ideia do plano (não regerar duas vezes) sem um diff que ninguém consegue revisar. A primeira tela (4.4) sai da Fase 1, porque é layout e depende do anel; vai para logo depois da G1.
- **As fases não são independentes.** O grafo real:

```
Checkpoint 0 (decisões)
  └─ Fase 1 (tokens, marca, raio, tipografia, botões)
       ├─ Fase 2 (ícones) ──┬─ 4.6 navegação no celular
       │                    └─ 4.8 sequência com ícone flame
       └─ Fase 3: G1 base + anel ──┬─ 4.4 primeira tela
                                   └─ demais gráficos ── 4.7 cor por disciplina recolore os gráficos
  4.9 redistribuição ─ depende do motor de recuperação (já existe)
  5.3.3 lembrete de backup ─ migração de schema (campo novo)
  4.7 cor por disciplina ─ migração de schema (subject.color)
  5.3.5 carregamento por aba ─ service worker e pré-cache (mais arriscado; por último)
```

- **4.7 (cor por disciplina) e 5.3.3 (backup) mexem no schema persistido.** Pelo AGENTS.md, isso exige testes de migração e de backup e o `npm run test:full`. Não são "visuais"; cada uma vira PR próprio.
- **Fase 3, prioridades média e baixa**: listadas como backlog e planejadas depois do Checkpoint 3, com o uso real dos 5 primeiros.
- **Fase 5** são três grupos independentes (layout, fluxos, confiança). Cada item vira tarefa própria, e o 5.3.5 vai por último.

## Lista de tarefas (índice; detalhes em `tasks/todo-visual.md`)

### Checkpoint 0 — Decisões (sem código) — fechado em 01/11/2026

### Fase 1 — Fundação visual (1 PR, commits por tarefa)
- [x] V1: Tokens Sálvia nos dois temas + cores fixas do app.css + `--chart-series-*`
- [ ] V2: Marca fora do CSS (theme-color, manifest, favicon, `icons/`)
- [ ] V3: Raio e respiro (`--radius-card`, `--radius-control`, sem caixa dentro de caixa)
- [ ] V4: Tipografia (mono só em dados; corpo 15–16 px no celular)
- [ ] V5: Botões em três níveis (variante `tonal` + terciário)
- [ ] V6: DESIGN.md/DESIGN-SYSTEM.md + snapshots regerados (win32 e linux)

### Checkpoint 1

### Fase 2 — Ícones
- [ ] I1: Ícones novos no gerador + script de medição do bundle
- [ ] I2: Props de ícone nos primitivos (Badge, EmptyState, MetricCard, Button)
- [ ] I3: Abas e barra inferior com ícones
- [ ] I4: Cronômetro, tipo de sessão, avaliação da revisão e botões de criar
- [ ] I5: Importar/exportar, nuvem, filtros, demo e alertas

### Checkpoint 2

### Fase 3A — Gráficos de prioridade alta
- [ ] G1: Primitivos de gráfico em `.tsx` + anel e sparkline da prontidão
- [ ] G2: Primeira tela orientada à ação (o 4.4 do plano)
- [ ] G3: Anel planejado × realizado em Hoje
- [ ] G4: Acerto por disciplina com marca de meta
- [ ] G5: Carga diária da Agenda de Revisões (30 dias)
- [ ] G6: Barra empilhada de status nos blocos de disciplina

### Checkpoint 3 (decidir quais gráficos de média e baixa prioridade entram)

### Fase 4 — Conforto
- [ ] C1: Cronômetro sai da Visão Geral (botão flutuante ou aba Hoje)
- [ ] C2: Conquistas e progresso por disciplina vão para Desempenho
- [ ] C3: Seções recolhíveis com estado lembrado
- [ ] C4: Barra inferior com Início, Hoje, Matérias, Agenda e Mais; aviso "Salvo" acima dela; demo em uma linha
- [ ] C5: Cor por disciplina (schema + migração + UI)
- [ ] C6: Motivação (constância no topo de Hoje, sequência com ícone, animação da meta)
- [ ] C7: Redistribuir revisões atrasadas (reaproveita o motor de recuperação)
- [ ] C8: Atalhos do PWA no manifest
- [ ] C9: Transições e preferência de densidade

### Checkpoint 4

### Fase 5 — Fluxos, clareza e confiança
- [ ] F1: Planejamento em sub-abas
- [ ] F2: Componente de aviso compacto
- [ ] F3: Busca no celular vira ícone com paleta de comandos
- [ ] F4: Registrar questões em poucos toques
- [ ] F5: Resultado da sessão ao salvar
- [ ] F6: Desfazer no lugar de confirmar (ações reversíveis)
- [ ] F7: Lembrete de backup exportado (`lastExportAt` + migração)
- [ ] F8: Fatores da prontidão como ações (junta com a T6 do onboarding)
- [ ] F9: Navegação lateral acima de 1280 px
- [ ] F10: Modo Essencial (depois de decidir o padrão)
- [ ] F11: Carregamento por aba com pré-cache gerado

### Checkpoint 5

Fora do escopo agora (precisam de decisão própria): cronômetro na notificação do sistema (4.10.2, pede permissão), Pomodoro e Wake Lock (5.2.4), reordenar arrastando (5.2.5), ícone por disciplina (2.2), conquistas com níveis (4.8.3) e os 11 gráficos de prioridade média e baixa.

## Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| A troca de marca é decidida implicitamente, e o DESIGN.md fica descrevendo outro produto | Alto | Checkpoint 0 antes de qualquer token |
| Cabeçalho deixa de ser navy e o texto claro (18× `rgba(246,243,236)`) perde contraste | Alto | V1 tokeniza essas 18 ocorrências e roda o axe nos dois temas |
| Diff visual grande demais para revisar | Alto | Commits por tarefa; snapshots regerados só na V6, com inspeção das imagens |
| Tipografia: 198 usos de mono; algum número perde o mono ou algum rótulo perde a caixa | Médio | V4 com a lista do que fica em mono e um teste que confere a fonte de números-chave |
| Testes E2E medem caixas e alturas (44 px, overflow); raio, fonte e layout mudam as medidas | Médio | Rodar a suíte E2E completa no fim de cada fase, não só os specs afetados |
| Bundle cresce com ícones e gráficos | Médio | I1 cria a medição; cada PR registra o antes e o depois |
| Migrações (cor por disciplina, `lastExportAt`) | Alto | PR próprio, teste de migração e de backup antigo, `npm run test:full` |
| Pedaços do bundle fora do pré-cache quebram o uso offline | Alto | F11 por último, com teste offline no Playwright |
| Gráficos competem com a próxima ação | Médio | Regra do plano: gráfico novo nunca acima da próxima ação; conferir em 375 px |
| Tour guiado e E2E dependem de seletores que mudam (Visão Geral, abas) | Médio | C1–C4 e F1 atualizam o tour (`ESSENTIAL_TOUR_STEPS`) e os specs no mesmo commit |

## Perguntas em aberto

1. ~~As decisões 1 a 3 do Checkpoint 0~~ Resolvidas em 01/11/2026 (continua o extrato, Fraunces fica, tema recebido e `--gold-bright` separado).
2. As estimativas (21 a 31 dias somadas) têm base em alguma medição ou são palpite? Elas não entram nos critérios de aceite.
3. O "Planejamento com 27.000 px no celular" e o "11 telas de rolagem" foram medidos em qual estado: na demo ou num usuário real? Isso define a meta da C1–C3 e da F1.
