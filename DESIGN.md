---
name: Extrato de Estudos — Cada estudo soma
description: O estudo lido como um extrato de conta — musgo, sálvia, papel e linhas finas.
colors:
  brand: "#1E3F35"
  brand-secondary: "#2F5D4E"
  accent: "#2F5D4E"
  attention: "#E9953F"
  secondary: "#E9953F"
  secondary-strong: "#D9701A"
  secondary-text: "#A8480A"
  secondary-bg: "#FBEBDA"
  secondary-hover: "#F2A862"
  on-secondary: "#2A1704"
  brand-on-header: "#A8D3B8"
  paper: "#F4F6F4"
  paper-line: "#D5DDD6"
  white: "#FBFCFA"
  slate-bg: "#E6EDE6"
  ink: "#17302A"
  ink-soft: "#4F6158"
  on-brand: "#F4F6F4"
  green: "#2F6B4F"
  green-bg: "#E2EEE6"
  amber: "#9A4F0E"
  amber-bg: "#F7E9D9"
  red: "#A23B2A"
  red-bg: "#F5E3DE"
  info-bg: "#E3ECE7"
  highlight-bg: "#FBF1E4"
  tab-hover-bg: "#DDE6DE"
  heat-1: "#CFE0D3"
  border-control: "#6F857A"
  subject-1: "#3E7A5E"
  subject-2: "#2F6690"
  subject-3: "#4B4FA3"
  subject-4: "#7350A0"
  subject-5: "#1F7570"
  subject-6: "#6B7330"
  subject-7: "#5A6878"
  subject-8: "#8A4570"
typography:
  page-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 600
  value:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "24px"
    fontWeight: 600
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, Segoe UI, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.08em"
  action:
    fontFamily: "IBM Plex Sans, Segoe UI, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
  data:
    fontFamily: "IBM Plex Mono, Consolas, Courier New, monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  card: "8px"
  control: "6px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
  space-10: "40px"
  space-12: "48px"
  space-14: "56px"
  space-16: "64px"
  inline: "8px"
  stack: "16px"
  card: "16px"
  panel: "24px"
  action: "12px"
  content-action: "24px"
  block: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.brand-secondary}"
  button-tonal:
    backgroundColor: "{colors.green-bg}"
    textColor: "{colors.brand}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-tonal-hover:
    backgroundColor: "{colors.heat-1}"
  button-tertiary:
    textColor: "{colors.brand}"
    typography: "{typography.action}"
    padding: "8px 4px"
  button-ghost:
    textColor: "{colors.brand}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
  button-danger:
    textColor: "{colors.red}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-danger-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  tab:
    backgroundColor: "{colors.slate-bg}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.action}"
    padding: "8px 16px"
  tab-hover:
    backgroundColor: "{colors.tab-hover-bg}"
  tab-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-on-header}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  kpi-cell:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-on-header}"
    typography: "{typography.value}"
    padding: "16px"
  select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "4px 32px 4px 12px"
    height: "36px"
  status-badge-success:
    backgroundColor: "{colors.green-bg}"
    textColor: "{colors.green}"
    padding: "4px 8px"
  status-badge-warning:
    backgroundColor: "{colors.amber-bg}"
    textColor: "{colors.amber}"
    padding: "4px 8px"
  status-badge-danger:
    backgroundColor: "{colors.red-bg}"
    textColor: "{colors.red}"
    padding: "4px 8px"
  status-badge-info:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.brand-secondary}"
    padding: "4px 8px"
  status-badge-insufficient:
    backgroundColor: "{colors.slate-bg}"
    textColor: "{colors.ink-soft}"
    padding: "4px 8px"
---

# Design System: Extrato de Estudos — Cada estudo soma

## Overview

**Creative North Star: "O Extrato Bancário"**

O Extrato de Estudos apresenta o estudo como um extrato de conta: um cabeçalho verde-musgo com o saldo em serifa âmbar, lançamentos em papel separados por linhas finas, números e datas em mono como colunas de um documento financeiro. A prontidão é o saldo; cada sessão, questão e revisão é um lançamento. A confiança vem da mesma fonte que a de um extrato: números precisos, registro que não se reescreve, nenhuma decoração competindo com o dado.

A densidade é de ferramenta de uso diário e prolongado. Cards agrupam; dentro deles, hierarquia vem de linha, espaço e tipografia, não de mais caixas. Componentes são precisos e contidos: cantos discretos (8px nos cards, 6px nos controles), mono só para números, datas e códigos, cor reservada para significado. A interface é plana por padrão; sombra existe apenas onde algo realmente flutua sobre a página.

Os dois temas (claro "papel" e escuro "noite musgo", paleta Sálvia) são o mesmo sistema com valores trocados nos tokens; nenhum componente define cor literal.

**Key Characteristics:**
- Musgo estrutural, sálvia de destaque, âmbar só para atenção, papel como superfície.
- Três vozes tipográficas: Fraunces para marca e valores, IBM Plex Mono para números, datas, durações e códigos, IBM Plex Sans para leitura, rótulos e ações.
- Cantos de 8px (cards) e 6px (controles), bordas de 1px, faixas laterais/superiores de 3px como marcadores semânticos.
- Plano por padrão; sombra só em sobreposições.
- Estado sempre textual; cor nunca é o único indicador.

## Colors

Paleta Sálvia: um verde-musgo profundo e um sálvia claro sobre papel frio, com âmbar reservado para atenção e semânticos dessaturados que não gritam em uso diário. Os tokens têm nomes de papel, não de cor: `brand` (antes `navy`), `on-brand` (`on-navy`), `brand-secondary` (`blue`), `accent` (`gold`) e `attention` (`gold-bright`).

### Primary
- **Musgo de Extrato** (`brand`, `#1E3F35`): estrutura e autoridade — cabeçalho do extrato, botão primário, aba ativa, células de KPI, card primário. Também é a cor dos títulos (`--heading`).
- **Sálvia Tinta** (`brand-secondary`, `#2F5D4E`): hover do botão primário, série principal de gráficos, estado informativo.

### Secondary
- **Sálvia Escuro** (`accent`, `#2F5D4E`): borda de ênfase, faixa de `card--action`, anel de foco, pontos de gráfico.
- **Sálvia Claro** (`brand-on-header`, `#A8D3B8`): só sobre musgo — eyebrow do extrato, aba ativa, valores do KPI, seleção, toast.
- **Laranja Destaque** (`secondary`, `#E9953F`; no escuro igual): a cor de destaque editorial, a segunda voz da marca depois do musgo. Marca o que o olhar deve achar primeiro. Seus papéis:
  - `secondary` (`#E9953F`): preenchimentos e faixas — botão de ação principal do "Agora" (texto `on-secondary`, 7,2:1), faixa de 3px no topo das células de KPI, sublinhado da aba ativa, eyebrow do cabeçalho (4,9:1 sobre musgo). Hover: `secondary-hover`.
  - `secondary-strong` (`#D9701A` claro, `#F0A55A` escuro): gráficos e linhas sobre papel (3,3:1) — barra de progresso (`.ui-progress`), série secundária dos gráficos, barra de título de seção, faixa das células de estatística e `.card--secondary`. O card "Agora" não tem mais faixa laranja de 3px no topo.
  - `secondary-text` (`#A8480A` claro, `#F0A55A` escuro): texto laranja pontual sobre papel ou `secondary-bg` (5,7:1 e 5,0:1). Eyebrows e títulos de seção sobre papel não usam laranja: ficam em `ink-soft`.
  - `secondary-bg` (`#FBEBDA` claro, `#2E2112` escuro): fundo de selo `.status-badge--highlight`.
  Componentes: `.btn.secondary`, `.card--secondary`, `.status-badge--highlight`.
  Presença contínua (sempre em `secondary-text`/`secondary-strong`, nunca em texto longo; eyebrows e rótulos de meta sobre papel ficam em `ink-soft`): barra antes dos títulos de card e de seção, preenchimento das barras de progresso (metas, plano, diagnóstico, foco semanal, conquistas, cronômetro), semana atual no gráfico de ritmo, cabeçalho de tabela (`2px`), sublinhado das sub-abas ativas e sublinhado dos botões terciários.
- **Âmbar Saldo** (`attention`, `#E9953F`): continua o tom do saldo da prontidão, da contagem regressiva e da barra até a prova, mas agora é só um alias semântico de estado.

### Tertiary (semânticos)
- **Verde Conta** (`green` sobre `green-bg`): positivo, meta atingida.
- **Âmbar Aviso** (`amber` sobre `amber-bg`): atenção, revisão pendente.
- **Vermelho Débito** (`red` sobre `red-bg`): risco, perda, ação destrutiva.
- **Informe** (`info-bg`): fundo de badge informativo.

### Neutral
- **Papel** (`paper`): fundo da página e de campos.
- **Papel Branco** (`white`): superfície de cards; um branco levemente esverdeado, nunca `#FFF` puro.
- **Ardósia Sálvia** (`slate-bg`): superfícies recolhidas, abas inativas, trilhas de barra, evidência insuficiente.
- **Linha de Papel** (`paper-line`): toda borda e divisor de 1px.
- **Tinta** (`ink`) e **Tinta Suave** (`ink-soft`): texto principal e secundário.
- **Destaque** (`highlight-bg`): fundo de `card--attention`.

Tema escuro (`[data-theme="dark"]`, `styles/tokens.css`): musgo `#0C1411`, papel `#111A17`, card `#16211D`, tinta `#E3EAE4`, sálvia `#8CC5A2`, título `#EEF3EE`, semânticos clareados (verde `#6FBF93`, âmbar `#E9953F`, vermelho `#E58A78`). Componentes usam apenas os aliases de papel (`--surface-*`, `--text-*`, `--status-*`, `--border-*`, `--action-*`). Séries de gráfico: `--chart-series-primary` (sálvia), `--chart-series-secondary` (`secondary-strong`, laranja), `--chart-series-target` (tinta suave).

Ação primária (`--action-primary-bg` / `--action-primary-text` / `--action-primary-hover`): musgo com texto papel no claro; no escuro, sálvia claro `#A8D3B8` com texto `#0C1411` (hover `#C2E3CD`), porque um botão musgo some sobre card musgo. Ação tonal (`--action-tonal-*`): `green-bg` com texto título no claro (9,7:1), `#2A4636` com `#A8D3B8` no escuro (6,3:1). Contorno de `.btn.ghost`: `--action-outline` (título no claro, `ink-soft` no escuro). Backdrop de modais: `--backdrop` (musgo a 65%).

### Cor por disciplina
Cada disciplina guarda um slot de 1 a 8 (`subject.color`, schema 29); o tema mapeia o slot para `--subject-1…8`:

| Tema | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Claro | `#3E7A5E` | `#2F6690` | `#4B4FA3` | `#7350A0` | `#1F7570` | `#6B7330` | `#5A6878` | `#8A4570` |
| Escuro | `#7CC4A0` | `#7DB3E0` | `#9EA2F0` | `#C0A0E8` | `#6CCBC3` | `#C2C67A` | `#A9B6C6` | `#DE9CC4` |

O contraste contra a página vai de 4,7:1 a 6,6:1 no claro e de 6,9:1 a 9,8:1 no escuro. A cor aparece numa amostra antes do nome e na borda do bloco, sempre com o nome escrito e com o nome da cor no seletor.

### Named Rules
**A Regra da Disciplina sem Alarme.** A paleta das disciplinas não tem âmbar nem vermelho: cor de disciplina identifica, nunca avisa.

**A Regra do Sálvia sobre Musgo.** `brand-on-header` aparece apenas sobre o musgo do cabeçalho e dos KPIs (sobre papel o contraste é 1,5:1). Sobre papel, o sálvia é `accent` e serve como linha ou foco.

**A Regra do Laranja.** O laranja destaca, não decora: no máximo um preenchimento sólido (`secondary`) por tela, na ação que o aluno deve tomar agora; o restante são faixas, sublinhados e progresso; eyebrows sobre papel usam `ink-soft`, e só o eyebrow do cabeçalho, sobre musgo, é laranja. Texto laranja sobre papel é sempre `secondary-text`, nunca `secondary`. Contagem de elementos laranja alta num mesmo bloco dilui o destaque.

**A Regra do Âmbar.** O âmbar semântico (`amber` sobre `amber-bg`, `attention`) só marca estado de atenção: prontidão, prazo, atraso, e sempre acompanha rótulo textual. Laranja de destaque e âmbar de estado compartilham o matiz; o que os separa é o papel. Selo ou faixa com texto "atenção/atraso" usa `amber`; elemento sem estado usa `secondary`.

**A Regra da Prioridade Provisória.** Um diagnóstico crítico com evidência baixa ou não avaliada aparece como "Prioridade provisória", em tom de atenção (âmbar) e não de alarme (vermelho), com a explicação de que pode mudar com mais registros. O vermelho fica para risco com evidência suficiente.

**A Regra do Significado.** Verde, âmbar e vermelho só carregam estado. Nunca decoram, e sempre acompanham um rótulo textual.

## Typography

**Display Font:** Fraunces (com Georgia)
**Body Font:** IBM Plex Sans (com Segoe UI, Arial)
**Data Font:** IBM Plex Mono (com Consolas, Courier New)

**Character:** Uma serifa editorial para o "saldo", os valores e a marca; uma mono só para o que é número de registro — datas, durações, contagens, percentuais, códigos e eixos de gráfico; e uma sans neutra para explicar, rotular e agir. A mono nos números é o que faz a interface parecer um extrato.

As três famílias são servidas do próprio projeto (`fonts/`, licença OFL, declaradas em `styles/fonts.css` com `font-display: swap`), pré-carregadas e guardadas pelo Service Worker. Nenhuma requisição sai para hosts de fonte, o que mantém a promessa de app local e offline.

### Hierarchy
- **Display** (600, 28px, -0.01em): título do extrato no cabeçalho.
- **Headline** (600, clamp(1.75rem, 3vw, 2.25rem)): título de página e de diálogos de entrada.
- **Value** (600, 24px): números principais em KPIs e saldos.
- **Title** (600, 1rem, 1.3): títulos de blocos de decisão ("Hoje", diagnóstico principal).
- **Body** (400, 0.875rem, 1.5; 15px até 600px de largura): explicações e formulários; parágrafos limitados a 80ch.
- **Action** (Sans 500, 0.8125rem, sem caixa-alta): botões e abas.
- **Label** (Sans 600, 12px, 0.08em, MAIÚSCULAS): rótulos de seção, eyebrows, cabeçalhos de tabela, rótulos de KPI. Caixa-alta só aqui.
- **Data** (Mono 400, 12px): datas, durações, contagens, percentuais e códigos; 12px é o piso de toda a interface.

Pesos permitidos: 400, 500, 600. O 700 existe como token mas não é a voz do sistema.

### Named Rules
**A Regra da Coluna de Extrato.** Se é um número, uma data, uma duração ou um código, é Plex Mono. Se é um valor que importa (saldo, KPI, cronômetro), é Fraunces. Todo o resto — rótulos, estados, ações, explicações — é Plex Sans.

## Layout

Coluna única centralizada de até 1280px, com gutter na grade híbrida `clamp(16px, 2.5vw, 32px)` (`16 / 24 / 32px` via `--space-page-x`) e respiro inferior de 80px. Sistema de Grade Híbrida de 8 Pontos: malha estrutural em `8px` (`8, 16, 24, 32, 40, 48, 56, 64px` via `--space-2`, `--space-4`, `--space-6`, `--space-8`, `--space-10`, `--space-12`, `--space-14`, `--space-16`) e subgrade micro/óptica em `4px` (`4, 12px` via `--space-1`, `--space-3`; `--space-5` `20px` fica em transição para legado), com papéis semânticos: inline `8px`, stack `16px`, card `16px`, panel `24px`, action `12px`, conteúdo→ação `24px`, bloco `32px`, seção `48px`.

O cabeçalho do extrato vira uma barra compacta fixa (`sticky-shell`) ao rolar, com a sequência de dias (chama) quando ela existe. Abas no topo em todas as larguras do desktop (uma barra lateral acima de 1280px foi testada e descartada); entre 761px e 1050px o respiro lateral da aba cai de 12px para 8px para as oito caberem sem cortar "Instruções". Abaixo de 760px viram navegação inferior com Início, Desempenho, Hoje, Agenda e Mais (Disciplinas, Questões e Simulados, Planejamento e Instruções ficam em Mais); voltar ao topo e o aviso de salvamento ficam acima dela, medidos por `--bottom-nav-height`. Controles têm 36px de altura com ponteiro fino e 44px em toque (`pointer: coarse` ou abaixo de 760px); as subabas de Desempenho e os resumos de disclosure ficam sempre em 44px. Breakpoints principais: 760px (mobile/desktop), 900px e 1100px (densidade de grades), 430px e 375px (ajustes finos). Tudo funciona a partir de 320px sem rolagem horizontal global; listas, diagnósticos e formulários empilham antes de encolher a área de toque.

Listas de registros mostram 5 itens e expandem com "Mostrar mais · +N".

As oito abas, na ordem do app (Início, Desempenho, Hoje, Disciplinas, Agenda, Questões e Simulados, Planejamento e Instruções), têm papéis separados:
- **Visão geral** é o resumo visual: Próxima ação com Atenção, Saúde do Edital ao lado da tendência e da coluna de apoio (meta e plano de hoje, revisões, 28 dias), e um fecho que leva a Desempenho. A análise detalhada não mora aqui.
- **Desempenho** é a leitura do período escolhido, não o "agora" (que é de Início), e responde nesta ordem: como estou, o que mais pesa e o que fazer. A Visão geral abre com a **Leitura da preparação** (três blocos: Prontidão "calculada agora" com barra e tendência, faixa projetada e ritmo; os até três pontos que mais pesam; e a mesma recomendação de Hoje medida contra o plano da semana, com "Abrir em Hoje" como único botão sólido), seguida de "O que mudou depois das recomendações" (só resultados medidos, sem causa), do Resumo do período (situação da meta e os últimos 7 dias) e dos indicadores. Quatro abas de primeiro nível, com segundo nível nos grupos que têm mais de uma seção: Visão geral; Disciplinas (Por disciplina e Diagnóstico); Questões e provas (Questões, Simulados e Inteligência da prova); Consistência (Ritmo e aderência e Conquistas e histórico). Cada subaba responde uma pergunta: Por disciplina traz a Comparação (precisão, meta, evolução, planejado, realizado, saldo do plano e sugestão), o Mapa de estabilidade e o detalhe da disciplina; Diagnóstico traz a situação do preparo, o replanejamento, a Matriz Domínio × Retenção e a dobra com Balanço, Radar e Queda de retenção; Ritmo e aderência abre com a síntese e leva a análise de aderência para a dobra "Como o plano foi cumprido". Cada seção tem URL própria (`#desempenho/<seção>`, com `#desempenho` abrindo a Visão geral) e os blocos principais têm âncora (`#desempenho/<seção>/<bloco>`) e o botão "Copiar link". Conquistas, tempo de estudo e sessões só aparecem em Conquistas e histórico.
- **Agenda** é uma aba só, com duas seções: "Tarefas de estudo" (visões Mês e Lista) e "Revisões espaçadas", com filtros de disciplina, status e mês compartilhados e uma lista única de atrasadas. `#calendario` continua como alias.

Seções recolhíveis (`details[data-remember]`) ficam abertas no desktop e fechadas no celular quando têm `data-default-open="wide"`, e fechadas sempre quando não têm; a escolha é lembrada pelo navegador. O Planejamento organiza suas seções em cinco painéis exclusivos de sub-aba (`section.metas-subpanel[role="tabpanel"]`): Plano da semana (ativo por padrão), Prova e ritmo, Metas por disciplina, Fechamento semanal e Histórico. A barra de atalhos (`PlanningSubtabsNav.tsx` no desktop e `#metasSubtabSelect` no celular) exibe apenas a sub-aba escolhida, ocultando as demais via `hidden`, e grava o atalho na URL (`#planejamento/fechamento`). Saltos e âncoras (`openSectionFor`) ativam a sub-aba oculta e abrem qualquer `details[data-remember]` envolvente antes da rolagem; dentro da aba, blocos internos como `#metasAdjust` (`.metas-adjust-panel`) e `#metasHistoryIntro` evitam aninhamento visual de cards.

A densidade compacta (`html[data-density="compact"]`) aperta a escala de espaço mantendo múltiplos estritos de 4/8px (8, 12, 16, 24, 32, 40, 48 px) sem mudar tipografia nem alvos de toque.

### Named Rules
**A Regra do Card como Agrupamento.** Um card agrupa um assunto. Dentro dele, use linhas, espaço e tipo; nunca aninhe cards para criar hierarquia.

## Elevation & Depth

Plano por padrão. Profundidade vem de tom (papel → papel branco → ardósia) e de bordas de 1px em `paper-line`. Sombras existem apenas em elementos que flutuam sobre o conteúdo e usam `--shadow-color` (musgo translúcido no claro, preto no escuro).

### Shadow Vocabulary
- **Fio sálvia** (`box-shadow: 0 1px 0 var(--accent)`): base do cabeçalho do extrato, como a linha de assinatura de um documento.
- **Barra fixa** (`box-shadow: 0 4px 12px color-mix(in srgb,var(--shadow-color) 25%,transparent)`): busca/compact header grudados no topo.
- **Menu flutuante** (`box-shadow: 0 10px 24px var(--shadow-color)`): menus e popovers.
- **Diálogo** (`box-shadow: 0 24px 70px var(--shadow-color)`): modais e assistente inicial, com backdrop `var(--backdrop)`.

### Named Rules
**A Regra do Painel Inferior.** No celular, um formulário curto e frequente (registrar questões) abre como painel preso à base da tela, por cima da barra inferior, com a mesma sombra de menu flutuante para cima.

**A Regra do Papel Plano.** Um card em repouso não tem sombra. Se algo precisa de sombra, é porque está acima da página — modal, menu, barra fixa.

## Shapes

Cantos discretos: 8px (`--radius-card`) em cards, painéis, modais e tabelas; 6px (`--radius-control`) em botões, campos, selos e abas (só nos cantos superiores). Marcas pequenas — barras de progresso, células do heatmap, eventos do calendário — mantêm 2px. No Tailwind, `rounded-default` é o raio de card e `rounded` o de controle. Bordas de 1px em `paper-line`. Marcadores semânticos são faixas de 3px: no topo para ação (`accent`), à esquerda para insight (`accent`) e atenção (`amber`). Ativos e seleções usam sublinhado ou contorno interno sálvia (`inset 0 -2px` ou `inset 0 0 0 1px var(--accent)`). O cabeçalho do extrato tem uma textura de linhas verticais sálvia a 5% de opacidade a cada 40px — a única textura do sistema; o fundo da página é liso (a textura pontilhada foi removida).

## Motion

Uma duração só para transições de interface: `--motion-duration` (160ms) em botões, abas e controles. Animações são pontuais e comunicam um evento (o anel do plano cumprido pulsa uma vez; o lançamento da sessão entra uma vez). Com `prefers-reduced-motion: reduce`, transições e animações vão a zero.

## Components

### Buttons
Três níveis, um primário por card: o primário é a próxima ação; o tonal repete ações em lista; o terciário é um link de ação.
- **Shape:** 6px, altura 36px.
- **Primary:** musgo com texto papel, Sans 500 13px, padding 8px 16px.
- **Tonal:** fundo `--action-tonal-bg` (sálvia suave), texto título, sem borda; para "Iniciar" e "Revisar" repetidos em listas.
- **Tertiary:** sem fundo nem borda, sublinhado, texto título; para ações de leitura ("ver detalhes").
- **Hover / Focus:** hover troca para Sálvia Tinta (o tonal escurece um tom); foco é contorno sálvia de 2px com offset 2px; active desce 1px. Transições de 150ms.
- **Ghost (secundário):** transparente com borda e texto título; hover preenche.
- **Danger:** transparente com borda e texto vermelho; hover preenche de vermelho.
- **Small:** padding 8px 12px (altura mínima 36px em `.ui-btn.btn-small`).
- **Icon-btn:** ações só com ícone; sempre com nome acessível.

### Chips (status-badge)
- **Style:** 12px peso 500, padding 4px 8px, fundo tonal e texto saturado da mesma família (sucesso, aviso, perigo, info, insuficiente).
- **State:** sempre com texto; quebra palavras longas em vez de transbordar.

### Cards / Containers
- **Corner Style:** 8px; blocos internos sem moldura própria, separados por linha.
- **Background:** papel branco; variantes ardósia (`--muted`), hover-bg (`--interactive`), destaque (`--attention`) e musgo (`--primary`, texto papel).
- **Shadow Strategy:** nenhuma (ver Elevation).
- **Border:** 1px `paper-line`; faixa de 3px sálvia (ação, insight) ou âmbar (atenção).
- **Internal Padding:** `16px` (`--space-card`) em cards padrão e `24px` (`--space-panel`) em painéis destacados; título do card em Label, cinza tinta-suave.

### Inputs / Fields
- **Style:** fundo de card, borda 1px `border-control`, 6px de raio, Sans, padding 4px 32px 4px 12px, altura 36px.
- **Focus:** borda sálvia e contorno sálvia de 3px com offset 1px.
- **Hover:** borda escurece para tinta-suave.
- **Disabled:** opacidade 50%, cursor not-allowed.

### Navigation
- **Abas:** Sans 500 13px sem caixa-alta, fundo ardósia, texto tinta-suave; ativa em musgo com texto Sálvia Claro; hover em `tab-hover-bg`.
- **Navegação de seções (Visão Geral):** barra fixa em papel com links Sans 12px; hover/foco ganham fundo ardósia e contorno sálvia de 1px.
- **Subabas de Desempenho:** duas linhas de abas (`role="tablist"`). A primeira tem quatro grupos, com a ativa em musgo; a segunda, só do grupo ativo, usa fundo transparente e a ativa em `green-bg` com borda sálvia. Setas, Home e End funcionam em cada nível, e trocar de grupo abre a primeira seção dele. No celular os quatro grupos dividem a largura (padding de 8px, texto 13px) sem cortar "Consistência", e os filtros (período, comparação e escopo) viram uma linha de resumo com "Alterar filtros", que abre os controles. O hash da URL acompanha a seção, inclusive no botão Voltar.
- **Mobile (<760px):** navegação inferior fixa com Início, Desempenho, Hoje, Agenda e menu "Mais"; a busca vira uma lupa que abre a paleta de comandos.
- **Atalhos dos blocos (Planejamento):** barra sublinhada de `Tabs` (`role="tablist"` em `PlanningSubtabsNav.tsx`), com abas (`role="tab"`, `aria-selected="true"` e `aria-controls`, fundo ardósia e sublinhado sálvia) vinculadas a cinco painéis exclusivos (`role="tabpanel"` e `hidden`); setas, Home e End passam de uma seção à outra no desktop, em sincronia com o seletor mobile `#metasSubtabSelect` e com a rota `#planejamento/<sub-aba>`.

### Cabeçalho do Extrato (signature)
Bloco musgo com eyebrow Sálvia Claro (11px, 0.14em), título Fraunces 28px, número do plano em mono à direita, divisor papel a 18%, saldo em Fraunces âmbar com anel de prontidão e tendência de 8 semanas, e textura de linhas verticais. Um único modelo alimenta a versão hero e a compacta fixa. Sem índice, o saldo diz "faltam N de 5 fatores" e "Como liberar os fatores" abre um botão por fator, cada um levando à ação que produz a evidência.

### Linha de razão (`LedgerLine`)
Rótulo à esquerda, guia pontilhada de 1px em `border-control` (decorativa, `aria-hidden`) e valor à direita em Mono pequeno com números tabulares, sem quebra. O total (`--total`, linha de 2px acima) e o estado (`is-negative`, `is-positive`) sempre vêm em texto, com sinal ou palavra; a cor nunca é a única leitura. É a forma de mostrar "quanto" em Hoje e em Planejamento; sem sombra nem moldura próprias.

### Conciliação
Compara minutos em linhas de razão, só na apresentação (sem regra de domínio nova). No dia (Hoje): Disponível, Planejado, Estudado, Excedente (só quando o plano passa da disponibilidade) e Livre; sem plano calculado, nada é conciliado. Na semana (Planejamento): capacidade, planejado, fora do plano (estudado acima do planejado) e realizado, com o período explícito. O excedente diz o tempo em minutos e leva a "Ajustar o dia", sublinhado e com alvo de 44px em toque.

### Filas da Agenda
Três filas rotuladas por tipo e período: Vencidas, Hoje e Próx. 7 dias, cada uma com o total e a divisão em Revisão espaçada e Tarefa de estudo. Vencidas só ganha ênfase quando há itens ("Nada atrasado" quando vazia). O calendário Mês continua visível no desktop, abaixo das filas.

### Selos de janela e de evidência (Desempenho)
Dois selos pequenos, sem ícone, explicam a base de um número ou de um bloco. O **selo de janela** (`performance-window`, fundo ardósia e texto tinta-suave, Sans 600 12px) usa só "7 dias", "período", "semana atual" e "histórico" e acompanha todo percentual de aderência, simulado e turno; no Preact (`<WindowBadge />`), detalhes extras da janela são expostos por `<Tooltip>` acessível (enquanto o helper em HTML mantém `title` escapado). O **selo de evidência** (`performance-evidence`, fundo âmbar claro e texto âmbar) aparece no cabeçalho do bloco com "amostra pequena", "confiança baixa" ou "sem dados suficientes". Os dois são componentes ([`window-badge.tsx`](src/ui/performance/window-badge.tsx) e [`evidence-badge.tsx`](src/ui/performance/evidence-badge.tsx)), nunca escritos à mão. As dobras de Desempenho lembram se estavam abertas ao redesenhar a tela.

### Gráficos
SVG puro, sem biblioteca, em `src/ui/primitives/charts/`: `RingGauge` (anel com meta), `Sparkline` (tendência, com `connectGaps`), `BulletBar` (valor contra meta), `StackedBar` (composição) e `ColumnChart` (colunas, agrupadas ou com meta). A geometria é pura (`geometry.ts`) e testada. Todo gráfico tem `role="img"` com descrição em texto e, quando há tabela, um "Ver dados" acessível; a cor nunca é a única leitura. Séries usam `--chart-series-*`; atenção usa âmbar só abaixo da meta. **Regra da escala real:** o eixo Y se ajusta aos dados (arredondado a dezenas, com no mínimo 20 pontos de altura) em vez de fixar 0–100, e traz grade com rótulos; faixa estimada e meta entram no gráfico, e um ponto de "cálculo atual" nunca se liga à linha dos fechamentos salvos. Nenhum SVG é ampliado acima do seu `viewBox` (a trajetória tem largura máxima de 760px). O gráfico de Simulados sobe o piso do eixo Y (no máximo 80%) quando as notas ficam em faixa estreita. Quando duas disciplinas repetem a mesma cor da paleta de 8, a repetida ganha traço tracejado, para a leitura não depender só da cor. **Regra do texto do gráfico:** o texto de um SVG nunca renderiza abaixo de 12px, então o SVG tem `min-width` igual à largura do seu `viewBox` e, em contêiner mais estreito, rola na horizontal dentro de uma região focável (`role="region"`, nome e `tabindex="0"`) que abre no dado mais recente (a região rola em `flex-direction: row-reverse` para começar pelo fim). Eixos de data mostram no máximo cerca de 6 rótulos. **Exceção do mapa de atividade:** as células (`button.heatmap-cell`) medem 14px com ponteiro fino e 24px em toque; o passo de 17px não cumpre o WCAG 2.5.8 para mouse, e isso foi aceito conscientemente em favor da densidade de 52 semanas (a seleção também é feita pelas setas do teclado).

### Avisos e Desfazer
O aviso (`#toast`, renderizado declarativamente via `<Toast>` / `<ToastViewport>` em `#toastViewportMount`) é do tamanho do texto; no celular fica 8px acima da barra inferior. Exclusões de um único registro (item do calendário, questões, simulado, revisão, sessão, meta semanal de questões por disciplina, tópico arquivado) acontecem na hora e o aviso traz "Desfazer" por 10s, pausando sob o ponteiro ou foco, com Ctrl+Z. Exclusões em cascata, limpeza total, importação e descarte do cronômetro continuam pedindo confirmação.

### Modo Essencial
Preferência por navegador, ligada por padrão para quem começa sem dados. Análises avançadas (`[data-advanced]`) ficam atrás de um botão "Mostrar …" que abre só aquela análise; termos técnicos do topo (`[data-term]`) ganham um "?" de 24px que revela uma dica curta abaixo do rótulo.

### Dobra de decisão (`.decision-fold`)
Disclosure de nível de página para uma camada de análise inteira (por exemplo, balanço, radar e retenção em Desempenho). Sem moldura própria: o resumo é Fraunces 600 (14px, cor de título) e, aberta, uma linha de 1px em `paper-line` o separa do conteúdo, que traz seus próprios cards; nunca aninha card dentro de card. A escolha de abrir ou fechar é lembrada.

### Célula de KPI (signature)
Bloco musgo, valor Fraunces 24px em Sálvia Claro (aviso em `--warn-on-dark` `#F2B07A`, positivo em `--ok-on-dark` `#A8D3B8`), rótulo Sans 11px maiúsculo a 72% de opacidade. Versões clicáveis clareiam no hover e ganham contorno sálvia interno no foco.

### Linha de Diagnóstico (signature)
Tópico, badge textual, score, evidência, explicação e ação em níveis distintos numa só linha; empilha no mobile. Explicações extras ficam em disclosures fechados.

## Do's and Don'ts

### Do:
- **Do** usar apenas tokens de papel (`--surface-*`, `--text-*`, `--status-*`, `--border-*`) em componentes novos, para que funcionem nos dois temas.
- **Do** manter Plex Mono para números, datas, durações e códigos, Fraunces para valores e marca, e Plex Sans para rótulos, estados e ações.
- **Do** usar `--radius-card` (8px) e `--radius-control` (6px), 1px de borda e faixas de 3px como marcadores semânticos.
- **Do** dar a todo badge de estado um rótulo textual.
- **Do** funcionar a partir de 320px, empilhando antes de reduzir alvos de toque (mínimo 44px em toque; links de tópico e disciplina em listas densas têm no mínimo 24px com ponteiro fino).
- **Do** usar foco sálvia visível em tudo que é interativo, com `--accent` no anel: `--brand` quase coincide com o fundo no tema escuro (1,1:1).
- **Do** manter um único botão primário por card; repetições em lista usam `tonal`.
- **Do** usar `<Icon name="..." />` ou `renderIconSvg(...)` do Lucide Icons (`1.5px`) para apoiar ações e sinalizações sem poluição visual.
- **Do** oferecer "Desfazer" em vez de "Tem certeza?" quando a exclusão é de um único registro e pode ser revertida exatamente.
- **Do** dar a todo gráfico uma descrição textual e, quando houver tabela, "Ver dados".

### Don't:
- **Don't** aninhar cards para criar hierarquia; use linha, espaço e tipo.
- **Don't** pôr sombra em cards em repouso.
- **Don't** usar `brand-on-header` sobre papel, âmbar como marca ou navegação, nem cor literal fora de `styles/tokens.css`.
- **Don't** usar verde, âmbar ou vermelho como decoração.
- **Don't** usar raios acima de 8px, pílulas em contêineres ou gradientes (a textura de linhas do cabeçalho é a única exceção); o extrato é discreto e plano.
- **Don't** usar peso 700 como voz padrão; a hierarquia vai até 600.
- **Don't** usar âmbar ou vermelho como cor de disciplina, nem animação contínua; movimento só para eventos e respeitando `prefers-reduced-motion`.
- **Don't** carregar fontes, scripts ou estilos de hosts externos; o app roda local e offline.
- **Don't** usar emojis Unicode na interface (`\p{Extended_Pictographic}`); use estritamente ícones vetoriais Lucide (`1.5px`) via `src/ui/primitives/icon.tsx`.
