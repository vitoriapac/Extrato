# Tarefas: modo-sessao

Plano: [tasks/plan-modo-sessao.md](plan-modo-sessao.md) · Spec: [docs/SPEC-modo-sessao.md](../docs/SPEC-modo-sessao.md)

Pré-requisito: as mudanças não commitadas que já estão na árvore precisam ser commitadas ou guardadas (stash) antes da tarefa 1.

- [x] Tarefa 1: domínio do bookmark e normalização (R1, R2)
  - Acceptance:
    - `normalizeTopicBookmark`, `bookmarkProgress` e `formatBookmarkLabel` seguem a spec: tipos, limites de 120/60 caracteres, `totalUnits < currentUnit` vira `null`, bookmark vazio vira `null` e o resultado é congelado.
    - `normalizeTopicStrategy` mantém um bookmark válido e põe `null` nos tópicos antigos.
    - Um backup antigo carrega sem erro.
  - Verify: `npm test` (`topic-bookmark.test.js`), `npm run check:types`, `npm run test:tiers`
  - Files: `src/domain/topic-bookmark.js`, `src/state/strategic.js`, `tests/unit/topic-bookmark.test.js`, `tests/config/test-tiers.json`

- [x] Tarefa 2: "Onde você parou?" no check-out (R3)
  - Acceptance:
    - A seção aparece só quando há um tópico selecionado e acompanha a troca de tópico no modal.
    - Começa aberta e preenchida quando o tópico já tem bookmark, e fechada quando não tem.
    - Salvar grava `topic.bookmark` só quando os campos mudaram, com `updatedAt = endedAt`, antes do `persistAndRender()`.
    - Campos vazios não apagam; o botão "Limpar ponto de parada" apaga.
    - O caminho guiado se comporta igual.
  - Verify: `npm test`, `npm run check:types`, teste manual no app
  - Files: `index.html`, `src/app.js`, `styles/app.css`

- [x] Tarefa 3: linha "Continuar de:" e e2e do fluxo (R4) — checkpoint do `session-bookmark`
  - Acceptance:
    - O card de próxima ação e o modo foco mostram `Continuar de: {formatBookmarkLabel}` quando o tópico tem bookmark, inclusive depois de recarregar a página.
    - O e2e cobre: concluir com pág. 42/110 faz o card mostrar `PDF · pág. 42 de 110 (38%)`; a próxima conclusão abre com 42 preenchido; esvaziar os campos mantém o bookmark; "Limpar" remove.
  - Verify: `npm test`, `npm run check:types`, `npm run build`, `npm run check:bundle`, `npm run test:tiers`, `npx playwright test tests/e2e/session-bookmark.spec.js`, `npm run test:fast`
  - Files: `src/app.js` e/ou `src/ui/renderers/next-best-action-renderer.js`, `tests/e2e/session-bookmark.spec.js`, `tests/config/test-tiers.json`

- [x] Tarefa 4: título da aba como cronômetro (R5)
  - Acceptance:
    - `formatTimerTitle` produz `▶ 24:15 · Português — StudyTrack`, `⏸ …`, a versão sem disciplina e, sem sessão, o título original.
    - O `app.js` só reescreve o título quando o texto muda e o restaura no `resetTimer`.
  - Verify: `npm test` (`pip-timer-controller.test.js`), `npm run check:types`, `npm run test:tiers`
  - Files: `src/ui/controllers/pip-timer-controller.js`, `src/app.js`, `tests/unit/pip-timer-controller.test.js`, `tests/config/test-tiers.json`

- [x] Tarefa 5: controller da janela flutuante (R6, lógica)
  - Acceptance:
    - Sem suporte: `supported === false`, e `open()` não lança erro.
    - Duas chamadas de `open()` resultam em um único `requestWindow`.
    - Pausar na janela chama `onToggle`; Concluir mostra o aviso, chama `onFinish` e fecha a janela.
    - `pagehide` zera a referência sem chamar `onToggle`.
    - A janela tem um tick próprio, criado no `pipWindow`.
    - `buildTimerMiniView` monta tempo, meta, progresso, etapa e bookmark.
    - `shouldMarkHidden` é falso com a janela aberta.
  - Verify: `npm test`, `npm run check:types`
  - Files: `src/ui/controllers/pip-timer-controller.js`, `tests/unit/pip-timer-controller.test.js`

- [ ] Tarefa 6: janela flutuante ligada ao app (R6, R7)
  - Acceptance:
    - O botão "Janela flutuante" aparece só com suporte.
    - Os estilos e o `data-theme` são copiados.
    - Salvar ou descartar a sessão fecha a janela.
    - O `visibilitychange` usa `shouldMarkHidden`.
    - Verificação manual no Chrome do critério 3 da spec: a janela abre e o tempo anda com outra aba na frente; Pausar sincroniza com a aba principal; fechar no X não muda o tempo; Concluir abre o modal na aba principal.
  - Verify: `npm test`, `npm run check:types`, `npm run build`, verificação manual no Chrome
  - Files: `index.html`, `src/app.js`, `styles/app.css`

- [ ] Tarefa 7: checkpoint final
  - Acceptance: os 5 critérios de sucesso da spec atendidos (o critério 4, no Firefox, é verificado pelo teste de `supported === false` e pelo título).
  - Verify: `npm test`, `npm run check:types`, `npm run build`, `npm run check:bundle`, `npm run test:tiers`, `npm run test:fast`, `node scripts/audit-test-suite.mjs` e depois `--check`
  - Files: arquivos gerados (`src/app.bundle.js`, `index.html`, `service-worker.js`, `tests/config/test-inventory.json`)
