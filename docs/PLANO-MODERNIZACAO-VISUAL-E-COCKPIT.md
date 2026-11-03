# Plano Diretor: Modernização Visual, Cockpit Panorâmico e Experiência do Usuário

Este documento estabelece as especificações técnicas, arquiteturais e de design para a modernização do **StudyTrack** em cinco fases sequenciais, testáveis e reversíveis via Pull Requests atômicos no repositório.

O plano consolida a evolução estética e ergonômica da aplicação mantendo invioláveis as diretrizes de governança ([AGENTS.md](../AGENTS.md)): **identidade única de Extrato Bancário**, **privacidade local-first**, **ausência de emojis**, **zero cores fora dos tokens** e **modularização estrita**.

---

## 1. Visão Geral e Princípios Inegociáveis

```
+---------------------------------------------------------------------------------------------------+
| PILARES DO NOVO COCKPIT DO STUDYTRACK                                                             |
+---------------------------------------------------------------------------------------------------+
| 1. Identidade de Extrato Bancário: O cabeçalho (.statement) permanece como instituição contábil   |
|    de horas, saldo de prontidão e prazos, agora na paleta Sálvia Suíça.                           |
| 2. Decisão em 5 Segundos: A Visão Geral deixa de ser um relatório longo de tabelas e vira um       |
|    painel de controle (cockpit) de ação imediata e diagnóstico estratégico.                       |
| 3. Engenharia Leve (Zero Libs Externas): Todos os gráficos rodam em SVG puro (Preact/Node),        |
|    sem Chart.js ou canvas, garantindo fidelidade offline e determinismo nos testes visuais.       |
| 4. Onboarding Desobstruído: A configuração inicial e mensagens de primeiro uso viram Modal Dialog |
|    acessível, liberando 100% do espaço da página para o dashboard.                                |
| 5. Realocação Cirúrgica: Tabelas detalhadas vão para suas abas de domínio (Questões e Disciplinas).|
+---------------------------------------------------------------------------------------------------+
```

### Regras Globais para Todas as Fases
- **Zero Emojis:** Proibição estrita de glifos Unicode. Uso exclusivo de Tabler Icons vetoriais via `<Icon name="..." />` ou `renderIconSvg(...)`.
- **Zero Cores Soltas:** Nenhuma cor hexadecimal ou `rgba` solta em JSX ou CSS. 100% dos elementos utilizam as variáveis semânticas de `styles/tokens.css`.
- **A Cor Nunca é o Único Sinal:** Badges, gráficos e alertas combinam cor com ícone vetorial ou texto descritivo com contraste mínimo WCAG AA (4.5:1 para texto normal, 3:1 para componentes de UI).
- **Simulações Sem Efeitos Colaterais:** Toda ferramenta preditiva ou de redistribuição opera em memória e exige confirmação explícita antes de persistir no storage.
- **Responsividade Real:** Nenhuma quebra de layout a partir de 320 px de largura.

---

## 2. Mapa Estrutural da Nova Visão Geral (Cockpit)

```
=====================================================================================================
[ CABEÇALHO .statement ] EXTRATO DE ESTUDOS · Nº do plano 2026-001 · StudyTrack
-----------------------------------------------------------------------------------------------------
Saldo: Índice de Prontidão (RingGauge 64px + Sparkline 8 sem) | Mini-Stats (6 contadores)
Contagem Regressiva da Prova (input date + dias restantes com barra de progresso)
=====================================================================================================
[ BUSCA GLOBAL ] Input de comando Ctrl+K + Alternador de Tema (Claro / Escuro)
-----------------------------------------------------------------------------------------------------
[ MENU DE ABAS ] Visão geral | Desempenho | Hoje | Disciplinas | Calendário | Agenda | Questões | Metas | Ajuda
=====================================================================================================
[ BLOCO 1 & 2 UNIFICADOS: COCKPIT PANORÂMICO EM 12 COLUNAS ]
* Coluna Esquerda (8 cols):
  1. Cartão Próxima Ação (Agora): Disciplina, Tópico prioritário, Tipo e Botão Primário Sólido "Iniciar Sessão".
  2. Alertas de Atenção (compacto e contextual).
  3. Saúde do Edital por Disciplina: Barras empilhadas (StackedBar) + BulletBars de precisão vs. meta (80%).
* Coluna Direita (4 cols):
  1. Meta de Hoje: RingGauge de horas cumpridas (ex: 2h15 / 3h00) e questões resolvidas.
  2. Carga de Revisões: Régua de 7 dias com alertas de pico em âmbar e atrasos.
  3. Consistência: Mini-Heatmap de 28 dias em tons de verde sálvia com indicação de data de hoje.
==> Simetria e equilíbrio de altura: eliminação total de espaços vazios (~550px em ambas as colunas).
-----------------------------------------------------------------------------------------------------
[ BLOCO 3: GRIDS ANALÍTICOS DE ALTO IMPACTO (DECISÃO ESTRATÉGICA) ]
* Grid 1 (Alocação): % Tempo Estudado vs. % Pontos na Prova (Regra de 5 itens visíveis + Mostrar mais).
* Grid 2 (Radar de Vulnerabilidades): Top 4 Tópicos de Maior Incidência na Banca com Menor Domínio (h-full).
* Grid 3 (Diagnóstico de Memória): Domínio Volátil e Ilusão de Competência (h-full alinhado ao Grid 2).
=====================================================================================================
```

---

## 3. As Cinco Fases de Implementação

### Fase 1: Preservação das Cores Existentes nos Tokens + Fundação Visual (4.1 a 4.4)
*Objetivo:* Consolidar a documentação e os componentes em torno dos tokens oficiais já configurados em `styles/tokens.css` (onde a marca `--brand` é o Verde Musgo institucional `#1E3F35`), aplicando o padrão visual de botões em três níveis, tipografia equilibrada e raios ergonômicos.

* **1.1 Tabela Oficial de Cores dos Tokens (`styles/tokens.css`):**
  A aplicação adota estritamente os tokens já homologados no repositório:

| Papel Semântico | Token | Modo Claro (`:root`) | Modo Escuro (`[data-theme="dark"]`) | Aplicação |
|---|---|---|---|---|
| **Marca Principal** | `--brand` | `#1E3F35` | `#0C1411` | Cor institucional, títulos e ação primária |
| **Marca Secundária** | `--brand-secondary` | `#2F5D4E` | `#7FB59A` | Hover de botões, subtítulos e acentos |
| **Acento** | `--accent` | `#2F5D4E` | `#8CC5A2` | Realce, anéis de foco e ênfase de bordas |
| **Atenção / Alerta** | `--attention` | `#E9953F` | `#E9953F` | Âmbar estrito: prontidão, prazos e atrasos |
| **Destaque no Cabeçalho** | `--brand-on-header` | `#A8D3B8` | `#A8D3B8` | Textos e números em destaque sobre fundo escuro |
| **Fundo da Página** | `--paper` | `#F4F6F4` | `#111A17` | Superfície base da aplicação |
| **Linhas / Divisores** | `--paper-line` | `#D5DDD6` | `#26332E` | Divisores sutis estilo extrato |
| **Superfície dos Cards** | `--white` | `#FBFCFA` | `#16211D` | Fundo de painéis e cartões |
| **Superfície Secundária** | `--slate-bg` | `#E6EDE6` | `#1A2621` | Fundos de subseções e tabelas zebradas |
| **Texto Primário** | `--ink` | `#17302A` | `#E3EAE4` | Corpo de texto com alto contraste |
| **Texto Secundário** | `--ink-soft` | `#4F6158` | `#9DADA4` | Metadados e explicações |
| **Texto sobre a Marca** | `--on-brand` | `#F4F6F4` | `#E3EAE4` | Tipografia sobre botões e superfícies `--brand` |
| **Status Positivo** | `--green` | `#2F6B4F` | `#6FBF93` | Metas batidas e progresso regular |
| **Status Alerta** | `--amber` | `#9A4F0E` | `#E9953F` | Dados abaixo da meta ou próximos do vencimento |
| **Status Erro / Risco** | `--red` | `#A23B2A` | `#E58A78` | Falhas, déficits críticos e ações destrutivas |
| **Borda de Controles** | `--border-control` | `#6F857A` | `#6F8579` | Limites acessíveis (≥3:1) de inputs e selects |
| **Ação Primária** | `--action-primary-bg` | `var(--brand)` (`#1E3F35`) | `#A8D3B8` (Sálvia claro) | Botão primário com alto contraste garantido |

* **1.2 Raios Ergonômicos (`styles/tokens.css`):**
  - `--radius-card: 8px` (cards, modais, painéis e tabelas).
  - `--radius-control: 6px` (botões, campos, tags e pills).
* **1.3 Tipografia Mais Leve (4.1):**
  - `IBM Plex Sans` como fonte primária para botões, abas, descrições e títulos;
  - `IBM Plex Mono` estritamente preservada para números, durações, datas e métricas contábeis;
  - `Fraunces` como fonte display exclusiva para marca institucional e valores de saldo.
* **1.4 Hierarquia de 3 Níveis de Botões (`src/ui/primitives/button.tsx`):**
  - *Primário:* Sólido com `--action-primary-bg` (`#1E3F35` claro / `#A8D3B8` escuro) e `--on-brand`.
  - *Secundário (Tonal):* Fundo com `--action-tonal-bg` (`#E2EEE6` claro / `#2A4636` escuro), sem borda externa.
  - *Terciário (Link/Ghost):* Sem fundo nem borda, com ícone inline para ações complementares.
* **1.5 Primeira Tela no Mobile (4.4):**
  - Topo compacto preservando o extrato, com a próxima ação e botão "Iniciar" visíveis sem rolagem em 375 × 812 px.

---

### Fase 2: Iconografia Tabler em Escala
*Objetivo:* Substituir caracteres textuais (`+`, `→`, `▾`) e enriquecer componentes com os vetores oficiais do Tabler Icons.

* **2.1 Primitivos Primeiro (Maior Alcance):**
  - `Badge` (`badge.tsx`): Ícones automáticos por variante (`circle-check`, `alert-triangle`, `alert-circle`, `info-circle`, `help`).
  - `EmptyState` (`empty-state.tsx`): Prop `icon` opcional para estados vazios ilustrados suavemente.
  - `MetricCard` (`metric-card.tsx`): Prop `icon` ao lado do rótulo da métrica.
  - `Button` (`button.tsx`): Props `iconLeft` e `iconRight` padronizadas.
* **2.2 Gerador e Bundle (`scripts/generate-tabler-icons.mjs`):**
  - Adicionar novos ícones homologados: `layout-dashboard`, `chart-line`, `sun`, `books`, `calendar-month`, `repeat`, `list-check`, `map-2`, `help-circle`, `gauge`, `plus`, `filter`, `cloud-upload`, `focus-2`.
  - Executar `npm run check:bundle` para assegurar que a inclusão permaneça no orçamento de performance.

---

### Fase 3: Gráficos em SVG Puro & Cockpit da Visão Geral
*Objetivo:* Transformar dados textuais em gráficos responsivos rápidos usando os primitivos de `src/ui/primitives/charts/charts.tsx` (`RingGauge`, `Sparkline`, `BulletBar`, `StackedBar`).

* **3.1 PR 3A — Cockpit Primário (Alta Prioridade):**
  - **Prontidão no Extrato:** Integrar `RingGauge` (56px) + `Sparkline` (8 semanas) no bloco de saldo do cabeçalho `.statement`.
  - **Meta Diária (Hoje):** `RingGauge` de 64px mostrando tempo estudado vs. planejado e questões do dia.
  - **Saúde do Edital:** Lista com barras empilhadas (`StackedBar`) por disciplina + `BulletBar` de precisão vs. meta de 80%.
  - **Carga de Revisões da Semana:** Régua vertical de 7 colunas (Seg a Dom) destacando picos e atrasos.
  - **Mini-Heatmap:** Calendário compacto de 28 dias (4 semanas) em tons de sálvia.
  - **Micrográficos nos KPIs:** Sparklines e BulletBars dentro dos cards de resumo.
* **3.2 PR 3B — Gráficos Avançados de Domínio (Média Prioridade):**
  - **Matriz Edital × Domínio:** Dispersão 2×2 (incidência × domínio com bolhas proporcionais).
  - **Estimativa de Ritmos (Burn-up):** Linha de cobertura real vs. ritmo necessário até a data da prova.
  - **Perfil de Erros (Pareto):** Barras ordenadas por categoria + percentual acumulado.

---

### Fase 4: Grids Analíticos, Arquitetura de Telas e Conforto (4.5 a 4.12)
*Objetivo:* Desafogar a Visão Geral, realocar tabelas pesadas e integrar inteligência preditiva.

* **4.1 Inclusão dos 3 Grids Analíticos na Visão Geral:**
  - **Grid 1 (Alocação de Tempo vs. Peso na Prova):** Tabela comparativa (% tempo vs % pontos edital) gerando alerta de subalocação. Possui **divulgação progressiva (regra de 5 itens visíveis)** com botão acessível `[Mostrar mais (+N disciplinas)]` / `[Mostrar menos]`.
  - **Grid 2 (Radar de Vulnerabilidades):** Top 4 tópicos com maior probabilidade na banca e menor domínio pessoal.
  - **Grid 3 (Diagnóstico de Domínio Volátil):** Tópicos com queda acentuada entre o estudo imediato e revisões espaçadas (>14 dias), baseado em `src/domain/analytics/volatile-mastery.ts`.
* **4.2 Realocação Cirúrgica de Grids para Abas Dedicadas:**
  - Mover o **Grid de KPIs de Questões** (`#kpiGrid`: resolvidas, precisão 30d, simulados, atrasadas, meta) da Visão Geral para o topo da aba **Questões & Simulados** (`#panel-questoes`), liberando a Visão Geral para focar 100% no Cockpit panorâmico de decisão.
  - Mover o **Grid de Tópicos** (`#quickStats`: total de tópicos, concluídos e não iniciados) da Visão Geral para o topo da aba **Disciplinas** (`#panel-disciplinas`).
* **4.3 Modelos Visuais de Diagnóstico em Outras Abas:**
  - **Aba Desempenho:** Adicionar o gráfico em 3 colunas de *Rendimento por Turno & Energia* (`focus-energy-analytics.ts`) e o card do *Detector de Platô* (`plateau-detector.ts`).
* **4.4 Modal Dialog de Configuração Inicial (Onboarding):**
  - Remover o card estático inline `#guidedOnboarding` da Visão Geral.
  - Implementar o onboarding em um `<dialog class="modal-dialog">` acessível, que se abre automaticamente apenas no primeiro uso com a base vazia ou via clique em "Configurar Plano".
* **4.5 Cores por Disciplina (4.7):**
  - Paleta de 8 tons harmônicos com contraste AA nos dois temas, sem usar âmbar ou vermelho.
* **4.6 Redistribuição de Revisões Atrasadas (4.9):**
  - Botão na Agenda que calcula a distribuição das revisões acumuladas nos próximos dias úteis;
  - Modal de prévia detalhada com confirmação explícita antes de qualquer alteração no storage.

---

### Fase 5: Fluxos Ágeis, Confiança e PWA
*Objetivo:* Reduzir atritos de registro, aumentar a sensação de controle dos dados e melhorar a experiência offline.

* **5.1 Modo Essencial e Desfazer (Undo):**
  - Mecanismo de descarte/reversão rápida de ações acidentais (sessão finalizada incorretamente ou tópico concluído por engano).
* **5.2 Sub-abas no Planejamento:**
  - Dividir a aba Planejamento em visualizações focadas (Capacidade & Plano, Histórico de Metas, Fechamentos Anteriores).
* **5.3 PWA & Atalhos:**
  - Atalhos no `manifest.webmanifest`: "Iniciar Estudo" e "Registrar Questões".
  - Notificação de tempo em andamento via Notification API / Media Session.
* **5.4 Auditoria de Build e Cache Offline:**
  - Validar a integridade do Service Worker (`sw.js`) e hash de integridade em `scripts/build.mjs`.

---

## 4. Matriz de Entregas e Status de Execução

| Fase | Escopo Principal | Arquivos Afetados | Status |
|---|---|---|---|
| **Fase 1** | Preservação das Cores Existentes + Tipografia, Bordas, Botões e Topo Compacto | `styles/tokens.css`, `styles/app.css`, `index.html`, `src/ui/primitives/button.tsx` | **Concluído** |
| **Fase 2** | Tabler Icons em Primitivos (`Badge`, `EmptyState`, `MetricCard`, `Button`) e Navegação | `src/ui/primitives/*`, `scripts/generate-tabler-icons.mjs`, `index.html` | **Concluído** |
| **Fase 3** | Gráficos SVG no Cockpit (Anéis, Barras Empilhadas, Carga Semanal, Micro-KPIs) | `src/ui/primitives/charts/*`, `src/ui/tabs/dashboard/*` | **Concluído** |
| **Fase 4** | Grids Analíticos (1, 2, 3 na Visão Geral; 4 em Questões; 5 em Desempenho), Modal Onboarding e Revisões | `src/application/analytics/*`, `src/ui/tabs/*`, `index.html` | **Concluído** |
| **Fase 5** | Desfazer (Undo), Sub-abas no Planejamento, Atalhos PWA e Otimizações de Build | `src/application/undo/*`, `src/ui/planning-subtabs.ts`, `manifest.webmanifest`, `scripts/build.mjs` | **Concluído** |

---

## 5. Histórico e Conclusão das Fases

Todas as 5 fases foram implementadas com 100% de conformidade com os contratos do projeto:
1. **Fase 1:** Paleta Sálvia Suíça baseada estritamente nos tokens do repositório (`--brand`, `--brand-secondary`, `--attention`, etc.), bordas com `--radius-card: 8px` e `--radius-control: 6px`, botões em 3 níveis (com variante `tonal`) e cabeçalho compacto no mobile.
2. **Fase 2:** Tabler Icons vetoriais integrados em todos os componentes primitivos, eliminando emojis e glifos ASCII soltos.
3. **Fase 3:** Cockpit com gráficos SVG responsivos sem bibliotecas externas:
   - **Saúde do Edital por Disciplina (`SyllabusHealthCard.tsx`):** Barras empilhadas de progresso (concluído/em andamento) e bullet bars de precisão vs. meta de 80%.
   - **Meta de Hoje (`TodayGoalCard`):** Anel de progresso circular (`RingGauge`), tempo de estudo vs. meta e questões resolvidas vs. previstas.
   - **Carga de Revisões (`WeeklyReviewLoadCard`):** Régua vertical de 7 colunas (Seg a Dom) destacando dia de pico em tom âmbar e atrasos.
   - **Consistência 28 dias (`ConsistencyMiniHeatmapCard`):** Mini-heatmap 7×4 em tons de verde sálvia com indicador de data de hoje.
4. **Fase 4:** Adição dos Grids Analíticos de Decisão e Realocação Estrutural:
   - Grid 1: Balanço de Alocação de Tempo vs. Peso no Edital com **regra de 5 itens visíveis e botão Mostrar Mais/Menos**.
   - Grid 2: Radar de Vulnerabilidades Críticas (Visão Geral).
   - Grid 3: Diagnóstico de Domínio Volátil / Falsa Consolidação (Visão Geral).
   - Grid 4: Detector de Platô & Retorno Decrescente (Aba Questões & Simulados).
   - Grid 5: Eficiência & Energia Cronobiológica por Turno (Aba Desempenho).
   - **Realocação de Grids:** `#kpiGrid` (Questões e Simulados) movido para a aba Questões e `#quickStats` (Tópicos) movido para a aba Disciplinas.
   - Modal Dialog de Onboarding automático no primeiro uso e redistribuição em memória de revisões atrasadas (`redistribute-overdue-reviews.ts`).
5. **Fase 5:** Mecanismo de Desfazer (`state-undo.ts`), modo Essencial configurável (`studytrack.essential`), sub-abas no Planejamento, atalhos no `manifest.webmanifest` e auditoria de build e cache offline.
6. **Governança & Qualidade:** ESLint 9 configurado via Flat Config para TypeScript/Preact/Prettier, `npm run check:types` limpo (0 erros) e `npm run test:fast` 100% aprovado com 1.256 testes unitários.
