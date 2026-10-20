# Spec: build-hygiene

Módulo do [mapa de correções](CAPABILITY-MAP-review-remediation.md). Fecha os achados #2 e #9 da revisão.

## O que já foi resolvido em outros módulos
- **#2, teste quebrado:** `preferências: salva apenas URL e usuário…` foi corrigido em `remote-sync` (faltava `controller.mount()` no `setup`).
- **#2, bundle desatualizado:** regenerado; `npm run check:bundle` passa.
- **#9, mudanças misturadas:** separadas em 5 commits no branch `feat/question-import-and-webdav-sync` (ignorados, tipagem, importação de questões, sincronização WebDAV, artefatos de build).

## Objetivo
Deixar o working tree limpo: tudo que é do projeto versionado, tudo que é ferramenta local ou cache ignorado, sem arquivo "sobrando" a cada `git status`. Hoje restam 5 itens não rastreados, sem decisão.

## Situação atual

| Item | O que é | Tamanho |
|---|---|---|
| `src/graphify-out/` | Cache AST do graphify gerado dentro de `src/` por engano (achado #9) | 66 KB |
| `graphify-out/` | Grafo do código: `graph.json` (4,3 MB), `graph.html` (4,3 MB), snapshot datado `2026-10-20/` (3,2 MB), `cache/`, `manifest.json`, `cost.json`, `GRAPH_REPORT.md` | 13 MB |
| `CLAUDE.md`, `.claude/CLAUDE.md` | Instruções de projeto para o Claude Code, centradas no graphify | — |
| `.claude/settings.json`, `.claude/skills/graphify/` | Hooks que executam `graphify hook-guard` antes de buscas e leituras, e a skill do graphify | — |
| `.claude/launch.json` | Configuração `serve` (porta 4173) para abrir o app no navegador embutido, criada nesta sessão | — |
| `docs/recomendacoes-futuras.md` | Documento de recomendações escrito por você, fora deste trabalho | — |

## Requisitos

### R1 — Cache do graphify nunca entra no Git
`.gitignore` ignora `src/graphify-out/` e qualquer `graphify-out/cache/`. A pasta `src/graphify-out/` é apagada (é só cache, recriável).

### R2 — `graphify-out/` (precisa de decisão, ver pergunta 1)
Proposta: **ignorar a pasta inteira**. São 13 MB, e o `graph.json` é reescrito por inteiro a cada `graphify update`, então cada commit carregaria ~4 MB de diff. Num projeto de uma pessoa, o grafo serve só a quem roda o graphify localmente.

### R3 — Configuração do Claude Code (precisa de decisão, ver pergunta 2)
Proposta:
- **Versionar** `.claude/launch.json`: só sobe o `npm run serve` e não depende de nada instalado.
- **Ignorar** `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/settings.json` e `.claude/skills/`. Os hooks chamam o comando `graphify`, então quem clonar o repositório sem o graphify instalado veria erro em cada busca ou leitura. E as instruções só fazem sentido com o grafo local de R2.

### R4 — `docs/recomendacoes-futuras.md` (precisa de decisão, ver pergunta 3)
É conteúdo seu; não é decisão de higiene. Opções: versionar num commit `docs:` próprio, ou deixar fora.

### R5 — Commits intermediários (precisa de decisão, ver pergunta 4)
Hoje só o último commit do branch passa em `check:bundle` e `test:tiers`, porque bundle, inventário e tiers estão concentrados no commit de build. Proposta: **manter assim**. É o padrão "artefatos no fim", e todos os commits já passam nos testes unitários. Reescrever o histórico (o branch ainda não foi enviado ao remoto) só vale se você usa `git bisect` com `check:bundle`.

## Fora de escopo
Merge do branch em `main`, push e PR (decisão sua depois deste módulo); reduzir `style-src-attr 'unsafe-inline'` (pendência já registrada em `SECURITY-AUDIT.md`); mudar como o graphify funciona.

## Comandos
```
git status --short
npm test
npm run check:types
npm run check:bundle
npm run test:tiers
node scripts/audit-test-suite.mjs --check
```

## Estrutura afetada
```
.gitignore                    → novas entradas (R1, R2, R3)
src/graphify-out/             → apagada (R1)
.claude/launch.json           → versionada (R3)
docs/SPEC-build-hygiene.md    → esta spec
tasks/                        → plano e tarefas do módulo
```

## Estilo
Entradas do `.gitignore` agrupadas com um comentário de seção, no mesmo formato das seções atuais (`# Arquivos temporarios e logs`):

```gitignore
# Ferramentas locais de IA e grafo do código
graphify-out/
src/graphify-out/
```

## Testes
Não há código novo. A verificação é feita por comando:
- `git check-ignore -v` confirma que cada caminho ignorado bate na regra esperada;
- `git status --short` fica vazio, ou só com o que você decidir deixar pendente;
- as checagens da seção Comandos passam.

## Limites
- Sempre: confirmar com `git check-ignore` antes de apagar qualquer coisa; nenhum arquivo seu é apagado (só o cache de R1).
- Perguntar antes: apagar `graphify-out/`, reescrever commits, fazer merge, push ou PR.
- Nunca: commitar `graph.json` sem decisão explícita; ignorar arquivos que já estão rastreados.

## Critérios de sucesso
1. `git status --short` vazio, ou só com o que você decidir deixar pendente.
2. `git check-ignore` confirma `src/graphify-out/` e as demais regras decididas.
3. `npm test`, `check:types`, `check:bundle`, `test:tiers` e o inventário de testes passam.
4. O resultado vira um commit `chore:` no mesmo branch.

## Decisões (aprovadas em 2026-10-20)
1. **R2:** versionar `graphify-out/graph.json` e `graphify-out/GRAPH_REPORT.md`; ignorar o resto de `graphify-out/` (`cache/`, `graph.html`, snapshots datados, `manifest.json`, `cost.json`). O grafo é regenerado com `graphify update .` logo antes do commit, para refletir o código do branch. Diffs grandes do `graph.json` em PRs são esperados (regra do `CLAUDE.md`).
2. **R3:** versionar só `.claude/launch.json`; ignorar `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/settings.json` e `.claude/skills/`.
3. **R4:** versionar `docs/recomendacoes-futuras.md` num commit `docs:` próprio.
4. **R5:** manter os commits como estão.
