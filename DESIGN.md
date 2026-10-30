---
name: StudyTrack — Extrato de Estudos
description: O estudo lido como um extrato de conta — navy, dourado, papel e linhas finas.
colors:
  navy: "#0B2545"
  blue: "#0F3D73"
  gold: "#765500"
  gold-bright: "#E8B94A"
  paper: "#F6F3EC"
  paper-line: "#E4DFD1"
  white: "#FFFDF9"
  slate-bg: "#EDEAE0"
  ink: "#1C2430"
  ink-soft: "#4F5865"
  on-navy: "#F6F3EC"
  green: "#245F47"
  green-bg: "#E4F0EA"
  amber: "#765018"
  amber-bg: "#F5E9D4"
  red: "#8F302A"
  red-bg: "#F3E0DD"
  info-bg: "#E3E9F3"
  highlight-bg: "#FFF8E6"
  tab-hover-bg: "#E1DCCB"
  border-control: "#857F6F"
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
    fontFamily: "IBM Plex Mono, Consolas, Courier New, monospace"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.08em"
  caption:
    fontFamily: "IBM Plex Mono, Consolas, Courier New, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.05em"
rounded:
  sharp: "2px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
  space-12: "48px"
  space-16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.sharp}"
    padding: "9px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.blue}"
  button-ghost:
    textColor: "{colors.navy}"
    rounded: "{rounded.sharp}"
    padding: "9px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
  button-danger:
    textColor: "{colors.red}"
    rounded: "{rounded.sharp}"
    padding: "7px 11px"
  button-danger-hover:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
  tab:
    backgroundColor: "{colors.slate-bg}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    padding: "11px 18px"
  tab-hover:
    backgroundColor: "{colors.tab-hover-bg}"
  tab-active:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.gold-bright}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "20px 22px"
  kpi-cell:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.gold-bright}"
    typography: "{typography.value}"
    padding: "16px 18px"
  select:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "7px 32px 7px 10px"
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
    textColor: "{colors.blue}"
    padding: "4px 8px"
  status-badge-insufficient:
    backgroundColor: "{colors.slate-bg}"
    textColor: "{colors.ink-soft}"
    padding: "4px 8px"
---

# Design System: StudyTrack — Extrato de Estudos

## Overview

**Creative North Star: "O Extrato Bancário"**

O StudyTrack apresenta o estudo como um extrato de conta: um cabeçalho navy com o saldo em serifa dourada, lançamentos em papel separados por linhas finas, rótulos em mono maiúscula como colunas de um documento financeiro. A prontidão é o saldo; cada sessão, questão e revisão é um lançamento. A confiança vem da mesma fonte que a de um extrato: números precisos, registro que não se reescreve, nenhuma decoração competindo com o dado.

A densidade é de ferramenta de uso diário e prolongado. Cards agrupam; dentro deles, hierarquia vem de linha, espaço e tipografia, não de mais caixas. Componentes são precisos e contidos: cantos quase retos, texto mono para métricas e estados, cor reservada para significado. A interface é plana por padrão; sombra existe apenas onde algo realmente flutua sobre a página.

Os dois temas (claro "papel" e escuro "noite navy") são o mesmo sistema com valores trocados nos tokens; nenhum componente define cor literal.

**Key Characteristics:**
- Navy estrutural, dourado de destaque, papel como superfície.
- Três vozes tipográficas: Fraunces para marca e valores, IBM Plex Mono para dados e rótulos, IBM Plex Sans para leitura.
- Cantos de 2px, bordas de 1px, faixas laterais/superiores de 3px como marcadores semânticos.
- Plano por padrão; sombra só em sobreposições.
- Estado sempre textual; cor nunca é o único indicador.

## Colors

Paleta de documento financeiro: um navy profundo e um dourado envelhecido sobre papel quente, com semânticos dessaturados que não gritam em uso diário.

### Primary
- **Navy de Extrato** (`navy`): estrutura e autoridade — cabeçalho do extrato, botão primário, aba ativa, células de KPI, card primário. Também é a cor dos títulos (`--heading`).
- **Azul Tinta** (`blue`): hover do botão primário, série principal de gráficos, estado informativo.

### Secondary
- **Ouro Envelhecido** (`gold`): borda de ênfase, faixa de `card--action`, anel de foco. No claro é escuro o bastante para contraste AA como texto.
- **Ouro Vivo** (`gold-bright`): só sobre navy — valores do KPI, eyebrow do extrato, texto da aba ativa.

### Tertiary (semânticos)
- **Verde Conta** (`green` sobre `green-bg`): positivo, meta atingida.
- **Âmbar Aviso** (`amber` sobre `amber-bg`): atenção, revisão pendente; também série secundária de gráficos.
- **Vermelho Débito** (`red` sobre `red-bg`): risco, perda, ação destrutiva.
- **Azul Informe** (`info-bg`): fundo de badge informativo.

### Neutral
- **Papel** (`paper`): fundo da página e de campos.
- **Papel Branco** (`white`): superfície de cards; um branco quente, nunca `#FFF` puro.
- **Ardósia Clara** (`slate-bg`): superfícies recolhidas, abas inativas, trilhas de barra, evidência insuficiente.
- **Linha de Papel** (`paper-line`): toda borda e divisor de 1px.
- **Tinta** (`ink`) e **Tinta Suave** (`ink-soft`): texto principal e secundário.
- **Destaque** (`highlight-bg`): fundo de `card--attention`.

Tema escuro (`[data-theme="dark"]`, `styles/tokens.css`): navy `#0B1E38`, papel `#10161F`, card `#171F2E`, tinta `#E9E5D8`, ouro `#C89A3E`, semânticos clareados (verde `#4FAE81`, âmbar `#E0A94A`, vermelho `#E2897E`). Componentes usam apenas os aliases de papel (`--surface-*`, `--text-*`, `--status-*`, `--border-*`, `--action-*`).

Ação primária (`--action-primary-bg` / `--action-primary-text` / `--action-primary-hover`): navy com texto papel no claro; no escuro, ouro claro `#E8B94A` com texto navy `#0B1E38` (hover `#EFC463`), o mesmo par do assistente de primeiro uso, porque um botão navy some sobre card navy (1,1:1). Vale para `.btn`, `.month-nav-btn`, botões alternáveis pressionados e o seletor ativo de Desempenho. O navy continua sendo a superfície estrutural do extrato (cabeçalho, KPIs, aba ativa). Contorno de `.btn.ghost`: `--action-outline` (título no claro, `ink-soft` no escuro).

### Named Rules
**A Regra do Ouro sobre Navy.** `gold-bright` aparece apenas sobre navy. Sobre papel, o dourado é `gold` e serve como linha ou foco, não como preenchimento.

**A Regra do Significado.** Verde, âmbar e vermelho só carregam estado. Nunca decoram, e sempre acompanham um rótulo textual.

## Typography

**Display Font:** Fraunces (com Georgia)
**Body Font:** IBM Plex Sans (com Segoe UI, Arial)
**Label/Mono Font:** IBM Plex Mono (com Consolas, Courier New)

**Character:** Uma serifa editorial para o "saldo" e a marca, uma mono para tudo que é registro — rótulos, datas, métricas, estados — e uma sans neutra para explicar. A mono é o que faz a interface parecer um extrato.

### Hierarchy
- **Display** (600, 28px, -0.01em): título do extrato no cabeçalho.
- **Headline** (600, clamp(1.75rem, 3vw, 2.25rem)): título de página e de diálogos de entrada.
- **Value** (600, 24px): números principais em KPIs e saldos.
- **Title** (600, 1rem, 1.3): títulos de blocos de decisão ("Hoje", diagnóstico principal).
- **Body** (400, 0.875rem, 1.5): explicações e formulários; parágrafos limitados a 80ch.
- **Label** (600, 12px, 0.08em, MAIÚSCULAS): títulos de cards, abas, botões (botões a 0.03em).
- **Caption** (400, 10–11px, 0.04–0.14em, MAIÚSCULAS): eyebrows, rótulos de KPI, navegação de seções, badges.

Pesos permitidos: 400, 500, 600. O 700 existe como token mas não é a voz do sistema.

### Named Rules
**A Regra da Coluna de Extrato.** Se é um dado, uma data, um estado ou um rótulo de coluna, é Plex Mono. Se é um valor que importa, é Fraunces. Todo o resto é Plex Sans.

## Layout

Coluna única centralizada de até 1280px, com gutter fluido `clamp(16px, 2.5vw, 32px)` e respiro inferior de 80px. Escala de espaço em 4px: 4, 8, 12, 16, 20, 24, 32, 48, 64 (`--space-1` a `--space-16`), com aliases semânticos: ação 12px, conteúdo→ação 24px, bloco 32px, seção 48px.

O cabeçalho do extrato vira uma barra compacta fixa (`sticky-shell`) ao rolar. Abas no topo no desktop; abaixo de 760px viram navegação inferior com menu "Mais". Controles têm 36px de altura e alvo de toque mínimo de 44px. Breakpoints principais: 760px (mobile/desktop), 900px e 1100px (densidade de grades), 430px e 375px (ajustes finos). Tudo funciona a partir de 320px sem rolagem horizontal global; listas, diagnósticos e formulários empilham antes de encolher a área de toque.

Listas de registros mostram 5 itens e expandem com "Mostrar mais · +N".

### Named Rules
**A Regra do Card como Agrupamento.** Um card agrupa um assunto. Dentro dele, use linhas, espaço e tipo; nunca aninhe cards para criar hierarquia.

## Elevation & Depth

Plano por padrão. Profundidade vem de tom (papel → papel branco → ardósia) e de bordas de 1px em `paper-line`. Sombras existem apenas em elementos que flutuam sobre o conteúdo e usam `--shadow-color` (navy translúcido no claro, preto no escuro).

### Shadow Vocabulary
- **Fio dourado** (`box-shadow: 0 1px 0 var(--gold)`): base do cabeçalho do extrato, como a linha de assinatura de um documento.
- **Barra fixa** (`box-shadow: 0 4px 12px rgba(11,37,69,.08)`): busca/compact header grudados no topo.
- **Menu flutuante** (`box-shadow: 0 10px 24px var(--shadow-color)`): menus e popovers.
- **Diálogo** (`box-shadow: 0 24px 70px rgba(0,0,0,.25)`): modais e assistente inicial, com backdrop `rgba(12,20,30,.65)`.

### Named Rules
**A Regra do Papel Plano.** Um card em repouso não tem sombra. Se algo precisa de sombra, é porque está acima da página — modal, menu, barra fixa.

## Shapes

Cantos quase retos (2px) em tudo: botões, cards, campos, barras, abas (só nos cantos superiores). Bordas de 1px em `paper-line`. Marcadores semânticos são faixas de 3px: no topo para ação (`gold`), à esquerda para insight (`gold`) e atenção (`amber`). Ativos e seleções usam sublinhado ou contorno interno dourado (`inset 0 -2px` ou `inset 0 0 0 1px var(--gold)`). O cabeçalho do extrato tem uma textura de linhas verticais douradas a 5% de opacidade a cada 40px — a única textura do sistema.

## Components

### Buttons
Precisos e contidos: rótulo mono, cantos de 2px, sem ícone obrigatório.
- **Shape:** quase reto (2px), altura 36px.
- **Primary:** navy com texto papel, mono 12px a 0.03em, padding 9px 16px.
- **Hover / Focus:** hover troca para Azul Tinta; foco é contorno dourado de 2px com offset 2px; active desce 1px. Transições de 150ms.
- **Ghost (secundário):** transparente com borda e texto navy; hover preenche de navy.
- **Danger:** transparente com borda e texto vermelho, 11px; hover preenche de vermelho.
- **Small:** padding 6px 10px, 11px.
- **Icon-btn:** ações só com ícone; sempre com nome acessível.

### Chips (status-badge)
- **Style:** mono 10px peso 500, padding 4px 8px, fundo tonal e texto saturado da mesma família (sucesso, aviso, perigo, info, insuficiente).
- **State:** sempre com texto; quebra palavras longas em vez de transbordar.

### Cards / Containers
- **Corner Style:** 2px.
- **Background:** papel branco; variantes ardósia (`--muted`), hover-bg (`--interactive`), destaque (`--attention`) e navy (`--primary`, texto papel).
- **Shadow Strategy:** nenhuma (ver Elevation).
- **Border:** 1px `paper-line`; faixa de 3px dourada (ação, insight) ou âmbar (atenção).
- **Internal Padding:** 20–24px; título do card em Label, cinza tinta-suave.

### Inputs / Fields
- **Style:** fundo papel, borda 1px `paper-line`, 2px de raio, mono nos seletores, padding 7px 32px 7px 10px, altura 36px.
- **Focus:** borda dourada e contorno dourado de 3px com offset 1px.
- **Hover:** borda escurece para tinta-suave.
- **Disabled:** opacidade 50%, cursor not-allowed.

### Navigation
- **Abas:** mono 12px maiúsculas a 0.06em, fundo ardósia, texto tinta-suave; ativa em navy com texto Ouro Vivo; hover em `tab-hover-bg`.
- **Navegação de seções (Visão Geral):** barra fixa em papel com links mono 10px maiúsculos; hover/foco ganham fundo ardósia e contorno dourado de 1px.
- **Mobile (<760px):** navegação inferior fixa com menu "Mais".

### Cabeçalho do Extrato (signature)
Bloco navy com eyebrow mono dourado (11px, 0.14em), título Fraunces 28px, "conta" em mono à direita, divisor papel a 18%, saldo em Fraunces dourado e textura de linhas verticais. Um único modelo alimenta a versão hero e a compacta fixa.

### Célula de KPI (signature)
Bloco navy, valor Fraunces 24px em Ouro Vivo (aviso em `#F0A9A0`, positivo em `#8FD6B4`), rótulo mono 11px maiúsculo a 72% de opacidade. Versões clicáveis clareiam no hover e ganham contorno dourado interno no foco.

### Linha de Diagnóstico (signature)
Tópico, badge textual, score, evidência, explicação e ação em níveis distintos numa só linha; empilha no mobile. Explicações extras ficam em disclosures fechados.

## Do's and Don'ts

### Do:
- **Do** usar apenas tokens de papel (`--surface-*`, `--text-*`, `--status-*`, `--border-*`) em componentes novos, para que funcionem nos dois temas.
- **Do** manter Plex Mono para métricas, datas, estados e rótulos, e Fraunces para valores e marca.
- **Do** usar 2px de raio, 1px de borda e faixas de 3px como marcadores semânticos.
- **Do** dar a todo badge de estado um rótulo textual.
- **Do** funcionar a partir de 320px, empilhando antes de reduzir alvos de toque (mínimo 44px).
- **Do** usar foco dourado visível em tudo que é interativo.
- **Do** usar `<Icon name="..." />` ou `renderIconSvg(...)` do Tabler Icons para apoiar ações e sinalizações sem poluição visual.

### Don't:
- **Don't** aninhar cards para criar hierarquia; use linha, espaço e tipo.
- **Don't** pôr sombra em cards em repouso.
- **Don't** usar `gold-bright` sobre papel nem cor literal fora de `styles/tokens.css`.
- **Don't** usar verde, âmbar ou vermelho como decoração.
- **Don't** usar cantos arredondados grandes, pílulas ou gradientes (a textura de linhas do cabeçalho é a única exceção); o extrato é reto e plano.
- **Don't** usar peso 700 como voz padrão; a hierarquia vai até 600.
- **Don't** usar emojis Unicode na interface (`\p{Extended_Pictographic}`); use estritamente ícones vetoriais Tabler via `src/ui/primitives/icon.tsx`.
