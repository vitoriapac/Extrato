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
- [ ] Suíte E2E completa e gate visual verdes; snapshots inspecionados
- [ ] Aumento do bundle da fase registrado

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
- [ ] Suíte E2E completa, gate visual e axe verdes
- [ ] Usar os 5 gráficos antes de planejar os 7 de prioridade média e os 4 de baixa

---

## Fase 4 — Conforto

### C1: Cronômetro fora da Visão Geral (4.5.1)
**Aceite:** [ ] "Iniciar estudo" abre o timer (painel ou aba Hoje) · [ ] Tour e E2E que usam `#overview-timer` atualizados
**Dependências:** Checkpoint 3 · **Tamanho:** M

### C2: Conquistas e progresso vão para Desempenho (4.5.2)
**Aceite:** [ ] Links e navegação de seções apontam para o lugar novo · [ ] Nenhum conteúdo some
**Dependências:** C1 · **Tamanho:** S

### C3: Seções recolhíveis com estado lembrado (4.5.3)
**Aceite:** [ ] Estado salvo por usuário (preferência de UI, não dado de estudo) · [ ] Visão Geral com 3 a 4 telas de rolagem em 375 px, medidas na demo e num usuário novo
**Dependências:** C2 · **Tamanho:** M

### C4: Navegação no celular (4.6)
**Descrição:** Barra inferior existente com Início, Hoje, Matérias, Agenda e Mais; aviso "Salvo" e voltar ao topo acima dela (o aviso some em 2 s); faixa da demo em uma linha com menu.
**Aceite:** [ ] Nada fica coberto pela barra (conteúdo, toasts, tour) · [ ] Toques ≥ 44 px
**Dependências:** I3 · **Tamanho:** M

### C5: Cor por disciplina (4.7) — PR próprio
**Descrição:** Paleta de 8 tons em tokens (sem âmbar e sem vermelho), atribuída automaticamente e editável. Campo novo `subject.color`, com migração e backup.
**Aceite:** [ ] Contraste ≥ 3:1 contra o fundo nos dois temas · [ ] Nome sempre ao lado da cor · [ ] Backup antigo importa sem a cor e recebe uma automática
**Verificação:** testes de migração e de backup; `npm run test:full`
**Dependências:** G1–G6 · **Tamanho:** M

### C6: Motivação (4.8)
**Descrição:** Heatmap de constância no topo de Hoje; sequência com ícone `flame` no cabeçalho fixo; animação discreta ao bater a meta do dia (respeitando `prefers-reduced-motion`).
**Aceite:** [ ] Com `reduce`, nenhuma animação · [ ] Sem emoji
**Dependências:** I2 · **Tamanho:** M

### C7: Redistribuir revisões atrasadas (4.9)
**Descrição:** Botão na Agenda que reparte as atrasadas nos próximos dias, respeitando a disponibilidade e os dias sem estudo. Reaproveita a prévia, a aplicação e a reversão de `src/application/recovery/`.
**Aceite:** [ ] Prévia calculada em memória; nada é salvo antes de "Confirmar" (AGENTS.md:25) · [ ] Desfazer disponível depois de aplicar · [ ] Nenhum dia passa da capacidade
**Verificação:** unit da alocação (dias sem estudo, capacidade cheia, nenhuma atrasada); E2E da prévia
**Dependências:** nenhuma (pode correr em paralelo) · **Tamanho:** M

### C8: Atalhos do PWA (4.10.1)
**Aceite:** [ ] "Iniciar estudo" e "Registrar questões" no manifest abrem a tela certa
**Dependências:** nenhuma · **Tamanho:** XS

### C9: Transições e densidade (4.10.3–4)
**Aceite:** [ ] Transições de 150 a 200 ms desligadas com `reduce` · [ ] Densidade compacta/confortável salva como preferência
**Dependências:** Checkpoint 1 · **Tamanho:** S

### Checkpoint 4
- [ ] Suíte E2E completa e gate visual verdes; demo conferida aba por aba
- [ ] Decidir o padrão do modo Essencial (F10)

---

## Fase 5 — Fluxos, clareza e confiança

### F1: Planejamento em sub-abas
**Aceite:** [ ] Semana · Prova e ritmo · Metas · Fechamento · Histórico, uma de cada vez · [ ] Links profundos (`#metas`, navegação de análise) abrem a sub-aba certa · [ ] Altura em 375 px medida antes e depois
**Tamanho:** M

### F2: Aviso compacto
**Aceite:** [ ] "O cronômetro ainda não começou" ocupa uma linha acima da barra inferior · [ ] Outros usos do mesmo componente conferidos
**Tamanho:** S

### F3: Busca no celular
**Aceite:** [ ] Ícone de lupa abre a paleta de comandos · [ ] Ctrl+K continua funcionando no desktop
**Dependências:** I2 · **Tamanho:** S

### F4: Registrar questões em poucos toques
**Aceite:** [ ] Botões de mais e menos, `inputmode="numeric"`, última disciplina lembrada · [ ] Painel inferior no celular · [ ] Acertos nunca maiores que resolvidas
**Tamanho:** M

### F5: Resultado da sessão
**Aceite:** [ ] Ao salvar, mostra variação da prontidão, revisões agendadas e meta do dia · [ ] Variação calculada sem gravar nada extra
**Tamanho:** M

### F6: Desfazer no lugar de confirmar
**Aceite:** [ ] Lista explícita de quais ações viram desfazer e quais mantêm "Tem certeza?" · [ ] Desfazer restaura o estado exato, inclusive depois do salvamento automático e da rotação de backup
**Verificação:** unit de cada ação reversível
**Tamanho:** M

### F7: Lembrete de backup exportado — PR próprio
**Descrição:** Campo novo `lastExportAt` (o `lastBackupAt` atual é o backup automático dentro do navegador). Indicador "último backup exportado há N dias", em âmbar depois de 7 dias.
**Aceite:** [ ] Quem nunca exportou vê "nenhum backup exportado" · [ ] Migração e backup antigo cobertos
**Verificação:** testes de migração; `npm run test:full`
**Tamanho:** M

### F8: Fatores da prontidão como ações
**Descrição:** Substituir "—/100" por "faltam N de 5 fatores", cada fator clicável. Junta-se à T6 do plano de onboarding.
**Aceite:** [ ] Cada fator leva à ação que o libera · [ ] Com 5 de 5, volta o número
**Tamanho:** S

### F9: Navegação lateral acima de 1280 px
**Aceite:** [ ] Abaixo de 1280 px, nada muda · [ ] Tour e E2E de abas atualizados · [ ] Conteúdo em duas colunas sem rolagem horizontal em 1440 e 1920 px
**Tamanho:** M

### F10: Modo Essencial
**Aceite:** [ ] Preferência com o padrão decidido no Checkpoint 4 · [ ] Cada termo técnico com dica curta · [ ] Análises avançadas a um clique
**Dependências:** C1–C3 · **Tamanho:** M

### F11: Carregamento por aba
**Descrição:** Dividir o `app.bundle.js` e gerar a lista de pedaços no pré-cache do `service-worker.template.js`.
**Aceite:** [ ] App abre offline depois da primeira visita (teste Playwright offline) · [ ] Atualização de versão troca os pedaços sem misturar versões (`pwa.spec.js`) · [ ] Ganho de tamanho inicial medido
**Dependências:** I1 (medição) · **Tamanho:** L — quebrar depois de uma prova de conceito

### Checkpoint 5
- [ ] Suíte E2E completa, gate visual, axe e `npm run test:full` verdes
- [ ] DESIGN.md e DESIGN-SYSTEM.md atualizados com tudo o que mudou
