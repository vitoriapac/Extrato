# Tarefas: question-import

Plano: [tasks/plan-question-import.md](plan-question-import.md) · Spec: [docs/SPEC-question-import.md](../docs/SPEC-question-import.md)

- [x] Tarefa 1: Normalizador — datas válidas, data padrão injetada, delimitador único (R2, R3, R4)
  - Acceptance: `31/02/2026`, `2026-13-01`, `00/01/2026` → `invalid_date`; `29/02/2028` aceito; sem data usa `defaultDate` (sem `new Date()` no domínio); delimitador detectado no cabeçalho (`;` > `,` > tab por frequência, empate → `,`), e só ele separa colunas.
  - Verify: `npm test` (casos novos em `question-import-normalizer.test.js`), `npm run check:types`
  - Files: `src/domain/questions/question-import-normalizer.js`, `tests/unit/question-import-normalizer.test.js`, `src/application/questions/question-import-service.js`, `tests/unit/question-import-service.test.js`, `src/app.js` (antecipado da tarefa 5: `today: todayISO`, senão CSV sem data quebra)

- [x] Tarefa 2: Categorias de erro na taxonomia do app (R1)
  - Acceptance: normalizador recebe `errorCategoryKeys`; `errorBreakdown` tem exatamente essas chaves; tabela da spec mapeada; valor desconhecido → linha importada sem categoria e contagem `unknownErrorCategoryCount`; serviço exige `errorCategoryKeys`; prévia mostra "N linhas com categoria de erro não reconhecida (ignorada)".
  - Verify: `npm test`, `npm run check:types`
  - Files: `src/domain/questions/question-import-normalizer.js`, `src/application/questions/question-import-service.js`, `src/features/question-import/question-import-view-model.js`, `src/features/question-import/question-import-renderer.js`, `tests/unit/question-import-normalizer.test.js`, `tests/unit/question-import-service.test.js`, `src/app.js` (antecipado da tarefa 5: `errorCategoryKeys`, senão o app quebra ao iniciar)

- [x] Tarefa 3: Aviso de disciplinas/tópicos arquivados (R6)
  - Acceptance: `preview` retorna `archivedMatches` (nomes únicos) e `archivedRecordCount` (sem duplicatas, que são ignoradas); prévia mostra "N registros irão para disciplinas/tópicos arquivados: …"; correspondência continua acontecendo.
  - Verify: `npm test` (caso em `question-import-service.test.js`), `npm run check:types`
  - Files: `src/application/questions/question-import-service.js`, `src/features/question-import/question-import-view-model.js`, `src/features/question-import/question-import-renderer.js`, `tests/unit/question-import-service.test.js`

- [x] Tarefa 4: Importação atômica (R5)
  - Acceptance: serviço exige `atomic(fn)` e executa todo o `import` dentro dele; com `questionService.create` lançando na 2ª chamada e `atomic` de snapshot/restore, nenhuma disciplina/tópico/questão nova permanece e o erro é propagado.
  - Verify: `npm test`, `npm run check:types`
  - Files: `src/application/questions/question-import-service.js`, `tests/unit/question-import-service.test.js`, `src/app.js` (antecipado da tarefa 5: `atomic`, senão o serviço não inicia)

- [x] Tarefa 5: Wiring no `app.js` e modelo CSV (R3, R1, R5, R7)
  - Acceptance: `app.js` injeta `today: todayISO`, `errorCategoryKeys: Object.keys(ERROR_CATEGORIES)` e `atomic` (clona `pickPersistentState(state)`, restaura no `catch`, relança); modelo CSV e nome do arquivo exportados de `src/features/question-import/question-import-template.js`, com data de exemplo vinda de `today`; botão `downloadQuestionsCsvBtn` continua funcionando.
  - Verify: `npm test`, `npm run check:types`, `npm run build`
  - Files: `src/app.js`, `src/features/question-import/question-import-template.js`, `tests/unit/question-import-normalizer.test.js` (modelo passa na importação)

- [x] Tarefa 6: Checkpoint final
  - Acceptance: os 4 critérios de sucesso da spec atendidos; inventário de testes atualizado.
  - Verify: `npm test`, `npm run check:types`, `npm run build`, `npm run check:bundle`, `node scripts/audit-test-suite.mjs` e depois `--check`
  - Files: `src/app.bundle.js`, `index.html`, `service-worker.js`, `tests/config/test-inventory.json` (gerados)
