# Plano: build-hygiene

Spec: [docs/SPEC-build-hygiene.md](../docs/SPEC-build-hygiene.md) · Mapa: [docs/CAPABILITY-MAP-review-remediation.md](../docs/CAPABILITY-MAP-review-remediation.md) · Módulos anteriores: [plan-question-import.md](plan-question-import.md), [plan-remote-sync.md](plan-remote-sync.md)

## Ordem

1. **Regras do `.gitignore` e limpeza do cache** (R1, R2, R3): uma seção nova para ferramentas locais; apagar `src/graphify-out/` só depois de `git check-ignore` confirmar a regra.
2. **Commit `chore:` de higiene:** `.gitignore`, `.claude/launch.json`, esta spec, o plano e as tarefas (inclusive os arquivos do remote-sync com nome próprio).
3. **Commit `chore:` do grafo** (R2): `graphify update .` para o grafo refletir o código do branch, depois versionar `graph.json` e `GRAPH_REPORT.md`.
4. **Commit `docs:`** (R4): `docs/recomendacoes-futuras.md`, depois de ler o arquivo inteiro.
5. **Checkpoint final:** `git status --short` vazio e todas as checagens verdes.

As tarefas são sequenciais: cada commit parte do anterior, e o grafo da tarefa 3 deve ser gerado depois das mudanças da tarefa 2.

## Decisões de implementação

- **Regras do `.gitignore`**, com negação para os dois arquivos do grafo e para o `launch.json`:
  ```gitignore
  # Ferramentas locais de IA e grafo do código
  src/graphify-out/
  graphify-out/*
  !graphify-out/graph.json
  !graphify-out/GRAPH_REPORT.md
  /CLAUDE.md
  .claude/*
  !.claude/launch.json
  ```
  `graphify-out/*`, e não `graphify-out/`, para que as negações funcionem: o Git não reinclui arquivos dentro de uma pasta ignorada por inteiro.
- **`CLAUDE.md` com barra inicial:** a regra deve ser `/CLAUDE.md`, para valer só na raiz e não ignorar outros `CLAUDE.md` que venham a existir em subpastas.
- **Grafo em commit separado:** isola o diff de ~4 MB do `graph.json`, para que a revisão dos commits de código e de configuração continue legível.

## Riscos

| Risco | Mitigação |
|---|---|
| O `graph.json` (4,3 MB) é reescrito por inteiro a cada `graphify update`, e cada commit que o atualizar carrega ~4 MB | Aceito na decisão R2. O `CLAUDE.md` já registra que esse diff é esperado. Opcional depois: o merge driver do graphify (`graphify hook install`) para conflitos em merges. |
| Ignorar `CLAUDE.md` e `.claude/` esconde mudanças futuras nesses arquivos | É a decisão R3; eles continuam no disco e funcionando localmente. |
| `docs/recomendacoes-futuras.md` pode conter algo que você não queira versionar | Leio o arquivo inteiro antes do commit e aviso se houver algo sensível. |

## Checkpoints de verificação

- Após a tarefa 1: `git check-ignore -v` para cada caminho e `git status --short` mostrando só o que vai ser versionado.
- Após a tarefa 5: `git status --short` vazio; `npm test`, `npm run check:types`, `npm run check:bundle`, `npm run test:tiers` e `node scripts/audit-test-suite.mjs --check` verdes.
