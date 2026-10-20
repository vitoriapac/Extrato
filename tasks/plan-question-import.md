# Plano: question-import

Spec: [docs/SPEC-question-import.md](../docs/SPEC-question-import.md) · Mapa: [docs/CAPABILITY-MAP-review-remediation.md](../docs/CAPABILITY-MAP-review-remediation.md)

## Componentes e dependências

```
normalizer (domínio, puro)  ──►  service (aplicação)  ──►  view-model/renderer (prévia)
        R2 R3 R4 R1                  R1 R5 R6                    avisos R1 R6
                                                     └──►  app.js (wiring: today, errorCategoryKeys, rollback, modelo CSV R7)
```

## Ordem (sequencial — as tarefas compartilham arquivos)

1. **Normalizador: datas e delimitador** (R2, R3, R4) — base pura, sem impacto na interface.
2. **Categorias de erro** (R1) — normalizador recebe `errorCategoryKeys`; serviço repassa; prévia mostra aviso.
3. **Arquivados** (R6) — serviço marca correspondências arquivadas; prévia mostra aviso.
4. **Atomicidade** (R5) — serviço executa `import` dentro de uma dependência `atomic(fn)`; `app.js` fornece `atomic` que clona `pickPersistentState(state)` e restaura no erro.
5. **Wiring e modelo CSV** (R3, R1, R7 no `app.js`) — injeta `today`, `errorCategoryKeys`, `atomic`; move o modelo CSV para `src/features/question-import/`.
6. **Checkpoint final** — build, bundle, tipos, inventário de testes.

## Decisões de implementação

- `defaultDate` passa a ser obrigatório no normalizador quando falta data; o serviço o obtém de `today()` (dependência nova, obrigatória). Sem fallback `new Date()`.
- `errorCategoryKeys` é obrigatório no serviço (lista vinda de `Object.keys(ERROR_CATEGORIES)`), para o domínio nunca ter cópia da taxonomia.
- Rollback via `atomic(fn)` injetado: mantém o serviço testável com repositórios em memória e deixa a mutação de `state` só no `app.js`.
- Sem arquivos de teste novos: os casos entram em `question-import-normalizer.test.js` e `question-import-service.test.js`. Depois, `node scripts/audit-test-suite.mjs` atualiza `staticTestDeclarations` no inventário.

## Riscos

| Risco | Mitigação |
|---|---|
| Testes existentes do normalizador/serviço assumem chaves antigas (`atencao`, `lacuna`…) ou chamam o serviço sem `today` | Atualizar esses testes na mesma tarefa que muda o contrato |
| Detecção de delimitador escolhe errado em cabeçalho com 1 coluna | Empate/zero → `,`; caso de teste com cabeçalho `;` |
| `atomic` do `app.js` não é coberto por teste unitário (vive em `app.js`) | Serviço testado com `atomic` de snapshot/restore real em memória; o de `app.js` tem 3 linhas e segue o padrão já usado em `applyImportedBackup` |
| `src/app.bundle.js` desatualizado | Tarefa 6 roda `npm run build` e `check:bundle` |

## Checkpoints de verificação

- Após cada tarefa: `npm test` e `npm run check:types` verdes.
- Após a tarefa 6: `npm run build`, `npm run check:bundle`, `node scripts/audit-test-suite.mjs --check`, e os 4 critérios de sucesso da spec.
