# Lançamento e Consolidação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar a transição de "projeto em construção" para "produto no ar": alinhar documentação e posicionamento ao que está publicado, limpar o repositório, validar o primeiro uso e destravar (ou adiar de forma explícita) a camada SaaS.

**Architecture:** Nenhuma mudança de arquitetura. As tarefas são de higiene (docs, raiz do repositório), decisão de produto (posicionamento, Lote 3), validação (E2E completo, jornada `/` → `/app`) e um gate de segurança antes de ativar pagamento. Tarefas 1 a 4 são independentes de decisão; Tarefa 5 depende da decisão D1.

**Tech Stack:** TypeScript strict, Preact 11, Tailwind 4, esbuild, Playwright, Cloudflare Workers/Assets (`wrangler.jsonc`), Supabase + AbacatePay (ainda não ativados).

**Spec:** `docs/PLANO-TRANSFORMACAO-SAAS.md`, `docs/PLANO-PENDENCIAS-CRITICA.md` (Lote 3), `auditorias/2026-11-06-auditoria-ux/plano-implementacao-consolidado.md`, `PRODUCT.md`.

## Global Constraints

- Idioma de toda a interface e documentação: pt-BR.
- Nome do produto: "Extrato de Estudos — Cada estudo soma". Identificadores internos `StudyTrack` (chaves de armazenamento, nomes de arquivo como `build-studytrack32-view-model.ts`) NÃO são renomeados: quebraria dados salvos de quem já usa.
- Não editar à mão bundles (`src/*.bundle.js`) nem `service-worker.js`; usar `npm run build`.
- Stage somente os arquivos da tarefa (nunca `git add -A`); push direto em `main`.
- Após alterar código: `graphify update .`.
- `cloud-saas-provider.ts` e `entitlements.ts` são reservados para o SaaS: nunca remover.
- Regras de produto de `PRODUCT.md` (prévia antes de salvar, evidência insuficiente declarada) não podem regredir.

## Review Focus

- Usuário com dados antigos em `localStorage` abre `/app` após o deploy: dados intactos (nenhuma chave renomeada).
- `www.extratoestudos.com.br/app` preserva caminho e destino canônico.
- Acesso direto/refresh em `/app` e em `/app/` funciona nas duas formas.
- PWA já instalada atualiza o service worker sem ficar presa em versão antiga.
- Usuário Free no limite (8 disciplinas, 30 flashcards) vê o paywall e não perde dados.

---

## Decisões do usuário (bloqueiam tarefas marcadas)

| ID | Decisão | Opções | Bloqueia |
|---|---|---|---|
| D1 | Posicionamento do SaaS | (a) local-first gratuito agora, SaaS depois; (b) SaaS opcional como extra de nuvem; (c) SaaS como caminho principal | Tarefas 1 e 5 |
| D2 | Lote 3 da crítica: 3.1 atrasadas só na Agenda; 3.2 remover/trocar "Maior ganho" por link para Hoje; 3.3 quais abas ficam no primeiro nível | Confirmar cada proposta | Tarefa 4 |

---

### Task 1: Alinhar documentação ao produto publicado

**Files:**
- Modify: `package.json` (campo `description`)
- Modify: `README.md` (título da seção "Como o StudyTrack funciona", frases "Abrir o StudyTrack" no fluxograma, link de demo)
- Modify: `PRODUCT.md` (item "Local e privado" em Positioning, conforme D1)
- Modify: `docs/O-QUE-FALTA-IMPLEMENTAR.md` (cabeçalho: "StudyTrack" → "Extrato de Estudos")
- Test: `tests/unit/` (rodar suíte; ver Step 3)

**Interfaces:**
- Consumes: decisão D1.
- Produces: texto de posicionamento que a Tarefa 5 reutiliza.

- [ ] **Step 1: Listar ocorrências visíveis ao usuário.** Rodar `graphify query "textos visíveis com StudyTrack"` e depois `grep -rn "StudyTrack" README.md PRODUCT.md docs/*.md index.html landing.html manifest.webmanifest`. Separar em "texto visível" (renomear) e "identificador/arquivo" (manter).
- [ ] **Step 2: Reescrever** `package.json#description` para "Planejamento, revisão e diagnóstico de estudos para concursos." e o item "Local e privado" de `PRODUCT.md` conforme D1 (a: manter; b: "Funciona local e offline; sincronização em nuvem é opcional (Pro)"; c: reescrever o posicionamento inteiro). Ajustar README com a mesma mensagem e trocar o link de demo `vitoriapac.github.io/Extrato` por `https://extratoestudos.com.br`.
- [ ] **Step 3: Verificar.** Run: `npm run test:fast`. Expected: `Resultado: **passou**` (alguns testes de contrato podem ler README/PRODUCT; corrigir só se falharem por texto).
- [ ] **Step 4: Commit.** `git add package.json README.md PRODUCT.md docs/O-QUE-FALTA-IMPLEMENTAR.md` e `git commit -m "docs: alinhar nome e posicionamento ao dominio publicado"`; `git push origin main`.

### Task 2: Limpar a raiz do repositório

**Files:**
- Delete (versionados): `landing-desktop-final.png`, `landing-mobile-final.png`, `test-service-worker-version-a.js`, `design-shots/`
- Modify: `.gitignore` (adicionar `design-shots/`, `.tmp-*/` já coberto por `.tmp-*`)

**Interfaces:**
- Consumes: nada.
- Produces: raiz enxuta.

- [ ] **Step 1: Confirmar que nada referencia os arquivos.** Run: `grep -rn "landing-desktop-final\|landing-mobile-final\|test-service-worker-version-a\|design-shots" --include=*.{js,mjs,ts,tsx,md,json,html} . --exclude-dir=node_modules --exclude-dir=.test-gates --exclude-dir=graphify-out`. Expected: sem referências além de docs históricos (se houver, mover a imagem para `docs/` em vez de apagar).
- [ ] **Step 2: Remover do índice.** `git rm -r design-shots landing-desktop-final.png landing-mobile-final.png test-service-worker-version-a.js`; acrescentar `design-shots/` ao `.gitignore`.
- [ ] **Step 3: Verificar.** Run: `npm run test:fast`. Expected: passou (inclui "Generated artifacts" e "Tier contracts").
- [ ] **Step 4: Commit** apenas esses caminhos + `.gitignore`: `chore: remover capturas e arquivos de teste soltos da raiz`.

### Task 3: Validar de ponta a ponta o que está no ar

**Files:**
- Create: `docs/RELEASE-CHECK-2026-11-07.md` (resultado da validação)
- Test: `tests/e2e/` (suíte existente; sem novos testes salvo falha)

**Interfaces:**
- Consumes: domínio publicado.
- Produces: lista de defeitos encontrados (entrada para correções).

- [ ] **Step 1: Suíte completa.** Run: `npm run test:full`. Expected: `Resultado: passou`. Se falhar, registrar o teste e abrir correção via `superpowers:systematic-debugging` antes de seguir.
- [ ] **Step 2: Rotas em produção.** Run: `curl -sIL https://extratoestudos.com.br/app`, `.../app/`, `https://www.extratoestudos.com.br/app`. Expected: 200 final em todas, `www` preservando `/app`.
- [ ] **Step 3: Jornada real no navegador** (perfil limpo e perfil com dados antigos): `/` → "Abrir aplicativo" → primeiro uso (catálogo, JSON/CSV, manual) → prévia → plano → Hoje; refresh em `/app`; instalar PWA e recarregar offline. Registrar em `docs/RELEASE-CHECK-2026-11-07.md` cada passo com resultado e mobile 390 px / 320 px.
- [ ] **Step 4: Commit** `docs: registrar validacao de release` (só o arquivo novo).

### Task 4: Fechar decisões do Lote 3 e pendências abertas

**Files:**
- Modify: `docs/PLANO-PENDENCIAS-CRITICA.md` (marcar decisão D2 tomada)
- Modify (conforme D2): ordenação/exibição de atrasadas em `src/ui/tabs/agenda/` e `src/ui/tabs/today/`; bloco "Maior ganho" em `src/ui/components/overview-sections.tsx` (`ExecutiveSummaryView`, linha ~73); navegação de abas em `index.html`
- Test: um teste por decisão aplicada, no arquivo de teste da área (`tests/unit/` ou `tests/e2e/`)

**Interfaces:**
- Consumes: D2.
- Produces: Lote 3 resolvido; abas definitivas para a Tarefa 3 repetir se mudarem.

- [ ] **Step 1: Registrar D2** na tabela do Lote 3 de `docs/PLANO-PENDENCIAS-CRITICA.md`.
- [ ] **Step 2: Por decisão aprovada**, escrever primeiro o teste que falha (ex.: 3.1: "Hoje mostra contador de atrasadas com link para Agenda e não lista os itens"), rodar e ver falhar com `node --import ./scripts/ts-resolve-hook.mjs --test tests/unit/<arquivo>.test.js`.
- [ ] **Step 3: Implementar** a mudança mínima em cada arquivo listado; rodar o mesmo teste. Expected: PASS.
- [ ] **Step 4: Rodar** `npm run build` e `npm run test:visual`; inspecionar diffs e atualizar baselines só conforme `docs/VISUAL-TEST-POLICY.md`.
- [ ] **Step 5: Commit** por decisão, apenas arquivos tocados; `graphify update .`.

### Task 5: Gate de segurança e ativação do SaaS (somente se D1 = b ou c)

**Files:**
- Modify: `supabase/functions/abacatepay-webhook/`, `supabase/functions/abacatepay-checkout/`, `supabase/functions/state-sync/` (somente correções do gate)
- Create: `docs/SAAS-ACTIVATION-CHECKLIST.md`
- Test: testes das Edge Functions (criar em `tests/unit/` se não existirem, com `fetch` simulado)

**Interfaces:**
- Consumes: `supabase/migrations/20261105000000_initial_saas_schema.sql`, `src/domain/billing/entitlements.ts`, `src/auth/saas-auth-service.ts`.
- Produces: checklist assinado de ativação; nada de produção ativado sem ela.

- [ ] **Step 1: Revisão de segurança.** Disparar `agent-skills:security-auditor` sobre `supabase/` e `src/auth/`, com foco: webhook valida assinatura do AbacatePay antes de ativar `pro`; checkout não confia em plano enviado pelo cliente; RLS impede ler/escrever estado de outro usuário; `state-sync` valida tamanho e versão. Registrar achados em `docs/SAAS-ACTIVATION-CHECKLIST.md`.
- [ ] **Step 2: Testes que falham** para cada achado crítico (ex.: `webhook rejeita payload sem assinatura valida com 401`), rodar, ver falhar.
- [ ] **Step 3: Corrigir** os achados críticos e altos; rodar os testes. Expected: PASS.
- [ ] **Step 4: Ambiente de teste.** Provisionar Supabase de staging (nome com `staging`), aplicar a migration, fazer deploy das 3 funções e executar: login por magic link, sync entre dois navegadores, pagamento PIX em modo de teste ativando `pro` em até 5 s, usuário Free no limite vendo paywall sem perda de dados. Marcar cada item no checklist. (Ação do usuário: criar projeto e chaves; nunca colar segredos no chat.)
- [ ] **Step 5: Ativação em produção** só após o usuário aprovar o checklist: secrets via painel da Supabase/Cloudflare, nunca no repositório. Commit do checklist e correções.

---

## Self-Review

- **Cobertura da análise:** doc dessincronizada (T1), posicionamento (T1+D1), primeiro acesso/validação real (T3), Lote 3 (T4), raiz suja (T2), segurança/SaaS (T5), itens não verificados (E2E completo, rotas, PWA em T3). Catálogo na nuvem, painel do mentor e Capacitor ficam fora de escopo de propósito (dependem de T5 e de tração).
- **Consistência:** D1 é consumida em T1 e T5; D2 em T4.
- **Limite:** a avaliação com 3 a 5 pessoas reais é conduzida pelo usuário; T3 só prepara o roteiro e testa o técnico.
