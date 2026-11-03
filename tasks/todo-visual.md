# Tarefas: Implementação visual do StudyTrack

Contexto, achados e decisões: `tasks/plan-visual.md`. Antes de ler código, rodar `graphify query "<pergunta>"` (regra do CLAUDE.md); depois de editar, `graphify update .`.

**Verificação padrão** (vale para toda tarefa; abaixo só aparece o que é específico):
- `npm run test:unit`, `npm run check:types`, `npm run check:types:tests`
- `npm run build` (bundles versionados; o E2E roda contra o bundle)
- E2E dos specs afetados; no fim de cada fase, a suíte E2E completa (`npx playwright test`)
- `node scripts/audit-test-suite.mjs --check` quando um teste mudar
- Checklist do plano: axe nos dois temas, contraste ≥ 4,5:1 (texto) e ≥ 3:1 (borda/ícone), nenhuma cor literal fora de `styles/tokens.css`, nenhum emoji, sem rolagem horizontal a partir de 320 px
- Larguras de conferência: 320, 375, 1440 e 1920 px

---

## Checkpoint 0 — Decisões (sem código) — FECHADO em 01/11/2026

- [x] Identidade: **continua o extrato** (01/11/2026). Mesma metáfora em outra paleta; ver `plan-visual.md` › Checkpoint 0
- [x] Fraunces **fica** (01/11/2026) no título, no saldo e nos valores do cabeçalho
- [x] `theme-salvia.css` no repositório (`tasks/theme-salvia.css`, 01/11/2026); 46 pares de contraste AA nos dois temas
- [x] Destaque: separar `--gold-bright` (01/11/2026). Sobre o cabeçalho → `--brand-on-header` `#A8D3B8`; sobre papel → `--gold`; atenção → âmbar
- [x] Âmbar fora da navegação nos dois temas (coberto pela separação do `--gold-bright`)
- [x] Gráficos acima da tabela, com a tabela recolhida em "Ver dados" (01/11/2026)
- [x] Abas no celular: ícone com texto até 375 px e só ícone (com `aria-label`) abaixo disso (01/11/2026)

---

## Fase 1 — Fundação visual (um PR, um commit por tarefa; snapshots só na V6)

### V1: Tokens Sálvia + cores fixas do app.css
**Descrição:** Trocar os valores de `:root` e do tema escuro em `styles/tokens.css` pelos de `tasks/theme-salvia.css`, mantendo os nomes (`--navy`, `--gold`…). Definir `--action-danger-hover-text` no claro (o Sálvia não traz) e separar `--gold-bright` conforme a decisão do Checkpoint 0. Unificar o foco: `--wizard-focus` passa a seguir o anel do app. Tokenizar todas as cores literais de `styles/app.css`: os 7 rgba citados no plano, as 18 ocorrências de `rgba(246,243,236)` (texto claro sobre o cabeçalho), `rgba(12,20,30)`, os 5 hex e `#fff`. Ajustar `--chart-series-primary/secondary/target`.
**Aceite:**
- [x] `grep -E "#[0-9a-fA-F]{3,8}\b|rgba\(" styles/app.css` só encontra usos de `color-mix`/token (zero literais)
- [x] Musgo é a ação principal; âmbar só em prontidão, contagem e atrasos; vermelho só em risco
- [x] Os 22 usos de `var(--gold-bright)` classificados no commit: cabeçalho → `--brand-on-header`, papel/card → `--gold`, atenção → âmbar; nenhum resta em navegação, KPIs ou decoração
- [x] `--brand-on-header` (`#A8D3B8`) nunca usado sobre papel ou card (1,53:1 no claro)
- [x] Um único anel de foco no app inteiro, assistente incluído
- [x] axe sem violações de contraste nas telas Visão Geral, Hoje e assistente, nos dois temas
**Resultado (01/11/2026, commit local):** 0 cores literais no `app.css` (35 trocadas). `--gold-bright`: 17 → `--brand-on-header`, 2 → `--gold`, 3 ficam âmbar (saldo, dias até a prova, barra da prova). Fallbacks de tokens inexistentes (`--status-success`, `--status-danger`, `--border-color`) trocados pelos que existem. axe 9/9 no claro e 9/9 no escuro: o escuro tinha 2 falhas que já existiam antes (7 regras com `color:var(--navy)` como texto, 1,01:1 no tema antigo) e passaram para `--heading`, igual ao navy no claro. Achados para depois: (1) o cabeçalho compacto mostra a prontidão em verde-sálvia, e o saldo grande em âmbar; (2) no escuro, a aba ativa (`#0C1411`) quase some no papel, como no tema antigo; (3) 57 de 58 testes de captura passaram com a paleta nova, porque a maioria aceita até 8% de pixels diferentes. A V6 precisa regerar as capturas mesmo com o gate verde.
**Verificação:** `npx playwright test tests/e2e/accessibility.spec.js`; capturas de antes e depois das 9 abas nos dois temas (sem regerar snapshots ainda)
**Dependências:** Checkpoint 0 · **Arquivos:** `styles/tokens.css`, `styles/app.css` · **Tamanho:** M

### V2: Marca fora do CSS
**Descrição:** `theme-color` no `index.html`, `theme_color`/`background_color` no `manifest.webmanifest`, favicon SVG embutido e `icons/` (192, 512, maskable, apple-touch).
**Aceite:**
- [x] Nenhuma referência ao navy `#0B2545` fora de tokens e documentação
- [x] O ícone maskable respeita a zona segura (conferir num simulador de máscara)
**Resultado (01/11/2026, commit local):** documento do ícone em `#A8D3B8` sobre musgo `#1E3F35`. `icon-192`/`icon-512` com cantos transparentes (RGBA); maskable e apple-touch com fundo até a borda (o maskable antigo tinha cantos brancos). Zona segura: quinas do documento a 184,9 px do centro, dentro do raio de 204,8 px. `theme-color` com variante `prefers-color-scheme: dark` (`#0C1411`); a meta não acompanha o tema escolhido no app quando ele difere do sistema. `pwa.spec.js` 4/4. O navy antigo só resta em `.impeccable/design.json` (documentação; atualizar na V6).
**Verificação:** `tests/e2e/pwa.spec.js` verde; manifest válido
**Dependências:** V1 · **Arquivos:** `index.html`, `manifest.webmanifest`, `icons/*` · **Tamanho:** S

### V3: Raio e respiro (4.2)
**Descrição:** Criar `--radius-card` (8 px) e `--radius-control` (6 px) no lugar de `--radius` (2 px). Manter borda só no card externo e separar blocos internos por `--surface-card-muted`. Remover caixa dentro de caixa (ex.: próxima ação dentro de "Agora").
**Aceite:**
- [x] `--radius` não é mais usado diretamente em componentes
- [x] O card "Agora" tem uma única moldura
- [x] As linhas finas entre lançamentos (sessões, questões, revisões) continuam: "menos bordas" vale para molduras de caixa, não para as linhas do extrato
- [x] Foco visível continua contornando o elemento inteiro (não cortado pelo raio)
**Resultado (01/11/2026, commit local):** `--radius` substituído por `--radius-card` (8 px, 24 molduras + `.card`, `.daily-execution-card`, `.study-recommendation`) e `--radius-control` (6 px, 35 controles). Barras, heatmap e eventos do calendário mantêm 2 px literal (marcas pequenas). Tailwind: `rounded-default` → card, `rounded` → controle; `Card` e `Dialog` passam a `rounded-default`. No "Agora", a próxima ação e o cartão de primeiro acesso perdem a moldura interna; blocos internos separados por linha. Foco: contorno 2 px com offset 2 px acompanha o raio, pai sem `overflow:hidden`. E2E `onboarding`, `visual-consolidation`, `visual-density`, `accessibility`: 49/49. Gate visual 55/58: `agora-desktop-light`, `agora-mobile-dark` e `recovery-preview-375-dark` mudam de propósito (diffs inspecionados); regenerar na V6. Não revisado: o fundo `--surface-card-muted` nos blocos internos (só a moldura saiu).
**Verificação:** E2E que medem caixas (`onboarding`, `visual-consolidation`, `visual-density`) verdes
**Dependências:** V1 · **Arquivos:** `styles/tokens.css`, `styles/app.css`, `src/ui/primitives/card.tsx` · **Tamanho:** M

### V4: Tipografia (4.1)
**Descrição:** IBM Plex Sans em botões, abas, textos de apoio e metadados; mono só em números, datas, durações e códigos; caixa-alta só em rótulos de seção; corpo 15–16 px no celular (piso de 12 px só para rótulos). Revisar os 198 usos de `var(--font-data)` em `styles/app.css`.
**Aceite:**
- [x] Lista no commit de quais classes mantêm mono (números/datas/durações/códigos) e quais passaram para Sans
- [x] Título, saldo da prontidão e valores dos KPIs continuam em Fraunces; datas e durações continuam em mono (as três vozes do DESIGN.md ficam). Correção do plano: o cronômetro já era Fraunces ("valores" no DESIGN.md) e continua assim
- [x] Nenhum texto de corpo abaixo de 15 px em 375 px (o `body` e `--text-body`; ver limite abaixo)
**Resultado (01/11/2026, commit local):** 290 regras com mono (198 por token + 92 com `'IBM Plex Mono'` escrito à mão, agora todas por `var(--font-data)`). 51 mantêm mono, 239 passaram para Sans; lista completa no corpo do commit. `.btn` e `.tab-btn` em Sans 13 px peso 500, sem espaçamento extra; abas, âncoras da Visão Geral e dois `summary` perderam a caixa-alta (cabeçalhos de tabela e rótulos de seção mantêm). Em ≤600 px `--text-body` passa a 15 px. Teste novo em `visual-consolidation.spec.js` confere aba e botão (Sans), KPI e cronômetro (Fraunces), duração (mono) e corpo ≥ 15 px em 375. Conferido em 1440 e 375 px. Limite: textos de apoio com tamanho próprio (12–13 px, ex.: metadados da próxima ação) não foram aumentados; ficam para a Fase 4 (conforto).
**Verificação:** teste E2E novo que confere `font-family` de 3 elementos-chave (botão, KPI, cronômetro); conferência visual em 375 e 1440 px
**Dependências:** V1 · **Arquivos:** `styles/tokens.css`, `styles/app.css` · **Tamanho:** M

### V5: Botões em três níveis (4.3)
**Descrição:** Variante `tonal` em `button.tsx` (fundo sálvia, sem borda) e o equivalente em `.btn`; terciário como link com ícone. Aplicar na Visão Geral e em Hoje: um primário por área.
**Aceite:**
- [x] `button.tsx` aceita `variant="tonal"`, com teste unitário
- [x] Visão Geral e Hoje têm no máximo um botão primário por card
- [x] Contraste do `tonal` ≥ 4,5:1 nos dois temas
**Resultado (01/11/2026, commit local):** `.btn.tonal` (fundo sálvia, sem borda) e `.btn.tertiary` (link sublinhado, sem fundo nem moldura); tokens `--action-tonal-bg/-text/-hover` nos dois temas. `Button` aceita `tonal` e `tertiary`, com teste unitário. Hoje: "Iniciar" dos itens do Plano de hoje, recomendações além da primeira e "Revisar" das listas passaram a tonal; Visão Geral já tinha um primário por card. Contraste do texto: tonal 9,7:1 (claro) e 6,3:1 (escuro); hover 8,4:1 e 5,1:1. Auditoria por script: cada card de Visão Geral e Hoje com no máximo um botão preenchido (o "Agenda" preenchido é o estado ativo do seletor Agenda/Sequência, não uma ação). axe claro e escuro verdes. O terciário ainda não tem uso: entra com os ícones da Fase 2. Ícones nos botões e o "✓" de "Revisar" ficam para a Fase 2.
**Verificação:** unit do botão; axe
**Dependências:** V1 · **Arquivos:** `src/ui/primitives/button.tsx`, `styles/app.css`, telas de Visão Geral e Hoje · **Tamanho:** M

### V6: Documentação e snapshots
**Descrição:** Reescrever as cores, a tipografia e o raio do DESIGN.md (tokens no topo e "Creative North Star", conforme o Checkpoint 0) e do DESIGN-SYSTEM.md (incluindo `--border-control`). Regerar os snapshots `win32` e `linux` depois de inspecionar cada diff.
**Aceite:**
- [x] DESIGN.md mantém a North Star "O Extrato Bancário" e reescreve só a paleta ("navy, dourado, papel" → nomes do Sálvia) e os tokens do topo
- [x] Cada snapshot regerado foi aberto e conferido (lista no commit)
- [x] Suíte E2E completa verde, salvo falhas já existentes antes (registrar quais)
**Resultado (01/11/2026):** DESIGN.md (tokens do topo, paleta, tipografia em três vozes revista, raio, botões em três níveis, regras do Sálvia sobre Musgo e do Âmbar), DESIGN-SYSTEM.md (`--border-control`, raios, níveis de botão, `--text-label` em Sans) e `.impeccable/design.json` reescritos; North Star mantida. 24 snapshots `win32` regerados e conferidos lado a lado: achievement-projection (3), adherence (3), agora (2), desempenho-resumo-mobile (2), help-map-375, help-matrix-375, hero-mobile-375, metas-mobile (2), recovery-preview (3), sustainability (3), today (3). O `desempenho-resumo` também traz a troca de texto do commit `cdbd486`, que já estava no `main`. A conferência revelou o progresso de Metas em Sans; voltou para mono. Suíte completa: 250 passaram; 22 falharam (21 snapshots, agora regerados, e `action-first-mobile`, que já falhava antes deste trabalho). Gate visual 58/58. Limites: os 14 snapshots `linux` não foram regerados (sem Docker; usar o workflow "Generate visual baselines"); snapshots `win32` que mudaram dentro da tolerância de 8% (ex.: `metas-desktop`, `desempenho-resumo-desktop`) continuam com a imagem antiga.
**Verificação:** `npm run test:visual`; `npx playwright test`; demo conferida aba por aba
**Dependências:** V1–V5 · **Arquivos:** `DESIGN.md`, `DESIGN-SYSTEM.md`, `.impeccable/design.json`, `tests/e2e/*-snapshots/*` · **Tamanho:** M

### Checkpoint 1
- [x] Suíte E2E completa e gate visual verdes
- [x] Revisão humana das capturas antes/depois nos dois temas (aprovada em 01/11/2026)
- [x] Decidir se o renome de tokens (`--navy` → `--brand`…) entra agora ou fica para depois: entrou agora
**Renome (01/11/2026):** `--navy` → `--brand`, `--on-navy` → `--on-brand`, `--blue` → `--brand-secondary`, `--gold` → `--accent`, `--gold-bright` → `--attention`, nos tokens, no `app.css`, no tema Tailwind (`bg-brand`, `text-on-brand`, `border-accent`…), nos componentes TSX, nos testes e na documentação. Gate visual 58/58 e unitários 1182/1182. Snapshots linux: o workflow "Generate visual baselines" só regravou os 4 `hero` (os outros 10 passam dentro da tolerância de 8% e continuam na paleta antiga). Achado: `--gold-deep` (17 usos) e `--paper-soft` (7) nunca foram definidos; os elementos herdam a cor do texto e ficam sem fundo. Não mexido no renome.

---

## Fase 2 — Ícones

### I1: Ícones novos + medição do bundle
**Descrição:** Adicionar os cerca de 30 ícones da tabela 2.2 a `scripts/generate-tabler-icons.mjs` e regenerar. Criar uma medição real de tamanho (ex.: `scripts/report-bundle-size.mjs` imprimindo os bytes de cada `src/*.bundle.js`), porque `check:bundle` não mede tamanho.
**Aceite:**
- [x] Todos os nomes da tabela 2.2 existem em `tabler-icons-data.ts`
- [x] A medição imprime o tamanho do `app.bundle.js` (base: 1.325.924 bytes) e o aumento fica registrado no PR
**Resultado (01/11/2026):** 31 ícones novos (30 da tabela 2.2 + `circle-dashed` para evidência insuficiente); 110 no total. `npm run report:bundle` (`scripts/report-bundle-size.mjs`) imprime bytes e gzip de cada bundle. `app.bundle.js`: 1.326.143 → 1.332.675 bytes (+6.532; gzip +1.735) com I1 e I2 juntas; `help.bundle.js` +6.200 bytes, porque carrega a própria cópia dos ícones. Teste unitário confere os 54 nomes da tabela.
**Verificação:** unit que confere a presença dos ícones; a medição roda
**Dependências:** Checkpoint 1 · **Arquivos:** `scripts/generate-tabler-icons.mjs`, `src/ui/primitives/tabler-icons-data.ts`, script de medição · **Tamanho:** S

### I2: Ícones nos primitivos
**Descrição:** Badge com ícone automático por variante; EmptyState com prop `icon` (32 px, traço 1,5); MetricCard com `icon`; Button com `iconLeft`/`iconRight`.
**Aceite:**
- [x] Badge de sucesso, atenção, perigo, info e evidência insuficiente mostra ícone e texto (a cor não é o único sinal)
- [x] Ícones decorativos com `aria-hidden="true"`
- [x] Tamanhos: 14 px em botões, 16 px em abas, 20 px em títulos de card, 32 px em vazios (nos primitivos: 14 px em Badge, Button e MetricCard; 32 px com traço 1,5 no EmptyState; 16 e 20 px entram com abas e títulos na I3/I4)
**Resultado (01/11/2026):** Badge com ícone automático por estado (`circle-check`, `alert-triangle`, `alert-circle`, `info-circle`, `circle-dashed`; `icon` troca ou `false` remove) e texto em Sans; EmptyState com `icon`; MetricCard com `icon`; Button com `iconLeft`/`iconRight` e `gap`. Unitários de cada primitivo. O tema Tailwind não tinha `info-bg`, então o badge informativo ficava sem fundo: adicionado (`--color-info-bg`), contraste 6,2:1 nos dois temas. Conferido renderizando os primitivos com o CSS do app nos dois temas. axe 13/13, gate visual 58/58. Os badges só aparecem em modais e visões secundárias; nenhuma aba principal usa os primitivos ainda (I3–I5).
**Verificação:** unit de cada primitivo
**Dependências:** I1 · **Arquivos:** `src/ui/primitives/{badge,empty-state,metric-card,button}.tsx` · **Tamanho:** M

### I3: Abas e barra inferior com ícones
**Descrição:** Ícone antes de cada aba e no menu "Mais"; no celular, ícone com texto até 375 px e só ícone (com `aria-label`) abaixo disso.
**Aceite:**
- [x] Botões só com ícone têm `aria-label` e área de toque ≥ 44 × 44 px (nome acessível vem do texto escondido só visualmente, sem `aria-label` duplicado)
- [x] Sem rolagem horizontal a 320 px
**Resultado (01/11/2026):** ícone de 16 px antes de cada aba, no "Mais" (`dots`) e nos itens do menu, em SVG estático no `index.html`. Na barra inferior o ícone vai acima do texto (20 px); abaixo de 375 px o texto fica oculto só visualmente. Entre 761 e 1199 px os ícones das abas do topo somem, porque os rótulos sozinhos já ocupam a linha (sem isso as abas passavam a rolar em 1024–1100 px). Corrigido: o clique no ícone do "Mais" abria e fechava o menu na hora (o listener do documento comparava `event.target` com o botão). E2E novo na `visual-consolidation.spec.js` (5 botões com ícone, nome, 44 px, sem rolagem a 320 px, menu Mais pelo ícone).
**Verificação:** E2E de navegação e de tour (`onboarding.spec.js`) verdes; axe
**Dependências:** I2 · **Arquivos:** `index.html`, `src/ui/navigation/*`, `styles/app.css` · **Tamanho:** M

### I4: Cronômetro, sessões, revisão e botões de criar
**Descrição:** Ícones em Iniciar/Pausar/Zerar/Finalizar/Foco/Janela flutuante, nos tipos de sessão, na avaliação da revisão (Errei, Difícil, Bom, Fácil) e em "+ Nova disciplina" e similares (trocar `+` por `plus`).
**Aceite:**
- [x] Nenhum `+`, `→` ou `▾` escrito como texto nesses botões
- [x] Nomes acessíveis inalterados (os E2E que buscam por nome continuam passando); os botões de criar perdem o "+ " do nome ("Nova disciplina")
**Resultado (01/11/2026):** cronômetro (Iniciar, Pausar, Zerar, Finalizar, Modo foco, Janela flutuante), avaliação da revisão (Errei, Difícil, Bom, Fácil), 6 botões de criar no `index.html` e 3 nos renderers com `plus`, e tipo de sessão no histórico (`book`, `repeat`, `pencil`, `clipboard-text`). O "⛶" do modo foco virou `focus-2` (e `x` para sair). Classe `.icon-inline` (14 px). Os tipos de sessão no `<select>` ficam sem ícone (opções não aceitam SVG). E2E de sessões, cronômetro, revisões e metas: 34/34; gate visual 58/58.
**Verificação:** E2E de cronômetro, sessões e revisões
**Dependências:** I2 · **Arquivos:** `index.html`, controlador do timer, `study-sessions-renderer.ts`, modal de revisão · **Tamanho:** M

### I5: Dados, filtros, demo e alertas
**Descrição:** Importar/exportar, nuvem e dados, "Filtros ▾" e links "… →", faixa de demonstração, alertas por gravidade.
**Aceite:**
- [x] `grep -rn "▾\|→" index.html src --include=*.ts --include=*.tsx` não encontra setas usadas como ícone (setas dentro de frases continuam)
- [x] Todo alerta mostra ícone de gravidade
**Resultado (01/11/2026):** ícones em importar/exportar (`file-import`, `download`, `file-export`, `file-type-pdf`), nuvem e dados (`cloud`, `cloud-upload`, `cloud-download`, `database`, `trash`), faixa da demo (`flask`, `route`, `refresh`, `logout`; no celular só texto, porque os ícones empurravam a faixa para 337 px a 320 px), "Filtros" e "Importar" com `filter`/`file-import` + `chevron-down`, 6 links "… →" com `arrow-right`, botões do onboarding, tour ("Próximo"/"Concluir" com `arrow-right`/`check`), primeiros passos, ajuda, seta de transferência, recolher disciplina (`chevron-right`/`chevron-down`) e marcadores do foco semanal (↑ → ↓ ○ viraram ícones). Alertas: `renderBadgeIcon` e `ALERT_SEVERITY_VARIANT` junto do `Badge` dão o mesmo ícone por gravidade aos alertas da Visão Geral e aos selos do diagnóstico. Setas que sobram ficam em frases ("antes → depois") e no fluxo "Prova × Você → Prioridade → Ação → Resultado" da Ajuda. E2E de dados, demo, diagnóstico, onboarding e ciclo estratégico: 76/76; gate visual 58/58. Bundle após I3–I5: `app.bundle.js` 1.333.779 bytes (+7.636 sobre o início da Fase 2; gzip +2.071). Achado: `toggleFilterPanel` está no registro de ações mas nenhum controlador o implementa, então o botão "Filtros" das sessões no celular não faz nada.
**Verificação:** E2E de backup, demo e diagnóstico; medição do bundle
**Dependências:** I2 · **Arquivos:** `filter-panel.ts`, `src/features/demo/*`, `consolidated-diagnosis-renderer.ts`, `diagnosis-renderer.ts`, `index.html` · **Tamanho:** M

### Checkpoint 2
- [x] Suíte E2E completa e gate visual verdes; snapshots inspecionados (I3–I5: E2E de dados, demo, diagnóstico, onboarding e ciclo estratégico 76/76; gate visual 58/58)
- [x] Aumento do bundle da fase registrado (`app.bundle.js` +7.636 bytes sobre o início da Fase 2; gzip +2.071)

---

## Fase 3A — Gráficos de prioridade alta

### G1: Primitivos de gráfico + prontidão
**Descrição:** Criar `Sparkline`, `RingGauge`, `BulletBar` e `StackedBar` como componentes Preact `.tsx` em SVG puro (AGENTS.md:13), usando os tokens `--chart-series-*`, com versão textual (valores e unidades) e uma saída em string para os renderers antigos. Primeiro uso: anel de 0 a 100 + sparkline de 8 semanas no Índice de Prontidão.
**Aceite:**
- [x] Cada primitivo tem `role="img"` com descrição textual, e o valor aparece também como texto
- [x] Sem prontidão (dados insuficientes), o anel mostra o estado vazio e não um 0
- [x] Âmbar só quando abaixo da meta
**Resultado (01/11/2026):** `RingGauge`, `Sparkline`, `BulletBar` e `StackedBar` em `src/ui/primitives/charts/charts.tsx` (Preact, SVG puro, cores por tom via CSS e tokens `--chart-series-*`), com saída em string (`renderRingGauge`…) para renderers antigos; geometria pura em `geometry.ts`. Lacunas na série interrompem a linha; ponto isolado vira marcador. Meta da prontidão: `READINESS_ON_TRACK_MIN = 70`, o início da faixa "Preparação avançada" que já existia (`classifyApprovalScore`); não há meta de prontidão configurável. Hero: anel de 56 px + sparkline das 8 semanas (`readinessWeeklyTrend`, último valor salvo de cada janela de 7 dias no escopo do concurso ativo; a semana atual usa o valor calculado, para a linha terminar no número ao lado). Número em âmbar só abaixo de 70, sálvia a partir de 70, neutro sem dados. Unit: 7 testes novos (geometria em 0, 50, 100, acima do máximo e inválidos; vazio; tom; tendência por escopo). E2E novo da prontidão (vazio e com dados).
**Verificação:** unit de cada primitivo (geometria em 0, 50 e 100 e entradas inválidas); E2E da prontidão
**Dependências:** Checkpoint 2 · **Arquivos:** `src/ui/primitives/charts/*.tsx`, `readiness-history-renderer.ts` · **Tamanho:** M

### G2: Primeira tela orientada à ação (4.4)
**Descrição:** No celular, topo compacto (anel, dias até a prova, número do plano) e próxima ação com "Iniciar" visível sem rolar em 375 × 812. No desktop, reduzir topo e busca (hoje cerca de 630 px antes da próxima ação).
**Aceite:**
- [x] Em 375 × 812, o botão "Iniciar" da próxima ação está dentro da primeira tela (teste E2E com `boundingBox`)
- [x] Em 1440 × 900, a próxima ação começa acima de 400 px
- [x] Primeiro acesso: o card de boas-vindas também aparece sem rolar
**Resultado (01/11/2026):** só CSS, sem reordenar o HTML. Medidas (antes → depois): celular com demo, "Iniciar" 815–857 → 694–736 (barra inferior começa em 756); celular no primeiro acesso, card de boas-vindas 719–955 → 458–694; desktop no primeiro acesso, próxima ação 594 → 385; desktop com demo, 676 → 478 (394 descontando a faixa da demo, que só existe nesse modo). Desktop: cabeçalho mais baixo, seis contadores numa linha, selo da demo ao lado do eyebrow, data, barra e contagem numa linha só, menos margem na busca e no painel. Celular: contadores e a linha "dias totais" saem do topo (estão em Disciplinas e Agenda); a data da prova fica, porque é o único lugar para editá-la. O convite "Veja o StudyTrack funcionando" some enquanto a Visão Geral mostra o card de boas-vindas, que já oferece a demo. Dois E2E novos de primeira tela. Efeito colateral bom: `action-first-mobile.spec.js`, que falhava desde antes deste trabalho, passou. Suíte completa: 270 passaram, 6 falhas de captura (hero e "Agora") conferidas e regeradas no Windows.
**Verificação:** E2E novo de primeira tela; `tests/e2e/onboarding.spec.js`
**Dependências:** G1 · **Arquivos:** cabeçalho do extrato, `styles/app.css`, `index.html` · **Tamanho:** M

### G3: Execução de hoje
**Descrição:** Anel de planejado × realizado em minutos no lugar de "0%" e da linha fina.
**Aceite:** [x] Texto "N de M min" ao lado do anel · [x] Sem plano, nenhum anel vazio sem explicação
**Resultado (01/11/2026):** anel de 44 px (`RingGauge`, sem número dentro) no lugar da barra nos três lugares que mostravam o progresso do dia: resumo da aba Hoje, card "Execução de hoje" da Visão Geral e o exemplo ilustrativo da ajuda. Ao lado, "45min de 1h30 do plano · 50%" em mono; no card, N é o tempo do plano já cumprido (planejado − restante), coerente com o percentual. Sem plano, o anel não é desenhado e fica só o texto "Plano diário ainda não montado". Sem meta, o anel não usa âmbar. Unit e E2E atualizados (texto e nome acessível do anel); 5 capturas win32 conferidas e regeradas (`today-320/375/430`, `agora-desktop-light`, `agora-mobile-dark`). Bundle da ajuda +1,4 KB.
**Dependências:** G1 · **Arquivos:** `TodayExecutionSummary.tsx`, `daily-execution-renderer.ts` · **Tamanho:** S

### G4: Acerto por disciplina
**Descrição:** BulletBar com a marca da meta; abaixo da meta em âmbar. Tabela recolhida em "Ver dados".
**Aceite:** [x] Tabela continua acessível em "Ver dados" · [x] Disciplina abaixo da meta tem texto além da cor
**Resultado (01/11/2026):** o acerto por disciplina só aparece no fechamento semanal (Planejamento > análise da semana); a tabela de `renderSubjectPerformanceRows` em `simulations-renderer.ts` não tem chamador. Cada disciplina ganha uma `BulletBar` das questões pessoais da semana com o traço da meta; abaixo da meta, barra e veredito em âmbar ("10 p.p. abaixo da meta"). Com menos de dez questões não há traço nem âmbar ("amostra insuficiente"); sem questões, só "sem dados". Meta, questões e simulados completos numa tabela (`th scope`) em "Ver dados". Unit do renderer.
**Dependências:** G1 · **Arquivos:** `subject-accuracy-renderer.ts` · **Tamanho:** S

### G5: Carga da Agenda de Revisões
**Descrição:** Barras de carga diária dos próximos 30 dias, com as atrasadas em âmbar.
**Aceite:** [x] Dia sem revisão aparece como barra zero, não como buraco · [x] Atrasadas somadas num rótulo de texto
**Resultado (01/11/2026):** `buildReviewLoad` + `renderReviewLoad` em `reviews-renderer.ts` (`review-health.ts` mede saúde de cada revisão, não carga, e ficou intacto). 30 colunas de hoje a +29 dias, com as atrasadas numa coluna âmbar separada à esquerda; dia vazio é um traço de 1 unidade em tom neutro. Rótulo: "7 revisões atrasadas · 25 revisões nos próximos 30 dias, pico de 1 em 02/11/2026", repetido no nome acessível. Respeita os filtros da agenda; some quando não há pendências. O "⟳" do botão "Gerar a partir dos concluídos", que escapou da I5, virou ícone.
**Dependências:** G1 · **Arquivos:** `reviews-renderer.ts`, `review-health.ts` · **Tamanho:** S

### G6: Status nos blocos de disciplina
**Descrição:** Barra empilhada (não iniciado, em andamento, revisão, concluído) + sparkline de acerto em cada bloco.
**Aceite:** [x] Contagens em texto ao lado da barra · [x] Sem regressão de desempenho com as 17 disciplinas da demo
**Resultado (01/11/2026):** faixa `.subject-overview` logo abaixo do cabeçalho de cada bloco (visível mesmo recolhido): `StackedBar` com legenda "Concluído 8 (40%) · Revisão 4 (20%) · Em andamento 5 (25%) · Não iniciado 3 (15%)", em gradação da mesma cor (100%, 60%, 25%, vazio) para não inverter no tema escuro; `Sparkline` do acerto semanal em questões (8 semanas, `buildSubjectWeeklyAccuracy`, uma passada nas questões para todas as disciplinas). Como as disciplinas têm semanas sem questões, a tendência usa `connectGaps` (a linha atravessa a lacuna, cada ponto fica na sua semana). Descrição das tendências passou a dizer "com dados em N de 8 períodos" e "%" sem espaço. Desempenho, troca de aba para Disciplinas com 17 blocos: mínimo 167 ms antes, 169–173 ms depois (mediana dentro do ruído).
**Dependências:** G1 · **Arquivos:** `SubjectBlock.tsx`, `topic-metrics.ts` · **Tamanho:** M

### Checkpoint 3
- [x] Suíte E2E completa, gate visual e axe verdes
- [x] Usar os 5 gráficos antes de planejar os 7 de prioridade média e os 4 de baixa (feito; decisão abaixo, G7–G12 entregues)

**Verificação (01/11/2026):** em `08b5326`, 1196 unitários, 277 E2E e gate visual (58) verdes. Axe WCAG A/AA nas seis áreas com gráfico (topo, execução na Visão Geral, resumo de Hoje, blocos de disciplina, carga de revisões, acerto por disciplina) em 1440 claro e 375 escuro, com demo: uma violação, `scrollable-region-focusable` na tabela de "Ver dados" da G4 no celular; corrigida (região rolável com `tabindex="0"`, `role="region"` e nome), agora 0. Folha de revisão: `tasks/checkpoint-3/graficos-alta.png`.

**O que o uso mostrou até aqui:**
- Séries por disciplina e por semana são esparsas (na demo, 2 de 8 semanas com questões é comum). Gráfico que depende de série densa por disciplina tende a virar pontos soltos; foi preciso `connectGaps` na G6.
- O acerto por disciplina mora no fechamento semanal, não na aba Questões como dizia a tabela original; quem procura na aba Questões não encontra.
- A coluna diária da G5 é desenhada à mão no renderer. Se mais um gráfico de colunas entrar, vale virar primitivo.

**Backlog para decidir (da tabela original):**

| Prioridade | Tela | Gráfico | Peça nova |
|---|---|---|---|
| Média | Desempenho · Foco e energia | % de sessões com foco profundo por turno | nenhuma (`BulletBar`) |
| Média | Planejamento · Matriz Edital × Domínio | dispersão 2×2, bolha pelo nº de tópicos | primitivo de dispersão |
| Média | Planejamento · Estimativa de ritmos | burn-up: cobertura real × ritmo necessário | linha com duas séries |
| Média | Planejamento · Disponibilidade semanal | barras por dia: capacidade × planejado × realizado | colunas agrupadas |
| Média | Planejamento · Histórico de metas | colunas por semana com a linha da meta | colunas (extrair da G5) |
| Média | Questões · Perfil de erros | Pareto: barras ordenadas + % acumulado | barras + linha |
| Média | Simulados · Comparação | inclinação entre os dois últimos simulados | slope chart |
| Baixa | Calendário · Mês | intensidade da carga em cada célula | nenhuma (CSS) |
| Baixa | Planejamento · Evolução das prioridades | ranking (bump) das 5 maiores lacunas | primitivo novo |
| Baixa | Questões & Simulados · Calibração | funil gerada → executada → concluída | barras |
| Baixa | Planejamento · Retratos semanais | sparklines em cada retrato | nenhuma (`Sparkline`) |

**Decisão (01/11/2026):** seguir a recomendação abaixo. Entram G7–G12; ficam fora a dispersão da Matriz, a comparação de simulados, o ranking de lacunas, o funil de calibração e as sparklines dos retratos.

**Recomendação aprovada:** entrar com burn-up, histórico de metas, disponibilidade semanal, foco por turno e Pareto (os que respondem "estou no ritmo?" e "onde perco pontos?", e reaproveitam peças). Adiar a dispersão da Matriz (primitivo novo; a lista por quadrante já informa) e a comparação de simulados (dois simulados por disciplina é amostra pequena). Dos de baixa, só a intensidade no calendário, que é barata; os outros três ficam fora.

---

## Fase 3B — Gráficos aprovados no Checkpoint 3

### G7: Primitivo de colunas + histórico de metas
**Descrição:** extrair as colunas da G5 para `ColumnChart` (barra zero como traço, coluna de destaque, linha de meta opcional) e usar no histórico de 8 semanas do Planejamento.
**Aceite:** [x] Carga de revisões continua igual usando o primitivo · [x] Semana abaixo da meta tem texto além da cor · [x] Valores em texto acessível
**Resultado (01/11/2026):** `ColumnChart` + `columnGeometry` (traço de 1 unidade no zero, `separated` para a coluna de atrasadas, linha de meta tracejada, tons primary/soft/attention/muted). O teste da geometria pegou um bug antes de chegar à tela: as colunas não avançavam pela própria largura. Histórico de metas (`goal-history-chart-renderer.ts`): três gráficos acima da tabela (tópicos, questões, simulados), da semana mais antiga à atual; semana encerrada abaixo da meta em âmbar, semana atual neutra, sem meta não há linha nem âmbar; legenda "N de 7 semanas encerradas na meta" e nome acessível com o valor de cada semana. A tabela continua.
**Arquivos:** `charts.tsx`, `geometry.ts`, `reviews-renderer.ts`, `weekly-adherence-renderer.ts` · **Tamanho:** M

### G8: Disponibilidade semanal
**Descrição:** colunas por dia da semana com capacidade, planejado e realizado.
**Aceite:** [x] Dia sem capacidade aparece como zero · [x] Números por dia em texto
**Resultado (01/11/2026):** a "disponibilidade semanal" com dados de planejado e realizado é o quadro "Planejado × realizado nesta semana" do Planejamento (`plan-execution-renderer.ts`), não a grade de horas. `buildPlanExecution` passa a dar `capacityMinutes` por dia (pela chave `getDay()` de `horasPorDia`). Três colunas por dia: capacidade (neutra), planejado (sálvia clara; âmbar só se passar da capacidade) e estudado. Antes o planejado usava a série secundária, que é âmbar. A lista por dia ficou como registro em texto: "Capacidade 2h00 · Sem plano / 3h11".
**Arquivos:** `WeeklyAvailabilityGrid.tsx`, `PlanExecutionCard.tsx` · **Tamanho:** S

### G9: Ritmo até a prova (burn-up)
**Descrição:** cobertura real acumulada × ritmo necessário até a data da prova.
**Aceite:** [x] Sem data de prova, explica em vez de desenhar · [x] Diferença para o ritmo em texto
**Resultado (01/11/2026):** `computeRitmo` devolve também total, concluídos, `daysToExam` (antes se perdia sem conclusões recentes) e a série de concluídos no fim de cada uma das últimas 8 semanas. `rhythm-burnup-renderer.ts`: concluídos (linha cheia), ritmo atual projetado (tracejado; âmbar quando abaixo do necessário) e ritmo necessário até a prova (pontilhado), com "Hoje" no eixo. Texto: "Ritmo atual: 2 tópicos por semana; necessário para terminar até a prova: 15,1 por semana. No ritmo atual, 137 de 305 tópicos na data da prova." Sem prova futura ou com tudo concluído, não desenha e o texto existente explica.
**Arquivos:** `goals-renderer.ts`, `coverage.ts` · **Tamanho:** M

### G10: Foco profundo por turno
**Descrição:** `BulletBar` de % de sessões com foco profundo em manhã, tarde e noite.
**Aceite:** [x] Turno sem sessões não vira 0% · [x] Percentual e nº de sessões em texto
**Resultado (01/11/2026):** o foco por turno não aparecia em lugar nenhum (só o alerta de fadiga usava a análise). Novo bloco em Desempenho > Consistência. `ShiftPerformanceStats.focusRatedCount`: o percentual é sobre sessões com avaliação de foco, e `sessionsCount` também contava sessões só com questões, o que daria 0% falso. Turno sem avaliação mostra "sem dados" e "sem sessões avaliadas". A nota diz por que um turno é o melhor ("Maior acerto em questões" ou "Mais foco profundo"). A demo não registra foco, então lá aparece o estado vazio; coberto por unit.
**Arquivos:** `focus-energy-analytics.ts` e seu renderer · **Tamanho:** S

### G11: Pareto do perfil de erros
**Descrição:** barras ordenadas por quantidade com % acumulado.
**Aceite:** [x] Ordem decrescente · [x] Acumulado em texto
**Resultado (01/11/2026):** o perfil de erros (Questões > Análise de desempenho por tópico e erros) já ordenava; cada barra ganha o traço do acumulado e o texto "acumulado N%", e a nota diz quantas categorias somam 80% quando são menos que todas.
**Arquivos:** `error-analysis-renderer.ts`, `subject-error-metrics.ts` · **Tamanho:** S

### G12: Intensidade de carga no calendário
**Descrição:** cada dia do mês com fundo proporcional aos minutos planejados.
**Aceite:** [x] Contraste do texto preservado nos dois temas · [x] Carga em texto no nome acessível do dia
**Resultado (01/11/2026):** os eventos do calendário são revisões, sem minutos; a intensidade usa as revisões pendentes do dia (concluídas não contam), em três níveis relativos ao dia mais cheio do mês. Fundo em mistura da série primária (8%, 16%, 26%), texto "N revisões pendentes" no número do dia (`sr-only`) e no `title`, legenda nova. Axe sem violações nos dois temas.
**Arquivos:** `calendar-renderer.ts` · **Tamanho:** S

### Checkpoint 3B
- [x] Suíte E2E completa, gate visual e axe verdes

**Verificação (01/11/2026):** 1206 unitários; 277 de 278 E2E na suíte completa (o teste do WebDAV em `recent-flows.spec.js:370`, sem relação com gráficos, falhou uma vez sob carga e passou 4 de 4 isolado); gate visual 58/58; axe WCAG A/AA nos seis gráficos em 1440 claro e 375 escuro com demo, 0 violações, sem rolagem horizontal. `app.bundle.js` 1.343.479 → 1.352.379 bytes (+8,9 KB; +3 KB gzip).

---

## Fase 4 — Conforto

### C1: Cronômetro fora da Visão Geral (4.5.1)
**Aceite:** [x] "Iniciar estudo" abre o timer (painel ou aba Hoje) · [x] Tour e E2E que usam `#overview-timer` atualizados
**Resultado (02/11/2026):** o bloco do cronômetro saiu da Visão Geral e foi para Hoje, logo depois do resumo do dia, como `#study-timer` (IDs internos mantidos). `TIMER_TAB = 'hoje'` em `timer-ui-controller.ts`; modo foco, resultado da sessão, ajuda e atalho Esc apontam para lá. Iniciar uma atividade do plano abre sempre o modo foco, de qualquer aba; ao sair, volta à aba de origem e devolve o foco ao gatilho (antes, na Visão Geral, só rolava até o card). "Iniciar estudo" do histórico vazio leva a Hoje. Bug encontrado no caminho: os controles do cronômetro (disciplina, tópico, tipo) só eram preenchidos no render da Visão Geral; a seção passou para o escopo de Hoje. O tour já descrevia o cronômetro em Hoje. Visão Geral na demo: o card do cronômetro (com seletores e ações) deixa de ocupar a tela. 11 specs E2E ajustados (trocar para Hoje antes de usar o cronômetro; Esc depois de iniciar pela Visão Geral; hash `#hoje` após salvar a sessão).
**Dependências:** Checkpoint 3 · **Tamanho:** M

### C2: Conquistas e progresso vão para Desempenho (4.5.2)
**Aceite:** [x] Links e navegação de seções apontam para o lugar novo · [x] Nenhum conteúdo some
**Resultado (02/11/2026):** conquistas, evolução do progresso, progresso por disciplina e radar saem da Visão Geral para a seção "Progresso e conquistas" no fim de Desempenho (`#performance-progress`). As quatro seções de render passam ao escopo de Desempenho; o progresso por disciplina, que era desenhado dentro do render da Visão Geral, virou `renderSubjectProgressBars`. Atalhos da Visão Geral perdem "Conquistas" e "Progresso"; a ajuda de conquistas aponta para Desempenho. Na demo: 24 conquistas, progresso, evolução e radar renderizados lá.
**Dependências:** C1 · **Tamanho:** S

### C3: Seções recolhíveis com estado lembrado (4.5.3)
**Aceite:** [x] Estado salvo por usuário (preferência de UI, não dado de estudo) · [x] Visão Geral com 3 a 4 telas de rolagem em 375 px, medidas na demo e num usuário novo
**Resultado (02/11/2026):** "Aprovação e retenção", "Estudo e sessões" e "Próximas ações" viraram `details[data-remember]` (`src/ui/remembered-sections.ts`): estado em `localStorage` (`studytrack.sectionsOpen`, com try/catch), padrão aberto a partir de 901 px e fechado no celular; atalhos e o seletor de seção abrem a seção de destino. Altura da página em 375 × 812: demo 6620 → 2775 px (3,4 telas), usuário novo 4948 → 2466 px (3,0 telas). O topo e a próxima ação continuam abertos.
**Dependências:** C2 · **Tamanho:** M

### C4: Navegação no celular (4.6)
**Descrição:** Barra inferior existente com Início, Hoje, Matérias, Agenda e Mais; aviso "Salvo" e voltar ao topo acima dela (o aviso some em 2 s); faixa da demo em uma linha com menu.
**Aceite:** [x] Nada fica coberto pela barra (conteúdo, toasts, tour) · [x] Toques ≥ 44 px
**Resultado (02/11/2026):** barra inferior com Início, Hoje, Matérias, Agenda e Mais (Agenda vira primária, Calendário vai para o "Mais"); rótulos curtos só na barra do celular, que são o nome acessível. Voltar ao topo e aviso "Salvo" ficam acima da barra (`--bottom-nav-height` medido em `syncStickyMetrics`; antes o voltar ao topo ficava sob a barra); "Salvo" fica 2 s. Faixa da demo em uma linha (62 px) com botão "Opções" (44 px, `aria-expanded`) que mostra Tour, Reiniciar e Sair. Medido em 320 e 375: botões da barra 63–76 × 56 px, controles flutuantes terminam em 691 com a barra em 703, sem rolagem horizontal.
**Dependências:** I3 · **Tamanho:** M

### C5: Cor por disciplina (4.7) — PR próprio
**Descrição:** Paleta de 8 tons em tokens (sem âmbar e sem vermelho), atribuída automaticamente e editável. Campo novo `subject.color`, com migração e backup.
**Aceite:** [x] Contraste ≥ 3:1 contra o fundo nos dois temas · [x] Nome sempre ao lado da cor · [x] Backup antigo importa sem a cor e recebe uma automática
**Resultado (02/11/2026):** schema 29. `subject.color` guarda o slot da paleta (1–8), não a cor, e cada tema mapeia o slot para `--subject-1`…`--subject-8` (Sálvia, Azul, Índigo, Violeta, Petróleo, Oliva, Ardósia, Ameixa; sem âmbar nem vermelho). Contraste contra a página: 4,66–6,56:1 no claro, 6,90–9,84:1 no escuro. `assignSubjectColors` (`src/domain/subjects/subject-color.ts`) dá à disciplina sem cor válida o slot menos usado; roda na migração v28→v29 e no `ensureStateDefaults`, que também passa pela importação de backup (cor inválida é corrigida, não rejeitada). Disciplina criada na sessão usa a posição na lista até a próxima carga. Interface: amostra antes do nome e borda esquerda do bloco na cor; seletor "Cor" com os nomes no menu de ações da disciplina. Testes: unit de domínio e migração; E2E com dados v28 (cor automática, troca para Ameixa, persistência após recarregar) e importação de backup antigo pela ponte de teste; `npm run test:full`.
**Verificação:** testes de migração e de backup; `npm run test:full`
**Dependências:** G1–G6 · **Tamanho:** M

### C6: Motivação (4.8)
**Descrição:** Heatmap de constância no topo de Hoje; sequência com ícone `flame` no cabeçalho fixo; animação discreta ao bater a meta do dia (respeitando `prefers-reduced-motion`).
**Aceite:** [x] Com `reduce`, nenhuma animação · [x] Sem emoji
**Resultado (02/11/2026):** faixa de constância de 28 dias no topo de Hoje (`consistency-strip-renderer.ts`; mesmas faixas do heatmap de Desempenho, dia só com questões conta como nível 1), com "N de 28 dias com estudo" em texto e no nome acessível. Sequência no cabeçalho fixo com o ícone `flame` (Tabler, gerado), só a partir de 1 dia; no celular fica chama e número, e o texto completo vai para leitores de tela (a primeira versão empurrava o número do plano para fora da tela em 375 px). Ao cumprir o plano do dia, o resumo de Hoje mostra "Plano do dia cumprido" e o anel pulsa uma vez (600 ms), sem animação com `reduce`.
**Dependências:** I2 · **Tamanho:** M

### C7: Redistribuir revisões atrasadas (4.9)
**Descrição:** Botão na Agenda que reparte as atrasadas nos próximos dias, respeitando a disponibilidade e os dias sem estudo. Reaproveita a prévia, a aplicação e a reversão de `src/application/recovery/`.
**Aceite:** [x] Prévia calculada em memória; nada é salvo antes de "Confirmar" (AGENTS.md:25) · [x] Desfazer disponível depois de aplicar · [x] Nenhum dia passa da capacidade
**Resultado (02/11/2026):** `src/application/recovery/` redistribui minutos do plano semanal entre disciplinas, não datas de revisão; a C7 reaproveita o padrão (prévia pura, confirmação, reversão que ignora o que mudou depois) com um alocador próprio, `application/reviews/redistribute-overdue-reviews.ts`. Capacidade do dia = horas disponíveis ÷ 20 min por revisão, descontadas as revisões já marcadas; dias sem estudo ficam de fora; as atrasadas mais antigas vão primeiro; o que não cabe em 14 dias é informado. Agenda: botão "Redistribuir N atrasadas", prévia por dia ("+3 · 3 de 3 revisões"), "Confirmar redistribuição" e, depois, "Desfazer" (em memória até recarregar).
**Verificação:** unit da alocação (dias sem estudo, capacidade cheia, nenhuma atrasada); E2E da prévia
**Dependências:** nenhuma (pode correr em paralelo) · **Tamanho:** M

### C8: Atalhos do PWA (4.10.1)
**Aceite:** [x] "Iniciar estudo" e "Registrar questões" no manifest abrem a tela certa
**Resultado (02/11/2026):** `shortcuts` no manifest: "Iniciar estudo" → `./#hoje` (onde mora o cronômetro desde a C1) e "Registrar questões" → `./#questoes`; o roteador por hash abre a aba ao iniciar. E2E em `pwa.spec.js`.
**Dependências:** nenhuma · **Tamanho:** XS

### C9: Transições e densidade (4.10.3–4)
**Aceite:** [x] Transições de 150 a 200 ms desligadas com `reduce` · [x] Densidade compacta/confortável salva como preferência
**Resultado (02/11/2026):** `--motion-duration: 160ms` em botões, abas, resumos e cards (cor, borda, sombra); com `prefers-reduced-motion: reduce`, uma regra global zera transições e animações. Densidade: botão ao lado do tema (`aria-pressed`, ícones `baseline-density-*`), `studytrack.density` no `localStorage`, aplicada antes da primeira pintura em `theme-bootstrap.js`; o modo compacto reduz a escala de espaçamento (`--space-3` a `--space-12`).
**Dependências:** Checkpoint 1 · **Tamanho:** S

### Checkpoint 4
- [x] Suíte E2E completa e gate visual verdes; demo conferida aba por aba
  - `npm run test:full` verde em 83abfbe; `npm run test:visual` 58/58.
  - Demo nas 9 abas, em 1440 px claro e 375 px escuro: axe (WCAG 2 A/AA) sem violações, nenhuma rolagem horizontal, nenhum "undefined", "NaN" ou data inválida no texto.
  - Corrigido: o botão "Experimentar demonstração" do primeiro acesso registrava `openDemoIntro()` bloqueado no console a cada clique (atributo delegado sem ação; o `onClick` já abria a demo).
  - Altura em 375 px (demo): Visão geral 2750, Agenda 3219, Calendário 2874, Instruções 3862, Questões 4684, Hoje 5923, Desempenho 6285, Disciplinas 9822 e Planejamento 27.732 px (cerca de 31 telas, alvo da F1).
- [x] Decidir o padrão do modo Essencial (F10)
  - Decidido em 02/11/2026: ligado por padrão só para quem começa sem dados; quem já tem registros continua na tela completa. A preferência pode ser trocada a qualquer momento.

---

## Fase 5 — Fluxos, clareza e confiança

### F1: Planejamento em sub-abas
**Aceite:** [x] Semana · Prova e ritmo · Metas · Fechamento · Histórico, uma de cada vez · [x] Links profundos (`#metas`, navegação de análise) abrem a sub-aba certa · [x] Altura em 375 px medida antes e depois
**Tamanho:** M
**Resultado (02/11/2026):**
- Abas acessíveis (setas, Home e End) no desktop; lista de seções no celular.
- A escolha fica na URL (`#planejamento/fechamento`).
- Âncoras, ajuda, tour, navegação de análise e fechamento semanal revelam a sub-aba do destino (`openSectionFor`).
- Altura do Planejamento em 375 px (demo): 27.732 px antes; depois, por sub-aba: Semana 8.303, Prova 6.901, Metas 6.707, Fechamento 2.127, Histórico 6.745.
- **Mudança posterior (437c19f, 02/11/2026):** as sub-abas viraram cinco blocos recolhíveis (`details.metas-subpanel`), com Plano da semana aberto. Os atalhos abrem o bloco escolhido sem fechar os outros; o endereço `#planejamento/<bloco>` e o `openSectionFor` continuam valendo.

### F2: Aviso compacto
**Aceite:** [x] "O cronômetro ainda não começou" ocupa uma linha acima da barra inferior · [x] Outros usos do mesmo componente conferidos
**Tamanho:** S
**Resultado:** o aviso ocupa só a largura do texto (225 × 33 px; antes 300 × 43) e fica 8 px acima da barra, que agora é medida. As mensagens mais longas (até 89 caracteres) quebram em 2 linhas sem cobrir a barra.

### F3: Busca no celular
**Aceite:** [x] Ícone de lupa abre a paleta de comandos · [x] Ctrl+K continua funcionando no desktop (e abre o campo também em janela estreita)
**Dependências:** I2 · **Tamanho:** S

### F4: Registrar questões em poucos toques
**Aceite:** [x] Botões de mais e menos, `inputmode="numeric"`, última disciplina lembrada · [x] Painel inferior no celular · [x] Acertos nunca maiores que resolvidas
**Resultado:** a "última disciplina" vem do registro mais recente, sem novo campo salvo. Os acertos são cortados enquanto se digita e no salvamento.
**Tamanho:** M

### F5: Resultado da sessão
**Aceite:** [x] Ao salvar, mostra variação da prontidão, revisões agendadas e meta do dia · [x] Variação calculada sem gravar nada extra
**Resultado:** prontidão e agenda são lidas em memória antes e depois do salvamento. As revisões aparecem só quando a sessão cria alguma.
**Tamanho:** M

### F6: Desfazer no lugar de confirmar
**Aceite:** [x] Lista explícita de quais ações viram desfazer e quais mantêm "Tem certeza?" · [x] Desfazer restaura o estado exato, inclusive depois do salvamento automático e da rotação de backup
**Viram desfazer** (excluem na hora; o aviso traz "Desfazer" por 10 s, pausa sob o ponteiro e aceita Ctrl+Z):
- item do calendário;
- registro de questões;
- simulado;
- revisão da agenda;
- sessão com as questões vinculadas;
- tópico arquivado sem vínculos.

**Mantêm "Tem certeza?":**
- excluir disciplina: cascata grande, exige arquivar antes;
- limpar todos os dados: exige digitar LIMPAR;
- importar backup que substitui tudo;
- descartar ou zerar o tempo do cronômetro: o tempo não está nos dados;
- manter tempo recuperado ou intervalo em segundo plano: é uma escolha, não uma exclusão;
- prévias do fechamento semanal e do replanejamento: regra de simulação sem gravação;
- conflitos de sincronização.

**Como funciona:**
- `captureUndo` (`src/application/undo/state-undo.ts`) guarda uma cópia dos dados persistentes antes da ação.
- Ao desfazer, devolve todos os dados e salva de novo. `updatedAt`, `lastBackupAt` e o cronômetro ativo ficam como estão.
- Se qualquer outro dado mudou depois da exclusão, o desfazer é recusado com aviso, para não apagar trabalho novo.
**Verificação:** unit de cada ação reversível
**Tamanho:** M

### F7: Lembrete de backup exportado — PR próprio
**Descrição:** Campo novo `lastExportAt` (o `lastBackupAt` atual é o backup automático dentro do navegador). Indicador "último backup exportado há N dias", em âmbar depois de 7 dias.
**Aceite:** [x] Quem nunca exportou vê "nenhum backup exportado" · [x] Migração e backup antigo cobertos
**Resultado (02/11/2026):**
- Schema 30 com `lastExportAt`, gravado só ao baixar o backup.
- No Gerenciamento de dados aparece "Último backup exportado hoje / ontem / há N dias", em âmbar depois de 7 dias. Quem nunca exportou vê "Nenhum backup exportado ainda", também em âmbar.
- A migração v29 → v30 grava `null`. Um backup antigo importado mostra "nenhum".
- Desfazer e recuperação não mexem no campo, assim como em `lastBackupAt`.
**Verificação:** testes de migração; `npm run test:full`
**Tamanho:** M

### F8: Fatores da prontidão como ações
**Descrição:** Substituir "—/100" por "faltam N de 5 fatores", cada fator clicável. Junta-se à T6 do plano de onboarding.
**Aceite:** [x] Cada fator leva à ação que o libera · [x] Com 5 de 5, volta o número
**Resultado:**
- Sem índice, o topo diz "faltam N de 5 fatores".
- Cada fator que falta vira um botão que abre a ação certa:
  - Cobertura → Disciplinas;
  - Domínio → novo registro de questões;
  - Retenção → Agenda;
  - Consistência → cronômetro em Hoje;
  - Simulados → novo simulado.
- A lista fica recolhida em "Como liberar os fatores", na mesma linha do status, para a próxima ação continuar na primeira tela.
- Com o índice já visível, os fatores que faltam seguem listados; com 5 de 5 a lista some.
**Tamanho:** S

### F9: Navegação lateral acima de 1280 px
**Aceite:** [ ] Abaixo de 1280 px, nada muda · [ ] Tour e E2E de abas atualizados · [ ] Conteúdo em duas colunas sem rolagem horizontal em 1440 e 1920 px
**Descartada (02/11/2026):** a barra lateral foi implementada e revertida a pedido. As abas continuam no topo em todas as larguras.
**Tamanho:** M

### F10: Modo Essencial
**Aceite:** [x] Preferência ligada por padrão para quem começa sem dados e desligada para quem já tem registros (decidido no Checkpoint 4) · [x] Cada termo técnico com dica curta · [x] Análises avançadas a um clique
**Resultado:**
- Botão "Modo essencial" ao lado da densidade.
- A preferência fica no navegador (`studytrack.essential`). O padrão é decidido uma vez, no primeiro carregamento, e a demonstração e os testes automatizados ficam no modo completo.
- Sete análises avançadas ficam atrás de "Mostrar …": mapa de lacunas, replanejamento pós-simulado, resumo e diagnóstico de Hoje, análise por tópico, Inteligência da prova, matriz Edital × Domínio e histórico de decisões.
- Os termos do topo (prontidão, conteúdo, revisões previstas, sequência) ganham um "?" com dica curta.
**Dependências:** C1–C3 · **Tamanho:** M

### F11: Carregamento por aba
**Descrição:** Dividir o `app.bundle.js` e gerar a lista de pedaços no pré-cache do `service-worker.template.js`.
**Aceite:** [x] App abre offline depois da primeira visita (teste Playwright offline) · [x] Atualização de versão troca os pedaços sem misturar versões (`pwa.spec.js`) · [x] Ganho de tamanho inicial medido
**Resultado (prova de conceito):**
- O cenário e os geradores da demonstração saíram para `src/demo.bundle.js`, carregado por `loadDemoGenerator()` só ao abrir a demo e pré-cacheado com a mesma versão do app.
- `app.bundle.js`: 1.375.432 → 1.299.693 bytes (−75,7 KB; gzip 421.092 → 401.258, −19,8 KB).
- `pwa.spec.js` abre a demo offline sem ter baixado o pedaço antes e confere que o pedaço e o pré-cache usam a versão do app.

**Próximo passo, se valer a pena:** dividir por aba exige que os controladores ligados na inicialização (`wire-*`) virem módulos assíncronos.
- Os maiores candidatos são `src/ui/tabs` (198 KB) e `src/ui/renderers` (192 KB).
- É uma refatoração L que precisa de plano próprio.
**Dependências:** I1 (medição) · **Tamanho:** L — quebrar depois de uma prova de conceito

### Checkpoint 5
- [x] Suíte E2E completa, gate visual, axe e `npm run test:full` verdes
  - `npm run test:full` verde em 7dafc53 (300 casos de navegador em UTC e 48 em São Paulo); `npm run test:visual` verde.
  - Axe WCAG 2 A/AA sem violações e nenhuma rolagem horizontal nas 9 abas em quatro cenários (demo em 1440 px claro e 375 px escuro; primeiro acesso, no modo Essencial, em 1440 px claro e 375 px escuro).
- [x] DESIGN.md e DESIGN-SYSTEM.md atualizados com tudo o que mudou
  - DESIGN.md: cor por disciplina (paleta e regra), movimento, layout (seções lembradas, blocos recolhíveis do Planejamento, barra inferior, densidade), gráficos, avisos e desfazer, modo Essencial e prontidão sem índice.
  - DESIGN-SYSTEM.md: navegação, preferências do navegador, desfazer e o que continua pedindo confirmação, primitivos de gráfico, cor por disciplina, lembrete de backup e carregamento sob demanda.

---

## Modernização Visual e Cockpit Panorâmico (Novembro 2026)

Plano Diretor: [`docs/PLANO-MODERNIZACAO-VISUAL-E-COCKPIT.md`](../docs/PLANO-MODERNIZACAO-VISUAL-E-COCKPIT.md)

### Grids Analíticos de Decisão na Visão Geral (Cockpit) & Modelos Visuais nas Demais Abas
- [x] **Grid 1: Balanço de Alocação de Tempo vs. Peso no Edital (Visão Geral)**
  - View-model: `src/application/analytics/build-allocation-balance-view-model.ts`
  - Componente: `src/ui/tabs/dashboard/AllocationBalanceGrid.tsx`
  - Testes: `tests/unit/allocation-balance-view-model.test.js`
- [x] **Grid 2: Radar de Vulnerabilidades Críticas (Visão Geral)**
  - View-model: `src/application/analytics/build-critical-vulnerabilities-view-model.ts`
  - Componente: `src/ui/tabs/dashboard/CriticalVulnerabilitiesGrid.tsx`
  - Testes: `tests/unit/critical-vulnerabilities-view-model.test.js`
- [x] **Grid 3: Diagnóstico de Domínio Volátil / Falsa Consolidação (Visão Geral)**
  - View-model: `src/application/analytics/build-volatile-mastery-view-model.ts`
  - Componente: `src/ui/tabs/dashboard/VolatileMasteryGrid.tsx`
  - Testes: `tests/unit/volatile-mastery-view-model.test.js`
- [x] **Grid 4: Detector de Platô & Retorno Decrescente (Aba Questões & Simulados)**
  - View-model: `src/application/analytics/build-plateau-detector-view-model.ts`
  - Componente: `src/ui/tabs/questions/PlateauDetectorCard.tsx`
  - Testes: `tests/unit/plateau-detector-view-model.test.js`
- [x] **Grid 5: Eficiência & Energia Cronobiológica por Turno (Aba Desempenho)**
  - View-model: `src/application/analytics/build-shift-energy-view-model.ts`
  - Componente: `src/ui/tabs/performance/ShiftEnergyCard.tsx`
  - Testes: `tests/unit/shift-energy-view-model.test.js`
- [x] **Orquestração e Montagem Declarativa Preact**
  - Integração em `dashboard-tab-controller.ts`, `questions-tab-controller.ts` e `performance-tab-controller.ts` via `mountPreact`
  - Slots semânticos adicionados em `index.html`: `#cockpitAllocationMount`, `#cockpitVulnerabilitiesMount`, `#cockpitVolatileMount`, `#plateauDetectorMount`, `#shiftEnergyMount`
  - Resiliência para execução Node em `preact-mount.ts`
- [x] **Governança, Linting e Verificação**
  - ESLint 9 integrado via Flat Config (`eslint.config.js`) cobrindo TypeScript, Preact e Prettier
  - `npm run check:types` e `npm run check:types:tests`: 0 erros
  - `npm run lint`: 0 erros e 0 warnings em 979 arquivos
  - `npm run test:fast`: 1.249 testes unitários no Node passaram 100% (45.93 s)
  - `test-tiers.json` e `test-inventory.json` sincronizados e auditados

