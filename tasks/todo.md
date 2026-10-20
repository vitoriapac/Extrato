# Tarefas: build-hygiene

Plano: [tasks/plan.md](plan.md) · Spec: [docs/SPEC-build-hygiene.md](../docs/SPEC-build-hygiene.md) · Módulos anteriores: [todo-question-import.md](todo-question-import.md), [todo-remote-sync.md](todo-remote-sync.md)

- [x] Tarefa 1: Regras do `.gitignore` e limpeza do cache (R1, R2, R3)
  - Acceptance: seção "Ferramentas locais de IA e grafo do código" com `src/graphify-out/`, `graphify-out/*`, `!graphify-out/graph.json`, `!graphify-out/GRAPH_REPORT.md`, `/CLAUDE.md`, `.claude/*`, `!.claude/launch.json`; `git check-ignore -v` confirma cada regra; `src/graphify-out/` apagada.
  - Verify: `git check-ignore -v src/graphify-out graphify-out/graph.html graphify-out/cache CLAUDE.md .claude/settings.json .claude/skills .claude/CLAUDE.md` (todos ignorados); `git check-ignore graphify-out/graph.json graphify-out/GRAPH_REPORT.md .claude/launch.json` (nenhum ignorado); `git status --short`
  - Files: `.gitignore`, `src/graphify-out/` (removida)

- [x] Tarefa 2: Commit `chore:` de higiene
  - Acceptance: um commit com `.gitignore`, `.claude/launch.json`, `docs/SPEC-build-hygiene.md` e `tasks/` (com `plan-remote-sync.md` e `todo-remote-sync.md`).
  - Verify: `git show --stat HEAD`
  - Files: `.gitignore`, `.claude/launch.json`, `docs/SPEC-build-hygiene.md`, `tasks/plan.md`, `tasks/todo.md`, `tasks/plan-remote-sync.md`, `tasks/todo-remote-sync.md`

- [x] Tarefa 3: Commit `chore:` do grafo do código (R2) — `056304a`, feito por você no terminal
  - Acceptance: `graphify update .` roda sobre o branch atual; o commit contém só `graphify-out/graph.json` e `graphify-out/GRAPH_REPORT.md`.
  - Verify: `git show --stat HEAD` com exatamente esses 2 arquivos
  - Files: `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`

- [x] Tarefa 4: Commit `docs:` com `docs/recomendacoes-futuras.md` (R4) — `25a00c4`
  - Acceptance: arquivo lido por inteiro antes do commit; nada sensível, ou aviso antes de commitar; commit só com esse arquivo.
  - Verify: `git show --stat HEAD`
  - Files: `docs/recomendacoes-futuras.md`

- [x] Tarefa 5: Checkpoint final — 782/782 testes; `check:types`, `check:bundle`, `test:tiers` e inventário verdes
  - Acceptance: `git status --short` vazio; todas as checagens verdes; `tasks/todo.md` atualizado.
  - Verify: `npm test`, `npm run check:types`, `npm run check:bundle`, `npm run test:tiers`, `node scripts/audit-test-suite.mjs --check`
  - Files: nenhum novo
