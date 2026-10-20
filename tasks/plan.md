# Plano: remote-sync

Spec: [docs/SPEC-remote-sync.md](../docs/SPEC-remote-sync.md) · Mapa: [docs/CAPABILITY-MAP-review-remediation.md](../docs/CAPABILITY-MAP-review-remediation.md) · Módulo anterior: [plan-question-import.md](plan-question-import.md)

## Componentes e dependências

```
crypto-utils (PBKDF2, base64)  ──►  remote-sync-provider (WebDAV)  ──►  remote-sync-controller (fluxo e preferências)  ──►  app.js / index.html
        R3, base64 p/ R5               R4 R5 R6, versão do envelope           R1 (confirmação, marcador), R6 na tela            R2, ajuda CORS
```

## Ordem (sequencial — cada camada usa a API da anterior)

1. **crypto-utils:** constante de 600 mil iterações, teto na leitura, exportar o conversor base64 (R3, base de R5).
2. **provider:** recusa de `http://` com credenciais, Basic auth em UTF-8, erro de rede/CORS, `checkRemoteVersion` (lê só o `createdAt` do envelope), `downloadState` devolve o `createdAt`; o `reconcile` por `updatedAt` sai (R4, R5, R6, base de R1).
3. **controller:** push consulta a versão e pede confirmação quando a nuvem mudou; push e pull gravam `lastSync`; "Verificar status" usa a mesma regra (R1).
4. **app.js e index.html:** `getState` com `pickPersistentState`; linha de ajuda sobre CORS (R2, R6).
5. **Checkpoint final:** checagens, inventário, e o critério 1 no navegador contra um WebDAV falso local.

## Decisões de implementação

- **Marcador nas preferências:** `studytrack_remote_sync_config` passa a guardar `{ serverUrl, username, lastSync: { serverUrl, envelopeAt } }`. Se a URL atual for diferente de `lastSync.serverUrl`, não há marcador, e o app pede confirmação. `readRemoteSyncPreferences` precisa preservar `lastSync` ao limpar senhas antigas.
- **`checkRemoteVersion` não decifra:** faz `GET`, tenta `JSON.parse` e lê `createdAt`/`algorithm`. Retorna `{ exists: false }` no 404, `{ exists: true, valid: false }` se não for envelope, ou `{ exists: true, valid: true, createdAt }`.
- **`provider.reconcile` é removido:** a regra antiga (`updatedAt`) é justamente o que não detecta o conflito. O teste "reconciliação compara timestamps…" é **substituído** por testes da regra nova, e não apenas apagado.
- **Mensagem de CORS:** o provider transforma o `TypeError` do `fetch` num erro com a origem (`location.origin`, injetada como `origin`), e o controller só exibe.
- **Teste quebrado de preferências:** ele mora em `remote-sync-controller.test.js`, que a tarefa 3 vai editar. Proposta: corrigir já na tarefa 3 (falta `controller.mount()` no `setup`), em vez de esperar o `build-hygiene`.

## Riscos

| Risco | Mitigação |
|---|---|
| 600 mil iterações deixa push e pull lentos em celular (~0,5–1 s por derivação) | Uma derivação por operação; a checagem de versão não deriva. O status já mostra "Criptografando…". |
| O `createdAt` do envelope é texto aberto e pode ser alterado no servidor | Só decide se a confirmação aparece; a integridade dos dados continua garantida pelo AES-GCM. |
| `GET` extra antes de cada push dobra o tráfego | O arquivo é pequeno (dezenas de KB); aceitável. |
| WebDAV real indisponível para testar | Servidor WebDAV falso em memória, com CORS, no scratchpad, permitido via `http://127.0.0.1` pela exceção de R4. |

## Checkpoints de verificação

- Após cada tarefa: `npm test` e `npm run check:types` verdes.
- Após a tarefa 5: `npm run build`, `npm run check:bundle`, `node scripts/audit-test-suite.mjs --check`, os 5 critérios de sucesso da spec, e o critério 1 também no navegador.
