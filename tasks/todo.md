# Tarefas: remote-sync

Plano: [tasks/plan.md](plan.md) · Spec: [docs/SPEC-remote-sync.md](../docs/SPEC-remote-sync.md) · Módulo anterior: [todo-question-import.md](todo-question-import.md)

- [x] Tarefa 1: crypto-utils — 600 mil iterações, teto na leitura, base64 exportado (R3)
  - Acceptance: `PBKDF2_ITERATIONS = 600000` usado por `encryptPayload` e no envelope; `decryptPayload` recusa `iterations` fora de [100000, 2000000] antes de derivar, com "Envelope com parâmetros de criptografia fora do permitido."; envelope de 100000 decifra; `bytesToBase64` exportado.
  - Verify: `npm test` (casos novos em `crypto-utils.test.js`), `npm run check:types`
  - Files: `src/core/crypto-utils.js`, `tests/unit/crypto-utils.test.js`

- [x] Tarefa 2: provider — https, Basic UTF-8, erro de CORS, versão do envelope (R4, R5, R6, base de R1)
  - Acceptance: `http://` com usuário/senha recusado sem `fetch` (exceto localhost/127.0.0.1); cabeçalho Basic a partir de UTF-8 (`ção€` funciona); `TypeError` do `fetch` vira a mensagem de CORS com `origin`; `checkRemoteVersion` retorna `{exists:false}` / `{exists:true, valid:false}` / `{exists:true, valid:true, createdAt}` sem decifrar; `uploadState` e `downloadState` devolvem `envelopeAt` (substitui `uploadedAt`/`downloadedAt`, sem uso); `reconcile` removido e seu teste substituído.
  - Verify: `npm test`, `npm run check:types`
  - Files: `src/storage/remote-sync-provider.js`, `tests/unit/remote-sync-provider.test.js`

- [x] Tarefa 3: controller — confirmação antes do push e marcador de sincronização (R1)
  - Acceptance: push segue a tabela de R1 (404 e versão igual enviam direto; versão diferente, sem marcador ou envelope inválido pedem `confirm`; erro na consulta não envia); push e pull bem-sucedidos gravam `lastSync`; `readRemoteSyncPreferences` preserva `lastSync`; "Verificar status" informa se a nuvem mudou; teste de preferências corrigido (`mount()` no `setup`).
  - Verify: `npm test` (agora sem falhas), `npm run check:types`
  - Files: `src/ui/controllers/remote-sync-controller.js`, `tests/unit/remote-sync-controller.test.js`

- [x] Tarefa 4: app.js e index.html — estado persistente e ajuda sobre CORS (R2, R6)
  - Acceptance: `getState: () => pickPersistentState(state)`; provider recebe `origin: location.origin`; o modal traz uma linha sobre CORS; `applyImportedBackup` retorna `false` quando falha (o controller só grava o marcador do pull se a aplicação não falhar).
  - Verify: `npm test`, `npm run check:types`, `npm run build`
  - Files: `src/app.js`, `index.html`

- [x] Tarefa 5: Checkpoint final (desbloqueada com R7: CSP `connect-src 'self' https: http://localhost:* http://127.0.0.1:*`, teste em `remote-sync-provider.test.js`, motivo em `SECURITY-AUDIT.md`)
  - Acceptance: os 5 critérios de sucesso da spec atendidos; o critério 1 verificado no navegador contra um WebDAV falso local; os dados do navegador embutido restaurados ao fim.
  - Verify: `npm test`, `npm run check:types`, `npm run build`, `npm run check:bundle`, `node scripts/audit-test-suite.mjs` e depois `--check`
  - Files: arquivos gerados (`src/app.bundle.js`, `index.html`, `service-worker.js`, `tests/config/test-inventory.json`); o servidor falso fica no scratchpad, fora do repositório
